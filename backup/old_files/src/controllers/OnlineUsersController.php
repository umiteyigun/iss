<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Services\MikrotikService;

class OnlineUsersController
{
    /**
     * Fetches the list of currently online users from both RADIUS and Mikrotik and displays them.
     */
    public function show()
    {
        $userModel = new UserModel();
        $mikrotikService = new MikrotikService();
        
        // Get RADIUS online users
        $radiusOnlineUsers = $userModel->getOnlineUsersList();
        $radiusOnlineUsers = array_map(function($username) {
            return ['username' => $username];
        }, $radiusOnlineUsers);
        
        // Get Mikrotik online users
        $mikrotikOnlineUsers = $mikrotikService->getPppActiveConnectionsList();
        // Eğer mikrotikOnlineUsers da string array ise, aynı şekilde dönüştür:
        if (!empty($mikrotikOnlineUsers) && is_string($mikrotikOnlineUsers[0])) {
            $mikrotikOnlineUsers = array_map(function($username) {
                return ['username' => $username];
            }, $mikrotikOnlineUsers);
        }

        // Create comparison data
        $comparisonData = $this->compareUsers($radiusOnlineUsers, $mikrotikOnlineUsers);

        // Pass the user lists to the view
        $viewData = [
            'radiusOnlineUsers' => $radiusOnlineUsers,
            'mikrotikOnlineUsers' => $mikrotikOnlineUsers,
            'comparisonData' => $comparisonData,
            'radiusCount' => count($radiusOnlineUsers),
            'mikrotikCount' => count($mikrotikOnlineUsers),
            'missingInRadiusCount' => count($comparisonData['missingInRadius']),
            'missingInMikrotikCount' => count($comparisonData['missingInMikrotik']),
        ];

        // Load the view within the main layout
        $viewFile = __DIR__ . '/../../views/onlineUsers.php';
        require __DIR__ . '/../../views/layout.php';
    }

    /**
     * Compare RADIUS and Mikrotik users to find discrepancies
     * @param array $radiusUsers
     * @param array $mikrotikUsers
     * @return array
     */
    private function compareUsers($radiusUsers, $mikrotikUsers)
    {
        // Create username arrays for comparison
        $radiusUsernames = [];
        foreach ($radiusUsers as $user) {
            $radiusUsernames[strtolower($user['username'])] = $user;
        }

        $mikrotikUsernames = [];
        foreach ($mikrotikUsers as $user) {
            $mikrotikUsernames[strtolower($user['username'])] = $user;
        }

        // Find users missing in RADIUS
        $missingInRadius = [];
        foreach ($mikrotikUsers as $mikrotikUser) {
            $username = strtolower($mikrotikUser['username']);
            if (!isset($radiusUsernames[$username])) {
                $missingInRadius[] = $mikrotikUser;
            }
        }

        // Find users missing in Mikrotik
        $missingInMikrotik = [];
        foreach ($radiusUsers as $radiusUser) {
            $username = strtolower($radiusUser['username']);
            if (!isset($mikrotikUsernames[$username])) {
                $missingInMikrotik[] = $radiusUser;
            }
        }

        // Find common users
        $commonUsers = [];
        foreach ($radiusUsers as $radiusUser) {
            $username = strtolower($radiusUser['username']);
            if (isset($mikrotikUsernames[$username])) {
                $commonUsers[] = [
                    'radius' => $radiusUser,
                    'mikrotik' => $mikrotikUsernames[$username]
                ];
            }
        }

        return [
            'missingInRadius' => $missingInRadius,
            'missingInMikrotik' => $missingInMikrotik,
            'commonUsers' => $commonUsers
        ];
    }
} 