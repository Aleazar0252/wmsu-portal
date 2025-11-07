<?php
class Database {
    private $host = "localhost";
    private $db_name = "u926749960_portal_db"; 
    private $username = "u926749960_portal_db"; 
    private $password = "WMSU_Portal2025"; 
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            // Don't show exact error in production
            error_log("Database connection error: " . $exception->getMessage());
            echo "Database connection error. Please try again later.";
        }
        return $this->conn;
    }
}
?>