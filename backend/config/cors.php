<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
    // Perhatikan port 5173 di sini
    'allowed_origins' => [
        'http://localhost:5173', 
        'http://127.0.0.1:5173', 
    ],

    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    // WAJIB: Agar Sanctum bisa mengirim dan menerima token
    'supports_credentials' => true, 
];