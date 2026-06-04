#!/usr/bin/env node
/**
 * Generates BTK manual verification guide PDF for frontend assets.
 * Run: node scripts/generate-btk-verify-pdf.js
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const FONT_CANDIDATES = [
  '/usr/share/fonts/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  path.join(__dirname, '../../docs/fonts/DejaVuSans.ttf')
];

const OUT =
  process.env.BTK_VERIFY_PDF_OUT ||
  path.join(__dirname, '../public/btk/BTK-Log-Manuel-Dogrulama.pdf');

function resolveFont() {
  for (const p of FONT_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function section(doc, title) {
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor('#1a5276').text(title, { underline: true });
  doc.moveDown(0.35);
  doc.fillColor('#000000').fontSize(10);
}

function bullet(doc, text) {
  doc.text(`• ${text}`, { indent: 12, lineGap: 3 });
}

function codeBlock(doc, text) {
  doc.moveDown(0.2);
  doc.fontSize(8.5).fillColor('#333333');
  doc.text(text, {
    indent: 8,
    lineGap: 2,
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 16
  });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.3);
}

function main() {
  const font = resolveFont();
  const outDir = path.dirname(OUT);
  fs.mkdirSync(outDir, { recursive: true });

  const doc = new PDFDocument({ size: 'A4', margin: 50, info: {
    Title: 'BTK NAT IPDR Log Manuel Doğrulama',
    Author: 'ISS RADIUS',
    Subject: 'BTK log doğrulama rehberi'
  }});

  const stream = fs.createWriteStream(OUT);
  doc.pipe(stream);

  if (font) {
    doc.font(font);
  }

  doc.fontSize(16).fillColor('#1a5276').text('BTK NAT IPDR Log — Manuel Doğrulama Rehberi', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#555555').text('ISS RADIUS · HMAC-SHA256 imzalı saatlik NAT IPDR arşivi', { align: 'center' });
  doc.fillColor('#000000');
  doc.moveDown(1);

  section(doc, 'Teslim modeli');
  bullet(doc, 'Operatör her saat imzalı NAT IPDR dosyasını teslim eder (oturum olsa da olmasa da).');
  bullet(doc, 'Dosya, teslim anındaki sistem kayıtlarını yansıtır; ayrıca “değişiklik bildirimi” yapılmaz.');
  doc.moveDown(0.3);

  section(doc, 'NOT — Operatörden LOG_SIGNING_SECRET isteyin');
  doc.fontSize(10).fillColor('#000000');
  bullet(doc, 'ZIP içinde LOG_SIGNING_SECRET YOKTUR. Bu değer log dosyasıyla birlikte gönderilmez.');
  bullet(doc, 'HMAC imza doğrulaması için BTK / denetçi, ISS operatöründen aşağıdaki isimle anahtar talep etmelidir: LOG_SIGNING_SECRET');
  bullet(doc, 'Talep örneği: «…NAT IPDR ZIP dosyası için LOG_SIGNING_SECRET imza anahtarını güvenli kanaldan iletir misiniz? Dosya: …_NAT_IPDR_….log / saat aralığı: …»');
  bullet(doc, 'Operatör LOG_SIGNING_SECRET değerini (.env / sunucu yapılandırması) ayrı ve güvenli kanaldan verir; e-posta gövdesine yazılmamalıdır.');
  bullet(doc, 'Anahtar operatörde sabittir; sistem otomatik değiştirmez. Değiştirildiyse hangi dönemde hangi LOG_SIGNING_SECRET geçerli olduğu yazılı istenmelidir.');
  bullet(doc, 'LOG_SIGNING_SECRET olmadan yalnızca SHA-256 (bütünlük) kontrolü yapılır; HMAC imza doğrulanamaz.');
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor('#922b21').text(
    'ZORUNLU: Doğrulama yapacak kurum, ZIP ve bu PDF alındıktan sonra operatöre başvurup LOG_SIGNING_SECRET değerini açıkça istemelidir.',
    { lineGap: 4 }
  );
  doc.fillColor('#000000').fontSize(10);

  section(doc, '1. ZIP içeriği');
  bullet(doc, '*.log — BTK pipe formatında NAT IPDR kayıtları');
  bullet(doc, '*.log.sig — SHA-256 özeti, HMAC imza ve metadata (tenant, saat, kayıt sayısı)');
  bullet(doc, '*.log.manifest.json — Okunabilir özet (doğrulama için zorunlu değil)');

  section(doc, '2. Doğrulama adımları (özet)');
  bullet(doc, 'ZIP dosyasını açın.');
  bullet(doc, 'Log dosyasının SHA-256 hash\'ini hesaplayın; .sig içindeki content_sha256= ile karşılaştırın.');
  bullet(doc, 'Aynı log içeriği için HMAC-SHA256 imzasını operatör imza anahtarı (LOG_SIGNING_SECRET) ile hesaplayın; .sig içindeki signature= (Base64) ile karşılaştırın.');
  bullet(doc, 'Her iki kontrol de eşleşiyorsa dosya bozulmamış ve operatör imzası geçerlidir.');

  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#555555').text(
    'HMAC simetriktir: doğrulama için operatörün verdiği anahtar ile imza yeniden hesaplanır (yukarıdaki NOT bölümüne bakın).',
    { lineGap: 3 }
  );
  doc.fillColor('#000000').fontSize(10);

  section(doc, '3. Node.js ile doğrulama (önerilen)');
  codeBlock(doc, `export LOG_SIGNING_SECRET='operatörün_verdiği_gizli_anahtar'

node verify-btk-log.js ./DOSYA_NAT_IPDR_....log

# Çıkış kodu: 0 = geçerli, 1 = geçersiz
# .sig dosyası aynı klasörde ve adı DOSYA....log.sig ise otomatik bulunur.`);

  doc.text('verify-btk-log.js scripti ISS backend paketinde scripts/ klasöründedir. Docker ortamında:', { lineGap: 3 });
  codeBlock(doc, `docker exec -e LOG_SIGNING_SECRET='...' radius_backend \\
  node /app/scripts/verify-btk-log.js /data/btk-logs/.../DOSYA.log`);

  section(doc, '4. OpenSSL ile manuel doğrulama');
  codeBlock(doc, `LOG=DOSYA_NAT_IPDR_....log
SIG=DOSYA_NAT_IPDR_....log.sig
SECRET='imza_anahtari'

# SHA-256
openssl dgst -sha256 "$LOG"
grep '^content_sha256=' "$SIG"

# HMAC-SHA256 (Base64)
openssl dgst -sha256 -hmac "$SECRET" -binary "$LOG" | base64 -w0
grep '^signature=' "$SIG"`);

  section(doc, '5. .sig dosyası örnek alanlar');
  codeBlock(doc, `algorithm=HMAC-SHA256
signed_at=2026-06-03T10:24:52+03:00
tenant_name=...
hour_start=...
hour_end=...
record_count=65
content_sha256=<hex>
signature=<base64>`);

  section(doc, '6. Teslim süreci (operatör)');
  bullet(doc, 'BTK / denetçiye ZIP + bu PDF rehberini iletin; ZIP içinde LOG_SIGNING_SECRET bulunmaz.');
  bullet(doc, 'Karşı taraf «LOG_SIGNING_SECRET» talep ettiğinde bu isimdeki imza anahtarını güvenli kanaldan verin.');
  bullet(doc, 'Talep gelmeden LOG_SIGNING_SECRET göndermeyin; talepte dosya adı / saat aralığı belirtilmelidir.');
  bullet(doc, 'LOG_SIGNING_SECRET değiştirildiyse eski arşivler eski anahtarla doğrulanır; değişim kaydı tutun.');

  section(doc, '7. Operatör paneli (iç kontrol)');
  bullet(doc, 'ISS panel → BTK NAT Logları → ilgili satır → Doğrula (SHA + HMAC).');
  bullet(doc, 'ZIP indir: log + sig + manifest tek arşivde.');

  doc.moveDown(1.2);
  doc.fontSize(8).fillColor('#777777').text(
    `Belge sürümü: 1.2 · Üretim: ${new Date().toISOString().slice(0, 10)}`,
    { align: 'center' }
  );

  doc.end();

  stream.on('finish', () => {
    console.log(`PDF yazıldı: ${OUT}`);
    console.log(`Boyut: ${fs.statSync(OUT).size} bytes`);
  });
}

main();
