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
        // Log the error for debugging
        error_log("Database connection error: " . $e->getMessage());
        
        // Throw the exception back to the caller instead of handling it here
        // This allows the main error handler to properly format the response
        throw new PDOException("Database connection failed: " . $e->getMessage(), $e->getCode());
    }
}

// Helper function to execute a query with parameters
function executeQuery($sql, $params = []) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}