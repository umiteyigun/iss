<?php

namespace App\Controllers;

use App\Models\PacketModel;

class PacketController
{
    public function index()
    {
        $packetModel = new PacketModel();
        
        // Handle search
        $searchTerm = $_GET['search'] ?? '';
        $packets = [];
        $stats = [];
        
        if (!empty($searchTerm)) {
            // Search packets
            $packets = $packetModel->searchPackets($searchTerm);
            $searchResultsCount = count($packets);
        } else {
            // Get all packets
            $packets = $packetModel->getAllPackets();
            $searchResultsCount = 0;
        }
        
        $stats = $packetModel->getPacketStats();
        
        $viewData = [
            'packets' => $packets,
            'stats' => $stats,
            'searchTerm' => $searchTerm,
            'searchResultsCount' => $searchResultsCount
        ];
        $viewFile = __DIR__ . '/../../views/packet/list.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function addPacket()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $packetName = $_POST['packet_name'] ?? '';
            $packetType = $_POST['packet_type'] ?? '';
            $download = $_POST['download'] ?? '';
            $upload = $_POST['upload'] ?? '';
            $packetPrice = $_POST['packet_price'] ?? '';
            $traffic = $_POST['traffic'] ?? 0;
            $description = $_POST['description'] ?? '';

            // Validation
            if (empty($packetName) || empty($packetType)) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Packet name and type are required']);
                    return;
                }
                $this->redirect('index.php?mod=packet&error=missing_fields');
                return;
            }

            $packetModel = new PacketModel();
            $data = [
                'packet_name' => $packetName,
                'packet_type' => $packetType,
                'download' => $download,
                'upload' => $upload,
                'packet_price' => $packetPrice,
                'traffic' => $traffic,
                'description' => $description
            ];
            
            $success = $packetModel->addPacket($data);
            
            if ($this->isAjaxRequest()) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => $success, 
                    'message' => $success ? 'Packet added successfully' : 'Failed to add packet'
                ]);
                return;
            }
            $this->redirect('index.php?mod=packet&success=added');
        }

        $this->redirect('index.php?mod=packet');
    }

    public function editPacket()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $packetId = $_POST['packet_id'] ?? '';
            $packetName = $_POST['packet_name'] ?? '';
            $packetType = $_POST['packet_type'] ?? '';
            $download = $_POST['download'] ?? '';
            $upload = $_POST['upload'] ?? '';
            $packetPrice = $_POST['packet_price'] ?? '';
            $traffic = $_POST['traffic'] ?? 0;
            $description = $_POST['description'] ?? '';

            // Validation
            if (empty($packetId) || empty($packetName) || empty($packetType)) {
                if ($this->isAjaxRequest()) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Required fields are missing']);
                    return;
                }
                $this->redirect('index.php?mod=packet&error=missing_fields');
                return;
            }

            $packetModel = new PacketModel();
            $data = [
                'packet_name' => $packetName,
                'packet_type' => $packetType,
                'download' => $download,
                'upload' => $upload,
                'packet_price' => $packetPrice,
                'traffic' => $traffic,
                'description' => $description
            ];
            
            $success = $packetModel->updatePacket($packetId, $data);
            
            if ($this->isAjaxRequest()) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => $success, 
                    'message' => $success ? 'Packet updated successfully' : 'Failed to update packet'
                ]);
                return;
            }
            $this->redirect('index.php?mod=packet&success=updated');
        }

        $this->redirect('index.php?mod=packet');
    }

    public function deletePacket()
    {
        $packetId = $_GET['packet_id'] ?? '';
        
        if (empty($packetId)) {
            if ($this->isAjaxRequest()) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Packet ID required']);
                return;
            }
            $this->redirect('index.php?mod=packet&error=missing_id');
            return;
        }

        $packetModel = new PacketModel();
        $success = $packetModel->deletePacket($packetId);
        
        if ($this->isAjaxRequest()) {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => $success, 
                'message' => $success ? 'Packet deleted successfully' : 'Failed to delete packet'
            ]);
            return;
        }
        $this->redirect('index.php?mod=packet&success=deleted');
    }

    public function getPacket()
    {
        $packetId = $_GET['packet_id'] ?? '';
        
        if (empty($packetId)) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Packet ID required']);
            return;
        }
        
        $packetModel = new PacketModel();
        $packet = $packetModel->getPacketById($packetId);
        
        header('Content-Type: application/json');
        if ($packet) {
            echo json_encode($packet);
        } else {
            echo json_encode(['error' => 'Packet not found']);
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