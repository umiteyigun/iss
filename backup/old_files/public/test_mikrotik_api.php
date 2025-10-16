<?php
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Services/MikrotikService.php';
require_once __DIR__ . '/../src/models/NasModel.php';

// Hata raporlamayı etkinleştir
error_reporting(E_ALL);
ini_set('display_errors', 1);

// MySQL 5.1.73 için optimize edilmiş ayarlar
ini_set('max_execution_time', 300); // 5 dakika
ini_set('memory_limit', '512M');

echo "<h1>Mikrotik API Bağlantı Testi (MySQL 5.1.73 Optimized)</h1>";

try {
    // Database bağlantısı
    $pdo = \App\Database::getConnection();
    
    echo "<h2>1. Database Bağlantısı</h2>";
    echo "✅ Database bağlantısı başarılı<br>";
    
    // MySQL ayarlarını kontrol et
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'wait_timeout'");
    $waitTimeout = $stmt->fetch();
    echo "Wait Timeout: " . $waitTimeout['Value'] . " saniye<br>";
    
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'interactive_timeout'");
    $interactiveTimeout = $stmt->fetch();
    echo "Interactive Timeout: " . $interactiveTimeout['Value'] . " saniye<br>";
    
    // NAS listesini al
    $stmt = $pdo->query("SELECT nasname, ruser, naspassword, secret FROM nas ORDER BY nasname");
    $nasList = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>2. NAS Listesi</h2>";
    echo "Toplam " . count($nasList) . " NAS bulundu:<br>";
    foreach ($nasList as $nas) {
        echo "- IP: " . htmlspecialchars($nas['nasname']) . 
             ", User: " . htmlspecialchars($nas['ruser'] ?? 'admin') . 
             ", Password: " . str_repeat('*', strlen($nas['naspassword'])) . "<br>";
    }
    
    // MikrotikService'i test et
    echo "<h2>3. MikrotikService Testi</h2>";
    $mikrotikService = new \App\Services\MikrotikService();
    
    // Debug modunu etkinleştir
    $mikrotikService->enableDebug();
    
    foreach ($nasList as $nas) {
        $ip = $nas['nasname'];
        $username = $nas['ruser'] ?? 'admin';
        $password = $nas['naspassword'];
        
        echo "<h3>Testing: $ip</h3>";
        
        // Bağlantı testi
        echo "🔌 Bağlantı testi...<br>";
        $connections = $mikrotikService->getPppActiveConnections($ip, $username, $password);
        
        if ($connections >= 0) {
            echo "✅ Bağlantı başarılı - $connections aktif bağlantı<br>";
            
            // Detaylı bilgi al
            $details = $mikrotikService->getPppActiveConnectionsDetails($ip, $username, $password);
            if (!empty($details)) {
                echo "📋 Detaylı bilgiler:<br>";
                echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
                echo "<tr><th>Kullanıcı</th><th>IP</th><th>MAC</th><th>Durum</th></tr>";
                foreach ($details as $user) {
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($user['name'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['address'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['caller-id'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['service'] ?? 'N/A') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
        } else {
            echo "❌ Bağlantı başarısız<br>";
        }
        
        echo "<hr>";
    }
    
    // Toplam bağlantı sayısını al
    echo "<h2>4. Toplam Bağlantı Sayısı</h2>";
    try {
        $totalConnections = $mikrotikService->getPppActiveConnectionsFromAllNas();
        echo "Toplam aktif bağlantı: $totalConnections<br>";
    } catch (Exception $e) {
        echo "❌ Hata: " . htmlspecialchars($e->getMessage()) . "<br>";
        // Bağlantıyı yeniden dene
        \App\Database::reconnect();
        try {
            $totalConnections = $mikrotikService->getPppActiveConnectionsFromAllNas();
            echo "✅ Yeniden deneme başarılı - Toplam aktif bağlantı: $totalConnections<br>";
        } catch (Exception $e2) {
            echo "❌ Yeniden deneme de başarısız: " . htmlspecialchars($e2->getMessage()) . "<br>";
        }
    }
    
    // Detaylı liste al
    echo "<h2>5. Tüm Aktif Bağlantılar</h2>";
    try {
        $allConnections = $mikrotikService->getPppActiveConnectionsList();
        echo "Toplam " . count($allConnections) . " aktif bağlantı bulundu:<br>";
        
        if (!empty($allConnections)) {
            echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
            echo "<tr><th>NAS</th><th>Kullanıcı</th><th>IP</th><th>MAC</th><th>Durum</th></tr>";
            foreach ($allConnections as $connection) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($connection['nas_ip'] ?? 'N/A') . "</td>";
                echo "<td>" . htmlspecialchars($connection['username'] ?? 'N/A') . "</td>";
                echo "<td>" . htmlspecialchars($connection['ip_address'] ?? 'N/A') . "</td>";
                echo "<td>" . htmlspecialchars($connection['caller_id'] ?? 'N/A') . "</td>";
                echo "<td>" . htmlspecialchars($connection['service'] ?? 'N/A') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } catch (Exception $e) {
        echo "❌ Hata: " . htmlspecialchars($e->getMessage()) . "<br>";
        // Bağlantıyı yeniden dene
        \App\Database::reconnect();
        try {
            $allConnections = $mikrotikService->getPppActiveConnectionsList();
            echo "✅ Yeniden deneme başarılı - Toplam " . count($allConnections) . " aktif bağlantı bulundu<br>";
        } catch (Exception $e2) {
            echo "❌ Yeniden deneme de başarısız: " . htmlspecialchars($e2->getMessage()) . "<br>";
        }
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Hata</h2>";
    echo "Hata: " . htmlspecialchars($e->getMessage()) . "<br>";
    echo "Dosya: " . htmlspecialchars($e->getFile()) . "<br>";
    echo "Satır: " . $e->getLine() . "<br>";
}

echo "<h2>6. Test Tamamlandı</h2>";
echo "Test tamamlandı. Yukarıdaki sonuçları kontrol edin.";
?> 