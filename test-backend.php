<?php
// Test database connection and file permissions
header('Content-Type: text/plain');

echo "WMSU Research System - Connection Test\n";
echo "=======================================\n\n";

// Test directory permissions
$directories = [
    'backend/data',
    'backend/uploads',
    'backend/backups'
];

foreach($directories as $dir) {
    if(!file_exists($dir)) {
        if(mkdir($dir, 0777, true)) {
            echo "✓ Created directory: $dir\n";
        } else {
            echo "✗ Failed to create directory: $dir\n";
        }
    } else {
        echo "✓ Directory exists: $dir\n";
    }
    
    if(is_writable($dir)) {
        echo "✓ Directory is writable: $dir\n";
    } else {
        echo "✗ Directory is not writable: $dir\n";
    }
}

// Test JSON files
$files = [
    'backend/data/users.json',
    'backend/data/files.json'
];

foreach($files as $file) {
    if(!file_exists($file)) {
        file_put_contents($file, json_encode([]));
        echo "✓ Created file: $file\n";
    } else {
        echo "✓ File exists: $file\n";
    }
    
    if(is_writable($file)) {
        echo "✓ File is writable: $file\n";
    } else {
        echo "✗ File is not writable: $file\n";
    }
}

// Test PHP configuration
echo "\nPHP Configuration:\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Max File Upload: " . ini_get('upload_max_filesize') . "\n";
echo "Max POST Size: " . ini_get('post_max_size') . "\n";
echo "Memory Limit: " . ini_get('memory_limit') . "\n";

// Test if required extensions are loaded
$extensions = ['json', 'pdo', 'pdo_mysql'];
foreach($extensions as $ext) {
    if(extension_loaded($ext)) {
        echo "✓ Extension loaded: $ext\n";
    } else {
        echo "✗ Extension not loaded: $ext\n";
    }
}

echo "\nTest completed. System is " . (is_writable('backend/data') ? 'READY' : 'NOT READY') . " for use.\n";

// Remove this file after testing for security
// unlink(__FILE__);
?>