<?php
require_once 'src/Database.php';

echo "<h1>NAS Tablosu Debug</h1>";

try {
    $pdo = \App\Database::getConnection();
    echo "✅ Veritabanı bağlantısı başarılı<br><br>";
    
    // nas tablosundaki verileri kontrol et
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM nas');
    $count = $stmt->fetch();
    echo "📊 nas tablosunda toplam <strong>" . $count['total'] . "</strong> kayıt var<br><br>";
    
    if ($count['total'] > 0) {
        // İlk birkaç kaydı göster
        $stmt = $pdo->query('SELECT nasname, shortname, ruser, naspassword, secret, description FROM nas LIMIT 5');
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "📋 İlk 5 kayıt:<br>";
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr><th>IP (nasname)</th><th>Short Name</th><th>User</th><th>Password</th><th>Secret</th><th>Description</th></tr>";
        foreach($records as $record) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($record['nasname'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($record['shortname'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($record['ruser'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($record['naspassword'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($record['secret'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($record['description'] ?? 'NULL') . "</td>";
            echo "</tr>";
        }
        echo "</table><br>";
        
        // NasModel testi
        echo "<h2>NasModel Testi</h2>";
        require_once 'src/models/NasModel.php';
        $nasModel = new \App\Models\NasModel();
        $allNas = $nasModel->getAllNas();
        echo "📊 NasModel->getAllNas() sonucu: " . count($allNas) . " kayıt<br>";
        
        if (!empty($allNas)) {
            echo "✅ NasModel çalışıyor<br>";
            echo "<pre>" . print_r($allNas[0], true) . "</pre>";
        } else {
            echo "❌ NasModel boş dizi döndürüyor<br>";
        }
        
        // MikrotikService testi
        echo "<h2>MikrotikService Testi</h2>";
        require_once 'src/Services/MikrotikService.php';
        $mikrotikService = new \App\Services\MikrotikService();
        $routersWithResources = $mikrotikService->getAllNasWithResources();
        echo "📊 MikrotikService->getAllNasWithResources() sonucu: " . count($routersWithResources) . " kayıt<br>";
        
        if (!empty($routersWithResources)) {
            echo "✅ MikrotikService çalışıyor<br>";
            echo "<pre>" . print_r($routersWithResources[0], true) . "</pre>";
        } else {
            echo "❌ MikrotikService boş dizi döndürüyor<br>";
        }
        
    } else {
        echo "❌ nas tablosu boş!<br>";
    }
    
} catch(Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}
?>
