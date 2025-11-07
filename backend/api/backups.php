<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once 'auth.php';

class BackupManager {
    private $conn;
    private $auth;
    private $backup_dir = "../backups/";
    private $database;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->auth = new Auth();
        $this->database = $database;
        
        // Create backups directory if it doesn't exist
        if (!file_exists($this->backup_dir)) {
            mkdir($this->backup_dir, 0777, true);
        }
    }

    private function validateClient($token) {
        $user = $this->auth->validateToken($token);
        return $user && ($user['role'] === 'client' || $user['role'] === 'admin');
    }

    public function createBackup() {
        if (!$this->validateClient($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        try {
            $timestamp = date('Y-m-d_H-i-s');
            $backup_file = $this->backup_dir . "backup_{$timestamp}.sql";
            
            // Get database configuration
            $db_host = "srv1981.hstgr.io";
            $db_name = "u926749960_portal_db";
            $db_user = "u926749960_wmsuportal";
            $db_pass = "YourPasswordHere"; // Add your password
            
            // Create backup using mysqldump
            $command = "mysqldump --host={$db_host} --user={$db_user} --password={$db_pass} {$db_name} > {$backup_file} 2>&1";
            
            exec($command, $output, $return_var);
            
            if ($return_var === 0 && file_exists($backup_file)) {
                $this->logBackup($backup_file);
                return [
                    'success' => true, 
                    'message' => 'Backup created successfully',
                    'filename' => "backup_{$timestamp}.sql"
                ];
            } else {
                return ['success' => false, 'error' => 'Failed to create backup: ' . implode(', ', $output)];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => 'Backup error: ' . $e->getMessage()];
        }
    }

    public function getBackups() {
        if (!$this->validateClient($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        $backups = [];
        if ($handle = opendir($this->backup_dir)) {
            while (false !== ($entry = readdir($handle))) {
                if ($entry != "." && $entry != ".." && is_file($this->backup_dir . $entry) && pathinfo($entry, PATHINFO_EXTENSION) === 'sql') {
                    $filepath = $this->backup_dir . $entry;
                    $backups[] = [
                        'name' => $entry,
                        'size' => $this->formatSize(filesize($filepath)),
                        'created' => date("Y-m-d H:i:s", filemtime($filepath))
                    ];
                }
            }
            closedir($handle);
        }

        // Sort by creation time, newest first
        usort($backups, function($a, $b) {
            return strtotime($b['created']) - strtotime($a['created']);
        });

        return ['success' => true, 'backups' => $backups];
    }

    public function showTables() {
        if (!$this->validateClient($this->getBearerToken())) {
            return ['success' => false, 'error' => 'Unauthorized'];
        }

        try {
            $query = "SHOW TABLES";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $tables = [];
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            
            return ['success' => true, 'tables' => $tables];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function downloadBackup($filename) {
        if (!$this->validateClient($this->getBearerToken())) {
            http_response_code(401);
            exit;
        }

        $filepath = $this->backup_dir . $filename;
        
        if (file_exists($filepath) && pathinfo($filename, PATHINFO_EXTENSION) === 'sql') {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="'.basename($filepath).'"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($filepath));
            readfile($filepath);
            exit;
        } else {
            http_response_code(404);
            echo "Backup file not found";
        }
    }

    private function logBackup($backup_file) {
        try {
            $user = $this->auth->validateToken($this->getBearerToken());
            $query = "INSERT INTO backup_logs (user_id, filename, created_at) VALUES (:user_id, :filename, NOW())";
            $stmt = $this->conn->prepare($query);
            $filename = basename($backup_file);
            $stmt->bindParam(':user_id', $user['user_id']);
            $stmt->bindParam(':filename', $filename);
            $stmt->execute();
        } catch (Exception $e) {
            error_log("Failed to log backup: " . $e->getMessage());
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
$backupManager = new BackupManager();

if (isset($_GET['download'])) {
    $backupManager->downloadBackup($_GET['download']);
    exit;
}

if (isset($_GET['action']) && $_GET['action'] === 'tables') {
    $result = $backupManager->showTables();
    echo json_encode($result);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $result = $backupManager->createBackup();
        echo json_encode($result);
        break;
        
    case 'GET':
        $result = $backupManager->getBackups();
        echo json_encode($result);
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
?>