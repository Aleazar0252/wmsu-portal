<?php
echo "<h1>Backend System Test</h1>";
echo "<style>
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
</style>";

// Test Database Connection
echo "<h2>1. Database Connection</h2>";
try {
    include_once 'backend/config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo "<p class='success'>✅ Database connected successfully</p>";
        
        // Test tables
        $tables = ['users', 'files', 'database_backups'];
        foreach ($tables as $table) {
            $stmt = $db->query("SHOW TABLES LIKE '$table'");
            echo $stmt->rowCount() > 0 ? 
                "<p class='success'>✅ Table '$table' exists</p>" : 
                "<p class='error'>❌ Table '$table' missing</p>";
        }
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Database error: " . $e->getMessage() . "</p>";
}

// Test API Endpoints
echo "<h2>2. API Endpoints</h2>";
$endpoints = [
    '/backend/api/users.php' => 'Users API',
    '/backend/api/auth.php' => 'Auth API', 
    '/backend/api/files.php' => 'Files API',
    '/backend/api/backups.php' => 'Backups API'
];

foreach ($endpoints as $endpoint => $name) {
    $url = 'https://' . $_SERVER['HTTP_HOST'] . $endpoint;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo ($http_code == 200 || $http_code == 405) ? 
        "<p class='success'>✅ $name is accessible ($http_code)</p>" :
        "<p class='error'>❌ $name failed ($http_code)</p>";
}

echo "<h2>3. Next Steps</h2>";
echo "<p>If all tests pass, your backend is ready!</p>";
echo "<p>Access your admin portal: <a href='/admin/'>Admin Portal</a></p>";
?>