<?php
require_once '../src/Database.php';

// PSR-4 Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

echo "<h1>Permission Debug</h1>";

try {
    $pdo = \App\Database::getConnection();
    echo "✅ Veritabanı bağlantısı başarılı<br><br>";
    
    // Admin kullanıcısını kontrol et
    $stmt = $pdo->query("SELECT id, username, tenant_id, role_id FROM members WHERE username = 'admin'");
    $admin = $stmt->fetch();
    
    if (!$admin) {
        echo "❌ Admin kullanıcısı bulunamadı<br>";
        exit();
    }
    
    echo "✅ Admin kullanıcısı: ID={$admin['id']}, Username={$admin['username']}, Tenant ID={$admin['tenant_id']}, Role ID={$admin['role_id']}<br><br>";
    
    // User roles tablosunu kontrol et
    $stmt = $pdo->prepare("
        SELECT 
            ur.id, ur.user_id, ur.role_id, ur.tenant_id, ur.is_active, ur.assigned_at,
            r.name as role_name, r.display_name as role_display_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
    ");
    $stmt->execute([$admin['id']]);
    $userRoles = $stmt->fetchAll();
    
    echo "✅ User roles tablosu (user_id = {$admin['id']}):<br>";
    if (empty($userRoles)) {
        echo "❌ Hiç rol atanmamış<br>";
    } else {
        foreach ($userRoles as $userRole) {
            echo "- Role: {$userRole['role_name']} ({$userRole['role_display_name']}) - Active: " . ($userRole['is_active'] ? 'Yes' : 'No') . " - Assigned: {$userRole['assigned_at']}<br>";
        }
    }
    
    // Role permissions tablosunu kontrol et
    $stmt = $pdo->query("
        SELECT 
            rp.id, rp.role_id, rp.permission_id,
            r.name as role_name,
            p.name as permission_name, p.module, p.action
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.name = 'super_admin'
        LIMIT 10
    ");
    $rolePermissions = $stmt->fetchAll();
    
    echo "<br>✅ Super admin rol yetkileri (ilk 10):<br>";
    foreach ($rolePermissions as $rp) {
        echo "- {$rp['permission_name']} ({$rp['module']}.{$rp['action']})<br>";
    }
    
    // PermissionManager ile test et
    echo "<br><h2>PermissionManager Test:</h2>";
    
    $permissionManager = new \App\Services\PermissionManager(1, $admin['id']);
    
    $userRoles = $permissionManager->getUserRoles();
    $userPermissions = $permissionManager->getUserPermissions();
    
    echo "✅ PermissionManager User Roles: " . json_encode($userRoles, JSON_PRETTY_PRINT) . "<br>";
    echo "✅ PermissionManager User Permissions Count: " . count($userPermissions) . "<br>";
    
    if (count($userPermissions) > 0) {
        echo "✅ İlk 10 yetki:<br>";
        foreach (array_slice($userPermissions, 0, 10) as $permission) {
            echo "- $permission<br>";
        }
    }
    
    // SQL query'yi manuel test et
    echo "<br><h2>Manual SQL Test:</h2>";
    
    $stmt = $pdo->prepare("
        SELECT DISTINCT p.name
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ? 
        AND ur.tenant_id = ? 
        AND ur.is_active = 1
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ");
    $stmt->execute([$admin['id'], 1]);
    $manualPermissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);
    
    echo "✅ Manuel SQL Permissions Count: " . count($manualPermissions) . "<br>";
    if (count($manualPermissions) > 0) {
        echo "✅ İlk 10 manuel yetki:<br>";
        foreach (array_slice($manualPermissions, 0, 10) as $permission) {
            echo "- $permission<br>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}
?>
