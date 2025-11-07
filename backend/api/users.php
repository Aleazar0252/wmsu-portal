<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/database.php';

class UserAPI {
    private $db;
    private $table_name = "users";

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Get all clients (for admin)
    public function getClients() {
        $query = "SELECT id, username, name, email, subdomain, plan, 
                         storage_limit_mb, storage_used_mb, status, 
                         account_created, last_login 
                  FROM users WHERE role = 'client' ORDER BY account_created DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = $row;
        }
        
        return $users;
    }

    // Create new client
    public function createClient($data) {
        // Check if username or subdomain exists
        $checkQuery = "SELECT id FROM users WHERE username = :username OR subdomain = :subdomain";
        $checkStmt = $this->db->prepare($checkQuery);
        $checkStmt->bindParam(":username", $data->username);
        $checkStmt->bindParam(":subdomain", $data->subdomain);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            return ["success" => false, "message" => "Username or subdomain already exists"];
        }
        
        $query = "INSERT INTO users 
                  (username, password, name, email, subdomain, plan, storage_limit_mb) 
                  VALUES 
                  (:username, :password, :name, :email, :subdomain, :plan, :storage_limit)";
        
        $stmt = $this->db->prepare($query);
        $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
        
        $stmt->bindParam(":username", $data->username);
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":subdomain", $data->subdomain);
        $stmt->bindParam(":plan", $data->plan);
        $stmt->bindParam(":storage_limit", $data->storage_limit);
        
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Client created successfully"];
        } else {
            return ["success" => false, "message" => "Failed to create client"];
        }
    }

    // Update client
    public function updateClient($id, $data) {
        $query = "UPDATE users SET 
                  name = :name, 
                  email = :email, 
                  plan = :plan, 
                  storage_limit_mb = :storage_limit,
                  status = :status 
                  WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":plan", $data->plan);
        $stmt->bindParam(":storage_limit", $data->storage_limit);
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Client updated successfully"];
        } else {
            return ["success" => false, "message" => "Failed to update client"];
        }
    }

    // Delete client
    public function deleteClient($id) {
        // First delete client's files and backups
        $deleteFiles = "DELETE FROM files WHERE user_id = :user_id";
        $stmt1 = $this->db->prepare($deleteFiles);
        $stmt1->bindParam(":user_id", $id);
        $stmt1->execute();
        
        $deleteBackups = "DELETE FROM database_backups WHERE user_id = :user_id";
        $stmt2 = $this->db->prepare($deleteBackups);
        $stmt2->bindParam(":user_id", $id);
        $stmt2->execute();
        
        // Then delete user
        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            return ["success" => true, "message" => "Client deleted successfully"];
        } else {
            return ["success" => false, "message" => "Failed to delete client"];
        }
    }
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];
$userAPI = new UserAPI();

switch ($method) {
    case 'GET':
        $users = $userAPI->getClients();
        echo json_encode(["success" => true, "users" => $users]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $result = $userAPI->createClient($data);
        echo json_encode($result);
        break;
        
    case 'PUT':
        parse_str(file_get_contents("php://input"), $put_vars);
        $data = json_decode($put_vars['data']);
        $id = $put_vars['id'];
        $result = $userAPI->updateClient($id, $data);
        echo json_encode($result);
        break;
        
    case 'DELETE':
        parse_str(file_get_contents("php://input"), $delete_vars);
        $id = $delete_vars['id'];
        $result = $userAPI->deleteClient($id);
        echo json_encode($result);
        break;
}
?>