<?php

namespace App\Models;

use PDO;
use PDOException;

class UserModel extends TenantAwareModel
{
    protected $table = 'usersInfo';

    public function __construct()
    {
        parent::__construct();
    }

    public function getUserCount()
    {
        try {
            $stmt = $this->pdo->query("SELECT count(*) FROM radcheck WHERE attribute = 'Cleartext-password'");
            $result = $stmt->fetchColumn();
            return $result ? (int)$result : 0;
        } catch (PDOException $e) {
            error_log("Error in getUserCount: " . $e->getMessage());
            return 0;
        }
    }

    public function getUsers($page = 1, $pageSize = 10)
    {
        $offset = ($page - 1) * $pageSize;

        $query = "
            SELECT
                rc.username,
                ui.name,
                ui.lastname,
                ui.email,
                ui.packet,
                rr.value AS ipaddress,
                COALESCE(rp.nasipaddress, ra.nasipaddress) AS nasname,
                (
                    SELECT COUNT(*) FROM radacct WHERE username = rc.username AND acctstoptime IS NULL
                ) as is_online,
                (
                    SELECT value FROM radcheck WHERE username = rc.username AND attribute = 'Expiration' LIMIT 1
                ) as expire
            FROM radcheck AS rc
            LEFT JOIN usersInfo AS ui ON rc.username = ui.username
            LEFT JOIN radreply AS rr ON rc.username = rr.username AND rr.attribute = 'Framed-IP-Address'
            LEFT JOIN radippool AS rp ON rc.username = rp.username
            LEFT JOIN (
                SELECT username, nasipaddress 
                FROM radacct 
                WHERE acctstoptime IS NULL 
                GROUP BY username 
                ORDER BY acctstarttime DESC
            ) AS ra ON rc.username = ra.username
            WHERE rc.attribute = 'Cleartext-Password'
            ORDER BY rc.username ASC
            LIMIT :limit OFFSET :offset
        ";

        try {
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in getUsers: " . $e->getMessage());
            return [];
        }
    }

    public function searchUsers($searchTerm, $page = 1, $pageSize = 10)
    {
        $offset = ($page - 1) * $pageSize;
        $searchPattern = '%' . $searchTerm . '%';

        $query = "
            SELECT
                rc.username,
                ui.name,
                ui.lastname,
                ui.email,
                ui.packet,
                rr.value AS ipaddress,
                COALESCE(rp.nasipaddress, ra.nasipaddress) AS nasname,
                (
                    SELECT COUNT(*) FROM radacct WHERE username = rc.username AND acctstoptime IS NULL
                ) as is_online,
                (
                    SELECT value FROM radcheck WHERE username = rc.username AND attribute = 'Expiration' LIMIT 1
                ) as expire
            FROM radcheck AS rc
            LEFT JOIN usersInfo AS ui ON rc.username = ui.username
            LEFT JOIN radreply AS rr ON rc.username = rr.username AND rr.attribute = 'Framed-IP-Address'
            LEFT JOIN radippool AS rp ON rc.username = rp.username
            LEFT JOIN (
                SELECT username, nasipaddress 
                FROM radacct 
                WHERE acctstoptime IS NULL 
                GROUP BY username 
                ORDER BY acctstarttime DESC
            ) AS ra ON rc.username = ra.username
            WHERE rc.attribute = 'Cleartext-Password'
            AND (
                rc.username LIKE :search1
                OR ui.name LIKE :search2
                OR ui.lastname LIKE :search3
                OR ui.email LIKE :search4
                OR ui.phone1 LIKE :search5
                OR ui.phone2 LIKE :search6
                OR ui.phone3 LIKE :search7
                OR ui.address LIKE :search8
                OR ui.tc LIKE :search9
                OR ui.unvan LIKE :search10
                OR ui.vergino LIKE :search11
                OR ui.vergidairesi LIKE :search12
                OR ui.accesspoint LIKE :search13
                OR ui.packet LIKE :search14
            )
            ORDER BY rc.username ASC
            LIMIT :limit OFFSET :offset
        ";

        try {
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(':search1', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search2', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search3', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search4', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search5', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search6', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search7', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search8', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search9', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search10', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search11', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search12', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search13', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search14', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in searchUsers: " . $e->getMessage());
            return [];
        }
    }

    public function getSearchUserCount($searchTerm)
    {
        $searchPattern = '%' . $searchTerm . '%';

        $query = "
            SELECT COUNT(DISTINCT rc.username)
            FROM radcheck AS rc
            LEFT JOIN usersInfo AS ui ON rc.username = ui.username
            WHERE rc.attribute = 'Cleartext-Password'
            AND (
                rc.username LIKE :search1
                OR ui.name LIKE :search2
                OR ui.lastname LIKE :search3
                OR ui.email LIKE :search4
                OR ui.phone1 LIKE :search5
                OR ui.phone2 LIKE :search6
                OR ui.phone3 LIKE :search7
                OR ui.address LIKE :search8
                OR ui.tc LIKE :search9
                OR ui.unvan LIKE :search10
                OR ui.vergino LIKE :search11
                OR ui.vergidairesi LIKE :search12
                OR ui.accesspoint LIKE :search13
                OR ui.packet LIKE :search14
            )
        ";

        try {
            $stmt = $this->pdo->prepare($query);
            $stmt->bindValue(':search1', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search2', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search3', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search4', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search5', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search6', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search7', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search8', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search9', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search10', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search11', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search12', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search13', $searchPattern, PDO::PARAM_STR);
            $stmt->bindValue(':search14', $searchPattern, PDO::PARAM_STR);
            $stmt->execute();

            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error in getSearchUserCount: " . $e->getMessage());
            return 0;
        }
    }

    public function getUserDetails($username)
    {
        $query = "
            SELECT 
                ui.*, 
                rc.value as secret,
                rp.pool_name as nasname,
                rp.nasipaddress as nasipaddress,
                rp.framedipaddress as framedipaddress,
                (SELECT COUNT(*) FROM radacct WHERE username = :username1 AND acctstoptime IS NULL) as is_online,
                (SELECT value FROM radcheck WHERE username = :username2 AND attribute = 'Expiration' LIMIT 1) as expire
            FROM usersInfo AS ui
            LEFT JOIN radcheck rc ON ui.username = rc.username AND rc.attribute = 'Cleartext-password'
            LEFT JOIN radippool rp ON ui.username = rp.username
            WHERE ui.username = :username3
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':username1', $username, PDO::PARAM_STR);
        $stmt->bindParam(':username2', $username, PDO::PARAM_STR);
        $stmt->bindParam(':username3', $username, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function verifyAdminCredentials($username, $password)
    {
        $query = "SELECT * FROM members WHERE username = :username AND password = :password LIMIT 1";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->bindParam(':password', $password, PDO::PARAM_STR); // Note: Passwords should be hashed!
        $stmt->execute();

        return $stmt->fetch();
    }

    // Methods for New User Form
    public function getPackets() {
        return $this->pdo->query("SELECT name, price FROM packetsInfo ORDER BY id ASC")->fetchAll();
    }

    public function getNas() {
        return $this->pdo->query("SELECT shortname FROM nas ORDER BY shortname ASC")->fetchAll();
    }

    public function getAccessPoints($nasName) {
        $stmt = $this->pdo->prepare("SELECT name FROM AccessPoints WHERE nasname = :nasname");
        $stmt->execute(['nasname' => $nasName]);
        return $stmt->fetchAll();
    }
    
    public function getStaticIPs($nasName) {
        $stmt = $this->pdo->prepare("SELECT ipaddress, ports FROM metroIP WHERE nasname = :nasname AND user = ''");
        $stmt->execute(['nasname' => $nasName]);
        return $stmt->fetchAll();
    }

    public function getIpPools($nasName) {
        // This query might need adjustment based on the actual schema for pools per nas
        return $this->pdo->query("SELECT pool_name FROM radippool")->fetchAll();
    }

    public function createUser($data) {
        try {
            $this->pdo->beginTransaction();

            // 1. Insert into usersInfo
            $sqlUserInfo = "INSERT INTO usersInfo (username, name, lastname, email, address, phone1, phone2, phone3, tc, packet, accesspoint, ftipi, unvan, vergino, vergidairesi, regdate) 
                            VALUES (:username, :name, :lastname, :email, :address, :phone1, :phone2, :phone3, :tc, :packet, :accesspoint, :ftipi, :unvan, :vergino, :vergidairesi, NOW())";
            $stmtUserInfo = $this->pdo->prepare($sqlUserInfo);
            $stmtUserInfo->execute([
                ':username' => $data['username'],
                ':name' => $data['name'],
                ':lastname' => $data['lastname'],
                ':email' => $data['email'],
                ':address' => $data['address'],
                ':phone1' => $data['phone1'],
                ':phone2' => $data['phone2'],
                ':phone3' => $data['phone3'],
                ':tc' => $data['tc'] ?? '',
                ':packet' => $data['packet'],
                ':accesspoint' => $data['accesspoint'],
                ':ftipi' => $data['turu'],
                ':unvan' => $data['unvan'] ?? '',
                ':vergino' => $data['vergino'] ?? '',
                ':vergidairesi' => $data['vergidairesi'] ?? ''
            ]);
            
            // 2. Insert into userInvoices
            $sqlInvoice = "INSERT INTO userInvoices (username, price, peydate, expire, packet) VALUES (:username, :price, NOW(), :expire, :packet)";
            $stmtInvoice = $this->pdo->prepare($sqlInvoice);
            $stmtInvoice->execute([
                ':username' => $data['username'],
                ':price' => $data['price'], // This needs to be calculated/fetched
                ':expire' => $data['expire'],
                ':packet' => $data['packet']
            ]);

            // 3. Insert into radcheck (password)
            $sqlRadCheck = "INSERT INTO radcheck (username, attribute, op, value) VALUES (:username, 'Cleartext-Password', ':=', :password)";
            $stmtRadCheck = $this->pdo->prepare($sqlRadCheck);
            $stmtRadCheck->execute([':username' => $data['username'], ':password' => $data['password']]);

            // 4. Insert into radreply (rate limits from packet info)
            // This is a simplified version. The original code fetches these values.
            $sqlRadReply = "INSERT INTO radreply (username, attribute, op, value) VALUES (:username, 'Mikrotik-Rate-Limit', ':=', :rate_limit)";
            $stmtRadReply = $this->pdo->prepare($sqlRadReply);
            $stmtRadReply->execute([':username' => $data['username'], ':rate_limit' => $data['rate_limit']]);

            // 5. Insert into radippool
            $sqlRadIpPool = "INSERT INTO radippool (pool_name, framedipaddress, nasipaddress, username) VALUES (:pool_name, :framedipaddress, :nasipaddress, :username)";
            $stmtRadIpPool = $this->pdo->prepare($sqlRadIpPool);
            $stmtRadIpPool->execute([
                ':pool_name' => $data['ippool'],
                ':framedipaddress' => $data['static_ip'] ?? '', // This might be static or from pool
                ':nasipaddress' => $data['nas_ip'], // This needs to be fetched based on nas name
                ':username' => $data['username']
            ]);

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            // Log the error: error_log($e->getMessage());
            return false;
        }
    }

    public function updateUser($username, $data)
    {
        $this->pdo->beginTransaction();

        try {
            // Update usersInfo table
            $stmt = $this->pdo->prepare("UPDATE usersInfo SET 
                name = :name, lastname = :lastname, email = :email, 
                address = :address, phone1 = :phone1, phone2 = :phone2, 
                phone3 = :phone3, tc = :tc, packet = :packet, 
                accesspoint = :accesspoint, turu = :turu, unvan = :unvan, 
                vergino = :vergino, vergidairesi = :vergidairesi
                WHERE username = :username");
            
            $stmt->execute([
                ':name' => $data['name'],
                ':lastname' => $data['lastname'],
                ':email' => $data['email'],
                ':address' => $data['address'],
                ':phone1' => $data['phone1'],
                ':phone2' => $data['phone2'],
                ':phone3' => $data['phone3'],
                ':tc' => $data['tc'],
                ':packet' => $data['packet'],
                ':accesspoint' => $data['accesspoint'],
                ':turu' => $data['turu'],
                ':unvan' => $data['unvan'],
                ':vergino' => $data['vergino'],
                ':vergidairesi' => $data['vergidairesi'],
                ':username' => $username
            ]);

            // Update password in radcheck if it's provided
            if (!empty($data['password'])) {
                $stmt = $this->pdo->prepare("UPDATE radcheck SET value = :password WHERE username = :username AND attribute = 'Cleartext-Password'");
                $stmt->execute([':password' => $data['password'], ':username' => $username]);
            }

            // Update expiration in radcheck
            $stmt = $this->pdo->prepare("UPDATE radcheck SET value = :expire WHERE username = :username AND attribute = 'Expiration'");
            $stmt->execute([':expire' => date('d M Y H:i', strtotime($data['expire'])), ':username' => $username]);
            
            // Update rate limit in radreply
            $stmt = $this->pdo->prepare("UPDATE radreply SET value = :ratelimit WHERE username = :username AND attribute = 'Mikrotik-Rate-Limit'");
            $stmt->execute([':ratelimit' => $data['rate_limit'], ':username' => $username]);

            // IP Pool and Static IP logic might be more complex (delete old, insert new if changed)
            // For now, let's assume it's just an update if it exists, or insert if not.
            // This part needs more robust logic based on business rules.
            
            // For simplicity, we'll just update the pool name in radippool
            $stmt = $this->pdo->prepare("UPDATE radippool SET pool_name = :poolname WHERE username = :username");
            $stmt->execute([':poolname' => $data['ippool'], ':username' => $username]);


            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("User update failed: " . $e->getMessage());
            return false;
        }
    }

    public function deleteUser($username)
    {
        $this->pdo->beginTransaction();
        try {
            // Delete from usersInfo
            $stmt = $this->pdo->prepare("DELETE FROM usersInfo WHERE username = :username");
            $stmt->execute([':username' => $username]);

            // Delete from radcheck
            $stmt = $this->pdo->prepare("DELETE FROM radcheck WHERE username = :username");
            $stmt->execute([':username' => $username]);

            // Delete from radreply
            $stmt = $this->pdo->prepare("DELETE FROM radreply WHERE username = :username");
            $stmt->execute([':username' => $username]);

            // Delete from radippool
            $stmt = $this->pdo->prepare("DELETE FROM radippool WHERE username = :username");
            $stmt->execute([':username' => $username]);
            
            // Optional: Delete from userInvoices, or just keep them for records
            $stmt = $this->pdo->prepare("DELETE FROM userInvoices WHERE username = :username");
            $stmt->execute([':username' => $username]);

            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("User deletion failed: " . $e->getMessage());
            return false;
        }
    }

    public function renewSubscription($username, $months, $packetName, $totalPrice, $paymentMode)
    {
        $this->pdo->beginTransaction();

        try {
            // Step 1: Get the current expiration date
            $stmt = $this->pdo->prepare("SELECT value FROM radcheck WHERE username = :username AND attribute = 'Expiration'");
            $stmt->execute([':username' => $username]);
            $currentExpireStr = $stmt->fetchColumn();

            // Step 2: Calculate the new expiration date
            $currentDate = new \DateTime();
            $currentExpireDate = $currentExpireStr ? new \DateTime($currentExpireStr) : new \DateTime();
            
            // If the expiration date is in the past, start the new subscription from today
            $startDate = ($currentExpireDate < $currentDate) ? $currentDate : $currentExpireDate;
            
            $newExpireDate = clone $startDate;
            $newExpireDate->add(new \DateInterval("P{$months}M")); // Add months
            $newExpireDateStr = $newExpireDate->format('d M Y H:i'); // Format for radcheck
            $newExpireDbFormat = $newExpireDate->format('Y-m-d H:i:s'); // Format for our DB

            // Step 3: Update radcheck with the new expiration date
            $stmt = $this->pdo->prepare("UPDATE radcheck SET value = :expire WHERE username = :username AND attribute = 'Expiration'");
            $stmt->execute([':expire' => $newExpireDateStr, ':username' => $username]);

            // Also update the user's packet in usersInfo if it has changed
            $stmt = $this->pdo->prepare("UPDATE usersInfo SET packet = :packet WHERE username = :username");
            $stmt->execute([':packet' => $packetName, ':username' => $username]);

            // Step 4: Insert a new record into userInvoices
            $stmt = $this->pdo->prepare(
                "INSERT INTO userInvoices (username, peydate, expire, price, peymode) 
                 VALUES (:username, :peydate, :expire, :price, :peymode)"
            );
            $stmt->execute([
                ':username' => $username,
                ':peydate' => date('Y-m-d H:i:s'),
                ':expire' => $newExpireDbFormat,
                ':price' => $totalPrice,
                ':peymode' => $paymentMode
            ]);
            
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Subscription renewal failed: " . $e->getMessage());
            return false;
        }
    }

    public function addTrafficQuota($username, $trafficToAddGB, $price, $paymentMode)
    {
        $this->pdo->beginTransaction();

        try {
            $trafficToAddBytes = $trafficToAddGB * 1024 * 1024 * 1024;

            // Update radcheck if the attribute exists
            $stmt = $this->pdo->prepare(
                "UPDATE radcheck SET value = value + :traffic 
                 WHERE username = :username AND attribute = 'Mikrotik-Xmit-Limit'"
            );
            $stmt->execute([':traffic' => $trafficToAddBytes, ':username' => $username]);

            // Update radreply if the attribute exists
            $stmt = $this->pdo->prepare(
                "UPDATE radreply SET value = value + :traffic 
                 WHERE username = :username AND attribute = 'Mikrotik-Xmit-Limit'"
            );
            $stmt->execute([':traffic' => $trafficToAddBytes, ':username' => $username]);

            // We need the user's current expiration date for the invoice
            $stmt = $this->pdo->prepare("SELECT value FROM radcheck WHERE username = :username AND attribute = 'Expiration'");
            $stmt->execute([':username' => $username]);
            $currentExpireStr = $stmt->fetchColumn();
            $expireDate = $currentExpireStr ? (new \DateTime($currentExpireStr))->format('Y-m-d H:i:s') : null;

            // Insert a new invoice for the traffic purchase
            $stmt = $this->pdo->prepare(
                "INSERT INTO userInvoices (username, peydate, expire, price, peymode, packet) 
                 VALUES (:username, :peydate, :expire, :price, :peymode, :packet)"
            );
            $stmt->execute([
                ':username' => $username,
                ':peydate' => date('Y-m-d H:i:s'),
                ':expire' => $expireDate,
                ':price' => $price,
                ':peymode' => $paymentMode,
                ':packet' => $trafficToAddGB . 'GB' // Record what was purchased
            ]);

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Adding traffic quota failed: " . $e->getMessage());
            return false;
        }
    }

    public function getConnectionHistory($username, $page = 1, $pageSize = 15)
    {
        $offset = ($page - 1) * $pageSize;
        try {
            $stmt = $this->pdo->prepare(
                "SELECT * FROM radacct 
                 WHERE username = :username 
                 ORDER BY acctstarttime DESC 
                 LIMIT :pagesize OFFSET :offset"
            );
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->bindParam(':pagesize', $pageSize, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Failed to get connection history: " . $e->getMessage());
            return [];
        }
    }

    public function getTotalHistoryCount($username)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM radacct WHERE username = :username");
            $stmt->execute([':username' => $username]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Failed to get history count: " . $e->getMessage());
            return 0;
        }
    }

    public function getUserStats(): array
    {
        try {
            // Get Total Users (based on password entries)
            $totalStmt = $this->pdo->query("SELECT COUNT(*) FROM radcheck WHERE attribute = 'Cleartext-Password'");
            $totalUsers = $totalStmt->fetchColumn();

            // Get Active Users (users with valid expiration date)
            // Convert radcheck date format (d M Y H:i) to MySQL format for comparison
            $activeStmt = $this->pdo->query("
                SELECT COUNT(DISTINCT rc.username) 
                FROM radcheck rc
                WHERE rc.attribute = 'Cleartext-Password'
                AND EXISTS (
                    SELECT 1 FROM radcheck rc2 
                    WHERE rc2.username = rc.username 
                    AND rc2.attribute = 'Expiration' 
                    AND STR_TO_DATE(rc2.value, '%d %b %Y %H:%i') > NOW()
                )
            ");
            $activeUsers = $activeStmt->fetchColumn();

            // Get Expired Users (users with expired subscription)
            $expiredStmt = $this->pdo->query("
                SELECT COUNT(DISTINCT rc.username) 
                FROM radcheck rc
                WHERE rc.attribute = 'Cleartext-Password'
                AND EXISTS (
                    SELECT 1 FROM radcheck rc2 
                    WHERE rc2.username = rc.username 
                    AND rc2.attribute = 'Expiration' 
                    AND STR_TO_DATE(rc2.value, '%d %b %Y %H:%i') <= NOW()
                )
            ");
            $expiredUsers = $expiredStmt->fetchColumn();

            // Get Online Users from radacct (currently connected users)
            $onlineStmt = $this->pdo->query("SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL");
            $onlineUsers = $onlineStmt->fetchColumn();

            return [
                'total' => (int) $totalUsers,
                'active' => (int) $activeUsers,
                'expired' => (int) $expiredUsers,
                'online' => (int) $onlineUsers,
            ];
        } catch (PDOException $e) {
            error_log("Error in getUserStats: " . $e->getMessage());
            return [
                'total' => 0,
                'active' => 0,
                'expired' => 0,
                'online' => 0,
            ];
        }
    }

    public function getActiveNasDetailsForUser(string $username)
    {
        $stmt = $this->pdo->prepare("SELECT nasipaddress, framedipaddress FROM radippool WHERE username = :username LIMIT 1");
        $stmt->execute([':username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves a detailed list of all users currently online.
     * Online users are determined by looking for active sessions in radacct.
     *
     * @return array A list of online users with session details.
     */
    public function getOnlineUsersList(): array
    {
        $query = "
            SELECT DISTINCT username
            FROM radacct 
            WHERE acctstoptime IS NULL
        ";

        try {
            $stmt = $this->pdo->query($query);
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("Error in getOnlineUsersList: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get total statistics for all users
     */
    public function getTotalUserStats(): array
    {
        try {
            // Get total online users
            $onlineQuery = "
                SELECT COUNT(DISTINCT username) as online_count
                FROM radacct 
                WHERE acctstoptime IS NULL
            ";
            $onlineStmt = $this->pdo->query($onlineQuery);
            $onlineUsers = $onlineStmt->fetchColumn() ? (int)$onlineStmt->fetchColumn() : 0;

            // Get total users with expiration dates
            $expirationQuery = "
                SELECT 
                    COUNT(*) as total_with_expire,
                    SUM(CASE 
                        WHEN STR_TO_DATE(value, '%b %d %Y %H:%i:%s') < NOW() THEN 1 
                        ELSE 0 
                    END) as expired_count,
                    SUM(CASE 
                        WHEN STR_TO_DATE(value, '%b %d %Y %H:%i:%s') >= NOW() 
                        AND STR_TO_DATE(value, '%b %d %Y %H:%i:%s') <= DATE_ADD(NOW(), INTERVAL 7 DAY) 
                        THEN 1 
                        ELSE 0 
                    END) as expiring_soon_count,
                    SUM(CASE 
                        WHEN STR_TO_DATE(value, '%b %d %Y %H:%i:%s') > DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 
                        ELSE 0 
                    END) as active_count
                FROM radcheck 
                WHERE attribute = 'Expiration' 
                AND value IS NOT NULL 
                AND value != ''
            ";
            $expirationStmt = $this->pdo->query($expirationQuery);
            $expirationStats = $expirationStmt->fetch(PDO::FETCH_ASSOC);

            // Get total users without expiration dates (count as active)
            $noExpirationQuery = "
                SELECT COUNT(*) as no_expire_count
                FROM radcheck rc
                LEFT JOIN radcheck rc_expire ON rc.username = rc_expire.username AND rc_expire.attribute = 'Expiration'
                WHERE rc.attribute = 'Cleartext-Password'
                AND rc_expire.username IS NULL
            ";
            $noExpirationStmt = $this->pdo->query($noExpirationQuery);
            $noExpirationCount = $noExpirationStmt->fetchColumn() ? (int)$noExpirationStmt->fetchColumn() : 0;

            return [
                'onlineUsers' => $onlineUsers,
                'expiredUsers' => $expirationStats['expired_count'] ?? 0,
                'expiringSoonUsers' => $expirationStats['expiring_soon_count'] ?? 0,
                'activeUsers' => ($expirationStats['active_count'] ?? 0) + $noExpirationCount,
                'totalUsers' => $this->getUserCount()
            ];

        } catch (PDOException $e) {
            error_log("Error in getTotalUserStats: " . $e->getMessage());
            return [
                'onlineUsers' => 0,
                'expiredUsers' => 0,
                'expiringSoonUsers' => 0,
                'activeUsers' => 0,
                'totalUsers' => 0
            ];
        }
    }
}