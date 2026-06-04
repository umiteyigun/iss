-- =====================================================
-- RADIUS Multi-Tenant Admin Panel - Database Init
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS radius CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE radius;

-- =====================================================
-- 1. TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `subdomain` VARCHAR(50) DEFAULT NULL UNIQUE,
  `status` ENUM('active', 'suspended', 'pending') DEFAULT 'active',
  `radius_secret` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `contact_email` VARCHAR(255) DEFAULT NULL,
  `contact_phone` VARCHAR(20) DEFAULT NULL,
  `max_users` INT DEFAULT NULL,
  `max_nas` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_subdomain` (`subdomain`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tenant
INSERT INTO `tenants` (`id`, `name`, `subdomain`, `status`, `radius_secret`, `description`, `max_users`, `max_nas`) 
VALUES (1, 'Default Tenant', 'default', 'active', 'testing123', 'Default system tenant', NULL, NULL)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- =====================================================
-- 2. ROLES & PERMISSIONS TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `display_name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_system_role` BOOLEAN DEFAULT FALSE,
  `tenant_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_tenant` (`tenant_id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `display_name` VARCHAR(150) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_module` (`module`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO `roles` (`name`, `display_name`, `description`, `is_system_role`, `tenant_id`) VALUES
('super_admin', 'Super Administrator', 'Full system access across all tenants', TRUE, NULL),
('tenant_admin', 'Tenant Administrator', 'Full access within tenant', TRUE, NULL),
('operator', 'Operator', 'Limited operational access', TRUE, NULL)
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);

-- =====================================================
-- 3. MEMBERS TABLE (Admin Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE DEFAULT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `lastname` VARCHAR(100) DEFAULT NULL,
  `tc` VARCHAR(50) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `photo` VARCHAR(100) DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `role_id` INT DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `tenant_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_tenant` (`tenant_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `member_roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `member_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_member_role` (`member_id`, `role_id`),
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default super admin (password: admin123)
-- Password hash generated with: bcrypt.hash('admin123', 12)
INSERT INTO `members` (`username`, `name`, `lastname`, `email`, `password`, `role_id`, `is_active`, `tenant_id`) VALUES
('admin', 'System', 'Administrator', 'admin@example.com', '$2a$12$/0nzrtVpNXLndpLpkaOEUeNVsvhqo7Jib3/1nJuqavOYo.1GjJiJu', 1, TRUE, NULL)
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`);

-- =====================================================
-- 4. PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `packetsInfo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) DEFAULT NULL,
  `download` VARCHAR(20) DEFAULT NULL COMMENT 'Download speed limit',
  `upload` VARCHAR(20) DEFAULT NULL COMMENT 'Upload speed limit',
  `price` INT NOT NULL DEFAULT 0,
  `traffic` VARCHAR(20) DEFAULT NULL COMMENT 'Traffic limit',
  `sat` VARCHAR(10) DEFAULT NULL,
  `tenant_id` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant` (`tenant_id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample packages
INSERT INTO `packetsInfo` (`name`, `download`, `upload`, `price`, `traffic`, `tenant_id`) VALUES
('Basic 10Mbps', '10M', '5M', 100, 'unlimited', 1),
('Standard 50Mbps', '50M', '25M', 300, 'unlimited', 1),
('Premium 100Mbps', '100M', '50M', 500, 'unlimited', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- =====================================================
-- 5. NAS DEVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `nas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nasname` VARCHAR(128) NOT NULL UNIQUE,
  `shortname` VARCHAR(32) NOT NULL,
  `type` VARCHAR(30) DEFAULT 'other',
  `ports` INT DEFAULT NULL,
  `secret` VARCHAR(60) NOT NULL,
  `server` VARCHAR(64) DEFAULT NULL,
  `community` VARCHAR(50) DEFAULT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `tenant_id` INT DEFAULT NULL,
  `ruser` VARCHAR(50) DEFAULT NULL COMMENT 'Mikrotik API username',
  `naspassword` VARCHAR(100) DEFAULT NULL COMMENT 'Mikrotik API password',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  INDEX `idx_nasname` (`nasname`),
  INDEX `idx_tenant` (`tenant_id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. ROUTERS TABLE (Mikrotik Devices)
-- =====================================================
CREATE TABLE IF NOT EXISTS `routers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `port` INT DEFAULT 8728,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('online', 'offline', 'error') DEFAULT 'offline',
  `last_checked` TIMESTAMP NULL DEFAULT NULL,
  `firmware_version` VARCHAR(50) DEFAULT NULL,
  `model` VARCHAR(100) DEFAULT NULL,
  `settings` JSON DEFAULT NULL,
  `tenant_id` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant` (`tenant_id`),
  INDEX `idx_ip` (`ip_address`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. RADIUS TABLES
-- =====================================================

-- radcheck: User authentication
CREATE TABLE IF NOT EXISTS `radcheck` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) DEFAULT NULL,
  `attribute` VARCHAR(64) DEFAULT NULL,
  `op` CHAR(2) DEFAULT NULL,
  `value` VARCHAR(253) DEFAULT NULL,
  `regdate` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `tenant_id` INT DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- radreply: User reply attributes (IP assignments, etc)
CREATE TABLE IF NOT EXISTS `radreply` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) DEFAULT NULL,
  `attribute` VARCHAR(64) DEFAULT NULL,
  `op` CHAR(2) DEFAULT NULL,
  `value` VARCHAR(253) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- radpostauth: Authentication accept/reject log (required by FreeRADIUS sql post-auth)
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

-- radacct: Accounting records
CREATE TABLE IF NOT EXISTS `radacct` (
  `radacctid` BIGINT NOT NULL AUTO_INCREMENT,
  `acctsessionid` VARCHAR(64) NOT NULL,
  `acctuniqueid` VARCHAR(32) NOT NULL UNIQUE,
  `username` VARCHAR(64) NOT NULL,
  `realm` VARCHAR(64) DEFAULT NULL,
  `nasipaddress` VARCHAR(15) NOT NULL,
  `nasportid` VARCHAR(15) DEFAULT NULL,
  `nasporttype` VARCHAR(32) DEFAULT NULL,
  `acctstarttime` TIMESTAMP NULL DEFAULT NULL,
  `acctupdatetime` DATETIME NULL DEFAULT NULL,
  `acctstoptime` TIMESTAMP NULL DEFAULT NULL,
  `acctinterval` INT DEFAULT NULL,
  `acctsessiontime` INT DEFAULT NULL,
  `acctauthentic` VARCHAR(32) DEFAULT NULL,
  `connectinfo_start` VARCHAR(50) DEFAULT NULL,
  `connectinfo_stop` VARCHAR(50) DEFAULT NULL,
  `acctinputoctets` BIGINT DEFAULT NULL,
  `acctoutputoctets` BIGINT DEFAULT NULL,
  `calledstationid` VARCHAR(50) DEFAULT NULL,
  `callingstationid` VARCHAR(50) DEFAULT NULL,
  `acctterminatecause` VARCHAR(32) DEFAULT NULL,
  `servicetype` VARCHAR(32) DEFAULT NULL,
  `framedprotocol` VARCHAR(32) DEFAULT NULL,
  `framedipaddress` VARCHAR(15) DEFAULT NULL,
  `framedipv6address` VARCHAR(45) NOT NULL DEFAULT '',
  `framedipv6prefix` VARCHAR(45) NOT NULL DEFAULT '',
  `framedinterfaceid` VARCHAR(44) NOT NULL DEFAULT '',
  `delegatedipv6prefix` VARCHAR(45) NOT NULL DEFAULT '',
  `class` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`radacctid`),
  INDEX `idx_username` (`username`),
  INDEX `idx_nasip` (`nasipaddress`),
  INDEX `idx_starttime` (`acctstarttime`),
  INDEX `idx_stoptime` (`acctstoptime`),
  INDEX `idx_unique` (`acctuniqueid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- radippool: IP Pool management with NAT support
CREATE TABLE IF NOT EXISTS `radippool` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pool_name` VARCHAR(30) DEFAULT NULL,
  `framedipaddress` VARCHAR(15) DEFAULT NULL COMMENT 'Private IP address',
  `nasipaddress` VARCHAR(15) DEFAULT NULL COMMENT 'Shared public IP for NAT',
  `calledstationid` VARCHAR(30) DEFAULT NULL,
  `callingstationid` VARCHAR(30) DEFAULT NULL,
  `expiry_time` TIMESTAMP NULL DEFAULT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `pool_key` VARCHAR(30) DEFAULT NULL,
  `port` VARCHAR(30) DEFAULT NULL COMMENT 'Port range for NAT (e.g., 1-5000)',
  `tenant_id` INT DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_framedip` (`framedipaddress`),
  INDEX `idx_nasip` (`nasipaddress`),
  INDEX `idx_pool` (`pool_name`),
  INDEX `idx_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. METRO IP TABLE (Static & Shared Public IPs)
-- =====================================================
CREATE TABLE IF NOT EXISTS `metroIP` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nasname` VARCHAR(200) DEFAULT NULL,
  `ipaddress` VARCHAR(45) DEFAULT NULL,
  `ports` VARCHAR(45) DEFAULT NULL COMMENT 'Port range (e.g., 1-5000, 62401-63700)',
  `user` VARCHAR(50) DEFAULT NULL,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `ip_type` INT NOT NULL DEFAULT 0 COMMENT '0=static/stock, 1=shared with ports, 2=extra routed',
  PRIMARY KEY (`id`),
  INDEX `idx_ip` (`ipaddress`),
  INDEX `idx_user` (`user`),
  INDEX `idx_tenant` (`tenant_id`),
  INDEX `idx_type` (`ip_type`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. USERS INFO TABLE (Extended user information)
-- =====================================================
CREATE TABLE IF NOT EXISTS `usersInfo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `lastname` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `packet` VARCHAR(100) DEFAULT NULL,
  `address` VARCHAR(1000) DEFAULT NULL,
  `tenant_id` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. CREATE ADMIN USER
-- =====================================================
-- Default credentials: admin / admin123
-- Note: Password is bcrypt hashed

-- Grant privileges (if running as root)
GRANT ALL PRIVILEGES ON radius.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Database initialization completed successfully!' AS Status;
SELECT 'Default admin credentials: username=admin, password=admin123' AS Info;

