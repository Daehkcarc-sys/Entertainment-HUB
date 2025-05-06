<?php
/**
 * Database Connection
 * 
 * Establishes connection to the database using PDO.
 */

// Include the database configuration
require_once __DIR__ . '/db_config.php';

/**
 * Get database connection
 * 
 * @return PDO Database connection object
 */
function getDbConnection() {
    static $pdo;
    
    if (!$pdo) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $db_options);
        } catch (PDOException $e) {
            // Log the error but don't expose details to the user
            error_log('Database Connection Error: ' . $e->getMessage());
            
            if (DISPLAY_DB_ERRORS) {
                throw new Exception('Database connection failed. Please try again later.');
            } else {
                throw new Exception('A system error occurred. Please try again later.');
            }
        }
    }
    
    return $pdo;
}

/**
 * Execute a prepared statement with parameters
 * 
 * @param string $sql SQL query with placeholders
 * @param array $params Parameters to bind to the query
 * @return PDOStatement The executed statement
 */
function executeQuery($sql, $params = []) {
    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        // Log the error
        error_log('Query Error: ' . $e->getMessage() . ' - SQL: ' . $sql);
        
        if (DISPLAY_DB_ERRORS) {
            throw new Exception('Database query failed: ' . $e->getMessage());
        } else {
            throw new Exception('A system error occurred. Please try again later.');
        }
    }
}

/**
 * Begin a database transaction
 */
function beginTransaction() {
    getDbConnection()->beginTransaction();
}

/**
 * Commit a database transaction
 */
function commitTransaction() {
    getDbConnection()->commit();
}

/**
 * Rollback a database transaction
 */
function rollbackTransaction() {
    if (getDbConnection()->inTransaction()) {
        getDbConnection()->rollBack();
    }
}