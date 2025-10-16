<?php
// View Tenant Details Page
?>

<div class="content-wrapper">
    <!-- Content Header -->
    <section class="content-header">
        <h1>
            Tenant Details
            <small><?= htmlspecialchars($tenant['name']) ?></small>
        </h1>
        <ol class="breadcrumb">
            <?php foreach ($breadcrumb as $item): ?>
                <li><a href="<?= $item['url'] ?>"><?= $item['name'] ?></a></li>
            <?php endforeach; ?>
        </ol>
    </section>

    <!-- Main content -->
    <section class="content">
        <!-- Tenant Information -->
        <div class="row">
            <div class="col-md-8">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Tenant Information</h3>
                        <div class="box-tools">
                            <a href="/index.php?mod=edit_tenant&id=<?= $tenant['id'] ?>" class="btn btn-warning btn-sm">
                                <i class="fa fa-edit"></i> Edit
                            </a>
                        </div>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-md-6">
                                <table class="table table-striped">
                                    <tr>
                                        <th>ID</th>
                                        <td><?= $tenant['id'] ?></td>
                                    </tr>
                                    <tr>
                                        <th>Name</th>
                                        <td>
                                            <strong><?= htmlspecialchars($tenant['name']) ?></strong>
                                            <?php if ($tenant['id'] == 1): ?>
                                                <span class="label label-info">Default</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Subdomain</th>
                                        <td><code><?= htmlspecialchars($tenant['subdomain']) ?></code></td>
                                    </tr>
                                    <tr>
                                        <th>Status</th>
                                        <td>
                                            <?php
                                            $statusClass = $tenant['status'] === 'active' ? 'success' : 
                                                         ($tenant['status'] === 'suspended' ? 'danger' : 'warning');
                                            ?>
                                            <span class="label label-<?= $statusClass ?>">
                                                <?= ucfirst($tenant['status']) ?>
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>RADIUS Secret</th>
                                        <td><code><?= htmlspecialchars($tenant['radius_secret']) ?></code></td>
                                    </tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <table class="table table-striped">
                                    <tr>
                                        <th>Contact Email</th>
                                        <td><?= htmlspecialchars($tenant['contact_email']) ?></td>
                                    </tr>
                                    <tr>
                                        <th>Contact Phone</th>
                                        <td><?= htmlspecialchars($tenant['contact_phone']) ?></td>
                                    </tr>
                                    <tr>
                                        <th>Max Users</th>
                                        <td><?= $tenant['max_users'] ?></td>
                                    </tr>
                                    <tr>
                                        <th>Max NAS Devices</th>
                                        <td><?= $tenant['max_nas'] ?></td>
                                    </tr>
                                    <tr>
                                        <th>Created</th>
                                        <td><?= date('Y-m-d H:i', strtotime($tenant['created_at'])) ?></td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <?php if ($tenant['description']): ?>
                            <div class="row">
                                <div class="col-md-12">
                                    <h4>Description</h4>
                                    <p><?= nl2br(htmlspecialchars($tenant['description'])) ?></p>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
                <!-- /.box -->

                <!-- IP Ranges -->
                <div class="box box-info">
                    <div class="box-header with-border">
                        <h3 class="box-title">IP Ranges</h3>
                    </div>
                    <div class="box-body">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Start IP</th>
                                    <th>End IP</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($tenant['ip_ranges'] as $range): ?>
                                    <tr>
                                        <td><code><?= htmlspecialchars($range['ip_start']) ?></code></td>
                                        <td><code><?= htmlspecialchars($range['ip_end']) ?></code></td>
                                        <td><?= htmlspecialchars($range['description']) ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <!-- /.box -->
            </div>
            <!-- /.col -->

            <div class="col-md-4">
                <!-- Statistics -->
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title">Statistics</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-box-icon bg-blue">
                                        <i class="fa fa-users"></i>
                                    </span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">Users</span>
                                        <span class="info-box-number"><?= $tenant['stats']['user_count'] ?? 0 ?></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-box-icon bg-green">
                                        <i class="fa fa-wifi"></i>
                                    </span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">RADIUS Users</span>
                                        <span class="info-box-number"><?= $tenant['stats']['radius_user_count'] ?? 0 ?></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-box-icon bg-yellow">
                                        <i class="fa fa-circle"></i>
                                    </span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">Online Users</span>
                                        <span class="info-box-number"><?= $tenant['stats']['online_user_count'] ?? 0 ?></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-box-icon bg-red">
                                        <i class="fa fa-server"></i>
                                    </span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">NAS Devices</span>
                                        <span class="info-box-number"><?= $tenant['stats']['nas_count'] ?? 0 ?></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- /.box -->

                <!-- Actions -->
                <div class="box box-warning">
                    <div class="box-header with-border">
                        <h3 class="box-title">Actions</h3>
                    </div>
                    <div class="box-body">
                        <div class="btn-group-vertical" style="width: 100%;">
                            <a href="/index.php?mod=edit_tenant&id=<?= $tenant['id'] ?>" class="btn btn-warning">
                                <i class="fa fa-edit"></i> Edit Tenant
                            </a>
                            <?php if ($tenant['id'] != 1): ?>
                                <a href="/index.php?mod=delete_tenant&id=<?= $tenant['id'] ?>" 
                                   class="btn btn-danger"
                                   onclick="return confirm('Are you sure you want to delete this tenant?')">
                                    <i class="fa fa-trash"></i> Delete Tenant
                                </a>
                            <?php endif; ?>
                            <a href="/index.php?mod=tenants" class="btn btn-default">
                                <i class="fa fa-arrow-left"></i> Back to List
                            </a>
                        </div>
                    </div>
                </div>
                <!-- /.box -->
            </div>
            <!-- /.col -->
        </div>
        <!-- /.row -->

        <!-- Tenant Users -->
        <div class="row">
            <div class="col-md-12">
                <div class="box box-default">
                    <div class="box-header with-border">
                        <h3 class="box-title">Tenant Users</h3>
                    </div>
                    <div class="box-body">
                        <?php if (empty($users)): ?>
                            <p class="text-muted">No users found for this tenant.</p>
                        <?php else: ?>
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Mode</th>
                                        <th>Status</th>
                                        <th>Last Login</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($users as $user): ?>
                                        <tr>
                                            <td><?= $user['id'] ?></td>
                                            <td><?= htmlspecialchars($user['username']) ?></td>
                                            <td>
                                                <span class="label label-info"><?= htmlspecialchars($user['mode']) ?></span>
                                            </td>
                                            <td>
                                                <?php if ($user['is_active']): ?>
                                                    <span class="label label-success">Active</span>
                                                <?php else: ?>
                                                    <span class="label label-danger">Inactive</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?= $user['last_login'] ? date('Y-m-d H:i', strtotime($user['last_login'])) : 'Never' ?>
                                            </td>
                                            <td>
                                                <?= $user['created_at'] ? date('Y-m-d H:i', strtotime($user['created_at'])) : 'Unknown' ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
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
