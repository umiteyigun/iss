<!-- Main content -->
<section class="content">
    <!-- Modern Dashboard Header -->
    <div class="dashboard-hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1 class="hero-title">
                    <span class="title-icon">👥</span>
                    Customer Management
                </h1>
                <p class="hero-subtitle">Manage your RADIUS customers and subscriptions</p>
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
                    <div class="card-text">Customer Analytics</div>
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
                    <div class="stat-icon users-icon">
                        <i class="fa fa-users"></i>
                    </div>
                    <div class="stat-badge total">Total</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo htmlspecialchars($viewData['totalUsers'] ?? 0); ?></div>
                        <div class="stat-label">Total Customers</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon online-icon">
                        <i class="fa fa-wifi"></i>
                    </div>
                    <div class="stat-badge online">Online</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo htmlspecialchars($viewData['onlineUsers'] ?? 0); ?></div>
                        <div class="stat-label">Online Users</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon warning-icon">
                        <i class="fa fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-badge warning">Expired</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo htmlspecialchars($viewData['expiredUsers'] ?? 0); ?></div>
                        <div class="stat-label">Expired Users</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card modern-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon alert-icon">
                        <i class="fa fa-clock-o"></i>
                    </div>
                    <div class="stat-badge alert">Soon</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo htmlspecialchars($viewData['expiringSoonUsers'] ?? 0); ?></div>
                        <div class="stat-label">Expiring Soon</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Customer Management Section -->
    <div class="user-management-section">
        <div class="section-header">
            <div class="header-content">
                <div class="header-title">
                    <i class="fa fa-list"></i>
                    <h3>Customer Management</h3>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="addCustomer()">
                        <i class="fa fa-plus"></i>
                        Add New Customer
                    </button>
                </div>
            </div>
        </div>
        
        <div class="management-container">
            <!-- Search Section -->
            <div class="search-section">
                <div class="search-container">
                    <form id="searchForm" class="search-form" method="GET">
                        <input type="hidden" name="mod" value="userlist">
                        <div class="search-input-group">
                            <div class="search-icon">
                                <i class="fa fa-search"></i>
                            </div>
                            <input type="text" 
                                   id="search" 
                                   name="search" 
                                   class="search-input" 
                                   placeholder="Search customers by name, username, email, phone..." 
                                   value="<?php echo htmlspecialchars($viewData['searchTerm'] ?? ''); ?>"
                                   autocomplete="off">
                            <button type="button" id="clearSearch" class="clear-search-btn" style="display: <?php echo !empty($viewData['searchTerm']) ? 'block' : 'none'; ?>;">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <?php if (!empty($viewData['searchTerm'])): ?>
                <div class="search-results-info">
                    <div class="results-badge">
                        <i class="fa fa-info-circle"></i>
                        <span><strong>"<?php echo htmlspecialchars($viewData['searchTerm']); ?>"</strong> için <strong><?php echo $viewData['searchResultsCount']; ?></strong> sonuç bulundu</span>
                    </div>
                </div>
            <?php endif; ?>
            
            <!-- Customer List Container -->
            <div class="user-list-container" id="user-list-container">
                <?php if (empty($viewData['users'])): ?>
                    <div class="empty-state">
                        <div class="empty-content">
                            <i class="fa fa-users"></i>
                            <h4>No customers found</h4>
                            <p>Start by adding a new customer.</p>
                            <button class="btn btn-primary" onclick="addCustomer()">
                                <i class="fa fa-plus"></i>
                                Add First Customer
                            </button>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="table-container">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th><i class="fa fa-user"></i> Username</th>
                                        <th><i class="fa fa-id-card"></i> Name</th>
                                        <th><i class="fa fa-cube"></i> Packet</th>
                                        <th><i class="fa fa-circle"></i> Status</th>
                                        <th><i class="fa fa-calendar"></i> Expires On</th>
                                        <th><i class="fa fa-cogs"></i> Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($viewData['users'] as $user): ?>
                                    <tr class="table-row">
                                        <td>
                                            <div class="name-cell">
                                                <div class="name-content">
                                                    <strong><?php echo htmlspecialchars($user['username'] ?? ''); ?></strong>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="name-cell">
                                                <div class="name-content">
                                                    <?php 
                                                    $fullName = trim(($user['name'] ?? '') . ' ' . ($user['lastname'] ?? ''));
                                                    echo htmlspecialchars($fullName ?: 'N/A'); 
                                                    ?>
                                                </div>
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
                                                <?php if (($user['is_online'] ?? 0) > 0): ?>
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
                                        <td>
                                            <div class="actions-cell">
                                                <div class="action-buttons">
                                                    <a href="index.php?mod=userdetails&username=<?php echo urlencode($user['username']); ?>" 
                                                       class="btn btn-info btn-sm" title="View Details">
                                                        <i class="fa fa-eye"></i>
                                                    </a>
                                                    <a href="index.php?mod=editUser&username=<?php echo urlencode($user['username']); ?>" 
                                                       class="btn btn-warning btn-sm" title="Edit">
                                                        <i class="fa fa-edit"></i>
                                                    </a>
                                                    <button onclick="deleteUser('<?php echo htmlspecialchars($user['username']); ?>')" 
                                                            class="btn btn-danger btn-sm" title="Delete">
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
            
            <!-- Pagination Section -->
            <?php if (!empty($viewData['users']) && $viewData['totalPages'] > 1): ?>
            <div class="pagination-section">
                <div class="pagination-container">
                    <div class="pagination-info">
                        <span class="pagination-text">
                            Showing <strong><?php echo (($viewData['page'] - 1) * $viewData['pageSize']) + 1; ?></strong> 
                            to <strong><?php echo min($viewData['page'] * $viewData['pageSize'], $viewData['totalUsers']); ?></strong> 
                            of <strong><?php echo $viewData['totalUsers']; ?></strong> customers
                        </span>
                    </div>
                    
                    <div class="pagination-controls">
                        <ul class="pagination">
                            <!-- First Page -->
                            <?php if ($viewData['page'] > 1): ?>
                            <li class="pagination-item">
                                <a href="index.php?mod=userlist&p=1<?php echo !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : ''; ?>" 
                                   class="pagination-link" title="First Page">
                                    <i class="fa fa-angle-double-left"></i>
                                </a>
                            </li>
                            <?php endif; ?>
                            
                            <!-- Previous Page -->
                            <?php if ($viewData['page'] > 1): ?>
                            <li class="pagination-item">
                                <a href="index.php?mod=userlist&p=<?php echo $viewData['page'] - 1; ?><?php echo !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : ''; ?>" 
                                   class="pagination-link" title="Previous Page">
                                    <i class="fa fa-angle-left"></i>
                                </a>
                            </li>
                            <?php endif; ?>
                            
                            <!-- Page Numbers -->
                            <?php
                            $startPage = max(1, $viewData['page'] - 2);
                            $endPage = min($viewData['totalPages'], $viewData['page'] + 2);
                            
                            // Show first page if not in range
                            if ($startPage > 1): ?>
                            <li class="pagination-item">
                                <a href="index.php?mod=userlist&p=1<?php echo !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : ''; ?>" 
                                   class="pagination-link">1</a>
                            </li>
                            <?php if ($startPage > 2): ?>
                            <li class="pagination-item pagination-ellipsis">
                                <span class="pagination-ellipsis-text">...</span>
                            </li>
                            <?php endif; ?>
                            <?php endif; ?>
                            
                            <!-- Page numbers in range -->
                            <?php for ($i = $startPage; $i <= $endPage; $i++): ?>
                            <li class="pagination-item <?php echo ($i == $viewData['page']) ? 'active' : ''; ?>">
                                <a href="index.php?mod=userlist&p=<?php echo $i; ?><?php echo !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : ''; ?>" 
                                   class="pagination-link"><?php echo $i; ?></a>
                            </li>
                            <?php endfor; ?>
                            
                            <!-- Show last page if not in range -->
                            <?php if ($endPage < $viewData['totalPages']): ?>
                            <?php if ($endPage < $viewData['totalPages'] - 1): ?>
                            <li class="pagination-item pagination-ellipsis">
                                <span class="pagination-ellipsis-text">...</span>
                            </li>
                            <?php endif; ?>
                            <li class="pagination-item">
                                <a href="index.php?mod=userlist&p=<?php echo $viewData['totalPages']; ?><?php echo !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : ''; ?>" 
                                   class="pagination-link"><?php echo $viewData['totalPages']; ?></a>
                            </li>
                            <?php endif; ?>
                            
                            <!-- Next Page -->
                            <?php if ($viewData['page'] < $viewData['totalPages']): ?>
                            <li class="pagination-item">
                                <a href="index.php?mod=userlist&p=<?php echo $viewData['page'] + 1; ?><?php echo !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : ''; ?>" 
                                   class="pagination-link" title="Next Page">
                                    <i class="fa fa-angle-right"></i>
                                </a>
                            </li>
                            <?php endif; ?>
                            
                            <!-- Last Page -->
                            <?php if ($viewData['page'] < $viewData['totalPages']): ?>
                            <li class="pagination-item">
                                <a href="index.php?mod=userlist&p=<?php echo $viewData['totalPages']; ?><?php echo !empty($viewData['searchTerm']) ? '&search=' . urlencode($viewData['searchTerm']) : ''; ?>" 
                                   class="pagination-link" title="Last Page">
                                    <i class="fa fa-angle-double-right"></i>
                                </a>
                            </li>
                            <?php endif; ?>
                        </ul>
                    </div>
                    
                    <!-- Page Size Selector -->
                    <div class="page-size-selector">
                        <label for="pageSize" class="page-size-label">Show:</label>
                        <select id="pageSize" class="page-size-select" onchange="changePageSize(this.value)">
                            <option value="10" <?php echo ($viewData['pageSize'] == 10) ? 'selected' : ''; ?>>10</option>
                            <option value="15" <?php echo ($viewData['pageSize'] == 15) ? 'selected' : ''; ?>>15</option>
                            <option value="25" <?php echo ($viewData['pageSize'] == 25) ? 'selected' : ''; ?>>25</option>
                            <option value="50" <?php echo ($viewData['pageSize'] == 50) ? 'selected' : ''; ?>>50</option>
                            <option value="100" <?php echo ($viewData['pageSize'] == 100) ? 'selected' : ''; ?>>100</option>
                        </select>
                        <span class="page-size-text">per page</span>
                    </div>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </div>
</section>

<script>
// Modern Customer Management JavaScript
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
    const userListContainer = document.getElementById('user-list-container');
    const searchForm = document.getElementById('searchForm');
    
    // Real-time search with debouncing
    let searchTimeout;
    let isSearching = false;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        // Show/hide clear button
        if (searchTerm) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Set new timeout for search
        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
        }, 300); // 300ms delay for better performance
    });
    
    // Perform AJAX search
    function performSearch(searchTerm) {
        if (isSearching) return; // Prevent multiple simultaneous requests
        
        isSearching = true;
        
        // Add loading state to search input
        const searchInputGroup = searchInput.closest('.search-input-group');
        if (searchInputGroup) {
            searchInputGroup.classList.add('searching');
        }
        
        // Show loading state
        if (userListContainer) {
            userListContainer.classList.add('loading');
            userListContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner">
                        <i class="fa fa-spinner fa-spin"></i>
                    </div>
                    <p class="loading-text">Searching customers...</p>
                </div>
            `;
        }
        
        // Build search URL
        const searchUrl = new URL(window.location);
        searchUrl.searchParams.set('mod', 'userlist');
        searchUrl.searchParams.set('search', searchTerm);
        searchUrl.searchParams.delete('p'); // Reset to first page for search results
        
        // Perform AJAX request
        fetch(searchUrl.toString())
            .then(response => response.text())
            .then(html => {
                // Create temporary div to parse HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Extract the user list container content
                const newUserListContainer = tempDiv.querySelector('#user-list-container');
                const newPaginationSection = tempDiv.querySelector('.pagination-section');
                
                // Update user list
                if (userListContainer && newUserListContainer) {
                    userListContainer.innerHTML = newUserListContainer.innerHTML;
                    userListContainer.classList.remove('loading');
                }
                
                // Check if no results
                const noResultsContainer = tempDiv.querySelector('.no-results-container');
                if (noResultsContainer && searchTerm) {
                    if (userListContainer) {
                        userListContainer.innerHTML = `
                            <div class="no-results-container">
                                <i class="fa fa-search"></i>
                                <h3>No customers found</h3>
                                <p>No customers match your search for "<strong>${searchTerm}</strong>"</p>
                                <div class="suggestions">
                                    <h4>Search suggestions:</h4>
                                    <ul>
                                        <li>Check your spelling</li>
                                        <li>Try different keywords</li>
                                        <li>Use fewer words</li>
                                        <li>Search by username, name, email, or phone</li>
                                    </ul>
                                </div>
                            </div>
                        `;
                    }
                }
                
                // Update pagination
                const currentPaginationSection = document.querySelector('.pagination-section');
                if (currentPaginationSection) {
                    if (newPaginationSection) {
                        currentPaginationSection.innerHTML = newPaginationSection.innerHTML;
                        currentPaginationSection.style.display = 'block';
                    } else {
                        currentPaginationSection.style.display = 'none';
                    }
                } else if (newPaginationSection) {
                    // Add pagination if it doesn't exist
                    const container = document.querySelector('.content-wrapper');
                    if (container) {
                        container.appendChild(newPaginationSection);
                    }
                }
                
                // Update URL without page reload
                window.history.pushState({}, '', searchUrl.toString());
                
                // Remove loading state
                if (searchInputGroup) {
                    searchInputGroup.classList.remove('searching');
                }
                
                isSearching = false;
            })
            .catch(error => {
                console.error('Search error:', error);
                if (userListContainer) {
                    userListContainer.innerHTML = `
                        <div class="error-container">
                            <i class="fa fa-exclamation-triangle"></i>
                            <p>Search failed. Please try again.</p>
                        </div>
                    `;
                    userListContainer.classList.remove('loading');
                }
                
                // Remove loading state
                if (searchInputGroup) {
                    searchInputGroup.classList.remove('searching');
                }
                
                isSearching = false;
            });
    }
    
    // Clear search
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        performSearch('');
    });
    
    // Prevent form submission
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch(searchInput.value.trim());
    });
    
    // Add customer function
    window.addCustomer = function() {
        window.location.href = '/index.php?mod=newUser';
    };
    
    // Delete user function
    window.deleteUser = function(username) {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            $.post('/index.php?mod=deleteUser&username=' + encodeURIComponent(username), function(response) {
                try {
                    const result = JSON.parse(response);
                    if (result.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (e) {
                    alert('Invalid response from server');
                }
            });
        }
    };
    
})();
</script> 