<?php
/**
 * Authentication API
 * Handles user registration, login, and session management
 */

// Include database configuration
require_once 'db_config.php';

// Headers for API responses
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
// die();
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
    
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
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
    
    try {
        $db = getDbConnection();
        
        // Get user with matching email
        $stmt = $db->prepare('SELECT id, username, email, password_hash, avatar FROM users WHERE email = ?');
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
        http_response_code(500);
        echo json_encode(['error' => 'Login failed']);
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
    
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username, email and password required']);
        return;
    }
    
    // // Sanitize inputs
    $username = filter_var($data['username'], FILTER_SANITIZE_STRING);
    $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    $password = $data['password'];
    

    // $username = filter_var($_POST['username'], FILTER_SANITIZE_STRING);
    // $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    // $password = $_POST['password'];
    
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
        
        // Hash password
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        // Default avatar
        $avatar = 'Avatar.jpg';
        
        // Insert new user
        $stmt = $db->prepare('INSERT INTO users (username, email, password_hash, avatar, created_at) VALUES (?, ?, ?, ?, NOW())');
        $stmt->execute([$username, $email, $password_hash, $avatar]);
        
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
                'avatar' => $avatar
            ],
            'token' => $token,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days'))
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed']);
    }
}

/**
 * Verify authentication token
 */
function verifyToken() {
    // Check authorization header
    $headers = apache_request_headers();
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
        $stmt = $db->prepare('SELECT u.id, u.username, u.email, u.avatar 
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
        http_response_code(500);
        echo json_encode(['error' => 'Token verification failed']);
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Check authorization header
    $headers = apache_request_headers();
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
        http_response_code(500);
        echo json_encode(['error' => 'Logout failed']);
    }
}