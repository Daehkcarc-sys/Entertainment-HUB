<?php
/**
 * Authentication API
 * Handles user registration, login, and session management
 */

// TEMPORARY: Enable error display for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Try/catch the entire script to ensure only JSON is returned
try {
    // Include database configuration
    require_once 'db_config.php';

    // Headers for API responses
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }

    // Get the request action
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // Handle different authentication actions
    switch ($action) {
        case 'login':
            handleLogin();
            break;
        case 'register':
            handleRegister();
            break;
        case 'verify':
            verifyToken();
            break;
        case 'logout':
            handleLogout();
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
} catch (Throwable $e) {
    // Log the error (instead of displaying it)
    error_log("API Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    // Return a proper JSON error
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred. Please try again later.']);
}

/**
 * Get all HTTP headers
 * Compatible replacement for apache_request_headers()
 */
if (!function_exists('getAllHeaders')) {
    function getAllHeaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

/**
 * Handle user login
 */
function handleLogin() {
    // Check if method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    try {
        // Get JSON data
        $jsonInput = file_get_contents('php://input');
        if (empty($jsonInput)) {
            http_response_code(400);
            echo json_encode(['error' => 'No input data received']);
            return;
        }
        
        $data = json_decode($jsonInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
            return;
        }
        
        // Validate required fields
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password required']);
            return;
        }
        
        // Sanitize inputs
        $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
        $password = $data['password'];
        
        // Validate email
        if (!$email) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }
        
        $db = getDbConnection();
        
        // Get user with matching email
        $stmt = $db->prepare('SELECT id, username, email, password_hash, avatar, role FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        // Check if user exists and verify password
        if ($user && password_verify($password, $user['password_hash'])) {
            // Generate token (JWT in production)
            $token = bin2hex(random_bytes(32));
            
            // Store token in database (with expiration)
            $stmt = $db->prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))');
            $stmt->execute([$user['id'], $token]);
            
            // Remove password hash from response
            unset($user['password_hash']);
            
            // Return user data and token
            echo json_encode([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days'))
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password']);
        }
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Login failed due to server error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("General login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
    }
}

/**
 * Handle user registration
 */
function handleRegister() {
    // Check if method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    try {
        // Get JSON data
        $jsonInput = file_get_contents('php://input');
        if (empty($jsonInput)) {
            http_response_code(400);
            echo json_encode(['error' => 'No input data received']);
            return;
        }
        
        $data = json_decode($jsonInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
            return;
        }
        
        // Validate required fields
        if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Username, email and password required']);
            return;
        }
        
        // Sanitize inputs
        $username = htmlspecialchars($data['username'], ENT_QUOTES, 'UTF-8');
        $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
        $password = $data['password'];
        
        // Validate email
        if (!$email) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }
        
        // Validate password strength
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters']);
            return;
        }
        
        try {
            $db = getDbConnection();
            
            // Check if email already exists
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            
            if ($stmt->fetch()) {
                http_response_code(409); // Conflict
                echo json_encode(['error' => 'Email already registered']);
                return;
            }
            
            // Check if username exists
            $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
            $stmt->execute([$username]);
            
            if ($stmt->fetch()) {
                http_response_code(409); // Conflict
                echo json_encode(['error' => 'Username already taken']);
                return;
            }
            
            // Hash password
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            
            // Default avatar
            $avatar = 'Avatar.jpg';
            
            // Insert new user
            $stmt = $db->prepare('INSERT INTO users (username, email, password_hash, avatar, created_at, role) VALUES (?, ?, ?, ?, NOW(), ?)');
            $stmt->execute([$username, $email, $password_hash, $avatar, 'user']);
            
            $userId = $db->lastInsertId();
            
            // Generate token
            $token = bin2hex(random_bytes(32));
            
            // Store token
            $stmt = $db->prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))');
            $stmt->execute([$userId, $token]);
            
            // Return user data and token
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $userId,
                    'username' => $username,
                    'email' => $email,
                    'avatar' => $avatar,
                    'role' => 'user'
                ],
                'token' => $token,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days'))
            ]);
        } catch (PDOException $e) {
            error_log("Registration DB error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Registration failed due to database error: ' . $e->getMessage()]);
        }
    } catch (PDOException $e) {
        error_log("Registration PDO error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed due to database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("General registration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
    }
}

/**
 * Verify authentication token
 */
function verifyToken() {
    // Check authorization header
    $headers = getAllHeaders(); // Using our compatible function instead of apache_request_headers
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        return;
    }
    
    $token = $matches[1];
    
    try {
        $db = getDbConnection();
        
        // Check token validity
        $stmt = $db->prepare('SELECT u.id, u.username, u.email, u.avatar, u.role
                            FROM user_sessions s
                            JOIN users u ON s.user_id = u.id
                            WHERE s.token = ? AND s.expires_at > NOW()');
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Token is valid
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
        } else {
            // Token is invalid or expired
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
        }
    } catch (PDOException $e) {
        error_log("Token verification error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Token verification failed']);
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Check authorization header
    $headers = getAllHeaders(); // Using our compatible function instead of apache_request_headers
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        return;
    }
    
    $token = $matches[1];
    
    try {
        $db = getDbConnection();
        
        // Delete the session token
        $stmt = $db->prepare('DELETE FROM user_sessions WHERE token = ?');
        $stmt->execute([$token]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    } catch (PDOException $e) {
        error_log("Logout error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Logout failed']);
    }
}