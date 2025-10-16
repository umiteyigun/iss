<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/models/UserModel.php';

echo "<h1>Dashboard İstatistikleri Debug</h1>";

try {
    $userModel = new \App\Models\UserModel();
    $pdo = \App\Database::getConnection();
    
    echo "<h2>1. getUserStats() Metodu Sonuçları</h2>";
    $stats = $userModel->getUserStats();
    echo "<pre>";
    print_r($stats);
    echo "</pre>";
    
    echo "<h2>2. Detaylı Kontroller</h2>";
    
    // Total Users
    $totalStmt = $pdo->query("SELECT COUNT(*) FROM radcheck WHERE attribute = 'Cleartext-Password'");
    $totalUsers = $totalStmt->fetchColumn();
    echo "Toplam Kullanıcı: " . $totalUsers . "<br>";
    
    // Online Users
    $onlineStmt = $pdo->query("SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL");
    $onlineUsers = $onlineStmt->fetchColumn();
    echo "Online Kullanıcı: " . $onlineUsers . "<br>";
    
    // Active Users (with valid expiration)
    $activeStmt = $pdo->query("
        SELECT COUNT(DISTINCT rc.username) 
        FROM radcheck rc
        WHERE rc.attribute = 'Cleartext-Password'
        AND EXISTS (
            SELECT 1 FROM radcheck rc2 
            WHERE rc2.username = rc.username 
            AND rc2.attribute = 'Expiration' 
            AND rc2.value > NOW()
        )
    ");
    $activeUsers = $activeStmt->fetchColumn();
    echo "Aktif Abone: " . $activeUsers . "<br>";
    
    // Expired Users
    $expiredStmt = $pdo->query("
        SELECT COUNT(DISTINCT rc.username) 
        FROM radcheck rc
        WHERE rc.attribute = 'Cleartext-Password'
        AND EXISTS (
            SELECT 1 FROM radcheck rc2 
            WHERE rc2.username = rc.username 
            AND rc2.attribute = 'Expiration' 
            AND rc2.value <= NOW()
        )
    ");
    $expiredUsers = $expiredStmt->fetchColumn();
    echo "Süresi Dolmuş Abone: " . $expiredUsers . "<br>";
    
    echo "<h2>3. Örnek Kullanıcılar</h2>";
    
    // Sample active users
    $sampleActiveStmt = $pdo->query("
        SELECT rc.username, rc2.value as expire_date
        FROM radcheck rc
        JOIN radcheck rc2 ON rc.username = rc2.username AND rc2.attribute = 'Expiration'
        WHERE rc.attribute = 'Cleartext-Password'
        AND rc2.value > NOW()
        LIMIT 5
    ");
    $sampleActive = $sampleActiveStmt->fetchAll();
    
    echo "Aktif Abone Örnekleri:<br>";
    foreach ($sampleActive as $user) {
        echo "- " . htmlspecialchars($user['username']) . " (Bitiş: " . htmlspecialchars($user['expire_date']) . ")<br>";
    }
    
    // Sample expired users
    $sampleExpiredStmt = $pdo->query("
        SELECT rc.username, rc2.value as expire_date
        FROM radcheck rc
        JOIN radcheck rc2 ON rc.username = rc2.username AND rc2.attribute = 'Expiration'
        WHERE rc.attribute = 'Cleartext-Password'
        AND rc2.value <= NOW()
        LIMIT 5
    ");
    $sampleExpired = $sampleExpiredStmt->fetchAll();
    
    echo "<br>Süresi Dolmuş Abone Örnekleri:<br>";
    foreach ($sampleExpired as $user) {
        echo "- " . htmlspecialchars($user['username']) . " (Bitiş: " . htmlspecialchars($user['expire_date']) . ")<br>";
    }
    
    // Sample online users
    $sampleOnlineStmt = $pdo->query("
        SELECT username, acctstarttime
        FROM radacct 
        WHERE acctstoptime IS NULL
        LIMIT 5
    ");
    $sampleOnline = $sampleOnlineStmt->fetchAll();
    
    echo "<br>Online Kullanıcı Örnekleri:<br>";
    foreach ($sampleOnline as $user) {
        echo "- " . htmlspecialchars($user['username']) . " (Başlangıç: " . htmlspecialchars($user['acctstarttime']) . ")<br>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Hata: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Dosya: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Satır: " . $e->getLine() . "</p>";
}
?> 