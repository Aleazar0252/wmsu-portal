<?php
echo "<h1>WMSU Portal System Test</h1>";
echo "<style>
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .warning { color: orange; font-weight: bold; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
</style>";

// Test 1: Database Connection
echo "<h2>1. Database Connection Test</h2>";
try {
    include_once 'backend/config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo "<p class='success'>✅ Database connected successfully!</p>";
        echo "<p>Database: " . (new ReflectionClass($database))->getProperty('db_name')->getValue($database) . "</p>";
        
        // Test tables
        $tables = ['users', 'files', 'database_backups'];
        foreach ($tables as $table) {
            $stmt = $db->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                echo "<p class='success'>✅ Table '$table' exists</p>";
            } else {
                echo "<p class='error'>❌ Table '$table' missing</p>";
            }
        }
        
    } else {
        echo "<p class='error'>❌ Database connection failed</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Database error: " . $e->getMessage() . "</p>";
}

// Test 2: File Structure
echo "<h2>2. File Structure Check</h2>";
$required_files = [
    'backend/config/database.php' => 'Database configuration',
    'backend/api/users.php' => 'Users API',
    'backend/api/auth.php' => 'Auth API',
    'backend/api/files.php' => 'Files API',
    'admin/index.html' => 'Admin Login',
    'admin/dashboard.html' => 'Admin Dashboard',
    'index.html' => 'Client Portal'
];

foreach ($required_files as $file => $description) {
    if (file_exists($file)) {
        echo "<p class='success'>✅ $description ($file)</p>";
    } else {
        echo "<p class='error'>❌ Missing: $description ($file)</p>";
    }
}

// Test 3: Directory Permissions
echo "<h2>3. Directory Permissions Check</h2>";
$writable_dirs = [
    'backend/uploads' => 'File uploads',
    'backend/backups' => 'Database backups'
];

foreach ($writable_dirs as $dir => $description) {
    if (!file_exists($dir)) {
        echo "<p class='warning'>⚠️ Directory doesn't exist: $dir</p>";
        if (mkdir($dir, 0755, true)) {
            echo "<p class='success'>✅ Created directory: $dir</p>";
        } else {
            echo "<p class='error'>❌ Failed to create directory: $dir</p>";
        }
    } elseif (is_writable($dir)) {
        echo "<p class='success'>✅ $description directory is writable</p>";
    } else {
        echo "<p class='error'>❌ $description directory is NOT writable</p>";
    }
}

echo "<h2>4. Quick Fixes</h2>";
echo "<p>If you see errors above, here are the solutions:</p>";
echo "<ul>
<li><strong>Database connection failed:</strong> Update credentials in backend/config/database.php</li>
<li><strong>Missing tables:</strong> Run the SQL setup script</li>
<li><strong>Missing files:</strong> Upload all project files to server</li>
<li><strong>Directory not writable:</strong> Set permissions to 755 for backend/uploads/ and backend/backups/</li>
</ul>";

echo "<h2>5. Next Steps</h2>";
echo "<p>After fixing any issues:</p>";
echo "<ol>
<li>Go to <a href='/admin/'>Admin Portal</a></li>
<li>Login with: admin / admin123</li>
<li>Create client accounts</li>
<li>Test client portal at <a href='/'>Client Portal</a></li>
</ol>";
?>