#!/usr/bin/env node
/**
 * Compare user IP list (WAN -> LAN) with router NAT rules and apply missing dst-nat.
 * Dry-run by default: node sync-nat-from-list.js
 * Apply: node sync-nat-from-list.js --apply
 */

const MikrotikService = require('../services/MikrotikService');

const ROUTERS = [
  { id: 1, name: 'Teknopark', host: '172.16.16.1', user: 'admin', pass: 'As081316+a' },
  { id: 2, name: 'YeniBina', host: '172.16.20.1', user: 'admin', pass: 'As081316' }
];

// User-provided list: WAN -> LAN (only rows with explicit LAN)
const USER_NAT_LIST = [
  { wan: '195.87.80.161', label: 'TRTEK ISINEM', lan: '192.168.200.245', router: 'Teknopark' },
  { wan: '195.87.80.162', label: 'Mail Sunucusu', lan: '192.168.200.212', router: 'Teknopark' },
  { wan: '195.87.80.163', label: 'NOKTASAL NAS', lan: '192.168.9.218', router: 'Teknopark' },
  { wan: '195.87.80.164', label: 'TRTEK CENTOS WEB', lan: '192.168.210.182', router: 'Teknopark' },
  { wan: '195.87.80.165', label: 'TEKNOPARK SANTRAL', lan: '192.168.9.139', router: 'Teknopark' },
  { wan: '195.87.80.166', label: 'HAProxy', lan: '192.168.9.175', router: 'Teknopark' },
  { wan: '195.87.80.167', label: 'TRTEK DEMODATA', lan: '192.168.200.242', router: 'Teknopark' },
  { wan: '195.87.80.168', label: 'TRTEK POSTGR', lan: '192.168.9.157', router: 'Teknopark' },
  { wan: '195.87.80.169', label: 'Kardelen kazakistan', lan: '192.168.200.207', router: 'Teknopark' },
  { wan: '195.87.80.170', label: 'Fatih Noktasal', lan: '192.168.210.161', router: 'Teknopark' },
  { wan: '195.87.80.171', label: 'Cagdas Docker', lan: '192.168.9.137', router: 'Teknopark' },
  { wan: '195.87.80.172', label: 'TRTEK BBB', lan: '192.168.9.189', router: 'Teknopark' },
  { wan: '195.87.80.173', label: 'TRTEK AD', lan: '192.168.9.150', router: 'Teknopark' },
  { wan: '195.87.80.174', label: 'ANKARA DIS (TRTEK)', lan: '192.168.9.110', router: 'Teknopark' },
  { wan: '195.87.80.175', label: 'TRTEK FTP', lan: '192.168.9.156', router: 'Teknopark' },
  { wan: '195.87.80.176', label: 'Bi Sunucusu Teknopark', lan: '192.168.9.127', router: 'Teknopark' },
  { wan: '195.87.80.177', label: 'IOT', lan: '192.168.9.141', router: 'Teknopark' },
  { wan: '195.87.80.178', label: 'Trtek Bulut', lan: '192.168.9.6', router: 'Teknopark' },
  { wan: '195.87.80.179', label: 'Spark GPU', lan: '192.168.100.128', router: 'Teknopark' },
  { wan: '195.87.80.180', label: 'Alpay', lan: '192.168.11.111', router: 'Teknopark' },
  { wan: '195.87.80.181', label: 'Tales - Trtek', lan: '192.168.200.223', router: 'Teknopark' },
  { wan: '195.87.80.183', label: 'Tekno - Tales', lan: '192.168.9.8', router: 'Teknopark' },
  { wan: '195.87.80.184', label: 'Fortigate Teknopark', lan: '192.168.9.158', router: 'Teknopark' },
  { wan: '212.98.241.156', label: 'ILKER BEY', lan: '192.168.11.100', router: 'Teknopark' },
  { wan: '212.98.241.158', label: 'TEKNOPAR APP', lan: '192.168.9.119', router: 'Teknopark' },
  { wan: '31.145.124.113', label: 'IPERA', lan: '192.168.230.3', router: 'YeniBina' },
  { wan: '31.145.124.114', label: 'IPERA', lan: '192.168.230.4', router: 'YeniBina' },
  { wan: '31.145.124.115', label: 'IPERA', lan: '192.168.230.5', router: 'YeniBina' },
  { wan: '31.145.124.116', label: 'IPERA', lan: '192.168.230.6', router: 'YeniBina' }
];

const applyMode = process.argv.includes('--apply');

function normalizeIp(value) {
  return String(value || '').split('/')[0].trim();
}

function getRuleField(rule, ...keys) {
  for (const key of keys) {
    if (rule[key] !== undefined && rule[key] !== null && rule[key] !== '' && rule[key] !== 'N/A') {
      return rule[key];
    }
  }
  return '';
}

function ruleMatchesDstNat(rule, wan, lan) {
  const dst = normalizeIp(getRuleField(rule, 'dst-address', 'dstAddress'));
  const toAddr = normalizeIp(getRuleField(rule, 'to-addresses', 'toAddresses'));
  const action = String(rule.action || '').toLowerCase();
  const chain = String(rule.chain || '').toLowerCase();
  return chain === 'dstnat' && action === 'dst-nat' && dst === wan && toAddr === lan;
}

async function fetchRouterNat(router) {
  const result = await MikrotikService.getNatRules(router.host, router.user, router.pass);
  if (!result?.success) {
    throw new Error(`${router.name}: ${result?.message || result?.error || 'NAT fetch failed'}`);
  }
  return result.data?.rules || result.data?.nat_rules || [];
}

async function main() {
  const report = {
    routers: {},
    summary: {
      listTotal: USER_NAT_LIST.length,
      alreadyOk: 0,
      missing: 0,
      wrongTarget: 0,
      applied: 0,
      failed: 0
    },
    missing: [],
    wrongTarget: [],
    applied: [],
    errors: []
  };

  for (const router of ROUTERS) {
    console.log(`\n=== ${router.name} (${router.host}) ===`);
    let rules = [];
    try {
      rules = await fetchRouterNat(router);
      console.log(`NAT rules on router: ${rules.length}`);
    } catch (err) {
      console.error(`Failed: ${err.message}`);
      report.errors.push({ router: router.name, error: err.message });
      continue;
    }

    report.routers[router.name] = { totalNatRules: rules.length };

    const items = USER_NAT_LIST.filter(item => item.router === router.name);
    for (const item of items) {
      const wan = normalizeIp(item.wan);
      const lan = normalizeIp(item.lan);
      const matching = rules.filter(r => ruleMatchesDstNat(r, wan, lan));
      const partialDst = rules.filter(r => {
        const dst = normalizeIp(getRuleField(r, 'dst-address', 'dstAddress'));
        const action = String(r.action || '').toLowerCase();
        const chain = String(r.chain || '').toLowerCase();
        return chain === 'dstnat' && action === 'dst-nat' && dst === wan;
      });

      if (matching.length > 0) {
        report.summary.alreadyOk += 1;
        console.log(`OK   ${wan} -> ${lan} (${item.label})`);
        continue;
      }

      if (partialDst.length > 0) {
        const targets = [...new Set(partialDst.map(r => normalizeIp(getRuleField(r, 'to-addresses', 'toAddresses'))).filter(Boolean))];
        report.summary.wrongTarget += 1;
        report.wrongTarget.push({ ...item, wan, lan, existingTargets: targets });
        console.log(`DIFF ${wan} -> expected ${lan}, router has: ${targets.join(', ') || 'n/a'}`);
        continue;
      }

      report.summary.missing += 1;
      report.missing.push({ ...item, wan, lan });
      console.log(`MISS ${wan} -> ${lan} (${item.label})`);

      if (applyMode) {
        const comment = `iss-sync list=${item.label} metro-ip=${wan} nat-local=${lan}`;
        const natRule = {
          chain: 'dstnat',
          action: 'dst-nat',
          'dst-address': wan,
          'to-addresses': lan,
          comment
        };

        const addResult = await MikrotikService.addNatRuleTop(
          { nasname: router.host, ruser: router.user, naspassword: router.pass },
          natRule
        );

        if (addResult?.success) {
          report.summary.applied += 1;
          report.applied.push({ ...item, wan, lan, ruleId: addResult.id || null });
          console.log(`ADDED ${wan} -> ${lan}`);
        } else {
          report.summary.failed += 1;
          report.errors.push({ router: router.name, item, error: addResult?.message || 'add failed' });
          console.log(`FAIL ${wan} -> ${lan}: ${addResult?.message}`);
        }
      }
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(report.summary, null, 2));

  if (!applyMode && report.summary.missing > 0) {
    console.log('\nDry-run only. Re-run with --apply to write missing NAT rules.');
  }

  const fs = require('fs');
  const outPath = '/tmp/nat-sync-report.json';
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
