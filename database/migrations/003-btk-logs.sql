-- BTK NAT IPDR hourly exports (tenant-based)
USE radius;

CREATE TABLE IF NOT EXISTS `tenant_btk_settings` (
  `tenant_id` INT NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `operator_code` VARCHAR(32) NOT NULL DEFAULT '001',
  `btk_pvc_code` VARCHAR(32) NOT NULL DEFAULT '0',
  `btk_bkm_code` VARCHAR(8) NOT NULL DEFAULT '1',
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'Europe/Istanbul',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant_id`),
  CONSTRAINT `fk_tenant_btk_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tenant_btk_daily_seq` (
  `tenant_id` INT NOT NULL,
  `log_date` DATE NOT NULL,
  `seq` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`tenant_id`, `log_date`),
  CONSTRAINT `fk_tenant_btk_daily_seq_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `btk_log_exports` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tenant_id` INT NOT NULL,
  `hour_start` DATETIME NOT NULL,
  `hour_end` DATETIME NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `record_count` INT NOT NULL DEFAULT 0,
  `content_sha256` CHAR(64) NOT NULL,
  `signature` TEXT NOT NULL,
  `sign_algorithm` VARCHAR(32) NOT NULL DEFAULT 'HMAC-SHA256',
  `log_path` VARCHAR(512) NOT NULL,
  `signature_path` VARCHAR(512) NOT NULL,
  `zip_path` VARCHAR(512) DEFAULT NULL,
  `status` ENUM('pending','signed','failed') NOT NULL DEFAULT 'pending',
  `error_message` TEXT DEFAULT NULL,
  `signed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_hour` (`tenant_id`, `hour_start`),
  KEY `idx_tenant_created` (`tenant_id`, `created_at`),
  CONSTRAINT `fk_btk_log_exports_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
