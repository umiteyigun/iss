<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/models/NasModel.php';
require_once __DIR__ . '/../src/Services/MikrotikService.php';

echo "<h1>NAS Bağlantı Detayları</h1>";

try {
    $nasModel = new \App\Models\NasModel();
    $nasList = $nasModel->getAllNas();
    
    echo "<h2>NAS Listesi ve Bağlantı Sayıları</h2>";
    
    $totalConnections = 0;
    
    foreach ($nasList as $nas) {
        echo "<h3>NAS: " . htmlspecialchars($nas['nasname']) . "</h3>";
        echo "Username: " . htmlspecialchars($nas['ruser']) . "<br>";
        echo "Password: " . htmlspecialchars($nas['naspassword']) . "<br>";
        
        $mikrotikService = new \App\Services\MikrotikService();
        $connections = $mikrotikService->getPppActiveConnections(
            $nas['nasname'], 
            $nas['ruser'], 
            $nas['naspassword']
        );
        
        echo "<strong>Bağlantı Sayısı: " . $connections . "</strong><br>";
        $totalConnections += $connections;
        
        echo "<hr>";
    }
    
    echo "<h2>Toplam Bağlantı Sayısı: " . $totalConnections . "</h2>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Hata: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?> 