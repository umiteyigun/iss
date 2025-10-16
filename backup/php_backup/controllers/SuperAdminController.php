<?php

namespace App\Controllers;

use App\Models\TenantModel;
use App\Models\MemberModel;
use App\Services\PermissionManager;
use App\Middleware\PermissionMiddleware;

/**
 * Super Admin Controller
 * 
 * Super admin işlemleri için controller
 */
class SuperAdminController
{
    private $tenantModel;
    private $memberModel;
    private $permissionManager;

    public function __construct()
    {
        $this->tenantModel = new TenantModel();
        $this->memberModel = new MemberModel();
        $this->permissionManager = new PermissionManager();
    }

    /**
     * Tenant yönetim sayfası
     */
    public function tenants()
    {
        // Super admin yetkisi kontrolü
        if (!PermissionMiddleware::requireSuperAdmin()) {
            return;
        }

        $tenants = $this->tenantModel->getAllTenants();
        
        // Her tenant için istatistikleri al
        foreach ($tenants as &$tenant) {
            $tenant['stats'] = $this->tenantModel->getTenantStats($tenant['id']);
        }

        $viewData = [
            'tenants' => $tenants,
            'page_title' => 'Tenant Management',
            'breadcrumb' => [
                ['name' => 'Dashboard', 'url' => '/index.php?mod=dashboard'],
                ['name' => 'Tenant Management', 'url' => '']
            ]
        ];

        $this->renderView('super_admin/tenants', $viewData);
    }

    /**
     * Tenant oluşturma sayfası
     */
    public function createTenant()
    {
        // Super admin yetkisi kontrolü
        if (!PermissionMiddleware::requireSuperAdmin()) {
            return;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->handleCreateTenant();
            return;
        }

        $viewData = [
            'page_title' => 'Create New Tenant',
            'breadcrumb' => [
                ['name' => 'Dashboard', 'url' => '/index.php?mod=dashboard'],
                ['name' => 'Tenant Management', 'url' => '/index.php?mod=tenants'],
                ['name' => 'Create Tenant', 'url' => '']
            ]
        ];

        $this->renderView('super_admin/create_tenant', $viewData);
    }

    /**
     * Tenant oluşturma işlemi
     */
    private function handleCreateTenant()
    {
        try {
            $data = [
                'name' => $_POST['name'] ?? '',
                'subdomain' => $_POST['subdomain'] ?? '',
                'status' => $_POST['status'] ?? 'active',
                'radius_secret' => $_POST['radius_secret'] ?? '',
                'description' => $_POST['description'] ?? '',
                'contact_email' => $_POST['contact_email'] ?? '',
                'contact_phone' => $_POST['contact_phone'] ?? '',
                'max_users' => (int)($_POST['max_users'] ?? 1000),
                'max_nas' => (int)($_POST['max_nas'] ?? 10),
                'ip_ranges' => $this->parseIpRanges($_POST['ip_ranges'] ?? [])
            ];

            // Validation
            if (empty($data['name']) || empty($data['subdomain']) || empty($data['radius_secret'])) {
                throw new \Exception('Name, subdomain and radius secret are required');
            }

            // Subdomain kontrolü
            if (!$this->tenantModel->isSubdomainAvailable($data['subdomain'])) {
                throw new \Exception('Subdomain already exists');
            }

            $tenantId = $this->tenantModel->createTenant($data);
            
            if ($tenantId) {
                $_SESSION['success_message'] = 'Tenant created successfully';
                header('Location: /index.php?mod=tenants');
                exit();
            } else {
                throw new \Exception('Failed to create tenant');
            }
        } catch (\Exception $e) {
            $_SESSION['error_message'] = $e->getMessage();
            header('Location: /index.php?mod=create_tenant');
            exit();
        }
    }

    /**
     * Tenant düzenleme sayfası
     */
    public function editTenant()
    {
        // Super admin yetkisi kontrolü
        if (!PermissionMiddleware::requireSuperAdmin()) {
            return;
        }

        $tenantId = $_GET['id'] ?? 0;
        $tenant = $this->tenantModel->getById($tenantId);
        
        if (!$tenant) {
            $_SESSION['error_message'] = 'Tenant not found';
            header('Location: /index.php?mod=tenants');
            exit();
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->handleUpdateTenant($tenantId);
            return;
        }

        // IP aralıklarını al
        $tenant['ip_ranges'] = $this->tenantModel->getTenantIpRanges($tenantId);

        $viewData = [
            'tenant' => $tenant,
            'page_title' => 'Edit Tenant: ' . $tenant['name'],
            'breadcrumb' => [
                ['name' => 'Dashboard', 'url' => '/index.php?mod=dashboard'],
                ['name' => 'Tenant Management', 'url' => '/index.php?mod=tenants'],
                ['name' => 'Edit Tenant', 'url' => '']
            ]
        ];

        $this->renderView('super_admin/edit_tenant', $viewData);
    }

    /**
     * Tenant güncelleme işlemi
     */
    private function handleUpdateTenant($tenantId)
    {
        try {
            $data = [
                'name' => $_POST['name'] ?? '',
                'subdomain' => $_POST['subdomain'] ?? '',
                'status' => $_POST['status'] ?? 'active',
                'radius_secret' => $_POST['radius_secret'] ?? '',
                'description' => $_POST['description'] ?? '',
                'contact_email' => $_POST['contact_email'] ?? '',
                'contact_phone' => $_POST['contact_phone'] ?? '',
                'max_users' => (int)($_POST['max_users'] ?? 1000),
                'max_nas' => (int)($_POST['max_nas'] ?? 10),
                'ip_ranges' => $this->parseIpRanges($_POST['ip_ranges'] ?? [])
            ];

            // Validation
            if (empty($data['name']) || empty($data['subdomain']) || empty($data['radius_secret'])) {
                throw new \Exception('Name, subdomain and radius secret are required');
            }

            // Subdomain kontrolü
            if (!$this->tenantModel->isSubdomainAvailable($data['subdomain'], $tenantId)) {
                throw new \Exception('Subdomain already exists');
            }

            $result = $this->tenantModel->updateTenant($tenantId, $data);
            
            if ($result) {
                $_SESSION['success_message'] = 'Tenant updated successfully';
                header('Location: /index.php?mod=tenants');
                exit();
            } else {
                throw new \Exception('Failed to update tenant');
            }
        } catch (\Exception $e) {
            $_SESSION['error_message'] = $e->getMessage();
            header('Location: /index.php?mod=edit_tenant&id=' . $tenantId);
            exit();
        }
    }

    /**
     * Tenant silme işlemi
     */
    public function deleteTenant()
    {
        // Super admin yetkisi kontrolü
        if (!PermissionMiddleware::requireSuperAdmin()) {
            return;
        }

        $tenantId = $_GET['id'] ?? 0;
        
        try {
            $result = $this->tenantModel->deleteTenant($tenantId);
            
            if ($result) {
                $_SESSION['success_message'] = 'Tenant deleted successfully';
            } else {
                $_SESSION['error_message'] = 'Failed to delete tenant';
            }
        } catch (\Exception $e) {
            $_SESSION['error_message'] = $e->getMessage();
        }
        
        header('Location: /index.php?mod=tenants');
        exit();
    }

    /**
     * Tenant detay sayfası
     */
    public function viewTenant()
    {
        // Super admin yetkisi kontrolü
        if (!PermissionMiddleware::requireSuperAdmin()) {
            return;
        }

        $tenantId = $_GET['id'] ?? 0;
        $tenant = $this->tenantModel->getById($tenantId);
        
        if (!$tenant) {
            $_SESSION['error_message'] = 'Tenant not found';
            header('Location: /index.php?mod=tenants');
            exit();
        }

        // Tenant bilgilerini al
        $tenant['ip_ranges'] = $this->tenantModel->getTenantIpRanges($tenantId);
        $tenant['stats'] = $this->tenantModel->getTenantStats($tenantId);

        // Tenant kullanıcılarını al
        $users = $this->memberModel->getAll(['tenant_id' => $tenantId]);

        $viewData = [
            'tenant' => $tenant,
            'users' => $users,
            'page_title' => 'Tenant Details: ' . $tenant['name'],
            'breadcrumb' => [
                ['name' => 'Dashboard', 'url' => '/index.php?mod=dashboard'],
                ['name' => 'Tenant Management', 'url' => '/index.php?mod=tenants'],
                ['name' => 'Tenant Details', 'url' => '']
            ]
        ];

        $this->renderView('super_admin/view_tenant', $viewData);
    }

    /**
     * IP aralıklarını parse et
     * 
     * @param array $ipRanges
     * @return array
     */
    private function parseIpRanges($ipRanges)
    {
        $ranges = [];
        
        if (is_array($ipRanges)) {
            foreach ($ipRanges as $range) {
                if (!empty($range['ip_start']) && !empty($range['ip_end'])) {
                    $ranges[] = [
                        'ip_start' => $range['ip_start'],
                        'ip_end' => $range['ip_end'],
                        'description' => $range['description'] ?? ''
                    ];
                }
            }
        }
        
        return $ranges;
    }

    /**
     * View render et
     * 
     * @param string $viewName
     * @param array $data
     */
    private function renderView($viewName, $data = [])
    {
        // View dosyası yolu
        $viewFile = __DIR__ . '/../../views/' . $viewName . '.php';
        
        if (!file_exists($viewFile)) {
            throw new \Exception("View file not found: $viewFile");
        }
        
        // Data'yı extract et
        extract($data);
        
        // Layout'u include et
        require __DIR__ . '/../../views/layout.php';
    }
}
