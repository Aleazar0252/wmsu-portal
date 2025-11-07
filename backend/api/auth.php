<?php
header('Content-Type: application/json');
require_once '../config/database.php';

class Auth {
    private $conn;
    private $table_users = "users";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    private function verifyPassword($input, $hash) {
        return password_verify($input, $hash);
    }

    private function generateToken($user_id, $username, $role) {
        $payload = [
            'user_id' => $user_id,
            'username' => $username,
            'role' => $role,
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ];
        
        // Simple token generation (in production, use JWT)
        return base64_encode(json_encode($payload));
    }

    public function login($username, $password, $type) {
        try {
            $query = "SELECT id, username, password, role FROM " . $this->table_users . " 
                     WHERE username = :username AND role = :role AND status = 'active'";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':role', $type);
            $stmt->execute();

            if ($stmt->rowCount() == 1) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($this->verifyPassword($password, $row['password'])) {
                    $token = $this->generateToken($row['id'], $row['username'], $row['role']);
                    
                    return [
                        'success' => true,
                        'token' => $token,
                        'user' => [
                            'id' => $row['id'],
                            'username' => $row['username'],
                            'role' => $row['role']
                        ]
                    ];
                }
            }
            
            return ['success' => false, 'error' => 'Invalid credentials'];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function logout() {
        return ['success' => true, 'message' => 'Logged out successfully'];
    }

    public function validateToken($token) {
        try {
            $decoded = json_decode(base64_decode($token), true);
            
            if (!$decoded || !isset($decoded['exp']) || $decoded['exp'] < time()) {
                return false;
            }
            
            return $decoded;
        } catch (Exception $e) {
            return false;
        }
    }
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];
$auth = new Auth();

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['username']) && isset($data['password']) && isset($data['type'])) {
            $result = $auth->login($data['username'], $data['password'], $data['type']);
            echo json_encode($result);
        } else {
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        }
        break;
        
    case 'DELETE':
        echo json_encode($auth->logout());
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
?>