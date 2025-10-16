<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>UserModel Test</h1>";

try {
    require_once __DIR__ . '/../src/Database.php';
    require_once __DIR__ . '/../src/models/UserModel.php';
    
    $userModel = new \App\Models\UserModel();
    
    echo "<h2>Testing getUserCount()</h2>";
    $count = $userModel->getUserCount();
    echo "Total users: $count<br>";
    
    echo "<h2>Testing getUsers()</h2>";
    $users = $userModel->getUsers(1, 5);
    echo "Found " . count($users) . " users<br>";
    
    if (!empty($users)) {
        echo "<table border='1'>";
        echo "<tr><th>Username</th><th>Name</th><th>Email</th><th>IP Address</th><th>Packet</th><th>Online</th></tr>";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($user['username'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars(($user['name'] ?? '') . ' ' . ($user['lastname'] ?? '')) . "</td>";
            echo "<td>" . htmlspecialchars($user['email'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($user['ipaddress'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($user['packet'] ?? 'N/A') . "</td>";
            echo "<td>" . (!empty($user['is_online']) ? 'Yes' : 'No') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: red;'>No users returned from getUsers()</p>";
    }
    
    echo "<h2>Testing getUserStats()</h2>";
    $stats = $userModel->getUserStats();
    echo "<pre>" . print_r($stats, true) . "</pre>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>File: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Line: " . $e->getLine() . "</p>";
}
?> 