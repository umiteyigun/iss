<?php
require_once '../src/Database.php';

echo "<h1>Multi-Tenant Database Migration</h1>";

try {
    $pdo = \App\Database::getConnection();
    echo "✅ Veritabanı bağlantısı başarılı<br><br>";
    
    // SQL dosyasını oku
    $sql = file_get_contents('multi_tenant_schema.sql');
    
    // SQL'i parçalara böl (; ile ayır)
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    
    echo "<h2>SQL İşlemleri:</h2>";
    
    foreach ($statements as $index => $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            $successCount++;
            echo "✅ İşlem " . ($index + 1) . " başarılı<br>";
        } catch (Exception $e) {
            $errorCount++;
            $errors[] = [
                'statement' => substr($statement, 0, 100) . '...',
                'error' => $e->getMessage()
            ];
            echo "❌ İşlem " . ($index + 1) . " hatalı: " . $e->getMessage() . "<br>";
        }
    }
    
    echo "<br><h2>Özet:</h2>";
    echo "✅ Başarılı işlemler: $successCount<br>";
    echo "❌ Hatalı işlemler: $errorCount<br>";
    
    if (!empty($errors)) {
        echo "<br><h3>Hatalar:</h3>";
        foreach ($errors as $error) {
            echo "<strong>SQL:</strong> " . htmlspecialchars($error['statement']) . "<br>";
            echo "<strong>Hata:</strong> " . htmlspecialchars($error['error']) . "<br><br>";
        }
    }
    
    // Tabloları kontrol et
    echo "<br><h2>Oluşturulan Tablolar:</h2>";
    $tables = ['tenants', 'tenant_ip_ranges', 'tenant_settings', 'roles', 'permissions', 'role_permissions', 'user_roles', 'audit_logs', 'user_sessions'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                echo "✅ $table tablosu mevcut<br>";
            } else {
                echo "❌ $table tablosu bulunamadı<br>";
            }
        } catch (Exception $e) {
            echo "❌ $table tablosu kontrol edilemedi: " . $e->getMessage() . "<br>";
        }
    }
    
    // Varsayılan verileri kontrol et
    echo "<br><h2>Varsayılan Veriler:</h2>";
    
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM tenants");
        $tenantCount = $stmt->fetch()['count'];
        echo "✅ Tenants: $tenantCount kayıt<br>";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM roles");
        $roleCount = $stmt->fetch()['count'];
        echo "✅ Roles: $roleCount kayıt<br>";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM permissions");
        $permissionCount = $stmt->fetch()['count'];
        echo "✅ Permissions: $permissionCount kayıt<br>";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM role_permissions");
        $rolePermissionCount = $stmt->fetch()['count'];
        echo "✅ Role Permissions: $rolePermissionCount kayıt<br>";
        
    } catch (Exception $e) {
        echo "❌ Veri kontrolü hatası: " . $e->getMessage() . "<br>";
    }
    
    if ($errorCount == 0) {
        echo "<br><h2 style='color: green;'>🎉 Migration başarıyla tamamlandı!</h2>";
        echo "<a href='index.php?mod=dashboard'>Dashboard'a git</a>";
    } else {
        echo "<br><h2 style='color: orange;'>⚠️ Migration tamamlandı ama bazı hatalar var.</h2>";
    }
    
} catch(Exception $e) {
    echo "❌ Genel hata: " . $e->getMessage() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}
?>
