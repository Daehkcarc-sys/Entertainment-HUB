<?php
/**
 * Database connection configuration
 * 
 * This file establishes a PDO connection to the database
 * with proper error handling and security settings.
 */

// Include the constants file
require_once __DIR__ . '/../php/core/constants.php';

// Database configuration using centralized constants
$db_config = [
    'host' => DB_HOST,
    'name' => DB_NAME,
    'user' => DB_USER,
    'pass' => DB_PASS,
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];

try {
    // Create DSN
    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['name']};charset={$db_config['charset']}";
    
    // Create PDO instance
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], $db_config['options']);
    
    // Set up connection for UTF-8
    $pdo->exec("SET NAMES {$db_config['charset']} COLLATE {$db_config['charset']}_unicode_ci");
    
} catch (PDOException $e) {
    // Log error but don't expose details to users
    error_log("Database Connection Error: " . $e->getMessage());
    
    // Display user-friendly error
    if (DEBUG_MODE) {
        // Only show detailed error in debug mode
        die("Database connection failed: " . $e->getMessage());
    } else {
        die("A database error occurred. Please try again later or contact support.");
    }
}

/**
 * Helper function to execute a query with parameters
 * 
 * @param string $sql The SQL query with placeholders
 * @param array $params The parameters to bind
 * @return PDOStatement The executed statement
 */
function executeQuery1($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/**
 * Helper function to fetch a single row
 * 
 * @param string $sql The SQL query with placeholders
 * @param array $params The parameters to bind
 * @return array|false The fetched row or false if not found
 */
function fetchRow($sql, $params = []) {
    $stmt = executeQuery1($sql, $params);
    return $stmt->fetch();
}

/**
 * Helper function to fetch all rows
 * 
 * @param string $sql The SQL query with placeholders
 * @param array $params The parameters to bind
 * @return array The fetched rows
 */
function fetchAll($sql, $params = []) {
    $stmt = executeQuery1($sql, $params);
    return $stmt->fetchAll();
}

/**
 * Helper function to insert a row and return the ID
 * 
 * @param string $table The table name
 * @param array $data Associative array of column => value
 * @return int|false The last insert ID or false on failure
 */
function insertRow($table, $data) {
    global $pdo;
    $columns = implode(', ', array_keys($data));
    $placeholders = implode(', ', array_fill(0, count($data), '?'));
    
    $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($data));
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        error_log("Insert Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Helper function to update a row
 * 
 * @param string $table The table name
 * @param array $data Associative array of column => value to update
 * @param string $whereColumn The column to use in WHERE clause
 * @param mixed $whereValue The value to match in WHERE clause
 * @return bool Success or failure
 */
function updateRow($table, $data, $whereColumn, $whereValue) {
    global $pdo;
    $setClauses = [];
    foreach (array_keys($data) as $column) {
        $setClauses[] = "{$column} = ?";
    }
    $setClause = implode(', ', $setClauses);
    
    $sql = "UPDATE {$table} SET {$setClause} WHERE {$whereColumn} = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $values = array_values($data);
        $values[] = $whereValue;
        $stmt->execute($values);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        error_log("Update Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Helper function to delete a row
 * 
 * @param string $table The table name
 * @param string $whereColumn The column to use in WHERE clause
 * @param mixed $whereValue The value to match in WHERE clause
 * @return bool Success or failure
 */
function deleteRow($table, $whereColumn, $whereValue) {
    global $pdo;
    $sql = "DELETE FROM {$table} WHERE {$whereColumn} = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$whereValue]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        error_log("Delete Error: " . $e->getMessage());
        return false;
    }
}
