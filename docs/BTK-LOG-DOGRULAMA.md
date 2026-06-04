# BTK NAT IPDR log doğrulama

Saatlik üretim: Docker servisi `btk-cron` (`radius_btk_cron`) — `docker compose up` ile otomatik başlar; her saat **:05**'te önceki saat export edilir.

Dosyalar host’ta **`/root/iss/data/btk-logs/`** (bind mount). `docker compose down -v` BTK ZIP’lerini silmez; yedek için `data/README.md`. **Oturum olmasa bile** boş (0 satır) imzalı log üretilir (`record_count=0`, manifest/sig içinde `empty_hour=true`).

Kod değişince: `docker compose build btk-cron && docker compose up -d btk-cron`

Panelden **Manuel doğrulama (PDF)** indirilebilir: `frontend/src/assets/docs/BTK-Log-Manuel-Dogrulama.pdf`  
PDF yeniden üretmek için: `cd backend && npm run generate:btk-verify-pdf` (DejaVu font gerekir; Docker’da `apk add font-dejavu`).

---

ZIP içinde üç dosya vardır:

| Dosya | Açıklama |
|-------|----------|
| `*_NAT_IPDR_*.log` | BTK pipe formatında kayıtlar |
| `*_NAT_IPDR_*.log.sig` | SHA-256 özeti + HMAC imza + metadata |
| `*_NAT_IPDR_*.log.manifest.json` | Okunabilir özet (doğrulama için zorunlu değil) |

## Teslim modeli (operatör yükümlülüğü)

- **Her saat** imzalı dosya teslim edilir; oturum olsa da olmasa da arşiv üretilir.
- Log, **export anındaki** RADIUS oturumları + o andaki `radippool` (NAT) bilgisidir — “değişiklik bildirimi” değil, **elimizde olan verinin** saatlik kaydı.
- Manifest / `.sig`: `delivery_policy=mandatory_hourly`, `data_basis=export_time_snapshot`.

## Ne kontrol edilir?

1. **SHA-256** — Log dosyasının hash’i, `.sig` içindeki `content_sha256=` ile aynı mı? (dosya bozulmuş/değiştirilmiş mi)
2. **HMAC-SHA256** — Log içeriği, operatörün **imza anahtarı** (`LOG_SIGNING_SECRET`) ile imzalanmış mı? `.sig` içindeki `signature=` ile karşılaştırılır.

İkisi de OK ise dosya **operatör tarafından üretilmiş ve sonradan değiştirilmemiş** kabul edilir.

> **NOT — Operatörden `LOG_SIGNING_SECRET` isteyin:** ZIP içinde bu anahtar yoktur. BTK / denetçi, HMAC doğrulaması için ISS operatöründen **`LOG_SIGNING_SECRET`** adıyla imza anahtarını ayrı ve güvenli kanaldan **talep etmelidir**. Anahtar olmadan yalnızca SHA-256 (bütünlük) kontrol edilir.

## 1) Panel (sizin taraf)

1. **BTK NAT Logları** sayfasına girin.
2. İlgili satırda **Doğrula** — sunucudaki dosyalarla SHA + HMAC kontrol edilir; **OK** / **Hatalı** görünür.

API: `GET /api/btk-logs/{id}/verify` (JWT gerekir).

## 2) ZIP’i alan kişi — komut satırı

ZIP’i açın, ardından:

```bash
export LOG_SIGNING_SECRET='operatörün_verdiği_gizli_anahtar'

# Docker backend içinden
docker exec -e LOG_SIGNING_SECRET radius_backend \
  node /app/scripts/verify-btk-log.js \
  /data/btk-logs/2/2026-06-03/KOU_TEKNOPARK_NAT_IPDR_20260603070000_1.log

# veya sunucuda / kendi PC’de (Node 18+)
cd iss/backend
LOG_SIGNING_SECRET='...' node scripts/verify-btk-log.js ./KOU_TEKNOPARK_NAT_IPDR_....log
```

Çıkış kodu: `0` = geçerli, `1` = geçersiz.

## 3) Manuel (openssl + shell)

`.sig` dosyasından `content_sha256` ve `signature` değerlerini okuyun.

```bash
LOG=KOU_TEKNOPARK_NAT_IPDR_....log
SIG=KOU_TEKNOPARK_NAT_IPDR_....log.sig
SECRET='...'

# SHA-256
openssl dgst -sha256 "$LOG" | awk '{print $2}'
grep '^content_sha256=' "$SIG"

# HMAC (base64)
openssl dgst -sha256 -hmac "$SECRET" -binary "$LOG" | base64 -w0
grep '^signature=' "$SIG"
```

İki çift de birebir eşleşmeli.

## İmza anahtarı yönetimi

- Üretimde `docker-compose.yml` → `LOG_SIGNING_SECRET` (`.env` ile).
- Anahtar değişirse **eski loglar eski anahtarla** doğrulanır; anahtar değişimini kayıt altına alın.
- BTK’ya dosya verirken anahtarı **ayrı güvenli kanal** ile iletmek yaygın uygulamadır (HMAC operatör modeli).
