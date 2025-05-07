<?php
/**
 * Logout Handler
 * Processes user logout requests
 */

// Start session
session_start();

// Clear remember token cookie if exists
if (isset($_COOKIE['remember_token'])) {
    // Include database config to delete the token from database
    if (file_exists('api/db_config.php')) {
        require_once 'api/db_config.php';
        
        try {
            $db = getDbConnection();
            $stmt = $db->prepare('DELETE FROM user_sessions WHERE token = ?');
            $stmt->execute([$_COOKIE['remember_token']]);
        } catch (PDOException $e) {
            // Continue with logout even if token deletion fails
        }
    }
    
    // Clear cookie
    setcookie('remember_token', '', time() - 3600, '/');
}

// Clear session variables
$_SESSION = array();

// Destroy the session
session_destroy();

// Start a new session for flash message
session_start();

// Set logout message
$_SESSION['flash_message'] = 'You have been logged out successfully.';
$_SESSION['flash_message_type'] = 'info';

// Redirect to home page
header('Location: index.php');
exit;