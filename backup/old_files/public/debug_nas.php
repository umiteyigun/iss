<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/models/NasModel.php';

echo "<h1>NAS Tablosu Debug (Güncellenmiş)</h1>";

try {
    $pdo = \App\Database::getConnection();
    $nasModel = new \App\Models\NasModel();
    
    echo "<h2>1. NAS Tablosu Yapısı</h2>";
    $stmt = $pdo->query("DESCRIBE nas");
    $columns = $stmt->fetchAll();
    
    echo "<table border='1'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($column['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Key']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Default']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Extra']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h2>2. NAS Tablosu Verileri (ruser dahil)</h2>";
    $stmt = $pdo->query("SELECT * FROM nas");
    $nasDevices = $stmt->fetchAll();
    
    if (empty($nasDevices)) {
        echo "<p>NAS tablosunda hiç kayıt yok!</p>";
    } else {
        echo "<table border='1'>";
        echo "<tr><th>ID</th><th>NAS Name</th><th>Short Name</th><th>Type</th><th>Ports</th><th>Secret</th><th>Server</th><th>Community</th><th>Description</th><th>NAS Password</th><th>RUser</th></tr>";
        foreach ($nasDevices as $nas) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($nas['id'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($nas['nasname'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($nas['shortname'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($nas['type'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($nas['ports'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars(substr($nas['secret'] ?? '', 0, 10) . '...') . "</td>";
            echo "<td>" . htmlspecialchars($nas['server'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($nas['community'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($nas['description'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars(substr($nas['naspassword'] ?? '', 0, 10) . '...') . "</td>";
            echo "<td>" . htmlspecialchars($nas['ruser'] ?? 'N/A') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    echo "<h2>3. NasModel->getAllNas() Sonucu</h2>";
    $nasList = $nasModel->getAllNas();
    echo "<pre>";
    print_r($nasList);
    echo "</pre>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Hata: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Dosya: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Satır: " . $e->getLine() . "</p>";
}
?> 