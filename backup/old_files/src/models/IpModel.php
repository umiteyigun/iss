<?php

namespace App\Models;

use PDO;
use PDOException;

class IpModel
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = \App\Database::getConnection();
    }

    public function getMetroIPs()
    {
        try {
            $query = "
                SELECT 
                    m.*,
                    u.name as user_name,
                    u.lastname as user_lastname,
                    u.username as user_username
                FROM metroIP m
                LEFT JOIN usersInfo u ON m.user = u.username
                ORDER BY m.ipaddress ASC, m.ports ASC
            ";
            
            $stmt = $this->pdo->query($query);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getMetroIPs: " . $e->getMessage());
            return [];
        }
    }

    public function getMetroIPsPaginated($limit, $offset)
    {
        try {
            $query = "
                SELECT 
                    m.*,
                    u.name as user_name,
                    u.lastname as user_lastname,
                    u.username as user_username
                FROM metroIP m
                LEFT JOIN usersInfo u ON m.user = u.username
                ORDER BY m.ipaddress ASC, m.ports ASC
                LIMIT :limit OFFSET :offset
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getMetroIPsPaginated: " . $e->getMessage());
            return [];
        }
    }

    public function getTotalMetroIPs()
    {
        try {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM metroIP");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error in getTotalMetroIPs: " . $e->getMessage());
            return 0;
        }
    }

    public function getRadippools()
    {
        try {
            $query = "
                SELECT 
                    r.*,
                    u.name as user_name,
                    u.lastname as user_lastname,
                    u.username as user_username
                FROM radippool r
                LEFT JOIN usersInfo u ON r.username = u.username
                ORDER BY r.pool_name ASC, r.framedipaddress ASC
            ";
            
            $stmt = $this->pdo->query($query);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getRadippools: " . $e->getMessage());
            return [];
        }
    }

    public function getRadippoolsPaginated($limit, $offset)
    {
        try {
            $query = "
                SELECT 
                    r.*,
                    u.name as user_name,
                    u.lastname as user_lastname,
                    u.username as user_username
                FROM radippool r
                LEFT JOIN usersInfo u ON r.username = u.username
                ORDER BY r.pool_name ASC, r.framedipaddress ASC
                LIMIT :limit OFFSET :offset
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getRadippoolsPaginated: " . $e->getMessage());
            return [];
        }
    }

    public function getTotalRadippools()
    {
        try {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM radippool");
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error in getTotalRadippools: " . $e->getMessage());
            return 0;
        }
    }

    public function getNasList()
    {
        try {
            $stmt = $this->pdo->query("SELECT nasname, shortname FROM nas ORDER BY shortname ASC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getNasList: " . $e->getMessage());
            return [];
        }
    }

    public function addMetroIP($data)
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO metroIP (ipaddress, ports, nasname, user, description) 
                VALUES (:ipaddress, :ports, :nasname, :user, :description)
            ");
            
            return $stmt->execute([
                ':ipaddress' => $data['ipaddress'],
                ':ports' => $data['ports'],
                ':nasname' => $data['nasname'],
                ':user' => $data['user'],
                ':description' => $data['description']
            ]);
        } catch (PDOException $e) {
            error_log("Error in addMetroIP: " . $e->getMessage());
            return false;
        }
    }

    public function addRadippool($data)
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO radippool (pool_name, framedipaddress, nasipaddress, username) 
                VALUES (:pool_name, :framedipaddress, :nasipaddress, :username)
            ");
            
            return $stmt->execute([
                ':pool_name' => $data['pool_name'],
                ':framedipaddress' => $data['framedipaddress'],
                ':nasipaddress' => $data['nasipaddress'],
                ':username' => $data['username']
            ]);
        } catch (PDOException $e) {
            error_log("Error in addRadippool: " . $e->getMessage());
            return false;
        }
    }

    public function deleteMetroIP($id)
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM metroIP WHERE id = :id");
            return $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            error_log("Error in deleteMetroIP: " . $e->getMessage());
            return false;
        }
    }

    public function deleteRadippool($id)
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM radippool WHERE id = :id");
            return $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            error_log("Error in deleteRadippool: " . $e->getMessage());
            return false;
        }
    }

    public function splitIP($data)
    {
        try {
            $this->pdo->beginTransaction();
            
            $publicIP = $data['public_ip'];
            $startPort = $data['start_port'];
            $endPort = $data['end_port'];
            $nasname = $data['nasname'];
            $description = $data['description'];
            
            // Port aralığını böl (örneğin 100 parçaya)
            $totalPorts = $endPort - $startPort + 1;
            $portsPerSplit = max(1, floor($totalPorts / 100));
            
            $stmt = $this->pdo->prepare("
                INSERT INTO metroIP (ipaddress, ports, nasname, user, description) 
                VALUES (:ipaddress, :ports, :nasname, '', :description)
            ");
            
            for ($i = 0; $i < 100; $i++) {
                $portStart = $startPort + ($i * $portsPerSplit);
                $portEnd = min($endPort, $portStart + $portsPerSplit - 1);
                
                if ($portStart > $endPort) break;
                
                $ports = $portStart . '-' . $portEnd;
                
                $stmt->execute([
                    ':ipaddress' => $publicIP,
                    ':ports' => $ports,
                    ':nasname' => $nasname,
                    ':description' => $description . ' (Split ' . ($i + 1) . ')'
                ]);
            }
            
            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error in splitIP: " . $e->getMessage());
            return false;
        }
    }

    public function searchMetroIP($searchTerm)
    {
        try {
            $searchPattern = '%' . $searchTerm . '%';
            
            $query = "
                SELECT 
                    m.*,
                    u.name as user_name,
                    u.lastname as user_lastname,
                    u.username as user_username
                FROM metroIP m
                LEFT JOIN usersInfo u ON m.user = u.username
                WHERE m.ipaddress LIKE :search 
                   OR m.ports LIKE :search 
                   OR m.nasname LIKE :search 
                   OR m.description LIKE :search
                   OR u.name LIKE :search
                   OR u.lastname LIKE :search
                   OR u.username LIKE :search
                ORDER BY m.ipaddress ASC, m.ports ASC
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':search' => $searchPattern]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in searchMetroIP: " . $e->getMessage());
            return [];
        }
    }

    public function searchRadippool($searchTerm)
    {
        try {
            $searchPattern = '%' . $searchTerm . '%';
            
            $query = "
                SELECT 
                    r.*,
                    u.name as user_name,
                    u.lastname as user_lastname,
                    u.username as user_username
                FROM radippool r
                LEFT JOIN usersInfo u ON r.username = u.username
                WHERE r.pool_name LIKE :search 
                   OR r.framedipaddress LIKE :search 
                   OR r.nasipaddress LIKE :search
                   OR u.name LIKE :search
                   OR u.lastname LIKE :search
                   OR u.username LIKE :search
                ORDER BY r.pool_name ASC, r.framedipaddress ASC
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':search' => $searchPattern]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in searchRadippool: " . $e->getMessage());
            return [];
        }
    }

    public function getAvailableMetroIPs($nasname)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ipaddress, ports FROM metroIP 
                WHERE nasname = :nasname AND (user = '' OR user IS NULL)
                ORDER BY ipaddress ASC, ports ASC
            ");
            $stmt->execute([':nasname' => $nasname]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getAvailableMetroIPs: " . $e->getMessage());
            return [];
        }
    }

    public function assignMetroIPToUser($ipId, $username)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE metroIP SET user = :username WHERE id = :id");
            return $stmt->execute([':username' => $username, ':id' => $ipId]);
        } catch (PDOException $e) {
            error_log("Error in assignMetroIPToUser: " . $e->getMessage());
            return false;
        }
    }

    public function unassignMetroIPFromUser($ipId)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE metroIP SET user = '' WHERE id = :id");
            return $stmt->execute([':id' => $ipId]);
        } catch (PDOException $e) {
            error_log("Error in unassignMetroIPFromUser: " . $e->getMessage());
            return false;
        }
    }
} 