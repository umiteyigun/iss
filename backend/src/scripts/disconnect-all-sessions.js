#!/usr/bin/env node
/**
 * Disconnect all active PPP sessions on every NAS (MikroTik /ppp/active/remove).
 * Usage: node src/scripts/disconnect-all-sessions.js [--dry-run]
 */
require('dotenv').config();
const { sequelize, NasDevice } = require('../models');
const MikrotikService = require('../services/MikrotikService');

const dryRun = process.argv.includes('--dry-run');

async function disconnectOnRouter(host, user, password, label) {
  let api = null;
  const removed = [];
  const errors = [];

  try {
    api = await MikrotikService.connectToDevice(host, user, password);
    const sessions = await api.write('/ppp/active/print');
    const list = Array.isArray(sessions) ? sessions : [];

    console.log(`\n[${label}] ${host} — ${list.length} active session(s)`);

    for (const session of list) {
      const id = session['.id'];
      const name = session.name || session.user || '(unknown)';
      if (!id) {
        errors.push({ name, error: 'missing .id' });
        continue;
      }
      if (dryRun) {
        console.log(`  DRY-RUN would remove: ${name} (${id})`);
        removed.push(name);
        continue;
      }
      try {
        await api.write('/ppp/active/remove', [`=.id=${id}`]);
        console.log(`  removed: ${name}`);
        removed.push(name);
      } catch (err) {
        console.error(`  FAIL ${name}: ${err.message}`);
        errors.push({ name, error: err.message });
      }
    }

    return { host, label, total: list.length, removed: removed.length, errors };
  } catch (err) {
    console.error(`[${label}] ${host} connection failed: ${err.message}`);
    return { host, label, total: 0, removed: 0, errors: [{ error: err.message }] };
  } finally {
    if (api) {
      try {
        await api.close();
      } catch (_) {
        /* ignore */
      }
    }
  }
}

async function main() {
  await sequelize.authenticate();

  const nasRows = await NasDevice.findAll({
    where: { status: 'active' }
  });

  const targets = new Map();
  for (const nas of nasRows) {
    const host = (nas.server || nas.nasname || '').trim();
    const user = nas.ruser || 'admin';
    const pass = nas.naspassword || nas.secret;
    if (!host || !pass) continue;
    targets.set(host, { host, user, pass, label: nas.shortname || nas.nasname });
  }

  // Active accounting may reference other NAS IPs (e.g. 192.168.9.1)
  const [extraNas] = await sequelize.query(`
    SELECT DISTINCT nasipaddress AS ip
    FROM radacct
    WHERE acctstoptime IS NULL AND nasipaddress IS NOT NULL AND nasipaddress != ''
  `);
  const teknopark = nasRows.find((n) => (n.shortname || n.nasname) === 'Teknopark') || nasRows[0];
  for (const row of extraNas) {
    const ip = row.ip;
    if (!ip || targets.has(ip)) continue;
    if (teknopark && teknopark.naspassword) {
      targets.set(ip, {
        host: ip,
        user: teknopark.ruser || 'admin',
        pass: teknopark.naspassword || teknopark.secret,
        label: `extra-${ip}`
      });
    }
  }

  if (targets.size === 0) {
    console.error('No NAS targets found.');
    process.exit(1);
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== DISCONNECT ALL PPP SESSIONS ===');

  const results = [];
  for (const t of targets.values()) {
    results.push(await disconnectOnRouter(t.host, t.user, t.pass, t.label));
  }

  const totalRemoved = results.reduce((s, r) => s + r.removed, 0);
  const totalSeen = results.reduce((s, r) => s + r.total, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

  console.log('\n=== Summary ===');
  console.log(`Routers: ${results.length}`);
  console.log(`Sessions seen: ${totalSeen}`);
  console.log(`Disconnected: ${totalRemoved}`);
  console.log(`Errors: ${totalErrors}`);

  await sequelize.close();
  process.exit(totalErrors > 0 && totalRemoved === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
