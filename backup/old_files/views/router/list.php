<?php
if (!function_exists('getPercentage')) {
    function getPercentage($used, $total) {
        if (empty($total)) {
            return 0;
        }
        return round(($used / $total) * 100);
    }
}

if (!function_exists('formatBytes')) {
    function formatBytes($bytes, $precision = 2) {
        if ($bytes <= 0) {
            return '0 Bytes';
        }
        $k = 1024;
        $dm = $precision < 0 ? 0 : $precision;
        $sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        $i = floor(log($bytes, $k));
        
        if ($i == 0) {
            $dm = 0;
        }

        return number_format($bytes / pow($k, $i), $dm) . ' ' . ($sizes[$i] ?? '');
    }
}

if (!function_exists('formatUptime')) {
    function formatUptime($uptimeStr) {
        if (empty($uptimeStr) || !is_string($uptimeStr)) {
            return 'N/A';
        }

        $uptimeStr = str_replace('s', '', $uptimeStr);

        $weeks = $days = $hours = $minutes = 0;

        if (strpos($uptimeStr, 'w') !== false) {
            list($w, $rest) = explode('w', $uptimeStr, 2);
            $weeks = (int)$w;
            $uptimeStr = $rest;
        }

        if (strpos($uptimeStr, 'd') !== false) {
            list($d, $rest) = explode('d', $uptimeStr, 2);
            $days = (int)$d;
            $uptimeStr = $rest;
        }

        if (strpos($uptimeStr, 'h') !== false) {
            list($h, $rest) = explode('h', $uptimeStr, 2);
            $hours = (int)$h;
            $uptimeStr = $rest;
        }

        if (strpos($uptimeStr, 'm') !== false) {
            list($m, $rest) = explode('m', $uptimeStr, 2);
            $minutes = (int)$m;
        }
        
        $totalDays = ($weeks * 7) + $days;

        $parts = [];
        if ($totalDays > 0) {
            $parts[] = $totalDays . ' gün';
        }
        if ($hours > 0) {
            $parts[] = $hours . ' saat';
        }
        if ($minutes > 0) {
            $parts[] = $minutes . ' dakika';
        }

        if (empty($parts)) {
             // If uptime is less than a minute, show as "Az önce" or similar
            return '1 dakikadan az';
        }

        return implode(' ', $parts);
    }
}

$routers = $viewData['routers'] ?? [];
$totalRouters = count($routers);
$activeRouters = 0;
$errorRouters = 0;

foreach ($routers as $router) {
    $resources = $router['resources'] ?? [];
    if (isset($resources['error'])) {
        $errorRouters++;
    } else {
        $activeRouters++;
    }
}
?>

<!-- Main content -->
<section class="content router-page">
    <!-- Modern Router Header -->
    <div class="dashboard-hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1 class="hero-title">
                    <span class="title-icon">🚀</span>
                    Router Management
                </h1>
                <p class="hero-subtitle">Monitor and configure your network devices</p>
                <div class="hero-stats">
                    <div class="hero-stat">
                        <i class="fa fa-clock-o"></i>
                        <span id="current-time"></span>
                    </div>
                    <div class="hero-stat">
                        <i class="fa fa-calendar"></i>
                        <span id="current-date"></span>
                    </div>
                </div>
            </div>
            <div class="hero-visual">
                <div class="floating-card">
                    <div class="card-icon">📊</div>
                    <div class="card-text">System Resources</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modern Stats Grid -->
    <div class="router-stats-grid">
        <div class="stat-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon server-icon">
                        <i class="fa fa-server"></i>
                    </div>
                    <div class="stat-badge live">Live</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $totalRouters; ?></div>
                        <div class="stat-label">Total Routers</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon cpu-icon">
                        <i class="fa fa-microchip"></i>
                    </div>
                    <div class="stat-badge success">Active</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $activeRouters; ?></div>
                        <div class="stat-label">Active Routers</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon memory-icon">
                        <i class="fa fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-badge warning">Alert</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $errorRouters; ?></div>
                        <div class="stat-label">Error Routers</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-card">
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="stat-header">
                    <div class="stat-icon disk-icon">
                        <i class="fa fa-database"></i>
                    </div>
                    <div class="stat-badge info">System</div>
                </div>
                <div class="stat-body">
                    <div class="stat-main">
                        <div class="stat-number"><?php echo $totalRouters > 0 ? round(($activeRouters / $totalRouters) * 100) : 0; ?>%</div>
                        <div class="stat-label">Uptime Rate</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Router Management Section -->
    <div class="router-management-section">
        <div class="section-header">
            <div class="header-content">
                <div class="header-title">
                    <i class="fa fa-server"></i>
                    <h3>Router Management</h3>
                </div>
                <p>Monitor and manage your network devices efficiently</p>
            </div>
            <div class="section-actions">
                <a href="#" class="action-btn add-router-btn">
                    <i class="fa fa-plus"></i>
                    Add First Router
                </a>
                <button id="refreshAll" class="action-btn info">
                    <i class="fa fa-refresh"></i>
                    Refresh All
                </button>
                <button id="autoRefresh" class="action-btn success">
                    <i class="fa fa-play"></i>
                    Auto Refresh
                </button>
                <button id="stopAutoRefresh" class="action-btn warning" style="display:none;">
                    <i class="fa fa-pause"></i>
                    Stop Auto
                </button>
            </div>
        </div>
        
        <div class="management-container">
            <?php if (empty($routers)): ?>
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fa fa-cloud-download"></i>
                    </div>
                    <h3>No Routers Found</h3>
                    <p>Get started by adding your first router to the system.</p>
                    <a href="#" class="action-btn" data-toggle="modal" data-target="#routerModal">
                        <i class="fa fa-plus"></i>
                        Add First Router
                    </a>
                </div>
            <?php else: ?>
                <div class="router-grid">
                    <?php foreach ($routers as $index => $router): ?>
                        <?php 
                        $resources = $router['resources'] ?? [];
                        $hasError = isset($resources['error']);
                        $cpuPercent = !$hasError ? ($resources['cpu']['load'] ?? 0) : 0;
                        $memoryPercent = !$hasError ? getPercentage($resources['memory']['used'], $resources['memory']['total']) : 0;
                        $diskPercent = !$hasError ? getPercentage($resources['disk']['used'], $resources['disk']['total']) : 0;
                        ?>
                        <div class="router-card <?php echo $hasError ? 'has-error' : ''; ?>" 
                             data-nasname="<?php echo htmlspecialchars($router['nasname']); ?>">
                            
                            <div class="router-header">
                                <div class="router-info">
                                    <h3 class="router-name">
                                        <i class="fa fa-server"></i>
                                        <?php echo htmlspecialchars($router['shortname'] ?: $router['nasname']); ?>
                                    </h3>
                                    <p class="router-ip"><?php echo htmlspecialchars($router['nasname']); ?></p>
                                </div>
                                <div class="router-actions">
                                    <button class="router-btn refresh refresh-single" title="Refresh" data-nasname="<?php echo htmlspecialchars($router['nasname']); ?>">
                                        <i class="fa fa-refresh"></i>
                                    </button>
                                    
                                    <button class="router-btn edit edit-router" title="Edit"
                                            data-nasname="<?php if(isset($router['nasname'])) { echo htmlspecialchars($router['nasname']); } ?>"
                                            data-shortname="<?php if(isset($router['shortname'])) { echo htmlspecialchars($router['shortname']); } ?>"
                                            data-ruser="<?php if(isset($router['ruser'])) { echo htmlspecialchars($router['ruser']); } ?>"
                                            data-naspassword="<?php if(isset($router['naspassword'])) { echo htmlspecialchars($router['naspassword']); } ?>"
                                            data-secret="<?php if(isset($router['secret'])) { echo htmlspecialchars($router['secret']); } ?>">
                                        <i class="fa fa-edit"></i>
                                    </button>
                                    
                                    <button class="router-btn delete delete-router" title="Delete" 
                                            data-nasname="<?php echo htmlspecialchars($router['nasname']); ?>">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </div>
                            </div>

                            <?php if ($hasError): ?>
                                <div class="error-message">
                                    <i class="fa fa-exclamation-triangle"></i>
                                    <span>Connection Error: <?php echo htmlspecialchars($resources['error']); ?></span>
                                </div>
                            <?php else: ?>
                                <div class="resource-grid">
                                    <div class="resource-item">
                                        <div class="resource-label">CPU Load (%)</div>
                                        <div class="chart-container">
                                            <canvas id="cpu-chart-<?php echo htmlspecialchars($router['nasname']); ?>"></canvas>
                                        </div>
                                    </div>
                                    <div class="resource-item">
                                        <div class="resource-label">Memory Usage (%)</div>
                                        <div class="chart-container">
                                            <canvas id="memory-chart-<?php echo htmlspecialchars($router['nasname']); ?>"></canvas>
                                        </div>
                                        <small class="resource-details memory-details"></small>
                                    </div>
                                    <div class="resource-item">
                                        <div class="resource-label">Disk Usage</div>
                                        <div class="progress-container">
                                            <div class="modern-progress">
                                                <div class="progress-bar disk-bar" style="width: <?php echo $diskPercent; ?>%;"></div>
                                            </div>
                                            <div class="resource-value disk-percent"><?php echo $diskPercent; ?>%</div>
                                        </div>
                                        <small class="resource-details disk-details"><?php echo formatBytes($resources['disk']['total']); ?></small>
                                    </div>
                                </div>
                                
                                <div class="info-grid">
                                    <div class="info-item">
                                        <strong class="info-label">Uptime</strong>
                                        <span class="info-value uptime"><?php echo htmlspecialchars(formatUptime($resources['uptime'] ?? 'N/A')); ?></span>
                                    </div>
                                    <div class="info-item">
                                        <strong class="info-label">Version</strong>
                                        <span class="info-value version"><?php echo htmlspecialchars($resources['version'] ?? 'N/A'); ?></span>
                                    </div>
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>

<script>
// Modern Router JavaScript
(function() {
    'use strict';
    
    // Update time and date
    function updateDateTime() {
        const now = new Date();
        
        // Update time
        const timeString = now.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
        
        // Update date
        const dateString = now.toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('current-date').textContent = dateString;
    }
    
    // Update every second
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // --- Helper Functions ---
    function formatBytes(bytes, precision = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = precision < 0 ? 0 : precision;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function getPercentage(used, total) {
        if (total == 0) return 0;
        return Math.round((used / total) * 100);
    }

    function formatUptimeJS(uptimeStr) {
        if (!uptimeStr) return 'N/A';

        let remaining = uptimeStr.replace('s', '');
        let weeks = 0, days = 0, hours = 0, minutes = 0;

        if (remaining.includes('w')) {
            [weeks, remaining] = remaining.split('w').map(s => parseInt(s) || 0);
        }
        if (remaining.includes('d')) {
            [days, remaining] = remaining.split('d').map(s => parseInt(s) || 0);
        }
        if (remaining.includes('h')) {
            [hours, remaining] = remaining.split('h').map(s => parseInt(s) || 0);
        }
        if (remaining.includes('m')) {
            [minutes, remaining] = remaining.split('m').map(s => parseInt(s) || 0);
        }

        const totalDays = (weeks * 7) + days;

        let parts = [];
        if (totalDays > 0) parts.push(totalDays + ' gün');
        if (hours > 0) parts.push(hours + ' saat');
        if (minutes > 0) parts.push(minutes + ' dakika');

        if (parts.length === 0) return '1 dakikadan az';
        
        return parts.join(' ');
    }

    // --- Chart.js and System Resource Logic ---
    const REFRESH_INTERVAL = 5000; // 5 seconds for live charts
    let autoRefreshInterval = null;
    let routerCharts = {}; // Store chart instances
    const MAX_DATA_POINTS = 12;

    function createLiveChart(canvasId, color) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const chartData = {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [{
                fillColor: color.replace(')', ', 0.2)').replace('rgb', 'rgba'),
                strokeColor: color,
                pointColor: color,
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: color,
                data: Array(MAX_DATA_POINTS).fill(0)
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            showScale: false,
            showTooltips: false,
            animation: false,
            scaleShowGridLines: false,
            scaleShowHorizontalLines: false,
            scaleShowVerticalLines: false,
            scaleShowLabels: false,
            pointDot: false,
            bezierCurveTension: 0.4,
            datasetStrokeWidth: 2,
        };

        return new Chart(ctx).Line(chartData, chartOptions);
    }

    function updateChart(chart, value) {
        chart.removeData();
        chart.addData([value], '');
    }

    function updateRouterCard(nasname, data) {
        const card = $(`.router-card[data-nasname="${nasname}"]`);
        if (card.length === 0) return;

        if (data.error) {
            // Handle error state
            card.addClass('has-error');
            card.find('.error-message').show();
        } else {
            card.removeClass('has-error');
            card.find('.error-message').hide();
            
            const cpuPercent = data.cpu ? data.cpu.load : 0;
            const memoryPercent = data.memory ? getPercentage(data.memory.used, data.memory.total) : 0;
            const diskPercent = data.disk ? getPercentage(data.disk.used, data.disk.total) : 0;

            updateChart(routerCharts[`cpu-${nasname}`], cpuPercent);
            updateChart(routerCharts[`memory-${nasname}`], memoryPercent);
            
            card.find('.disk-percent').text(diskPercent + '%');
            card.find('.disk-bar').css('width', diskPercent + '%');
            if (data.disk) {
                card.find('.disk-details').text(formatBytes(data.disk.used) + ' / ' + formatBytes(data.disk.total));
            }
            if (data.memory) {
                card.find('.memory-details').text(formatBytes(data.memory.used) + ' / ' + formatBytes(data.memory.total));
            }
            card.find('.uptime').text(formatUptimeJS(data.uptime));
            card.find('.version').text(data.version || 'N/A');
        }
    }

    function refreshRouter(nasname) {
        const card = $(`.router-card[data-nasname="${nasname}"]`);
        if (card.length === 0) return;
        
        card.addClass('updating');
        
        const baseUrl = window.location.protocol + '//' + window.location.host;
        $.ajax({
            url: baseUrl + '/index.php?mod=getSystemResources',
            type: 'GET', 
            data: { nasname: nasname }, 
            dataType: 'json',
            success: function(data) {
                updateRouterCard(nasname, data);
            },
            error: function(xhr, status, error) {
                console.log('AJAX Error - Status:', status);
                console.log('AJAX Error - Error:', error);
                console.log('AJAX Error - XHR:', xhr);
                console.log('AJAX Error - Response Text:', xhr.responseText);
                
                let errorMessage = 'Connection failed';
                
                if (status === 'timeout') {
                    errorMessage = 'Connection timeout - router may be unreachable';
                } else if (xhr.status === 0) {
                    errorMessage = 'Network error - check your connection';
                } else if (xhr.status === 500) {
                    errorMessage = 'Server error - check router credentials';
                } else {
                    errorMessage = 'Connection failed: ' + error;
                }
                
                $('#testResult').html('<div class="test-result error"><i class="fa fa-times-circle"></i> ' + errorMessage + '</div>');
            },
            complete: function() {
                card.removeClass('updating');
            }
        });
    }

    function refreshAllRouters() {
        $('.router-card').each(function() {
            const nasname = $(this).data('nasname');
            if(nasname) refreshRouter(nasname);
        });
    }

    // Initialize charts and start refresh cycle
    $('.router-card').each(function() {
        const nasname = $(this).data('nasname');
        if (nasname && $(this).find('.chart-container').length) {
            routerCharts[`cpu-${nasname}`] = createLiveChart(`cpu-chart-${nasname}`, 'rgb(102, 126, 234)');
            routerCharts[`memory-${nasname}`] = createLiveChart(`memory-chart-${nasname}`, 'rgb(240, 147, 251)');
        }
    });

    // Make functions globally available
    window.refreshRouter = refreshRouter;
    window.refreshAllRouters = refreshAllRouters;
    window.togglePassword = togglePassword;
    
    // Test connection function
    function testConnection() {
        console.log('Testing connection...');
        
        const routerName = $('#routerName').val();
        const routerIP = $('#routerIP').val();
        const routerUsername = $('#routerUsername').val();
        const routerPassword = $('#routerPassword').val();
        const routerPort = $('#routerPort').val();
        const routerSecret = $('#routerSecret').val();
        
        // Validate required fields
        if (!routerIP || !routerUsername || !routerPassword || !routerSecret) {
            $('#testResult').html('<div class="test-result error"><i class="fa fa-exclamation-triangle"></i> Please fill in all required fields (IP, Username, Password, RADIUS Secret)</div>').show();
            return;
        }
        
        // Show loading state
        $('#testResult').html('<div class="test-result loading"><i class="fa fa-spinner fa-spin"></i> Testing connection...</div>').show();
        
        // Test connection via AJAX
        $.ajax({
            url: 'index.php?mod=testRouterConnection',
            method: 'POST',
            data: {
                ip: routerIP,
                username: routerUsername,
                password: routerPassword,
                port: routerPort,
                secret: routerSecret
            },
            timeout: 5000, // 5 saniye timeout
            success: function(response) {
                console.log('Response received:', response);
                
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        $('#testResult').html('<div class="test-result success"><i class="fa fa-check-circle"></i> Connection successful! Router is reachable.</div>');
                    } else {
                        $('#testResult').html('<div class="test-result error"><i class="fa fa-times-circle"></i> Connection failed: ' + (result.message || 'Unknown error') + '</div>');
                    }
                } catch (e) {
                    // Check if response is already an object
                    if (typeof response === 'object' && response !== null) {
                        if (response.success) {
                            $('#testResult').html('<div class="test-result success"><i class="fa fa-check-circle"></i> Connection successful!</div>');
                        } else {
                            $('#testResult').html('<div class="test-result error"><i class="fa fa-times-circle"></i> Connection failed: ' + (response.message || 'Unknown error') + '</div>');
                        }
                    } else if (typeof response === 'string') {
                        // If response is not JSON, assume it's a success message
                        if (response.toLowerCase().includes('success') || response.toLowerCase().includes('connected')) {
                            $('#testResult').html('<div class="test-result success"><i class="fa fa-check-circle"></i> Connection successful!</div>');
                        } else {
                            $('#testResult').html('<div class="test-result error"><i class="fa fa-times-circle"></i> Connection failed: ' + response + '</div>');
                        }
                    } else {
                        $('#testResult').html('<div class="test-result error"><i class="fa fa-times-circle"></i> Connection failed: Unknown response format</div>');
                    }
                }
            },
            error: function(xhr, status, error) {
                console.log('Connection error:', status, error);
                
                let errorMessage = 'Connection failed';
                
                if (status === 'timeout') {
                    errorMessage = 'Connection timeout - router may be unreachable';
                } else if (xhr.status === 0) {
                    errorMessage = 'Network error - check your connection';
                } else if (xhr.status === 500) {
                    errorMessage = 'Server error - check router credentials';
                } else {
                    errorMessage = 'Connection failed: ' + error;
                }
                
                $('#testResult').html('<div class="test-result error"><i class="fa fa-times-circle"></i> ' + errorMessage + '</div>');
            }
        });
    }
    
    // Make testConnection function globally available
    window.testConnection = testConnection;
    
    // Initial load
    refreshAllRouters();
    
    // Additional event handlers for buttons inside IIFE
    $('#refreshAll').click(refreshAllRouters);
    
    $('#autoRefresh').click(function() {
        $(this).hide();
        $('#stopAutoRefresh').show();
        refreshAllRouters();
        autoRefreshInterval = setInterval(refreshAllRouters, REFRESH_INTERVAL);
    });
    
    $('#stopAutoRefresh').click(function() {
        $(this).hide();
        $('#autoRefresh').show();
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    });
})();

// Global event handlers - Outside IIFE
$(document).ready(function() {
    console.log('Document ready - Global handlers');
    
    // Test if buttons exist
    console.log('Refresh buttons found:', $('.refresh-single').length);
    console.log('Edit buttons found:', $('.edit-router').length);
    console.log('Delete buttons found:', $('.delete-router').length);
    
    // Refresh single router
    $(document).on('click', '.router-btn.refresh.refresh-single', function(e) { 
        e.preventDefault();
        e.stopPropagation();
        console.log('Refresh clicked for:', $(this).data('nasname'));
        console.log('Button element:', this);
        
        if (typeof window.refreshRouter === 'function') {
            window.refreshRouter($(this).data('nasname')); 
        } else {
            console.error('refreshRouter function not found');
        }
    });
    
    // Edit router functionality
    $(document).on('click', '.router-btn.edit.edit-router', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Edit router clicked');
        console.log('Button element:', this);
        
        const nasname = $(this).data('nasname');
        const shortname = $(this).data('shortname');
        const ruser = $(this).data('ruser');
        const naspassword = $(this).data('naspassword');
        const secret = $(this).data('secret');
        
        console.log('Router data:', { nasname, shortname, ruser });
        
        // Fill modal with router data
        $('#routerName').val(shortname || nasname);
        $('#routerIP').val(nasname);
        $('#routerUsername').val(ruser || '');
        $('#routerPassword').val(naspassword || '');
        $('#routerSecret').val(secret || '');
        $('#routerRadiusType').val('mikrotik'); // Default to MikroTik
        
        // Set form action for edit
        $('#routerForm').attr('action', 'index.php?mod=editRouter');
        
        // Add hidden field for old nasname
        if ($('#oldNasname').length === 0) {
            $('#routerForm').append('<input type="hidden" id="oldNasname" name="old_nasname" value="' + nasname + '">');
        } else {
            $('#oldNasname').val(nasname);
        }
        
        // Update modal title
        $('#routerModalTitle .title-text').text('Edit Router');
        
        // Show modal manually
        $('#routerModal').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
    });
    
    // Delete router functionality
    $(document).on('click', '.router-btn.delete.delete-router', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Delete router clicked');
        console.log('Button element:', this);
        
        const nasname = $(this).data('nasname');
        console.log('Deleting router:', nasname);
        
        if (confirm('Are you sure you want to delete this router?')) {
            $.ajax({
                url: 'index.php?mod=deleteRouter',
                method: 'POST',
                data: { nasname: nasname },
                success: function(response) {
                    try {
                        const result = JSON.parse(response);
                        if (result.success) {
                            location.reload();
                        } else {
                            alert('Error: ' + (result.message || 'Unknown error occurred'));
                        }
                    } catch (e) {
                        // If response is not JSON, assume success and reload
                        location.reload();
                    }
                },
                error: function() {
                    alert('An error occurred while deleting the router');
                }
            });
        }
    });
    
    // Add new router
    $(document).on('click', '.add-router-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Add router clicked');
        
        $('#routerForm')[0].reset();
        $('#routerForm').attr('action', 'index.php?mod=addRouter');
        $('#editNasname').remove();
        $('#routerModalTitle .title-text').text('Add New Router');
        
        // Show modal manually
        $('#routerModal').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
    });
    
    // Debug modal events
    $('#routerModal').on('show.bs.modal', function () {
        console.log('Modal is showing');
    });
    
    $('#routerModal').on('shown.bs.modal', function () {
        console.log('Modal is shown');
    });
    
    $('#routerModal').on('hide.bs.modal', function () {
        console.log('Modal is hiding');
    });
    
    $('#routerModal').on('hidden.bs.modal', function () {
        console.log('Modal is hidden');
    });
    
    // Test if modal can be opened manually
    console.log('Modal element exists:', $('#routerModal').length > 0);
    console.log('Bootstrap modal function exists:', typeof $('#routerModal').modal === 'function');
    
    // Router form submission
    $('#routerForm').on('submit', function(e) {
        e.preventDefault();
        const action = $(this).attr('action');
        
        // Manually collect form data to handle special characters properly
        const formData = {
            old_nasname: $('#oldNasname').val(),
            nasname: $('#routerIP').val(),
            shortname: $('#routerName').val(),
            ruser: $('#routerUsername').val(),
            naspassword: $('#routerPassword').val(),
            secret: $('#routerSecret').val(),
            description: $('#routerDescription').val(),
            port: $('#routerPort').val(),
            radius_type: $('#routerRadiusType').val()
        };
        
        // Debug: Log form data
        console.log('Form data:', formData);
        
        $.ajax({
            url: action,
            method: 'POST',
            data: formData,
            success: function(response) {
                console.log('Response:', response);
                try {
                    const result = JSON.parse(response);
                    if (result.success) {
                        $('#routerModal').modal('hide');
                        location.reload();
                    } else {
                        alert('Error: ' + (result.message || 'Unknown error occurred'));
                    }
                } catch (e) {
                    console.log('Non-JSON response:', response);
                    // If response is not JSON, assume success and reload
                    $('#routerModal').modal('hide');
                    location.reload();
                }
            },
            error: function(xhr, status, error) {
                console.log('AJAX Error:', status, error);
                console.log('Response:', xhr.responseText);
                alert('An error occurred while saving the router: ' + error);
            }
        });
    });
    
    // Test click events on router buttons
    setTimeout(function() {
        console.log('Testing button click events...');
        $('.router-btn').each(function(index) {
            console.log('Button', index, ':', this.className, 'data-nasname:', $(this).data('nasname'));
        });
    }, 1000);
});
</script> 