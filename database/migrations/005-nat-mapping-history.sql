-- NAT mapping history: point-in-time public IP / port for BTK logs (survives MikroTik / panel changes)

CREATE TABLE IF NOT EXISTS `nat_mapping_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` INT NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `framedipaddress` VARCHAR(15) DEFAULT NULL,
  `nasipaddress` VARCHAR(15) DEFAULT NULL,
  `port` VARCHAR(30) DEFAULT NULL,
  `valid_from` DATETIME(6) NOT NULL,
  `valid_to` DATETIME(6) DEFAULT NULL,
  `change_source` VARCHAR(32) NOT NULL DEFAULT 'unknown',
  PRIMARY KEY (`id`),
  KEY `idx_nat_hist_user` (`tenant_id`, `username`, `valid_from`),
  KEY `idx_nat_hist_valid_to` (`valid_to`),
  KEY `idx_nat_hist_valid_from` (`valid_from`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed current radippool rows as open history (valid_from = row creation proxy)
INSERT INTO `nat_mapping_history` (`tenant_id`, `username`, `framedipaddress`, `nasipaddress`, `port`, `valid_from`, `valid_to`, `change_source`)
SELECT
  r.`tenant_id`,
  r.`username`,
  r.`framedipaddress`,
  r.`nasipaddress`,
  r.`port`,
  COALESCE(r.`expiry_time`, '2020-01-01 00:00:00'),
  NULL,
  'migration_seed'
FROM `radippool` r
WHERE r.`username` IS NOT NULL
  AND (r.`nasipaddress` IS NOT NULL OR r.`port` IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM `nat_mapping_history` h
    WHERE h.`tenant_id` = r.`tenant_id`
      AND h.`username` = r.`username`
      AND h.`valid_to` IS NULL
  );

ALTER TABLE `btk_log_exports`
  ADD COLUMN `nat_fallback_count` INT NOT NULL DEFAULT 0 AFTER `clock_drift_ms`,
  ADD COLUMN `nat_changes_in_hour` INT NOT NULL DEFAULT 0 AFTER `nat_fallback_count`,
  ADD COLUMN `nat_resolution` VARCHAR(32) NOT NULL DEFAULT 'session_start_history' AFTER `nat_changes_in_hour`;
