<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\NasModel;
use App\Models\TenantModel;
use App\Services\MikrotikService;
use App\Services\PermissionManager;

class DashboardController
{
    public function show()
    {
        // Handle AJAX search requests
        if (isset($_GET['ajax']) && $_GET['ajax'] == '1' && isset($_GET['search'])) {
            $this->handleAjaxSearch();
            return;
        }

        // Check if user is super admin
        $permissionManager = new PermissionManager();
        $isSuperAdmin = $permissionManager->isSuperAdmin();

        // Caching was removed because this page now has dynamic pagination
        // and needs to fetch data on every request based on the page number.
        $userModel = new UserModel();

        // --- Pagination Logic ---
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
        $pageSize = 15; // Users per page
        
        // --- Search Logic ---
        $searchTerm = isset($_GET['search']) ? trim($_GET['search']) : '';
        
        if (!empty($searchTerm)) {
            // Use search functionality
            $totalUsers = $userModel->getSearchUserCount($searchTerm);
            $usersForPage = $userModel->searchUsers($searchTerm, $page, $pageSize);
        } else {
            // Use normal functionality
            $totalUsers = $userModel->getUserCount();
            $usersForPage = $userModel->getUsers($page, $pageSize);
        }
        
        $totalPages = ceil($totalUsers / $pageSize);
        // --- End Pagination Logic ---

        // 1. Get All User Statistics (Total, Active, Expired, Online)
        $userStats = $userModel->getUserStats();

        // --- Mikrotik Online Users ---
        $mikrotikOnlineUsers = null; // Default to null (error state)
        try {
            $mikrotikService = new MikrotikService();
            $result = $mikrotikService->getPppActiveConnectionsFromAllNas();

            if ($result !== false) {
                $mikrotikOnlineUsers = $result;
            }
            
        } catch (\Exception $e) {
            // Log the error, so we know what happened
            error_log('Mikrotik API connection error: ' . $e->getMessage());
        }

        // Router ve NAS istatistikleri
        $nasModel = new NasModel();
        $totalRouters = 0; // Router sayısı için model yok, şimdilik 0
        $totalNas = $nasModel->getNasCount();
        
        // Member sayısı için basit bir hesaplama
        $totalMembers = 1; // Şimdilik sadece admin var

        $viewData = [
            'totalUsers' => $userStats['total'],
            'activeUsers' => $userStats['active'],
            'expiredUsers' => $userStats['expired'],
            'onlineUsers' => $userStats['online'],
            'mikrotikOnlineUsers' => $mikrotikOnlineUsers,
            'users' => $usersForPage,
            'totalPages' => $totalPages,
            'currentPage' => $page,
            'searchTerm' => $searchTerm,
            'searchResultsCount' => $totalUsers,
            'totalRouters' => $totalRouters,
            'totalNas' => $totalNas,
            'totalMembers' => $totalMembers,
        ];

        // A more robust way to check for AJAX requests using a URL parameter.
        // If 'ajax=1' is present, render only the partial view and stop execution.
        if (isset($_GET['ajax']) && $_GET['ajax'] == '1') {
            include __DIR__ . '/../../views/partials/user_list_table.php';
            exit;
        }

        // Super admin için tenant istatistikleri
        $tenantStats = null;
        $allTenants = null;
        if ($isSuperAdmin) {
            $tenantModel = new TenantModel();
            $allTenants = $tenantModel->getAllTenants();
            
            // Her tenant için istatistikleri al
            foreach ($allTenants as &$tenant) {
                $tenant['stats'] = $tenantModel->getTenantStats($tenant['id']);
            }
            
            // Genel tenant istatistikleri
            $tenantStats = [
                'total_tenants' => count($allTenants),
                'active_tenants' => count(array_filter($allTenants, function($t) { return $t['status'] === 'active'; })),
                'suspended_tenants' => count(array_filter($allTenants, function($t) { return $t['status'] === 'suspended'; })),
                'total_users' => array_sum(array_map(function($t) { return $t['stats']['user_count'] ?? 0; }, $allTenants)),
                'total_radius_users' => array_sum(array_map(function($t) { return $t['stats']['radius_user_count'] ?? 0; }, $allTenants)),
            ];
        }

        // For a normal, full-page load, include the main layout.
        $viewFile = __DIR__ . '/../../views/dashboard.php';
        require __DIR__ . '/../../views/layout.php';
    }

    private function handleAjaxSearch()
    {
        $userModel = new UserModel();
        $searchTerm = isset($_GET['search']) ? trim($_GET['search']) : '';
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
        $pageSize = 15;

        if (!empty($searchTerm)) {
            $totalUsers = $userModel->getSearchUserCount($searchTerm);
            $usersForPage = $userModel->searchUsers($searchTerm, $page, $pageSize);
        } else {
            $totalUsers = $userModel->getUserCount();
            $usersForPage = $userModel->getUsers($page, $pageSize);
        }

        $totalPages = ceil($totalUsers / $pageSize);

        $viewData = [
            'users' => $usersForPage,
            'totalPages' => $totalPages,
            'currentPage' => $page,
            'searchTerm' => $searchTerm,
            'searchResultsCount' => $totalUsers,
        ];

        // Set content type to HTML for partial view
        header('Content-Type: text/html; charset=utf-8');
        include __DIR__ . '/../../views/partials/user_list_table.php';
        exit;
    }
} 