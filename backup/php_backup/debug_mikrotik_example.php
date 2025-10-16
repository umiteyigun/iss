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

echo "<h1>Mikrotik API Örnek Test</h1>";

// Test IP'leri
$testIPs = ['172.16.16.1', '192.168.9.1'];

foreach ($testIPs as $ip) {
    echo "<h2>Testing IP: " . htmlspecialchars($ip) . "</h2>";
    
    $API = new \App\Services\Mikrotik\RouterosAPI();
    $API->debug = true;
    
    if ($API->connect($ip, 'admin', 'AS081316+a')) {
        echo "<span style='color:green'>✅ Bağlantı başarılı!</span><br>";
        
        // System resource bilgileri
        echo "<h3>System Resource:</h3>";
        $ARRAY = $API->comm("/system/resource/print");
        if (isset($ARRAY[0])) {
            echo "CPU Load: " . $ARRAY[0]['cpu-load'] . "<br>";
            echo "Free Memory: " . number_format(($ARRAY[0]['free-memory']/1024)/1024,2) . " MB<br>";
            echo "Uptime: " . $ARRAY[0]['uptime'] . "<br>";
            echo "Version: " . $ARRAY[0]['version'] . "<br>";
        }
        
        // PPP Active Connections
        echo "<h3>PPP Active Connections:</h3>";
        $ARRAY = $API->comm("/ppp/active/print");
        $pppCount = count($ARRAY);
        echo "PPP Active Count: " . $pppCount . "<br>";
        
        if ($pppCount > 0) {
            echo "<h4>İlk 5 bağlantı:</h4>";
            echo "<pre>";
            for ($i = 0; $i < min(5, $pppCount); $i++) {
                print_r($ARRAY[$i]);
            }
            echo "</pre>";
        }
        
        // System Health
        echo "<h3>System Health:</h3>";
        $ARRAY = $API->comm("/system/health/print");
        if (isset($ARRAY[0])) {
            echo "Voltage: " . $ARRAY[0]['voltage'] . "<br>";
            echo "Temperature: " . $ARRAY[0]['temperature'] . "<br>";
        }
        
        $API->disconnect();
        
    } else {
        echo "<span style='color:red'>❌ Bağlantı başarısız!</span><br>";
        echo "Hata kodu: " . $API->error_no . "<br>";
        echo "Hata mesajı: " . $API->error_str . "<br>";
    }
    
    echo "<hr>";
}
?> 