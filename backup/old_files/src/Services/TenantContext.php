<?php

namespace App\Services;

use App\Database;

/**
 * Tenant Context Sınıfı
 * 
 * Bu sınıf global tenant context'ini yönetir ve
 * tenant-specific database connection'ları sağlar.
 */
class TenantContext
{
    private static $instance = null;
    private $tenantId = null;
    private $tenantInfo = null;
    private $detector = null;
    
    private function __construct()
    {
        $this->detector = new TenantDetector();
    }
    
    /**
     * Singleton instance al
     * 
     * @return TenantContext
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Tenant ID'yi al
     * 
     * @return int
     */
    public function getTenantId()
    {
        if ($this->tenantId === null) {
            $this->tenantId = $this->detector->detectTenantId();
        }
        return $this->tenantId;
    }
    
    /**
     * Tenant ID'yi manuel olarak ayarla
     * 
     * @param int $tenantId
     * @return bool
     */
    public function setTenantId($tenantId)
    {
        $success = $this->detector->setTenantId($tenantId);
        if ($success) {
            $this->tenantId = $tenantId;
            $this->tenantInfo = null; // Cache'i temizle
        }
        return $success;
    }
    
    /**
     * Tenant bilgilerini al
     * 
     * @return array|null
     */
    public function getTenantInfo()
    {
        if ($this->tenantInfo === null) {
            $this->tenantInfo = $this->detector->getTenantInfo($this->getTenantId());
        }
        return $this->tenantInfo;
    }
    
    /**
     * Tenant adını al
     * 
     * @return string
     */
    public function getTenantName()
    {
        $info = $this->getTenantInfo();
        return $info ? $info['name'] : 'Unknown Tenant';
    }
    
    /**
     * Tenant subdomain'ini al
     * 
     * @return string|null
     */
    public function getTenantSubdomain()
    {
        $info = $this->getTenantInfo();
        return $info ? $info['subdomain'] : null;
    }
    
    /**
     * Tenant status'unu al
     * 
     * @return string
     */
    public function getTenantStatus()
    {
        $info = $this->getTenantInfo();
        return $info ? $info['status'] : 'inactive';
    }
    
    /**
     * Tenant'ın aktif olup olmadığını kontrol et
     * 
     * @return bool
     */
    public function isTenantActive()
    {
        return $this->getTenantStatus() === 'active';
    }
    
    /**
     * Tenant-specific database connection al
     * 
     * @return \PDO
     */
    public function getDatabaseConnection()
    {
        // Şu an için aynı database'i kullanıyoruz
        // Gelecekte tenant-specific database'ler eklenebilir
        return Database::getConnection();
    }
    
    /**
     * Tenant-specific query builder
     * 
     * @param string $table
     * @return TenantQueryBuilder
     */
    public function query($table)
    {
        return new TenantQueryBuilder($table, $this->getTenantId());
    }
    
    /**
     * Tenant context'ini sıfırla
     */
    public function reset()
    {
        $this->tenantId = null;
        $this->tenantInfo = null;
        $this->detector->reset();
    }
    
    /**
     * Debug bilgilerini al
     * 
     * @return array
     */
    public function getDebugInfo()
    {
        return [
            'tenant_id' => $this->getTenantId(),
            'tenant_name' => $this->getTenantName(),
            'tenant_status' => $this->getTenantStatus(),
            'is_active' => $this->isTenantActive(),
            'detector_debug' => $this->detector->getDebugInfo()
        ];
    }
}

/**
 * Tenant-specific Query Builder
 * 
 * Bu sınıf tenant-aware query'ler oluşturur.
 */
class TenantQueryBuilder
{
    private $table;
    private $tenantId;
    private $pdo;
    private $query;
    private $params;
    
    public function __construct($table, $tenantId)
    {
        $this->table = $table;
        $this->tenantId = $tenantId;
        $this->pdo = Database::getConnection();
        $this->query = "SELECT * FROM {$table}";
        $this->params = [];
    }
    
    /**
     * WHERE koşulu ekle
     * 
     * @param string $column
     * @param mixed $value
     * @param string $operator
     * @return TenantQueryBuilder
     */
    public function where($column, $value, $operator = '=')
    {
        if (strpos($this->query, 'WHERE') === false) {
            $this->query .= " WHERE {$column} {$operator} ?";
        } else {
            $this->query .= " AND {$column} {$operator} ?";
        }
        
        $this->params[] = $value;
        return $this;
    }
    
    /**
     * Tenant ID koşulunu ekle
     * 
     * @return TenantQueryBuilder
     */
    public function whereTenant()
    {
        return $this->where('tenant_id', $this->tenantId);
    }
    
    /**
     * ORDER BY ekle
     * 
     * @param string $column
     * @param string $direction
     * @return TenantQueryBuilder
     */
    public function orderBy($column, $direction = 'ASC')
    {
        $this->query .= " ORDER BY {$column} {$direction}";
        return $this;
    }
    
    /**
     * LIMIT ekle
     * 
     * @param int $limit
     * @param int $offset
     * @return TenantQueryBuilder
     */
    public function limit($limit, $offset = 0)
    {
        $this->query .= " LIMIT {$offset}, {$limit}";
        return $this;
    }
    
    /**
     * Query'yi çalıştır ve sonuçları al
     * 
     * @return array
     */
    public function get()
    {
        try {
            $stmt = $this->pdo->prepare($this->query);
            $stmt->execute($this->params);
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            error_log("TenantQueryBuilder: Query hatası: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * İlk sonucu al
     * 
     * @return array|null
     */
    public function first()
    {
        $results = $this->limit(1)->get();
        return $results ? $results[0] : null;
    }
    
    /**
     * Sonuç sayısını al
     * 
     * @return int
     */
    public function count()
    {
        $countQuery = str_replace('SELECT *', 'SELECT COUNT(*) as count', $this->query);
        try {
            $stmt = $this->pdo->prepare($countQuery);
            $stmt->execute($this->params);
            $result = $stmt->fetch();
            return $result ? (int)$result['count'] : 0;
        } catch (\Exception $e) {
            error_log("TenantQueryBuilder: Count hatası: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Raw query'i al
     * 
     * @return string
     */
    public function toSql()
    {
        return $this->query;
    }
    
    /**
     * Parameters'ları al
     * 
     * @return array
     */
    public function getParams()
    {
        return $this->params;
    }
}
