-- Multi-Tenant System Database Schema
-- Otomatik Tenant Tanıma + Modül Bazlı Yetkilendirme Sistemi

-- =============================================
-- 1. TENANT YÖNETİMİ TABLOLARI
-- =============================================

-- Ana tenant tablosu
CREATE TABLE tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(50) UNIQUE,
    status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    settings JSON,
    radius_secret VARCHAR(100) NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    max_users INT DEFAULT 1000,
    max_nas INT DEFAULT 10
);

-- Tenant IP aralıkları (otomatik tenant detection için)
CREATE TABLE tenant_ip_ranges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    ip_start VARCHAR(45) NOT NULL,
    ip_end VARCHAR(45) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_ip_range (ip_start, ip_end)
);

-- Tenant özel ayarları
CREATE TABLE tenant_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_setting (tenant_id, setting_key)
);

-- =============================================
-- 2. ROL VE YETKİ SİSTEMİ TABLOLARI
-- =============================================

-- Roller tablosu
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    tenant_id INT NULL, -- NULL = global role, tenant_id = tenant-specific role
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_name (name, tenant_id)
);

-- Yetkiler tablosu
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_permission (name),
    INDEX idx_module_action (module, action)
);

-- Rol-yetki ilişkisi
CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- Kullanıcı-rol ilişkisi
CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    tenant_id INT NOT NULL,
    assigned_by INT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES members(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role_tenant (user_id, role_id, tenant_id)
);

-- =============================================
-- 3. AUDIT LOGGING TABLOLARI
-- =============================================

-- Audit logları
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NULL,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE SET NULL,
    INDEX idx_tenant_action (tenant_id, action),
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
);

-- Kullanıcı oturumları
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,
    session_id VARCHAR(128) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    logout_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session (session_id),
    INDEX idx_user_tenant (user_id, tenant_id),
    INDEX idx_last_activity (last_activity)
);

-- =============================================
-- 4. MEVCUT TABLOLARA TENANT_ID EKLEME
-- =============================================

-- Members tablosuna tenant_id ve role_id ekle
ALTER TABLE members ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE members ADD COLUMN role_id INT NULL;
ALTER TABLE members ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE members ADD COLUMN last_login TIMESTAMP NULL;
ALTER TABLE members ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE members ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Foreign key constraints
ALTER TABLE members ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE members ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Index'ler
CREATE INDEX idx_members_tenant_id ON members(tenant_id);
CREATE INDEX idx_members_role_id ON members(role_id);
CREATE INDEX idx_members_is_active ON members(is_active);

-- Diğer tablolara tenant_id ekle
ALTER TABLE usersInfo ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE userInvoices ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE packetsInfo ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE metroIP ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE AccessPoints ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;

-- Foreign key constraints
ALTER TABLE usersInfo ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE userInvoices ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE packetsInfo ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE metroIP ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE AccessPoints ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Index'ler
CREATE INDEX idx_usersInfo_tenant_id ON usersInfo(tenant_id);
CREATE INDEX idx_userInvoices_tenant_id ON userInvoices(tenant_id);
CREATE INDEX idx_packetsInfo_tenant_id ON packetsInfo(tenant_id);
CREATE INDEX idx_metroIP_tenant_id ON metroIP(tenant_id);
CREATE INDEX idx_AccessPoints_tenant_id ON AccessPoints(tenant_id);

-- =============================================
-- 5. VARSayıLAN VERİLER
-- =============================================

-- Varsayılan tenant (mevcut sistem için)
INSERT INTO tenants (id, name, subdomain, status, radius_secret, description, contact_email, max_users, max_nas) 
VALUES (1, 'Default Tenant', 'default', 'active', 'As081316', 'Default tenant for existing system', 'admin@example.com', 1000, 10);

-- Varsayılan IP aralığı (tüm IP'ler için)
INSERT INTO tenant_ip_ranges (tenant_id, ip_start, ip_end, description) 
VALUES (1, '0.0.0.0', '255.255.255.255', 'All IPs for default tenant');

-- Sistem rolleri
INSERT INTO roles (id, name, display_name, description, is_system_role, tenant_id) VALUES
(1, 'super_admin', 'Super Administrator', 'Full system access across all tenants', TRUE, NULL),
(2, 'tenant_admin', 'Tenant Administrator', 'Full access within assigned tenant', TRUE, NULL),
(3, 'operator', 'Operator', 'Limited access for daily operations', TRUE, NULL),
(4, 'viewer', 'Viewer', 'Read-only access', TRUE, NULL);

-- Modül yetkileri
INSERT INTO permissions (name, display_name, module, action, description) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'dashboard', 'view', 'View dashboard statistics'),
('dashboard.export', 'Export Dashboard Data', 'dashboard', 'export', 'Export dashboard data'),

-- Users
('users.view', 'View Users', 'users', 'view', 'View user list and details'),
('users.create', 'Create Users', 'users', 'create', 'Create new users'),
('users.edit', 'Edit Users', 'users', 'edit', 'Edit existing users'),
('users.delete', 'Delete Users', 'users', 'delete', 'Delete users'),
('users.export', 'Export Users', 'users', 'export', 'Export user data'),

-- Routers
('routers.view', 'View Routers', 'routers', 'view', 'View router list and details'),
('routers.create', 'Create Routers', 'routers', 'create', 'Create new routers'),
('routers.edit', 'Edit Routers', 'routers', 'edit', 'Edit existing routers'),
('routers.delete', 'Delete Routers', 'routers', 'delete', 'Delete routers'),
('routers.test', 'Test Router Connection', 'routers', 'test', 'Test router connections'),

-- Packets
('packets.view', 'View Packets', 'packets', 'view', 'View packet list and details'),
('packets.create', 'Create Packets', 'packets', 'create', 'Create new packets'),
('packets.edit', 'Edit Packets', 'packets', 'edit', 'Edit existing packets'),
('packets.delete', 'Delete Packets', 'packets', 'delete', 'Delete packets'),

-- Invoices
('invoices.view', 'View Invoices', 'invoices', 'view', 'View invoice list and details'),
('invoices.create', 'Create Invoices', 'invoices', 'create', 'Create new invoices'),
('invoices.edit', 'Edit Invoices', 'invoices', 'edit', 'Edit existing invoices'),
('invoices.delete', 'Delete Invoices', 'invoices', 'delete', 'Delete invoices'),

-- IP Management
('ip.view', 'View IP Management', 'ip_management', 'view', 'View IP management'),
('ip.create', 'Create IP Assignments', 'ip_management', 'create', 'Create IP assignments'),
('ip.edit', 'Edit IP Assignments', 'ip_management', 'edit', 'Edit IP assignments'),
('ip.delete', 'Delete IP Assignments', 'ip_management', 'delete', 'Delete IP assignments'),

-- Reports
('reports.view', 'View Reports', 'reports', 'view', 'View system reports'),
('reports.export', 'Export Reports', 'reports', 'export', 'Export report data'),

-- Settings
('settings.view', 'View Settings', 'settings', 'view', 'View system settings'),
('settings.edit', 'Edit Settings', 'settings', 'edit', 'Edit system settings'),

-- Tenant Management (Super Admin only)
('tenants.view', 'View Tenants', 'tenants', 'view', 'View tenant list'),
('tenants.create', 'Create Tenants', 'tenants', 'create', 'Create new tenants'),
('tenants.edit', 'Edit Tenants', 'tenants', 'edit', 'Edit existing tenants'),
('tenants.delete', 'Delete Tenants', 'tenants', 'delete', 'Delete tenants'),

-- User Management
('members.view', 'View Members', 'members', 'view', 'View member list'),
('members.create', 'Create Members', 'members', 'create', 'Create new members'),
('members.edit', 'Edit Members', 'members', 'edit', 'Edit existing members'),
('members.delete', 'Delete Members', 'members', 'delete', 'Delete members'),

-- Role Management
('roles.view', 'View Roles', 'roles', 'view', 'View role list'),
('roles.create', 'Create Roles', 'roles', 'create', 'Create new roles'),
('roles.edit', 'Edit Roles', 'roles', 'edit', 'Edit existing roles'),
('roles.delete', 'Delete Roles', 'roles', 'delete', 'Delete roles');

-- Rol-yetki atamaları
-- Super Admin (tüm yetkiler)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Tenant Admin (tenant içi tüm yetkiler, tenant yönetimi hariç)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE module NOT IN ('tenants', 'members', 'roles');

-- Operator (sınırlı yetkiler)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE module IN ('dashboard', 'users', 'routers', 'packets', 'invoices', 'ip_management')
AND action IN ('view', 'create', 'edit');

-- Viewer (sadece görüntüleme)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE action = 'view';

-- Mevcut admin kullanıcısını super_admin yap
UPDATE members SET tenant_id = 1, role_id = 1 WHERE username = 'admin';
