<?php
// Enable error display for testing
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Include the database configuration
require_once 'api/db_config.php';

// Test database connection
try {
    $db = getDbConnection();
    echo "Database connection successful!<br>";
    
    // Test a simple query to verify table structure
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Tables in the database:<br>";
    foreach ($tables as $table) {
        echo "- $table<br>";
    }
    
    // Check if the users table exists and has the expected structure
    if (in_array('users', $tables)) {
        echo "<br>Users table exists. Checking structure...<br>";
        $stmt = $db->query("DESCRIBE users");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Columns in users table:<br>";
        foreach ($columns as $column) {
            echo "- {$column['Field']} ({$column['Type']})<br>";
        }
    } else {
        echo "<br>WARNING: The users table does not exist!<br>";
    }
} catch (PDOException $e) {
    echo "Database connection error: " . $e->getMessage();
}
?>