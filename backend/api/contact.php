<?php
require_once __DIR__ . '/config.php';

$contactsCollection = $db->contacts;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all contacts
    $contacts = $contactsCollection->find([], ['projection' => ['_id' => 0]])->toArray();
    sendResponse($contacts);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new contact message
    $data = getRequestData();
    
    // Validation
    if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
        sendResponse(['error' => 'Tüm alanları doldurun'], 400);
    }
    
    // Email validation
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Geçerli bir e-posta adresi girin'], 400);
    }
    
    $contact = [
        'id' => uniqid('cnt_', true),
        'name' => $data['name'],
        'email' => $data['email'],
        'message' => $data['message'],
        'timestamp' => date('c')
    ];
    
    try {
        $result = $contactsCollection->insertOne($contact);
        sendResponse($contact, 201);
    } catch (Exception $e) {
        sendResponse(['error' => 'Mesaj gönderilemedi: ' . $e->getMessage()], 500);
    }
}
?>