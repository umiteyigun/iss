<!-- Modern Member List Page -->
<?php
// Ensure we have the required data
$members = $members ?? [];
$page = $page ?? 1;
$totalMembers = $totalMembers ?? 0;
$pageSize = $pageSize ?? 10;
?>

<section class="content fade-in">
    <div class="row">
        <div class="col-xs-12">
            <!-- Search and Filter Section -->
            <div class="card-style">
                <div class="row">
                    <div class="col-md-4">
                        <div class="search-box">
                            <i class="fa fa-search"></i>
                            <input type="text" class="form-control" id="memberSearch" placeholder="Search members...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-control" id="permissionFilter">
                            <option value="">All Permissions</option>
                            <?php
                            $permissions = array_unique(array_column($members, 'mode'));
                            foreach ($permissions as $permission):
                                if (!empty($permission)):
                            ?>
                                <option value="<?php echo htmlspecialchars($permission); ?>"><?php echo htmlspecialchars($permission); ?></option>
                            <?php 
                                endif;
                            endforeach; 
                            ?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-control" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <a href="/index.php?mod=newMember" class="btn btn-primary btn-block">
                            <i class="fa fa-plus"></i> New Member
                        </a>
                    </div>
                </div>
                
                <!-- Active Filters -->
                <div id="activeFilters" class="mt-3" style="display: none;">
                    <strong>Active Filters:</strong>
                    <div id="filterTags"></div>
                </div>
            </div>

            <!-- Members Table -->
            <div class="box box-primary">
                <div class="box-header">
                    <h3 class="box-title">
                        <i class="fa fa-user-secret"></i> Administrative Members
                    </h3>
                    <div class="box-tools">
                        <span class="badge bg-blue" id="memberCount"><?php echo count($members); ?> members</span>
                    </div>
                </div>
                
                <div class="box-body table-responsive">
                    <table class="table table-striped table-hover" id="membersTable">
                        <thead>
                            <tr>
                                <th><i class="fa fa-hashtag"></i> #</th>
                                <th><i class="fa fa-user"></i> Username</th>
                                <th><i class="fa fa-id-card"></i> Name</th>
                                <th><i class="fa fa-user"></i> Last Name</th>
                                <th><i class="fa fa-phone"></i> Phone</th>
                                <th><i class="fa fa-envelope"></i> Email</th>
                                <th><i class="fa fa-shield"></i> Permissions</th>
                                <th><i class="fa fa-clock-o"></i> Last Login</th>
                                <th><i class="fa fa-cogs"></i> Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($members)): ?>
                                <tr>
                                    <td colspan="9" class="text-center">
                                        <div class="alert alert-info">
                                            <i class="fa fa-info-circle"></i> No administrative members found.
                                        </div>
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php 
                                $count = ($page - 1) * $pageSize + 1;
                                foreach ($members as $member): 
                                ?>
                                <tr class="member-row" 
                                    data-username="<?php echo htmlspecialchars($member['username']); ?>"
                                    data-permission="<?php echo htmlspecialchars($member['mode']); ?>"
                                    data-email="<?php echo htmlspecialchars($member['email']); ?>">
                                    <td>
                                        <span class="badge bg-gray"><?php echo $count++; ?></span>
                                    </td>
                                    <td>
                                        <div class="member-info">
                                            <strong class="text-primary"><?php echo htmlspecialchars($member['username']); ?></strong>
                                            <?php if ($member['id'] == ($_SESSION['user_id'] ?? 0)): ?>
                                                <span class="label label-info">Current User</span>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="member-name">
                                            <?php echo htmlspecialchars($member['name']); ?>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="member-lastname">
                                            <?php echo htmlspecialchars($member['lastname']); ?>
                                        </div>
                                    </td>
                                    <td>
                                        <?php if (!empty($member['phone'])): ?>
                                            <a href="tel:<?php echo htmlspecialchars($member['phone']); ?>" class="text-success">
                                                <i class="fa fa-phone"></i> <?php echo htmlspecialchars($member['phone']); ?>
                                            </a>
                                        <?php else: ?>
                                            <span class="text-muted">N/A</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if (!empty($member['email'])): ?>
                                            <a href="mailto:<?php echo htmlspecialchars($member['email']); ?>" class="text-info">
                                                <i class="fa fa-envelope"></i> <?php echo htmlspecialchars($member['email']); ?>
                                            </a>
                                        <?php else: ?>
                                            <span class="text-muted">N/A</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php
                                        $permissionClass = 'default';
                                        switch (strtolower($member['mode'])) {
                                            case 'admin':
                                                $permissionClass = 'danger';
                                                break;
                                            case 'manager':
                                                $permissionClass = 'warning';
                                                break;
                                            case 'operator':
                                                $permissionClass = 'info';
                                                break;
                                            default:
                                                $permissionClass = 'default';
                                        }
                                        ?>
                                        <span class="label label-<?php echo $permissionClass; ?>">
                                            <i class="fa fa-shield"></i> <?php echo htmlspecialchars($member['mode']); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <?php if (!empty($member['last_login'])): ?>
                                            <span class="text-muted">
                                                <i class="fa fa-clock-o"></i> <?php echo date('Y-m-d H:i', strtotime($member['last_login'])); ?>
                                            </span>
                                        <?php else: ?>
                                            <span class="text-muted">Never</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <div class="btn-group">
                                            <a href="index.php?mod=editMember&id=<?php echo $member['id']; ?>" 
                                               class="btn btn-xs btn-primary" title="Edit Member" data-toggle="tooltip">
                                                <i class="fa fa-edit"></i>
                                            </a>
                                            <?php if ($member['id'] != ($_SESSION['user_id'] ?? 0)): ?>
                                                <a href="index.php?mod=resetPassword&id=<?php echo $member['id']; ?>" 
                                                   class="btn btn-xs btn-warning" title="Reset Password" data-toggle="tooltip">
                                                    <i class="fa fa-key"></i>
                                                </a>
                                                <a href="index.php?mod=deleteMember&id=<?php echo $member['id']; ?>" 
                                                   class="btn btn-xs btn-danger" title="Delete Member" data-toggle="tooltip"
                                                   onclick="return confirmDelete(<?php echo $member['id']; ?>, '<?php echo htmlspecialchars($member['username']); ?>')">
                                                    <i class="fa fa-trash"></i>
                                                </a>
                                            <?php else: ?>
                                                <span class="btn btn-xs btn-default disabled" title="Cannot delete current user">
                                                    <i class="fa fa-ban"></i>
                                                </span>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="box-footer clearfix">
                    <div class="pull-left">
                        <p class="text-muted">
                            Showing <?php echo (($page - 1) * $pageSize) + 1; ?> to 
                            <?php echo min($page * $pageSize, $totalMembers); ?> of 
                            <?php echo $totalMembers; ?> members
                        </p>
                    </div>
                    
                    <?php
                    $totalPages = ceil($totalMembers / $pageSize);
                    if ($totalPages > 1):
                    ?>
                    <ul class="pagination pagination-sm no-margin pull-right">
                        <?php if ($page > 1): ?>
                            <li>
                                <a href="?mod=memberlist&p=<?php echo $page - 1; ?>">
                                    <i class="fa fa-chevron-left"></i> Previous
                                </a>
                            </li>
                        <?php endif; ?>

                        <?php 
                        $startPage = max(1, $page - 2);
                        $endPage = min($totalPages, $page + 2);
                        
                        for ($i = $startPage; $i <= $endPage; $i++): ?>
                            <li class="<?php echo ($i == $page) ? 'active' : ''; ?>">
                                <a href="?mod=memberlist&p=<?php echo $i; ?>"><?php echo $i; ?></a>
                            </li>
                        <?php endfor; ?>
                        
                        <?php if ($page < $totalPages): ?>
                            <li>
                                <a href="?mod=memberlist&p=<?php echo $page + 1; ?>">
                                    Next <i class="fa fa-chevron-right"></i>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</section>

<script>
$(document).ready(function() {
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Search functionality
    $('#memberSearch').on('keyup', function() {
        var searchTerm = $(this).val().toLowerCase();
        filterMembers();
    });
    
    // Permission filter
    $('#permissionFilter').on('change', function() {
        filterMembers();
    });
    
    // Status filter
    $('#statusFilter').on('change', function() {
        filterMembers();
    });
    
    function filterMembers() {
        var searchTerm = $('#memberSearch').val().toLowerCase();
        var permissionFilter = $('#permissionFilter').val();
        var statusFilter = $('#statusFilter').val();
        
        $('.member-row').each(function() {
            var $row = $(this);
            var username = $row.data('username').toLowerCase();
            var permission = $row.data('permission').toLowerCase();
            var email = $row.data('email').toLowerCase();
            
            var matchesSearch = username.includes(searchTerm) || email.includes(searchTerm);
            var matchesPermission = !permissionFilter || permission === permissionFilter.toLowerCase();
            var matchesStatus = !statusFilter; // For now, all members are considered active
            
            if (matchesSearch && matchesPermission && matchesStatus) {
                $row.show();
            } else {
                $row.hide();
            }
        });
        
        updateMemberCount();
        updateActiveFilters();
    }
    
    function updateMemberCount() {
        var visibleCount = $('.member-row:visible').length;
        $('#memberCount').text(visibleCount + ' members');
    }
    
    function updateActiveFilters() {
        var filters = [];
        var searchTerm = $('#memberSearch').val();
        var permissionFilter = $('#permissionFilter').val();
        var statusFilter = $('#statusFilter').val();
        
        if (searchTerm) {
            filters.push('<span class="filter-tag">Search: "' + searchTerm + '" <i class="fa fa-times close" onclick="clearSearch()"></i></span>');
        }
        if (permissionFilter) {
            filters.push('<span class="filter-tag">Permission: ' + permissionFilter + ' <i class="fa fa-times close" onclick="clearPermissionFilter()"></i></span>');
        }
        if (statusFilter) {
            filters.push('<span class="filter-tag">Status: ' + statusFilter + ' <i class="fa fa-times close" onclick="clearStatusFilter()"></i></span>');
        }
        
        if (filters.length > 0) {
            $('#filterTags').html(filters.join(' '));
            $('#activeFilters').show();
        } else {
            $('#activeFilters').hide();
        }
    }
    
    // Clear filter functions
    window.clearSearch = function() {
        $('#memberSearch').val('');
        filterMembers();
    };
    
    window.clearPermissionFilter = function() {
        $('#permissionFilter').val('');
        filterMembers();
    };
    
    window.clearStatusFilter = function() {
        $('#statusFilter').val('');
        filterMembers();
    };
    
    // Add hover effects
    $('.member-row').hover(
        function() {
            $(this).addClass('table-hover');
        },
        function() {
            $(this).removeClass('table-hover');
        }
    );
});

function confirmDelete(memberId, username) {
    return confirm('Are you sure you want to delete member "' + username + '"? This action cannot be undone.');
}

// Bulk actions (for future implementation)
function bulkDelete() {
    var selectedIds = $('.member-checkbox:checked').map(function() {
        return $(this).val();
    }).get();
    
    if (selectedIds.length === 0) {
        alert('Please select at least one member to delete.');
        return;
    }
    
    if (confirm('Are you sure you want to delete ' + selectedIds.length + ' selected member(s)?')) {
        // Implement bulk delete functionality
        console.log('Bulk delete:', selectedIds);
    }
}
</script>

<style>
.member-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.member-name, .member-lastname {
    font-weight: 500;
}

.badge {
    font-size: 11px;
    padding: 4px 8px;
}

.badge.bg-blue {
    background-color: #3498db;
    color: white;
}

.badge.bg-gray {
    background-color: #95a5a6;
    color: white;
}

.mt-3 {
    margin-top: 15px;
}

.table-hover {
    background-color: #f8f9fa !important;
    transform: scale(1.01);
    transition: all 0.2s ease;
}

.btn-group .btn {
    margin-right: 2px;
}

.btn-group .btn:last-child {
    margin-right: 0;
}

.btn.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Permission level indicators */
.label-danger {
    background-color: #dc3545;
}

.label-warning {
    background-color: #ffc107;
    color: #212529;
}

.label-info {
    background-color: #17a2b8;
}

.label-default {
    background-color: #6c757d;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .btn-group .btn {
        margin-bottom: 2px;
    }
    
    .member-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }
}
</style> 