<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../../src/Services/MikrotikService.php';

try {
    $ip = $_GET['ip'] ?? '';
    $username = $_GET['username'] ?? '';
    $password = $_GET['password'] ?? '';
    
    if (empty($ip) || empty($username) || empty($password)) {
        throw new Exception('Missing required parameters');
    }
    
    $mikrotikService = new \App\Services\MikrotikService();
    
    // Gerçek Mikrotik cihazına bağlanmaya çalış
    $interfaces = $mikrotikService->getInterfaces($ip, $username, $password);
    
    if ($interfaces === false) {
        // Bağlanamazsa mock data döndür - sadece fiziksel interface'ler
        $mockInterfaces = [
            [
                'name' => 'ether1',
                'type' => 'ether',
                'running' => true,
                'rxByte' => rand(1000000, 10000000),
                'txByte' => rand(500000, 5000000)
            ],
            [
                'name' => 'ether2',
                'type' => 'ether',
                'running' => true,
                'rxByte' => rand(2000000, 15000000),
                'txByte' => rand(1000000, 8000000)
            ],
            [
                'name' => 'wlan1',
                'type' => 'wlan',
                'running' => true,
                'rxByte' => rand(500000, 3000000),
                'txByte' => rand(300000, 2000000)
            ],
            [
                'name' => 'bridge1',
                'type' => 'bridge',
                'running' => true,
                'rxByte' => rand(1000000, 5000000),
                'txByte' => rand(500000, 3000000)
            ]
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $mockInterfaces,
            'warning' => 'Could not connect to real device, showing mock data'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => $interfaces
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
