<?php

namespace App\Controllers;

use App\Models\NasModel;
use Exception;

class RouterController
{
    public function index()
    {
        $nasModel = new NasModel();
        $mikrotikService = new \App\Services\MikrotikService();
        
        // Get routers with system resources
        $routers = $mikrotikService->getAllNasWithResources();
        
        $viewData = [
            'routers' => $routers
        ];
        $viewFile = __DIR__ . '/../../views/router/list.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function add()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $nasname = $_POST['nasname'] ?? '';
            $shortname = $_POST['shortname'] ?? '';
            $ruser = $_POST['ruser'] ?? 'admin';
            $naspassword = $_POST['naspassword'] ?? '';
            $secret = $_POST['secret'] ?? '';

            // Validation
            if (empty($nasname) || empty($naspassword)) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'IP Address and Password are required']);
                    return;
                }
                $this->redirect('index.php?mod=router&error=missing_fields');
                return;
            }

            $nasModel = new NasModel();
            
            // Check if router already exists
            if ($nasModel->getNasByIp($nasname)) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Router with this IP already exists']);
                    return;
                }
                $this->redirect('index.php?mod=router&error=duplicate');
                return;
            }

            // Add router
            $result = $nasModel->addNas($nasname, $shortname, $ruser, $naspassword, $secret);
            
            if ($result) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'message' => 'Router added successfully']);
                    return;
                }
                $this->redirect('index.php?mod=router&success=added');
            } else {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Failed to add router']);
                    return;
                }
                $this->redirect('index.php?mod=router&error=failed');
            }
        }

        // Show add form (should not reach here with modal)
        $this->redirect('index.php?mod=router');
    }

    public function edit()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Debug: Log received data
            error_log("Router Edit - POST Data: " . print_r($_POST, true));
            
            $nasname = $_POST['nasname'] ?? '';
            $shortname = $_POST['shortname'] ?? '';
            $ruser = $_POST['ruser'] ?? 'admin';
            $naspassword = $_POST['naspassword'] ?? '';
            $secret = $_POST['secret'] ?? '';

            // Debug: Log processed data
            error_log("Router Edit - Processed: nasname=$nasname, shortname=$shortname, ruser=$ruser, naspassword=$naspassword, secret=$secret");

            // Validation
            if (empty($nasname) || empty($naspassword)) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'IP Address and Password are required']);
                    return;
                }
                $this->redirect('index.php?mod=router&error=missing_fields');
                return;
            }

            $nasModel = new NasModel();
            
            // Check if router exists
            if (!$nasModel->getNasByIp($nasname)) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Router not found']);
                    return;
                }
                $this->redirect('index.php?mod=router&error=not_found');
                return;
            }

            // Update router
            $oldNasname = $_POST['old_nasname'] ?? $nasname; // Eski IP adresini al
            $data = [
                'nasname' => $nasname,
                'shortname' => $shortname,
                'ruser' => $ruser,
                'naspassword' => $naspassword,
                'secret' => $secret,
                'description' => $_POST['description'] ?? ''
            ];
            $result = $nasModel->updateNas($oldNasname, $data);
            
            if ($result) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'message' => 'Router updated successfully']);
                    return;
                }
                $this->redirect('index.php?mod=router&success=updated');
            } else {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Failed to update router']);
                    return;
                }
                $this->redirect('index.php?mod=router&error=failed');
            }
        }

        // Show edit form (should not reach here with modal)
        $this->redirect('index.php?mod=router');
    }

    public function delete()
    {
        $nasname = $_GET['nasname'] ?? '';
        $nasModel = new \App\Models\NasModel();
        $nasModel->deleteNas($nasname);
        header('Location: index.php?mod=router');
        exit;
    }

    public function getSystemResources()
    {
        header('Content-Type: application/json');
        
        $nasname = $_GET['nasname'] ?? '';
        if (empty($nasname)) {
            echo json_encode(['error' => 'NAS name required']);
            return;
        }
        
        $nasModel = new NasModel();
        $router = $nasModel->getNasByIp($nasname);
        
        if (!$router) {
            echo json_encode(['error' => 'Router not found']);
            return;
        }
        
        $mikrotikService = new \App\Services\MikrotikService();
        $resources = $mikrotikService->getSystemResources(
            $router['nasname'], 
            $router['ruser'], 
            $router['naspassword']
        );
        
        echo json_encode($resources);
    }

    public function testRouterConnection()
    {
        header('Content-Type: application/json');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            return;
        }
        
        $ip = $_POST['ip'] ?? '';
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        $port = $_POST['port'] ?? '8729';
        $secret = $_POST['secret'] ?? '';
        
        // Validation
        if (empty($ip) || empty($username) || empty($password) || empty($secret)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }
        
        try {
            $mikrotikService = new \App\Services\MikrotikService();
            
            // Test connection by trying to get system resources
            $resources = $mikrotikService->getSystemResources($ip, $username, $password, (int)$port);
            
            if (isset($resources['error'])) {
                echo json_encode(['success' => false, 'message' => $resources['error']]);
            } else {
                echo json_encode(['success' => true, 'message' => 'Connection successful']);
            }
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()]);
        }
    }

    private function isAjaxRequest()
    {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }

    private function redirect($url)
    {
        header('Location: ' . $url);
        exit;
    }
} 