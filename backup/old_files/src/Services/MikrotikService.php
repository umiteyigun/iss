<?php

namespace App\Services;

use Exception;

class MikrotikService
{
    private $api;

    public function __construct(array $config = [])
    {
        // Eski projedeki RouterosAPI sınıfını kullan
        require_once __DIR__ . '/Mikrotik/RouterosAPI.php';
        $this->api = new \RouterosAPI();

        // API ayarları - önce SSL olmadan dene
        $this->api->ssl = false;
        $this->api->port = $config['port'] ?? 8728; // Standart Mikrotik portu

        // Timeout ayarları - gerçek cihazlar için
        $this->api->timeout = 10; // 10 saniye
        $this->api->attempts = 3; // 3 deneme
        $this->api->delay = 2; // 2 saniye bekleme
    }

    /**
     * Get system resource information from Mikrotik device
     */
    public function getSystemResource($ip, $username, $password)
    {
        error_log("MikrotikService: Attempting to connect to $ip with user $username");
        
        if (!$this->api->connect($ip, $username, $password)) {
            $error = $this->api->error ?? 'Unknown error';
            error_log("MikrotikService: Failed to connect to $ip - Error: $error");
            return false;
        }
        
        error_log("MikrotikService: Successfully connected to $ip");

        try {
            // System resource bilgilerini al
            $resource = $this->api->comm('/system/resource/print');
            $identity = $this->api->comm('/system/identity/print');
            $clock = $this->api->comm('/system/clock/print');
            
            $this->api->disconnect();

            if (empty($resource)) {
                return false;
            }

            $data = $resource[0];
            
            return [
                'uptime' => $data['uptime'] ?? 'N/A',
                'version' => $data['version'] ?? 'N/A',
                'architecture' => $data['architecture-name'] ?? 'N/A',
                'boardName' => $data['board-name'] ?? 'N/A',
                'cpuLoad' => isset($data['cpu-load']) ? (int)$data['cpu-load'] : 0,
                'memoryTotal' => isset($data['total-memory']) ? (int)$data['total-memory'] : 0,
                'memoryUsed' => isset($data['used-memory']) ? (int)$data['used-memory'] : 0,
                'freeMemory' => isset($data['free-memory']) ? (int)$data['free-memory'] : 0,
                'totalHdd' => isset($data['total-hdd-space']) ? (int)$data['total-hdd-space'] : 0,
                'freeHdd' => isset($data['free-hdd-space']) ? (int)$data['free-hdd-space'] : 0,
                'activeUsers' => $this->getActiveUserCount($ip, $username, $password)
            ];
        } catch (Exception $e) {
            $this->api->disconnect();
            return false;
        }
    }

    /**
     * Get network interfaces from Mikrotik device
     */
    public function getInterfaces($ip, $username, $password)
    {
        if (!$this->api->connect($ip, $username, $password)) {
            return false;
        }

        try {
            $interfaces = $this->api->comm('/interface/print');
            $this->api->disconnect();

            // Sadece fiziksel interface'leri filtrele - pppoe-in'leri çıkar
            $filteredInterfaces = [];
            foreach ($interfaces as $interface) {
                // pppoe-in'leri ve diğer sanal interface'leri çıkar
                if (in_array($interface['type'], ['ether', 'wlan', 'bridge', 'vlan', 'bond'])) {
                    $filteredInterfaces[] = [
                        'name' => $interface['name'],
                        'type' => $interface['type'],
                        'running' => $interface['running'] === 'true',
                        'rxByte' => (int)($interface['rx-byte'] ?? 0),
                        'txByte' => (int)($interface['tx-byte'] ?? 0)
                    ];
                }
            }

            return $filteredInterfaces;
        } catch (Exception $e) {
            $this->api->disconnect();
            return false;
        }
    }

    /**
     * Get active user count
     */
    private function getActiveUserCount($ip, $username, $password)
    {
        if (!$this->api->connect($ip, $username, $password)) {
            return 0;
        }

        try {
            $response = $this->api->comm('/ppp/active/print', ['count-only' => '']);
            $this->api->disconnect();

            return isset($response[0]['ret']) ? (int)$response[0]['ret'] : 0;
        } catch (Exception $e) {
            $this->api->disconnect();
            return 0;
        }
    }

    /**
     * Connects to a list of NAS devices and returns the total number of active PPPoE users.
     *
     * @param array $nasList An array of NAS devices, each an assoc array with 'nasname', 'secret', and 'username'.
     * @return int The total count of online users across all reachable devices.
     */
    public function getTotalOnlineUsers(array $nasList): int
    {
        $totalOnline = 0;

        foreach ($nasList as $nas) {
            $nasIp = $nas['nasname'];
            $nasSecret = $nas['secret'];
            $nasUsername = $nas['username'] ?? 'admin';
            
            if ($this->api->connect($nasIp, $nasUsername, $nasSecret)) {
                $response = $this->api->comm('/ppp/active/print', [
                    'count-only' => ''
                ]);
                $this->api->disconnect();

                if (isset($response[0]['ret'])) {
                    $totalOnline += (int)$response[0]['ret'];
                }
            }
        }

        return $totalOnline;
    }
    
    /**
     * Connects to a list of NAS devices and returns a detailed list of all active PPPoE users.
     *
     * @param array $nasList An array of NAS devices, each an assoc array with 'nasname', 'secret', and 'username'.
     * @return array A list of all online users with their details.
     */
    public function getOnlineUsers(array $nasList): array
    {
        $allOnlineUsers = [];

        foreach ($nasList as $nas) {
            $nasIp = $nas['nasname'];
            $nasSecret = $nas['secret'];
            $nasUsername = $nas['username'] ?? 'admin';
            
            if ($this->api->connect($nasIp, $nasUsername, $nasSecret)) {
                $activeUsersOnNas = $this->api->comm('/ppp/active/print');
                $this->api->disconnect();

                if (!empty($activeUsersOnNas)) {
                    foreach ($activeUsersOnNas as &$user) { // Use reference to modify
                        $user['nas'] = $nasIp;
                    }
                    $allOnlineUsers = array_merge($allOnlineUsers, $activeUsersOnNas);
                }
            }
        }

        return $allOnlineUsers;
    }

    /**
     * Finds and removes an active PPPoE user from a MikroTik router.
     *
     * @param string $nasIp The IP address of the MikroTik router (NAS).
     * @param string $nasSecret The password/secret for this specific NAS.
     * @param string $pppoeUser The PPPoE username to kick.
     * @return bool True on success, false on failure.
     */
    public function kickUser(string $nasIp, string $nasSecret, string $pppoeUser): bool
    {
        if ($this->api->connect($nasIp, 'admin', $nasSecret)) {
            $activeUsers = $this->api->comm('/ppp/active/print', [
                '?name' => $pppoeUser
            ]);

            if (!empty($activeUsers) && isset($activeUsers[0]['.id'])) {
                $this->api->comm('/ppp/active/remove', [
                    '.id' => $activeUsers[0]['.id']
                ]);
                $this->api->disconnect();
                return true;
            }

            $this->api->disconnect();
        }
        
        return false; // Connection failed or user not found
    }

    public function enableDebug()
    {
        $this->api->debug = true;
    }

    public function getPppActiveConnections($ip, $username, $password)
    {
        try {
            if (!$this->api->connect($ip, $username, $password)) {
                $this->api->debug("Bağlantı başarısız: " . $ip);
                return false;
            }

            // PPP active connections'ları çek
            $response = $this->api->comm('/ppp/active/print');
            
            if (is_array($response)) {
                $count = count($response);
                $this->api->debug("PPP Active Connections: " . $count);
                return $count;
            }
            
            return 0;
            
        } catch (Exception $e) {
            $this->api->debug("Hata: " . $e->getMessage());
            return false;
        } finally {
            if ($this->api->connected) {
                $this->api->disconnect();
            }
        }
    }

    public function getPppActiveConnectionsDetails($ip, $username, $password)
    {
        try {
            if (!$this->api->connect($ip, $username, $password)) {
                $this->api->debug("Bağlantı başarısız: " . $ip);
                return [];
            }

            // PPP active connections'ları detaylı çek
            $response = $this->api->comm('/ppp/active/print');
            
            if (is_array($response)) {
                $this->api->debug("PPP Active Connections Details: " . count($response) . " connections found");
                return $response;
            }
            
            return [];
            
        } catch (Exception $e) {
            $this->api->debug("Hata: " . $e->getMessage());
            return [];
        } finally {
            if ($this->api->connected) {
                $this->api->disconnect();
            }
        }
    }

    public function getPppActiveConnectionsFromAllNas()
    {
        $nasModel = new \App\Models\NasModel();
        $nasList = $nasModel->getAllNas();
        
        $totalConnections = 0;
        
        foreach ($nasList as $nas) {
            // Her NAS işleminden önce bağlantıyı kontrol et
            \App\Database::checkConnection();
            
            // Eski projedeki gibi dinamik IP ve şifre kullan
            $ip = $nas['nasname'];
            $secret = $nas['naspassword'];
            $username = $nas['ruser'] ?? 'admin';
            
            $connections = $this->getPppActiveConnections($ip, $username, $secret);
            
            // Eğer bir tanesi bile bağlanamazsa, işlemi durdur ve false döndür
            if ($connections === false) {
                return false;
            }
            
            $totalConnections += $connections;
        }
        
        return $totalConnections;
    }

    /**
     * Get detailed list of active PPP connections from all NAS devices
     * @return array Array of active connections with details
     */
    public function getPppActiveConnectionsList()
    {
        $nasModel = new \App\Models\NasModel();
        $nasList = $nasModel->getAllNas();
        $allConnections = [];

        foreach ($nasList as $nas) {
            try {
                // Her NAS işleminden önce bağlantıyı kontrol et
                \App\Database::checkConnection();
                
                $connections = $this->getPppActiveConnectionsFromNas(
                    $nas['nasname'], 
                    $nas['ruser'], 
                    $nas['naspassword']
                );
                
                // Add NAS information to each connection
                foreach ($connections as $connection) {
                    $connection['nas_ip'] = $nas['nasname'];
                    $connection['nas_name'] = $nas['shortname'] ?? $nas['nasname'];
                    $allConnections[] = $connection;
                }
                
            } catch (Exception $e) {
                error_log("Error getting connections from NAS {$nas['nasname']}: " . $e->getMessage());
                continue;
            }
        }

        return $allConnections;
    }

    /**
     * Get detailed list of active PPP connections from a specific NAS
     * @param string $nasIp NAS IP address
     * @param string $username Username for NAS
     * @param string $password Password for NAS
     * @return array Array of active connections with details
     */
    private function getPppActiveConnectionsFromNas($nasIp, $username, $password)
    {
        try {
            $api = new \RouterosAPI();
            // SSL ayarlarını bu yerel nesne için de yapılandır
            $api->ssl = true;
            $api->port = 8729;
            $api->debug = false;
            
            // Timeout ayarlarını hızlandır
            $api->timeout = 2; // 2 saniye
            $api->attempts = 1; // Sadece 1 deneme
            $api->delay = 1; // 1 saniye bekleme
            
            if ($api->connect($nasIp, $username, $password)) {
                $response = $api->comm('/ppp/active/print');
                $api->disconnect();
                
                $connections = [];
                foreach ($response as $connection) {
                    $connections[] = [
                        'username' => $connection['name'] ?? 'N/A',
                        'ip_address' => $connection['address'] ?? 'N/A',
                        'service' => $connection['service'] ?? 'N/A',
                        'uptime' => $connection['uptime'] ?? 'N/A',
                        'encoding' => $connection['encoding'] ?? 'N/A',
                        'session_id' => $connection['.id'] ?? 'N/A',
                        'caller_id' => $connection['caller-id'] ?? 'N/A',
                        'limit_bytes_in' => $connection['limit-bytes-in'] ?? 'N/A',
                        'limit_bytes_out' => $connection['limit-bytes-out'] ?? 'N/A',
                        'radius' => $connection['radius'] ?? 'N/A',
                        'dynamic' => $connection['dynamic'] ?? 'N/A',
                        'running' => $connection['running'] ?? 'N/A'
                    ];
                }
                
                return $connections;
            }
        } catch (Exception $e) {
            error_log("Error connecting to NAS $nasIp: " . $e->getMessage());
            return [];
        }
        
        return [];
    }

    /**
     * Get system resources from a specific NAS
     * @param string $nasIp NAS IP address
     * @param string $username Username for NAS
     * @param string $password Password for NAS
     * @param int $port Port number (default: 8729 for SSL)
     * @return array Array of system resources
     */
    public function getSystemResources($nasIp, $username, $password, $port = 8729)
    {
        try {
            $api = new \RouterosAPI();
            // SSL ayarlarını bu yerel nesne için de yapılandır
            $api->ssl = true;
            $api->port = $port;
            $api->debug = false; // Debug kapalı
            
            // Timeout ayarlarını hızlandır
            $api->timeout = 2; // 2 saniye
            $api->attempts = 1; // Sadece 1 deneme
            $api->delay = 1; // 1 saniye bekleme
            
            if ($api->connect($nasIp, $username, $password)) {
                $resources = [];
                
                // Get CPU usage
                try {
                    $cpuResponse = $api->comm('/system/resource/cpu/print');
                    if (!empty($cpuResponse)) {
                        $resources['cpu'] = [
                            'load' => $cpuResponse[0]['load'] ?? 0,
                            'count' => $cpuResponse[0]['count'] ?? 1
                        ];
                    }
                } catch (Exception $e) {
                    $resources['cpu'] = ['load' => 0, 'count' => 1];
                }
                
                // Get memory usage
                try {
                    $memoryResponse = $api->comm('/system/resource/print');
                    if (!empty($memoryResponse)) {
                        $resources['memory'] = [
                            'total' => $memoryResponse[0]['total-memory'] ?? 0,
                            'free' => $memoryResponse[0]['free-memory'] ?? 0,
                            'used' => ($memoryResponse[0]['total-memory'] ?? 0) - ($memoryResponse[0]['free-memory'] ?? 0)
                        ];
                    }
                } catch (Exception $e) {
                    $resources['memory'] = ['total' => 0, 'free' => 0, 'used' => 0];
                }
                
                // Get disk usage
                try {
                    $diskResponse = $api->comm('/system/resource/print');
                    if (!empty($diskResponse)) {
                        $resources['disk'] = [
                            'total' => $diskResponse[0]['total-hdd-space'] ?? 0,
                            'free' => $diskResponse[0]['free-hdd-space'] ?? 0,
                            'used' => ($diskResponse[0]['total-hdd-space'] ?? 0) - ($diskResponse[0]['free-hdd-space'] ?? 0)
                        ];
                    }
                } catch (Exception $e) {
                    $resources['disk'] = ['total' => 0, 'free' => 0, 'used' => 0];
                }
                
                // Get uptime
                try {
                    $uptimeResponse = $api->comm('/system/resource/print');
                    if (!empty($uptimeResponse)) {
                        $resources['uptime'] = $uptimeResponse[0]['uptime'] ?? '0s';
                    }
                } catch (Exception $e) {
                    $resources['uptime'] = '0s';
                }
                
                // Get version
                try {
                    $versionResponse = $api->comm('/system/resource/print');
                    if (!empty($versionResponse)) {
                        $resources['version'] = $versionResponse[0]['version'] ?? 'Unknown';
                    }
                } catch (Exception $e) {
                    $resources['version'] = 'Unknown';
                }
                
                $api->disconnect();
                return $resources;
            } else {
                error_log("Failed to connect to $nasIp");
            }
        } catch (Exception $e) {
            error_log("Error getting system resources from NAS $nasIp: " . $e->getMessage());
            return [
                'cpu' => ['load' => 0, 'count' => 1],
                'memory' => ['total' => 0, 'free' => 0, 'used' => 0],
                'disk' => ['total' => 0, 'free' => 0, 'used' => 0],
                'uptime' => '0s',
                'version' => 'Unknown',
                'error' => $e->getMessage()
            ];
        }
        
        error_log("Returning error response for $nasIp");
        return [
            'cpu' => ['load' => 0, 'count' => 1],
            'memory' => ['total' => 0, 'free' => 0, 'used' => 0],
            'disk' => ['total' => 0, 'free' => 0, 'used' => 0],
            'uptime' => '0s',
            'version' => 'Unknown',
            'error' => 'Connection failed'
        ];
    }

    /**
     * Get system resources for all NAS devices
     * @return array Array of NAS devices with system resources
     */
    public function getAllNasWithResources()
    {
        $nasModel = new \App\Models\NasModel();
        $nasList = $nasModel->getAllNas();
        $result = [];

        foreach ($nasList as $nas) {
            $resources = $this->getSystemResources(
                $nas['nasname'], 
                $nas['ruser'], 
                $nas['naspassword']
            );
            
            $result[] = array_merge($nas, ['resources' => $resources]);
        }

        return $result;
    }
} 