#!/usr/bin/env node
/**
 * Sync metroIP notes/lan_ip/user from operations reference list.
 * Usage: node src/scripts/sync-metroip-notes-from-list.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const MetroIP = require('../models/MetroIP');

const REFERENCE_ROWS = [
  // 195.87.80.160/27 — Teknopark
  { wan: '195.87.80.161', nas: 'Teknopark', kullanici: 'TRTEK ISINEM', lan: '192.168.200.245' },
  { wan: '195.87.80.162', nas: 'Teknopark', kullanici: 'Mail Sunucusu', lan: '192.168.200.212' },
  { wan: '195.87.80.163', nas: 'Teknopark', kullanici: 'NOKTASAL NAS', lan: '192.168.9.218, 192.168.210.182' },
  { wan: '195.87.80.164', nas: 'Teknopark', kullanici: 'TRTEK CENTOS WEB', lan: '192.168.210.182' },
  { wan: '195.87.80.165', nas: 'Teknopark', kullanici: 'TEKNOPARK SANTRAL', lan: '192.168.9.139' },
  { wan: '195.87.80.166', nas: 'Teknopark', kullanici: 'HAProxy', lan: '192.168.9.175' },
  { wan: '195.87.80.167', nas: 'Teknopark', kullanici: 'TRTEK DEMODATA', lan: '192.168.200.242' },
  { wan: '195.87.80.168', nas: 'Teknopark', kullanici: 'TRTEK POSTGR', lan: '192.168.9.157' },
  { wan: '195.87.80.169', nas: 'Teknopark', kullanici: 'Kardelen kazakistan', lan: '192.168.200.207' },
  { wan: '195.87.80.170', nas: 'Teknopark', kullanici: 'Fatih Noktasal', lan: '192.168.210.161' },
  { wan: '195.87.80.171', nas: 'Teknopark', kullanici: 'Cagdas Docker', lan: '192.168.9.137' },
  { wan: '195.87.80.172', nas: 'Teknopark', kullanici: 'TRTEK BBB', lan: '192.168.9.189' },
  { wan: '195.87.80.173', nas: 'Teknopark', kullanici: 'TRTEK AD', lan: '192.168.9.150' },
  { wan: '195.87.80.174', nas: 'Teknopark', kullanici: 'ANKARA DIS (TRTEK)', lan: '192.168.9.110' },
  { wan: '195.87.80.175', nas: 'Teknopark', kullanici: 'TRTEK FTP', lan: '192.168.9.156' },
  { wan: '195.87.80.176', nas: 'Teknopark', kullanici: 'Bi Sunucusu Teknopark', lan: '192.168.9.127' },
  { wan: '195.87.80.177', nas: 'Teknopark', kullanici: 'IOT', lan: '192.168.9.141' },
  { wan: '195.87.80.178', nas: 'Teknopark', kullanici: 'Trtek Bulut', lan: '192.168.9.6' },
  { wan: '195.87.80.179', nas: 'Teknopark', kullanici: 'Spark GPU', lan: '192.168.100.128' },
  { wan: '195.87.80.180', nas: 'Teknopark', kullanici: 'Alpay', lan: '192.168.11.111' },
  { wan: '195.87.80.181', nas: 'Teknopark', kullanici: 'Tales - Trtek', lan: '192.168.200.223' },
  { wan: '195.87.80.182', nas: 'Teknopark', kullanici: '', lan: '' },
  { wan: '195.87.80.183', nas: 'Teknopark', kullanici: 'Tekno - Tales', lan: '192.168.9.8' },
  { wan: '195.87.80.184', nas: 'Teknopark', kullanici: 'Fortigate Teknopark', lan: '192.168.9.158' },
  { wan: '195.87.80.185', nas: 'Teknopark', kullanici: '', lan: '' },
  { wan: '195.87.80.186', nas: 'Teknopark', kullanici: 'nacsoft@teknopark ek', lan: '' },
  { wan: '195.87.80.187', nas: 'Teknopark', kullanici: 'mdsmotor@teknopar', lan: '' },
  { wan: '195.87.80.188', nas: 'Teknopark', kullanici: 'nacsoft@teknopark', lan: '' },
  { wan: '195.87.80.189', nas: 'Teknopark', kullanici: '', lan: '' },
  // 212.98.241.128/27 — Teknopark
  { wan: '212.98.241.129', nas: 'Teknopark', kullanici: 'SkudoLB', lan: '' },
  { wan: '212.98.241.130', nas: 'Teknopark', kullanici: 'arneste@teknopark', lan: '' },
  { wan: '212.98.241.131', nas: 'Teknopark', kullanici: 'GENEL NAT', lan: 'IIS' },
  { wan: '212.98.241.132', nas: 'Teknopark', kullanici: 'trtek@teknopark', lan: '' },
  { wan: '212.98.241.133', nas: 'Teknopark', kullanici: 'caretta@teknopar', lan: '' },
  { wan: '212.98.241.134', nas: 'Teknopark', kullanici: 'bimser@teknopark', lan: '' },
  { wan: '212.98.241.135', nas: 'Teknopark', kullanici: 'viya@teknopark', lan: '' },
  { wan: '212.98.241.136', nas: 'Teknopark', kullanici: 'teknoarge@teknopark', lan: '' },
  { wan: '212.98.241.137', nas: 'Teknopark', kullanici: 'genetek@teknopark', lan: '' },
  { wan: '212.98.241.138', nas: 'Teknopark', kullanici: 'noktasal@teknopark', lan: '' },
  { wan: '212.98.241.139', nas: 'Teknopark', kullanici: 'mediatayf@teknopark', lan: '' },
  { wan: '212.98.241.140', nas: 'Teknopark', kullanici: 'kentkart@teknopark', lan: '' },
  { wan: '212.98.241.141', nas: 'Teknopark', kullanici: 'maviay@teknopark', lan: '' },
  { wan: '212.98.241.142', nas: 'Teknopark', kullanici: 'elektrosoft@teknopark', lan: '' },
  { wan: '212.98.241.143', nas: 'Teknopark', kullanici: 'akademedya@teknopark', lan: '' },
  { wan: '212.98.241.144', nas: 'Teknopark', kullanici: 'e2das@teknopark', lan: '' },
  { wan: '212.98.241.145', nas: 'Teknopark', kullanici: 'romeda@teknopark', lan: '' },
  { wan: '212.98.241.146', nas: 'Teknopark', kullanici: 'diginova@teknopark', lan: '' },
  { wan: '212.98.241.147', nas: 'Teknopark', kullanici: 'algoritma@teknopark', lan: '' },
  { wan: '212.98.241.148', nas: 'Teknopark', kullanici: 'btyon@teknopark', lan: '' },
  { wan: '212.98.241.149', nas: 'Teknopark', kullanici: 'genetek@teknopark', lan: '' },
  { wan: '212.98.241.150', nas: 'Teknopark', kullanici: 'argelabs@teknopark', lan: '' },
  { wan: '212.98.241.151', nas: 'Teknopark', kullanici: 'valeuble@teknopark', lan: '' },
  { wan: '212.98.241.152', nas: 'Teknopark', kullanici: 'nacsoft@teknopark', lan: '' },
  { wan: '212.98.241.153', nas: 'Teknopark', kullanici: '', lan: '' },
  { wan: '212.98.241.154', nas: 'Teknopark', kullanici: 'ferofen@teknopark', lan: '' },
  { wan: '212.98.241.155', nas: 'Teknopark', kullanici: 'saysis@teknopark', lan: '' },
  { wan: '212.98.241.156', nas: 'Teknopark', kullanici: 'ILKER BEY', lan: '192.168.11.100' },
  { wan: '212.98.241.157', nas: 'Teknopark', kullanici: 'ipera@teknopark', lan: '' },
  { wan: '212.98.241.158', nas: 'Teknopark', kullanici: 'TEKNOPAR APP', lan: '192.168.9.119' },
  // 31.145.124.96/27 — YeniBina
  { wan: '31.145.124.97', nas: 'YeniBina', kullanici: 'evstek@teknopar', lan: '' },
  { wan: '31.145.124.98', nas: 'YeniBina', kullanici: 'rmira@teknopark', lan: '' },
  { wan: '31.145.124.99', nas: 'YeniBina', kullanici: 'uzmar@teknopark', lan: '' },
  { wan: '31.145.124.100', nas: 'YeniBina', kullanici: 'aksoy@teknopark', lan: '' },
  { wan: '31.145.124.101', nas: 'YeniBina', kullanici: 'haratres@teknopark', lan: '' },
  { wan: '31.145.124.102', nas: 'YeniBina', kullanici: 'vtcyenibina1@teknopark', lan: '' },
  { wan: '31.145.124.103', nas: 'YeniBina', kullanici: 'yena@teknopark', lan: '' },
  { wan: '31.145.124.104', nas: 'YeniBina', kullanici: 'blut@teknopark', lan: '' },
  { wan: '31.145.124.105', nas: 'YeniBina', kullanici: 'adenyum@teknopark', lan: '' },
  { wan: '31.145.124.106', nas: 'YeniBina', kullanici: 'etmgrup@teknopark', lan: '' },
  { wan: '31.145.124.107', nas: 'YeniBina', kullanici: 'birfen@teknopark', lan: '' },
  { wan: '31.145.124.108', nas: 'YeniBina', kullanici: 'onatus@teknopark', lan: '' },
  { wan: '31.145.124.109', nas: 'YeniBina', kullanici: 'GENEL NAT', lan: 'IIS' },
  { wan: '31.145.124.110', nas: 'YeniBina', kullanici: 'ersan@teknopark', lan: '' },
  { wan: '31.145.124.111', nas: 'YeniBina', kullanici: 'enterprise@teknopark', lan: '' },
  { wan: '31.145.124.112', nas: 'YeniBina', kullanici: 'hktm@teknoprak', lan: '' },
  { wan: '31.145.124.113', nas: 'YeniBina', kullanici: 'IPERA', lan: '192.168.230.3' },
  { wan: '31.145.124.114', nas: 'YeniBina', kullanici: 'IPERA', lan: '192.168.230.4' },
  { wan: '31.145.124.115', nas: 'YeniBina', kullanici: 'IPERA', lan: '192.168.230.5' },
  { wan: '31.145.124.116', nas: 'YeniBina', kullanici: 'IPERA', lan: '192.168.230.6' },
  { wan: '31.145.124.117', nas: 'YeniBina', kullanici: 'genetek@teknopark', lan: '' },
  { wan: '31.145.124.118', nas: 'YeniBina', kullanici: 'genetek@teknopark', lan: '' },
  { wan: '31.145.124.119', nas: 'YeniBina', kullanici: 'genetek@teknopark', lan: '' },
  { wan: '31.145.124.120', nas: 'YeniBina', kullanici: 'Tekno Arge', lan: '', notes: 'Reserved block / customer via interface' },
  { wan: '31.145.124.121', nas: 'YeniBina', kullanici: '', lan: '' },
  { wan: '31.145.124.122', nas: 'YeniBina', kullanici: '', lan: '' },
  { wan: '31.145.124.123', nas: 'YeniBina', kullanici: '', lan: '' },
  { wan: '31.145.124.124', nas: 'YeniBina', kullanici: '', lan: '' },
  { wan: '31.145.124.125', nas: 'YeniBina', kullanici: '', lan: '' },
  { wan: '31.145.124.126', nas: 'YeniBina', kullanici: '', lan: '' },
  // 212.15.1.160/27
  { wan: '212.15.1.160', nas: 'Teknopark', kullanici: 'K7', lan: '', notes: 'Block 212.15.1.160/27' }
];

function isIpLike(value) {
  return /^\d{1,3}(\.\d{1,3}){3}/.test(String(value || '').trim());
}

function parseKullanici(kullanici) {
  const raw = String(kullanici || '').trim();
  if (!raw) {
    return { user: null, notes: null };
  }

  const emailMatch = raw.match(/^(\S+@\S+)(?:\s+(.+))?$/i);
  if (emailMatch) {
    return {
      user: emailMatch[1],
      notes: emailMatch[2] ? emailMatch[2].trim() : null
    };
  }

  return { user: null, notes: raw };
}

function buildRecord(row) {
  const kullaniciRaw = String(row.kullanici || '').trim();
  const lanRaw = String(row.lan || '').trim();
  const noteParts = [];

  if (row.notes) {
    noteParts.push(row.notes);
  }

  let user = null;
  if (kullaniciRaw === 'GENEL NAT') {
    noteParts.push('GENEL NAT');
  } else {
    const parsed = parseKullanici(kullaniciRaw);
    user = parsed.user;
    if (parsed.notes) {
      noteParts.push(parsed.notes);
    } else if (!parsed.user && kullaniciRaw) {
      noteParts.push(kullaniciRaw);
    }
  }

  let lanIp = null;
  if (lanRaw) {
    if (isIpLike(lanRaw)) {
      lanIp = lanRaw.replace(/\s+/g, '');
    } else {
      noteParts.push(`Service: ${lanRaw}`);
    }
  }

  const uniqueNotes = [...new Set(noteParts.filter(Boolean))];

  return {
    user,
    lan_ip: lanIp,
    notes: uniqueNotes.length > 0 ? uniqueNotes.join('; ') : null,
    nasname: row.nas
  };
}

async function ensureColumns() {
  const [cols] = await sequelize.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'metroIP'
  `);
  const existing = new Set(cols.map((c) => c.COLUMN_NAME));

  if (!existing.has('notes')) {
    await sequelize.query(`ALTER TABLE metroIP ADD COLUMN notes VARCHAR(500) NULL`);
    console.log('Added column: notes');
  }
  if (!existing.has('lan_ip')) {
    await sequelize.query(`ALTER TABLE metroIP ADD COLUMN lan_ip VARCHAR(100) NULL`);
    console.log('Added column: lan_ip');
  }
}

async function main() {
  await sequelize.authenticate();
  await ensureColumns();

  const summary = { updated: 0, created: 0, missing: [] };

  for (const row of REFERENCE_ROWS) {
    const wan = row.wan.trim();
    const payload = buildRecord(row);

    let metroIp = await MetroIP.findOne({
      where: { ipaddress: wan }
    });

    if (!metroIp) {
      metroIp = await MetroIP.findOne({
        where: { ipaddress: `${wan}/32` }
      });
    }

    if (!metroIp) {
      summary.missing.push(wan);
      await MetroIP.create({
        nasname: payload.nasname,
        ipaddress: wan,
        ip_type: 0,
        tenant_id: 1,
        user: payload.user,
        lan_ip: payload.lan_ip,
        notes: payload.notes
      });
      summary.created += 1;
      console.log(`CREATED ${wan} | notes=${payload.notes || '-'}`);
      continue;
    }

    await metroIp.update({
      nasname: payload.nasname || metroIp.nasname,
      user: payload.user !== null ? payload.user : metroIp.user,
      lan_ip: payload.lan_ip,
      notes: payload.notes
    });
    summary.updated += 1;
    console.log(`UPDATED ${wan} | user=${payload.user || '-'} | lan=${payload.lan_ip || '-'} | notes=${payload.notes || '-'}`);
  }

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
