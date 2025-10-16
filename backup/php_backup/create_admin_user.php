<?php
require_once '../src/Database.php';

echo "<h1>Create Admin User</h1>";

try {
    $pdo = \App\Database::getConnection();
    echo "✅ Veritabanı bağlantısı başarılı<br><br>";
    
    // Mevcut admin kullanıcısını kontrol et
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM members WHERE username = 'admin'");
    $adminCount = $stmt->fetch()['count'];
    
    if ($adminCount > 0) {
        echo "⚠️ Admin kullanıcısı zaten mevcut<br>";
    } else {
        // Admin kullanıcısı oluştur
        $stmt = $pdo->prepare("
            INSERT INTO members (username, password, mode, tenant_id, role_id, is_active, created_at)
            VALUES (?, ?, 'admin', 1, 1, 1, NOW())
        ");
        
        $result = $stmt->execute(['admin', 'admin123']);
        
        if ($result) {
            echo "✅ Admin kullanıcısı oluşturuldu<br>";
        } else {
            echo "❌ Admin kullanıcısı oluşturulamadı<br>";
        }
    }
    
    // Super admin rolünü bul
    $stmt = $pdo->query("SELECT id FROM roles WHERE name = 'super_admin'");
    $superAdminRole = $stmt->fetch();
    
    if (!$superAdminRole) {
        echo "❌ Super admin rolü bulunamadı<br>";
        exit();
    }
    
    echo "✅ Super admin rolü bulundu: ID={$superAdminRole['id']}<br>";
    
    // Admin kullanıcısını bul
    $stmt = $pdo->query("SELECT id, username FROM members WHERE username = 'admin'");
    $admin = $stmt->fetch();
    
    if (!$admin) {
        echo "❌ Admin kullanıcısı bulunamadı<br>";
        exit();
    }
    
    echo "✅ Admin kullanıcısı bulundu: ID={$admin['id']}, Username={$admin['username']}<br>";
    
    // Mevcut rol atamalarını kontrol et
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM user_roles WHERE user_id = ? AND role_id = ? AND tenant_id = 1");
    $stmt->execute([$admin['id'], $superAdminRole['id']]);
    $existingRole = $stmt->fetch()['count'];
    
    if ($existingRole > 0) {
        echo "⚠️ Admin kullanıcısı zaten super admin rolüne sahip<br>";
    } else {
        // Super admin rolünü ata
        $stmt = $pdo->prepare("
            INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, is_active)
            VALUES (?, ?, 1, ?, 1)
        ");
        $result = $stmt->execute([$admin['id'], $superAdminRole['id'], $admin['id']]);
        
        if ($result) {
            echo "✅ Super admin rolü başarıyla atandı<br>";
        } else {
            echo "❌ Super admin rolü atanamadı<br>";
        }
    }
    
    // Tenant ID'yi güncelle
    $stmt = $pdo->prepare("UPDATE members SET tenant_id = 1, role_id = ? WHERE id = ?");
    $result = $stmt->execute([$superAdminRole['id'], $admin['id']]);
    
    if ($result) {
        echo "✅ Admin kullanıcısının tenant_id ve role_id güncellendi<br>";
    } else {
        echo "❌ Admin kullanıcısı güncellenemedi<br>";
    }
    
    // Sonuç kontrolü
    echo "<br><h2>Sonuç Kontrolü:</h2>";
    
    $stmt = $pdo->prepare("
        SELECT 
            m.id, m.username, m.tenant_id, m.role_id,
            r.name as role_name, r.display_name as role_display_name
        FROM members m
        LEFT JOIN roles r ON m.role_id = r.id
        WHERE m.id = ?
    ");
    $stmt->execute([$admin['id']]);
    $result = $stmt->fetch();
    
    echo "✅ Admin kullanıcısı bilgileri:<br>";
    echo "- ID: {$result['id']}<br>";
    echo "- Username: {$result['username']}<br>";
    echo "- Tenant ID: {$result['tenant_id']}<br>";
    echo "- Role ID: {$result['role_id']}<br>";
    echo "- Role Name: {$result['role_name']}<br>";
    echo "- Role Display Name: {$result['role_display_name']}<br>";
    
    // User roles tablosunu kontrol et
    $stmt = $pdo->prepare("
        SELECT 
            ur.id, ur.user_id, ur.role_id, ur.tenant_id, ur.is_active,
            r.name as role_name, r.display_name as role_display_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
    ");
    $stmt->execute([$admin['id']]);
    $userRoles = $stmt->fetchAll();
    
    echo "<br>✅ User roles tablosu:<br>";
    foreach ($userRoles as $userRole) {
        echo "- Role: {$userRole['role_name']} ({$userRole['role_display_name']}) - Active: " . ($userRole['is_active'] ? 'Yes' : 'No') . "<br>";
    }
    
    echo "<br><h2 style='color: green;'>🎉 Admin user setup completed!</h2>";
    echo "<a href='test_tenant_system.php'>Test Tenant System</a> | ";
    echo "<a href='index.php?mod=dashboard'>Go to Dashboard</a>";
    
} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}
?>
