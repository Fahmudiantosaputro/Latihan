<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = trim($_POST['password'] ?? '');

if (!$username || !$password) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Username dan password wajib diisi'
    ]);
    exit;
}

$conn = getDB();

$query = "
SELECT id, name, email, username, password, avatar, is_active
FROM users
WHERE email = $1 OR username = $1
LIMIT 1
";

$res = pg_query_params($conn, $query, [$username]);

if (!$res) {
    echo json_encode([
        'status' => 'error',
        'message' => pg_last_error($conn)
    ]);
    exit;
}

$user = pg_fetch_assoc($res);

if (!$user) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User tidak ditemukan'
    ]);
    exit;
}

if ($user['is_active'] === 'f') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Akun tidak aktif'
    ]);
    exit;
}

if (!password_verify($password, $user['password'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Password salah'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'name' => $user['name'],
    'email' => $user['email'],
    'picture' => $user['avatar'] ?? ''
]);