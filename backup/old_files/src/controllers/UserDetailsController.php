<?php

// The autoloader in index.php should handle this
// require_once __DIR__ . '/../models/UserModel.php';

if (!isset($_GET['username']) || empty($_GET['username'])) {
    // Or redirect to user list
    die('Username is required.');
}

$username = $_GET['username'];

$userModel = new UserModel();
$user = $userModel->getUserDetails($username);

if (!$user) {
    die('User not found.');
}

// Data for the view
$viewData = [
    'user' => $user
];

// The view to be loaded by the layout
$viewFile = __DIR__ . '/../../views/userdetails.php';

// Load the main layout
require __DIR__ . '/../../views/layout.php'; 