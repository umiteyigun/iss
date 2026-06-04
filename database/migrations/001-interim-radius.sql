-- Interim RADIUS stack fixes (safe to re-run)
USE radius;

-- radpostauth for FreeRADIUS post-auth logging
CREATE TABLE IF NOT EXISTS `radpostauth` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) NOT NULL DEFAULT '',
  `pass` VARCHAR(64) NOT NULL DEFAULT '',
  `reply` VARCHAR(32) NOT NULL DEFAULT '',
  `authdate` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `class` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_class` (`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Normalize legacy password attribute casing
UPDATE radcheck
SET attribute = 'Cleartext-Password'
WHERE attribute = 'Cleartext-password';
