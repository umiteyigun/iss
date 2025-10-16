<?php
require_once '../src/Database.php';

echo "<h1>Safe Multi-Tenant Database Migration</h1>";

try {
    $pdo = \App\Database::getConnection();
    echo "✅ Veritabanı bağlantısı başarılı<br><br>";
    
    // 1. Tenant tablolarını oluştur
    echo "<h2>1. Tenant Tablolarını Oluşturuyorum...</h2>";
    
    $tables = [
        'tenants' => "
            CREATE TABLE IF NOT EXISTS tenants (
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    
    // 2. Mevcut tablolara kolon ekle (eğer yoksa)
    echo "<br><h2>2. Mevcut Tablolara Kolonlar Ekliyorum...</h2>";
    
    $columns = [
        'members' => [
            'tenant_id' => 'INT NOT NULL DEFAULT 1',
            'role_id' => 'INT NULL',
            'is_active' => 'BOOLEAN DEFAULT TRUE',
            'last_login' => 'TIMESTAMP NULL'
        ],
        'usersInfo' => [
            'tenant_id' => 'INT NOT NULL DEFAULT 1'
        ],
        'userInvoices' => [
            'tenant_id' => 'INT NOT NULL DEFAULT 1'
        ],
        'packetsInfo' => [
            'tenant_id' => 'INT NOT NULL DEFAULT 1'
        ],
        'metroIP' => [
            'tenant_id' => 'INT NOT NULL DEFAULT 1'
        ],
        'AccessPoints' => [
            'tenant_id' => 'INT NOT NULL DEFAULT 1'
        ]
    ];
    
    foreach ($columns as $tableName => $tableColumns) {
        foreach ($tableColumns as $columnName => $columnDef) {
            try {
                // Kolonun var olup olmadığını kontrol et
                $stmt = $pdo->query("SHOW COLUMNS FROM $tableName LIKE '$columnName'");
                if ($stmt->rowCount() == 0) {
                    $pdo->exec("ALTER TABLE $tableName ADD COLUMN $columnName $columnDef");
                    echo "✅ $tableName.$columnName kolonu eklendi<br>";
                } else {
                    echo "⚠️ $tableName.$columnName kolonu zaten mevcut<br>";
                }
            } catch (Exception $e) {
                echo "❌ $tableName.$columnName kolonu hatası: " . $e->getMessage() . "<br>";
            }
        }
    }
    
    // 3. Foreign key'leri ekle (eğer yoksa)
    echo "<br><h2>3. Foreign Key'leri Ekliyorum...</h2>";
    
    $foreignKeys = [
        'members' => [
            'tenant_id' => 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
            'role_id' => 'FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL'
        ],
        'usersInfo' => [
            'tenant_id' => 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
        ],
        'userInvoices' => [
            'tenant_id' => 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
        ],
        'packetsInfo' => [
            'tenant_id' => 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
        ],
        'metroIP' => [
            'tenant_id' => 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
        ],
        'AccessPoints' => [
            'tenant_id' => 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
        ]
    ];
    
    foreach ($foreignKeys as $tableName => $keys) {
        foreach ($keys as $columnName => $fkDef) {
            try {
                // Foreign key'in var olup olmadığını kontrol et
                $stmt = $pdo->query("
                    SELECT CONSTRAINT_NAME 
                    FROM information_schema.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = 'radius' 
                    AND TABLE_NAME = '$tableName' 
                    AND COLUMN_NAME = '$columnName'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ");
                
                if ($stmt->rowCount() == 0) {
                    $pdo->exec("ALTER TABLE $tableName ADD $fkDef");
                    echo "✅ $tableName.$columnName foreign key eklendi<br>";
                } else {
                    echo "⚠️ $tableName.$columnName foreign key zaten mevcut<br>";
                }
            } catch (Exception $e) {
                echo "❌ $tableName.$columnName foreign key hatası: " . $e->getMessage() . "<br>";
            }
        }
    }
    
    // 4. Index'leri ekle (eğer yoksa)
    echo "<br><h2>4. Index'leri Ekliyorum...</h2>";
    
    $indexes = [
        'members' => [
            'idx_members_tenant_id' => 'tenant_id',
            'idx_members_role_id' => 'role_id',
            'idx_members_is_active' => 'is_active'
        ],
        'usersInfo' => [
            'idx_usersInfo_tenant_id' => 'tenant_id'
        ],
        'userInvoices' => [
            'idx_userInvoices_tenant_id' => 'tenant_id'
        ],
        'packetsInfo' => [
            'idx_packetsInfo_tenant_id' => 'tenant_id'
        ],
        'metroIP' => [
            'idx_metroIP_tenant_id' => 'tenant_id'
        ],
        'AccessPoints' => [
            'idx_AccessPoints_tenant_id' => 'tenant_id'
        ]
    ];
    
    foreach ($indexes as $tableName => $tableIndexes) {
        foreach ($tableIndexes as $indexName => $columnName) {
            try {
                // Index'in var olup olmadığını kontrol et
                $stmt = $pdo->query("SHOW INDEX FROM $tableName WHERE Key_name = '$indexName'");
                if ($stmt->rowCount() == 0) {
                    $pdo->exec("CREATE INDEX $indexName ON $tableName($columnName)");
                    echo "✅ $tableName.$indexName index eklendi<br>";
                } else {
                    echo "⚠️ $tableName.$indexName index zaten mevcut<br>";
                }
            } catch (Exception $e) {
                echo "❌ $tableName.$indexName index hatası: " . $e->getMessage() . "<br>";
            }
        }
    }
    
    // 5. Varsayılan verileri ekle
    echo "<br><h2>5. Varsayılan Verileri Ekliyorum...</h2>";
    
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
    
    // 6. Sonuç kontrolü
    echo "<br><h2>6. Sonuç Kontrolü:</h2>";
    
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
