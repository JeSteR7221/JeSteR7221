<?php
require_once __DIR__ . '/config.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$uri = parse_url($requestUri, PHP_URL_PATH);
$uri = str_replace('/api', '', $uri);

// Route handling
if ($uri === '/' && $requestMethod === 'GET') {
    sendResponse(['message' => 'Diş Hekimi Web Sitesi API']);
}

// Appointments Routes
if (preg_match('/^\/appointments\/?$/', $uri)) {
    require_once __DIR__ . '/appointments.php';
    exit();
}

// Contact Routes
if (preg_match('/^\/contact\/?$/', $uri)) {
    require_once __DIR__ . '/contact.php';
    exit();
}

// 404 Not Found
http_response_code(404);
sendResponse(['error' => 'Endpoint not found']);
?>