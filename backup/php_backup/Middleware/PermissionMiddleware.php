<?php

namespace App\Middleware;

use App\Services\TenantContext;
use App\Services\PermissionManager;

/**
 * Permission Middleware
 * 
 * Bu middleware kullanıcının belirli modüllere erişim yetkisi olup olmadığını kontrol eder.
 */
class PermissionMiddleware
{
    /**
     * Modül erişim yetkisini kontrol et
     * 
     * @param string $module
     * @param string $action
     * @return bool
     */
    public static function checkModuleAccess($module, $action = 'view')
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return false;
        }
        
        $tenantId = TenantContext::getInstance()->getTenantId();
        $permissionManager = new PermissionManager($tenantId, $_SESSION['user_id']);
        
        return $permissionManager->can($module, $action);
    }
    
    /**
     * Modül erişim yetkisini kontrol et ve yetki yoksa hata sayfasına yönlendir
     * 
     * @param string $module
     * @param string $action
     * @return bool
     */
    public static function requireModuleAccess($module, $action = 'view')
    {
        if (!self::checkModuleAccess($module, $action)) {
            self::showAccessDenied();
            return false;
        }
        
        return true;
    }
    
    /**
     * Super admin yetkisini kontrol et
     * 
     * @return bool
     */
    public static function requireSuperAdmin()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return false;
        }
        
        $tenantId = TenantContext::getInstance()->getTenantId();
        $permissionManager = new PermissionManager($tenantId, $_SESSION['user_id']);
        
        if (!$permissionManager->isSuperAdmin()) {
            self::showAccessDenied('Super admin access required');
            return false;
        }
        
        return true;
    }
    
    /**
     * Tenant admin yetkisini kontrol et
     * 
     * @return bool
     */
    public static function requireTenantAdmin()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return false;
        }
        
        $tenantId = TenantContext::getInstance()->getTenantId();
        $permissionManager = new PermissionManager($tenantId, $_SESSION['user_id']);
        
        if (!$permissionManager->isTenantAdmin() && !$permissionManager->isSuperAdmin()) {
            self::showAccessDenied('Tenant admin access required');
            return false;
        }
        
        return true;
    }
    
    /**
     * Erişim reddedildi sayfasını göster
     * 
     * @param string $message
     */
    private static function showAccessDenied($message = 'Access denied')
    {
        http_response_code(403);
        
        echo "<!DOCTYPE html>
        <html>
        <head>
            <title>Access Denied</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #d32f2f; font-size: 24px; margin-bottom: 20px; }
                .message { color: #666; font-size: 16px; margin-bottom: 30px; }
                .back-link { color: #1976d2; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class='error'>🚫 Access Denied</div>
            <div class='message'>{$message}</div>
            <a href='javascript:history.back()' class='back-link'>← Go Back</a>
        </body>
        </html>";
        
        exit();
    }
    
    /**
     * Kullanıcının modül yetkilerini al
     * 
     * @param string $module
     * @return array
     */
    public static function getModulePermissions($module)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return [];
        }
        
        $tenantId = TenantContext::getInstance()->getTenantId();
        $permissionManager = new PermissionManager($tenantId, $_SESSION['user_id']);
        
        return $permissionManager->getModulePermissions($module);
    }
    
    /**
     * Kullanıcının tüm yetkilerini al
     * 
     * @return array
     */
    public static function getAllPermissions()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return [];
        }
        
        $tenantId = TenantContext::getInstance()->getTenantId();
        $permissionManager = new PermissionManager($tenantId, $_SESSION['user_id']);
        
        return $permissionManager->getUserPermissions();
    }
    
    /**
     * Debug bilgilerini al
     * 
     * @return array
     */
    public static function getDebugInfo()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return ['error' => 'User not logged in'];
        }
        
        $tenantId = TenantContext::getInstance()->getTenantId();
        $permissionManager = new PermissionManager($tenantId, $_SESSION['user_id']);
        
        return [
            'user_id' => $_SESSION['user_id'],
            'tenant_id' => $tenantId,
            'permissions' => $permissionManager->getUserPermissions(),
            'roles' => $permissionManager->getUserRoles(),
            'is_super_admin' => $permissionManager->isSuperAdmin(),
            'is_tenant_admin' => $permissionManager->isTenantAdmin()
        ];
    }
}
