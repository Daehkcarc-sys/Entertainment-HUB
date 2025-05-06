<?php
/**
 * Database configuration file
 * Contains connection parameters and utilities for database operations
 */

// Include the constants file
require_once __DIR__ . '/../php/core/constants.php';

// Timezone settings
date_default_timezone_set('UTC');

/**
 * Get database connection
 * @return PDO Database connection object
 */
function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // In production, log error instead of displaying
        if (DEBUG_MODE) {
            echo "Connection error: " . $e->getMessage();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }
}

// Helper function to execute a query with parameters
function executeQuery($sql, $params = []) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}