<!-- Modern Edit User Form -->
<?php 
$user = $viewData['user']; 
$packets = $viewData['packets'] ?? [];
$nasList = $viewData['nasList'] ?? [];
$accessPoints = $viewData['accessPoints'] ?? [];
$ipPools = $viewData['ipPools'] ?? [];
$selectedNas = $viewData['selectedNas'] ?? '';
?>

<section class="content fade-in">
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header">
                    <h3 class="box-title">
                        <i class="fa fa-user-edit"></i> Edit Customer Information
                    </h3>
                    <div class="box-tools">
                        <a href="/index.php?mod=userlist" class="btn btn-default btn-sm">
                            <i class="fa fa-arrow-left"></i> Back to Users
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <form method="POST" action="index.php?mod=doUpdateUser" class="form-horizontal" id="editUserForm">
        <input type="hidden" name="username" value="<?php echo htmlspecialchars($user['username']); ?>">

        <div class="row">
            <!-- Personal Information -->
            <div class="col-md-6">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">
                            <i class="fa fa-id-card"></i> Personal Information
                        </h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-user"></i> Username
                            </label>
                            <div class="col-sm-9">
                                <input type="text" name="txtUsername" class="form-control" 
                                       value="<?php echo htmlspecialchars($user['username']); ?>" disabled>
                                <span class="help-block">Username cannot be changed</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-lock"></i> Password
                            </label>
                            <div class="col-sm-9">
                                <div class="input-group">
                                    <input type="text" name="txtPassword" class="form-control" 
                                           placeholder="Leave empty to keep current password" id="password">
                                    <span class="input-group-btn">
                                        <button type="button" class="btn btn-default" id="generatePassword">
                                            <i class="fa fa-magic"></i> Generate
                                        </button>
                                    </span>
                                </div>
                                <span class="help-block">Leave empty to keep the current password</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-user"></i> First Name
                            </label>
                            <div class="col-sm-9">
                                <input type="text" name="txtName" class="form-control" 
                                       value="<?php echo htmlspecialchars($user['name'] ?? ''); ?>" 
                                       placeholder="Enter first name">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-user"></i> Last Name
                            </label>
                            <div class="col-sm-9">
                                <input type="text" name="txtLastname" class="form-control" 
                                       value="<?php echo htmlspecialchars($user['lastname'] ?? ''); ?>" 
                                       placeholder="Enter last name">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-envelope"></i> Email
                            </label>
                            <div class="col-sm-9">
                                <input type="email" name="txtEmail" class="form-control" 
                                       value="<?php echo htmlspecialchars($user['email'] ?? ''); ?>" 
                                       placeholder="Enter email address">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-map-marker"></i> Address
                            </label>
                            <div class="col-sm-9">
                                <textarea name="txtAddress" class="form-control" rows="3" 
                                          placeholder="Enter address"><?php echo htmlspecialchars($user['address'] ?? ''); ?></textarea>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-phone"></i> Phone
                            </label>
                            <div class="col-sm-9">
                                <input type="tel" name="txtPhone1" class="form-control" 
                                       value="<?php echo htmlspecialchars($user['phone1'] ?? ''); ?>" 
                                       placeholder="Enter phone number">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Service Details -->
            <div class="col-md-6">
                <div class="box box-info">
                    <div class="box-header with-border">
                        <h3 class="box-title">
                            <i class="fa fa-cogs"></i> Service Details
                        </h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-calendar"></i> Expire Date <span class="text-danger">*</span>
                            </label>
                            <div class="col-sm-9">
                                <div class="input-group">
                                    <input type="text" name="txtExpire" id="datetimepicker" class="form-control" 
                                           value="<?php echo htmlspecialchars(date('Y-m-d H:i', strtotime($user['expire'] ?? ''))); ?>" 
                                           required placeholder="Select expiration date">
                                    <span class="input-group-addon">
                                        <i class="fa fa-calendar"></i>
                                    </span>
                                </div>
                                <span class="help-block">Select when the service expires</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-cube"></i> Packet <span class="text-danger">*</span>
                            </label>
                            <div class="col-sm-9">
                                <select name="drpPacket" class="form-control" required id="packetSelect">
                                    <option value="">Select a packet</option>
                                    <?php foreach ($packets as $packet): ?>
                                        <option value="<?php echo htmlspecialchars($packet['name']); ?>" 
                                                data-price="<?php echo htmlspecialchars($packet['price']); ?>"
                                                <?php echo ($user['packet'] == $packet['name']) ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($packet['name']); ?> 
                                            (<?php echo htmlspecialchars($packet['price']); ?> TL)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-server"></i> Router/NAS <span class="text-danger">*</span>
                            </label>
                            <div class="col-sm-9">
                                <select name="drpNas" class="form-control" required onchange="handleNasChange(this.value)" id="nasSelect">
                                    <option value="">Select a router</option>
                                    <?php foreach ($nasList as $nas): ?>
                                        <option value="<?php echo htmlspecialchars($nas['shortname']); ?>" 
                                                <?php echo ($selectedNas == $nas['shortname']) ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($nas['shortname']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-wifi"></i> Access Point
                            </label>
                            <div class="col-sm-9">
                                <select name="drpAP" class="form-control" id="apSelect" <?php echo empty($selectedNas) ? 'disabled' : ''; ?>>
                                    <option value="">Select access point</option>
                                    <?php foreach ($accessPoints as $ap): ?>
                                        <option value="<?php echo htmlspecialchars($ap['name']); ?>" 
                                                <?php echo ($user['accesspoint'] == $ap['name']) ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($ap['name']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">
                                <i class="fa fa-network-wired"></i> IP Pool
                            </label>
                            <div class="col-sm-9">
                                <select name="drpIPpool" class="form-control" id="poolSelect" <?php echo empty($selectedNas) ? 'disabled' : ''; ?>>
                                    <option value="">Select IP pool</option>
                                    <?php foreach ($ipPools as $pool): ?>
                                        <option value="<?php echo htmlspecialchars($pool['pool_name']); ?>" 
                                                <?php echo (isset($user['pool_name']) && $user['pool_name'] == $pool['pool_name']) ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($pool['pool_name']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Summary Card -->
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title">
                            <i class="fa fa-info-circle"></i> Current Status
                        </h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-sm-6">
                                <strong>Current Packet:</strong>
                                <div id="summaryPacket" class="text-muted"><?php echo htmlspecialchars($user['packet'] ?? 'N/A'); ?></div>
                            </div>
                            <div class="col-sm-6">
                                <strong>Current Router:</strong>
                                <div id="summaryRouter" class="text-muted"><?php echo htmlspecialchars($selectedNas ?: 'N/A'); ?></div>
                            </div>
                        </div>
                        <div class="row" style="margin-top: 10px;">
                            <div class="col-sm-6">
                                <strong>Expires:</strong>
                                <div id="summaryExpire" class="text-muted">
                                    <?php 
                                    if (!empty($user['expire'])): 
                                        $expireDate = strtotime($user['expire']);
                                        $isExpired = $expireDate < time();
                                        $daysLeft = ceil(($expireDate - time()) / (24 * 60 * 60));
                                        
                                        if ($isExpired): ?>
                                            <span class="text-danger">Expired</span>
                                        <?php elseif ($daysLeft <= 7): ?>
                                            <span class="text-warning"><?php echo $daysLeft; ?> days left</span>
                                        <?php else: ?>
                                            <span class="text-success"><?php echo date('Y-m-d', $expireDate); ?></span>
                                        <?php endif;
                                    else: 
                                        echo 'N/A';
                                    endif; 
                                    ?>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <strong>Status:</strong>
                                <div id="summaryStatus" class="text-muted">
                                    <?php if (($user['is_online'] ?? 0) > 0): ?>
                                        <span class="text-success"><i class="fa fa-circle"></i> Online</span>
                                    <?php else: ?>
                                        <span class="text-danger"><i class="fa fa-circle"></i> Offline</span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="row">
            <div class="col-md-12">
                <div class="box box-default">
                    <div class="box-footer">
                        <div class="pull-left">
                            <button type="button" class="btn btn-default" onclick="resetForm()">
                                <i class="fa fa-refresh"></i> Reset Changes
                            </button>
                            <a href="index.php?mod=userRenew&username=<?php echo htmlspecialchars($user['username']); ?>" 
                               class="btn btn-warning">
                                <i class="fa fa-refresh"></i> Renew Subscription
                            </a>
                        </div>
                        <div class="pull-right">
                            <a href="/index.php?mod=userlist" class="btn btn-default">
                                <i class="fa fa-times"></i> Cancel
                            </a>
                            <button type="submit" class="btn btn-primary" id="submitBtn">
                                <i class="fa fa-save"></i> Update Customer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</section>

<!-- Include datetimepicker CSS and JS -->
<link rel="stylesheet" type="text/css" href="/public/online/css/jquery.datetimepicker.css"/>
<script src="/public/scripts/jquery.datetimepicker.full.js"></script>

<script>
$(document).ready(function() {
    // Initialize datetimepicker
    $('#datetimepicker').datetimepicker({
        format: 'Y-m-d H:i',
        minDate: 0,
        step: 15,
        validateOnBlur: true,
        onShow: function(ct) {
            this.setOptions({
                minDate: 0
            });
        }
    });
    
    // Generate password functionality
    $('#generatePassword').on('click', function() {
        var password = generateRandomPassword();
        $('#password').val(password);
        showNotification('Password generated: ' + password, 'success');
    });
    
    // Packet selection change
    $('#packetSelect').on('change', function() {
        updateSummary();
    });
    
    // NAS selection change
    $('#nasSelect').on('change', function() {
        updateSummary();
    });
    
    // Expire date change
    $('#datetimepicker').on('change', function() {
        updateSummary();
    });
    
    // Form validation
    $('#editUserForm').on('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }
        
        // Show loading state
        $('#submitBtn').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Updating...');
    });
    
    // Initialize summary
    updateSummary();
});

function handleNasChange(nasValue) {
    if (nasValue) {
        // Enable dependent dropdowns
        $('#apSelect, #poolSelect').prop('disabled', false);
        
        // You could load APs and IP pools via AJAX here
        // For now, we'll just enable the existing options
        
        updateSummary();
    } else {
        // Disable dependent dropdowns
        $('#apSelect, #poolSelect').prop('disabled', true);
        updateSummary();
    }
}

function generateRandomPassword() {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var password = '';
    for (var i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function updateSummary() {
    var packet = $('#packetSelect option:selected').text();
    var router = $('#nasSelect option:selected').text();
    var expire = $('#datetimepicker').val();
    
    $('#summaryPacket').text(packet || 'N/A');
    $('#summaryRouter').text(router || 'N/A');
    $('#summaryExpire').text(expire || 'Not set');
}

function validateForm() {
    var isValid = true;
    
    // Clear previous errors
    $('.form-group').removeClass('has-error');
    $('.help-block').hide();
    
    // Expire date validation
    if (!$('#datetimepicker').val()) {
        $('#datetimepicker').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    // Packet validation
    if (!$('#packetSelect').val()) {
        $('#packetSelect').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    // NAS validation
    if (!$('#nasSelect').val()) {
        $('#nasSelect').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification('Please fill in all required fields', 'error');
    }
    
    return isValid;
}

function resetForm() {
    if (confirm('Are you sure you want to reset all changes? All modifications will be lost.')) {
        // Reload the page to reset all form fields
        window.location.reload();
    }
}

function showNotification(message, type) {
    var alertClass = 'alert-' + type;
    var icon = '';
    
    switch(type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-exclamation-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        case 'info': icon = 'fa-info-circle'; break;
    }
    
    var alertHtml = '<div class="alert ' + alertClass + ' alert-dismissible fade in" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span></button>' +
        '<i class="fa ' + icon + '"></i> ' + message +
        '</div>';
    
    $('body').append(alertHtml);
    
    // Auto remove after 5 seconds
    setTimeout(function() {
        $('.alert-dismissible').fadeOut();
    }, 5000);
}
</script>

<style>
.form-group label {
    font-weight: 600;
    color: #495057;
}

.form-group label i {
    margin-right: 5px;
    color: #3498db;
}

.text-danger {
    color: #dc3545;
}

.help-block {
    font-size: 12px;
    margin-top: 5px;
}

.has-error .help-block {
    color: #dc3545;
}

.has-success .help-block {
    color: #28a745;
}

.input-group-addon {
    background-color: #f8f9fa;
    border-color: #e9ecef;
}

.box-success {
    border-top-color: #28a745;
}

.box-success .box-title {
    color: #28a745;
}

#summaryPacket, #summaryRouter, #summaryExpire, #summaryStatus {
    font-size: 13px;
    margin-top: 2px;
}

.btn-group .btn {
    margin-right: 5px;
}

.alert-dismissible {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .box-footer .pull-left,
    .box-footer .pull-right {
        float: none !important;
        text-align: center;
        margin-bottom: 10px;
    }
    
    .btn {
        margin-bottom: 5px;
    }
}
</style>
