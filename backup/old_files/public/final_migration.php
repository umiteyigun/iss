<?php
require_once '../src/Database.php';

echo "<h1>Final Multi-Tenant Database Migration</h1>";

try {
    $pdo = \App\Database::getConnection();
    echo "✅ Veritabanı bağlantısı başarılı<br><br>";
    
    // 1. Tenant tablolarını oluştur (MySQL uyumlu)
    echo "<h2>1. Tenant Tablolarını Oluşturuyorum...</h2>";
    
    $tables = [
        'tenants' => "
            CREATE TABLE IF NOT EXISTS tenants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                subdomain VARCHAR(50) UNIQUE,
                status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                settings TEXT,
                radius_secret VARCHAR(100) NOT NULL,
                description TEXT,
                contact_email VARCHAR(255),
                contact_phone VARCHAR(20),
                max_users INT DEFAULT 1000,
                max_nas INT DEFAULT 10
            )
        ",
        'tenant_ip_ranges' => "
            CREATE TABLE IF NOT EXISTS tenant_ip_ranges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                ip_start VARCHAR(45) NOT NULL,
                ip_end VARCHAR(45) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                INDEX idx_ip_range (ip_start, ip_end)
            )
        ",
        'tenant_settings' => "
            CREATE TABLE IF NOT EXISTS tenant_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_tenant_setting (tenant_id, setting_key)
            )
        ",
        'roles' => "
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                is_system_role BOOLEAN DEFAULT FALSE,
                tenant_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_role_name (name, tenant_id)
            )
        ",
        'permissions' => "
            CREATE TABLE IF NOT EXISTS permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                display_name VARCHAR(150) NOT NULL,
                module VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_permission (name),
                INDEX idx_module_action (module, action)
            )
        ",
        'role_permissions' => "
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_id INT NOT NULL,
                permission_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                UNIQUE KEY unique_role_permission (role_id, permission_id)
            )
        ",
        'user_roles' => "
            CREATE TABLE IF NOT EXISTS user_roles (
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
            )
        ",
        'audit_logs' => "
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NULL,
                user_id INT NULL,
                action VARCHAR(100) NOT NULL,
                module VARCHAR(50) NOT NULL,
                resource_type VARCHAR(50) NOT NULL,
                resource_id VARCHAR(100) NULL,
                old_values TEXT NULL,
                new_values TEXT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE SET NULL,
                INDEX idx_tenant_action (tenant_id, action),
                INDEX idx_user_action (user_id, action),
                INDEX idx_created_at (created_at)
            )
        ",
        'user_sessions' => "
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                tenant_id INT NOT NULL,
                session_id VARCHAR(128) NOT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                logout_at TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_session (session_id),
                INDEX idx_user_tenant (user_id, tenant_id),
                INDEX idx_last_activity (last_activity)
            )
        "
    ];
    
    foreach ($tables as $tableName => $sql) {
        try {
            $pdo->exec($sql);
            echo "✅ $tableName tablosu oluşturuldu<br>";
        } catch (Exception $e) {
            echo "❌ $tableName tablosu hatası: " . $e->getMessage() . "<br>";
        }
    }
    
    // 2. Varsayılan verileri ekle
    echo "<br><h2>2. Varsayılan Verileri Ekliyorum...</h2>";
    
    // Varsayılan tenant
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM tenants");
        $count = $stmt->fetch()['count'];
        if ($count == 0) {
            $pdo->exec("
                INSERT INTO tenants (id, name, subdomain, status, radius_secret, description, contact_email, max_users, max_nas) 
                VALUES (1, 'Default Tenant', 'default', 'active', 'As081316', 'Default tenant for existing system', 'admin@example.com', 1000, 10)
            ");
            echo "✅ Varsayılan tenant eklendi<br>";
        } else {
            echo "⚠️ Tenant zaten mevcut<br>";
        }
    } catch (Exception $e) {
        echo "❌ Tenant ekleme hatası: " . $e->getMessage() . "<br>";
    }
    
    // Varsayılan IP aralığı
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM tenant_ip_ranges");
        $count = $stmt->fetch()['count'];
        if ($count == 0) {
            $pdo->exec("
                INSERT INTO tenant_ip_ranges (tenant_id, ip_start, ip_end, description) 
                VALUES (1, '0.0.0.0', '255.255.255.255', 'All IPs for default tenant')
            ");
            echo "✅ Varsayılan IP aralığı eklendi<br>";
        } else {
            echo "⚠️ IP aralığı zaten mevcut<br>";
        }
    } catch (Exception $e) {
        echo "❌ IP aralığı ekleme hatası: " . $e->getMessage() . "<br>";
    }
    
    // Sistem rolleri
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM roles");
        $count = $stmt->fetch()['count'];
        if ($count == 0) {
            $pdo->exec("
                INSERT INTO roles (id, name, display_name, description, is_system_role, tenant_id) VALUES
                (1, 'super_admin', 'Super Administrator', 'Full system access across all tenants', TRUE, NULL),
                (2, 'tenant_admin', 'Tenant Administrator', 'Full access within assigned tenant', TRUE, NULL),
                (3, 'operator', 'Operator', 'Limited access for daily operations', TRUE, NULL),
                (4, 'viewer', 'Viewer', 'Read-only access', TRUE, NULL)
            ");
            echo "✅ Sistem rolleri eklendi<br>";
        } else {
            echo "⚠️ Roller zaten mevcut<br>";
        }
    } catch (Exception $e) {
        echo "❌ Rol ekleme hatası: " . $e->getMessage() . "<br>";
    }
    
    // Modül yetkileri
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM permissions");
        $count = $stmt->fetch()['count'];
        if ($count == 0) {
            $permissions = [
                // Dashboard
                ['dashboard.view', 'View Dashboard', 'dashboard', 'view', 'View dashboard statistics'],
                ['dashboard.export', 'Export Dashboard Data', 'dashboard', 'export', 'Export dashboard data'],
                
                // Users
                ['users.view', 'View Users', 'users', 'view', 'View user list and details'],
                ['users.create', 'Create Users', 'users', 'create', 'Create new users'],
                ['users.edit', 'Edit Users', 'users', 'edit', 'Edit existing users'],
                ['users.delete', 'Delete Users', 'users', 'delete', 'Delete users'],
                ['users.export', 'Export Users', 'users', 'export', 'Export user data'],
                
                // Routers
                ['routers.view', 'View Routers', 'routers', 'view', 'View router list and details'],
                ['routers.create', 'Create Routers', 'routers', 'create', 'Create new routers'],
                ['routers.edit', 'Edit Routers', 'routers', 'edit', 'Edit existing routers'],
                ['routers.delete', 'Delete Routers', 'routers', 'delete', 'Delete routers'],
                ['routers.test', 'Test Router Connection', 'routers', 'test', 'Test router connections'],
                
                // Packets
                ['packets.view', 'View Packets', 'packets', 'view', 'View packet list and details'],
                ['packets.create', 'Create Packets', 'packets', 'create', 'Create new packets'],
                ['packets.edit', 'Edit Packets', 'packets', 'edit', 'Edit existing packets'],
                ['packets.delete', 'Delete Packets', 'packets', 'delete', 'Delete packets'],
                
                // Invoices
                ['invoices.view', 'View Invoices', 'invoices', 'view', 'View invoice list and details'],
                ['invoices.create', 'Create Invoices', 'invoices', 'create', 'Create new invoices'],
                ['invoices.edit', 'Edit Invoices', 'invoices', 'edit', 'Edit existing invoices'],
                ['invoices.delete', 'Delete Invoices', 'invoices', 'delete', 'Delete invoices'],
                
                // IP Management
                ['ip.view', 'View IP Management', 'ip_management', 'view', 'View IP management'],
                ['ip.create', 'Create IP Assignments', 'ip_management', 'create', 'Create IP assignments'],
                ['ip.edit', 'Edit IP Assignments', 'ip_management', 'edit', 'Edit IP assignments'],
                ['ip.delete', 'Delete IP Assignments', 'ip_management', 'delete', 'Delete IP assignments'],
                
                // Reports
                ['reports.view', 'View Reports', 'reports', 'view', 'View system reports'],
                ['reports.export', 'Export Reports', 'reports', 'export', 'Export report data'],
                
                // Settings
                ['settings.view', 'View Settings', 'settings', 'view', 'View system settings'],
                ['settings.edit', 'Edit Settings', 'settings', 'edit', 'Edit system settings'],
                
                // Tenant Management (Super Admin only)
                ['tenants.view', 'View Tenants', 'tenants', 'view', 'View tenant list'],
                ['tenants.create', 'Create Tenants', 'tenants', 'create', 'Create new tenants'],
                ['tenants.edit', 'Edit Tenants', 'tenants', 'edit', 'Edit existing tenants'],
                ['tenants.delete', 'Delete Tenants', 'tenants', 'delete', 'Delete tenants'],
                
                // User Management
                ['members.view', 'View Members', 'members', 'view', 'View member list'],
                ['members.create', 'Create Members', 'members', 'create', 'Create new members'],
                ['members.edit', 'Edit Members', 'members', 'edit', 'Edit existing members'],
                ['members.delete', 'Delete Members', 'members', 'delete', 'Delete members'],
                
                // Role Management
                ['roles.view', 'View Roles', 'roles', 'view', 'View role list'],
                ['roles.create', 'Create Roles', 'roles', 'create', 'Create new roles'],
                ['roles.edit', 'Edit Roles', 'roles', 'edit', 'Edit existing roles'],
                ['roles.delete', 'Delete Roles', 'roles', 'delete', 'Delete roles']
            ];
            
            foreach ($permissions as $permission) {
                $pdo->exec("
                    INSERT INTO permissions (name, display_name, module, action, description) 
                    VALUES ('{$permission[0]}', '{$permission[1]}', '{$permission[2]}', '{$permission[3]}', '{$permission[4]}')
                ");
            }
            echo "✅ Modül yetkileri eklendi<br>";
        } else {
            echo "⚠️ Yetkiler zaten mevcut<br>";
        }
    } catch (Exception $e) {
        echo "❌ Yetki ekleme hatası: " . $e->getMessage() . "<br>";
    }
    
    // Rol-yetki atamaları
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM role_permissions");
        $count = $stmt->fetch()['count'];
        if ($count == 0) {
            // Super Admin (tüm yetkiler)
            $stmt = $pdo->query("SELECT id FROM permissions");
            $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);
            foreach ($permissions as $permissionId) {
                $pdo->exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (1, $permissionId)");
            }
            
            // Tenant Admin (tenant içi tüm yetkiler, tenant yönetimi hariç)
            $stmt = $pdo->query("SELECT id FROM permissions WHERE module NOT IN ('tenants', 'members', 'roles')");
            $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);
            foreach ($permissions as $permissionId) {
                $pdo->exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (2, $permissionId)");
            }
            
            // Operator (sınırlı yetkiler)
            $stmt = $pdo->query("SELECT id FROM permissions WHERE module IN ('dashboard', 'users', 'routers', 'packets', 'invoices', 'ip_management') AND action IN ('view', 'create', 'edit')");
            $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);
            foreach ($permissions as $permissionId) {
                $pdo->exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (3, $permissionId)");
            }
            
            // Viewer (sadece görüntüleme)
            $stmt = $pdo->query("SELECT id FROM permissions WHERE action = 'view'");
            $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);
            foreach ($permissions as $permissionId) {
                $pdo->exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (4, $permissionId)");
            }
            
            echo "✅ Rol-yetki atamaları eklendi<br>";
        } else {
            echo "⚠️ Rol-yetki atamaları zaten mevcut<br>";
        }
    } catch (Exception $e) {
        echo "❌ Rol-yetki atama hatası: " . $e->getMessage() . "<br>";
    }
    
    // Mevcut admin kullanıcısını super_admin yap
    try {
        $stmt = $pdo->query("SELECT id FROM members WHERE username = 'admin'");
        $admin = $stmt->fetch();
        if ($admin) {
            $pdo->exec("UPDATE members SET tenant_id = 1, role_id = 1 WHERE id = {$admin['id']}");
            echo "✅ Admin kullanıcısı super_admin yapıldı<br>";
        } else {
            echo "⚠️ Admin kullanıcısı bulunamadı<br>";
        }
    } catch (Exception $e) {
        echo "❌ Admin güncelleme hatası: " . $e->getMessage() . "<br>";
    }
    
    // 3. Sonuç kontrolü
    echo "<br><h2>3. Sonuç Kontrolü:</h2>";
    
    $checkTables = ['tenants', 'tenant_ip_ranges', 'tenant_settings', 'roles', 'permissions', 'role_permissions', 'user_roles', 'audit_logs', 'user_sessions'];
    
    foreach ($checkTables as $table) {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
                $count = $countStmt->fetch()['count'];
                echo "✅ $table: $count kayıt<br>";
            } else {
                echo "❌ $table tablosu bulunamadı<br>";
            }
        } catch (Exception $e) {
            echo "❌ $table kontrol hatası: " . $e->getMessage() . "<br>";
        }
    }
    
    echo "<br><h2 style='color: green;'>🎉 Migration başarıyla tamamlandı!</h2>";
    echo "<a href='index.php?mod=dashboard'>Dashboard'a git</a>";
    
} catch(Exception $e) {
    echo "❌ Genel hata: " . $e->getMessage() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}
?>
