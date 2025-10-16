<?php

namespace App\Models;

use App\Database;
use App\Services\TenantContext;
use App\Services\PermissionManager;

/**
 * Tenant-Aware Base Model
 * 
 * Bu sınıf tüm modeller için base class olarak kullanılır.
 * Otomatik tenant filtering ve permission checking sağlar.
 */
abstract class TenantAwareModel
{
    protected $pdo;
    protected $table;
    protected $tenantId;
    protected $permissionManager;
    
    public function __construct()
    {
        $this->pdo = Database::getConnection();
        $this->tenantId = TenantContext::getInstance()->getTenantId();
        $this->permissionManager = new PermissionManager($this->tenantId);
    }
    
    /**
     * Tenant ID'yi al
     * 
     * @return int
     */
    protected function getTenantId()
    {
        return $this->tenantId;
    }
    
    /**
     * Tenant-aware query oluştur
     * 
     * @param string $sql
     * @param array $params
     * @return \PDOStatement
     */
    protected function prepare($sql, $params = [])
    {
        // SQL'de tenant_id koşulu yoksa ekle
        if (strpos($sql, 'WHERE') !== false && strpos($sql, 'tenant_id') === false) {
            $sql = str_replace('WHERE', 'WHERE tenant_id = ? AND', $sql);
            array_unshift($params, $this->tenantId);
        } elseif (strpos($sql, 'WHERE') === false && strpos($sql, 'tenant_id') === false) {
            $sql .= ' WHERE tenant_id = ?';
            $params[] = $this->tenantId;
        }
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    /**
     * Tüm kayıtları al
     * 
     * @param array $conditions
     * @param string $orderBy
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getAll($conditions = [], $orderBy = null, $limit = null, $offset = 0)
    {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        // Tenant ID koşulu
        $sql .= " WHERE tenant_id = ?";
        $params[] = $this->tenantId;
        
        // Diğer koşullar
        foreach ($conditions as $column => $value) {
            $sql .= " AND {$column} = ?";
            $params[] = $value;
        }
        
        // Sıralama
        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy}";
        }
        
        // Limit
        if ($limit) {
            $sql .= " LIMIT {$offset}, {$limit}";
        }
        
        $stmt = $this->prepare($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * ID'ye göre kayıt al
     * 
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = ? AND tenant_id = ?";
        $stmt = $this->prepare($sql, [$id, $this->tenantId]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Koşula göre kayıt al
     * 
     * @param array $conditions
     * @return array|null
     */
    public function getBy($conditions)
    {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        // Tenant ID koşulu
        $sql .= " WHERE tenant_id = ?";
        $params[] = $this->tenantId;
        
        // Diğer koşullar
        foreach ($conditions as $column => $value) {
            $sql .= " AND {$column} = ?";
            $params[] = $value;
        }
        
        $sql .= " LIMIT 1";
        
        $stmt = $this->prepare($sql, $params);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Yeni kayıt oluştur
     * 
     * @param array $data
     * @return int|false
     */
    public function create($data)
    {
        // Permission kontrolü
        if (!$this->permissionManager->can($this->getModuleName(), 'create')) {
            throw new \Exception('Bu işlem için yetkiniz yok');
        }
        
        // Tenant ID'yi ekle
        $data['tenant_id'] = $this->tenantId;
        
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($data);
            
            // Audit log
            $this->logAction('create', $this->pdo->lastInsertId(), null, $data);
            
            return $this->pdo->lastInsertId();
        } catch (\Exception $e) {
            error_log("TenantAwareModel: Create hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kayıt güncelle
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data)
    {
        // Permission kontrolü
        if (!$this->permissionManager->can($this->getModuleName(), 'edit')) {
            throw new \Exception('Bu işlem için yetkiniz yok');
        }
        
        // Eski veriyi al
        $oldData = $this->getById($id);
        if (!$oldData) {
            return false;
        }
        
        // Tenant ID'yi ekle
        $data['tenant_id'] = $this->tenantId;
        
        $setClause = [];
        foreach ($data as $column => $value) {
            $setClause[] = "{$column} = :{$column}";
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $setClause) . " WHERE id = :id AND tenant_id = :tenant_id";
        $data['id'] = $id;
        $data['tenant_id'] = $this->tenantId;
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute($data);
            
            // Audit log
            $this->logAction('update', $id, $oldData, $data);
            
            return $result;
        } catch (\Exception $e) {
            error_log("TenantAwareModel: Update hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kayıt sil
     * 
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        // Permission kontrolü
        if (!$this->permissionManager->can($this->getModuleName(), 'delete')) {
            throw new \Exception('Bu işlem için yetkiniz yok');
        }
        
        // Eski veriyi al
        $oldData = $this->getById($id);
        if (!$oldData) {
            return false;
        }
        
        $sql = "DELETE FROM {$this->table} WHERE id = ? AND tenant_id = ?";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([$id, $this->tenantId]);
            
            // Audit log
            $this->logAction('delete', $id, $oldData, null);
            
            return $result;
        } catch (\Exception $e) {
            error_log("TenantAwareModel: Delete hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kayıt sayısını al
     * 
     * @param array $conditions
     * @return int
     */
    public function count($conditions = [])
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table}";
        $params = [];
        
        // Tenant ID koşulu
        $sql .= " WHERE tenant_id = ?";
        $params[] = $this->tenantId;
        
        // Diğer koşullar
        foreach ($conditions as $column => $value) {
            $sql .= " AND {$column} = ?";
            $params[] = $value;
        }
        
        $stmt = $this->prepare($sql, $params);
        $result = $stmt->fetch();
        
        return $result ? (int)$result['count'] : 0;
    }
    
    /**
     * Modül adını al (alt sınıflarda override edilmeli)
     * 
     * @return string
     */
    protected function getModuleName()
    {
        return strtolower(str_replace('Model', '', basename(get_class($this))));
    }
    
    /**
     * Audit log oluştur
     * 
     * @param string $action
     * @param int $resourceId
     * @param array|null $oldData
     * @param array|null $newData
     */
    protected function logAction($action, $resourceId, $oldData = null, $newData = null)
    {
        try {
            $sql = "
                INSERT INTO audit_logs 
                (tenant_id, user_id, action, module, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $this->tenantId,
                $_SESSION['user_id'] ?? null,
                $action,
                $this->getModuleName(),
                $this->table,
                $resourceId,
                $oldData ? json_encode($oldData) : null,
                $newData ? json_encode($newData) : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (\Exception $e) {
            error_log("TenantAwareModel: Audit log hatası: " . $e->getMessage());
        }
    }
    
    /**
     * Permission kontrolü yap
     * 
     * @param string $action
     * @return bool
     */
    protected function checkPermission($action)
    {
        return $this->permissionManager->can($this->getModuleName(), $action);
    }
    
    /**
     * Super admin kontrolü
     * 
     * @return bool
     */
    protected function isSuperAdmin()
    {
        return $this->permissionManager->isSuperAdmin();
    }
    
    /**
     * Tenant admin kontrolü
     * 
     * @return bool
     */
    protected function isTenantAdmin()
    {
        return $this->permissionManager->isTenantAdmin();
    }
    
    /**
     * Raw query çalıştır (tenant filtering olmadan)
     * 
     * @param string $sql
     * @param array $params
     * @return \PDOStatement
     */
    protected function rawQuery($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    /**
     * Transaction başlat
     * 
     * @return bool
     */
    protected function beginTransaction()
    {
        return $this->pdo->beginTransaction();
    }
    
    /**
     * Transaction commit et
     * 
     * @return bool
     */
    protected function commit()
    {
        return $this->pdo->commit();
    }
    
    /**
     * Transaction rollback et
     * 
     * @return bool
     */
    protected function rollback()
    {
        return $this->pdo->rollback();
    }
}
