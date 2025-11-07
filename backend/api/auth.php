<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Initialize data directory if it doesn't exist
if(!file_exists('../../data')) {
    mkdir('../../data', 0777, true);
}

if(!file_exists('../../data/users.json')) {
    // Create default admin user
    $defaultUsers = [
        [
            'id' => 'admin',
            'username' => 'admin',
            'password' => 'admin123',
            'name' => 'System Administrator',
            'email' => 'admin@wmsu-research.com',
            'role' => 'admin',
            'subdomain' => 'admin',
            'plan' => 'admin',
            'storageLimit' => 0,
            'status' => 'active',
            'accountCreated' => date('Y-m-d'),
            'storageUsed' => 0
        ]
    ];
    file_put_contents('../../data/users.json', json_encode($defaultUsers));
}

$data = json_decode(file_get_contents("php://input"));

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(isset($data->action) && $data->action == 'login') {
        $username = $data->username;
        $password = $data->password;
        
        $users = json_decode(file_get_contents('../../data/users.json'), true) ?? [];
        
        // Check admin user first
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
            exit;
        }
        
        // Check client users
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
?>