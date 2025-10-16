<!-- ArchitectUI Dashboard Content -->

<!-- Super Admin Dashboard Header -->
<?php if (isset($isSuperAdmin) && $isSuperAdmin): ?>
    <div class="card fade-in-up">
        <div class="card-header">
            <h3><i class="fa fa-crown"></i> Super Admin Dashboard</h3>
        </div>
        <div class="card-body">
            <p style="color: var(--gray-600); font-size: 16px; margin-bottom: 24px;">Manage all tenants and system overview with advanced analytics and monitoring tools.</p>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                <a href="/index.php?mod=tenants" class="btn btn-primary">
                    <i class="fa fa-building"></i> Manage Tenants
                </a>
                <a href="/index.php?mod=create_tenant" class="btn btn-success">
                    <i class="fa fa-plus"></i> Create Tenant
                </a>
            </div>
        </div>
    </div>

    <!-- Super Admin Stats -->
    <div class="row">
        <div class="col-md-3">
            <div class="info-card fade-in-up" style="animation-delay: 0.1s;">
                <div class="info-card-icon bg-primary">
                    <i class="fa fa-building"></i>
                </div>
                <div class="info-card-content">
                    <div class="info-card-text">Total Tenants</div>
                    <div class="info-card-number"><?= $tenantStats['total_tenants'] ?></div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3">
            <div class="info-card fade-in-up" style="animation-delay: 0.2s;">
                <div class="info-card-icon bg-success">
                    <i class="fa fa-check-circle"></i>
                </div>
                <div class="info-card-content">
                    <div class="info-card-text">Active Tenants</div>
                    <div class="info-card-number"><?= $tenantStats['active_tenants'] ?></div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3">
            <div class="info-card fade-in-up" style="animation-delay: 0.3s;">
                <div class="info-card-icon bg-warning">
                    <i class="fa fa-pause-circle"></i>
                </div>
                <div class="info-card-content">
                    <div class="info-card-text">Suspended Tenants</div>
                    <div class="info-card-number"><?= $tenantStats['suspended_tenants'] ?></div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3">
            <div class="info-card fade-in-up" style="animation-delay: 0.4s;">
                <div class="info-card-icon bg-info">
                    <i class="fa fa-users"></i>
                </div>
                <div class="info-card-content">
                    <div class="info-card-text">Total Users</div>
                    <div class="info-card-number"><?= $tenantStats['total_users'] ?></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Tenant Overview -->
    <div class="card fade-in-up" style="animation-delay: 0.5s;">
        <div class="card-header">
            <h3><i class="fa fa-building"></i> Tenant Overview</h3>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Users</th>
                            <th>RADIUS Users</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($allTenants as $tenant): ?>
                            <tr>
                                <td>
                                    <strong style="color: var(--gray-900);"><?= htmlspecialchars($tenant['name']) ?></strong>
                                    <?php if ($tenant['id'] == 1): ?>
                                        <span class="label label-primary" style="margin-left: 8px;">Default</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php
                                    $statusClass = $tenant['status'] === 'active' ? 'label-success' : 
                                                 ($tenant['status'] === 'suspended' ? 'label-danger' : 'label-warning');
                                    ?>
                                    <span class="label <?= $statusClass ?>">
                                        <?= ucfirst($tenant['status']) ?>
                                    </span>
                                </td>
                                <td><span class="label label-primary"><?= $tenant['stats']['user_count'] ?? 0 ?></span></td>
                                <td><span class="label label-success"><?= $tenant['stats']['radius_user_count'] ?? 0 ?></span></td>
                                <td style="color: var(--gray-600);"><?= date('M d, Y', strtotime($tenant['created_at'])) ?></td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <a href="/index.php?mod=view_tenant&id=<?= $tenant['id'] ?>" class="btn btn-info btn-sm">
                                            <i class="fa fa-eye"></i>
                                        </a>
                                        <a href="/index.php?mod=edit_tenant&id=<?= $tenant['id'] ?>" class="btn btn-warning btn-sm">
                                            <i class="fa fa-edit"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
<?php endif; ?>

<!-- Regular Dashboard Content -->
<div class="row">
    <div class="col-md-3">
        <div class="info-card fade-in-up" style="animation-delay: 0.1s;">
            <div class="info-card-icon bg-primary">
                <i class="fa fa-users"></i>
            </div>
            <div class="info-card-content">
                <div class="info-card-text">Total Users</div>
                <div class="info-card-number"><?= $totalUsers ?></div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="info-card fade-in-up" style="animation-delay: 0.2s;">
            <div class="info-card-icon bg-success">
                <i class="fa fa-wifi"></i>
            </div>
            <div class="info-card-content">
                <div class="info-card-text">Total Routers</div>
                <div class="info-card-number"><?= $totalRouters ?></div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="info-card fade-in-up" style="animation-delay: 0.3s;">
            <div class="info-card-icon bg-warning">
                <i class="fa fa-server"></i>
            </div>
            <div class="info-card-content">
                <div class="info-card-text">Total NAS</div>
                <div class="info-card-number"><?= $totalNas ?></div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="info-card fade-in-up" style="animation-delay: 0.4s;">
            <div class="info-card-icon bg-danger">
                <i class="fa fa-user-secret"></i>
            </div>
            <div class="info-card-content">
                <div class="info-card-text">Total Members</div>
                <div class="info-card-number"><?= $totalMembers ?></div>
            </div>
        </div>
    </div>
</div>