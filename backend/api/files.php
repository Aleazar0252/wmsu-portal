<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once 'auth.php';

class FileManager {
    private $conn;
    private $auth;
    private $upload_dir = "../uploads/";
    private $table_files = "files";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->auth = new Auth();
        
        // Create uploads directory if it doesn't exist
        if (!file_exists($this->upload_dir)) {
            mkdir($this->upload_dir, 0777, true);
        }
    }

    private function validateClient($token) {
        $user = $this->auth->validateToken($token);
        return $user && ($user['role'] === 'client' || $user['role'] === 'admin');
    }

    public function uploadFiles($files) {
        if (!$this->validateClient($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        $uploaded_files = [];
        $errors = [];

        foreach ($files['files']['tmp_name'] as $key => $tmp_name) {
            $filename = basename($files['files']['name'][$key]);
            $filepath = $this->upload_dir . $filename;
            
            // Security checks
            if (file_exists($filepath)) {
                $errors[] = "File {$filename} already exists";
                continue;
            }
            
            if ($files['files']['size'][$key] > 50 * 1024 * 1024) { // 50MB limit
                $errors[] = "File {$filename} is too large";
                continue;
            }
            
            $allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'];
            $file_extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            
            if (!in_array($file_extension, $allowed_types)) {
                $errors[] = "File type {$file_extension} not allowed for {$filename}";
                continue;
            }
            
            if (move_uploaded_file($tmp_name, $filepath)) {
                $uploaded_files[] = $filename;
                $this->logFileUpload($filename);
            } else {
                $errors[] = "Failed to upload {$filename}";
            }
        }

        if (count($errors) > 0) {
            return ['success' => false, 'error' => implode(', ', $errors)];
        }

        return ['success' => true, 'message' => 'Files uploaded successfully', 'files' => $uploaded_files];
    }

    public function getFiles() {
        if (!$this->validateClient($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        $files = [];
        if ($handle = opendir($this->upload_dir)) {
            while (false !== ($entry = readdir($handle))) {
                if ($entry != "." && $entry != ".." && is_file($this->upload_dir . $entry)) {
                    $filepath = $this->upload_dir . $entry;
                    $files[] = [
                        'name' => $entry,
                        'size' => $this->formatSize(filesize($filepath)),
                        'modified' => date("Y-m-d H:i:s", filemtime($filepath))
                    ];
                }
            }
            closedir($handle);
        }

        return ['success' => true, 'files' => $files];
    }

    public function deleteFile($filename) {
        if (!$this->validateClient($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        $filepath = $this->upload_dir . $filename;
        
        if (!file_exists($filepath)) {
            return ['success' => false, 'error' => 'File not found'];
        }
        
        if (unlink($filepath)) {
            return ['success' => true, 'message' => 'File deleted successfully'];
        } else {
            return ['success' => false, 'error' => 'Failed to delete file'];
        }
    }

    public function downloadFile($filename) {
        if (!$this->validateClient($this->getBearerToken())) {
            http_response_code(401);
            exit;
        }

        $filepath = $this->upload_dir . $filename;
        
        if (file_exists($filepath)) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="'.basename($filepath).'"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($filepath));
            readfile($filepath);
            exit;
        }
    }

    private function logFileUpload($filename) {
        try {
            $user = $this->auth->validateToken($this->getBearerToken());
            $query = "INSERT INTO file_logs (user_id, filename, uploaded_at) VALUES (:user_id, :filename, NOW())";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user['user_id']);
            $stmt->bindParam(':filename', $filename);
            $stmt->execute();
        } catch (Exception $e) {
            // Log error but don't fail the upload
            error_log("Failed to log file upload: " . $e->getMessage());
        }
    }

    private function formatSize($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
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
$fileManager = new FileManager();

if (isset($_GET['download'])) {
    $fileManager->downloadFile($_GET['download']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        if (isset($_FILES['files'])) {
            $result = $fileManager->uploadFiles($_FILES);
            echo json_encode($result);
        } else {
            echo json_encode(['success' => false, 'error' => 'No files uploaded']);
        }
        break;
        
    case 'GET':
        $result = $fileManager->getFiles();
        echo json_encode($result);
        break;
        
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $fileManager->deleteFile($data['filename']);
        echo json_encode($result);
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
?>