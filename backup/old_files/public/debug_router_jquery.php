<?php
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/controllers/RouterController.php';
require_once __DIR__ . '/../src/models/NasModel.php';

// Router controller'ı çalıştır
$controller = new \App\Controllers\RouterController();
$controller->show();
?> 