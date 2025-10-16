<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Çalışan projedeki RouterosAPI sınıfını kullan
require_once __DIR__ . '/../test/api/routeros_api.class.php';

echo "<h1>Çalışan Proje RouterosAPI Test</h1>";

$API = new RouterosAPI();
$API->debug = true;

$nasList = [
    ['nasname' => '172.16.16.9', 'naspassword' => 'As081316'],
    ['nasname' => '192.168.9.1', 'naspassword' => 'As081316+a']
];

foreach ($nasList as $nas) {
    echo "<h3>Testing NAS: " . htmlspecialchars($nas['nasname']) . "</h3>";
    
    if ($API->connect($nas['nasname'], 'admin', $nas['naspassword'])) {
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
?> 