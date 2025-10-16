<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/models/UserModel.php';

echo "<h1>Arama Debug Testi</h1>";

try {
    $userModel = new \App\Models\UserModel();
    $searchTerm = 'adenyum';
    
    echo "<h2>1. Veritabanı Bağlantısı Testi</h2>";
    $pdo = \App\Database::getConnection();
    echo "Veritabanı bağlantısı başarılı<br>";
    
    echo "<h2>2. usersInfo Tablosunda 'adenyum' Arama</h2>";
    $stmt = $pdo->prepare("SELECT * FROM usersInfo WHERE username LIKE ? OR name LIKE ? OR lastname LIKE ? OR email LIKE ?");
    $searchPattern = '%' . $searchTerm . '%';
    $stmt->execute([$searchPattern, $searchPattern, $searchPattern, $searchPattern]);
    $results = $stmt->fetchAll();
    
    echo "usersInfo tablosunda bulunan kayıtlar:<br>";
    if (empty($results)) {
        echo "<strong>Hiç kayıt bulunamadı!</strong><br>";
    } else {
        foreach ($results as $row) {
            echo "Username: " . htmlspecialchars($row['username']) . 
                 ", Name: " . htmlspecialchars($row['name'] ?? 'NULL') . 
                 ", Lastname: " . htmlspecialchars($row['lastname'] ?? 'NULL') . 
                 ", Email: " . htmlspecialchars($row['email'] ?? 'NULL') . "<br>";
        }
    }
    
    echo "<h2>3. radcheck Tablosunda 'adenyum' Arama</h2>";
    $stmt = $pdo->prepare("SELECT * FROM radcheck WHERE username LIKE ? AND attribute = 'Cleartext-Password'");
    $stmt->execute([$searchPattern]);
    $results = $stmt->fetchAll();
    
    echo "radcheck tablosunda bulunan kayıtlar:<br>";
    if (empty($results)) {
        echo "<strong>Hiç kayıt bulunamadı!</strong><br>";
    } else {
        foreach ($results as $row) {
            echo "Username: " . htmlspecialchars($row['username']) . 
                 ", Attribute: " . htmlspecialchars($row['attribute']) . 
                 ", Value: " . htmlspecialchars($row['value']) . "<br>";
        }
    }
    
    echo "<h2>4. Tüm Kullanıcılar (İlk 10)</h2>";
    $stmt = $pdo->query("SELECT username FROM radcheck WHERE attribute = 'Cleartext-Password' LIMIT 10");
    $allUsers = $stmt->fetchAll();
    
    echo "Mevcut kullanıcılar:<br>";
    foreach ($allUsers as $user) {
        echo htmlspecialchars($user['username']) . "<br>";
    }
    
    echo "<h2>5. searchUsers Metodu Testi</h2>";
    $searchResults = $userModel->searchUsers($searchTerm, 1, 10);
    echo "searchUsers metodu sonucu: " . count($searchResults) . " kayıt<br>";
    
    if (!empty($searchResults)) {
        foreach ($searchResults as $user) {
            echo "Username: " . htmlspecialchars($user['username']) . 
                 ", Name: " . htmlspecialchars($user['name'] ?? 'NULL') . 
                 ", Email: " . htmlspecialchars($user['email'] ?? 'NULL') . "<br>";
        }
    }
    
    echo "<h2>6. getSearchUserCount Metodu Testi</h2>";
    $count = $userModel->getSearchUserCount($searchTerm);
    echo "Arama sonucu sayısı: " . $count . "<br>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Hata: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Dosya: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Satır: " . $e->getLine() . "</p>";
}
?> 