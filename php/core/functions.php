<?php
/**
 * Core Functions
 * 
 * Contains essential utility functions used throughout the application.
 */

/**
 * Clean and sanitize input data
 * 
 * @param string $data Input data to sanitize
 * @return string Sanitized data
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * Generate a random token
 * 
 * @param int $length Length of the token
 * @return string Random token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Validate email address
 * 
 * @param string $email Email to validate
 * @return bool True if valid, false otherwise
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Check if a string contains only alphanumeric characters
 * 
 * @param string $string String to check
 * @return bool True if valid, false otherwise
 */
function isAlphanumeric($string) {
    return ctype_alnum($string);
}

/**
 * Redirect to a specified URL
 * 
 * @param string $url URL to redirect to
 * @param bool $permanent Whether to use a permanent redirect
 * @return void
 */
function redirect($url, $permanent = false) {
    if ($permanent) {
        header('HTTP/1.1 301 Moved Permanently');
    }
    header('Location: ' . $url);
    exit();
}

/**
 * Format date in a user-friendly way
 * 
 * @param string|int $date Date string or timestamp
 * @param string $format Date format
 * @return string Formatted date
 */
function formatDate($date, $format = 'F j, Y') {
    if (is_numeric($date)) {
        $timestamp = $date;
    } else {
        $timestamp = strtotime($date);
    }
    return date($format, $timestamp);
}

/**
 * Calculate time elapsed since a given date
 * 
 * @param string|int $datetime Date string or timestamp
 * @return string Elapsed time (e.g., "2 hours ago")
 */
function timeElapsed($datetime) {
    if (is_numeric($datetime)) {
        $timestamp = $datetime;
    } else {
        $timestamp = strtotime($datetime);
    }
    $now = time();
    $diff = $now - $timestamp;
    
    if ($diff < 60) {
        return 'just now';
    } elseif ($diff < 3600) {
        $minutes = round($diff / 60);
        return $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 86400) {
        $hours = round($diff / 3600);
        return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 604800) {
        $days = round($diff / 86400);
        return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 2592000) {
        $weeks = round($diff / 604800);
        return $weeks . ' week' . ($weeks > 1 ? 's' : '') . ' ago';
    } else {
        return formatDate($timestamp);
    }
}

/**
 * Generate a slug from a string
 * 
 * @param string $string String to convert to slug
 * @return string Slug
 */
function createSlug($string) {
    $string = preg_replace('/[^\p{L}\p{N}]+/u', '-', $string);
    $string = trim($string, '-');
    $string = mb_strtolower($string, 'UTF-8');
    return $string;
}

/**
 * Truncate a string to a specified length
 * 
 * @param string $string String to truncate
 * @param int $length Maximum length
 * @param string $append String to append if truncated
 * @return string Truncated string
 */
function truncateString($string, $length = 100, $append = '...') {
    if (mb_strlen($string, 'UTF-8') <= $length) {
        return $string;
    }
    
    $string = mb_substr($string, 0, $length, 'UTF-8');
    return rtrim($string) . $append;
}

/**
 * Log a message to file
 * 
 * @param string $message Message to log
 * @param string $type Log type (info, error, warning, debug)
 * @return bool True on success, false on failure
 */
function logMessage($message, $type = 'info') {
    if (!LOG_ERRORS) {
        return false;
    }
    
    $logFile = LOGS_PATH . '/' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $formattedMessage = "[$timestamp] [$type]: $message" . PHP_EOL;
    
    return file_put_contents($logFile, $formattedMessage, FILE_APPEND) !== false;
}

/**
 * Check if current user is logged in
 * 
 * @return bool True if user is logged in, false otherwise
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Check if current user is an admin
 * 
 * @return bool True if user is an admin, false otherwise
 */
function isAdmin() {
    return isLoggedIn() && isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

/**
 * Format file size in a readable way
 * 
 * @param int $bytes Size in bytes
 * @return string Formatted size
 */
function formatFileSize($bytes) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $i = 0;
    
    while ($bytes >= 1024 && $i < count($units) - 1) {
        $bytes /= 1024;
        $i++;
    }
    
    return round($bytes, 2) . ' ' . $units[$i];
}

/**
 * Get file extension
 * 
 * @param string $filename Filename
 * @return string File extension
 */
function getFileExtension($filename) {
    return pathinfo($filename, PATHINFO_EXTENSION);
}

/**
 * Check if file type is allowed
 * 
 * @param string $mimeType MIME type to check
 * @param bool $isImage Whether to check against image types
 * @return bool True if allowed, false otherwise
 */
function isAllowedFileType($mimeType, $isImage = false) {
    $allowedTypes = $isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    return in_array($mimeType, $allowedTypes);
}

/**
 * Generate a random password
 * 
 * @param int $length Password length
 * @return string Random password
 */
function generateRandomPassword($length = 12) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    $password = '';
    $charLength = strlen($chars) - 1;
    
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[random_int(0, $charLength)];
    }
    
    return $password;
}

/**
 * Convert array to JSON
 * 
 * @param array $data Array to convert
 * @return string JSON string
 */
function toJson($data) {
    return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/**
 * Get client IP address
 * 
 * @return string IP address
 */
function getClientIp() {
    $ipAddress = '';
    
    if (isset($_SERVER['HTTP_CLIENT_IP'])) {
        $ipAddress = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (isset($_SERVER['HTTP_X_FORWARDED'])) {
        $ipAddress = $_SERVER['HTTP_X_FORWARDED'];
    } elseif (isset($_SERVER['HTTP_FORWARDED_FOR'])) {
        $ipAddress = $_SERVER['HTTP_FORWARDED_FOR'];
    } elseif (isset($_SERVER['HTTP_FORWARDED'])) {
        $ipAddress = $_SERVER['HTTP_FORWARDED'];
    } elseif (isset($_SERVER['REMOTE_ADDR'])) {
        $ipAddress = $_SERVER['REMOTE_ADDR'];
    }
    
    // If comma separated list, take the first one
    if (strpos($ipAddress, ',') !== false) {
        $ipParts = explode(',', $ipAddress);
        $ipAddress = trim($ipParts[0]);
    }
    
    return $ipAddress;
}

/**
 * Get current page URL
 * 
 * @param bool $withQueryString Whether to include query string
 * @return string Current URL
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