<?php
$radiusOnlineUsers = $viewData['radiusOnlineUsers'] ?? [];
$mikrotikOnlineUsers = $viewData['mikrotikOnlineUsers'] ?? [];
$comparisonData = $viewData['comparisonData'] ?? [];
$radiusCount = $viewData['radiusCount'] ?? 0;
$mikrotikCount = $viewData['mikrotikCount'] ?? 0;
$missingInRadiusCount = $viewData['missingInRadiusCount'] ?? 0;
$missingInMikrotikCount = $viewData['missingInMikrotikCount'] ?? 0;
?>

<section class="content">
    <!-- Modern Page Header -->
    <div class="page-header">
        <div class="header-content">
            <h1 class="page-title">
                <i class="fa fa-wifi"></i>
                Online Users Analysis
            </h1>
            <p class="page-subtitle">Real-time comparison between RADIUS and Mikrotik systems</p>
        </div>
        <div class="header-stats">
            <div class="stat-badge">
                <i class="fa fa-clock-o"></i>
                <span id="last-update">Just now</span>
            </div>
        </div>
    </div>

    <!-- Modern Summary Cards -->
    <div class="row">
        <div class="col-lg-3 col-xs-6">
            <div class="modern-stat-card radius-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="ion ion-stats-bars"></i>
                    </div>
                    <div class="card-title">RADIUS Users</div>
                </div>
                <div class="card-body">
                    <div class="stat-number"><?php echo $radiusCount; ?></div>
                    <div class="stat-label">Active Sessions</div>
                </div>
                <div class="card-footer">
                    <div class="stat-trend">
                        <i class="fa fa-database"></i>
                        <span>RADIUS System</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-lg-3 col-xs-6">
            <div class="modern-stat-card mikrotik-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="ion ion-wifi"></i>
                    </div>
                    <div class="card-title">Mikrotik Users</div>
                </div>
                <div class="card-body">
                    <div class="stat-number"><?php echo $mikrotikCount; ?></div>
                    <div class="stat-label">Active Connections</div>
                </div>
                <div class="card-footer">
                    <div class="stat-trend">
                        <i class="fa fa-server"></i>
                        <span>Mikrotik System</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-lg-3 col-xs-6">
            <div class="modern-stat-card missing-radius-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="ion ion-alert"></i>
                    </div>
                    <div class="card-title">Missing in RADIUS</div>
                </div>
                <div class="card-body">
                    <div class="stat-number"><?php echo $missingInRadiusCount; ?></div>
                    <div class="stat-label">Accounting Issues</div>
                </div>
                <div class="card-footer">
                    <div class="stat-trend">
                        <i class="fa fa-exclamation-triangle"></i>
                        <span>Requires Attention</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-lg-3 col-xs-6">
            <div class="modern-stat-card missing-mikrotik-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="ion ion-help"></i>
                    </div>
                    <div class="card-title">Missing in Mikrotik</div>
                </div>
                <div class="card-body">
                    <div class="stat-number"><?php echo $missingInMikrotikCount; ?></div>
                    <div class="stat-label">Connection Issues</div>
                </div>
                <div class="card-footer">
                    <div class="stat-trend">
                        <i class="fa fa-question-circle"></i>
                        <span>Investigation Needed</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Mikrotik Users with RADIUS Comparison -->
    <div class="row">
        <div class="col-xs-12">
            <div class="modern-data-card">
                <div class="card-header">
                    <div class="header-left">
                        <h3 class="card-title">
                            <i class="fa fa-wifi"></i>
                            Mikrotik Online Users
                        </h3>
                        <div class="card-subtitle"><?php echo $mikrotikCount; ?> active connections</div>
                    </div>
                    <div class="header-right">
                        <div class="status-legend">
                            <span class="legend-item success">
                                <i class="fa fa-check"></i> In RADIUS
                            </span>
                            <span class="legend-item danger">
                                <i class="fa fa-times"></i> Missing in RADIUS
                            </span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Username</th>
                                    <th>IP Address</th>
                                    <th>NAS IP</th>
                                    <th>Service</th>
                                    <th>Uptime</th>
                                    <th>Encoding</th>
                                    <th>Caller ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($mikrotikOnlineUsers)): ?>
                                    <tr>
                                        <td colspan="8" class="empty-state">
                                            <div class="empty-content">
                                                <i class="fa fa-wifi"></i>
                                                <p>No active Mikrotik online users found.</p>
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
                                        $rowClass = $isInRadius ? 'success-row' : 'danger-row';
                                        $statusIcon = $isInRadius ? '<i class="fa fa-check-circle"></i>' : '<i class="fa fa-times-circle"></i>';
                                        ?>
                                        <tr class="<?php echo $rowClass; ?>">
                                            <td class="status-cell">
                                                <span class="status-icon"><?php echo $statusIcon; ?></span>
                                            </td>
                                            <td class="username-cell">
                                                <strong><?php echo htmlspecialchars($user['username']); ?></strong>
                                            </td>
                                            <td><?php echo htmlspecialchars($user['ip_address']); ?></td>
                                            <td><?php echo htmlspecialchars($user['nas_ip']); ?></td>
                                            <td><?php echo htmlspecialchars($user['service']); ?></td>
                                            <td><?php echo htmlspecialchars($user['uptime']); ?></td>
                                            <td><?php echo htmlspecialchars($user['encoding']); ?></td>
                                            <td><?php echo htmlspecialchars($user['caller_id']); ?></td>
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

    <!-- RADIUS Users with Mikrotik Comparison -->
    <div class="row">
        <div class="col-xs-12">
            <div class="modern-data-card">
                <div class="card-header">
                    <div class="header-left">
                        <h3 class="card-title">
                            <i class="fa fa-database"></i>
                            RADIUS Online Users
                        </h3>
                        <div class="card-subtitle"><?php echo $radiusCount; ?> active sessions</div>
                    </div>
                    <div class="header-right">
                        <div class="status-legend">
                            <span class="legend-item success">
                                <i class="fa fa-check"></i> In Mikrotik
                            </span>
                            <span class="legend-item warning">
                                <i class="fa fa-times"></i> Missing in Mikrotik
                            </span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Username</th>
                                    <th>IP Address</th>
                                    <th>NAS IP Address</th>
                                    <th>Login Time</th>
                                    <th>Session Duration</th>
                                    <th>Downloaded</th>
                                    <th>Uploaded</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($radiusOnlineUsers)): ?>
                                    <tr>
                                        <td colspan="8" class="empty-state">
                                            <div class="empty-content">
                                                <i class="fa fa-database"></i>
                                                <p>No active RADIUS online users found.</p>
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
                                        $rowClass = $isInMikrotik ? 'success-row' : 'warning-row';
                                        $statusIcon = $isInMikrotik ? '<i class="fa fa-check-circle"></i>' : '<i class="fa fa-times-circle"></i>';
                                        ?>
                                        <tr class="<?php echo $rowClass; ?>">
                                            <td class="status-cell">
                                                <span class="status-icon"><?php echo $statusIcon; ?></span>
                                            </td>
                                            <td class="username-cell">
                                                <strong><?php echo htmlspecialchars($user['username']); ?></strong>
                                            </td>
                                            <td><?php echo htmlspecialchars($user['framedipaddress'] ?? 'N/A'); ?></td>
                                            <td><?php echo htmlspecialchars($user['nasipaddress'] ?? 'N/A'); ?></td>
                                            <td><?php echo htmlspecialchars($user['acctstarttime'] ?? 'N/A'); ?></td>
                                            <td><?php echo gmdate("H:i:s", $user['acctsessiontime']); ?></td>
                                            <td><?php echo round($user['acctoutputoctets'] / 1024 / 1024, 2) . ' MB'; ?></td>
                                            <td><?php echo round($user['acctinputoctets'] / 1024 / 1024, 2) . ' MB'; ?></td>
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

    <!-- Detailed Comparison Summary -->
    <div class="row">
        <div class="col-xs-12">
            <div class="modern-data-card comparison-card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fa fa-balance-scale"></i>
                        Detailed Comparison Summary
                    </h3>
                </div>
                <div class="card-body">
                    <div class="comparison-grid">
                        <div class="comparison-section">
                            <h4 class="section-title">
                                <i class="fa fa-exclamation-triangle"></i>
                                Users Missing in RADIUS (<?php echo $missingInRadiusCount; ?>)
                            </h4>
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
                                                <strong><?php echo htmlspecialchars($user['username']); ?></strong>
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
                        
                        <div class="comparison-section">
                            <h4 class="section-title">
                                <i class="fa fa-question-circle"></i>
                                Users Missing in Mikrotik (<?php echo $missingInMikrotikCount; ?>)
                            </h4>
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
                                                <strong><?php echo htmlspecialchars($user['username']); ?></strong>
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
                    
                    <div class="notes-section">
                        <h4 class="notes-title">
                            <i class="fa fa-info-circle"></i>
                            Analysis Notes
                        </h4>
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
        </div>
    </div>

    <style>
    /* Modern Online Users Styles */
    .page-header {
        background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%);
        border-radius: 20px;
        padding: 30px;
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.3);
        box-shadow: 0 15px 50px rgba(0,0,0,0.1);
    }
    
    .page-title {
        color: #1a1a1a;
        font-size: 32px;
        font-weight: 800;
        margin: 0 0 10px 0;
        display: flex;
        align-items: center;
        gap: 15px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .page-title i {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
    
    .page-subtitle {
        color: #666;
        font-size: 16px;
        margin: 0;
        font-weight: 500;
    }
    
    .header-stats {
        display: flex;
        gap: 15px;
    }
    
    .stat-badge {
        background: rgba(255,255,255,0.9);
        padding: 10px 15px;
        border-radius: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.3);
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .stat-badge i {
        color: #667eea;
        font-size: 14px;
    }
    
    .stat-badge span {
        color: #1a1a1a;
        font-weight: 600;
        font-size: 13px;
    }
    
    /* Modern Stat Cards */
    .modern-stat-card {
        background: rgba(255,255,255,0.98);
        border-radius: 20px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.15);
        margin-bottom: 30px;
        overflow: hidden;
        transition: all 0.4s ease;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.3);
        position: relative;
    }
    
    .modern-stat-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 25px 80px rgba(0,0,0,0.2);
    }
    
    .modern-stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, var(--card-color-1), var(--card-color-2));
    }
    
    .radius-card {
        --card-color-1: #00d4aa;
        --card-color-2: #00b894;
    }
    
    .mikrotik-card {
        --card-color-1: #00b8d4;
        --card-color-2: #0099cc;
    }
    
    .missing-radius-card {
        --card-color-1: #ff6b6b;
        --card-color-2: #ee5a24;
    }
    
    .missing-mikrotik-card {
        --card-color-1: #feca57;
        --card-color-2: #ff9ff3;
    }
    
    .card-header {
        padding: 25px 25px 15px 25px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%);
        border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    
    .card-icon {
        background: linear-gradient(135deg, var(--card-color-1), var(--card-color-2));
        color: white;
        width: 55px;
        height: 55px;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.25);
    }
    
    .card-title {
        color: #1a1a1a;
        font-size: 16px;
        font-weight: 800;
        text-align: right;
        flex: 1;
        margin-left: 15px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .card-body {
        padding: 25px 25px;
        text-align: center;
        background: rgba(255,255,255,0.95);
    }
    
    .stat-number {
        font-size: 42px;
        font-weight: 900;
        color: #1a1a1a;
        margin-bottom: 10px;
        line-height: 1;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .stat-label {
        font-size: 13px;
        color: #555;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.8px;
    }
    
    .card-footer {
        padding: 18px 25px;
        background: rgba(248,249,250,0.95);
        border-top: 1px solid rgba(0,0,0,0.08);
    }
    
    .stat-trend {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: var(--card-color-1);
    }
    
    /* Modern Data Cards */
    .modern-data-card {
        background: rgba(255,255,255,0.98);
        border-radius: 20px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.15);
        margin-bottom: 30px;
        overflow: hidden;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.3);
    }
    
    .modern-data-card .card-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: none;
    }
    
    .header-left h3.card-title {
        color: white;
        font-size: 24px;
        font-weight: 800;
        margin: 0 0 5px 0;
        display: flex;
        align-items: center;
        gap: 12px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .card-subtitle {
        color: rgba(255,255,255,0.9);
        font-size: 14px;
        font-weight: 600;
        margin: 0;
    }
    
    .status-legend {
        display: flex;
        gap: 15px;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        backdrop-filter: blur(10px);
    }
    
    .legend-item.success {
        background: rgba(0, 184, 148, 0.2);
        color: #00b894;
        border: 1px solid rgba(0, 184, 148, 0.3);
    }
    
    .legend-item.danger {
        background: rgba(214, 48, 49, 0.2);
        color: #d63031;
        border: 1px solid rgba(214, 48, 49, 0.3);
    }
    
    .legend-item.warning {
        background: rgba(253, 203, 110, 0.2);
        color: #fdcb6e;
        border: 1px solid rgba(253, 203, 110, 0.3);
    }
    
    .card-body {
        padding: 0;
        background: rgba(255,255,255,0.95);
    }
    
    .table-container {
        overflow-x: auto;
    }
    
    /* Modern Table */
    .modern-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }
    
    .modern-table thead th {
        background: rgba(248,249,250,0.9);
        color: #1a1a1a;
        font-weight: 800;
        padding: 18px 15px;
        text-align: left;
        border-bottom: 2px solid rgba(0,0,0,0.1);
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;
    }
    
    .modern-table tbody tr {
        transition: all 0.3s ease;
        border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    
    .modern-table tbody tr:hover {
        background: rgba(102, 126, 234, 0.05);
        transform: scale(1.01);
    }
    
    .modern-table tbody td {
        padding: 15px;
        color: #1a1a1a;
        font-weight: 500;
    }
    
    .status-cell {
        text-align: center;
        width: 60px;
    }
    
    .status-icon {
        font-size: 18px;
        display: inline-block;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
    }
    
    .success-row .status-icon {
        color: #00b894;
        background: rgba(0, 184, 148, 0.1);
    }
    
    .danger-row .status-icon {
        color: #d63031;
        background: rgba(214, 48, 49, 0.1);
    }
    
    .warning-row .status-icon {
        color: #fdcb6e;
        background: rgba(253, 203, 110, 0.1);
    }
    
    .username-cell {
        font-weight: 700;
    }
    
    .empty-state {
        text-align: center;
        padding: 60px 20px;
    }
    
    .empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        color: #666;
    }
    
    .empty-content i {
        font-size: 48px;
        color: #ddd;
    }
    
    .empty-content p {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
    }
    
    /* Comparison Section */
    .comparison-card .card-header {
        background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
    }
    
    .comparison-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
    }
    
    .comparison-section {
        background: rgba(255,255,255,0.9);
        border-radius: 15px;
        padding: 25px;
        border: 1px solid rgba(0,0,0,0.05);
    }
    
    .section-title {
        color: #1a1a1a;
        font-size: 18px;
        font-weight: 800;
        margin: 0 0 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .success-message {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px;
        background: rgba(0, 184, 148, 0.1);
        border: 1px solid rgba(0, 184, 148, 0.2);
        border-radius: 10px;
        color: #00b894;
        font-weight: 600;
    }
    
    .user-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .user-item {
        padding: 15px;
        border-radius: 10px;
        border: 1px solid;
        transition: all 0.3s ease;
    }
    
    .user-item:hover {
        transform: translateX(5px);
    }
    
    .user-item.danger {
        background: rgba(214, 48, 49, 0.1);
        border-color: rgba(214, 48, 49, 0.2);
    }
    
    .user-item.warning {
        background: rgba(253, 203, 110, 0.1);
        border-color: rgba(253, 203, 110, 0.2);
    }
    
    .user-info {
        margin-bottom: 8px;
    }
    
    .user-info strong {
        color: #1a1a1a;
        font-size: 16px;
    }
    
    .user-details {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .detail-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        color: #666;
    }
    
    .detail-item i {
        color: #667eea;
    }
    
    /* Notes Section */
    .notes-section {
        background: rgba(248,249,250,0.9);
        border-radius: 15px;
        padding: 25px;
        border: 1px solid rgba(0,0,0,0.05);
    }
    
    .notes-title {
        color: #1a1a1a;
        font-size: 18px;
        font-weight: 800;
        margin: 0 0 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px;
    }
    
    .note-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 15px;
        background: white;
        border-radius: 10px;
        border: 1px solid rgba(0,0,0,0.05);
        transition: all 0.3s ease;
    }
    
    .note-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .note-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
    }
    
    .note-icon.success {
        background: rgba(0, 184, 148, 0.1);
        color: #00b894;
    }
    
    .note-icon.danger {
        background: rgba(214, 48, 49, 0.1);
        color: #d63031;
    }
    
    .note-icon.warning {
        background: rgba(253, 203, 110, 0.1);
        color: #fdcb6e;
    }
    
    .note-icon.info {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
    }
    
    .note-content {
        color: #1a1a1a;
        font-size: 14px;
        line-height: 1.5;
    }
    
    .note-content strong {
        color: #333;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
        }
        
        .header-stats {
            flex-direction: column;
            gap: 10px;
        }
        
        .comparison-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .notes-grid {
            grid-template-columns: 1fr;
        }
        
        .modern-data-card .card-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
        }
        
        .status-legend {
            flex-direction: column;
            gap: 8px;
        }
        
        .user-details {
            flex-direction: column;
            gap: 8px;
        }
    }
    
    /* Animation for cards */
    .modern-stat-card {
        animation: cardSlideIn 0.6s ease forwards;
        opacity: 0;
        transform: translateY(30px);
    }
    
    .modern-stat-card:nth-child(1) { animation-delay: 0.1s; }
    .modern-stat-card:nth-child(2) { animation-delay: 0.2s; }
    .modern-stat-card:nth-child(3) { animation-delay: 0.3s; }
    .modern-stat-card:nth-child(4) { animation-delay: 0.4s; }
    
    @keyframes cardSlideIn {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    </style>

    <script>
    // Update last update time
    function updateLastUpdate() {
        const now = new Date();
        const timeElement = document.getElementById('last-update');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('tr-TR');
        }
    }
    
    // Update every minute
    setInterval(updateLastUpdate, 60000);
    updateLastUpdate();
    </script>
</section> 