<?php

namespace App\Models;

use PDO;
use PDOException;
use DateTime;

class InvoiceModel
{
    protected $db;

    public function __construct()
    {
        // Reuse the existing Database connection logic
        $this->db = (new \Database())->getConnection();
    }

    public function getInvoicesForUser(string $username, int $page = 1, int $pageSize = 15): array
    {
        $offset = ($page - 1) * $pageSize;
        try {
            $stmt = $this->db->prepare(
                "SELECT * FROM userInvoices 
                 WHERE username = :username 
                 ORDER BY peydate DESC 
                 LIMIT :pagesize OFFSET :offset"
            );
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->bindParam(':pagesize', $pageSize, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Failed to get invoices: " . $e->getMessage());
            return [];
        }
    }

    public function getTotalInvoiceCountForUser(string $username): int
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM userInvoices WHERE username = :username");
            $stmt->execute([':username' => $username]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Failed to get invoice count: " . $e->getMessage());
            return 0;
        }
    }
    
    public function getInvoiceById(int $id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM userInvoices WHERE id = :id");
            $stmt->execute([':id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Failed to get invoice by ID: " . $e->getMessage());
            return false;
        }
    }

    public function createInvoice(array $data): bool
    {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO userInvoices (username, packet, price, peydate, expire, peymode, tdurum, aciklama, tyapan) 
                 VALUES (:username, :packet, :price, :peydate, :expire, :peymode, :tdurum, :aciklama, :tyapan)"
            );
            return $stmt->execute([
                ':username' => $data['username'],
                ':packet' => $data['packet'],
                ':price' => $data['price'],
                ':peydate' => $data['peydate'],
                ':expire' => $data['expire'],
                ':peymode' => $data['peymode'],
                ':tdurum' => $data['tdurum'],
                ':aciklama' => $data['aciklama'],
                ':tyapan' => $data['tyapan'] // The logged-in member who performed the action
            ]);
        } catch (PDOException $e) {
            error_log("Failed to create invoice: " . $e->getMessage());
            return false;
        }
    }

    public function updateInvoice(int $id, array $data): bool
    {
        try {
            $stmt = $this->db->prepare(
                "UPDATE userInvoices SET 
                 packet = :packet, price = :price, peydate = :peydate, expire = :expire, 
                 peymode = :peymode, tdurum = :tdurum, aciklama = :aciklama, tyapan = :tyapan
                 WHERE id = :id"
            );
            return $stmt->execute([
                ':id' => $id,
                ':packet' => $data['packet'],
                ':price' => $data['price'],
                ':peydate' => $data['peydate'],
                ':expire' => $data['expire'],
                ':peymode' => $data['peymode'],
                ':tdurum' => $data['tdurum'],
                ':aciklama' => $data['aciklama'],
                ':tyapan' => $data['tyapan']
            ]);
        } catch (PDOException $e) {
            error_log("Failed to update invoice: " . $e->getMessage());
            return false;
        }
    }

    public function deleteInvoice(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM userInvoices WHERE id = :id");
            return $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            error_log("Failed to delete invoice: " . $e->getMessage());
            return false;
        }
    }
} 