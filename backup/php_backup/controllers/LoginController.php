<?php

namespace App\Controllers;

use App\Models\MemberModel;

class LoginController
{
    public function showForm($errorMessage = '')
    {
        $viewData = ['error' => $errorMessage];
        $viewFile = __DIR__ . '/../../views/login.php';
        
        // Use the dedicated login layout
        require __DIR__ . '/../../views/login_layout.php';
    }

    public function handleLogin()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /index.php?mod=login');
            exit();
        }

        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';

        if (empty($username) || empty($password)) {
            $this->showForm('Username and password are required.');
            return;
        }

        $memberModel = new MemberModel();
        $member = $memberModel->verifyMember($username, $password);

        if ($member) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $member['id'];
            $_SESSION['username'] = $member['username'];
            $_SESSION['user_mode'] = $member['mode'];
            header('Location: /index.php?mod=dashboard');
            exit();
        } else {
            $this->showForm('Invalid username or password.');
        }
    }

    public function handleLogout()
    {
        // Ensure session is started before trying to destroy it
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        session_destroy();
        header('Location: /index.php?mod=login');
        exit();
    }
} 