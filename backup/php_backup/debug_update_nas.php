<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Database.php';

echo "<h1>NAS Bilgilerini Güncelle</h1>";

try {
    $db = new \App\Database();
    $pdo = $db->getConnection();
    
    // Mevcut NAS bilgilerini göster
    echo "<h2>Mevcut NAS Bilgileri:</h2>";
    $stmt = $pdo->query("SELECT * FROM nas");
    $nasList = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<pre>";
    print_r($nasList);
    echo "</pre>";
    
    // NAS bilgilerini güncelle
    echo "<h2>NAS Bilgilerini Güncelliyorum...</h2>";
    
    // 172.16.16.1 IP'sini ekle/güncelle
    $stmt = $pdo->prepare("INSERT INTO nas (nasname, naspassword, ruser) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE naspassword = VALUES(naspassword), ruser = VALUES(ruser)");
    
    $stmt->execute(['172.16.16.1', 'As081316', 'admin']);
    echo "✅ 172.16.16.1 eklendi/güncellendi<br>";
    
    // 192.168.9.1'i güncelle
    $stmt->execute(['192.168.9.1', 'As081316+a', 'admin']);
    echo "✅ 192.168.9.1 güncellendi<br>";
    
    echo "<h2>Güncellenmiş NAS Bilgileri:</h2>";
    $stmt = $pdo->query("SELECT * FROM nas");
    $nasList = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<pre>";
    print_r($nasList);
    echo "</pre>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Hata: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?> 