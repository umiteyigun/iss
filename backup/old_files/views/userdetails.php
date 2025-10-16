<!-- Styles and scripts are now in layout.php -->

<!-- Modern Customer Details Page -->
<div class="user-details-container">
    <!-- Page Header -->
    <div class="page-header">
        <div class="header-content">
            <div class="header-left">
                <h1 class="page-title">
                    <i class="fa fa-user-circle"></i>
                    Customer Details
                </h1>
                <p class="page-subtitle">Complete profile and service information for <?php echo htmlspecialchars($username); ?></p>
            </div>
            <div class="header-actions">
                <a href="index.php?mod=editUser&username=<?php echo $username; ?>" class="btn btn-primary">
                    <i class="fa fa-edit"></i>
                    Edit Customer
                </a>
                <a href="index.php?mod=userRenew&username=<?php echo $username; ?>" class="btn btn-warning">
                    <i class="fa fa-refresh"></i>
                    Renew
                </a>
                <a href="/index.php?mod=userlist" class="btn btn-secondary">
                    <i class="fa fa-arrow-left"></i>
                    Back to List
                </a>
            </div>
        </div>
    </div>

    <!-- Customer Overview -->
    <div class="customer-overview">
        <div class="overview-card">
            <div class="overview-header">
                <div class="user-avatar">
                    <i class="fa fa-user"></i>
                </div>
                <div class="user-info">
                    <h2 class="user-name"><?php echo htmlspecialchars(trim(($user['name'] ?? '') . ' ' . ($user['lastname'] ?? '')) ?: $username); ?></h2>
                    <p class="user-username">@<?php echo htmlspecialchars($username); ?></p>
                </div>
                <div class="user-status">
                    <?php if (($user['is_online'] ?? 0) > 0): ?>
                        <span class="status-indicator online">
                            <i class="fa fa-circle"></i>
                            Online
                        </span>
                    <?php else: ?>
                        <span class="status-indicator offline">
                            <i class="fa fa-circle"></i>
                            Offline
                        </span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions Bar -->
    <div class="quick-actions-bar">
        <div class="actions-container">
            <a href="index.php?mod=traffic&username=<?php echo $username; ?>" class="action-item">
                <div class="action-icon">
                    <i class="fa fa-database"></i>
                </div>
                <span class="action-text">Add Traffic</span>
            </a>
            
            <a href="index.php?mod=invoices&username=<?php echo $username; ?>" class="action-item">
                <div class="action-icon">
                    <i class="fa fa-file-text"></i>
                </div>
                <span class="action-text">View Invoices</span>
            </a>
            
            <a href="index.php?mod=history&username=<?php echo $username; ?>" class="action-item">
                <div class="action-icon">
                    <i class="fa fa-history"></i>
                </div>
                <span class="action-text">Connection History</span>
            </a>
            
            <a href="index.php?mod=sms&username=<?php echo $username; ?>" class="action-item">
                <div class="action-icon">
                    <i class="fa fa-comment"></i>
                </div>
                <span class="action-text">Send SMS</span>
            </a>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
        <!-- Personal Information -->
        <div class="info-section">
            <div class="section-card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fa fa-id-card"></i>
                        Personal Information
                    </h3>
                </div>
                <div class="card-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-user"></i>
                                Full Name
                            </div>
                            <div class="info-value">
                                <?php echo htmlspecialchars(trim(($user['name'] ?? '') . ' ' . ($user['lastname'] ?? '')) ?: 'N/A'); ?>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-envelope"></i>
                                Email Address
                            </div>
                            <div class="info-value">
                                <?php if (!empty($user['email'])): ?>
                                    <a href="mailto:<?php echo htmlspecialchars($user['email']); ?>" class="contact-link">
                                        <?php echo htmlspecialchars($user['email']); ?>
                                    </a>
                                <?php else: ?>
                                    <span class="no-data">N/A</span>
                                <?php endif; ?>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-phone"></i>
                                Phone Number
                            </div>
                            <div class="info-value">
                                <?php if (!empty($user['phone1'])): ?>
                                    <a href="tel:<?php echo htmlspecialchars($user['phone1']); ?>" class="contact-link">
                                        <?php echo htmlspecialchars($user['phone1']); ?>
                                    </a>
                                <?php else: ?>
                                    <span class="no-data">N/A</span>
                                <?php endif; ?>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-map-marker"></i>
                                Address
                            </div>
                            <div class="info-value">
                                <?php echo htmlspecialchars($user['address'] ?? 'N/A'); ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Service Information -->
        <div class="info-section">
            <div class="section-card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fa fa-cogs"></i>
                        Service Information
                    </h3>
                </div>
                <div class="card-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-cube"></i>
                                Service Package
                            </div>
                            <div class="info-value">
                                <span class="package-badge">
                                    <?php echo htmlspecialchars($user['packet'] ?? 'N/A'); ?>
                                </span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-calendar"></i>
                                Expiration Date
                            </div>
                            <div class="info-value">
                                <?php 
                                if (!empty($user['expire'])):
                                    $expireDate = strtotime($user['expire']);
                                    $isExpired = $expireDate < time();
                                    $daysLeft = ceil(($expireDate - time()) / (24 * 60 * 60));
                                    
                                    if ($isExpired): ?>
                                        <span class="expiry-badge expired">
                                            <i class="fa fa-exclamation-triangle"></i>
                                            Expired
                                        </span>
                                    <?php elseif ($daysLeft <= 7): ?>
                                        <span class="expiry-badge warning">
                                            <i class="fa fa-clock-o"></i>
                                            <?php echo $daysLeft; ?> days left
                                        </span>
                                    <?php else: ?>
                                        <span class="expiry-badge valid">
                                            <i class="fa fa-check-circle"></i>
                                            <?php echo date("M d, Y", $expireDate); ?>
                                        </span>
                                    <?php endif;
                                else: ?>
                                    <span class="no-data">N/A</span>
                                <?php endif; ?>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-globe"></i>
                                IP Address
                            </div>
                            <div class="info-value">
                                <?php echo htmlspecialchars($user['ipaddress'] ?? 'N/A'); ?>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-server"></i>
                                Router/NAS
                            </div>
                            <div class="info-value">
                                <?php echo htmlspecialchars($user['nasname'] ?? 'N/A'); ?>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-wifi"></i>
                                Access Point
                            </div>
                            <div class="info-value">
                                <?php echo htmlspecialchars($user['accesspoint'] ?? 'N/A'); ?>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fa fa-network-wired"></i>
                                IP Pool
                            </div>
                            <div class="info-value">
                                <?php echo htmlspecialchars($user['pool_name'] ?? 'N/A'); ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 