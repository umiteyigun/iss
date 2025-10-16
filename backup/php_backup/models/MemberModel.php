<?php

namespace App\Models;

use PDO;
use PDOException;

class MemberModel extends TenantAwareModel
{
    protected $table = 'members';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get the total number of admin members.
     * @return int
     */
    public function getMemberCount()
    {
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM members");
        return $stmt->fetchColumn();
    }

    /**
     * Get a paginated list of admin members.
     * @param int $page
     * @param int $pageSize
     * @return array
     */
    public function getMembers($page = 1, $pageSize = 15)
    {
        $offset = ($page - 1) * $pageSize;

        $query = "SELECT id, username, name, lastname, phone, email, mode 
                  FROM members 
                  ORDER BY username 
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($query);
        $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Creates a new admin member in the database.
     * @param array $data
     * @return bool
     */
    public function createMember($data)
    {
        // Note: Passwords should be hashed before being stored.
        // For example: $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $sql = "INSERT INTO members (username, name, lastname, tc, phone, photo, password, mode) 
                VALUES (:username, :name, :lastname, :tc, :phone, :photo, :password, :mode)";
        
        $stmt = $this->pdo->prepare($sql);
        
        try {
            $stmt->execute([
                ':username' => $data['username'],
                ':name' => $data['name'],
                ':lastname' => $data['lastname'],
                ':tc' => $data['tc'],
                ':phone' => $data['phone'],
                ':photo' => $data['photo'],
                ':password' => $data['password'], // Storing plaintext password as per original project
                ':mode' => $data['mode']
            ]);
            return true;
        } catch (PDOException $e) {
            // In a real app, log this error
            // error_log($e->getMessage());
            return false;
        }
    }

    /**
     * Deletes an admin member from the database.
     * @param int $id
     * @return bool
     */
    public function deleteMember($id)
    {
        $sql = "DELETE FROM members WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        
        try {
            $stmt->execute([':id' => $id]);
            //rowCount() returns the number of affected rows.
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            // In a real app, log this error
            // error_log($e->getMessage());
            return false;
        }
    }

    /**
     * Retrieves a single admin member by their ID.
     * @param int $id
     * @return mixed
     */
    public function getMemberById($id)
    {
        $sql = "SELECT * FROM members WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Updates an admin member's data in the database.
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function updateMember($id, $data)
    {
        // Dynamically build the query based on whether the password is being updated
        $sql = "UPDATE members SET 
                    username = :username, 
                    name = :name, 
                    lastname = :lastname, 
                    tc = :tc, 
                    phone = :phone, 
                    mode = :mode";
        
        $params = [
            ':id' => $id,
            ':username' => $data['username'],
            ':name' => $data['name'],
            ':lastname' => $data['lastname'],
            ':tc' => $data['tc'],
            ':phone' => $data['phone'],
            ':mode' => $data['mode']
        ];
        
        if (!empty($data['password'])) {
            $sql .= ", password = :password";
            $params[':password'] = $data['password']; // Storing plaintext
        }

        if (!empty($data['photo'])) {
            $sql .= ", photo = :photo";
            $params[':photo'] = $data['photo'];
        }

        $sql .= " WHERE id = :id";
        
        $stmt = $this->pdo->prepare($sql);
        
        try {
            return $stmt->execute($params);
        } catch (PDOException $e) {
            // error_log($e->getMessage());
            return false;
        }
    }

    /**
     * Verifies member credentials against the database.
     * @param string $username
     * @param string $password
     * @return mixed The member data if credentials are correct, otherwise false.
     */
    public function verifyMember($username, $password)
    {
        $sql = "SELECT * FROM members WHERE username = :username AND password = :password";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':username' => $username, ':password' => $password]);
        $member = $stmt->fetch();
        return $member; // Returns the user array or false if not found
    }
} 