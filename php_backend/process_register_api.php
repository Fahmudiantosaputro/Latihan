<?php
// ============================================================
// FILE INI: salin ke C:\xampp\htdocs\laporku\auth\process_register_api.php
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

require_once __DIR__ . '/../config/database.php';

$name     = trim($_POST['name']     ?? '');
$email    = trim($_POST['email']    ?? '');
$password = trim($_POST['password'] ?? '');
$confirm  = trim($_POST['confirm']  ?? '');

if (empty($name) || empty($email) || empty($password) || empty($confirm)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Semua field wajib diisi']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Format email tidak valid']);
    exit;
}
if ($password !== $confirm) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Kata sandi tidak cocok']);
    exit;
}
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Kata sandi minimal 8 karakter']);
    exit;
}

$conn = getDB();
$cek  = pg_query_params($conn, "SELECT id FROM users WHERE email = $1", [$email]);
if (pg_num_rows($cek) > 0) {
    http_response_code(409);
    echo json_encode(['status' => 'error', 'message' => 'Email sudah terdaftar']);
    exit;
}

$base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
$base = substr($base, 0, 15);
do {
    $username = $base . rand(100, 9999);
    $cekU = pg_query_params($conn, "SELECT id FROM users WHERE username = $1", [$username]);
} while (pg_num_rows($cekU) > 0);

$hashed = password_hash($password, PASSWORD_BCRYPT);
$res = pg_query_params($conn,
    "INSERT INTO users (name, username, email, password) VALUES ($1,$2,$3,$4) RETURNING id, name, email",
    [$name, $username, $email, $hashed]
);

if (!$res || pg_num_rows($res) === 0) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan data']);
    exit;
}

$u = pg_fetch_assoc($res);
echo json_encode(['status' => 'success', 'name' => $u['name'], 'email' => $u['email']]);
