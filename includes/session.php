<?php
// includes/session.php — session helper untuk web + mobile

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function isLoggedIn(): bool
{
    return isset($_SESSION['user_name']) && !empty($_SESSION['user_name']);
}

function getUser(): array
{
    return [
        'name' => $_SESSION['user_name'] ?? 'Warga',
        'email' => $_SESSION['user_email'] ?? '',
        'picture' => $_SESSION['user_pic'] ?? '',
    ];
}

function setUser(string $name, string $email = '', string $picture = ''): void
{
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_pic'] = $picture;
}

function logout(): void
{
    $_SESSION = [];
    session_destroy();
}