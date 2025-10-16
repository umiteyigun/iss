<?php

namespace App\Services;

use App\Database;

/**
 * Permission Manager Sınıfı
 * 
 * Bu sınıf modül bazlı yetkilendirme sistemini yönetir.
 */
class PermissionManager
{
    private $pdo;
    private $tenantId;
    private $userId;
    private $userRoles = null;
    private $userPermissions = null;
    
    public function __construct($tenantId = null, $userId = null)
    {
        $this->pdo = Database::getConnection();
        $this->tenantId = $tenantId ?: (TenantContext::getInstance()->getTenantId());
        $this->userId = $userId ?: ($_SESSION['user_id'] ?? null);
    }
    
    /**
     * Kullanıcının belirli bir yetkisi var mı kontrol et
     * 
     * @param string $permission
     * @return bool
     */
    public function hasPermission($permission)
    {
        if (!$this->userId) {
            return false;
        }
        
        $permissions = $this->getUserPermissions();
        return in_array($permission, $permissions);
    }
    
    /**
     * Kullanıcının belirli bir modülde yetkisi var mı kontrol et
     * 
     * @param string $module
     * @param string $action
     * @return bool
     */
    public function can($module, $action)
    {
        $permission = $module . '.' . $action;
        return $this->hasPermission($permission);
    }
    
    /**
     * Kullanıcının belirli bir modülde herhangi bir yetkisi var mı kontrol et
     * 
     * @param string $module
     * @return bool
     */
    public function canAccessModule($module)
    {
        if (!$this->userId) {
            return false;
        }
        
        $permissions = $this->getUserPermissions();
        foreach ($permissions as $permission) {
            if (strpos($permission, $module . '.') === 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Kullanıcının rollerini al
     * 
     * @return array
     */
    public function getUserRoles()
    {
        if ($this->userRoles !== null) {
            return $this->userRoles;
        }
        
        if (!$this->userId) {
            return [];
        }
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT r.id, r.name, r.display_name, r.description, r.is_system_role
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ? 
                AND ur.tenant_id = ? 
                AND ur.is_active = 1
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            ");
            $stmt->execute([$this->userId, $this->tenantId]);
            
            $this->userRoles = $stmt->fetchAll();
            return $this->userRoles;
        } catch (\Exception $e) {
            error_log("PermissionManager: Kullanıcı rolleri alınamadı: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Kullanıcının yetkilerini al
     * 
     * @return array
     */
    public function getUserPermissions()
    {
        if ($this->userPermissions !== null) {
            return $this->userPermissions;
        }
        
        if (!$this->userId) {
            return [];
        }
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT p.name
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = ? 
                AND ur.tenant_id = ? 
                AND ur.is_active = 1
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            ");
            $stmt->execute([$this->userId, $this->tenantId]);
            
            $this->userPermissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);
            return $this->userPermissions;
        } catch (\Exception $e) {
            error_log("PermissionManager: Kullanıcı yetkileri alınamadı: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Kullanıcının modül yetkilerini al
     * 
     * @param string $module
     * @return array
     */
    public function getModulePermissions($module)
    {
        $permissions = $this->getUserPermissions();
        $modulePermissions = [];
        
        foreach ($permissions as $permission) {
            if (strpos($permission, $module . '.') === 0) {
                $action = substr($permission, strlen($module) + 1);
                $modulePermissions[] = $action;
            }
        }
        
        return $modulePermissions;
    }
    
    /**
     * Kullanıcının super admin olup olmadığını kontrol et
     * 
     * @return bool
     */
    public function isSuperAdmin()
    {
        $roles = $this->getUserRoles();
        foreach ($roles as $role) {
            if ($role['name'] === 'super_admin') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Kullanıcının tenant admin olup olmadığını kontrol et
     * 
     * @return bool
     */
    public function isTenantAdmin()
    {
        $roles = $this->getUserRoles();
        foreach ($roles as $role) {
            if ($role['name'] === 'tenant_admin') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Kullanıcının operator olup olmadığını kontrol et
     * 
     * @return bool
     */
    public function isOperator()
    {
        $roles = $this->getUserRoles();
        foreach ($roles as $role) {
            if ($role['name'] === 'operator') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Kullanıcının viewer olup olmadığını kontrol et
     * 
     * @return bool
     */
    public function isViewer()
    {
        $roles = $this->getUserRoles();
        foreach ($roles as $role) {
            if ($role['name'] === 'viewer') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Kullanıcıya rol ata
     * 
     * @param int $userId
     * @param int $roleId
     * @param int $assignedBy
     * @param string $expiresAt
     * @return bool
     */
    public function assignRole($userId, $roleId, $assignedBy = null, $expiresAt = null)
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, expires_at, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE
                assigned_by = VALUES(assigned_by),
                expires_at = VALUES(expires_at),
                is_active = 1,
                assigned_at = NOW()
            ");
            
            $result = $stmt->execute([
                $userId,
                $roleId,
                $this->tenantId,
                $assignedBy,
                $expiresAt
            ]);
            
            // Cache'i temizle
            $this->userRoles = null;
            $this->userPermissions = null;
            
            return $result;
        } catch (\Exception $e) {
            error_log("PermissionManager: Rol atama hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kullanıcıdan rol kaldır
     * 
     * @param int $userId
     * @param int $roleId
     * @return bool
     */
    public function removeRole($userId, $roleId)
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE user_roles 
                SET is_active = 0 
                WHERE user_id = ? AND role_id = ? AND tenant_id = ?
            ");
            
            $result = $stmt->execute([$userId, $roleId, $this->tenantId]);
            
            // Cache'i temizle
            $this->userRoles = null;
            $this->userPermissions = null;
            
            return $result;
        } catch (\Exception $e) {
            error_log("PermissionManager: Rol kaldırma hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Tüm rolleri listele
     * 
     * @return array
     */
    public function getAllRoles()
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, name, display_name, description, is_system_role
                FROM roles
                WHERE tenant_id IS NULL OR tenant_id = ?
                ORDER BY is_system_role DESC, display_name ASC
            ");
            $stmt->execute([$this->tenantId]);
            
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            error_log("PermissionManager: Roller alınamadı: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Tüm yetkileri listele
     * 
     * @return array
     */
    public function getAllPermissions()
    {
        try {
            $stmt = $this->pdo->query("
                SELECT id, name, display_name, module, action, description
                FROM permissions
                ORDER BY module, action
            ");
            
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            error_log("PermissionManager: Yetkiler alınamadı: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Modül bazlı yetkileri listele
     * 
     * @return array
     */
    public function getPermissionsByModule()
    {
        $permissions = $this->getAllPermissions();
        $grouped = [];
        
        foreach ($permissions as $permission) {
            $module = $permission['module'];
            if (!isset($grouped[$module])) {
                $grouped[$module] = [];
            }
            $grouped[$module][] = $permission;
        }
        
        return $grouped;
    }
    
    /**
     * Cache'i temizle
     */
    public function clearCache()
    {
        $this->userRoles = null;
        $this->userPermissions = null;
    }
    
    /**
     * Debug bilgilerini al
     * 
     * @return array
     */
    public function getDebugInfo()
    {
        return [
            'tenant_id' => $this->tenantId,
            'user_id' => $this->userId,
            'user_roles' => $this->getUserRoles(),
            'user_permissions' => $this->getUserPermissions(),
            'is_super_admin' => $this->isSuperAdmin(),
            'is_tenant_admin' => $this->isTenantAdmin(),
            'is_operator' => $this->isOperator(),
            'is_viewer' => $this->isViewer()
        ];
    }
}
