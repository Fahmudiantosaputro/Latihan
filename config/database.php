<?php

define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'laporku');
define('DB_USER', 'postgres');
define('DB_PASS', 'fahmud');

function getDB()
{
    static $conn = null;

    if ($conn === null) {
        $conn = pg_connect(
            "host=" . DB_HOST .
            " port=" . DB_PORT .
            " dbname=" . DB_NAME .
            " user=" . DB_USER .
            " password=" . DB_PASS
        );

        if (!$conn) {
            http_response_code(500);
            header('Content-Type: application/json');
            die(json_encode([
                "status" => "error",
                "message" => "Koneksi PostgreSQL gagal"
            ]));
        }
    }

    return $conn;
}