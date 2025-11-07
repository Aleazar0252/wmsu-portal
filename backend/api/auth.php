<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// For demo purposes, we'll use a simple JSON file as database
// In production, replace with actual database calls

$data = json_decode(file_get_contents("php://input"));

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(isset($data->action) && $data->action == 'login') {
        $username = $data->username;
        $password = $data->password;
        
        // For demo - in production, use proper password hashing
        if($username == 'admin' && $password == 'admin123') {
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => "admin",
                    "name" => "System Administrator",
                    "username" => "admin",
                    "role" => "admin",
                    "email" => "admin@wmsu-research.com"
                ]
            ]);
        } else {
            // Check client users
            $users = json_decode(file_get_contents('../../data/users.json'), true) ?? [];
            $user = array_filter($users, function($u) use ($username, $password) {
                return $u['username'] == $username && $u['password'] == $password && $u['status'] == 'active';
            });
            
            if(count($user) > 0) {
                $user = array_values($user)[0];
                echo json_encode([
                    "success" => true,
                    "user" => [
                        "id" => $user['id'],
                        "name" => $user['name'],
                        "username" => $user['username'],
                        "role" => "client",
                        "email" => $user['email'],
                        "storageLimit" => $user['storageLimit'],
                        "storageUsed" => $user['storageUsed'] ?? 0
                    ]
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid username or password"
                ]);
            }
        }
    }
}
?>