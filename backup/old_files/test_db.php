<?php
require_once 'src/Database.php';

try {
    $pdo = \App\Database::getConnection();
    
    // radcheck tablosunun yapısını kontrol et
    $stmt = $pdo->query("DESCRIBE radcheck");
    echo "radcheck tablosu yapısı:\n";
    while ($row = $stmt->fetch()) {
        print_r($row);
    }
    
    // radcheck tablosundan birkaç örnek veri al
    $stmt = $pdo->query("SELECT * FROM radcheck LIMIT 3");
    echo "\nradcheck tablosundan örnek veriler:\n";
    while ($row = $stmt->fetch()) {
        print_r($row);
    }
    
    // userInvoices tablosunun yapısını da kontrol et
    $stmt = $pdo->query("DESCRIBE userInvoices");
    echo "\nuserInvoices tablosu yapısı:\n";
    while ($row = $stmt->fetch()) {
        print_r($row);
    }
    
} catch (Exception $e) {
    echo "Hata: " . $e->getMessage();
}
?> 