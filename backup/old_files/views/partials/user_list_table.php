<!-- User List -->
<div class="user-table-container">
    <div class="table-header">
        <div class="header-content">
            <div class="header-title">
                <i class="fa fa-users"></i>
                <h3>Recent Users</h3>
            </div>
            <div class="header-stats">
                <span class="stat-badge">
                    <i class="fa fa-user"></i>
                    <?php echo count($viewData['users'] ?? []); ?> Users
                </span>
            </div>
        </div>
    </div>
    
    <div class="table-body">
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th><i class="fa fa-user"></i> Username</th>
                        <th><i class="fa fa-id-card"></i> Name</th>
                        <th><i class="fa fa-envelope"></i> Email</th>
                        <th><i class="fa fa-globe"></i> IP Address</th>
                        <th><i class="fa fa-cube"></i> Packet</th>
                        <th><i class="fa fa-circle"></i> Status</th>
                        <th><i class="fa fa-calendar"></i> Expires On</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($viewData['users'])): ?>
                        <?php foreach ($viewData['users'] as $user): ?>
                        <tr class="user-row">
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
                                <div class="name-cell">
                                    <?php 
                                    $fullName = trim(($user['name'] ?? '') . ' ' . ($user['lastname'] ?? ''));
                                    echo htmlspecialchars($fullName ?: 'N/A'); 
                                    ?>
                                </div>
                            </td>
                            <td>
                                <div class="email-cell">
                                    <?php if (!empty($user['email'])): ?>
                                        <a href="mailto:<?php echo htmlspecialchars($user['email']); ?>" class="email-link">
                                            <i class="fa fa-envelope"></i>
                                            <?php echo htmlspecialchars($user['email']); ?>
                                        </a>
                                    <?php else: ?>
                                        <span class="no-data">N/A</span>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td>
                                <div class="ip-cell">
                                    <i class="fa fa-globe"></i>
                                    <?php echo htmlspecialchars($user['ipaddress'] ?? 'N/A'); ?>
                                </div>
                            </td>
                            <td>
                                <div class="packet-cell">
                                    <span class="packet-badge">
                                        <?php echo htmlspecialchars($user['packet'] ?? 'N/A'); ?>
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="status-cell">
                                    <?php if ($user['is_online'] > 0): ?>
                                        <span class="status-badge online">
                                            <i class="fa fa-circle"></i>
                                            Online
                                        </span>
                                    <?php else: ?>
                                        <span class="status-badge offline">
                                            <i class="fa fa-circle"></i>
                                            Offline
                                        </span>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td>
                                <div class="expiry-cell">
                                    <?php 
                                    if (!empty($user['expire'])): 
                                        $expireDate = strtotime($user['expire']);
                                        $isExpired = $expireDate < time();
                                        $daysLeft = ceil(($expireDate - time()) / (24 * 60 * 60));
                                        
                                        if ($isExpired) {
                                            echo '<span class="expiry-badge expired">';
                                            echo '<i class="fa fa-exclamation-triangle"></i>';
                                            echo 'Expired';
                                            echo '</span>';
                                        } elseif ($daysLeft <= 7) {
                                            echo '<span class="expiry-badge warning">';
                                            echo '<i class="fa fa-clock-o"></i>';
                                            echo $daysLeft . ' days left';
                                            echo '</span>';
                                        } else {
                                            echo '<span class="expiry-badge valid">';
                                            echo '<i class="fa fa-check-circle"></i>';
                                            echo date('Y-m-d', $expireDate);
                                            echo '</span>';
                                        }
                                    else: 
                                        echo '<span class="no-data">N/A</span>';
                                    endif; 
                                    ?>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="7" class="text-center no-data-row">
                                <div class="no-data-content">
                                    <i class="fa fa-users"></i>
                                    <p>No users found.</p>
                                </div>
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
    
    <div class="table-footer">
        <div class="footer-content">
            <a href="index.php?mod=userlist" class="btn btn-primary">
                <i class="fa fa-list"></i>
                View All Users
            </a>
            
            <!-- Pagination -->
            <div class="pagination-container">
                <ul class="pagination">
                    <?php 
                    $searchParam = !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : '';
                    ?>
                    
                    <?php if ($viewData['currentPage'] > 1): ?>
                        <li>
                            <a href="/index.php?mod=dashboard&page=<?php echo $viewData['currentPage'] - 1; ?><?php echo $searchParam; ?>">
                                <i class="fa fa-chevron-left"></i>
                                Previous
                            </a>
                        </li>
                    <?php endif; ?>

                    <?php for ($i = 1; $i <= $viewData['totalPages']; $i++): ?>
                        <li class="<?php echo ($i == $viewData['currentPage']) ? 'active' : ''; ?>">
                            <a href="/index.php?mod=dashboard&page=<?php echo $i; ?><?php echo $searchParam; ?>"><?php echo $i; ?></a>
                        </li>
                    <?php endfor; ?>

                    <?php if ($viewData['currentPage'] < $viewData['totalPages']): ?>
                        <li>
                            <a href="/index.php?mod=dashboard&page=<?php echo $viewData['currentPage'] + 1; ?><?php echo $searchParam; ?>">
                                Next
                                <i class="fa fa-chevron-right"></i>
                            </a>
                        </li>
                    <?php endif; ?>
                </ul>
            </div>
        </div>
    </div>
</div>

<style>
/* User Table Styles */
.user-table-container {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
}

.user-table-container:hover {
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
}

.table-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 25px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-title i {
    font-size: 1.5rem;
}

.header-title h3 {
    margin: 0;
    font-weight: 600;
    font-size: 1.3rem;
}

.header-stats {
    display: flex;
    gap: 15px;
}

.stat-badge {
    background: rgba(255,255,255,0.2);
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(10px);
}

.table-body {
    padding: 0;
}

.table {
    margin: 0;
    border: none;
}

.table thead th {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: none;
    padding: 15px;
    font-weight: 600;
    color: #2c3e50;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
    vertical-align: middle;
}

.table thead th i {
    color: #667eea;
    font-size: 0.9rem;
    margin-right: 5px;
}

.table tbody tr {
    border: none;
    transition: all 0.3s ease;
}

.table tbody tr:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    transform: scale(1.01);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.table tbody td {
    padding: 15px;
    border: none;
    border-bottom: 1px solid #f1f3f4;
    vertical-align: middle;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-avatar {
    width: 35px;
    height: 35px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
}

.name-cell {
    font-weight: 600;
    color: #2c3e50;
}

.email-cell {
    display: flex;
    align-items: center;
}

.email-link {
    color: #667eea;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.email-link:hover {
    color: #5a67d8;
    text-decoration: none;
    transform: translateX(3px);
}

.ip-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6c757d;
    font-family: 'Courier New', monospace;
    font-weight: 500;
}

.packet-cell {
    display: flex;
    align-items: center;
}

.packet-badge {
    background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-cell {
    display: flex;
    align-items: center;
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-badge.online {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
}

.status-badge.offline {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    color: white;
}

.status-badge i {
    font-size: 0.6rem;
}

.expiry-cell {
    display: flex;
    align-items: center;
}

.expiry-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.expiry-badge.valid {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
}

.expiry-badge.warning {
    background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
    color: white;
}

.expiry-badge.expired {
    background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
    color: white;
}

.no-data {
    color: #6c757d;
    font-style: italic;
}

.no-data-row {
    padding: 40px 20px;
}

.no-data-content {
    text-align: center;
    color: #6c757d;
}

.no-data-content i {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.5;
}

.no-data-content p {
    margin: 0;
    font-size: 1.1rem;
}

.table-footer {
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    padding: 20px 25px;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pagination-container {
    display: flex;
    align-items: center;
}

.pagination {
    margin: 0;
    display: flex;
    gap: 5px;
}

.pagination > li > a {
    border: none;
    border-radius: 10px;
    color: #495057;
    padding: 8px 12px;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 5px;
}

.pagination > li > a:hover {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.pagination > .active > a {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .footer-content {
        flex-direction: column;
        gap: 15px;
    }
    
    .table-responsive {
        overflow-x: auto;
    }
    
    .table thead th,
    .table tbody td {
        min-width: 120px;
    }
}
</style> 