-- FreeRADIUS 3.2 SQL module expects extra radacct columns (acctupdatetime, IPv6, class, etc.)
USE radius;

SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'radacct' AND COLUMN_NAME = 'acctupdatetime') = 0,
  'ALTER TABLE radacct ADD COLUMN acctupdatetime DATETIME NULL DEFAULT NULL AFTER acctstarttime',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'radacct' AND COLUMN_NAME = 'acctinterval') = 0,
  'ALTER TABLE radacct ADD COLUMN acctinterval INT NULL DEFAULT NULL AFTER acctstoptime',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'radacct' AND COLUMN_NAME = 'framedipv6address') = 0,
  'ALTER TABLE radacct ADD COLUMN framedipv6address VARCHAR(45) NOT NULL DEFAULT '''' AFTER framedipaddress',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'radacct' AND COLUMN_NAME = 'framedipv6prefix') = 0,
  'ALTER TABLE radacct ADD COLUMN framedipv6prefix VARCHAR(45) NOT NULL DEFAULT '''' AFTER framedipv6address',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'radacct' AND COLUMN_NAME = 'framedinterfaceid') = 0,
  'ALTER TABLE radacct ADD COLUMN framedinterfaceid VARCHAR(44) NOT NULL DEFAULT '''' AFTER framedipv6prefix',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'radacct' AND COLUMN_NAME = 'delegatedipv6prefix') = 0,
  'ALTER TABLE radacct ADD COLUMN delegatedipv6prefix VARCHAR(45) NOT NULL DEFAULT '''' AFTER framedinterfaceid',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'radacct' AND COLUMN_NAME = 'class') = 0,
  'ALTER TABLE radacct ADD COLUMN class VARCHAR(64) NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
