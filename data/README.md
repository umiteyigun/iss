# Kalıcı veri (bind mount)

| Dizin | İçerik | Container yolu |
|-------|--------|----------------|
| `./data/mysql/` | MySQL 8 veritabanı (RADIUS, BTK export kayıtları, kullanıcılar…) | `/var/lib/mysql` |
| `./data/redis/` | Redis persistence (oturum / cache) | `/data` |
| `./data/btk-logs/` | Saatlik imzalı NAT IPDR ZIP / log dosyaları | `/data/btk-logs` |

Bu projede **named Docker volume yok**. `docker compose down` / `down -v` host’taki `data/` dizinlerini silmez.

## Yedek

```bash
# BTK arşivi
tar czf btk-logs-backup-$(date +%F).tar.gz -C /root/iss/data btk-logs

# MySQL (servis çalışırken mantıksal yedek — önerilen)
docker exec radius_mysql mysqldump -uroot -p'ŞİFRE' --single-transaction radius \
  | gzip > mysql-radius-$(date +%F).sql.gz

# MySQL (servis kapalıyken dosya kopyası)
tar czf mysql-datadir-$(date +%F).tar.gz -C /root/iss/data mysql
```

## Eski Docker volume’lar (bir kerelik temizlik)

Taşıma sonrası doğrulayıp silebilirsiniz (yedek aldıktan sonra):

```bash
docker volume rm iss_mysql_data iss_redis_data iss_btk_logs_data 2>/dev/null || true
```
