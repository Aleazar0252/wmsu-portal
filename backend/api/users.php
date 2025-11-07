<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$data = json_decode(file_get_contents("php://input"));

// Initialize data files if they don't exist
if(!file_exists('../../data')) {
    mkdir('../../data', 0777, true);
}

if(!file_exists('../../data/users.json')) {
    file_put_contents('../../data/users.json', json_encode([]));
}

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(isset($data->action)) {
        $users = json_decode(file_get_contents('../../data/users.json'), true);
        
        switch($data->action) {
            case 'create':
                $newUser = [
                    'id' => uniqid(),
                    'name' => $data->name,
                    'email' => $data->email,
                    'username' => $data->username,
                    'password' => $data->password,
                    'subdomain' => $data->subdomain,
                    'plan' => $data->plan,
                    'storageLimit' => $data->storageLimit,
                    'status' => 'active',
                    'accountCreated' => date('Y-m-d'),
                    'storageUsed' => 0
                ];
                
                $users[] = $newUser;
                file_put_contents('../../data/users.json', json_encode($users));
                
                echo json_encode(["success" => true, "user" => $newUser]);
                break;
                
            case 'get_all':
                echo json_encode(["success" => true, "users" => $users]);
                break;
                
            case 'update':
                $userIndex = array_search($data->id, array_column($users, 'id'));
                if($userIndex !== false) {
                    if(isset($data->name)) $users[$userIndex]['name'] = $data->name;
                    if(isset($data->email)) $users[$userIndex]['email'] = $data->email;
                    if(isset($data->password)) $users[$userIndex]['password'] = $data->password;
                    if(isset($data->plan)) $users[$userIndex]['plan'] = $data->plan;
                    if(isset($data->storageLimit)) $users[$userIndex]['storageLimit'] = $data->storageLimit;
                    if(isset($data->status)) $users[$userIndex]['status'] = $data->status;
                    
                    file_put_contents('../../data/users.json', json_encode($users));
                    echo json_encode(["success" => true, "user" => $users[$userIndex]]);
                } else {
                    echo json_encode(["success" => false, "message" => "User not found"]);
                }
                break;
                
            case 'delete':
                $users = array_filter($users, function($user) use ($data) {
                    return $user['id'] != $data->id;
                });
                file_put_contents('../../data/users.json', json_encode(array_values($users)));
                echo json_encode(["success" => true]);
                break;
        }
    }
}
?>