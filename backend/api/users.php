<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once 'auth.php';

class UserManager {
    private $conn;
    private $table_users = "users";
    private $auth;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->auth = new Auth();
    }

    private function validateAdmin($token) {
        $user = $this->auth->validateToken($token);
        return $user && $user['role'] === 'admin';
    }

    public function createClient($userData) {
        if (!$this->validateAdmin($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        try {
            // Check if username exists
            $check_query = "SELECT id FROM " . $this->table_users . " WHERE username = :username";
            $check_stmt = $this->conn->prepare($check_query);
            $check_stmt->bindParam(':username', $userData['username']);
            $check_stmt->execute();

            if ($check_stmt->rowCount() > 0) {
                return ['success' => false, 'error' => 'Username already exists'];
            }

            $query = "INSERT INTO " . $this->table_users . " 
                     (name, username, password, email, role, created_at) 
                     VALUES (:name, :username, :password, :email, 'client', NOW())";
            
            $stmt = $this->conn->prepare($query);
            
            $password_hash = password_hash($userData['password'], PASSWORD_DEFAULT);
            
            $stmt->bindParam(':name', $userData['name']);
            $stmt->bindParam(':username', $userData['username']);
            $stmt->bindParam(':password', $password_hash);
            $stmt->bindParam(':email', $userData['email']);
            
            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'Client created successfully'];
            } else {
                return ['success' => false, 'error' => 'Failed to create client'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getClients() {
        if (!$this->validateAdmin($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        try {
            $query = "SELECT id, name, username, email, created_at FROM " . $this->table_users . " 
                     WHERE role = 'client' AND status = 'active' ORDER BY created_at DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $clients = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $clients[] = $row;
            }
            
            return ['success' => true, 'clients' => $clients];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function deleteClient($user_id) {
        if (!$this->validateAdmin($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        try {
            $query = "UPDATE " . $this->table_users . " SET status = 'inactive' WHERE id = :id AND role = 'client'";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $user_id);
            
            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'Client deleted successfully'];
            } else {
                return ['success' => false, 'error' => 'Failed to delete client'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    private function getBearerToken() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];
$userManager = new UserManager();

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $userManager->createClient($data);
        echo json_encode($result);
        break;
        
    case 'GET':
        $result = $userManager->getClients();
        echo json_encode($result);
        break;
        
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $userManager->deleteClient($data['user_id']);
        echo json_encode($result);
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
?>