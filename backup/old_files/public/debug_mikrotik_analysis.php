<?php
// Enable full error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Basic autoloader for our classes
spl_autoload_register(function ($class) {
    // project-specific namespace prefix
    $prefix = 'App\\';

    // base directory for the namespace prefix
    $base_dir = __DIR__ . '/../src/';

    // does the class use the namespace prefix?
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        // no, move to the next registered autoloader
        return;
    }

    // get the relative class name
    $relative_class = substr($class, $len);

    // replace the namespace prefix with the base directory, replace namespace
    // separators with directory separators in the relative class name, append
    // with .php
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    // if the file exists, require it
    if (file_exists($file)) {
        require $file;
    }
});

// Include the RouterOS API class separately as it's not namespaced
require_once __DIR__ . '/../src/Services/Mikrotik/RouterosAPI.php';

use App\Models\NasModel;

// Set headers for better output
header('Content-Type: text/html; charset=utf-8');

echo '<!DOCTYPE html><html><head><title>Mikrotik Connection Analysis</title>';
echo '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">';
echo '<style>body { padding: 20px; font-family: monospace; } .card { margin-bottom: 20px; } .success { color: #28a745; } .failure { color: #dc3545; } pre { white-space: pre-wrap; word-wrap: break-word; background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #dee2e6;} </style>';
echo '</head><body><div class="container">';
echo '<h1 class="mb-4">Mikrotik Connection Analysis</h1>';

try {
    // Get all NAS devices from the database
    $nasModel = new NasModel();
    $nasList = $nasModel->getAllNas();

    if (empty($nasList)) {
        echo '<div class="alert alert-warning">No NAS devices found in the database.</div>';
        exit;
    }

    echo '<p class="lead">Found ' . count($nasList) . ' NAS devices. Testing connection for each...</p>';

    foreach ($nasList as $nas) {
        $ip = $nas['nasname'];
        $username = $nas['ruser'] ?? 'admin';
        $password = $nas['naspassword']; // Assuming this is the correct column name from your DB
        $shortname = $nas['shortname'] ?? 'N/A';

        echo "<div class='card'>";
        echo "<div class='card-header'><strong>Testing NAS:</strong> " . htmlspecialchars($shortname) . " (<code>" . htmlspecialchars($ip) . "</code>)</div>";
        echo "<div class='card-body'>";
        echo "<p><strong>Credentials:</strong> User=<code>" . htmlspecialchars($username) . "</code>, Password=<code>" . str_repeat('*', strlen($password)) . "</code></p>";
        
        $api = new RouterosAPI();
        $api->ssl = true; // Use API-SSL
        $api->port = 8729; // Default SSL port
        $api->debug = true; // Enable debug mode to see all communication
        $api->timeout = 5;      // Set a reasonable timeout for testing
        $api->attempts = 1;     // We only need one attempt for a clear debug log

        // Start capturing output buffer to catch debug messages
        ob_start();

        if ($api->connect($ip, $username, $password)) {
            echo '<h5 class="success">✅ SUCCESS: Connected successfully!</h5>';
            $resources = $api->comm('/system/resource/print');
            if (isset($resources[0])) {
                 echo "<strong>RouterOS Version:</strong> " . htmlspecialchars($resources[0]['version'] ?? 'N/A') . "<br>";
                 echo "<strong>Uptime:</strong> " . htmlspecialchars($resources[0]['uptime'] ?? 'N/A') . "<br>";
                 echo "<strong>Board Name:</strong> " . htmlspecialchars($resources[0]['board-name'] ?? 'N/A') . "<br>";
            }
            $api->disconnect();
        } else {
            echo '<h5 class="failure">❌ FAILED: Could not connect.</h5>';
            if (!empty($api->error_no) || !empty($api->error_str)) {
                echo "<h6>Connection Error Details:</h6>";
                echo "<pre class=\"failure\">";
                echo "Error No: " . htmlspecialchars($api->error_no) . "\n";
                echo "Error String: " . htmlspecialchars($api->error_str);
                echo "</pre>";
            }
        }

        // Get the debug output
        $debug_output = ob_get_contents();
        ob_end_clean();

        if (!empty($debug_output)) {
             echo "<h6>Debug Log:</h6>";
             echo "<pre>" . htmlspecialchars($debug_output) . "</pre>";
        }
        
        echo "</div></div>";
    }

} catch (Exception $e) {
    echo '<div class="alert alert-danger">An unexpected error occurred: ' . $e->getMessage() . '</div>';
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo '</div></body></html>'; 