<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Initialize data files if they don't exist
if(!file_exists('../../data')) {
    mkdir('../../data', 0777, true);
}

if(!file_exists('../../data/files.json')) {
    file_put_contents('../../data/files.json', json_encode([]));
}

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(isset($_POST['action']) && $_POST['action'] == 'upload') {
        // Handle file upload
        if(isset($_FILES['file'])) {
            $clientId = $_POST['client_id'];
            $file = $_FILES['file'];
            
            // Create uploads directory if it doesn't exist
            if(!file_exists('../../uploads')) {
                mkdir('../../uploads', 0777, true);
            }
            
            $fileName = uniqid() . '_' . $file['name'];
            $filePath = '../../uploads/' . $fileName;
            
            if(move_uploaded_file($file['tmp_name'], $filePath)) {
                // Save file info to JSON
                $files = json_decode(file_get_contents('../../data/files.json'), true);
                $newFile = [
                    'id' => uniqid(),
                    'name' => $file['name'],
                    'path' => $fileName,
                    'size' => $file['size'],
                    'type' => $file['type'],
                    'client_id' => $clientId,
                    'upload_date' => date('Y-m-d H:i:s')
                ];
                
                $files[] = $newFile;
                file_put_contents('../../data/files.json', json_encode($files));
                
                echo json_encode(["success" => true, "file" => $newFile]);
            } else {
                echo json_encode(["success" => false, "message" => "File upload failed"]);
            }
        }
    } else {
        $data = json_decode(file_get_contents("php://input"));
        
        if(isset($data->action)) {
            $files = json_decode(file_get_contents('../../data/files.json'), true) ?? [];
            
            switch($data->action) {
                case 'get_files':
                    $clientFiles = array_filter($files, function($file) use ($data) {
                        return $file['client_id'] == $data->client_id;
                    });
                    echo json_encode(["success" => true, "files" => array_values($clientFiles)]);
                    break;
                    
                case 'download':
                    $file = array_filter($files, function($f) use ($data) {
                        return $f['id'] == $data->file_id && $f['client_id'] == $data->client_id;
                    });
                    
                    if(count($file) > 0) {
                        $file = array_values($file)[0];
                        $filePath = '../../uploads/' . $file['path'];
                        
                        if(file_exists($filePath)) {
                            header('Content-Type: ' . $file['type']);
                            header('Content-Disposition: attachment; filename="' . $file['name'] . '"');
                            readfile($filePath);
                            exit;
                        }
                    }
                    echo json_encode(["success" => false, "message" => "File not found"]);
                    break;
                    
                case 'delete':
                    $fileIndex = array_search($data->file_id, array_column($files, 'id'));
                    if($fileIndex !== false) {
                        $file = $files[$fileIndex];
                        $filePath = '../../uploads/' . $file['path'];
                        
                        if(file_exists($filePath)) {
                            unlink($filePath);
                        }
                        
                        unset($files[$fileIndex]);
                        file_put_contents('../../data/files.json', json_encode(array_values($files)));
                        echo json_encode(["success" => true]);
                    } else {
                        echo json_encode(["success" => false, "message" => "File not found"]);
                    }
                    break;
            }
        }
    }
}
?>