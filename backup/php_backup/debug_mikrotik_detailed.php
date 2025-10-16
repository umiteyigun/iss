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

echo "<h1>Detaylı Mikrotik API Debug</h1>";

try {
    $nasModel = new \App\Models\NasModel();
    $nasList = $nasModel->getAllNas();
    
    echo "<h2>1. NAS Listesi</h2>";
    echo "<pre>";
    print_r($nasList);
    echo "</pre>";
    
    echo "<h2>2. API Bağlantı Testi</h2>";
    
    foreach ($nasList as $nas) {
        echo "<h3>Testing NAS: " . htmlspecialchars($nas['nasname']) . "</h3>";
        echo "Username: " . htmlspecialchars($nas['ruser']) . "<br>";
        echo "Password: " . htmlspecialchars($nas['naspassword']) . "<br>";
        
        // Manuel API bağlantı testi
        $api = new \App\Services\Mikrotik\RouterosAPI();
        $api->debug = true;
        $api->timeout = 10;
        $api->attempts = 3;
        $api->delay = 1;
        
        echo "<h4>Bağlantı Denemesi:</h4>";
        $connected = $api->connect($nas['nasname'], $nas['ruser'], $nas['naspassword']);
        
        if ($connected) {
            echo "<span style='color:green'>✅ Bağlantı başarılı!</span><br>";
            
            // PPP active connections'ları çek
            echo "<h4>PPP Active Connections:</h4>";
            $response = $api->comm('/ppp/active/print');
            
            if (is_array($response)) {
                echo "<span style='color:green'>✅ " . count($response) . " aktif bağlantı bulundu!</span><br>";
                echo "<pre>";
                print_r($response);
                echo "</pre>";
            } else {
                echo "<span style='color:red'>❌ PPP active connections çekilemedi</span><br>";
            }
            
        } else {
            echo "<span style='color:red'>❌ Bağlantı başarısız!</span><br>";
            echo "Hata kodu: " . htmlspecialchars($api->error_no) . "<br>";
            echo "Hata mesajı: " . htmlspecialchars($api->error_str) . "<br>";
        }
        
        $api->disconnect();
        echo "<hr>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Hata: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Dosya: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Satır: " . $e->getLine() . "</p>";
}
?> 