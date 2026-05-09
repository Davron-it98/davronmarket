<?php
// save_resume.php — серверная обработка анкет
header('Content-Type: application/json; charset=utf-8');

// --- Настройки подключения к БД ---
$DB_HOST = 'localhost';
$DB_NAME = 'davronmarket';
$DB_USER = 'dbuser'; // ← замените на своего пользователя
$DB_PASS = 'dbpass'; // ← замените на свой пароль

// --- Проверка авторизации (пример: cookie или session) ---
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'msg' => 'Требуется авторизация']);
    exit;
}
$user_id = $_SESSION['user_id'];

// --- Получение и валидация данных ---
$data = json_decode(file_get_contents('php://input'), true);
$required = ['name','phone','email','city','contact','position','experience','about'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'msg' => 'Заполните все поля']);
        exit;
    }
}

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $stmt = $pdo->prepare("INSERT INTO resumes (user_id, name, phone, email, city, contact, position, experience, about, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([
        $user_id,
        $data['name'], $data['phone'], $data['email'],
        $data['city'], $data['contact'], $data['position'],
        $data['experience'], $data['about']
    ]);
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => 'Ошибка сервера: ' . $e->getMessage()]);
}
