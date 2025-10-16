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

use App\Services\TenantContext;
use App\Services\TenantDetector;
use App\Services\PermissionManager;
use App\Middleware\PermissionMiddleware;

// Test için session'ı simüle et
session_start();
$_SESSION['user_id'] = 4; // Admin kullanıcısı ID'si

echo "<h1>Multi-Tenant System Test</h1>";

try {
    // 1. Tenant Detection Test
    echo "<h2>1. Tenant Detection Test</h2>";
    
    $detector = new TenantDetector();
    $tenantId = $detector->detectTenantId();
    $detectionMethod = $detector->getDetectionMethod();
    $tenantInfo = $detector->getTenantInfo();
    
    echo "✅ Detected Tenant ID: $tenantId<br>";
    echo "✅ Detection Method: $detectionMethod<br>";
    echo "✅ Tenant Info: " . json_encode($tenantInfo, JSON_PRETTY_PRINT) . "<br>";
    
    // 2. Tenant Context Test
    echo "<br><h2>2. Tenant Context Test</h2>";
    
    $context = TenantContext::getInstance();
    $contextTenantId = $context->getTenantId();
    $contextTenantName = $context->getTenantName();
    $contextTenantStatus = $context->getTenantStatus();
    
    echo "✅ Context Tenant ID: $contextTenantId<br>";
    echo "✅ Context Tenant Name: $contextTenantName<br>";
    echo "✅ Context Tenant Status: $contextTenantStatus<br>";
    
    // 3. Permission System Test
    echo "<br><h2>3. Permission System Test</h2>";
    
    // Test kullanıcısı için permission manager oluştur
    $testUserId = $_SESSION['user_id']; // Session'dan al
    $permissionManager = new PermissionManager($tenantId, $testUserId);
    
    $userRoles = $permissionManager->getUserRoles();
    $userPermissions = $permissionManager->getUserPermissions();
    $isSuperAdmin = $permissionManager->isSuperAdmin();
    $isTenantAdmin = $permissionManager->isTenantAdmin();
    
    echo "✅ User Roles: " . json_encode($userRoles, JSON_PRETTY_PRINT) . "<br>";
    echo "✅ User Permissions Count: " . count($userPermissions) . "<br>";
    echo "✅ Is Super Admin: " . ($isSuperAdmin ? 'Yes' : 'No') . "<br>";
    echo "✅ Is Tenant Admin: " . ($isTenantAdmin ? 'Yes' : 'No') . "<br>";
    
    // 4. Permission Tests
    echo "<br><h2>4. Permission Tests</h2>";
    
    $testPermissions = [
        'dashboard.view' => $permissionManager->hasPermission('dashboard.view'),
        'users.view' => $permissionManager->hasPermission('users.view'),
        'users.create' => $permissionManager->hasPermission('users.create'),
        'routers.view' => $permissionManager->hasPermission('routers.view'),
        'tenants.view' => $permissionManager->hasPermission('tenants.view')
    ];
    
    foreach ($testPermissions as $permission => $hasPermission) {
        $status = $hasPermission ? '✅' : '❌';
        echo "$status $permission: " . ($hasPermission ? 'Yes' : 'No') . "<br>";
    }
    
    // 5. Module Access Tests
    echo "<br><h2>5. Module Access Tests</h2>";
    
    $testModules = [
        'dashboard' => $permissionManager->canAccessModule('dashboard'),
        'users' => $permissionManager->canAccessModule('users'),
        'routers' => $permissionManager->canAccessModule('routers'),
        'tenants' => $permissionManager->canAccessModule('tenants')
    ];
    
    foreach ($testModules as $module => $canAccess) {
        $status = $canAccess ? '✅' : '❌';
        echo "$status Module '$module': " . ($canAccess ? 'Access' : 'No Access') . "<br>";
    }
    
    // 6. Database Test
    echo "<br><h2>6. Database Test</h2>";
    
    $pdo = \App\Database::getConnection();
    
    // Tenant tablosunu kontrol et
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tenants");
    $tenantCount = $stmt->fetch()['count'];
    echo "✅ Tenants table: $tenantCount records<br>";
    
    // Roles tablosunu kontrol et
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM roles");
    $roleCount = $stmt->fetch()['count'];
    echo "✅ Roles table: $roleCount records<br>";
    
    // Permissions tablosunu kontrol et
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM permissions");
    $permissionCount = $stmt->fetch()['count'];
    echo "✅ Permissions table: $permissionCount records<br>";
    
    // Role permissions tablosunu kontrol et
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM role_permissions");
    $rolePermissionCount = $stmt->fetch()['count'];
    echo "✅ Role Permissions table: $rolePermissionCount records<br>";
    
    // 7. Debug Information
    echo "<br><h2>7. Debug Information</h2>";
    
    $debugInfo = [
        'detector_debug' => $detector->getDebugInfo(),
        'context_debug' => $context->getDebugInfo(),
        'permission_debug' => $permissionManager->getDebugInfo()
    ];
    
    echo "<pre>" . json_encode($debugInfo, JSON_PRETTY_PRINT) . "</pre>";
    
    echo "<br><h2 style='color: green;'>🎉 Multi-Tenant System Test Completed Successfully!</h2>";
    echo "<a href='index.php?mod=dashboard'>Go to Dashboard</a>";
    
} catch (Exception $e) {
    echo "<br><h2 style='color: red;'>❌ Test Error</h2>";
    echo "Error: " . $e->getMessage() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}
?>
