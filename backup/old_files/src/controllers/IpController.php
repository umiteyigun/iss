<?php

namespace App\Controllers;

use App\Models\IpModel;

class IpController
{
    private $ipModel;
    private $perPage = 15; // Her sayfada 15 satır

    public function __construct()
    {
        $this->ipModel = new IpModel();
    }

    public function index()
    {
        // Sayfa numarasını al
        $metroIPPage = isset($_GET['metroip_page']) ? (int)$_GET['metroip_page'] : 1;
        $radippoolPage = isset($_GET['radippool_page']) ? (int)$_GET['radippool_page'] : 1;
        
        // MetroIP sayfalama
        $metroIPOffset = ($metroIPPage - 1) * $this->perPage;
        $metroIPs = $this->ipModel->getMetroIPsPaginated($this->perPage, $metroIPOffset);
        $totalMetroIPs = $this->ipModel->getTotalMetroIPs();
        $totalMetroIPPages = ceil($totalMetroIPs / $this->perPage);
        
        // Radippool sayfalama
        $radippoolOffset = ($radippoolPage - 1) * $this->perPage;
        $radippools = $this->ipModel->getRadippoolsPaginated($this->perPage, $radippoolOffset);
        $totalRadippools = $this->ipModel->getTotalRadippools();
        $totalRadippoolPages = ceil($totalRadippools / $this->perPage);
        
        $nasList = $this->ipModel->getNasList();
        
        $viewData = [
            'metroIPs' => $metroIPs,
            'radippools' => $radippools,
            'nasList' => $nasList,
            'metroIPPage' => $metroIPPage,
            'radippoolPage' => $radippoolPage,
            'totalMetroIPPages' => $totalMetroIPPages,
            'totalRadippoolPages' => $totalRadippoolPages,
            'totalMetroIPs' => $totalMetroIPs,
            'totalRadippools' => $totalRadippools,
            'perPage' => $this->perPage
        ];
        $viewFile = __DIR__ . '/../../views/ip/list.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function addMetroIP()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = [
                'ipaddress' => $_POST['ipaddress'] ?? '',
                'ports' => $_POST['ports'] ?? '',
                'nasname' => $_POST['nasname'] ?? '',
                'user' => $_POST['user'] ?? '',
                'description' => $_POST['description'] ?? ''
            ];

            if ($this->ipModel->addMetroIP($data)) {
                header('Location: /index.php?mod=ip&success=metroip_added');
            } else {
                header('Location: /index.php?mod=ip&error=metroip_failed');
            }
            exit;
        }
    }

    public function addRadippool()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = [
                'pool_name' => $_POST['pool_name'] ?? '',
                'framedipaddress' => $_POST['framedipaddress'] ?? '',
                'nasipaddress' => $_POST['nasipaddress'] ?? '',
                'username' => $_POST['username'] ?? ''
            ];

            if ($this->ipModel->addRadippool($data)) {
                header('Location: /index.php?mod=ip&success=radippool_added');
            } else {
                header('Location: /index.php?mod=ip&error=radippool_failed');
            }
            exit;
        }
    }

    public function deleteMetroIP()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = $_POST['id'] ?? null;
            
            if ($id && $this->ipModel->deleteMetroIP($id)) {
                header('Location: /index.php?mod=ip&success=metroip_deleted');
            } else {
                header('Location: /index.php?mod=ip&error=metroip_delete_failed');
            }
            exit;
        }
    }

    public function deleteRadippool()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = $_POST['id'] ?? null;
            
            if ($id && $this->ipModel->deleteRadippool($id)) {
                header('Location: /index.php?mod=ip&success=radippool_deleted');
            } else {
                header('Location: /index.php?mod=ip&error=radippool_delete_failed');
            }
            exit;
        }
    }

    public function splitIP()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = [
                'public_ip' => $_POST['public_ip'] ?? '',
                'start_port' => (int)($_POST['start_port'] ?? 1),
                'end_port' => (int)($_POST['end_port'] ?? 65535),
                'nasname' => $_POST['nasname'] ?? '',
                'description' => $_POST['description'] ?? ''
            ];

            if ($this->ipModel->splitIP($data)) {
                header('Location: /index.php?mod=ip&success=ip_split');
            } else {
                header('Location: /index.php?mod=ip&error=ip_split_failed');
            }
            exit;
        }
    }

    public function searchMetroIP()
    {
        $searchTerm = $_GET['search'] ?? '';
        $metroIPs = $this->ipModel->searchMetroIP($searchTerm);
        
        header('Content-Type: application/json');
        echo json_encode($metroIPs);
    }

    public function searchRadippool()
    {
        $searchTerm = $_GET['search'] ?? '';
        $radippools = $this->ipModel->searchRadippool($searchTerm);
        
        header('Content-Type: application/json');
        echo json_encode($radippools);
    }

    public function unassignMetroIP()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $id = $_POST['id'] ?? null;
            
            if ($id && $this->ipModel->unassignMetroIPFromUser($id)) {
                header('Location: /index.php?mod=ip&success=metroip_unassigned');
            } else {
                header('Location: /index.php?mod=ip&error=metroip_unassign_failed');
            }
            exit;
        }
    }
} 