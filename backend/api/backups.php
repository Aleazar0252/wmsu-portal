<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

class BackupAPI {
    private $db;
    private $table_name = "database_backups";
    private $backup_dir = "../../backups/";

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        
        // Create backups directory if it doesn't exist
        if (!file_exists($this->backup_dir)) {
            mkdir($this->backup_dir, 0755, true);
        }
    }

    // Get user's backups
    public function getUserBackups($user_id) {
        $query = "SELECT * FROM database_backups WHERE user_id = :user_id ORDER BY backup_date DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        $backups = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $backups[] = $row;
        }
        
        return $backups;
    }

    // Create backup
    public function createBackup($user_id, $backup_name) {
        $filename = $user_id . "_" . date('Y-m-d_H-i-s') . ".sql";
        $file_path = $this->backup_dir . $filename;
        
        // In a real implementation, you would generate actual SQL backup
        // For now, we'll create a placeholder file
        $backup_content = "-- Database Backup for user: $user_id\n-- Date: " . date('Y-m-d H:i:s') . "\n";
        
        if (file_put_contents($file_path, $backup_content)) {
            $file_size = filesize($file_path);
            
            $query = "INSERT INTO database_backups (user_id, backup_name, backup_path, backup_size) 
                      VALUES (:user_id, :backup_name, :backup_path, :backup_size)";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->bindParam(":backup_name", $backup_name);
            $stmt->bindParam(":backup_path", $file_path);
            $stmt->bindParam(":backup_size", $file_size);
            
            if ($stmt->execute()) {
                return ["success" => true, "message" => "Backup created successfully"];
            } else {
                unlink($file_path);
                return ["success" => false, "message" => "Failed to save backup info"];
            }
        } else {
            return ["success" => false, "message" => "Failed to create backup file"];
        }
    }

    // Delete backup
    public function deleteBackup($backup_id, $user_id) {
        // Get backup info
        $query = "SELECT * FROM database_backups WHERE id = :backup_id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":backup_id", $backup_id);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            return ["success" => false, "message" => "Backup not found"];
        }
        
        $backup = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Delete physical file
        if (file_exists($backup['backup_path'])) {
            unlink($backup['backup_path']);
        }
        
        // Delete database record
        $deleteQuery = "DELETE FROM database_backups WHERE id = :backup_id";
        $deleteStmt = $this->db->prepare($deleteQuery);
        $deleteStmt->bindParam(":backup_id", $backup_id);
        
        if ($deleteStmt->execute()) {
            return ["success" => true, "message" => "Backup deleted successfully"];
        } else {
            return ["success" => false, "message" => "Failed to delete backup"];
        }
    }
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];
$backupAPI = new BackupAPI();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$backup_id = isset($_GET['backup_id']) ? $_GET['backup_id'] : null;

switch ($method) {
    case 'GET':
        if ($user_id) {
            $backups = $backupAPI->getUserBackups($user_id);
            echo json_encode(["success" => true, "backups" => $backups]);
        } else {
            echo json_encode(["success" => false, "message" => "User ID required"]);
        }
        break;
        
    case 'POST':
        if ($user_id) {
            $data = json_decode(file_get_contents("php://input"));
            $backup_name = isset($data->backup_name) ? $data->backup_name : "Manual Backup";
            $result = $backupAPI->createBackup($user_id, $backup_name);
            echo json_encode($result);
        } else {
            echo json_encode(["success" => false, "message" => "User ID required"]);
        }
        break;
        
    case 'DELETE':
        if ($backup_id && $user_id) {
            $result = $backupAPI->deleteBackup($backup_id, $user_id);
            echo json_encode($result);
        } else {
            echo json_encode(["success" => false, "message" => "Backup ID and User ID required"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
        break;
}
?>