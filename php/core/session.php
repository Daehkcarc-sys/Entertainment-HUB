<?php
/**
 * Session Manager
 * 
 * Handles session initialization, management, and security.
 */

// Include required files
require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/functions.php';

/**
 * Initialize the session with secure parameters
 */
function initSession() {
    // Set secure session parameters
    $sessionParams = [
        'cookie_lifetime' => SESSION_TIMEOUT,
        'cookie_httponly' => true,
        'cookie_secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'cookie_samesite' => 'Lax',
        'use_strict_mode' => true,
        'use_only_cookies' => true,
        'gc_maxlifetime' => SESSION_TIMEOUT,
        'name' => SESSION_NAME
    ];
    
    // Apply session parameters
    session_set_cookie_params(
        $sessionParams['cookie_lifetime'],
        '/', 
        '', 
        $sessionParams['cookie_secure'],
        $sessionParams['cookie_httponly']
    );
    
    // Use custom session name
    session_name($sessionParams['name']);
    
    // Start the session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Regenerate session ID periodically to prevent session fixation
    if (!isset($_SESSION['last_regeneration']) || 
        (time() - $_SESSION['last_regeneration']) > 1800) { // 30 minutes
        
        session_regenerate_id(true);
        $_SESSION['last_regeneration'] = time();
    }
}

/**
 * Set session data
 * 
 * @param string $key Session key
 * @param mixed $value Session value
 * @return void
 */
function setSession($key, $value) {
    $_SESSION[$key] = $value;
}

/**
 * Get session data
 * 
 * @param string $key Session key
 * @param mixed $default Default value if key doesn't exist
 * @return mixed Session value or default
 */
function getSession($key, $default = null) {
    return isset($_SESSION[$key]) ? $_SESSION[$key] : $default;
}

/**
 * Check if session key exists
 * 
 * @param string $key Session key
 * @return bool True if exists, false otherwise
 */
function hasSession($key) {
    return isset($_SESSION[$key]);
}

/**
 * Remove session data
 * 
 * @param string $key Session key
 * @return void
 */
function removeSession($key) {
    if (isset($_SESSION[$key])) {
        unset($_SESSION[$key]);
    }
}

/**
 * Clear all session data
 * 
 * @return void
 */
function clearSession() {
    $_SESSION = [];
}

/**
 * Destroy the session completely
 * 
 * @return void
 */
function destroySession() {
    clearSession();
    
    // If session cookie exists, delete it
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    
    // Finally, destroy the session
    session_destroy();
}

/**
 * Set flash message to be displayed once
 * 
 * @param string $type Message type (success, error, warning, info)
 * @param string $message Message content
 * @return void
 */
function setFlashMessage($type, $message) {
    if (!isset($_SESSION['flash_messages'])) {
        $_SESSION['flash_messages'] = [];
    }
    
    $_SESSION['flash_messages'][] = [
        'type' => $type,
        'message' => $message
    ];
}

/**
 * Get all flash messages and remove them from session
 * 
 * @return array Array of flash messages
 */
function getFlashMessages() {
    $messages = isset($_SESSION['flash_messages']) ? $_SESSION['flash_messages'] : [];
    unset($_SESSION['flash_messages']);
    return $messages;
}

/**
 * Check if there are any flash messages
 * 
 * @return bool True if there are messages, false otherwise
 */
function hasFlashMessages() {
    return isset($_SESSION['flash_messages']) && !empty($_SESSION['flash_messages']);
}

/**
 * Generate and store CSRF token
 * 
 * @param string $formName Name of the form for specific token
 * @return string CSRF token
 */
function generateCsrfToken($formName = 'global') {
    if (!isset($_SESSION['csrf_tokens'])) {
        $_SESSION['csrf_tokens'] = [];
    }
    
    $token = bin2hex(random_bytes(32));
    $_SESSION['csrf_tokens'][$formName] = [
        'token' => $token,
        'expires' => time() + CSRF_EXPIRY
    ];
    
    return $token;
}

/**
 * Validate CSRF token
 * 
 * @param string $token Token to validate
 * @param string $formName Name of the form for specific token
 * @return bool True if valid, false otherwise
 */
function validateCsrfToken($token, $formName = 'global') {
    if (!isset($_SESSION['csrf_tokens'][$formName])) {
        return false;
    }
    
    $storedToken = $_SESSION['csrf_tokens'][$formName];
    
    if (time() > $storedToken['expires']) {
        unset($_SESSION['csrf_tokens'][$formName]);
        return false;
    }
    
    if (hash_equals($storedToken['token'], $token)) {
        // Token used, remove it to prevent replay attacks
        unset($_SESSION['csrf_tokens'][$formName]);
        return true;
    }
    
    return false;
}

// Initialize the session when this file is included
initSession();