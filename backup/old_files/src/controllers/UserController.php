<?php

namespace App\Controllers;

use App\Models\UserModel;

class UserController
{
    /**
     * Handles displaying the paginated list of all users.
     */
    public function listAll()
    {
        $userModel = new UserModel();

        // --- Search Logic ---
        $searchTerm = $_GET['search'] ?? '';
        $searchResultsCount = 0;
        
        // --- Pagination Logic ---
        $page = isset($_GET['p']) && is_numeric($_GET['p']) ? (int)$_GET['p'] : 1;
        $pageSize = isset($_GET['pageSize']) && is_numeric($_GET['pageSize']) ? (int)$_GET['pageSize'] : 15;
        
        // Validate page size (limit to reasonable values)
        $allowedPageSizes = [10, 15, 25, 50, 100];
        if (!in_array($pageSize, $allowedPageSizes)) {
            $pageSize = 15; // Default to 15 if invalid
        }
        
        if (!empty($searchTerm)) {
            // Search users
            $users = $userModel->searchUsers($searchTerm);
            $searchResultsCount = count($users);
            $totalUsers = $searchResultsCount;
            $totalPages = 1; // Search results don't need pagination
        } else {
            // Get all users with pagination
            $totalUsers = $userModel->getUserCount();
            $totalPages = ceil($totalUsers / $pageSize);
            $users = $userModel->getUsers($page, $pageSize);
        }

        // Get total statistics from database (not just current page)
        $totalStats = $userModel->getTotalUserStats();
        
        $onlineUsers = $totalStats['onlineUsers'];
        $expiredUsers = $totalStats['expiredUsers'];
        $expiringSoonUsers = $totalStats['expiringSoonUsers'];
        $activeUsers = $totalStats['activeUsers'];

        // Pass all necessary data to the view
        $viewData = [
            'users' => $users,
            'totalUsers' => $totalUsers,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => $totalPages,
            'onlineUsers' => $onlineUsers,
            'expiredUsers' => $expiredUsers,
            'expiringSoonUsers' => $expiringSoonUsers,
            'activeUsers' => $activeUsers,
            'searchTerm' => $searchTerm,
            'searchResultsCount' => $searchResultsCount
        ];

        // Load the view within the main layout
        $viewFile = __DIR__ . '/../../views/userlist.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function showNewUserForm() {
        $userModel = new UserModel();
        
        // Get the selected NAS to filter other dropdowns
        $selectedNas = $_GET['nas'] ?? '';

        // Data for the view's dropdowns
        $viewData = [
            'packets' => $userModel->getPackets(),
            'nasList' => $userModel->getNas(),
            'accessPoints' => $selectedNas ? $userModel->getAccessPoints($selectedNas) : [],
            'staticIps' => $selectedNas ? $userModel->getStaticIPs($selectedNas) : [],
            'ipPools' => $selectedNas ? $userModel->getIpPools($selectedNas) : [],
            'selectedNas' => $selectedNas
        ];

        $viewFile = __DIR__ . '/../../views/newUser.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function createNewUser() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?mod=newUser');
            exit();
        }

        // Basic validation
        if (empty($_POST['txtUsername']) || empty($_POST['txtPassword'])) {
            // In a real app, you'd redirect back with an error message
            die('Username and password are required.');
        }
        
        // In a real app, you would fetch these from the database based on packet name
        $packet_details = ['rate_limit' => '10M/10M', 'price' => '100'];

        $data = [
            'username' => $_POST['txtUsername'],
            'password' => $_POST['txtPassword'], // Should be a generated password
            'name' => $_POST['txtName'],
            'lastname' => $_POST['txtLastname'],
            'email' => $_POST['txtEmail'],
            'address' => $_POST['txtAddress'],
            'phone1' => $_POST['txtPhone1'],
            'phone2' => $_POST['txtPhone2'],
            'phone3' => $_POST['txtPhone3'],
            'tc' => $_POST['txtTC'] ?? '',
            'packet' => $_POST['drpPacket'],
            'accesspoint' => $_POST['drpAP'],
            'turu' => $_POST['turu'],
            'unvan' => $_POST['unvan'] ?? '',
            'vergino' => $_POST['vergino'] ?? '',
            'vergidairesi' => $_POST['vergidairesi'] ?? '',
            'expire' => $_POST['txtExpire'],
            'price' => $packet_details['price'], 
            'rate_limit' => $packet_details['rate_limit'],
            'ippool' => $_POST['drpIPpool'],
            'static_ip' => $_POST['drpStatic'],
            'nas_ip' => '1.2.3.4' // This should be fetched from DB based on selected NAS
        ];
        
        $userModel = new UserModel();
        $success = $userModel->createUser($data);

        if ($success) {
            // Redirect to the new user's detail page or user list
            header('Location: index.php?mod=userlist&status=created');
            exit();
        } else {
            // Redirect back to the form with an error message
            header('Location: index.php?mod=newUser&status=error');
            exit();
        }
    }

    public function showUserDetails() {
        if (!isset($_GET['username']) || empty($_GET['username'])) {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_GET['username'];
        $userModel = new UserModel();
        
        // Fetch existing user data
        $user = $userModel->getUserDetails($username);
        if (!$user) {
            // Handle user not found
            header('Location: index.php?mod=userlist&error=notfound');
            exit();
        }

        // Data for the view
        $viewData = [
            'user' => $user,
            'packets' => $userModel->getPackets(), // For displaying packet name if needed
            'nasList' => $userModel->getNas(), // For displaying NAS name
        ];

        $viewFile = __DIR__ . '/../../views/userDetails.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function showEditUserForm() {
        if (!isset($_GET['username']) || empty($_GET['username'])) {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_GET['username'];
        $userModel = new UserModel();
        
        // Fetch existing user data
        $user = $userModel->getUserDetails($username);
        if (!$user) {
            // Handle user not found
            header('Location: index.php?mod=userlist&error=notfound');
            exit();
        }

        // Get the selected NAS to filter other dropdowns
        $selectedNas = $user['nasname'] ?? ''; // Use user's NAS as default

        // Data for the view's dropdowns
        $viewData = [
            'user' => $user,
            'packets' => $userModel->getPackets(),
            'nasList' => $userModel->getNas(),
            'accessPoints' => $selectedNas ? $userModel->getAccessPoints($selectedNas) : [],
            'staticIps' => $selectedNas ? $userModel->getStaticIPs($selectedNas) : [],
            'ipPools' => $selectedNas ? $userModel->getIpPools($selectedNas) : [],
            'selectedNas' => $selectedNas
        ];

        $viewFile = __DIR__ . '/../../views/editUser.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function updateUser() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_POST['username'] ?? '';
        if (empty($username)) {
            header('Location: index.php?mod=userlist&error=invalid');
            exit();
        }

        $data = [
            'name' => $_POST['txtName'],
            'lastname' => $_POST['txtLastname'],
            'email' => $_POST['txtEmail'],
            'address' => $_POST['txtAddress'],
            'phone1' => $_POST['txtPhone1'],
            'phone2' => $_POST['txtPhone2'],
            'phone3' => $_POST['txtPhone3'],
            'tc' => $_POST['txtTC'] ?? '',
            'packet' => $_POST['drpPacket'],
            'accesspoint' => $_POST['drpAP'],
            'turu' => $_POST['turu'],
            'unvan' => $_POST['unvan'] ?? '',
            'vergino' => $_POST['vergino'] ?? '',
            'vergidairesi' => $_POST['vergidairesi'] ?? '',
        ];

        $userModel = new UserModel();
        $success = $userModel->updateUser($username, $data);

        if ($success) {
            header('Location: index.php?mod=userlist&status=updated');
        } else {
            header('Location: index.php?mod=userlist&error=update_failed');
        }
        exit();
    }

    public function deleteUser() {
        if (!isset($_GET['username']) || empty($_GET['username'])) {
            if ($this->isAjaxRequest()) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Username is required']);
                return;
            }
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_GET['username'];
        $userModel = new UserModel();
        $success = $userModel->deleteUser($username);

        if ($this->isAjaxRequest()) {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => $success, 
                'message' => $success ? 'Customer deleted successfully' : 'Failed to delete customer'
            ]);
            return;
        }

        if ($success) {
            header('Location: index.php?mod=userlist&status=deleted');
        } else {
            header('Location: index.php?mod=userlist&error=delete_failed');
        }
        exit();
    }

    private function isAjaxRequest()
    {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }

    public function showUserRenewForm() {
        if (!isset($_GET['username']) || empty($_GET['username'])) {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_GET['username'];
        $userModel = new UserModel();
        
        $user = $userModel->getUserDetails($username); 
        if (!$user) {
            header('Location: index.php?mod=userlist&error=notfound');
            exit();
        }

        $viewData = [
            'user' => $user,
            'packets' => $userModel->getPackets(),
        ];

        $viewFile = __DIR__ . '/../../views/userRenew.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function processUserRenewal() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_POST['username'] ?? '';
        $months = (int)($_POST['months'] ?? 1);
        $packetName = $_POST['packet'] ?? '';
        $totalPrice = (float)($_POST['price'] ?? 0);
        $paymentMode = $_POST['payment_mode'] ?? 'cash';

        if (empty($username) || $months <= 0) {
            header('Location: index.php?mod=userlist&error=invalid');
            exit();
        }

        $userModel = new UserModel();
        $success = $userModel->renewSubscription($username, $months, $packetName, $totalPrice, $paymentMode);

        if ($success) {
            header('Location: index.php?mod=userlist&status=renewed');
        } else {
            header('Location: index.php?mod=userlist&error=renewal_failed');
        }
        exit();
    }

    public function showTrafficForm() {
        if (!isset($_GET['username']) || empty($_GET['username'])) {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_GET['username'];
        $userModel = new UserModel();
        
        $user = $userModel->getUserDetails($username); 
        if (!$user) {
            header('Location: index.php?mod=userlist&error=notfound');
            exit();
        }

        $viewData = [
            'user' => $user,
        ];

        $viewFile = __DIR__ . '/../../views/traffic.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function addTraffic() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_POST['username'] ?? '';
        $trafficGB = (float)($_POST['traffic_gb'] ?? 0);
        $price = (float)($_POST['price'] ?? 0);
        $paymentMode = $_POST['payment_mode'] ?? 'cash';

        if (empty($username) || $trafficGB <= 0) {
            header('Location: index.php?mod=userlist&error=invalid');
            exit();
        }

        $userModel = new UserModel();
        $success = $userModel->addTrafficQuota($username, $trafficGB, $price, $paymentMode);

        if ($success) {
            header('Location: index.php?mod=userlist&status=traffic_added');
        } else {
            header('Location: index.php?mod=userlist&error=traffic_failed');
        }
        exit();
    }

    public function showHistory() {
        if (!isset($_GET['username']) || empty($_GET['username'])) {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_GET['username'];
        $page = isset($_GET['p']) ? (int)$_GET['p'] : 1;
        $pageSize = 15; // Records per page

        $userModel = new UserModel();
        
        $history = $userModel->getConnectionHistory($username, $page, $pageSize);
        $totalRecords = $userModel->getTotalHistoryCount($username);
        $user = $userModel->getUserDetails($username); 

        if (!$user) {
            header('Location: index.php?mod=userlist&error=notfound');
            exit();
        }

        $viewData = [
            'user' => $user,
            'history' => $history,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalRecords' => $totalRecords
        ];

        $viewFile = __DIR__ . '/../../views/history.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function showSmsForm() {
        if (!isset($_GET['username']) || empty($_GET['username'])) {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_GET['username'];
        $userModel = new UserModel();
        
        $user = $userModel->getUserDetails($username); 
        if (!$user) {
            header('Location: index.php?mod=userlist&error=notfound');
            exit();
        }

        $viewData = [
            'user' => $user,
        ];

        $viewFile = __DIR__ . '/../../views/sms.php';
        require __DIR__ . '/../../views/layout.php';
    }

    public function sendSms() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?mod=userlist');
            exit();
        }

        $username = $_POST['username'] ?? '';
        $message = $_POST['message'] ?? '';

        if (empty($username) || empty($message)) {
            header('Location: index.php?mod=sms&error=missing_fields');
            exit();
        }

        // Here you would integrate with your SMS service
        // For now, we'll just redirect with a success message
        header('Location: index.php?mod=userlist&status=sms_sent');
        exit();
    }

    // API Endpoints for Customer Modal
    public function getUser() {
        $username = $_GET['username'] ?? '';
        
        if (empty($username)) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Username required']);
            return;
        }
        
        $userModel = new UserModel();
        $user = $userModel->getUserDetails($username);
        
        header('Content-Type: application/json');
        if ($user) {
            echo json_encode($user);
        } else {
            echo json_encode(['error' => 'User not found']);
        }
    }

    public function getPackets() {
        $userModel = new UserModel();
        $packets = $userModel->getPackets();
        
        header('Content-Type: application/json');
        echo json_encode($packets);
    }

    public function getNasList() {
        $userModel = new UserModel();
        $nasList = $userModel->getNas();
        
        header('Content-Type: application/json');
        echo json_encode($nasList);
    }

    public function getAccessPoints() {
        $nasName = $_GET['nas'] ?? '';
        
        if (empty($nasName)) {
            header('Content-Type: application/json');
            echo json_encode([]);
            return;
        }
        
        $userModel = new UserModel();
        $accessPoints = $userModel->getAccessPoints($nasName);
        
        header('Content-Type: application/json');
        echo json_encode($accessPoints);
    }
} 