<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if(isset($data->action) && $data->action == 'export') {
        // Create backup directory if it doesn't exist
        if(!file_exists('../../backups')) {
            mkdir('../../backups', 0777, true);
        }
        
        $backupData = [
            'users' => json_decode(file_get_contents('../../data/users.json'), true) ?? [],
            'files' => json_decode(file_get_contents('../../data/files.json'), true) ?? [],
            'export_date' => date('Y-m-d H:i:s')
        ];
        
        $backupFile = '../../backups/backup_' . date('Y-m-d_H-i-s') . '.json';
        file_put_contents($backupFile, json_encode($backupData, JSON_PRETTY_PRINT));
        
        echo json_encode([
            "success" => true,
            "message" => "Backup created successfully",
            "file" => basename($backupFile)
        ]);
    }
    
    if(isset($data->action) && $data->action == 'import') {
        // Handle backup import
        if(isset($_FILES['backup_file'])) {
            $file = $_FILES['backup_file'];
            $backupData = json_decode(file_get_contents($file['tmp_name']), true);
            
            if($backupData) {
                file_put_contents('../../data/users.json', json_encode($backupData['users'] ?? []));
                file_put_contents('../../data/files.json', json_encode($backupData['files'] ?? []));
                
                echo json_encode(["success" => true, "message" => "Backup imported successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Invalid backup file"]);
            }
        }
    }
}

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // List available backups
    $backups = [];
    if(file_exists('../../backups')) {
        $files = scandir('../../backups');
        foreach($files as $file) {
            if($file != '.' && $file != '..' && pathinfo($file, PATHINFO_EXTENSION) == 'json') {
                $backups[] = [
                    'name' => $file,
                    'size' => filesize('../../backups/' . $file),
                    'date' => date('Y-m-d H:i:s', filemtime('../../backups/' . $file))
                ];
            }
        }
    }
    
    echo json_encode(["success" => true, "backups" => $backups]);
}
?>