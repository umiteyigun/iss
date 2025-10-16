<?php
// Edit Tenant Page
?>

<div class="content-wrapper">
    <!-- Content Header -->
    <section class="content-header">
        <h1>
            Edit Tenant
            <small>Modify tenant information</small>
        </h1>
        <ol class="breadcrumb">
            <?php foreach ($breadcrumb as $item): ?>
                <li><a href="<?= $item['url'] ?>"><?= $item['name'] ?></a></li>
            <?php endforeach; ?>
        </ol>
    </section>

    <!-- Main content -->
    <section class="content">
        <!-- Error Messages -->
        <?php if (isset($_SESSION['error_message'])): ?>
            <div class="alert alert-danger alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <h4><i class="icon fa fa-ban"></i> Error!</h4>
                <?= htmlspecialchars($_SESSION['error_message']) ?>
            </div>
            <?php unset($_SESSION['error_message']); ?>
        <?php endif; ?>

        <!-- Edit Tenant Form -->
        <div class="row">
            <div class="col-md-8">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Tenant Information</h3>
                    </div>
                    <form role="form" method="POST" action="/index.php?mod=edit_tenant&id=<?= $tenant['id'] ?>">
                        <div class="box-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="name">Tenant Name *</label>
                                        <input type="text" class="form-control" id="name" name="name" 
                                               value="<?= htmlspecialchars($tenant['name']) ?>" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="subdomain">Subdomain *</label>
                                        <input type="text" class="form-control" id="subdomain" name="subdomain" 
                                               value="<?= htmlspecialchars($tenant['subdomain']) ?>" required>
                                        <small class="help-block">Will be used for tenant identification</small>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="status">Status</label>
                                        <select class="form-control" id="status" name="status">
                                            <option value="active" <?= $tenant['status'] === 'active' ? 'selected' : '' ?>>Active</option>
                                            <option value="suspended" <?= $tenant['status'] === 'suspended' ? 'selected' : '' ?>>Suspended</option>
                                            <option value="pending" <?= $tenant['status'] === 'pending' ? 'selected' : '' ?>>Pending</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="radius_secret">RADIUS Secret *</label>
                                        <input type="text" class="form-control" id="radius_secret" name="radius_secret" 
                                               value="<?= htmlspecialchars($tenant['radius_secret']) ?>" required>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="description">Description</label>
                                <textarea class="form-control" id="description" name="description" rows="3"><?= htmlspecialchars($tenant['description']) ?></textarea>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="contact_email">Contact Email</label>
                                        <input type="email" class="form-control" id="contact_email" name="contact_email" 
                                               value="<?= htmlspecialchars($tenant['contact_email']) ?>">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="contact_phone">Contact Phone</label>
                                        <input type="text" class="form-control" id="contact_phone" name="contact_phone" 
                                               value="<?= htmlspecialchars($tenant['contact_phone']) ?>">
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="max_users">Max Users</label>
                                        <input type="number" class="form-control" id="max_users" name="max_users" 
                                               value="<?= $tenant['max_users'] ?>" min="1" max="100000">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="max_nas">Max NAS Devices</label>
                                        <input type="number" class="form-control" id="max_nas" name="max_nas" 
                                               value="<?= $tenant['max_nas'] ?>" min="1" max="1000">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- /.box-body -->

                        <div class="box-footer">
                            <button type="submit" class="btn btn-primary">
                                <i class="fa fa-save"></i> Update Tenant
                            </button>
                            <a href="/index.php?mod=tenants" class="btn btn-default">
                                <i class="fa fa-arrow-left"></i> Cancel
                            </a>
                        </div>
                    </form>
                </div>
                <!-- /.box -->
            </div>
            <!-- /.col -->

            <div class="col-md-4">
                <div class="box box-info">
                    <div class="box-header with-border">
                        <h3 class="box-title">IP Ranges</h3>
                    </div>
                    <div class="box-body">
                        <div id="ipRanges">
                            <?php foreach ($tenant['ip_ranges'] as $index => $range): ?>
                                <div class="ip-range-item" style="margin-top: 10px;">
                                    <div class="row">
                                        <div class="col-md-5">
                                            <input type="text" class="form-control" name="ip_ranges[<?= $index ?>][ip_start]" 
                                                   value="<?= htmlspecialchars($range['ip_start']) ?>" placeholder="Start IP">
                                        </div>
                                        <div class="col-md-5">
                                            <input type="text" class="form-control" name="ip_ranges[<?= $index ?>][ip_end]" 
                                                   value="<?= htmlspecialchars($range['ip_end']) ?>" placeholder="End IP">
                                        </div>
                                        <div class="col-md-2">
                                            <button type="button" class="btn btn-danger btn-sm remove-ip-range">
                                                <i class="fa fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="row" style="margin-top: 5px;">
                                        <div class="col-md-12">
                                            <input type="text" class="form-control" name="ip_ranges[<?= $index ?>][description]" 
                                                   value="<?= htmlspecialchars($range['description']) ?>" placeholder="Description">
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        <button type="button" class="btn btn-success btn-sm" id="addIpRange">
                            <i class="fa fa-plus"></i> Add IP Range
                        </button>
                    </div>
                </div>
                <!-- /.box -->

                <div class="box box-warning">
                    <div class="box-header with-border">
                        <h3 class="box-title">Tenant Statistics</h3>
                    </div>
                    <div class="box-body">
                        <p><strong>Created:</strong> <?= date('Y-m-d H:i', strtotime($tenant['created_at'] ?? '')) ?></p>
                        <p><strong>Updated:</strong> <?= !empty($tenant['updated_at']) ? date('Y-m-d H:i', strtotime($tenant['updated_at'])) : 'Never' ?></p>
                        <p><strong>Current Users:</strong> <?= $tenant['stats']['user_count'] ?? 0 ?></p>
                        <p><strong>RADIUS Users:</strong> <?= $tenant['stats']['radius_user_count'] ?? 0 ?></p>
                    </div>
                </div>
                <!-- /.box -->
            </div>
            <!-- /.col -->
        </div>
        <!-- /.row -->
    </section>
    <!-- /.content -->
</div>
<!-- /.content-wrapper -->

<script>
$(document).ready(function() {
    let ipRangeIndex = <?= count($tenant['ip_ranges']) ?>;

    // Add IP Range
    $('#addIpRange').click(function() {
        const ipRangeHtml = `
            <div class="ip-range-item" style="margin-top: 10px;">
                <div class="row">
                    <div class="col-md-5">
                        <input type="text" class="form-control" name="ip_ranges[${ipRangeIndex}][ip_start]" 
                               placeholder="Start IP">
                    </div>
                    <div class="col-md-5">
                        <input type="text" class="form-control" name="ip_ranges[${ipRangeIndex}][ip_end]" 
                               placeholder="End IP">
                    </div>
                    <div class="col-md-2">
                        <button type="button" class="btn btn-danger btn-sm remove-ip-range">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="row" style="margin-top: 5px;">
                    <div class="col-md-12">
                        <input type="text" class="form-control" name="ip_ranges[${ipRangeIndex}][description]" 
                               placeholder="Description">
                    </div>
                </div>
            </div>
        `;
        $('#ipRanges').append(ipRangeHtml);
        ipRangeIndex++;
    });

    // Remove IP Range
    $(document).on('click', '.remove-ip-range', function() {
        $(this).closest('.ip-range-item').remove();
    });

    // Subdomain validation
    $('#subdomain').on('blur', function() {
        const subdomain = $(this).val();
        if (subdomain) {
            // Basic validation - only alphanumeric and hyphens
            if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
                $(this).addClass('has-error');
                $(this).after('<span class="help-block text-red">Subdomain can only contain letters, numbers and hyphens</span>');
            } else {
                $(this).removeClass('has-error');
                $(this).next('.help-block').remove();
            }
        }
    });
});
</script>
