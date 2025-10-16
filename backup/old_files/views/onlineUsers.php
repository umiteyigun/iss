<?php
$radiusOnlineUsers = $viewData['radiusOnlineUsers'] ?? [];
$mikrotikOnlineUsers = $viewData['mikrotikOnlineUsers'] ?? [];
$comparisonData = $viewData['comparisonData'] ?? [];
$radiusCount = $viewData['radiusCount'] ?? 0;
$mikrotikCount = $viewData['mikrotikCount'] ?? 0;
$missingInRadiusCount = $viewData['missingInRadiusCount'] ?? 0;
$missingInMikrotikCount = $viewData['missingInMikrotikCount'] ?? 0;
?>

<!-- Main content -->
<section class="content online-users-page">
    <!-- Modern Dashboard Header -->
    <div class="dashboard-hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1 class="hero-title">
                    <span class="title-icon">📡</span>
                    Online Users Analysis
                </h1>
                <p class="hero-subtitle">Real-time comparison between RADIUS and Mikrotik systems</p>
                <div class="hero-stats">
                    <div class="hero-stat">
                        <i class="fa fa-clock-o"></i>
                        <span id="current-time"></span>
                    </div>
                    <div class="hero-stat">
                        <i class="fa fa-calendar"></i>
                        <span id="current-date"></span>
                    </div>
                </div>
            </div>
            <div class="hero-visual">
                <div class="floating-card">
                    <div class="card-icon">🔍</div>
                    <div class="card-text">System Comparison</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modern Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card modern-card">
            <div class="card-glow">
                <i class="fa fa-database"></i>
            </div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon radius-icon">
                        <i class="fa fa-database"></i>
                    </div>
                    <div class="stat-badge success">RADIUS</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $radiusCount; ?></div>
                        <div class="stat-label">RADIUS Users</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow">
                <i class="fa fa-wifi"></i>
            </div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon mikrotik-icon">
                        <i class="fa fa-wifi"></i>
                    </div>
                    <div class="stat-badge success">Mikrotik</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $mikrotikCount; ?></div>
                        <div class="stat-label">Mikrotik Users</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow">
                <i class="fa fa-exclamation-triangle"></i>
            </div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon warning-icon">
                        <i class="fa fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-badge warning">Alert</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $missingInRadiusCount; ?></div>
                        <div class="stat-label">Missing in RADIUS</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow">
                <i class="fa fa-question-circle"></i>
            </div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon info-icon">
                        <i class="fa fa-question-circle"></i>
                    </div>
                    <div class="stat-badge info">Missing</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $missingInMikrotikCount; ?></div>
                        <div class="stat-label">Missing in Mikrotik</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Mikrotik Users Section -->
    <div class="user-management-section">
        <div class="section-header">
            <div class="header-content">
                <div class="header-title">
                    <i class="fa fa-wifi"></i>
                    <h3>Mikrotik Online Users</h3>
                </div>
            </div>
        </div>
        
        <div class="management-container">
            <div class="user-list-container">
                <div class="user-table-container">
                    <div class="table-header">
                        <div class="header-content">
                            <div class="header-title">
                                <i class="fa fa-wifi"></i>
                                <h3>Mikrotik Users (<?php echo $mikrotikCount; ?>)</h3>
                            </div>
                            <div class="header-stats">
                                <span class="stat-badge">
                                    <i class="fa fa-user"></i>
                                    <?php echo $mikrotikCount; ?> Users
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th><i class="fa fa-check-circle"></i> Status</th>
                                        <th><i class="fa fa-user"></i> Username</th>
                                        <th><i class="fa fa-globe"></i> IP Address</th>
                                        <th><i class="fa fa-server"></i> NAS IP</th>
                                        <th><i class="fa fa-cog"></i> Service</th>
                                        <th><i class="fa fa-clock-o"></i> Uptime</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if (empty($mikrotikOnlineUsers)): ?>
                                        <tr>
                                            <td colspan="6" class="text-center no-data-row">
                                                <div class="no-data-content">
                                                    <i class="fa fa-wifi"></i>
                                                    <p>No active Mikrotik users found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php else: ?>
                                        <?php foreach ($mikrotikOnlineUsers as $user): ?>
                                            <?php 
                                            $username = strtolower($user['username']);
                                            $isInRadius = false;
                                            foreach ($radiusOnlineUsers as $radiusUser) {
                                                if (strtolower($radiusUser['username']) === $username) {
                                                    $isInRadius = true;
                                                    break;
                                                }
                                            }
                                            $rowClass = $isInRadius ? 'success' : 'danger';
                                            $statusIcon = $isInRadius ? 'fa-check-circle' : 'fa-exclamation-triangle';
                                            $statusText = $isInRadius ? 'In RADIUS' : 'Missing in RADIUS';
                                            ?>
                                            <tr class="user-row <?php echo $rowClass; ?>-row">
                                                <td>
                                                    <div class="status-cell">
                                                        <span class="status-badge <?php echo $isInRadius ? 'online' : 'offline'; ?>">
                                                            <i class="fa <?php echo $statusIcon; ?>"></i>
                                                            <?php echo $statusText; ?>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="user-info">
                                                        <div class="user-avatar">
                                                            <i class="fa fa-user"></i>
                                                        </div>
                                                        <div class="user-details">
                                                            <strong><?php echo htmlspecialchars($user['username']); ?></strong>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="ip-cell">
                                                        <i class="fa fa-globe"></i>
                                                        <?php echo htmlspecialchars($user['ip_address']); ?>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="nas-cell">
                                                        <i class="fa fa-server"></i>
                                                        <?php echo htmlspecialchars($user['nas_ip']); ?>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="service-cell">
                                                        <span class="service-badge">
                                                            <?php echo htmlspecialchars($user['service']); ?>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="uptime-cell">
                                                        <i class="fa fa-clock-o"></i>
                                                        <?php echo htmlspecialchars($user['uptime']); ?>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- RADIUS Users Section -->
    <div class="user-management-section">
        <div class="section-header">
            <div class="header-content">
                <div class="header-title">
                    <i class="fa fa-database"></i>
                    <h3>RADIUS Online Users</h3>
                </div>
            </div>
        </div>
        
        <div class="management-container">
            <div class="user-list-container">
                <div class="user-table-container">
                    <div class="table-header">
                        <div class="header-content">
                            <div class="header-title">
                                <i class="fa fa-database"></i>
                                <h3>RADIUS Users (<?php echo $radiusCount; ?>)</h3>
                            </div>
                            <div class="header-stats">
                                <span class="stat-badge">
                                    <i class="fa fa-user"></i>
                                    <?php echo $radiusCount; ?> Users
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th><i class="fa fa-check-circle"></i> Status</th>
                                        <th><i class="fa fa-user"></i> Username</th>
                                        <th><i class="fa fa-globe"></i> IP Address</th>
                                        <th><i class="fa fa-server"></i> NAS IP</th>
                                        <th><i class="fa fa-sign-in"></i> Login Time</th>
                                        <th><i class="fa fa-clock-o"></i> Session Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if (empty($radiusOnlineUsers)): ?>
                                        <tr>
                                            <td colspan="6" class="text-center no-data-row">
                                                <div class="no-data-content">
                                                    <i class="fa fa-database"></i>
                                                    <p>No active RADIUS users found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php else: ?>
                                        <?php foreach ($radiusOnlineUsers as $user): ?>
                                            <?php 
                                            $username = strtolower($user['username']);
                                            $isInMikrotik = false;
                                            foreach ($mikrotikOnlineUsers as $mikrotikUser) {
                                                if (strtolower($mikrotikUser['username']) === $username) {
                                                    $isInMikrotik = true;
                                                    break;
                                                }
                                            }
                                            $rowClass = $isInMikrotik ? 'success' : 'warning';
                                            $statusIcon = $isInMikrotik ? 'fa-check-circle' : 'fa-exclamation-triangle';
                                            $statusText = $isInMikrotik ? 'In Mikrotik' : 'Missing in Mikrotik';
                                            ?>
                                            <tr class="user-row <?php echo $rowClass; ?>-row">
                                                <td>
                                                    <div class="status-cell">
                                                        <span class="status-badge <?php echo $isInMikrotik ? 'online' : 'offline'; ?>">
                                                            <i class="fa <?php echo $statusIcon; ?>"></i>
                                                            <?php echo $statusText; ?>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="user-info">
                                                        <div class="user-avatar">
                                                            <i class="fa fa-user"></i>
                                                        </div>
                                                        <div class="user-details">
                                                            <strong><?php echo htmlspecialchars($user['username']); ?></strong>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="ip-cell">
                                                        <i class="fa fa-globe"></i>
                                                        <?php echo htmlspecialchars($user['framedipaddress'] ?? 'N/A'); ?>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="nas-cell">
                                                        <i class="fa fa-server"></i>
                                                        <?php echo htmlspecialchars($user['nasipaddress'] ?? 'N/A'); ?>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="login-cell">
                                                        <i class="fa fa-sign-in"></i>
                                                        <?php echo htmlspecialchars($user['acctstarttime'] ?? 'N/A'); ?>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="session-cell">
                                                        <i class="fa fa-clock-o"></i>
                                                        <?php echo gmdate("H:i:s", $user['acctsessiontime']); ?>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Comparison Analysis Section -->
    <div class="user-management-section">
        <div class="section-header">
            <div class="header-content">
                <div class="header-title">
                    <i class="fa fa-balance-scale"></i>
                    <h3>System Comparison Analysis</h3>
                </div>
            </div>
        </div>
        
        <div class="management-container">
            <div class="comparison-grid">
                <div class="comparison-card">
                    <div class="card-header">
                        <div class="header-title">
                            <i class="fa fa-exclamation-triangle"></i>
                            <h4>Missing in RADIUS (<?php echo $missingInRadiusCount; ?>)</h4>
                        </div>
                    </div>
                    <div class="card-body">
                        <?php if (empty($comparisonData['missingInRadius'])): ?>
                            <div class="success-message">
                                <i class="fa fa-check-circle"></i>
                                <p>All Mikrotik users are present in RADIUS! ✓</p>
                            </div>
                        <?php else: ?>
                            <div class="user-list">
                                <?php foreach ($comparisonData['missingInRadius'] as $user): ?>
                                    <div class="user-item danger">
                                        <div class="user-info">
                                            <div class="user-avatar">
                                                <i class="fa fa-user"></i>
                                            </div>
                                            <div class="user-details">
                                                <strong><?php echo htmlspecialchars($user['username']); ?></strong>
                                            </div>
                                        </div>
                                        <div class="user-details">
                                            <span class="detail-item">
                                                <i class="fa fa-globe"></i>
                                                IP: <?php echo htmlspecialchars($user['ip_address']); ?>
                                            </span>
                                            <span class="detail-item">
                                                <i class="fa fa-server"></i>
                                                NAS: <?php echo htmlspecialchars($user['nas_ip']); ?>
                                            </span>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="comparison-card">
                    <div class="card-header">
                        <div class="header-title">
                            <i class="fa fa-question-circle"></i>
                            <h4>Missing in Mikrotik (<?php echo $missingInMikrotikCount; ?>)</h4>
                        </div>
                    </div>
                    <div class="card-body">
                        <?php if (empty($comparisonData['missingInMikrotik'])): ?>
                            <div class="success-message">
                                <i class="fa fa-check-circle"></i>
                                <p>All RADIUS users are present in Mikrotik! ✓</p>
                            </div>
                        <?php else: ?>
                            <div class="user-list">
                                <?php foreach ($comparisonData['missingInMikrotik'] as $user): ?>
                                    <div class="user-item warning">
                                        <div class="user-info">
                                            <div class="user-avatar">
                                                <i class="fa fa-user"></i>
                                            </div>
                                            <div class="user-details">
                                                <strong><?php echo htmlspecialchars($user['username']); ?></strong>
                                            </div>
                                        </div>
                                        <div class="user-details">
                                            <span class="detail-item">
                                                <i class="fa fa-globe"></i>
                                                IP: <?php echo htmlspecialchars($user['framedipaddress'] ?? 'N/A'); ?>
                                            </span>
                                            <span class="detail-item">
                                                <i class="fa fa-server"></i>
                                                NAS: <?php echo htmlspecialchars($user['nasipaddress'] ?? 'N/A'); ?>
                                            </span>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="analysis-notes">
                <div class="notes-header">
                    <i class="fa fa-info-circle"></i>
                    <h4>Analysis Notes</h4>
                </div>
                <div class="notes-grid">
                    <div class="note-item">
                        <div class="note-icon danger">
                            <i class="fa fa-times"></i>
                        </div>
                        <div class="note-content">
                            <strong>Red rows:</strong> Users active in Mikrotik but missing in RADIUS (accounting issue)
                        </div>
                    </div>
                    <div class="note-item">
                        <div class="note-icon warning">
                            <i class="fa fa-exclamation"></i>
                        </div>
                        <div class="note-content">
                            <strong>Yellow rows:</strong> Users in RADIUS but missing in Mikrotik (connection issue)
                        </div>
                    </div>
                    <div class="note-item">
                        <div class="note-icon success">
                            <i class="fa fa-check"></i>
                        </div>
                        <div class="note-content">
                            <strong>Green rows:</strong> Users present in both systems (normal)
                        </div>
                    </div>
                    <div class="note-item">
                        <div class="note-icon info">
                            <i class="fa fa-info"></i>
                        </div>
                        <div class="note-content">
                            <strong>Missing in RADIUS:</strong> Usually indicates RADIUS accounting is not working properly
                        </div>
                    </div>
                    <div class="note-item">
                        <div class="note-icon info">
                            <i class="fa fa-info"></i>
                        </div>
                        <div class="note-content">
                            <strong>Missing in Mikrotik:</strong> Usually indicates connection has been terminated
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<script>
// Modern Dashboard JavaScript
(function() {
    'use strict';
    
    // Update time and date
    function updateDateTime() {
        const now = new Date();
        
        // Update time
        const timeString = now.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
        
        // Update date
        const dateString = now.toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('current-date').textContent = dateString;
    }
    
    // Update every second
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Add floating animation to hero cards
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });
    
    // Add card hover effects
    const statCards = document.querySelectorAll('.modern-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.querySelector('.card-glow').style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', function() {
            this.querySelector('.card-glow').style.opacity = '0';
        });
    });
    
    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
})();
</script> 