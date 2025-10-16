<?php

namespace App\Models;

use PDO;
use PDOException;

class NasModel
{
    protected $db;

    public function __construct()
    {
        $this->db = (\App\Database::getConnection());
    }

    /**
     * Fetches all NAS devices from the database.
     * @return array An array of NAS devices, each including nasname (IP), naspassword, and ruser.
     */
    public function getAllNas(): array
    {
        try {
            // 'nasname' is typically the IP address we need to connect to.
            // 'naspassword' is the password for Mikrotik API connection.
            // 'ruser' is the username for Mikrotik API connection.
            // 'secret' is the RADIUS secret for authentication.
            $stmt = $this->db->query("SELECT id, nasname, naspassword, ruser, secret, shortname, description FROM nas WHERE nasname IS NOT NULL AND nasname != '' ORDER BY nasname ASC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Failed to get all NAS devices: " . $e->getMessage());
            return [];
        }
    }

    public function getNasCount(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) FROM nas WHERE nasname IS NOT NULL AND nasname != ''");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Failed to get NAS count: " . $e->getMessage());
            return 0;
        }
    }

    public function getNasById($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT nasname, naspassword, ruser, secret, shortname, description FROM nas WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Failed to get NAS by ID: " . $e->getMessage());
            return false;
        }
    }

    public function addNas($data)
    {
        $stmt = $this->db->prepare("INSERT INTO nas (nasname, shortname, ruser, naspassword, secret, description) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['nasname'],
            $data['shortname'],
            $data['ruser'],
            $data['naspassword'],
            $data['secret'],
            $data['description']
        ]);
    }

    public function getNasByIp($nasname)
    {
        $stmt = $this->db->prepare("SELECT * FROM nas WHERE nasname = ?");
        $stmt->execute([$nasname]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateNas($oldNasname, $data)
    {
        try {
            $stmt = $this->db->prepare("UPDATE nas SET nasname = ?, shortname = ?, ruser = ?, naspassword = ?, secret = ?, description = ? WHERE nasname = ?");
            $result = $stmt->execute([
                $data['nasname'],
                $data['shortname'],
                $data['ruser'],
                $data['naspassword'],
                $data['secret'],
                $data['description'],
                $oldNasname
            ]);
            return $result;
        } catch (PDOException $e) {
            error_log("Failed to update NAS: " . $e->getMessage());
            return false;
        }
    }

    public function deleteNas($nasname)
    {
        $stmt = $this->db->prepare("DELETE FROM nas WHERE nasname = ?");
        $stmt->execute([$nasname]);
    }
} 