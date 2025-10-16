<!-- NAS Management Page -->

<div class="card fade-in-up">
    <div class="card-header">
        <h3><i class="fa fa-server"></i> NAS Devices Management</h3>
        <div style="margin-left: auto;">
            <a href="/index.php?mod=create_nas" class="btn btn-primary">
                <i class="fa fa-plus"></i> Add NAS Device
            </a>
        </div>
    </div>
    <div class="card-body">
        <?php if (isset($_SESSION['success_message'])): ?>
            <div class="alert alert-success">
                <i class="fa fa-check-circle"></i>
                <strong>Success!</strong>
                <?= htmlspecialchars($_SESSION['success_message']) ?>
            </div>
            <?php unset($_SESSION['success_message']); ?>
        <?php endif; ?>
        
        <?php if (isset($_SESSION['error_message'])): ?>
            <div class="alert alert-danger">
                <i class="fa fa-exclamation-circle"></i>
                <strong>Error!</strong>
                <?= htmlspecialchars($_SESSION['error_message']) ?>
            </div>
            <?php unset($_SESSION['error_message']); ?>
        <?php endif; ?>
        
        <?php if (empty($nasDevices)): ?>
            <div class="text-center" style="padding: 40px;">
                <i class="fa fa-server" style="font-size: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                <h4 style="color: #64748b; margin-bottom: 8px;">No NAS Devices Found</h4>
                <p style="color: #94a3b8;">Start by adding your first NAS device to manage network access.</p>
                <a href="/index.php?mod=create_nas" class="btn btn-primary" style="margin-top: 16px;">
                    <i class="fa fa-plus"></i> Add First NAS Device
                </a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>IP Address</th>
                            <th>Short Name</th>
                            <th>Username</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($nasDevices as $nas): ?>
                            <tr>
                                <td>
                                    <a href="/index.php?mod=nas_details&nasname=<?= urlencode($nas['nasname']) ?>" 
                                       style="color: #4f46e5; text-decoration: none; font-weight: bold;">
                                        <?= htmlspecialchars($nas['nasname']) ?>
                                        <i class="fa fa-external-link" style="margin-left: 8px; font-size: 12px;"></i>
                                    </a>
                                </td>
                                <td>
                                    <span class="label label-primary"><?= htmlspecialchars($nas['shortname']) ?></span>
                                </td>
                                <td>
                                    <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                        <?= htmlspecialchars($nas['ruser']) ?>
                                    </code>
                                </td>
                                <td style="color: #64748b;">
                                    <?= htmlspecialchars($nas['description'] ?? '') ?: 'No description' ?>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <a href="/index.php?mod=edit_nas&nasname=<?= urlencode($nas['nasname']) ?>" 
                                           class="btn btn-warning btn-sm" title="Edit">
                                            <i class="fa fa-edit"></i>
                                        </a>
                                        <a href="/index.php?mod=delete_nas&nasname=<?= urlencode($nas['nasname']) ?>" 
                                           class="btn btn-danger btn-sm" title="Delete"
                                           onclick="return confirm('Are you sure you want to delete this NAS device?')">
                                            <i class="fa fa-trash"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>
