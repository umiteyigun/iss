<?php 
$user = $viewData['user']; 
$history = $viewData['history'];
$page = $viewData['page'];
$pageSize = $viewData['pageSize'];
$totalRecords = $viewData['totalRecords'];
$totalPages = ceil($totalRecords / $pageSize);

function formatBytes($bytes, $precision = 2) { 
    $units = array('B', 'KB', 'MB', 'GB', 'TB'); 

    $bytes = max($bytes, 0); 
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024)); 
    $pow = min($pow, count($units) - 1); 

    $bytes /= (1 << (10 * $pow)); 

    return round($bytes, $precision) . ' ' . $units[$pow]; 
} 

function formatSeconds($seconds) {
    $h = floor($seconds / 3600);
    $m = floor(($seconds % 3600) / 60);
    $s = $seconds % 60;
    return sprintf('%02d:%02d:%02d', $h, $m, $s);
}
?>

<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header">
                <h3 class="box-title">Connection History for <?php echo htmlspecialchars($user['username']); ?></h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Start Time</th>
                            <th>Stop Time</th>
                            <th>Duration</th>
                            <th>IP Address</th>
                            <th>NAS IP</th>
                            <th>MAC Address</th>
                            <th>Download</th>
                            <th>Upload</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php if (empty($history)): ?>
                        <tr>
                            <td colspan="8" class="text-center">No connection history found.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($history as $record): ?>
                            <tr>
                                <td><?php echo htmlspecialchars(date('Y-m-d H:i', strtotime($record['acctstarttime']))); ?></td>
                                <td>
                                    <?php if (empty($record['acctstoptime'])): ?>
                                        <span class="label label-success">Online</span>
                                    <?php else: ?>
                                        <?php echo htmlspecialchars(date('Y-m-d H:i', strtotime($record['acctstoptime']))); ?>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo htmlspecialchars(formatSeconds($record['acctsessiontime'])); ?></td>
                                <td><?php echo htmlspecialchars($record['framedipaddress']); ?></td>
                                <td><?php echo htmlspecialchars($record['nasipaddress']); ?></td>
                                <td><?php echo htmlspecialchars($record['callingstationid']); ?></td>
                                <td><?php echo htmlspecialchars(formatBytes($record['acctoutputoctets'])); ?></td>
                                <td><?php echo htmlspecialchars(formatBytes($record['acctinputoctets'])); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
            <div class="box-footer clearfix">
                <ul class="pagination pagination-sm no-margin pull-right">
                    <?php if ($page > 1): ?>
                        <li><a href="?mod=history&username=<?php echo $user['username']; ?>&p=<?php echo $page - 1; ?>">«</a></li>
                    <?php endif; ?>

                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                        <li class="<?php echo ($i == $page) ? 'active' : ''; ?>"><a href="?mod=history&username=<?php echo $user['username']; ?>&p=<?php echo $i; ?>"><?php echo $i; ?></a></li>
                    <?php endfor; ?>
                    
                    <?php if ($page < $totalPages): ?>
                        <li><a href="?mod=history&username=<?php echo $user['username']; ?>&p=<?php echo $page + 1; ?>">»</a></li>
                    <?php endif; ?>
                </ul>
            </div>
        </div>
    </div>
</div> 