<?php
header('Content-Type: text/plain');

echo "=== API Endpoint Tests ===\n\n";

// Test 1: Users API
echo "1. Testing Users API...\n";
$users_url = 'https://portal.wmsu-research.com/backend/api/users.php';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $users_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "   URL: $users_url\n";
echo "   Status: $http_code\n";

if ($http_code === 200) {
    echo "   ✅ Users API is accessible\n";
} else {
    echo "   ❌ Users API failed (Status: $http_code)\n";
}

curl_close($ch);

echo "\n2. Testing Auth API...\n";
$auth_url = 'https://portal.wmsu-research.com/backend/api/auth.php';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $auth_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "   URL: $auth_url\n";
echo "   Status: $http_code\n";

if ($http_code !== 0) {
    echo "   ✅ Auth API is accessible\n";
} else {
    echo "   ❌ Auth API failed\n";
}

curl_close($ch);

echo "\n=== API Tests Complete ===\n";
?>