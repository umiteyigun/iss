<?php
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Services/MikrotikService.php';
require_once __DIR__ . '/../src/models/NasModel.php';

// Debug modunu aktif et
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Mikrotik Tüm NAS Cihazları Debug</h2>";

try {
    $nasModel = new \App\Models\NasModel();
    $mikrotikService = new \App\Services\MikrotikService();
    
    // Tüm NAS cihazlarını al
    $nasList = $nasModel->getAllNas();
    
    echo "<h3>Toplam NAS Cihazı: " . count($nasList) . "</h3>";
    
    if (empty($nasList)) {
        echo "<p style='color: red;'>Hiç NAS cihazı bulunamadı!</p>";
        exit;
    }
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>NAS IP</th>";
    echo "<th>Shortname</th>";
    echo "<th>Username</th>";
    echo "<th>Bağlantı Durumu</th>";
    echo "<th>Online Kullanıcı</th>";
    echo "<th>Detaylar</th>";
    echo "</tr>";
    
    $totalOnlineUsers = 0;
    $successfulConnections = 0;
    
    foreach ($nasList as $nas) {
        $nasIp = $nas['nasname'];
        $shortname = $nas['shortname'] ?? 'N/A';
        $username = $nas['ruser'] ?? 'admin';
        $password = $nas['naspassword'];
        
        echo "<tr>";
        echo "<td><strong>$nasIp</strong></td>";
        echo "<td>$shortname</td>";
        echo "<td>$username</td>";
        
        try {
            // Bağlantıyı test et
            $onlineUsers = $mikrotikService->getPppActiveConnections($nasIp, $username, $password);
            
            if ($onlineUsers >= 0) {
                echo "<td style='color: green;'>✅ Başarılı</td>";
                echo "<td style='font-weight: bold; color: blue;'>$onlineUsers</td>";
                $totalOnlineUsers += $onlineUsers;
                $successfulConnections++;
                
                // Detaylı bilgi al
                $details = $mikrotikService->getPppActiveConnectionsDetails($nasIp, $username, $password);
                if (!empty($details)) {
                    echo "<td>";
                    echo "<details>";
                    echo "<summary>Kullanıcı Listesi (" . count($details) . ")</summary>";
                    echo "<ul style='font-size: 12px;'>";
                    foreach ($details as $user) {
                        $userName = $user['name'] ?? 'N/A';
                        $userIp = $user['address'] ?? 'N/A';
                        $userUptime = $user['uptime'] ?? 'N/A';
                        echo "<li><strong>$userName</strong> - IP: $userIp - Uptime: $userUptime</li>";
                    }
                    echo "</ul>";
                    echo "</details>";
                    echo "</td>";
                } else {
                    echo "<td style='color: gray;'>Detay yok</td>";
                }
            } else {
                echo "<td style='color: red;'>❌ Başarısız</td>";
                echo "<td style='color: red;'>Hata</td>";
                echo "<td style='color: red;'>Bağlantı hatası</td>";
            }
            
        } catch (Exception $e) {
            echo "<td style='color: red;'>❌ Hata</td>";
            echo "<td style='color: red;'>Exception</td>";
            echo "<td style='color: red;'>" . htmlspecialchars($e->getMessage()) . "</td>";
        }
        
        echo "</tr>";
    }
    
    echo "</table>";
    
    echo "<h3>Özet:</h3>";
    echo "<ul>";
    echo "<li><strong>Toplam NAS Cihazı:</strong> " . count($nasList) . "</li>";
    echo "<li><strong>Başarılı Bağlantı:</strong> $successfulConnections</li>";
    echo "<li><strong>Başarısız Bağlantı:</strong> " . (count($nasList) - $successfulConnections) . "</li>";
    echo "<li><strong>Toplam Online Kullanıcı:</strong> <span style='color: blue; font-weight: bold;'>$totalOnlineUsers</span></li>";
    echo "</ul>";
    
    // MikrotikService'in getPppActiveConnectionsList metodunu test et
    echo "<h3>getPppActiveConnectionsList() Test:</h3>";
    $allConnections = $mikrotikService->getPppActiveConnectionsList();
    echo "<p><strong>Toplam Bağlantı:</strong> " . count($allConnections) . "</p>";
    
    if (!empty($allConnections)) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%; font-size: 12px;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>Username</th>";
        echo "<th>IP Address</th>";
        echo "<th>NAS IP</th>";
        echo "<th>Service</th>";
        echo "<th>Uptime</th>";
        echo "</tr>";
        
        foreach ($allConnections as $connection) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($connection['username']) . "</td>";
            echo "<td>" . htmlspecialchars($connection['ip_address']) . "</td>";
            echo "<td>" . htmlspecialchars($connection['nas_ip']) . "</td>";
            echo "<td>" . htmlspecialchars($connection['service']) . "</td>";
            echo "<td>" . htmlspecialchars($connection['uptime']) . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p style='color: red;'>Hiç bağlantı bulunamadı!</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Genel hata: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?> 