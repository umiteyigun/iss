<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Çalışan projedeki RouterosAPI sınıfını doğrudan kullan
require_once __DIR__ . '/../src/Services/Mikrotik/RouterosAPI.php';

echo "<h1>Çalışan RouterosAPI Test</h1>";

$API = new RouterosAPI();
$API->debug = true;

$nasList = [
    ['nasname' => '172.16.16.9', 'naspassword' => 'As081316', 'ruser' => 'admin'],
    ['nasname' => '192.168.9.1', 'naspassword' => 'As081316+a', 'ruser' => 'admin']
];

foreach ($nasList as $nas) {
    echo "<h3>Testing NAS: " . htmlspecialchars($nas['nasname']) . "</h3>";
    echo "Username: " . htmlspecialchars($nas['ruser']) . "<br>";
    echo "Password: " . htmlspecialchars(substr($nas['naspassword'], 0, 5) . '...') . "<br>";
    
    if ($API->connect($nas['nasname'], $nas['ruser'], $nas['naspassword'])) {
        echo "<span style='color:green'>Bağlantı başarılı!</span><br>";
        
        // Online kullanıcı sayısını al
        $ARRAY = $API->comm("/ppp/active/print", array("count-only" => ""));
        if (isset($ARRAY[0]['ret'])) {
            echo "Online users: " . $ARRAY[0]['ret'] . "<br>";
        } else {
            echo "Online users: 0<br>";
        }
        
        $API->disconnect();
    } else {
        echo "<span style='color:red'>Bağlantı başarısız!</span><br>";
        echo "Hata kodu: " . $API->error_no . "<br>";
        echo "Hata mesajı: " . $API->error_str . "<br>";
    }
}

if ($API->connect('192.168.9.1', 'admin', 'As081316+a')) {
    echo "<span style='color:green'>Bağlantı başarılı!</span><br>";
    $ARRAY = $API->comm("/ppp/active/print");
    echo "<pre>";
    print_r($ARRAY);
    echo "</pre>";
    $API->disconnect();
} else {
    echo "<span style='color:red'>Bağlantı başarısız!</span><br>";
    echo "Hata kodu: " . $API->error_no . "<br>";
    echo "Hata mesajı: " . $API->error_str . "<br>";
}
?> 