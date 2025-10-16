<?php

namespace App\Models;

use App\Database;

/**
 * Tenant Model
 * 
 * Tenant yönetimi için model sınıfı
 */
class TenantModel
{
    protected $table = 'tenants';
    protected $pdo;

    public function __construct()
    {
        $this->pdo = \App\Database::getConnection();
    }

    /**
     * ID'ye göre tenant al
     * 
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            return $stmt->fetch();
        } catch (\Exception $e) {
            error_log("TenantModel: Tenant alınamadı: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Tüm tenant'ları al (super admin için)
     * 
     * @return array
     */
    public function getAllTenants()
    {
        try {
            $sql = "SELECT * FROM tenants ORDER BY created_at DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            error_log("TenantModel: Tüm tenant'lar alınamadı: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Tenant oluştur
     * 
     * @param array $data
     * @return int|false
     */
    public function createTenant($data)
    {
        try {
            $sql = "
                INSERT INTO tenants 
                (name, subdomain, status, radius_secret, description, contact_email, contact_phone, max_users, max_nas)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([
                $data['name'],
                $data['subdomain'],
                $data['status'] ?? 'active',
                $data['radius_secret'],
                $data['description'] ?? '',
                $data['contact_email'] ?? '',
                $data['contact_phone'] ?? '',
                $data['max_users'] ?? 1000,
                $data['max_nas'] ?? 10
            ]);

            if ($result) {
                $tenantId = $this->pdo->lastInsertId();
                
                // Varsayılan IP aralığı ekle
                $this->addDefaultIpRange($tenantId, $data['ip_ranges'] ?? []);
                
                // Audit log
                $this->logAction('create', $tenantId, null, $data);
                
                return $tenantId;
            }
            
            return false;
        } catch (\Exception $e) {
            error_log("TenantModel: Tenant oluşturulamadı: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Tenant güncelle
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function updateTenant($id, $data)
    {
        try {
            // Eski veriyi al
            $oldData = $this->getById($id);
            if (!$oldData) {
                return false;
            }

            $sql = "
                UPDATE tenants 
                SET name = ?, subdomain = ?, status = ?, radius_secret = ?, 
                    description = ?, contact_email = ?, contact_phone = ?, 
                    max_users = ?, max_nas = ?, updated_at = NOW()
                WHERE id = ?
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([
                $data['name'],
                $data['subdomain'],
                $data['status'],
                $data['radius_secret'],
                $data['description'] ?? '',
                $data['contact_email'] ?? '',
                $data['contact_phone'] ?? '',
                $data['max_users'] ?? 1000,
                $data['max_nas'] ?? 10,
                $id
            ]);

            if ($result) {
                // IP aralıklarını güncelle
                if (isset($data['ip_ranges'])) {
                    $this->updateIpRanges($id, $data['ip_ranges']);
                }
                
                // Audit log
                $this->logAction('update', $id, $oldData, $data);
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log("TenantModel: Tenant güncellenemedi: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Tenant sil
     * 
     * @param int $id
     * @return bool
     */
    public function deleteTenant($id)
    {
        try {
            // Eski veriyi al
            $oldData = $this->getById($id);
            if (!$oldData) {
                return false;
            }

            // Varsayılan tenant'ı silme
            if ($id == 1) {
                throw new \Exception('Default tenant cannot be deleted');
            }

            $sql = "DELETE FROM tenants WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([$id]);

            if ($result) {
                // Audit log
                $this->logAction('delete', $id, $oldData, null);
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log("TenantModel: Tenant silinemedi: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Tenant IP aralıklarını al
     * 
     * @param int $tenantId
     * @return array
     */
    public function getTenantIpRanges($tenantId)
    {
        try {
            $sql = "SELECT * FROM tenant_ip_ranges WHERE tenant_id = ? ORDER BY ip_start";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$tenantId]);
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            error_log("TenantModel: IP aralıkları alınamadı: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Varsayılan IP aralığı ekle
     * 
     * @param int $tenantId
     * @param array $ipRanges
     * @return bool
     */
    private function addDefaultIpRange($tenantId, $ipRanges)
    {
        try {
            if (empty($ipRanges)) {
                // Varsayılan IP aralığı
                $ipRanges = [
                    [
                        'ip_start' => '0.0.0.0',
                        'ip_end' => '255.255.255.255',
                        'description' => 'All IPs for tenant ' . $tenantId
                    ]
                ];
            }

            foreach ($ipRanges as $range) {
                $sql = "
                    INSERT INTO tenant_ip_ranges (tenant_id, ip_start, ip_end, description)
                    VALUES (?, ?, ?, ?)
                ";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $tenantId,
                    $range['ip_start'],
                    $range['ip_end'],
                    $range['description'] ?? ''
                ]);
            }

            return true;
        } catch (\Exception $e) {
            error_log("TenantModel: IP aralığı eklenemedi: " . $e->getMessage());
            return false;
        }
    }

    /**
     * IP aralıklarını güncelle
     * 
     * @param int $tenantId
     * @param array $ipRanges
     * @return bool
     */
    private function updateIpRanges($tenantId, $ipRanges)
    {
        try {
            // Mevcut IP aralıklarını sil
            $sql = "DELETE FROM tenant_ip_ranges WHERE tenant_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$tenantId]);

            // Yeni IP aralıklarını ekle
            return $this->addDefaultIpRange($tenantId, $ipRanges);
        } catch (\Exception $e) {
            error_log("TenantModel: IP aralıkları güncellenemedi: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Tenant istatistiklerini al
     * 
     * @param int $tenantId
     * @return array
     */
    public function getTenantStats($tenantId)
    {
        try {
            $stats = [];

            // Kullanıcı sayısı
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM members WHERE tenant_id = ?");
            $stmt->execute([$tenantId]);
            $stats['user_count'] = $stmt->fetch()['count'];

            // RADIUS kullanıcı sayısı
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM usersInfo WHERE tenant_id = ?");
            $stmt->execute([$tenantId]);
            $stats['radius_user_count'] = $stmt->fetch()['count'];

            // NAS sayısı
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM nas");
            $stats['nas_count'] = $stmt->fetch()['count'];

            // Online kullanıcı sayısı
            $stmt = $this->pdo->query("
                SELECT COUNT(DISTINCT username) as count 
                FROM radacct 
                WHERE acctstoptime IS NULL
            ");
            $stats['online_user_count'] = $stmt->fetch()['count'];

            return $stats;
        } catch (\Exception $e) {
            error_log("TenantModel: İstatistikler alınamadı: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Subdomain kontrolü
     * 
     * @param string $subdomain
     * @param int $excludeId
     * @return bool
     */
    public function isSubdomainAvailable($subdomain, $excludeId = null)
    {
        try {
            $sql = "SELECT COUNT(*) as count FROM tenants WHERE subdomain = ?";
            $params = [$subdomain];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            
            return $result['count'] == 0;
        } catch (\Exception $e) {
            error_log("TenantModel: Subdomain kontrolü hatası: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Audit log kaydı
     * 
     * @param string $action
     * @param int $entityId
     * @param array|null $oldData
     * @param array|null $newData
     */
    private function logAction($action, $entityId, $oldData = null, $newData = null)
    {
        try {
            $sql = "
                INSERT INTO audit_logs 
                (tenant_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                null, // tenant_id - super admin işlemi
                $_SESSION['user_id'] ?? null,
                $action,
                'tenant',
                $entityId,
                $oldData ? json_encode($oldData) : null,
                $newData ? json_encode($newData) : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (\Exception $e) {
            error_log("TenantModel: Audit log hatası: " . $e->getMessage());
        }
    }
}
