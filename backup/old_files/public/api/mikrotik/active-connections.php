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
    $connections = $mikrotikService->getPppActiveConnections($ip, $username, $password);
    
    if ($connections === false) {
        // Bağlanamazsa mock data döndür
        $mockConnections = [
            [
                'user' => 'user001',
                'address' => '192.168.1.100',
                'uptime' => '2h 15m',
                'bytesIn' => rand(1000000, 10000000),
                'bytesOut' => rand(500000, 5000000)
            ],
            [
                'user' => 'user002',
                'address' => '192.168.1.101',
                'uptime' => '1h 45m',
                'bytesIn' => rand(2000000, 15000000),
                'bytesOut' => rand(1000000, 8000000)
            ],
            [
                'user' => 'user003',
                'address' => '192.168.1.102',
                'uptime' => '3h 30m',
                'bytesIn' => rand(500000, 3000000),
                'bytesOut' => rand(300000, 2000000)
            ]
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $mockConnections,
            'warning' => 'Could not connect to real device, showing mock data'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => $connections
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
