<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// MongoDB Connection
require_once __DIR__ . '/../../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$mongoUrl = $_ENV['MONGO_URL'] ?? 'mongodb://localhost:27017';
$dbName = $_ENV['DB_NAME'] ?? 'test_database';

try {
    $client = new MongoDB\Client($mongoUrl);
    $db = $client->selectDatabase($dbName);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function getRequestData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}
?>