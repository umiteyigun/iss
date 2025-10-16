<?php

namespace App\Middleware;

use App\Services\TenantContext;
use App\Services\PermissionManager;

/**
 * Authentication Middleware
 * 
 * Bu middleware kullanıcının giriş yapmış olup olmadığını kontrol eder.
 */
class AuthMiddleware
{
    public static function handle()
    {
        // Session başlat
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Login sayfaları için kontrol yapma
        $loginPages = ['login', 'dologin'];
        $currentModule = $_GET['mod'] ?? '';
        
        if (in_array($currentModule, $loginPages)) {
            return true;
        }
        
        // Kullanıcı giriş yapmış mı?
        if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
            self::redirectToLogin();
            return false;
        }
        
        // Tenant context'i başlat
        $tenantContext = TenantContext::getInstance();
        $tenantId = $tenantContext->getTenantId();
        
        // Tenant aktif mi?
        if (!$tenantContext->isTenantActive()) {
            self::redirectToLogin('Tenant is not active');
            return false;
        }
        
        // Kullanıcının bu tenant'ta yetkisi var mı?
        $permissionManager = new PermissionManager($tenantId, $_SESSION['user_id']);
        if (!$permissionManager->getUserRoles()) {
            self::redirectToLogin('No access to this tenant');
            return false;
        }
        
        return true;
    }
    
    /**
     * Login sayfasına yönlendir
     * 
     * @param string $message
     */
    private static function redirectToLogin($message = '')
    {
        if ($message) {
            $_SESSION['login_error'] = $message;
        }
        
        header('Location: /index.php?mod=login');
        exit();
    }
    
    /**
     * Kullanıcıyı logout yap
     */
    public static function logout()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Session'ı temizle
        $_SESSION = [];
        session_destroy();
        
        // Login sayfasına yönlendir
        header('Location: /index.php?mod=login');
        exit();
    }
}
