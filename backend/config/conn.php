<?php
header('Content-Type: text/plain');

try {
    include_once 'backend/config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo "✅ Database connected successfully!\n";
        
        // Test if we can insert a user
        $test_query = "INSERT INTO users (username, password, name, email, role, subdomain, plan, storage_limit_mb) 
                      VALUES ('test_user', 'test_pass', 'Test User', 'test@test.com', 'client', 'testuser', 'basic', 100)";
        
        if ($db->exec($test_query)) {
            echo "✅ Can insert users into database!\n";
            
            // Clean up test user
            $db->exec("DELETE FROM users WHERE username = 'test_user'");
            echo "✅ Test user cleaned up!\n";
        } else {
            echo "❌ Cannot insert users - check table structure\n";
        }
        
    } else {
        echo "❌ Database connection failed!\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>