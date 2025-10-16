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
    $systemResource = $mikrotikService->getSystemResource($ip, $username, $password);
    
    if ($systemResource === false) {
        // Bağlanamazsa mock data döndür
        $mockData = [
            'uptime' => '2d 14h 23m 45s',
            'version' => '7.8.1',
            'architecture' => 'mipsbe',
            'boardName' => 'RB750Gr3',
            'cpuLoad' => rand(10, 80),
            'memoryTotal' => 128 * 1024 * 1024, // 128MB
            'memoryUsed' => rand(64, 100) * 1024 * 1024, // 64-100MB
            'freeMemory' => rand(28, 64) * 1024 * 1024, // 28-64MB
            'totalHdd' => 1024 * 1024 * 1024, // 1GB
            'freeHdd' => rand(500, 800) * 1024 * 1024, // 500-800MB
            'activeUsers' => rand(5, 25),
            'mock' => true
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $mockData,
            'warning' => 'Could not connect to real device, showing mock data'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => $systemResource
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
