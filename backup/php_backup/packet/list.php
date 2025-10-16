<!-- Main content -->
<section class="content">
    <!-- Modern Dashboard Header -->
    <div class="dashboard-hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1 class="hero-title">
                    <span class="title-icon">📦</span>
                    Packet Management
                </h1>
                <p class="hero-subtitle">Network Package Configuration & Analytics</p>
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
                    <div class="card-icon">📊</div>
                    <div class="card-text">Package Analytics</div>
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
                        <i class="fa fa-cube"></i>
                    </div>
                    <div class="stat-badge live">Total</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo htmlspecialchars($viewData['stats']['total'] ?? 0); ?></div>
                        <div class="stat-label">Total Packages</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon users-icon">
                        <i class="fa fa-tags"></i>
                    </div>
                    <div class="stat-badge success">Types</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo count($viewData['stats']['by_type'] ?? []); ?></div>
                        <div class="stat-label">Package Types</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon warning-icon">
                        <i class="fa fa-dollar"></i>
                    </div>
                    <div class="stat-badge warning">Avg</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number">$<?php echo number_format($viewData['stats']['avg_price'] ?? 0, 2); ?></div>
                        <div class="stat-label">Average Price</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon total-icon">
                        <i class="fa fa-database"></i>
                    </div>
                    <div class="stat-badge info">Data</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo isset($viewData['stats']['by_type']) ? array_sum(array_column($viewData['stats']['by_type'], 'count')) : 0; ?></div>
                        <div class="stat-label">Data Packages</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Packet Management Section -->
    <div class="user-management-section">
        <div class="section-header">
            <div class="header-content">
                <div class="header-title">
                    <i class="fa fa-list"></i>
                    <h3>Package Management</h3>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="showAddPacketModal()">
                        <i class="fa fa-plus"></i>
                        Add New Package
                    </button>
                </div>
            </div>
        </div>
        
        <div class="management-container">
            <!-- Search Form -->
            <div class="search-form-container">
                <form method="GET" action="index.php?mod=packet" class="modern-search-form" id="searchForm">
                    <div class="search-input-wrapper">
                        <div class="search-icon">
                            <i class="fa fa-search"></i>
                        </div>
                        <input type="text" 
                               class="search-input" 
                               id="search" 
                               name="search" 
                               placeholder="Search by package name, type, or description..." 
                               value="<?php echo htmlspecialchars($viewData['searchTerm'] ?? ''); ?>"
                               autocomplete="off">
                        <button type="button" class="search-clear-btn" id="clearSearch" style="display: none;">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                    <?php if (!empty($viewData['searchTerm'])): ?>
                        <a href="index.php?mod=packet" class="clear-search-btn">
                            <i class="fa fa-times"></i>
                            Clear Search
                        </a>
                    <?php endif; ?>
                </form>
            </div>

            <?php if (!empty($viewData['searchTerm'])): ?>
                <div class="search-results-info">
                    <div class="results-badge">
                        <i class="fa fa-info-circle"></i>
                        <span><strong>"<?php echo htmlspecialchars($viewData['searchTerm']); ?>"</strong> için <strong><?php echo $viewData['searchResultsCount']; ?></strong> sonuç bulundu</span>
                    </div>
                </div>
            <?php endif; ?>
            
            <!-- Package List Container -->
            <div class="user-list-container" id="package-list-container">
                <?php if (empty($viewData['packets'])): ?>
                    <div class="empty-state">
                        <div class="empty-content">
                            <i class="fa fa-inbox"></i>
                            <h4>No packages found</h4>
                            <p>Start by adding a new package.</p>
                            <button class="btn btn-primary" onclick="showAddPacketModal()">
                                <i class="fa fa-plus"></i>
                                Add First Package
                            </button>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="table-container">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th><i class="fa fa-cube"></i> Name</th>
                                        <th><i class="fa fa-tag"></i> Type</th>
                                        <th><i class="fa fa-tachometer"></i> Speed</th>
                                        <th><i class="fa fa-dollar"></i> Price</th>
                                        <th><i class="fa fa-info-circle"></i> Description</th>
                                        <th><i class="fa fa-calendar"></i> Created</th>
                                        <th><i class="fa fa-cogs"></i> Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($viewData['packets'] as $packet): ?>
                                    <tr class="table-row">
                                        <td>
                                            <div class="name-cell">
                                                <div class="name-content">
                                                    <strong><?php echo htmlspecialchars($packet['packet_name'] ?? ''); ?></strong>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="type-cell">
                                                <?php 
                                                $type = strtolower($packet['packet_type'] ?? '');
                                                $typeConfig = [
                                                    'data' => ['icon' => 'fa-database', 'color' => 'type-data', 'label' => 'Data'],
                                                    'voice' => ['icon' => 'fa-phone', 'color' => 'type-voice', 'label' => 'Voice'],
                                                    'video' => ['icon' => 'fa-video-camera', 'color' => 'type-video', 'label' => 'Video'],
                                                    'management' => ['icon' => 'fa-cogs', 'color' => 'type-management', 'label' => 'Management'],
                                                    'control' => ['icon' => 'fa-sliders', 'color' => 'type-control', 'label' => 'Control'],
                                                    'other' => ['icon' => 'fa-cube', 'color' => 'type-other', 'label' => 'Other']
                                                ];
                                                
                                                $config = $typeConfig[$type] ?? $typeConfig['other'];
                                                $displayName = $typeConfig[$type]['label'] ?? ucfirst($packet['packet_type'] ?? 'Unknown');
                                                ?>
                                                <div class="modern-type-badge <?php echo $config['color']; ?>">
                                                    <i class="fa <?php echo $config['icon']; ?>"></i>
                                                    <span class="type-text"><?php echo htmlspecialchars($displayName); ?></span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="speed-cell">
                                                <?php if ($packet['download'] && $packet['upload']): ?>
                                                    <div class="speed-info">
                                                        <span class="download-speed">
                                                            <i class="fa fa-download"></i> <?php echo htmlspecialchars($packet['download'] ?? ''); ?>
                                                        </span>
                                                        <span class="upload-speed">
                                                            <i class="fa fa-upload"></i> <?php echo htmlspecialchars($packet['upload'] ?? ''); ?>
                                                        </span>
                                                    </div>
                                                <?php elseif ($packet['traffic']): ?>
                                                    <span class="size-info">
                                                        <i class="fa fa-arrows-h"></i> <?php echo htmlspecialchars($packet['traffic']); ?> GB
                                                    </span>
                                                <?php else: ?>
                                                    <span class="no-data">-</span>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="price-cell">
                                                <?php if ($packet['packet_price']): ?>
                                                    <span class="price-value">$<?php echo number_format($packet['packet_price'], 2); ?></span>
                                                <?php else: ?>
                                                    <span class="no-data">-</span>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="description-cell">
                                                <?php if ($packet['description']): ?>
                                                    <span class="description-text" title="<?php echo htmlspecialchars($packet['description'] ?? ''); ?>">
                                                        <?php echo htmlspecialchars($packet['description'] ?? ''); ?>
                                                    </span>
                                                <?php else: ?>
                                                    <span class="no-data">-</span>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="date-cell">
                                                <span class="date-text">
                                                    <?php echo date('M j, Y', strtotime($packet['created_at'] ?? 'now')); ?>
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="actions-cell">
                                                <div class="action-buttons">
                                                    <button class="btn btn-info btn-sm" onclick="editPacket(<?php echo $packet['id'] ?? 0; ?>)" title="Edit Package">
                                                        <i class="fa fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick="deletePacket(<?php echo $packet['id'] ?? 0; ?>)" title="Delete Package">
                                                        <i class="fa fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                <?php endif; ?>
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
    
    // Search functionality
    const searchInput = document.getElementById('search');
    const clearSearchBtn = document.getElementById('clearSearch');
    const packageListContainer = document.getElementById('package-list-container');
    const searchForm = document.getElementById('searchForm');
    
    // Real-time search functionality
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchValue = this.value.trim();
            
            // Show/hide clear button
            if (searchValue.length > 0) {
                clearSearchBtn.style.display = 'block';
            } else {
                clearSearchBtn.style.display = 'none';
            }
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Set new timeout for search (300ms delay)
            searchTimeout = setTimeout(function() {
                if (searchValue.length > 0) {
                    // Perform search
                    window.location.href = 'index.php?mod=packet&search=' + encodeURIComponent(searchValue);
                } else {
                    // Clear search - go back to main page
                    window.location.href = 'index.php?mod=packet';
                }
            }, 300);
        });
        
        // Clear search
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            // Redirect to main page without search
            window.location.href = 'index.php?mod=packet';
        });
    }
    
    // Prevent form submission (we use real-time search instead)
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
    });
    
    // Add hover effects to table rows
    const tableRows = document.querySelectorAll('.table-row');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.01)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
})();
</script> 