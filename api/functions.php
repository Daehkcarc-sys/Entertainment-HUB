<?php
/**
 * Common utility functions for the Entertainment Hub application
 */

/**
 * Sanitize user input to prevent XSS attacks
 * 
 * @param string $input The input to sanitize
 * @return string The sanitized input
 */
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email address
 * 
 * @param string $email The email to validate
 * @return bool Whether the email is valid
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Generate a secure random token
 * 
 * @param int $length The length of the token
 * @return string The generated token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Check if a request is an AJAX request
 * 
 * @return bool Whether the request is an AJAX request
 */
function isAjaxRequest() {
    return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

/**
 * Redirect to a URL
 * 
 * @param string $url The URL to redirect to
 * @param int $statusCode The HTTP status code
 * @return void
 */
function redirect($url, $statusCode = 302) {
    header('Location: ' . $url, true, $statusCode);
    exit;
}

/**
 * Set a flash message to be displayed on the next page load
 * 
 * @param string $message The message to display
 * @param string $type The type of message (success, error, warning, info)
 * @return void
 */
function setFlashMessage($message, $type = 'info') {
    $_SESSION['flash_message'] = $message;
    $_SESSION['flash_message_type'] = $type;
}

/**
 * Check if the current user has a specific role
 * 
 * @param string $role The role to check for
 * @return bool Whether the user has the role
 */
function hasRole($role) {
    global $currentUser;
    if (!$currentUser) return false;
    return $currentUser['role'] === $role;
}

/**
 * Get the current page URL
 * 
 * @param bool $withQueryString Whether to include the query string
 * @return string The current page URL
 */
function getCurrentUrl($withQueryString = true) {
    $url = 'http';
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        $url .= 's';
    }
    $url .= '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    
    if (!$withQueryString) {
        $url = strtok($url, '?');
    }
    
    return $url;
}

/**
 * Format a date according to the user's preferences
 * 
 * @param string $date The date to format
 * @param string $format The format to use
 * @return string The formatted date
 */
function formatDate($date, $format = 'M j, Y') {
    global $currentUser;
    
    $timestamp = strtotime($date);
    
    // Use user's preferred date format if available
    if ($currentUser && isset($currentUser['date_format'])) {
        $format = $currentUser['date_format'];
    }
    
    return date($format, $timestamp);
}

/**
 * Log a message to the application log
 * 
 * @param string $message The message to log
 * @param string $level The log level (info, warning, error, debug)
 * @return bool Whether the message was logged successfully
 */
function logMessage($message, $level = 'info') {
    $logDir = __DIR__ . '/../logs';
    
    // Create logs directory if it doesn't exist
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/app_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    
    return file_put_contents($logFile, $logEntry, FILE_APPEND);
}

/**
 * Get client IP address
 * 
 * @return string The client IP address
 */
function getClientIp() {
    $ipAddress = '';
    
    if (isset($_SERVER['HTTP_CLIENT_IP'])) {
        $ipAddress = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ipAddressList = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ipAddress = trim($ipAddressList[0]);
    } elseif (isset($_SERVER['HTTP_X_FORWARDED'])) {
        $ipAddress = $_SERVER['HTTP_X_FORWARDED'];
    } elseif (isset($_SERVER['HTTP_FORWARDED_FOR'])) {
        $ipAddress = $_SERVER['HTTP_FORWARDED_FOR'];
    } elseif (isset($_SERVER['HTTP_FORWARDED'])) {
        $ipAddress = $_SERVER['HTTP_FORWARDED'];
    } elseif (isset($_SERVER['REMOTE_ADDR'])) {
        $ipAddress = $_SERVER['REMOTE_ADDR'];
    }
    
    return $ipAddress;
}

/**
 * Create a notification for a user
 * 
 * @param int $userId The user ID to notify
 * @param string $type The notification type
 * @param string $message The notification message
 * @param int $relatedId Related content/user/comment ID
 * @param string $relatedType Type of related entity (content, user, comment)
 * @return bool Whether the notification was created successfully
 */
function createNotification($userId, $type, $message, $relatedId = null, $relatedType = null) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (
                user_id, type, message, related_id, related_type, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, NOW()
            )
        ");
        
        return $stmt->execute([$userId, $type, $message, $relatedId, $relatedType]);
    } catch (PDOException $e) {
        logMessage('Failed to create notification: ' . $e->getMessage(), 'error');
        return false;
    }
}

