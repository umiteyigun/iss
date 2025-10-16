<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

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

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/models/UserModel.php';
require_once __DIR__ . '/../src/models/NasModel.php';
require_once __DIR__ . '/../src/Services/MikrotikService.php';

echo "<h1>Mikrotik Entegrasyonu Debug</h1>";

try {
    $userModel = new \App\Models\UserModel();
    $nasModel = new \App\Models\NasModel();
    
    echo "<h2>1. NAS Listesi</h2>";
    $nasList = $nasModel->getAllNas();
    echo "<pre>";
    print_r($nasList);
    echo "</pre>";
    
    echo "<h2>2. Mikrotik Online Users Test</h2>";
    $mikrotikOnline = $userModel->getMikrotikOnlineUsers();
    echo "Mikrotik Online Users: " . $mikrotikOnline . "<br>";
    
    echo "<h2>3. Tüm İstatistikler</h2>";
    $stats = $userModel->getUserStats();
    echo "<pre>";
    print_r($stats);
    echo "</pre>";
    
    echo "<h2>4. Mikrotik PPP Active Connections Testi</h2>";
    $mikrotikService = new \App\Services\MikrotikService();
    $mikrotikService->enableDebug();
    
    foreach ($nasList as $nas) {
        echo "<h3>Testing NAS: " . htmlspecialchars($nas['nasname']) . "</h3>";
        
        $connections = $mikrotikService->getPppActiveConnections(
            $nas['nasname'], 
            $nas['ruser'], 
            $nas['naspassword']
        );
        
        echo "PPP Active Connections: " . $connections . "<br><br>";
        
        // Detayları da çek
        $details = $mikrotikService->getPppActiveConnectionsDetails(
            $nas['nasname'], 
            $nas['ruser'], 
            $nas['naspassword']
        );
        
        if (!empty($details)) {
            echo "<h4>Connection Details:</h4>";
            echo "<pre>";
            print_r($details);
            echo "</pre>";
        }
        
        echo "<br>";
    }
    
    echo "<h3>Toplam PPP Active Connections</h3>";
    $totalConnections = $mikrotikService->getPppActiveConnectionsFromAllNas();
    echo "Toplam: " . $totalConnections . "<br>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Hata: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Dosya: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Satır: " . $e->getLine() . "</p>";
}
?> 