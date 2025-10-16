<?php
// Tenant Management Page
?>

<div class="content-wrapper">
    <!-- Content Header -->
    <section class="content-header">
        <h1>
            Tenant Management
            <small>Manage system tenants</small>
        </h1>
        <ol class="breadcrumb">
            <?php foreach ($breadcrumb as $item): ?>
                <li><a href="<?= $item['url'] ?>"><?= $item['name'] ?></a></li>
            <?php endforeach; ?>
        </ol>
    </section>

    <!-- Main content -->
    <section class="content">
        <!-- Success/Error Messages -->
        <?php if (isset($_SESSION['success_message'])): ?>
            <div class="alert alert-success fade-in-up">
                <i class="fa fa-check-circle"></i>
                <strong>Success!</strong>
                <?= htmlspecialchars($_SESSION['success_message']) ?>
            </div>
            <?php unset($_SESSION['success_message']); ?>
        <?php endif; ?>

        <?php if (isset($_SESSION['error_message'])): ?>
            <div class="alert alert-danger fade-in-up">
                <i class="fa fa-exclamation-circle"></i>
                <strong>Error!</strong>
                <?= htmlspecialchars($_SESSION['error_message']) ?>
            </div>
            <?php unset($_SESSION['error_message']); ?>
        <?php endif; ?>

        <!-- Tenant List -->
        <div class="box fade-in-up">
            <div class="box-header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">
                        <i class="fa fa-building"></i> All Tenants
                    </h3>
                    <a href="/index.php?mod=create_tenant" class="btn btn-primary">
                        <i class="fa fa-plus"></i> Create New Tenant
                    </a>
                </div>
            </div>
            <div class="box-body">
                <div class="table-responsive">
                    <table id="tenantsTable" class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Subdomain</th>
                                    <th>Status</th>
                                    <th>Users</th>
                                    <th>RADIUS Users</th>
                                    <th>Online Users</th>
                                    <th>Contact Email</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($tenants as $tenant): ?>
                                    <tr>
                                        <td><?= $tenant['id'] ?></td>
                                        <td>
                                            <div>
                                                <strong style="color: var(--text-primary);"><?= htmlspecialchars($tenant['name']) ?></strong>
                                                <?php if ($tenant['id'] == 1): ?>
                                                    <span class="label label-primary" style="margin-left: 8px;">Default</span>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                        <td>
                                            <code style="background: var(--bg-hover); color: var(--text-accent); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm);"><?= htmlspecialchars($tenant['subdomain']) ?></code>
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
                                        <td>
                                            <span class="label label-primary"><?= $tenant['stats']['user_count'] ?? 0 ?></span>
                                        </td>
                                        <td>
                                            <span class="label label-success"><?= $tenant['stats']['radius_user_count'] ?? 0 ?></span>
                                        </td>
                                        <td>
                                            <span class="label label-warning"><?= $tenant['stats']['online_user_count'] ?? 0 ?></span>
                                        </td>
                                        <td><?= htmlspecialchars($tenant['contact_email']) ?></td>
                                        <td><?= date('Y-m-d H:i', strtotime($tenant['created_at'])) ?></td>
                                        <td>
                                            <div style="display: flex; gap: var(--space-2);">
                                                <a href="/index.php?mod=view_tenant&id=<?= $tenant['id'] ?>" 
                                                   class="btn btn-info btn-sm" title="View Details">
                                                    <i class="fa fa-eye"></i>
                                                </a>
                                                <a href="/index.php?mod=edit_tenant&id=<?= $tenant['id'] ?>" 
                                                   class="btn btn-warning btn-sm" title="Edit">
                                                    <i class="fa fa-edit"></i>
                                                </a>
                                                <?php if ($tenant['id'] != 1): ?>
                                                    <a href="/index.php?mod=delete_tenant&id=<?= $tenant['id'] ?>" 
                                                       class="btn btn-danger btn-sm" title="Delete"
                                                       onclick="return confirm('Are you sure you want to delete this tenant?')">
                                                        <i class="fa fa-trash"></i>
                                                    </a>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

<script>
$(document).ready(function() {
    $('#tenantsTable').DataTable({
        "responsive": true,
        "autoWidth": false,
        "order": [[ 0, "desc" ]],
        "pageLength": 25,
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Turkish.json"
        }
    });
});
</script>
