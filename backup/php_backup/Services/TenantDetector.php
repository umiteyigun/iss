<?php

namespace App\Services;

use App\Database;

/**
 * Otomatik Tenant Detection Sınıfı
 * 
 * Bu sınıf kullanıcının hangi tenant'a ait olduğunu otomatik olarak belirler:
 * 1. Session'dan tenant_id
 * 2. Kullanıcı ID'sinden tenant_id
 * 3. IP adresinden tenant_id
 * 4. Varsayılan tenant (1)
 */
class TenantDetector
{
    private $pdo;
    private $detectedTenantId = null;
    private $detectionMethod = null;
    
    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }
    
    /**
     * Tenant ID'yi otomatik olarak belirle
     * 
     * @return int Tenant ID
     */
    public function detectTenantId()
    {
        if ($this->detectedTenantId !== null) {
            return $this->detectedTenantId;
        }
        
        // 1. Session'dan tenant_id kontrol et
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (isset($_SESSION['tenant_id']) && !empty($_SESSION['tenant_id'])) {
            $this->detectedTenantId = (int)$_SESSION['tenant_id'];
            $this->detectionMethod = 'session';
            return $this->detectedTenantId;
        }
        
        // 2. Kullanıcı ID'sinden tenant_id kontrol et
        if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
            $tenantId = $this->getTenantIdFromUserId($_SESSION['user_id']);
            if ($tenantId) {
                $this->detectedTenantId = $tenantId;
                $this->detectionMethod = 'user_id';
                // Session'a da kaydet
                $_SESSION['tenant_id'] = $tenantId;
                return $this->detectedTenantId;
            }
        }
        
        // 3. IP adresinden tenant_id kontrol et
        $ipAddress = $this->getClientIpAddress();
        $tenantId = $this->getTenantIdFromIp($ipAddress);
        if ($tenantId) {
            $this->detectedTenantId = $tenantId;
            $this->detectionMethod = 'ip_address';
            // Session'a da kaydet
            $_SESSION['tenant_id'] = $tenantId;
            return $this->detectedTenantId;
        }
        
        // 4. Varsayılan tenant (1)
        $this->detectedTenantId = 1;
        $this->detectionMethod = 'default';
        $_SESSION['tenant_id'] = 1;
        
        return $this->detectedTenantId;
    }
    
    /**
     * Kullanıcı ID'sinden tenant_id al
     * 
     * @param int $userId
     * @return int|null
     */
    private function getTenantIdFromUserId($userId)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT tenant_id FROM members WHERE id = ? AND is_active = 1");
            $stmt->execute([$userId]);
            $result = $stmt->fetch();
            
            return $result ? (int)$result['tenant_id'] : null;
        } catch (\Exception $e) {
            error_log("TenantDetector: User ID'den tenant bulunamadı: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * IP adresinden tenant_id al
     * 
     * @param string $ipAddress
     * @return int|null
     */
    private function getTenantIdFromIp($ipAddress)
    {
        try {
            // IP adresini long integer'a çevir
            $ipLong = ip2long($ipAddress);
            if ($ipLong === false) {
                return null;
            }
            
            // IP aralığında arama yap
            $stmt = $this->pdo->prepare("
                SELECT tenant_id 
                FROM tenant_ip_ranges 
                WHERE INET_ATON(ip_start) <= ? AND INET_ATON(ip_end) >= ?
                ORDER BY tenant_id
                LIMIT 1
            ");
            $stmt->execute([$ipAddress, $ipAddress]);
            $result = $stmt->fetch();
            
            return $result ? (int)$result['tenant_id'] : null;
        } catch (\Exception $e) {
            error_log("TenantDetector: IP'den tenant bulunamadı: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Client IP adresini al
     * 
     * @return string
     */
    private function getClientIpAddress()
    {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_CLIENT_IP',            // Proxy
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // Standard
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                
                // X-Forwarded-For için ilk IP'yi al
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                
                // IP adresini doğrula
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
    
    /**
     * Tenant bilgilerini al
     * 
     * @param int $tenantId
     * @return array|null
     */
    public function getTenantInfo($tenantId = null)
    {
        if ($tenantId === null) {
            $tenantId = $this->detectTenantId();
        }
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    id, name, subdomain, status, radius_secret, 
                    description, contact_email, contact_phone, 
                    max_users, max_nas, created_at
                FROM tenants 
                WHERE id = ? AND status = 'active'
            ");
            $stmt->execute([$tenantId]);
            $result = $stmt->fetch();
            
            return $result ?: null;
        } catch (\Exception $e) {
            error_log("TenantDetector: Tenant bilgisi alınamadı: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Tenant IP aralıklarını al
     * 
     * @param int $tenantId
     * @return array
     */
    public function getTenantIpRanges($tenantId = null)
    {
        if ($tenantId === null) {
            $tenantId = $this->detectTenantId();
        }
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT ip_start, ip_end, description 
                FROM tenant_ip_ranges 
                WHERE tenant_id = ?
                ORDER BY ip_start
            ");
            $stmt->execute([$tenantId]);
            
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            error_log("TenantDetector: Tenant IP aralıkları alınamadı: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Tenant'ı manuel olarak ayarla
     * 
     * @param int $tenantId
     * @return bool
     */
    public function setTenantId($tenantId)
    {
        try {
            // Tenant'ın var olduğunu kontrol et
            $tenantInfo = $this->getTenantInfo($tenantId);
            if (!$tenantInfo) {
                return false;
            }
            
            // Session'a kaydet
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            $_SESSION['tenant_id'] = (int)$tenantId;
            $this->detectedTenantId = (int)$tenantId;
            $this->detectionMethod = 'manual';
            
            return true;
        } catch (\Exception $e) {
            error_log("TenantDetector: Tenant ayarlanamadı: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Detection method'unu al
     * 
     * @return string
     */
    public function getDetectionMethod()
    {
        return $this->detectionMethod;
    }
    
    /**
     * Tenant detection'ı sıfırla
     */
    public function reset()
    {
        $this->detectedTenantId = null;
        $this->detectionMethod = null;
        
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        unset($_SESSION['tenant_id']);
    }
    
    /**
     * Debug bilgilerini al
     * 
     * @return array
     */
    public function getDebugInfo()
    {
        return [
            'detected_tenant_id' => $this->detectedTenantId,
            'detection_method' => $this->detectionMethod,
            'session_tenant_id' => $_SESSION['tenant_id'] ?? null,
            'session_user_id' => $_SESSION['user_id'] ?? null,
            'client_ip' => $this->getClientIpAddress(),
            'tenant_info' => $this->getTenantInfo()
        ];
    }
}
