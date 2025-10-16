<?php
echo '<!-- layout.php başı -->';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Admin Panel - ArchitectUI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
    
    <!-- ArchitectUI CSS -->
    <link rel="stylesheet" href="/css/architectui.css">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="/bower_components/font-awesome/css/font-awesome.min.css">
    <!-- Google Font -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap">
    
    <?php 
    $current_mod = $_GET['mod'] ?? 'dashboard';
    ?>
    
    <!-- REQUIRED JS SCRIPTS -->
    <script src="/bower_components/jquery/dist/jquery.min.js"></script>
    <script src="/bower_components/bootstrap/dist/js/bootstrap.min.js"></script>
    <script src="/bower_components/chart.js/Chart.js"></script>
</head>
<body>
    <!-- ArchitectUI Layout Structure -->
    <div class="app-container">
        <!-- Top Navigation -->
        <nav class="top-nav">
            <div class="top-nav-content">
                <!-- Top Navigation Menu -->
                <div class="top-nav-menu">
                    <!-- Sidebar Toggle -->
                    <button class="sidebar-toggle" id="sidebarToggle">
                        <i class="fa fa-bars"></i>
                    </button>
                    
                    <!-- User Profile -->
                    <div class="user-profile-dropdown">
                        <button class="user-profile-btn" id="userProfileBtn">
                            <div class="user-avatar-small"></div>
                            <span class="user-name"><?php echo htmlspecialchars($_SESSION['username'] ?? 'Admin'); ?></span>
                            <i class="fa fa-chevron-down"></i>
                        </button>
                        <div class="user-profile-menu" id="userProfileMenu">
                            <div class="user-profile-header">
                                <div class="user-avatar-large"></div>
                                <div class="user-info">
                                    <h4><?php echo htmlspecialchars($_SESSION['username'] ?? 'Admin'); ?></h4>
                                    <p>Administrator</p>
                                </div>
                            </div>
                            <div class="user-profile-menu-items">
                                <a href="#" class="menu-item">
                                    <i class="fa fa-user"></i>
                                    <span>Profile</span>
                                </a>
                                <a href="#" class="menu-item">
                                    <i class="fa fa-cog"></i>
                                    <span>Settings</span>
                                </a>
                                <a href="#" class="menu-item">
                                    <i class="fa fa-question-circle"></i>
                                    <span>Help</span>
                                </a>
                                <div class="menu-divider"></div>
                                <a href="/index.php?mod=logout" class="menu-item logout">
                                    <i class="fa fa-sign-out"></i>
                                    <span>Sign Out</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Sidebar -->
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-content">
                    <!-- Sidebar User Panel -->
                    <div class="sidebar-user-panel">
                        <div class="sidebar-user-avatar"></div>
                        <div class="sidebar-user-info">
                            <h4><?php echo htmlspecialchars($_SESSION['username'] ?? 'Admin'); ?></h4>
                            <p><i class="fa fa-circle text-success"></i> Online</p>
                        </div>
                    </div>
                    
                    <!-- Sidebar Navigation -->
                    <nav class="sidebar-nav">
                        <ul class="nav-list">
                            <!-- Dashboard -->
                            <li class="nav-item <?php echo ($current_mod === 'dashboard') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=dashboard" class="nav-link">
                                    <i class="fa fa-dashboard"></i>
                                    <span>Dashboard</span>
                                </a>
                            </li>
                            
                            <!-- Network Management -->
                            <li class="nav-section">
                                <span class="nav-section-title">Network Management</span>
                            </li>
                            
                            <li class="nav-item <?php echo ($current_mod === 'routers') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=routers" class="nav-link">
                                    <i class="fa fa-wifi"></i>
                                    <span>Routers</span>
                                    <span class="nav-badge">12</span>
                                </a>
                            </li>
                            
                            <li class="nav-item <?php echo ($current_mod === 'nas') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=nas" class="nav-link">
                                    <i class="fa fa-server"></i>
                                    <span>NAS Devices</span>
                                    <span class="nav-badge">8</span>
                                </a>
                            </li>
                            
                            <li class="nav-item <?php echo ($current_mod === 'packet') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=packet" class="nav-link">
                                    <i class="fa fa-exchange"></i>
                                    <span>Packet Analysis</span>
                                </a>
                            </li>
                            
                            <!-- User Management -->
                            <li class="nav-section">
                                <span class="nav-section-title">User Management</span>
                            </li>
                            
                            <li class="nav-item <?php echo (in_array($current_mod, ['userlist', 'newUser', 'userdetails'])) ? 'active' : ''; ?>">
                                <a href="/index.php?mod=userlist" class="nav-link">
                                    <i class="fa fa-users"></i>
                                    <span>Users</span>
                                    <span class="nav-badge">156</span>
                                </a>
                            </li>
                            
                            <li class="nav-item <?php echo ($current_mod === 'members') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=members" class="nav-link">
                                    <i class="fa fa-user-secret"></i>
                                    <span>Members</span>
                                    <span class="nav-badge">24</span>
                                </a>
                            </li>
                            
                            <!-- System -->
                            <li class="nav-section">
                                <span class="nav-section-title">System</span>
                            </li>
                            
                            <li class="nav-item <?php echo ($current_mod === 'logs') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=logs" class="nav-link">
                                    <i class="fa fa-file-text"></i>
                                    <span>System Logs</span>
                                </a>
                            </li>
                            
                            <li class="nav-item <?php echo ($current_mod === 'settings') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=settings" class="nav-link">
                                    <i class="fa fa-cog"></i>
                                    <span>Settings</span>
                                </a>
                            </li>
                            
                            <!-- Super Admin Section -->
                            <?php if (isset($_SESSION['user_id'])) {
                                $permissionManager = new \App\Services\PermissionManager();
                                if ($permissionManager->isSuperAdmin()) { ?>
                            <li class="nav-section">
                                <span class="nav-section-title">Administration</span>
                            </li>
                            
                            <li class="nav-item <?php echo (in_array($current_mod, ['tenants', 'create_tenant', 'edit_tenant', 'view_tenant'])) ? 'active' : ''; ?>">
                                <a href="/index.php?mod=tenants" class="nav-link">
                                    <i class="fa fa-building"></i>
                                    <span>Tenant Management</span>
                                    <span class="nav-badge">5</span>
                                </a>
                            </li>
                            
                            <li class="nav-item <?php echo ($current_mod === 'create_tenant') ? 'active' : ''; ?>">
                                <a href="/index.php?mod=create_tenant" class="nav-link">
                                    <i class="fa fa-plus"></i>
                                    <span>Create Tenant</span>
                                </a>
                            </li>
                            <?php }
                            } ?>
                            
                            <!-- Account -->
                            <li class="nav-section">
                                <span class="nav-section-title">Account</span>
                            </li>
                            
                            <li class="nav-item">
                                <a href="#" class="nav-link">
                                    <i class="fa fa-user"></i>
                                    <span>My Profile</span>
                                </a>
                            </li>
                            
                            <li class="nav-item">
                                <a href="#" class="nav-link">
                                    <i class="fa fa-cog"></i>
                                    <span>Account Settings</span>
                                </a>
                            </li>
                            
                            <li class="nav-item">
                                <a href="/index.php?mod=logout" class="menu-item">
                                    <i class="fa fa-sign-out"></i>
                                    <span>Sign Out</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>
            
            <!-- Content Area -->
            <main class="content-area">
                <!-- Breadcrumb -->
                <div class="breadcrumb-container">
                    <nav class="breadcrumb-nav">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item">
                                <a href="/index.php?mod=dashboard">
                                    <i class="fa fa-home"></i>
                                    Home
                                </a>
                            </li>
                            <?php if ($current_mod !== 'dashboard'): ?>
                            <li class="breadcrumb-item active">
                                <?php 
                                $pageNames = [
                                    'tenants' => 'Tenant Management',
                                    'create_tenant' => 'Create Tenant',
                                    'edit_tenant' => 'Edit Tenant',
                                    'view_tenant' => 'View Tenant',
                                    'routers' => 'Routers',
                                    'nas' => 'NAS Devices',
                                    'userlist' => 'Users',
                                    'members' => 'Members',
                                    'logs' => 'System Logs',
                                    'settings' => 'Settings'
                                ];
                                echo $pageNames[$current_mod] ?? ucfirst($current_mod);
                                ?>
                            </li>
                            <?php endif; ?>
                        </ol>
                    </nav>
                </div>
                
                <!-- Page Content -->
                <div class="page-content">
                    <?php
                    // Include the specific page content
                    $pageFile = "../views/{$current_mod}.php";
                    if (file_exists($pageFile)) {
                        include $pageFile;
                    } else {
                        echo "<div class='error-page'>Page not found: {$current_mod}</div>";
                    }
                    ?>
                </div>
            </main>
        </div>
    </div>
    
    <!-- JavaScript -->
    <script>
        // Sidebar Toggle
        document.getElementById('sidebarToggle').addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
        
        // User Profile Dropdown
        document.getElementById('userProfileBtn').addEventListener('click', function() {
            document.getElementById('userProfileMenu').classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const userProfileBtn = document.getElementById('userProfileBtn');
            const userProfileMenu = document.getElementById('userProfileMenu');
            
            if (!userProfileBtn.contains(event.target) && !userProfileMenu.contains(event.target)) {
                userProfileMenu.classList.remove('show');
            }
        });
    </script>
</body>
</html>
