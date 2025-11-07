<?php
$host = "localhost";
$dbname = "u926749960_portal_db";
$username = "u926749960_portal_db";
$password = "WMSU_Portal2025";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    echo "✅ SUCCESS: Connected to Hostinger database using localhost!";
} catch(PDOException $e) {
    echo "❌ FAILED: " . $e->getMessage();
}
?>