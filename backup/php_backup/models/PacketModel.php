<?php

namespace App\Models;

use App\Database;

class PacketModel
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAllPackets()
    {
        $query = "SELECT * FROM packetsInfo ORDER BY id DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getPacketById($id)
    {
        $query = "SELECT * FROM packetsInfo WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function searchPackets($searchTerm)
    {
        $searchTerm = '%' . $searchTerm . '%';
        $query = "SELECT * FROM packetsInfo 
                  WHERE packet_name LIKE ? 
                  OR packet_type LIKE ? 
                  OR description LIKE ? 
                  ORDER BY id DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function addPacket($data)
    {
        $query = "INSERT INTO packetsInfo (packet_name, packet_type, download, upload, packet_price, traffic, description, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            $data['packet_name'],
            $data['packet_type'],
            $data['download'] ?? '',
            $data['upload'] ?? '',
            $data['packet_price'],
            $data['traffic'] ?? 0,
            $data['description'] ?? ''
        ]);
    }

    public function updatePacket($id, $data)
    {
        $query = "UPDATE packetsInfo SET 
                  packet_name = ?, 
                  packet_type = ?, 
                  download = ?,
                  upload = ?,
                  packet_price = ?, 
                  traffic = ?,
                  description = ?,
                  updated_at = NOW()
                  WHERE id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            $data['packet_name'],
            $data['packet_type'],
            $data['download'] ?? '',
            $data['upload'] ?? '',
            $data['packet_price'],
            $data['traffic'] ?? 0,
            $data['description'] ?? '',
            $id
        ]);
    }

    public function deletePacket($id)
    {
        $query = "DELETE FROM packetsInfo WHERE id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }

    public function getPacketStats()
    {
        $stats = [];
        
        // Total packets
        $query = "SELECT COUNT(*) as total FROM packetsInfo";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $stats['total'] = $stmt->fetch(\PDO::FETCH_ASSOC)['total'];
        
        // Packets by type
        $query = "SELECT packet_type, COUNT(*) as count FROM packetsInfo GROUP BY packet_type";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $stats['by_type'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Average price
        $query = "SELECT AVG(packet_price) as avg_price FROM packetsInfo WHERE packet_price > 0";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $stats['avg_price'] = $stmt->fetch(\PDO::FETCH_ASSOC)['avg_price'];
        
        return $stats;
    }
}
