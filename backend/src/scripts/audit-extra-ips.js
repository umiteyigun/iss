#!/usr/bin/env node
/*
  Audit script: Detect primary (Framed-IP-Address) and extra routed IPs per user.
  - Primary IP source: Radreply (attribute = 'Framed-IP-Address')
  - Default router: latest Radacct.nasipaddress matched to NasDevice.nasname
  - Mikrotik routes: /ip/route/print (filter by gateway = primary IP OR comment contains username)
  - MetroIP cross-check: mark assigned extra IPs (ip_type = 2, user = username)
  Output: JSON report to stdout
*/

require('dotenv').config();

const { Op, literal } = require('sequelize');
const {
  sequelize,
  Radreply,
  Radcheck,
  Radacct,
  MetroIP,
  NasDevice,
  Tenant
} = require('../models');

const MikrotikService = require('../services/MikrotikService');

async function getAllUsersWithPrimaryIp() {
  const rows = await Radreply.findAll({
    where: { attribute: 'Framed-IP-Address' },
    attributes: ['username', 'value'],
    order: [['id', 'ASC']]
  });
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.username)) {
      // Try to fetch tenant from radcheck password row if present
      let tenantId = null;
      try {
        const rc = await Radcheck.findOne({
          where: { username: r.username, attribute: 'Cleartext-Password' },
          attributes: ['tenant_id']
        });
        tenantId = rc?.tenant_id ?? null;
      } catch (_) {}

      map.set(r.username, {
        username: r.username,
        primaryIp: r.value,
        tenantId
      });
    }
  }
  return Array.from(map.values());
}

async function getLatestNasForUser(username) {
  // Pick latest by COALESCE(acctstoptime, acctstarttime) DESC then radacctid DESC
  const row = await Radacct.findOne({
    where: { username },
    attributes: ['nasipaddress'],
    order: [[literal('COALESCE(acctstoptime, acctstarttime)'), 'DESC'], ['radacctid', 'DESC']]
  });
  return row?.nasipaddress || null;
}

async function findRouterByNasIp(nasIp) {
  if (!nasIp) return null;
  const router = await NasDevice.findOne({ where: { nasname: nasIp } });
  return router || null;
}

function normalizeDstAddress(ip) {
  // Ensure single host IPs have /32
  if (!ip) return ip;
  if (ip.includes('/')) return ip;
  return `${ip}/32`;
}

function ipFromCidr(value) {
  if (!value) return '';
  const s = String(value);
  const idx = s.indexOf('/');
  return idx >= 0 ? s.slice(0, idx) : s;
}

function isPrivateIp(ip) {
  // Accept IPv4 only for this audit
  const m = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.exec(ip);
  if (!m) return false;
  const parts = ip.split('.').map(n => parseInt(n, 10));
  const [a,b] = parts;
  // RFC1918
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  // Link-local, loopback, carrier-grade NAT
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10
  return false;
}

function ipListFromRoutes(routes, username, primaryIp) {
  const out = [];
  for (const r of routes) {
    const dst = r['dstAddress'] || r['dst-address'] || r.dstAddress || r['dst-address'] || r.dstaddress;
    const gw = r.gateway || '';
    const comment = r.comment || '';
    const matchByGw = primaryIp && gw === primaryIp;
    const matchByComment = username && comment && comment.includes(username);
    if (dst && (matchByGw || matchByComment)) {
      const norm = normalizeDstAddress(String(dst));
      const ip = ipFromCidr(norm);
      // keep only public destinations
      if (!isPrivateIp(ip)) {
        out.push({ dst: norm, gateway: String(gw || ''), comment: String(comment || '') });
      }
    }
  }
  return out;
}

async function getMetroAssignedExtras(username) {
  const rows = await MetroIP.findAll({
    where: {
      user: username,
      ip_type: 2
    },
    attributes: ['ipaddress', 'tenant_id', 'user', 'ip_type']
  });
  return rows
    .map(r => ({ ip: r.ipaddress, tenant_id: r.tenant_id, user: r.user, ip_type: r.ip_type }))
    .filter(x => !isPrivateIp(ipFromCidr(normalizeDstAddress(x.ip))));
}

function compareSets(mikrotikDsts, metroAssigned) {
  const mtSet = new Set(mikrotikDsts.map(x => x.dst));
  const miSet = new Set(metroAssigned.map(x => normalizeDstAddress(x.ip)));

  // Missing on Mikrotik: present in MetroIP but not in Mikrotik
  const missingOnMikrotik = [];
  for (const mi of metroAssigned) {
    const ipNorm = normalizeDstAddress(mi.ip);
    if (!mtSet.has(ipNorm)) missingOnMikrotik.push(ipNorm);
  }

  // Orphan on Mikrotik: present in Mikrotik but not in MetroIP
  const orphanOnMikrotik = [];
  for (const mt of mikrotikDsts) {
    if (!miSet.has(mt.dst)) orphanOnMikrotik.push(mt.dst);
  }

  return { missingOnMikrotik, orphanOnMikrotik };
}

async function auditUser(user, routerCache) {
  const { username, primaryIp, tenantId } = user;

  // Determine default router by latest session
  const latestNasIp = await getLatestNasForUser(username);
  let router = null;
  if (latestNasIp) {
    if (routerCache.has(latestNasIp)) router = routerCache.get(latestNasIp);
    else {
      router = await findRouterByNasIp(latestNasIp);
      routerCache.set(latestNasIp, router);
    }
  }

  let routesOnMikrotik = [];
  let routerInfo = null;

  if (router && router.ruser && router.naspassword) {
    try {
      const resp = await MikrotikService.getRoutes(router.nasname, router.ruser, router.naspassword);
      if (resp && resp.success) {
        const filtered = ipListFromRoutes(resp.data.routes || [], username, primaryIp);
        routesOnMikrotik = filtered.map(x => ({ ...x, dst: normalizeDstAddress(x.dst) }));
      }
      routerInfo = { id: router.id, nasname: router.nasname, shortname: router.shortname || null };
    } catch (e) {
      routerInfo = { id: router.id, nasname: router.nasname, error: e.message };
    }
  }

  const metroipAssigned = await getMetroAssignedExtras(username);
  const cmp = compareSets(routesOnMikrotik, metroipAssigned);

  return {
    username,
    tenant_id: tenantId,
    primaryIp,
    defaultRouter: routerInfo,
    routesOnMikrotik,
    metroipAssigned,
    missingOnMikrotik: cmp.missingOnMikrotik,
    orphanOnMikrotik: cmp.orphanOnMikrotik
  };
}

async function main() {
  const start = Date.now();
  try {
    const apply = process.argv.includes('--apply') || process.env.APPLY === '1';
    await sequelize.authenticate();
    const users = await getAllUsersWithPrimaryIp();

    const routerCache = new Map();
    const results = [];

    for (const user of users) {
      // Skip if primaryIp empty
      if (!user.primaryIp) continue;
      const report = await auditUser(user, routerCache);
      results.push(report);
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      elapsedMs: Date.now() - start,
      totalUsers: results.length,
      totals: {
        missingOnMikrotik: results.reduce((a, r) => a + r.missingOnMikrotik.length, 0),
        orphanOnMikrotik: results.reduce((a, r) => a + r.orphanOnMikrotik.length, 0)
      }
    };

    // Optional apply: upsert orphan public IPs into MetroIP for each user
    if (apply) {
      let created = 0;
      let updated = 0;
      for (const r of results) {
        for (const dst of r.orphanOnMikrotik) {
          const ipOnly = ipFromCidr(dst);
          try {
            const existing = await MetroIP.findOne({ where: { ipaddress: ipOnly } });
            if (!existing) {
              await MetroIP.create({
                ipaddress: ipOnly,
                user: r.username,
                tenant_id: r.tenant_id ?? 1,
                ip_type: 2
              });
              created++;
            } else {
              // Update assignment if not already assigned to same user/type
              const fieldsToUpdate = {};
              if (existing.user !== r.username) fieldsToUpdate.user = r.username;
              if (existing.tenant_id !== (r.tenant_id ?? existing.tenant_id)) fieldsToUpdate.tenant_id = r.tenant_id ?? existing.tenant_id;
              if (existing.ip_type !== 2) fieldsToUpdate.ip_type = 2;
              if (Object.keys(fieldsToUpdate).length > 0) {
                await existing.update(fieldsToUpdate);
                updated++;
              }
            }
          } catch (e) {
            console.error('MetroIP upsert error for', ipOnly, e.message);
          }
        }
      }
      summary.apply = { created, updated };
    }

    const output = { summary, results };
    // Print to stdout
    console.log(JSON.stringify(output, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Audit error:', err);
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch (e) {}
  }
}

main();


