<?php

namespace App\Controllers;

use App\Models\NasModel;

class NasController
{
    public function index()
    {
        $nasModel = new NasModel();
        $nasDevices = $nasModel->getAllNas();
        
        // For a normal, full-page load, include the main layout.
        $viewFile = __DIR__ . '/../../views/nas.php';
        require __DIR__ . '/../../views/layout.php';
    }
    
    public function create()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $nasModel = new NasModel();
            
            $data = [
                'nasname' => $_POST['nasname'] ?? '',
                'shortname' => $_POST['shortname'] ?? '',
                'ruser' => $_POST['ruser'] ?? '',
                'naspassword' => $_POST['naspassword'] ?? '',
                'secret' => $_POST['secret'] ?? '',
                'description' => $_POST['description'] ?? ''
            ];
            
            try {
                $nasModel->addNas($data);
                $_SESSION['success_message'] = 'NAS device added successfully!';
                header('Location: /index.php?mod=nas');
                exit;
            } catch (\Exception $e) {
                $_SESSION['error_message'] = 'Failed to add NAS device: ' . $e->getMessage();
            }
        }
        
        // For a normal, full-page load, include the main layout.
        $viewFile = __DIR__ . '/../../views/create_nas.php';
        require __DIR__ . '/../../views/layout.php';
    }
    
    public function edit()
    {
        $nasModel = new NasModel();
        $nasname = $_GET['nasname'] ?? '';
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = [
                'nasname' => $_POST['nasname'] ?? '',
                'shortname' => $_POST['shortname'] ?? '',
                'ruser' => $_POST['ruser'] ?? '',
                'naspassword' => $_POST['naspassword'] ?? '',
                'secret' => $_POST['secret'] ?? '',
                'description' => $_POST['description'] ?? ''
            ];
            
            try {
                $nasModel->updateNas($nasname, $data);
                $_SESSION['success_message'] = 'NAS device updated successfully!';
                header('Location: /index.php?mod=nas');
                exit;
            } catch (\Exception $e) {
                $_SESSION['error_message'] = 'Failed to update NAS device: ' . $e->getMessage();
            }
        }
        
        $nasDevice = $nasModel->getNasByIp($nasname);
        if (!$nasDevice) {
            $_SESSION['error_message'] = 'NAS device not found!';
            header('Location: /index.php?mod=nas');
            exit;
        }
        
        // For a normal, full-page load, include the main layout.
        $viewFile = __DIR__ . '/../../views/edit_nas.php';
        require __DIR__ . '/../../views/layout.php';
    }
    
    public function delete()
    {
        $nasModel = new NasModel();
        $nasname = $_GET['nasname'] ?? '';
        
        try {
            $nasModel->deleteNas($nasname);
            $_SESSION['success_message'] = 'NAS device deleted successfully!';
        } catch (\Exception $e) {
            $_SESSION['error_message'] = 'Failed to delete NAS device: ' . $e->getMessage();
        }
        
        header('Location: /index.php?mod=nas');
        exit;
    }
    
    public function details()
    {
        $nasModel = new NasModel();
        $nasname = $_GET['nasname'] ?? '';
        
        $nasDevice = $nasModel->getNasByIp($nasname);
        if (!$nasDevice) {
            $_SESSION['error_message'] = 'NAS device not found!';
            header('Location: /index.php?mod=nas');
            exit;
        }
        
        // For a normal, full-page load, include the main layout.
        $viewFile = __DIR__ . '/../../views/nas_details.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function deviceDetails()
    {
        $nasModel = new NasModel();
        $deviceId = $_GET['id'] ?? '';

        // ID'yi decode et ve güvenlik kontrolü yap
        $decodedId = base64_decode($deviceId);
        if (!$decodedId || !is_numeric($decodedId)) {
            $_SESSION['error_message'] = 'Invalid device ID!';
            header('Location: /index.php?mod=nas');
            exit;
        }

        $nasDevice = $nasModel->getNasById($decodedId);
        if (!$nasDevice) {
            $_SESSION['error_message'] = 'NAS device not found!';
            header('Location: /index.php?mod=nas');
            exit;
        }

        $viewData = [
            'nasDevice' => $nasDevice,
            'error_message' => $_SESSION['error_message'] ?? null,
        ];
        unset($_SESSION['error_message']);

        $viewFile = __DIR__ . '/../../views/nas_details.php';
        require __DIR__ . '/../../views/layout.php';
    }
}
