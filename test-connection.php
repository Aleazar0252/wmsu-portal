<?php
header('Content-Type: application/json');

try {
    $host = "srv1981.hstgr.io";
    $db_name = "u926749960_portal_db";
    $username = "u926749960_wmsuportal";
    $password = "Wmsu_portal2025";
    
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful!',
        'database' => $db_name
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Connection failed: ' . $e->getMessage()
    ]);
}
?>