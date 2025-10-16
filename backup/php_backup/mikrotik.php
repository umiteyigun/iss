<?php

// config/mikrotik.php

return [
    'api_user' => getenv('MIKROTIK_API_USER') ?: 'admin',
    'api_password' => getenv('MIKROTIK_API_PASSWORD') ?: 'As081316+a',
]; 