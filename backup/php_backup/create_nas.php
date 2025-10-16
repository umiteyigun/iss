<!-- Create NAS Device Page -->

<div class="card fade-in-up">
    <div class="card-header">
        <h3><i class="fa fa-plus"></i> Add New NAS Device</h3>
        <div style="margin-left: auto;">
            <a href="/index.php?mod=nas" class="btn btn-secondary">
                <i class="fa fa-arrow-left"></i> Back to NAS List
            </a>
        </div>
    </div>
    <div class="card-body">
        <?php if (isset($_SESSION['error_message'])): ?>
            <div class="alert alert-danger">
                <i class="fa fa-exclamation-circle"></i>
                <strong>Error!</strong>
                <?= htmlspecialchars($_SESSION['error_message']) ?>
            </div>
            <?php unset($_SESSION['error_message']); ?>
        <?php endif; ?>
        
        <form method="POST" action="/index.php?mod=create_nas">
            <div class="row">
                <div class="col-md-6">
                    <div style="margin-bottom: 20px;">
                        <label for="nasname" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            IP Address <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="text" 
                               id="nasname" 
                               name="nasname" 
                               required
                               style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                               placeholder="192.168.1.1"
                               value="<?= htmlspecialchars($_POST['nasname'] ?? '') ?>">
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div style="margin-bottom: 20px;">
                        <label for="shortname" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            Short Name <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="text" 
                               id="shortname" 
                               name="shortname" 
                               required
                               style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                               placeholder="router1"
                               value="<?= htmlspecialchars($_POST['shortname'] ?? '') ?>">
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div style="margin-bottom: 20px;">
                        <label for="ruser" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            Username <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="text" 
                               id="ruser" 
                               name="ruser" 
                               required
                               style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                               placeholder="admin"
                               value="<?= htmlspecialchars($_POST['ruser'] ?? '') ?>">
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div style="margin-bottom: 20px;">
                        <label for="naspassword" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            Password <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="password" 
                               id="naspassword" 
                               name="naspassword" 
                               required
                               style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                               placeholder="Enter password"
                               value="<?= htmlspecialchars($_POST['naspassword'] ?? '') ?>">
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div style="margin-bottom: 20px;">
                        <label for="secret" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            RADIUS Secret <span style="color: #ef4444;">*</span>
                        </label>
                        <input type="text" 
                               id="secret" 
                               name="secret" 
                               required
                               style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                               placeholder="radius_secret_key"
                               value="<?= htmlspecialchars($_POST['secret'] ?? '') ?>">
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div style="margin-bottom: 20px;">
                        <label for="description" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            Description
                        </label>
                        <input type="text" 
                               id="description" 
                               name="description"
                               style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                               placeholder="Optional description"
                               value="<?= htmlspecialchars($_POST['description'] ?? '') ?>">
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <a href="/index.php?mod=nas" class="btn btn-secondary">
                        <i class="fa fa-times"></i> Cancel
                    </a>
                    <button type="submit" class="btn btn-primary">
                        <i class="fa fa-save"></i> Add NAS Device
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>
