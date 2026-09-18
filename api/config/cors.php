<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'))))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Idempotency-Key', 'X-Requested-With'],
    'exposed_headers' => ['Idempotent-Replay', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    'max_age' => 600,
    'supports_credentials' => false,
];
