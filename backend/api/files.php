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

class FileAPI {
    private $db;
    private $table_name = "files";
    private $upload_dir = "../../uploads/";

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        
        // Create uploads directory if it doesn't exist
        if (!file_exists($this->upload_dir)) {
            mkdir($this->upload_dir, 0755, true);
        }
    }

    // Get user's files
    public function getUserFiles($user_id) {
        $query = "SELECT * FROM files WHERE user_id = :user_id ORDER BY upload_date DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        $files = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $files[] = $row;
        }
        
        return $files;
    }

    // Upload file
    public function uploadFile($user_id) {
        if (!isset($_FILES['file'])) {
            return ["success" => false, "message" => "No file uploaded"];
        }
        
        // Check user's storage limit
        $userQuery = "SELECT storage_limit_mb, storage_used_mb FROM users WHERE id = :user_id";
        $userStmt = $this->db->prepare($userQuery);
        $userStmt->bindParam(":user_id", $user_id);
        $userStmt->execute();
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        $file_size_mb = $_FILES['file']['size'] / (1024 * 1024);
        $new_storage_used = $user['storage_used_mb'] + $file_size_mb;
        
        if ($new_storage_used > $user['storage_limit_mb']) {
            return ["success" => false, "message" => "Storage limit exceeded"];
        }
        
        // Create user's upload directory
        $user_upload_dir = $this->upload_dir . $user_id . "/";
        if (!file_exists($user_upload_dir)) {
            mkdir($user_upload_dir, 0755, true);
        }
        
        $filename = uniqid() . "_" . basename($_FILES['file']['name']);
        $file_path = $user_upload_dir . $filename;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $file_path)) {
            // Save file info to database
            $query = "INSERT INTO files (user_id, filename, original_name, file_path, file_size, file_type) 
                      VALUES (:user_id, :filename, :original_name, :file_path, :file_size, :file_type)";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->bindParam(":filename", $filename);
            $stmt->bindParam(":original_name", $_FILES['file']['name']);
            $stmt->bindParam(":file_path", $file_path);
            $stmt->bindParam(":file_size", $_FILES['file']['size']);
            $stmt->bindParam(":file_type", $_FILES['file']['type']);
            
            if ($stmt->execute()) {
                // Update user's storage used
                $updateQuery = "UPDATE users SET storage_used_mb = :storage_used WHERE id = :user_id";
                $updateStmt = $this->db->prepare($updateQuery);
                $updateStmt->bindParam(":storage_used", $new_storage_used);
                $updateStmt->bindParam(":user_id", $user_id);
                $updateStmt->execute();
                
                return ["success" => true, "message" => "File uploaded successfully"];
            } else {
                unlink($file_path); // Remove uploaded file if DB insert failed
                return ["success" => false, "message" => "Failed to save file info"];
            }
        } else {
            return ["success" => false, "message" => "Failed to upload file"];
        }
    }

    // Delete file
    public function deleteFile($file_id, $user_id) {
        // Get file info
        $query = "SELECT * FROM files WHERE id = :file_id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":file_id", $file_id);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            return ["success" => false, "message" => "File not found"];
        }
        
        $file = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Delete physical file
        if (file_exists($file['file_path'])) {
            unlink($file['file_path']);
        }
        
        // Delete database record
        $deleteQuery = "DELETE FROM files WHERE id = :file_id";
        $deleteStmt = $this->db->prepare($deleteQuery);
        $deleteStmt->bindParam(":file_id", $file_id);
        
        if ($deleteStmt->execute()) {
            // Update user's storage used
            $file_size_mb = $file['file_size'] / (1024 * 1024);
            $updateQuery = "UPDATE users SET storage_used_mb = storage_used_mb - :file_size WHERE id = :user_id";
            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->bindParam(":file_size", $file_size_mb);
            $updateStmt->bindParam(":user_id", $user_id);
            $updateStmt->execute();
            
            return ["success" => true, "message" => "File deleted successfully"];
        } else {
            return ["success" => false, "message" => "Failed to delete file"];
        }
    }
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];
$fileAPI = new FileAPI();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$file_id = isset($_GET['file_id']) ? $_GET['file_id'] : null;

switch ($method) {
    case 'GET':
        if ($user_id) {
            $files = $fileAPI->getUserFiles($user_id);
            echo json_encode(["success" => true, "files" => $files]);
        } else {
            echo json_encode(["success" => false, "message" => "User ID required"]);
        }
        break;
        
    case 'POST':
        if ($user_id && isset($_FILES['file'])) {
            $result = $fileAPI->uploadFile($user_id);
            echo json_encode($result);
        } else {
            echo json_encode(["success" => false, "message" => "User ID and file required"]);
        }
        break;
        
    case 'DELETE':
        if ($file_id && $user_id) {
            $result = $fileAPI->deleteFile($file_id, $user_id);
            echo json_encode($result);
        } else {
            echo json_encode(["success" => false, "message" => "File ID and User ID required"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
        break;
}
?>