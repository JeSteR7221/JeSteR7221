<?php
require_once __DIR__ . '/config.php';

$appointmentsCollection = $db->appointments;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all appointments
    $appointments = $appointmentsCollection->find([], ['projection' => ['_id' => 0]])->toArray();
    sendResponse($appointments);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new appointment
    $data = getRequestData();
    
    // Validation
    if (empty($data['name']) || empty($data['phone']) || empty($data['email']) || empty($data['date'])) {
        sendResponse(['error' => 'Tüm zorunlu alanları doldurun'], 400);
    }
    
    // Email validation
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Geçerli bir e-posta adresi girin'], 400);
    }
    
    $appointment = [
        'id' => uniqid('apt_', true),
        'name' => $data['name'],
        'phone' => $data['phone'],
        'email' => $data['email'],
        'date' => $data['date'],
        'message' => $data['message'] ?? '',
        'timestamp' => date('c'),
        'status' => 'pending'
    ];
    
    try {
        $result = $appointmentsCollection->insertOne($appointment);
        sendResponse($appointment, 201);
    } catch (Exception $e) {
        sendResponse(['error' => 'Randevu oluşturulamadı: ' . $e->getMessage()], 500);
    }
}
?>