#!/usr/bin/env node
/**
 * Offline BTK NAT IPDR log verification (no DB / no panel).
 *
 * Usage:
 *   LOG_SIGNING_SECRET='...' node scripts/verify-btk-log.js ./export.log
 *   LOG_SIGNING_SECRET='...' node scripts/verify-btk-log.js ./export.log ./export.log.sig
 *
 * Exit 0 = valid, 1 = invalid, 2 = usage/error
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function usage() {
  console.error(`Usage: LOG_SIGNING_SECRET='...' node ${path.basename(__filename)} <file.log> [file.log.sig]`);
  process.exit(2);
}

function parseSigFile(sigPath) {
  const text = fs.readFileSync(sigPath, 'utf8');
  const meta = {};
  for (const line of text.split('\n')) {
    const i = line.indexOf('=');
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return meta;
}

function main() {
  const logPath = process.argv[2];
  if (!logPath) usage();

  const sigPath = process.argv[3] || `${logPath}.sig`;
  const secret = process.env.LOG_SIGNING_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.error('LOG_SIGNING_SECRET (veya JWT_SECRET) ortam değişkeni gerekli.');
    process.exit(2);
  }
  if (!fs.existsSync(logPath)) {
    console.error(`Log dosyası bulunamadı: ${logPath}`);
    process.exit(2);
  }
  if (!fs.existsSync(sigPath)) {
    console.error(`İmza dosyası bulunamadı: ${sigPath}`);
    process.exit(2);
  }

  const content = fs.readFileSync(logPath);
  const meta = parseSigFile(sigPath);

  const computedSha = crypto.createHash('sha256').update(content).digest('hex');
  const expectedSha = meta.content_sha256 || '';
  const shaOk = computedSha === expectedSha;

  const expectedHmac = crypto.createHmac('sha256', secret).update(content).digest('base64');
  const sigB64 = meta.signature || '';
  const hmacOk = expectedHmac === sigB64;

  console.log('--- BTK log doğrulama ---');
  console.log(`Log:     ${logPath}`);
  console.log(`İmza:    ${sigPath}`);
  if (meta.tenant_name) console.log(`Tenant:  ${meta.tenant_name}`);
  if (meta.hour_start) console.log(`Saat:    ${meta.hour_start} → ${meta.hour_end || '?'}`);
  if (meta.signed_at) console.log(`İmzalanma: ${meta.signed_at}`);
  if (meta.record_count) console.log(`Kayıt:   ${meta.record_count}`);
  console.log('');
  console.log(`SHA-256 eşleşmesi:  ${shaOk ? 'OK' : 'HATALI'}`);
  if (!shaOk) {
    console.log(`  .sig içindeki: ${expectedSha}`);
    console.log(`  hesaplanan:    ${computedSha}`);
  }
  console.log(`HMAC-SHA256 imza:   ${hmacOk ? 'OK' : 'HATALI'}`);
  if (!hmacOk && !sigB64) {
    console.log('  .sig dosyasında signature= satırı yok.');
  } else if (!hmacOk) {
    console.log('  İmza uyuşmuyor — LOG_SIGNING_SECRET yanlış veya dosya değiştirilmiş.');
  }
  console.log('');
  const valid = shaOk && hmacOk;
  console.log(valid ? 'SONUÇ: GEÇERLİ' : 'SONUÇ: GEÇERSİZ');
  process.exit(valid ? 0 : 1);
}

main();
