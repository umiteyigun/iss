<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set charset for proper Turkish character display
header('Content-Type: text/html; charset=utf-8');

// Start the session
session_start();

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

// Tenant detection ve context initialization
use App\Services\TenantContext;
use App\Middleware\AuthMiddleware;
use App\Middleware\PermissionMiddleware;

// Tenant context'i başlat
$tenantContext = TenantContext::getInstance();

// A simple map for our routes (module => Controller)
$routes = [
    'dashboard'   => ['App\Controllers\DashboardController', 'show'],
    'onlineUsers' => ['App\Controllers\OnlineUsersController', 'show'],
    'nas'         => ['App\Controllers\NasController', 'index'],
    'create_nas'  => ['App\Controllers\NasController', 'create'],
    'edit_nas'    => ['App\Controllers\NasController', 'edit'],
    'delete_nas'  => ['App\Controllers\NasController', 'delete'],
    'nas_details' => ['App\Controllers\NasController', 'details'],
    'device_details' => ['App\Controllers\NasController', 'deviceDetails'],
    'userlist'    => ['App\Controllers\UserController', 'listAll'],
    'userdetails' => ['App\Controllers\UserController', 'showUserDetails'],
    'newUser'     => ['App\Controllers\UserController', 'showNewUserForm'],
    'doNewUser'   => ['App\Controllers\UserController', 'createNewUser'],
    'editUser'    => ['App\Controllers\UserController', 'showEditUserForm'],
    'doUpdateUser'=> ['App\Controllers\UserController', 'updateUser'],
    'deleteUser'  => ['App\Controllers\UserController', 'deleteUser'],
    'userRenew'   => ['App\Controllers\UserController', 'showUserRenewForm'],
    'doUserRenew' => ['App\Controllers\UserController', 'processUserRenewal'],
    'traffic'     => ['App\Controllers\UserController', 'showTrafficForm'],
    'doAddTraffic'=> ['App\Controllers\UserController', 'addTraffic'],
    'history'     => ['App\Controllers\UserController', 'showHistory'],
    'sms'         => ['App\Controllers\UserController', 'showSmsForm'],
    'doSendSms'   => ['App\Controllers\UserController', 'sendSms'],
    'getUser'     => ['App\Controllers\UserController', 'getUser'],
    'getPackets'  => ['App\Controllers\UserController', 'getPackets'],
    'getNasList'  => ['App\Controllers\UserController', 'getNasList'],
    'getAccessPoints' => ['App\Controllers\UserController', 'getAccessPoints'],
    'invoices'    => ['App\Controllers\InvoiceController', 'listInvoices'],
    'newInvoice'  => ['App\Controllers\InvoiceController', 'showNewInvoiceForm'],
    'doNewInvoice'=> ['App\Controllers\InvoiceController', 'createInvoice'],
    'editInvoice' => ['App\Controllers\InvoiceController', 'showEditInvoiceForm'],
    'doUpdateInvoice'=> ['App\Controllers\InvoiceController', 'updateInvoice'],
    'deleteInvoice'=> ['App\Controllers\InvoiceController', 'deleteInvoice'],
    'router'      => ['App\Controllers\RouterController', 'index'],
    'addRouter'   => ['App\Controllers\RouterController', 'add'],
    'editRouter'  => ['App\Controllers\RouterController', 'edit'],
    'deleteRouter'=> ['App\Controllers\RouterController', 'delete'],
    'getSystemResources' => ['App\Controllers\RouterController', 'getSystemResources'],
    'testRouterConnection' => ['App\Controllers\RouterController', 'testRouterConnection'],
    'packet'      => ['App\Controllers\PacketController', 'index'],
    'addPacket'   => ['App\Controllers\PacketController', 'addPacket'],
    'editPacket'  => ['App\Controllers\PacketController', 'editPacket'],
    'deletePacket'=> ['App\Controllers\PacketController', 'deletePacket'],
    'getPacket'   => ['App\Controllers\PacketController', 'getPacket'],
    'ip'          => ['App\Controllers\IpController', 'index'],
    'addMetroIP'  => ['App\Controllers\IpController', 'addMetroIP'],
    'addRadippool'=> ['App\Controllers\IpController', 'addRadippool'],
    'deleteMetroIP'=> ['App\Controllers\IpController', 'deleteMetroIP'],
    'deleteRadippool'=> ['App\Controllers\IpController', 'deleteRadippool'],
    'splitIP'     => ['App\Controllers\IpController', 'splitIP'],
    'unassignMetroIP'=> ['App\Controllers\IpController', 'unassignMetroIP'],
    'searchMetroIP'=> ['App\Controllers\IpController', 'searchMetroIP'],
    'searchRadippool'=> ['App\Controllers\IpController', 'searchRadippool'],
    'login'       => ['App\Controllers\LoginController', 'showForm'],
    'dologin'     => ['App\Controllers\LoginController', 'handleLogin'],
    'logout'      => ['App\Controllers\LoginController', 'handleLogout'],
    // Super Admin Routes
    'tenants'     => ['App\Controllers\SuperAdminController', 'tenants'],
    'create_tenant' => ['App\Controllers\SuperAdminController', 'createTenant'],
    'edit_tenant' => ['App\Controllers\SuperAdminController', 'editTenant'],
    'view_tenant' => ['App\Controllers\SuperAdminController', 'viewTenant'],
    'delete_tenant' => ['App\Controllers\SuperAdminController', 'deleteTenant'],
    // Add other routes here, e.g.:
    // 'editUser'    => ['App\Controllers\UserController', 'showEditForm'],
];

// Get the module from the 'mod' query parameter
$module = $_GET['mod'] ?? '';

// If no module, redirect to the appropriate page
if (empty($module)) {
    if (isset($_SESSION['user_id'])) {
        header('Location: /index.php?mod=dashboard');
    } else {
        header('Location: /index.php?mod=login');
    }
    exit();
}

// Authentication middleware
if (!AuthMiddleware::handle()) {
    exit();
}

// Dispatch the request
if (isset($routes[$module])) {
    $controllerName = $routes[$module][0];
    $methodName = $routes[$module][1];

    if (class_exists($controllerName) && method_exists(new $controllerName, $methodName)) {
        $controller = new $controllerName();
        $controller->$methodName();
    } else {
        // Handle 404 - Controller or method not found
        http_response_code(404);
        echo "404 - Page Not Found (Controller or Method Missing)";
    }
} else {
    // Handle 404 - Route not found
    http_response_code(404);
    echo "404 - Page Not Found (Route not defined for module: " . htmlspecialchars($module) . ")";
}

