<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    $database = new Database();
    $db = $database->getConnection();
    
    $username = $data->username;
    $password = $data->password;
    
    $query = "SELECT id, username, password, name, email, role, subdomain, plan, 
                     storage_limit_mb, storage_used_mb, status, account_created 
              FROM users WHERE username = :username AND status = 'active'";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $username);
    $stmt->execute();
    
    if ($stmt->rowCount() == 1) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($password, $user['password'])) {
            // Update last login
            $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(":id", $user['id']);
            $updateStmt->execute();
            
            // Remove password from response
            unset($user['password']);
            
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "user" => $user,
                "token" => base64_encode($user['id'] . ":" . $user['username'])
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid credentials"]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "User not found"]);
    }
}
?>