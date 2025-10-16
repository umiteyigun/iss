<!-- Modern New Member Form -->
<section class="content fade-in">
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header">
                    <h3 class="box-title">
                        <i class="fa fa-user-plus"></i> Create New Administrative Member
                    </h3>
                    <div class="box-tools">
                        <a href="/index.php?mod=memberlist" class="btn btn-default btn-sm">
                            <i class="fa fa-arrow-left"></i> Back to Members
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <form role="form" method="POST" action="index.php?mod=doNewMember" enctype="multipart/form-data" id="newMemberForm">
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
                            <label for="username">
                                <i class="fa fa-user"></i> Username <span class="text-danger">*</span>
                            </label>
                            <input type="text" class="form-control" id="username" name="username" 
                                   placeholder="Enter username" required>
                            <span class="help-block">Username must be unique and at least 3 characters</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">
                                <i class="fa fa-lock"></i> Password <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="password" name="password" 
                                       placeholder="Enter password" required>
                                <span class="input-group-btn">
                                    <button type="button" class="btn btn-default" id="generatePassword">
                                        <i class="fa fa-magic"></i> Generate
                                    </button>
                                </span>
                            </div>
                            <span class="help-block">Password must be at least 6 characters</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassword">
                                <i class="fa fa-lock"></i> Confirm Password <span class="text-danger">*</span>
                            </label>
                            <input type="password" class="form-control" id="confirmPassword" 
                                   placeholder="Confirm password" required>
                            <span class="help-block">Please confirm your password</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="name">
                                <i class="fa fa-user"></i> First Name
                            </label>
                            <input type="text" class="form-control" id="name" name="name" 
                                   placeholder="Enter first name">
                        </div>
                        
                        <div class="form-group">
                            <label for="lastname">
                                <i class="fa fa-user"></i> Last Name
                            </label>
                            <input type="text" class="form-control" id="lastname" name="lastname" 
                                   placeholder="Enter last name">
                        </div>
                        
                        <div class="form-group">
                            <label for="phone">
                                <i class="fa fa-phone"></i> Phone Number
                            </label>
                            <input type="tel" class="form-control" id="phone" name="phone" 
                                   placeholder="Enter phone number">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Additional Information -->
            <div class="col-md-6">
                <div class="box box-info">
                    <div class="box-header with-border">
                        <h3 class="box-title">
                            <i class="fa fa-cogs"></i> Additional Information
                        </h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label for="tc">
                                <i class="fa fa-id-badge"></i> TC Identity Number
                            </label>
                            <input type="text" class="form-control" id="tc" name="tc" 
                                   placeholder="Enter TC identity number" maxlength="11">
                            <span class="help-block">11-digit Turkish identity number</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="mode">
                                <i class="fa fa-shield"></i> Permissions (Mode) <span class="text-danger">*</span>
                            </label>
                            <select class="form-control" id="mode" name="mode" required>
                                <option value="">Select permission level</option>
                                <option value="admin">Administrator (Full Access)</option>
                                <option value="manager">Manager (Limited Access)</option>
                                <option value="operator">Operator (Basic Access)</option>
                                <option value="viewer">Viewer (Read Only)</option>
                            </select>
                            <span class="help-block">Select the appropriate permission level for this member</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">
                                <i class="fa fa-envelope"></i> Email Address
                            </label>
                            <input type="email" class="form-control" id="email" name="email" 
                                   placeholder="Enter email address">
                        </div>
                        
                        <div class="form-group">
                            <label for="photo">
                                <i class="fa fa-camera"></i> Profile Photo
                            </label>
                            <input type="file" id="photo" name="photo" accept="image/*">
                            <span class="help-block">Upload a profile picture (JPG, PNG, GIF - Max 2MB)</span>
                            <div id="photoPreview" class="mt-2" style="display: none;">
                                <img id="previewImg" src="" alt="Preview" style="max-width: 150px; max-height: 150px; border-radius: 8px;">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Summary Card -->
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title">
                            <i class="fa fa-info-circle"></i> Summary
                        </h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-sm-6">
                                <strong>Username:</strong>
                                <div id="summaryUsername" class="text-muted">Not set</div>
                            </div>
                            <div class="col-sm-6">
                                <strong>Permission Level:</strong>
                                <div id="summaryPermission" class="text-muted">Not selected</div>
                            </div>
                        </div>
                        <div class="row" style="margin-top: 10px;">
                            <div class="col-sm-6">
                                <strong>Full Name:</strong>
                                <div id="summaryName" class="text-muted">Not provided</div>
                            </div>
                            <div class="col-sm-6">
                                <strong>Contact:</strong>
                                <div id="summaryContact" class="text-muted">Not provided</div>
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
                                <i class="fa fa-refresh"></i> Reset Form
                            </button>
                        </div>
                        <div class="pull-right">
                            <a href="/index.php?mod=memberlist" class="btn btn-default">
                                <i class="fa fa-times"></i> Cancel
                            </a>
                            <button type="submit" class="btn btn-primary" id="submitBtn">
                                <i class="fa fa-save"></i> Create Member
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</section>

<script>
$(document).ready(function() {
    // Generate password functionality
    $('#generatePassword').on('click', function() {
        var password = generateRandomPassword();
        $('#password').val(password);
        $('#confirmPassword').val(password);
        showNotification('Password generated: ' + password, 'success');
    });
    
    // Password confirmation validation
    $('#confirmPassword').on('input', function() {
        var password = $('#password').val();
        var confirmPassword = $(this).val();
        
        if (confirmPassword && password !== confirmPassword) {
            $(this).closest('.form-group').addClass('has-error');
            $(this).next('.help-block').text('Passwords do not match').show();
        } else {
            $(this).closest('.form-group').removeClass('has-error').addClass('has-success');
            $(this).next('.help-block').text('Passwords match').show();
        }
    });
    
    // Photo preview
    $('#photo').on('change', function() {
        var file = this.files[0];
        if (file) {
            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                showNotification('File size must be less than 2MB', 'error');
                this.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.match('image.*')) {
                showNotification('Please select an image file', 'error');
                this.value = '';
                return;
            }
            
            var reader = new FileReader();
            reader.onload = function(e) {
                $('#previewImg').attr('src', e.target.result);
                $('#photoPreview').show();
            };
            reader.readAsDataURL(file);
        } else {
            $('#photoPreview').hide();
        }
    });
    
    // Form validation
    $('#newMemberForm').on('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }
        
        // Show loading state
        $('#submitBtn').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Creating...');
    });
    
    // Username availability check
    $('#username').on('blur', function() {
        checkUsernameAvailability($(this).val());
    });
    
    // Real-time summary updates
    $('#username, #name, #lastname, #phone, #email, #mode').on('input change', function() {
        updateSummary();
    });
    
    // Initialize summary
    updateSummary();
});

function generateRandomPassword() {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    var password = '';
    for (var i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function updateSummary() {
    var username = $('#username').val();
    var permission = $('#mode option:selected').text();
    var firstName = $('#name').val();
    var lastName = $('#lastname').val();
    var phone = $('#phone').val();
    var email = $('#email').val();
    
    $('#summaryUsername').text(username || 'Not set');
    $('#summaryPermission').text(permission || 'Not selected');
    
    var fullName = (firstName + ' ' + lastName).trim();
    $('#summaryName').text(fullName || 'Not provided');
    
    var contact = phone || email || 'Not provided';
    $('#summaryContact').text(contact);
}

function validateForm() {
    var isValid = true;
    
    // Clear previous errors
    $('.form-group').removeClass('has-error');
    $('.help-block').hide();
    
    // Username validation
    var username = $('#username').val().trim();
    if (!username || username.length < 3) {
        $('#username').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    // Password validation
    var password = $('#password').val();
    if (!password || password.length < 6) {
        $('#password').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    // Password confirmation validation
    var confirmPassword = $('#confirmPassword').val();
    if (password !== confirmPassword) {
        $('#confirmPassword').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    // Permission validation
    if (!$('#mode').val()) {
        $('#mode').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    // TC validation (if provided)
    var tc = $('#tc').val();
    if (tc && (tc.length !== 11 || !/^\d+$/.test(tc))) {
        $('#tc').closest('.form-group').addClass('has-error');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification('Please fill in all required fields correctly', 'error');
    }
    
    return isValid;
}

function checkUsernameAvailability(username) {
    if (username.length < 3) return;
    
    // Simulate username check - in real implementation, make AJAX call
    $.ajax({
        url: '/index.php?mod=checkMemberUsername',
        method: 'POST',
        data: { username: username },
        success: function(response) {
            if (response.available) {
                $('#username').closest('.form-group').removeClass('has-error').addClass('has-success');
                $('#username').next('.help-block').text('Username is available').show();
            } else {
                $('#username').closest('.form-group').removeClass('has-success').addClass('has-error');
                $('#username').next('.help-block').text('Username already exists').show();
            }
        },
        error: function() {
            // If check fails, don't show error
        }
    });
}

function resetForm() {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
        $('#newMemberForm')[0].reset();
        $('#photoPreview').hide();
        $('.form-group').removeClass('has-error has-success');
        $('.help-block').hide();
        updateSummary();
        showNotification('Form has been reset', 'info');
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

#summaryUsername, #summaryPermission, #summaryName, #summaryContact {
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

.mt-2 {
    margin-top: 10px;
}

.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* File input styling */
input[type="file"] {
    padding: 8px;
    border: 2px dashed #ddd;
    border-radius: 6px;
    background-color: #f8f9fa;
    transition: all 0.3s ease;
}

input[type="file"]:hover {
    border-color: #3498db;
    background-color: #e3f2fd;
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