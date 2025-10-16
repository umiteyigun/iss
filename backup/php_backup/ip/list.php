<?php
$pageTitle = "IP Yönetimi";
$currentPage = "ip";

// Get data from controller
$metroIPs = $viewData['metroIPs'] ?? [];
$radippools = $viewData['radippools'] ?? [];
$nasList = $viewData['nasList'] ?? [];

// Pagination data
$metroIPPage = $viewData['metroIPPage'] ?? 1;
$radippoolPage = $viewData['radippoolPage'] ?? 1;
$totalMetroIPPages = $viewData['totalMetroIPPages'] ?? 1;
$totalRadippoolPages = $viewData['totalRadippoolPages'] ?? 1;
$totalMetroIPs = $viewData['totalMetroIPs'] ?? 0;
$totalRadippools = $viewData['totalRadippools'] ?? 0;
$perPage = $viewData['perPage'] ?? 15;

// Calculate stats
$assignedMetroIPs = count(array_filter($metroIPs, function($ip) { return !empty($ip['user']); }));
$assignedRadippools = count(array_filter($radippools, function($pool) { return !empty($pool['username']); }));
?>

<!-- Main content -->
<section class="content">
    <!-- Modern Dashboard Header -->
    <div class="dashboard-hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1 class="hero-title">
                    <span class="title-icon">🌐</span>
                    IP Management Dashboard
                </h1>
                <p class="hero-subtitle">Public IP & Pool Management System</p>
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
                    <div class="card-icon">🔧</div>
                    <div class="card-text">Network Tools</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modern Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon wifi-icon">
                        <i class="fa fa-globe"></i>
                    </div>
                    <div class="stat-badge live">Live</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $totalMetroIPs; ?></div>
                        <div class="stat-label">Total MetroIPs</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon users-icon">
                        <i class="fa fa-users"></i>
                    </div>
                    <div class="stat-badge success">Active</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $assignedMetroIPs; ?></div>
                        <div class="stat-label">Assigned IPs</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon warning-icon">
                        <i class="fa fa-database"></i>
                    </div>
                    <div class="stat-badge warning">Pool</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $totalRadippools; ?></div>
                        <div class="stat-label">IP Pools</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon total-icon">
                        <i class="fa fa-server"></i>
                    </div>
                    <div class="stat-badge info">System</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo count($nasList); ?></div>
                        <div class="stat-label">NAS Devices</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- IP Management Section -->
    <div class="user-management-section">
        <div class="section-header">
            <div class="header-content">
                <div class="header-title">
                    <i class="fa fa-globe"></i>
                    <h3>IP Management</h3>
                </div>
            </div>
        </div>
        
        <div class="management-container">
            <!-- Action Buttons -->
            <div class="search-form-container">
                <div class="section-actions">
                    <button class="refresh-btn" onclick="openModal('addMetroIPModal')">
                        <i class="fa fa-plus"></i>
                        Add MetroIP
                    </button>
                    <button class="refresh-btn" onclick="openModal('addRadippoolModal')">
                        <i class="fa fa-plus"></i>
                        Add IP Pool
                    </button>
                    <button class="refresh-btn" onclick="openModal('splitIPModal')">
                        <i class="fa fa-cut"></i>
                        Split IP
                    </button>
                </div>
            </div>

            <!-- MetroIP Management Section -->
            <div class="user-list-container">
                <div class="box">
                    <div class="box-header">
                        <h3 class="box-title">
                            <i class="fa fa-globe"></i>
                            MetroIP Records
                            <span class="badge badge-info"><?php echo $totalMetroIPs; ?> Total</span>
                        </h3>
                        <div class="search-input-wrapper">
                            <div class="search-icon">
                                <i class="fa fa-search"></i>
                            </div>
                            <input type="text" id="metroIPSearch" class="search-input" placeholder="Search MetroIP...">
                        </div>
                    </div>
                    
                    <div class="box-body">
                        <div class="table-responsive">
                            <table class="table table-striped" id="metroIPTable">
                                <thead>
                                    <tr>
                                        <th>IP Address</th>
                                        <th>Port Type</th>
                                        <th>NAS</th>
                                        <th>User</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if (empty($metroIPs)): ?>
                                        <tr>
                                            <td colspan="7" class="text-center">
                                                <i class="fa fa-globe"></i>
                                                <p>No MetroIP records found</p>
                                            </td>
                                        </tr>
                                    <?php else: ?>
                                        <?php foreach ($metroIPs as $ip): ?>
                                            <tr>
                                                <td>
                                                    <i class="fa fa-globe"></i>
                                                    <strong><?php echo htmlspecialchars($ip['ipaddress'] ?? ''); ?></strong>
                                                </td>
                                                <td>
                                                    <span class="badge badge-primary">
                                                        <?php 
                                                        $ports = htmlspecialchars($ip['ports'] ?? '');
                                                        // Eğer port aralığı 1-65535 veya benzeri ise "Statik" göster
                                                        if (preg_match('/^1-\d+$/', $ports) || $ports === '1-65535' || $ports === '1-65000') {
                                                            echo 'Statik';
                                                        } else {
                                                            echo $ports;
                                                        }
                                                        ?>
                                                    </span>
                                                </td>
                                                <td>
                                                    <i class="fa fa-server"></i>
                                                    <?php echo htmlspecialchars($ip['nasname'] ?? ''); ?>
                                                </td>
                                                <td>
                                                    <?php if (!empty($ip['user'])): ?>
                                                        <i class="fa fa-user"></i>
                                                        <span><?php echo htmlspecialchars(($ip['user_name'] ?? '') . ' ' . ($ip['user_lastname'] ?? '')); ?></span>
                                                        <br><small><?php echo htmlspecialchars($ip['user_username'] ?? ''); ?></small>
                                                    <?php else: ?>
                                                        <span class="badge badge-warning">Available</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <span><?php echo htmlspecialchars($ip['description'] ?? ''); ?></span>
                                                </td>
                                                <td>
                                                    <?php if (!empty($ip['user'])): ?>
                                                        <span class="badge badge-success">Assigned</span>
                                                    <?php else: ?>
                                                        <span class="badge badge-warning">Available</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php if (!empty($ip['user'])): ?>
                                                        <button class="btn btn-sm btn-warning" onclick="unassignIP(<?php echo $ip['id']; ?>)" title="Unassign">
                                                            <i class="fa fa-unlink"></i>
                                                        </button>
                                                    <?php endif; ?>
                                                    <button class="btn btn-sm btn-danger" onclick="deleteMetroIP(<?php echo $ip['id']; ?>)" title="Delete">
                                                        <i class="fa fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- MetroIP Pagination -->
                        <?php if ($totalMetroIPPages > 1): ?>
                            <div class="pagination-container">
                                <div class="pagination-info">
                                    Showing <?php echo (($metroIPPage - 1) * $perPage) + 1; ?> to <?php echo min($metroIPPage * $perPage, $totalMetroIPs); ?> of <?php echo $totalMetroIPs; ?> entries
                                </div>
                                <ul class="pagination">
                                    <?php if ($metroIPPage > 1): ?>
                                        <li><a href="?mod=ip&metroip_page=<?php echo $metroIPPage - 1; ?>&radippool_page=<?php echo $radippoolPage; ?>">&laquo; Previous</a></li>
                                    <?php endif; ?>
                                    
                                    <?php
                                    $startPage = max(1, $metroIPPage - 2);
                                    $endPage = min($totalMetroIPPages, $metroIPPage + 2);
                                    
                                    for ($i = $startPage; $i <= $endPage; $i++):
                                    ?>
                                        <li class="<?php echo $i == $metroIPPage ? 'active' : ''; ?>">
                                            <a href="?mod=ip&metroip_page=<?php echo $i; ?>&radippool_page=<?php echo $radippoolPage; ?>"><?php echo $i; ?></a>
                                        </li>
                                    <?php endfor; ?>
                                    
                                    <?php if ($metroIPPage < $totalMetroIPPages): ?>
                                        <li><a href="?mod=ip&metroip_page=<?php echo $metroIPPage + 1; ?>&radippool_page=<?php echo $radippoolPage; ?>">Next &raquo;</a></li>
                                    <?php endif; ?>
                                </ul>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Radippool Management Section -->
                <div class="box">
                    <div class="box-header">
                        <h3 class="box-title">
                            <i class="fa fa-database"></i>
                            IP Pool Records
                            <span class="badge badge-info"><?php echo $totalRadippools; ?> Total</span>
                        </h3>
                        <div class="search-input-wrapper">
                            <div class="search-icon">
                                <i class="fa fa-search"></i>
                            </div>
                            <input type="text" id="radippoolSearch" class="search-input" placeholder="Search IP Pools...">
                        </div>
                    </div>
                    
                    <div class="box-body">
                        <div class="table-responsive">
                            <table class="table table-striped" id="radippoolTable">
                                <thead>
                                    <tr>
                                        <th>Pool Name</th>
                                        <th>IP Address</th>
                                        <th>NAS IP</th>
                                        <th>User</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if (empty($radippools)): ?>
                                        <tr>
                                            <td colspan="6" class="text-center">
                                                <i class="fa fa-database"></i>
                                                <p>No IP Pool records found</p>
                                            </td>
                                        </tr>
                                    <?php else: ?>
                                        <?php foreach ($radippools as $pool): ?>
                                            <tr>
                                                <td>
                                                    <i class="fa fa-database"></i>
                                                    <strong><?php echo htmlspecialchars($pool['pool_name'] ?? ''); ?></strong>
                                                </td>
                                                <td>
                                                    <span class="badge badge-primary"><?php echo htmlspecialchars($pool['framedipaddress'] ?? ''); ?></span>
                                                </td>
                                                <td>
                                                    <i class="fa fa-server"></i>
                                                    <?php echo htmlspecialchars($pool['nasipaddress'] ?? ''); ?>
                                                </td>
                                                <td>
                                                    <?php if (!empty($pool['username'])): ?>
                                                        <i class="fa fa-user"></i>
                                                        <span><?php echo htmlspecialchars(($pool['user_name'] ?? '') . ' ' . ($pool['user_lastname'] ?? '')); ?></span>
                                                        <br><small><?php echo htmlspecialchars($pool['user_username'] ?? ''); ?></small>
                                                    <?php else: ?>
                                                        <span class="badge badge-warning">Available</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php if (!empty($pool['username'])): ?>
                                                        <span class="badge badge-success">Assigned</span>
                                                    <?php else: ?>
                                                        <span class="badge badge-warning">Available</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-danger" onclick="deleteRadippool(<?php echo $pool['id']; ?>)" title="Delete">
                                                        <i class="fa fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Radippool Pagination -->
                        <?php if ($totalRadippoolPages > 1): ?>
                            <div class="pagination-container">
                                <div class="pagination-info">
                                    Showing <?php echo (($radippoolPage - 1) * $perPage) + 1; ?> to <?php echo min($radippoolPage * $perPage, $totalRadippools); ?> of <?php echo $totalRadippools; ?> entries
                                </div>
                                <ul class="pagination">
                                    <?php if ($radippoolPage > 1): ?>
                                        <li><a href="?mod=ip&metroip_page=<?php echo $metroIPPage; ?>&radippool_page=<?php echo $radippoolPage - 1; ?>">&laquo; Previous</a></li>
                                    <?php endif; ?>
                                    
                                    <?php
                                    $startPage = max(1, $radippoolPage - 2);
                                    $endPage = min($totalRadippoolPages, $radippoolPage + 2);
                                    
                                    for ($i = $startPage; $i <= $endPage; $i++):
                                    ?>
                                        <li class="<?php echo $i == $radippoolPage ? 'active' : ''; ?>">
                                            <a href="?mod=ip&metroip_page=<?php echo $metroIPPage; ?>&radippool_page=<?php echo $i; ?>"><?php echo $i; ?></a>
                                        </li>
                                    <?php endfor; ?>
                                    
                                    <?php if ($radippoolPage < $totalRadippoolPages): ?>
                                        <li><a href="?mod=ip&metroip_page=<?php echo $metroIPPage; ?>&radippool_page=<?php echo $radippoolPage + 1; ?>">Next &raquo;</a></li>
                                    <?php endif; ?>
                                </ul>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- MetroIP Add Modal -->
<div class="modal fade" id="addMetroIPModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa fa-globe"></i> Add MetroIP</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <form action="/index.php?mod=addMetroIP" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label>IP Address</label>
                        <input type="text" name="ipaddress" class="form-control" required placeholder="192.168.1.1">
                    </div>
                    <div class="form-group">
                        <label>Port Type</label>
                        <input type="text" name="ports" class="form-control" required placeholder="Statik (1-65535)">
                    </div>
                    <div class="form-group">
                        <label>NAS</label>
                        <select name="nasname" class="form-control" required>
                            <option value="">Select NAS</option>
                            <?php foreach ($nasList as $nas): ?>
                                <option value="<?php echo htmlspecialchars($nas['nasname'] ?? ''); ?>">
                                    <?php echo htmlspecialchars($nas['shortname'] ?? ''); ?> (<?php echo htmlspecialchars($nas['nasname'] ?? ''); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>User (Optional)</label>
                        <input type="text" name="user" class="form-control" placeholder="Username">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-control" rows="3" placeholder="Description..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Radippool Add Modal -->
<div class="modal fade" id="addRadippoolModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa fa-database"></i> Add IP Pool</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <form action="/index.php?mod=addRadippool" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Pool Name</label>
                        <input type="text" name="pool_name" class="form-control" required placeholder="pool1">
                    </div>
                    <div class="form-group">
                        <label>IP Address</label>
                        <input type="text" name="framedipaddress" class="form-control" required placeholder="192.168.1.100">
                    </div>
                    <div class="form-group">
                        <label>NAS IP</label>
                        <select name="nasipaddress" class="form-control" required>
                            <option value="">Select NAS</option>
                            <?php foreach ($nasList as $nas): ?>
                                <option value="<?php echo htmlspecialchars($nas['nasname'] ?? ''); ?>">
                                    <?php echo htmlspecialchars($nas['shortname'] ?? ''); ?> (<?php echo htmlspecialchars($nas['nasname'] ?? ''); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>User (Optional)</label>
                        <input type="text" name="username" class="form-control" placeholder="Username">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Split IP Modal -->
<div class="modal fade" id="splitIPModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa fa-cut"></i> Split IP</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <form action="/index.php?mod=splitIP" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Public IP Address</label>
                        <input type="text" name="public_ip" class="form-control" required placeholder="203.0.113.1">
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Start Port</label>
                                <input type="number" name="start_port" class="form-control" value="1" min="1" max="65535">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>End Port</label>
                                <input type="number" name="end_port" class="form-control" value="65535" min="1" max="65535">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>NAS</label>
                        <select name="nasname" class="form-control" required>
                            <option value="">Select NAS</option>
                            <?php foreach ($nasList as $nas): ?>
                                <option value="<?php echo htmlspecialchars($nas['nasname'] ?? ''); ?>">
                                    <?php echo htmlspecialchars($nas['shortname'] ?? ''); ?> (<?php echo htmlspecialchars($nas['nasname'] ?? ''); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-control" rows="3" placeholder="IP splitting description..."></textarea>
                    </div>
                    <div class="alert alert-info">
                        <i class="fa fa-info-circle"></i>
                        <strong>Info:</strong> The selected port range will be divided into 100 parts and each part will be added as a separate MetroIP record. Use "Statik" for full port range (1-65535).
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Split IP</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
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

function openModal(modalId) {
    $('#' + modalId).modal('show');
}

// Search functionality
document.getElementById('metroIPSearch').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('#metroIPTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

document.getElementById('radippoolSearch').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('#radippoolTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Delete functions
function deleteMetroIP(id) {
    if (confirm('Are you sure you want to delete this MetroIP record?')) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/index.php?mod=deleteMetroIP';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'id';
        input.value = id;
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}

function deleteRadippool(id) {
    if (confirm('Are you sure you want to delete this IP Pool record?')) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/index.php?mod=deleteRadippool';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'id';
        input.value = id;
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}

function unassignIP(id) {
    if (confirm('Are you sure you want to unassign this IP from the user?')) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/index.php?mod=unassignMetroIP';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'id';
        input.value = id;
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}
</script> 