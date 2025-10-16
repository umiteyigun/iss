<!-- NAS Device Details Page -->

<div class="card fade-in-up">
    <div class="card-header">
        <h3><i class="fa fa-server"></i> NAS Device Details</h3>
        <div style="margin-left: auto;">
            <a href="/index.php?mod=nas" class="btn btn-secondary">
                <i class="fa fa-arrow-left"></i> Back to NAS List
            </a>
        </div>
    </div>
    <div class="card-body">
        <!-- Device Info -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="info-card">
                    <div class="info-card-icon bg-primary">
                        <i class="fa fa-server"></i>
                    </div>
                    <div class="info-card-content">
                        <div class="info-card-text">Device IP</div>
                        <div class="info-card-number"><?= htmlspecialchars($nasDevice['nasname']) ?></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="info-card">
                    <div class="info-card-icon bg-success">
                        <i class="fa fa-tag"></i>
                    </div>
                    <div class="info-card-content">
                        <div class="info-card-text">Short Name</div>
                        <div class="info-card-number"><?= htmlspecialchars($nasDevice['shortname']) ?></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Status -->
        <div class="card mb-4">
            <div class="card-header">
                <h4><i class="fa fa-heartbeat"></i> System Status</h4>
            </div>
            <div class="card-body">
                <div id="systemStatus">
                    <div class="text-center" style="padding: 40px;">
                        <i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #4f46e5;"></i>
                        <p style="margin-top: 16px; color: #64748b;">Loading system information...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resource Usage -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fa fa-microchip"></i> CPU Usage</h5>
                    </div>
                    <div class="card-body">
                        <div id="cpuUsage">
                            <div class="text-center">
                                <i class="fa fa-spinner fa-spin"></i>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fa fa-memory"></i> Memory Usage</h5>
                    </div>
                    <div class="card-body">
                        <div id="memoryUsage">
                            <div class="text-center">
                                <i class="fa fa-spinner fa-spin"></i>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fa fa-users"></i> Active Users</h5>
                    </div>
                    <div class="card-body">
                        <div id="activeUsers">
                            <div class="text-center">
                                <i class="fa fa-spinner fa-spin"></i>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Network Interfaces -->
        <div class="card mb-4">
            <div class="card-header">
                <h4><i class="fa fa-network-wired"></i> Network Interfaces</h4>
            </div>
            <div class="card-body">
                <div id="networkInterfaces">
                    <div class="text-center" style="padding: 40px;">
                        <i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #4f46e5;"></i>
                        <p style="margin-top: 16px; color: #64748b;">Loading network interfaces...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Connections -->
        <div class="card mb-4">
            <div class="card-header">
                <h4><i class="fa fa-wifi"></i> Active Connections</h4>
            </div>
            <div class="card-body">
                <div id="activeConnections">
                    <div class="text-center" style="padding: 40px;">
                        <i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #4f46e5;"></i>
                        <p style="margin-top: 16px; color: #64748b;">Loading active connections...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Mikrotik API bilgilerini yükle
const nasDevice = {
    ip: '<?= htmlspecialchars($nasDevice['nasname']) ?>',
    username: '<?= htmlspecialchars($nasDevice['ruser']) ?>',
    password: '<?= htmlspecialchars($nasDevice['naspassword']) ?>'
};

// API endpoint'leri
const apiEndpoints = {
    systemResource: '/api/mikrotik/system-resource.php',
    interfaces: '/api/mikrotik/interfaces.php',
    activeConnections: '/api/mikrotik/active-connections.php'
};

        // System resource bilgilerini yükle
function loadSystemResource() {
    fetch(`${apiEndpoints.systemResource}?ip=${nasDevice.ip}&username=${nasDevice.username}&password=${nasDevice.password}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSystemStatus(data.data);
                updateResourceUsage(data.data);
                
                // Warning mesajını göster
                if (data.warning) {
                    showWarning('systemStatus', data.warning);
                }
            } else {
                showError('systemStatus', 'Failed to load system resource: ' + data.error);
            }
        })
        .catch(error => {
            showError('systemStatus', 'Error loading system resource: ' + error.message);
        });
}

// Network interfaces bilgilerini yükle
function loadInterfaces() {
    fetch(`${apiEndpoints.interfaces}?ip=${nasDevice.ip}&username=${nasDevice.username}&password=${nasDevice.password}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateInterfaces(data.data);
            } else {
                showError('networkInterfaces', 'Failed to load interfaces: ' + data.error);
            }
        })
        .catch(error => {
            showError('networkInterfaces', 'Error loading interfaces: ' + error.message);
        });
}

// Active connections bilgilerini yükle
function loadActiveConnections() {
    fetch(`${apiEndpoints.activeConnections}?ip=${nasDevice.ip}&username=${nasDevice.username}&password=${nasDevice.password}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateActiveConnections(data.data);
            } else {
                showError('activeConnections', 'Failed to load active connections: ' + data.error);
            }
        })
        .catch(error => {
            showError('activeConnections', 'Error loading active connections: ' + error.message);
        });
}

// System status güncelle
function updateSystemStatus(data) {
    const status = data.uptime ? 'Online' : 'Offline';
    const statusClass = data.uptime ? 'text-success' : 'text-danger';
    
    document.getElementById('systemStatus').innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <div class="text-center">
                    <h5 class="${statusClass}">${status}</h5>
                    <p>Status</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <h5>${data.uptime || 'N/A'}</h5>
                    <p>Uptime</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <h5>${data.version || 'N/A'}</h5>
                    <p>Version</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <h5>${data.architecture || 'N/A'}</h5>
                    <p>Architecture</p>
                </div>
            </div>
        </div>
    `;
}

// Resource usage güncelle
function updateResourceUsage(data) {
    // CPU Usage
    const cpuPercent = data.cpuLoad || 0;
    document.getElementById('cpuUsage').innerHTML = `
        <div class="text-center">
            <div style="font-size: 32px; font-weight: bold; color: #4f46e5;">${cpuPercent}%</div>
            <div class="progress" style="height: 8px; margin-top: 10px;">
                <div class="progress-bar" style="width: ${cpuPercent}%; background: #4f46e5;"></div>
            </div>
        </div>
    `;

    // Memory Usage
    const memoryUsed = data.memoryUsed || 0;
    const memoryTotal = data.memoryTotal || 1;
    const memoryPercent = Math.round((memoryUsed / memoryTotal) * 100);
    document.getElementById('memoryUsage').innerHTML = `
        <div class="text-center">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${memoryPercent}%</div>
            <div style="font-size: 12px; color: #64748b;">${formatBytes(memoryUsed)} / ${formatBytes(memoryTotal)}</div>
            <div class="progress" style="height: 8px; margin-top: 10px;">
                <div class="progress-bar" style="width: ${memoryPercent}%; background: #10b981;"></div>
            </div>
        </div>
    `;

    // Active Users
    const activeUsers = data.activeUsers || 0;
    document.getElementById('activeUsers').innerHTML = `
        <div class="text-center">
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${activeUsers}</div>
            <p style="color: #64748b;">Connected Users</p>
        </div>
    `;
}

// Interfaces güncelle
function updateInterfaces(interfaces) {
    let html = '<div class="table-responsive"><table class="table"><thead><tr><th>Interface</th><th>Type</th><th>Status</th><th>RX Bytes</th><th>TX Bytes</th></tr></thead><tbody>';
    
    interfaces.forEach(iface => {
        const statusClass = iface.running ? 'label-success' : 'label-danger';
        html += `
            <tr>
                <td><strong>${iface.name}</strong></td>
                <td>${iface.type}</td>
                <td><span class="label ${statusClass}">${iface.running ? 'Up' : 'Down'}</span></td>
                <td>${formatBytes(iface.rxByte || 0)}</td>
                <td>${formatBytes(iface.txByte || 0)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    document.getElementById('networkInterfaces').innerHTML = html;
}

// Active connections güncelle
function updateActiveConnections(connections) {
    let html = '<div class="table-responsive"><table class="table"><thead><tr><th>User</th><th>Address</th><th>Uptime</th><th>Bytes In</th><th>Bytes Out</th></tr></thead><tbody>';
    
    if (connections.length === 0) {
        html += '<tr><td colspan="5" class="text-center">No active connections</td></tr>';
    } else {
        connections.forEach(conn => {
            html += `
                <tr>
                    <td><strong>${conn.user}</strong></td>
                    <td>${conn.address}</td>
                    <td>${conn.uptime || 'N/A'}</td>
                    <td>${formatBytes(conn.bytesIn || 0)}</td>
                    <td>${formatBytes(conn.bytesOut || 0)}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table></div>';
    document.getElementById('activeConnections').innerHTML = html;
}

// Hata göster
function showError(elementId, message) {
    document.getElementById(elementId).innerHTML = `
        <div class="alert alert-danger">
            <i class="fa fa-exclamation-circle"></i>
            <strong>Error:</strong> ${message}
        </div>
    `;
}

// Warning göster
function showWarning(elementId, message) {
    const existingContent = document.getElementById(elementId).innerHTML;
    document.getElementById(elementId).innerHTML = `
        <div class="alert alert-warning" style="margin-bottom: 20px;">
            <i class="fa fa-exclamation-triangle"></i>
            <strong>Warning:</strong> ${message}
        </div>
        ${existingContent}
    `;
}

// Bytes formatla
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Sayfa yüklendiğinde verileri yükle
document.addEventListener('DOMContentLoaded', function() {
    loadSystemResource();
    loadInterfaces();
    loadActiveConnections();
    
    // Her 30 saniyede bir güncelle
    setInterval(() => {
        loadSystemResource();
        loadActiveConnections();
    }, 30000);
});
</script>
