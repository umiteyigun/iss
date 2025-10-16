<?php 
$user = $viewData['user']; 
$invoices = $viewData['invoices'];
?>

<!-- Modern Invoices Page -->
<section class="content fade-in">
    <div class="row">
        <div class="col-xs-12">
            <!-- User Info Card -->
            <div class="box box-info">
                <div class="box-header">
                    <h3 class="box-title">
                        <i class="fa fa-file-text"></i> Invoice Management
                    </h3>
                    <div class="box-tools">
                        <a href="/index.php?mod=userlist" class="btn btn-default btn-sm">
                            <i class="fa fa-arrow-left"></i> Back to Users
                        </a>
                        <a href="index.php?mod=newInvoice&username=<?php echo htmlspecialchars($user['username']); ?>" class="btn btn-primary btn-sm">
                            <i class="fa fa-plus"></i> New Invoice
                        </a>
                    </div>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-md-3">
                            <strong>Customer:</strong>
                            <div class="text-primary"><?php echo htmlspecialchars($user['username']); ?></div>
                        </div>
                        <div class="col-md-3">
                            <strong>Name:</strong>
                            <div><?php echo htmlspecialchars(trim(($user['name'] ?? '') . ' ' . ($user['lastname'] ?? ''))); ?></div>
                        </div>
                        <div class="col-md-3">
                            <strong>Email:</strong>
                            <div><?php echo htmlspecialchars($user['email'] ?? 'N/A'); ?></div>
                        </div>
                        <div class="col-md-3">
                            <strong>Phone:</strong>
                            <div><?php echo htmlspecialchars($user['phone1'] ?? $user['phone2'] ?? $user['phone3'] ?? 'N/A'); ?></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Search and Filter Section -->
            <div class="card-style">
                <div class="row">
                    <div class="col-md-3">
                        <div class="search-box">
                            <i class="fa fa-search"></i>
                            <input type="text" class="form-control" id="invoiceSearch" placeholder="Search invoices...">
                        </div>
                    </div>
                    <div class="col-md-2">
                        <select class="form-control" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="0">Paid</option>
                            <option value="1">Unpaid</option>
                            <option value="2">Canceled</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-control" id="packetFilter">
                            <option value="">All Packets</option>
                            <?php
                            $packets = array_unique(array_column($invoices, 'packet'));
                            foreach ($packets as $packet):
                                if (!empty($packet)):
                            ?>
                                <option value="<?php echo htmlspecialchars($packet); ?>"><?php echo htmlspecialchars($packet); ?></option>
                            <?php 
                                endif;
                            endforeach; 
                            ?>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-control" id="paymentModeFilter">
                            <option value="">All Payment Modes</option>
                            <?php
                            $paymentModes = array_unique(array_column($invoices, 'peymode'));
                            foreach ($paymentModes as $mode):
                                if (!empty($mode)):
                            ?>
                                <option value="<?php echo htmlspecialchars($mode); ?>"><?php echo htmlspecialchars($mode); ?></option>
                            <?php 
                                endif;
                            endforeach; 
                            ?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <div class="btn-group">
                            <button type="button" class="btn btn-success" onclick="exportInvoices()">
                                <i class="fa fa-download"></i> Export
                            </button>
                            <button type="button" class="btn btn-info" onclick="printInvoices()">
                                <i class="fa fa-print"></i> Print
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Active Filters -->
                <div id="activeFilters" class="mt-3" style="display: none;">
                    <strong>Active Filters:</strong>
                    <div id="filterTags"></div>
                </div>
            </div>

            <!-- Success Messages -->
            <?php if (isset($_GET['status'])): ?>
                <div class="alert alert-success alert-dismissible fade in">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <i class="fa fa-check-circle"></i>
                    <?php
                    switch ($_GET['status']) {
                        case 'created':
                            echo 'Invoice created successfully!';
                            break;
                        case 'updated':
                            echo 'Invoice updated successfully!';
                            break;
                        case 'deleted':
                            echo 'Invoice deleted successfully!';
                            break;
                    }
                    ?>
                </div>
            <?php endif; ?>

            <!-- Invoices Table -->
            <div class="box box-primary">
                <div class="box-header">
                    <h3 class="box-title">
                        <i class="fa fa-list"></i> Invoice History
                    </h3>
                    <div class="box-tools">
                        <span class="badge bg-blue" id="invoiceCount"><?php echo count($invoices); ?> invoices</span>
                        <span class="badge bg-green" id="totalAmount"><?php echo number_format(array_sum(array_column($invoices, 'price')), 2); ?> TL</span>
                    </div>
                </div>
                
                <div class="box-body table-responsive">
                    <table class="table table-striped table-hover" id="invoicesTable">
                        <thead>
                            <tr>
                                <th><i class="fa fa-hashtag"></i> ID</th>
                                <th><i class="fa fa-cube"></i> Packet</th>
                                <th><i class="fa fa-money"></i> Price</th>
                                <th><i class="fa fa-calendar"></i> Payment Date</th>
                                <th><i class="fa fa-clock-o"></i> Expiration Date</th>
                                <th><i class="fa fa-credit-card"></i> Payment Mode</th>
                                <th><i class="fa fa-circle"></i> Status</th>
                                <th><i class="fa fa-comment"></i> Description</th>
                                <th><i class="fa fa-user"></i> Handled By</th>
                                <th><i class="fa fa-cogs"></i> Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($invoices)): ?>
                                <tr>
                                    <td colspan="10" class="text-center">
                                        <div class="alert alert-info">
                                            <i class="fa fa-info-circle"></i> No invoices found for this customer.
                                        </div>
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($invoices as $invoice): ?>
                                <tr class="invoice-row" 
                                    data-id="<?php echo $invoice['id']; ?>"
                                    data-status="<?php echo $invoice['tdurum'] ?? '1'; ?>"
                                    data-packet="<?php echo htmlspecialchars($invoice['packet']); ?>"
                                    data-payment-mode="<?php echo htmlspecialchars($invoice['peymode']); ?>"
                                    data-price="<?php echo $invoice['price']; ?>">
                                    <td>
                                        <span class="badge bg-gray">#<?php echo htmlspecialchars($invoice['id']); ?></span>
                                    </td>
                                    <td>
                                        <span class="badge bg-blue"><?php echo htmlspecialchars($invoice['packet']); ?></span>
                                    </td>
                                    <td>
                                        <strong class="text-success"><?php echo htmlspecialchars(number_format($invoice['price'], 2)); ?> TL</strong>
                                    </td>
                                    <td>
                                        <?php if (!empty($invoice['peydate'])): ?>
                                            <span class="text-muted">
                                                <i class="fa fa-calendar"></i> <?php echo date('Y-m-d H:i', strtotime($invoice['peydate'])); ?>
                                            </span>
                                        <?php else: ?>
                                            <span class="text-muted">Not paid</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if (!empty($invoice['expire'])): ?>
                                            <?php 
                                            $expireDate = strtotime($invoice['expire']);
                                            $isExpired = $expireDate < time();
                                            $daysLeft = ceil(($expireDate - time()) / (24 * 60 * 60));
                                            
                                            if ($isExpired): ?>
                                                <span class="label label-danger">
                                                    <i class="fa fa-exclamation-triangle"></i> Expired
                                                </span>
                                            <?php elseif ($daysLeft <= 7): ?>
                                                <span class="label label-warning">
                                                    <i class="fa fa-clock-o"></i> <?php echo $daysLeft; ?> days left
                                                </span>
                                            <?php else: ?>
                                                <span class="label label-success">
                                                    <i class="fa fa-check"></i> <?php echo date('Y-m-d', $expireDate); ?>
                                                </span>
                                            <?php endif; ?>
                                        <?php else: ?>
                                            <span class="text-muted">N/A</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <span class="badge bg-info"><?php echo htmlspecialchars($invoice['peymode']); ?></span>
                                    </td>
                                    <td>
                                        <?php 
                                        $status = 'Unknown';
                                        $labelClass = 'default';
                                        if (isset($invoice['tdurum'])) {
                                            switch ($invoice['tdurum']) {
                                                case 0:
                                                    $status = 'Paid';
                                                    $labelClass = 'success';
                                                    break;
                                                case 1:
                                                    $status = 'Unpaid';
                                                    $labelClass = 'danger';
                                                    break;
                                                case 2:
                                                    $status = 'Canceled';
                                                    $labelClass = 'warning';
                                                    break;
                                            }
                                        }
                                        ?>
                                        <span class="label label-<?php echo $labelClass; ?>">
                                            <i class="fa fa-circle"></i> <?php echo htmlspecialchars($status); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <?php if (!empty($invoice['aciklama'])): ?>
                                            <span class="text-muted" title="<?php echo htmlspecialchars($invoice['aciklama']); ?>">
                                                <?php echo htmlspecialchars(substr($invoice['aciklama'], 0, 30)) . (strlen($invoice['aciklama']) > 30 ? '...' : ''); ?>
                                            </span>
                                        <?php else: ?>
                                            <span class="text-muted">No description</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <span class="text-muted"><?php echo htmlspecialchars($invoice['tyapan']); ?></span>
                                    </td>
                                    <td>
                                        <div class="btn-group">
                                            <a href="index.php?mod=viewInvoice&id=<?php echo $invoice['id']; ?>" 
                                               class="btn btn-xs btn-info" title="View Invoice" data-toggle="tooltip">
                                                <i class="fa fa-eye"></i>
                                            </a>
                                            <a href="index.php?mod=editInvoice&id=<?php echo $invoice['id']; ?>" 
                                               class="btn btn-xs btn-primary" title="Edit Invoice" data-toggle="tooltip">
                                                <i class="fa fa-edit"></i>
                                            </a>
                                            <?php if (($invoice['tdurum'] ?? 1) == 1): ?>
                                                <a href="index.php?mod=markPaid&id=<?php echo $invoice['id']; ?>" 
                                                   class="btn btn-xs btn-success" title="Mark as Paid" data-toggle="tooltip">
                                                    <i class="fa fa-check"></i>
                                                </a>
                                            <?php endif; ?>
                                            <a href="index.php?mod=deleteInvoice&id=<?php echo $invoice['id']; ?>&username=<?php echo htmlspecialchars($user['username']); ?>" 
                                               onclick="return confirmDelete(<?php echo $invoice['id']; ?>)" 
                                               class="btn btn-xs btn-danger" title="Delete Invoice" data-toggle="tooltip">
                                                <i class="fa fa-trash"></i>
                                            </a>
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
</section>

<script>
$(document).ready(function() {
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Search functionality
    $('#invoiceSearch').on('keyup', function() {
        filterInvoices();
    });
    
    // Status filter
    $('#statusFilter').on('change', function() {
        filterInvoices();
    });
    
    // Packet filter
    $('#packetFilter').on('change', function() {
        filterInvoices();
    });
    
    // Payment mode filter
    $('#paymentModeFilter').on('change', function() {
        filterInvoices();
    });
    
    function filterInvoices() {
        var searchTerm = $('#invoiceSearch').val().toLowerCase();
        var statusFilter = $('#statusFilter').val();
        var packetFilter = $('#packetFilter').val();
        var paymentModeFilter = $('#paymentModeFilter').val();
        
        var totalAmount = 0;
        var visibleCount = 0;
        
        $('.invoice-row').each(function() {
            var $row = $(this);
            var id = $row.data('id').toString();
            var status = $row.data('status');
            var packet = $row.data('packet').toLowerCase();
            var paymentMode = $row.data('payment-mode').toLowerCase();
            var price = parseFloat($row.data('price'));
            
            var matchesSearch = id.includes(searchTerm) || packet.includes(searchTerm);
            var matchesStatus = !statusFilter || status === statusFilter;
            var matchesPacket = !packetFilter || packet === packetFilter.toLowerCase();
            var matchesPaymentMode = !paymentModeFilter || paymentMode === paymentModeFilter.toLowerCase();
            
            if (matchesSearch && matchesStatus && matchesPacket && matchesPaymentMode) {
                $row.show();
                totalAmount += price;
                visibleCount++;
            } else {
                $row.hide();
            }
        });
        
        updateInvoiceCount(visibleCount);
        updateTotalAmount(totalAmount);
        updateActiveFilters();
    }
    
    function updateInvoiceCount(count) {
        $('#invoiceCount').text(count + ' invoices');
    }
    
    function updateTotalAmount(amount) {
        $('#totalAmount').text(amount.toFixed(2) + ' TL');
    }
    
    function updateActiveFilters() {
        var filters = [];
        var searchTerm = $('#invoiceSearch').val();
        var statusFilter = $('#statusFilter').val();
        var packetFilter = $('#packetFilter').val();
        var paymentModeFilter = $('#paymentModeFilter').val();
        
        if (searchTerm) {
            filters.push('<span class="filter-tag">Search: "' + searchTerm + '" <i class="fa fa-times close" onclick="clearSearch()"></i></span>');
        }
        if (statusFilter) {
            var statusText = $('#statusFilter option:selected').text();
            filters.push('<span class="filter-tag">Status: ' + statusText + ' <i class="fa fa-times close" onclick="clearStatusFilter()"></i></span>');
        }
        if (packetFilter) {
            filters.push('<span class="filter-tag">Packet: ' + packetFilter + ' <i class="fa fa-times close" onclick="clearPacketFilter()"></i></span>');
        }
        if (paymentModeFilter) {
            filters.push('<span class="filter-tag">Payment Mode: ' + paymentModeFilter + ' <i class="fa fa-times close" onclick="clearPaymentModeFilter()"></i></span>');
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
        $('#invoiceSearch').val('');
        filterInvoices();
    };
    
    window.clearStatusFilter = function() {
        $('#statusFilter').val('');
        filterInvoices();
    };
    
    window.clearPacketFilter = function() {
        $('#packetFilter').val('');
        filterInvoices();
    };
    
    window.clearPaymentModeFilter = function() {
        $('#paymentModeFilter').val('');
        filterInvoices();
    };
    
    // Add hover effects
    $('.invoice-row').hover(
        function() {
            $(this).addClass('table-hover');
        },
        function() {
            $(this).removeClass('table-hover');
        }
    );
});

function confirmDelete(invoiceId) {
    return confirm('Are you sure you want to delete invoice #' + invoiceId + '? This action cannot be undone.');
}

function exportInvoices() {
    // Implement export functionality
    alert('Export functionality will be implemented here.');
}

function printInvoices() {
    // Implement print functionality
    window.print();
}

// Auto-refresh every 30 seconds to check for new invoices
setInterval(function() {
    // This could be replaced with AJAX call to refresh invoice data
    console.log('Auto-refresh invoices...');
}, 30000);
</script>

<style>
.badge {
    font-size: 11px;
    padding: 4px 8px;
}

.badge.bg-blue {
    background-color: #3498db;
    color: white;
}

.badge.bg-green {
    background-color: #28a745;
    color: white;
}

.badge.bg-gray {
    background-color: #95a5a6;
    color: white;
}

.badge.bg-info {
    background-color: #17a2b8;
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

.alert-dismissible {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Print styles */
@media print {
    .no-print {
        display: none !important;
    }
    
    .box {
        box-shadow: none;
        border: 1px solid #ddd;
    }
    
    .table {
        border-collapse: collapse;
    }
    
    .table th,
    .table td {
        border: 1px solid #ddd;
    }
    
    .btn-group {
        display: none !important;
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .btn-group .btn {
        margin-bottom: 2px;
    }
    
    .box-tools {
        margin-top: 10px;
    }
}
</style> 