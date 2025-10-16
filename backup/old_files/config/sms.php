<?php

// config/sms.php

return [
    'username' => getenv('SMS_API_USERNAME') ?: 'YOUR_SMS_API_USERNAME',
    'password' => getenv('SMS_API_PASSWORD') ?: 'YOUR_SMS_API_PASSWORD',
    'from' => getenv('SMS_API_FROM') ?: 'DEFAULT_SENDER', // Default sender name/number
]; 