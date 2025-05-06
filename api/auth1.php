<?php
/**
 * Authentication API for Entertainment Hub
 * Handles user login, registration, and session management
 */

// Start session and include required files
session_start();
require_once '../php/core/constants.php';
require_once 'db_config.php';
require_once 'functions.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check for CSRF token on POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();
    $csrfToken = isset($headers['X-CSRF-Token']) ? $headers['X-CSRF-Token'] : '';
    
    if (!isset($_SESSION['csrf_token']) || $csrfToken !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid CSRF token']);
        exit;
    }
}

// Get the requested action
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Process based on action
switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'register':
        handleRegistration();
        break;
    case 'verify':
        verifyToken();
        break;
    case 'refresh':
        refreshToken();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'updateProfile':
        updateProfile();
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}

/**
 * Generate a secure random token
 * 
 * @param int $length Length of the token
 * @return string Random token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Handle user login
 */
function handleLogin() {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    $email = trim($input['email']);
    $password = $input['password'];
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    global $pdo;
    
    try {
        // Get user by email
        $stmt = $pdo->prepare('SELECT id, username, email, password, role, avatar, status FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        // Check if user exists and password is correct
        if (!$user || !password_verify($password, $user['password'])) {
            // Log failed login attempt
            logActivity('login_failed', [
                'email' => $email,
                'ip' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT']
            ]);
            
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password']);
            return;
        }
        
        // Check if user is active
        if ($user['status'] !== 'active') {
            http_response_code(403);
            echo json_encode(['error' => 'Account is not active. Please check your email for activation instructions or contact support.']);
            return;
        }
        
        // Generate tokens
        $token = generateToken();
        $refreshToken = generateToken();
        $tokenExpires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $refreshTokenExpires = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        // Store tokens in database
        $stmt = $pdo->prepare('INSERT INTO user_tokens (user_id, token, refresh_token, token_expires, refresh_token_expires) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$user['id'], $token, $refreshToken, $tokenExpires, $refreshTokenExpires]);
        
        // Update last login time
        $stmt = $pdo->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
        $stmt->execute([$user['id']]);
        
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['auth_token'] = $token;
        
        // Remove password from user data
        unset($user['password']);
        
        // Log successful login
        logActivity('login_success', [
            'user_id' => $user['id'],
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT']
        ]);
        
        // Return user data and tokens
        echo json_encode([
            'success' => true,
            'user' => $user,
            'token' => $token,
            'refreshToken' => $refreshToken,
            'tokenExpires' => $tokenExpires
        ]);
        
    } catch (PDOException $e) {
        error_log('Login error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred during login']);
    }
}

/**
 * Handle user registration
 */
function handleRegistration() {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['username']) || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username, email, and password are required']);
        return;
    }
    
    $username = trim($input['username']);
    $email = trim($input['email']);
    $password = $input['password'];
    
    // Validate username
    if (strlen($username) < 3 || strlen($username) > 30) {
        http_response_code(400);
        echo json_encode(['error' => 'Username must be between 3 and 30 characters']);
        return;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
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
    
    // Check for at least one number and one special character
    if (!preg_match('/[0-9]/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must include at least one number and one special character']);
        return;
    }
    
    global $pdo;
    
    try {
        // Check if username or email already exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
        $stmt->execute([$username, $email]);
        $existingUser = $stmt->fetch();
        
        if ($existingUser) {
            http_response_code(409);
            echo json_encode(['error' => 'Username or email already exists']);
            return;
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Generate activation token
        $activationToken = generateToken();
        $activationExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Insert new user
        $stmt = $pdo->prepare('
            INSERT INTO users (username, email, password, role, status, activation_token, activation_expires, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $username, 
            $email, 
            $hashedPassword, 
            'user', // Default role
            'pending', // Default status
            $activationToken,
            $activationExpires
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Send activation email
        sendActivationEmail($email, $username, $activationToken);
        
        // Log registration
        logActivity('registration_success', [
            'user_id' => $userId,
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT']
        ]);
        
        // Return success message
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful. Please check your email to activate your account.'
        ]);
        
    } catch (PDOException $e) {
        error_log('Registration error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred during registration']);
    }
}

/**
 * Verify authentication token
 */
function verifyToken() {
    // Check if request method is GET
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get token from Authorization header
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        return;
    }
    
    $token = $matches[1];
    
    global $pdo;
    
    try {
        // Get token from database
        $stmt = $pdo->prepare('
            SELECT ut.user_id, ut.token_expires, u.username, u.email, u.role, u.avatar 
            FROM user_tokens ut
            JOIN users u ON ut.user_id = u.id
            WHERE ut.token = ? AND ut.token_expires > NOW()
        ');
        $stmt->execute([$token]);
        $tokenData = $stmt->fetch();
        
        if (!$tokenData) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            return;
        }
        
        // Return user data
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $tokenData['user_id'],
                'username' => $tokenData['username'],
                'email' => $tokenData['email'],
                'role' => $tokenData['role'],
                'avatar' => $tokenData['avatar']
            ],
            'tokenExpires' => $tokenData['token_expires']
        ]);
        
    } catch (PDOException $e) {
        error_log('Token verification error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred during token verification']);
    }
}

/**
 * Refresh authentication token
 */
function refreshToken() {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['refreshToken'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Refresh token is required']);
        return;
    }
    
    $refreshToken = $input['refreshToken'];
    
    global $pdo;
    
    try {
        // Get token from database
        $stmt = $pdo->prepare('
            SELECT ut.user_id, ut.refresh_token_expires, u.username, u.email, u.role, u.avatar 
            FROM user_tokens ut
            JOIN users u ON ut.user_id = u.id
            WHERE ut.refresh_token = ? AND ut.refresh_token_expires > NOW()
        ');
        $stmt->execute([$refreshToken]);
        $tokenData = $stmt->fetch();
        
        if (!$tokenData) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired refresh token']);
            return;
        }
        
        // Generate new tokens
        $newToken = generateToken();
        $newRefreshToken = generateToken();
        $tokenExpires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $refreshTokenExpires = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        // Update tokens in database
        $stmt = $pdo->prepare('
            UPDATE user_tokens 
            SET token = ?, refresh_token = ?, token_expires = ?, refresh_token_expires = ? 
            WHERE refresh_token = ?
        ');
        $stmt->execute([$newToken, $newRefreshToken, $tokenExpires, $refreshTokenExpires, $refreshToken]);
        
        // Return new tokens and user data
        echo json_encode([
            'success' => true,
            'token' => $newToken,
            'refreshToken' => $newRefreshToken,
            'tokenExpires' => $tokenExpires,
            'user' => [
                'id' => $tokenData['user_id'],
                'username' => $tokenData['username'],
                'email' => $tokenData['email'],
                'role' => $tokenData['role'],
                'avatar' => $tokenData['avatar']
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log('Token refresh error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred during token refresh']);
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get token from Authorization header
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        
        global $pdo;
        
        try {
            // Delete token from database
            $stmt = $pdo->prepare('DELETE FROM user_tokens WHERE token = ?');
            $stmt->execute([$token]);
        } catch (PDOException $e) {
            error_log('Logout error: ' . $e->getMessage());
        }
    }
    
    // Clear session
    session_unset();
    session_destroy();
    
    // Return success message
    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);
}

/**
 * Update user profile
 */
function updateProfile() {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get token from Authorization header
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    $token = $matches[1];
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    global $pdo;
    
    try {
        // Get user ID from token
        $stmt = $pdo->prepare('
            SELECT user_id 
            FROM user_tokens 
            WHERE token = ? AND token_expires > NOW()
        ');
        $stmt->execute([$token]);
        $tokenData = $stmt->fetch();
        
        if (!$tokenData) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            return;
        }
        
        $userId = $tokenData['user_id'];
        
        // Build update query based on provided fields
        $updateFields = [];
        $updateValues = [];
        
        // Username update
        if (isset($input['username'])) {
            $username = trim($input['username']);
            
            // Validate username
            if (strlen($username) < 3 || strlen($username) > 30) {
                http_response_code(400);
                echo json_encode(['error' => 'Username must be between 3 and 30 characters']);
                return;
            }
            
            // Check if username is already taken by another user
            $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? AND id != ?');
            $stmt->execute([$username, $userId]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Username is already taken']);
                return;
            }
            
            $updateFields[] = 'username = ?';
            $updateValues[] = $username;
        }
        
        // Email update
        if (isset($input['email'])) {
            $email = trim($input['email']);
            
            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                return;
            }
            
            // Check if email is already taken by another user
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
            $stmt->execute([$email, $userId]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Email is already taken']);
                return;
            }
            
            $updateFields[] = 'email = ?';
            $updateValues[] = $email;
        }
        
        // Password update
        if (isset($input['password'])) {
            $password = $input['password'];
            
            // Validate password strength
            if (strlen($password) < 8) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must be at least 8 characters']);
                return;
            }
            
            // Check for at least one number and one special character
            if (!preg_match('/[0-9]/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must include at least one number and one special character']);
                return;
            }
            
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $updateFields[] = 'password = ?';
            $updateValues[] = $hashedPassword;
        }
        
        // Bio update
        if (isset($input['bio'])) {
            $bio = trim($input['bio']);
            
            // Validate bio length
            if (strlen($bio) > 500) {
                http_response_code(400);
                echo json_encode(['error' => 'Bio must be less than 500 characters']);
                return;
            }
            
            $updateFields[] = 'bio = ?';
            $updateValues[] = $bio;
        }
        
        // Avatar update
        if (isset($input['avatar'])) {
            $avatar = trim($input['avatar']);
            
            // Validate avatar URL
            if (!empty($avatar) && !filter_var($avatar, FILTER_VALIDATE_URL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid avatar URL']);
                return;
            }
            
            $updateFields[] = 'avatar = ?';
            $updateValues[] = $avatar;
        }
        
        // If no fields to update
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        // Build and execute update query
        $updateQuery = 'UPDATE users SET ' . implode(', ', $updateFields) . ', updated_at = NOW() WHERE id = ?';
        $updateValues[] = $userId;
        
        $stmt = $pdo->prepare($updateQuery);
        $stmt->execute($updateValues);
        
        // Get updated user data
        $stmt = $pdo->prepare('SELECT id, username, email, role, avatar, bio FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        // Return updated user data
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
        
    } catch (PDOException $e) {
        error_log('Profile update error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred during profile update']);
    }
}

/**
 * Send activation email to user
 * 
 * @param string $email User email
 * @param string $username Username
 * @param string $token Activation token
 */
function sendActivationEmail($email, $username, $token) {
    $activationUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/activate.php?token=' . $token;
    
    $subject = 'Activate Your Entertainment Hub Account';
    
    $message = "
    <html>
    <head>
        <title>Activate Your Entertainment Hub Account</title>
    </head>
    <body>
        <h2>Welcome to Entertainment Hub, $username!</h2>
        <p>Thank you for registering. To activate your account, please click the link below:</p>
        <p><a href=\"$activationUrl\">Activate Your Account</a></p>
        <p>If the link doesn't work, copy and paste this URL into your browser:</p>
        <p>$activationUrl</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't register for an account, please ignore this email.</p>
        <p>Best regards,<br>The Entertainment Hub Team</p>
    </body>
    </html>
    ";
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: Entertainment Hub <noreply@entertainmenthub.com>',
        'Reply-To: support@entertainmenthub.com',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Send email
    mail($email, $subject, $message, implode("\r\n", $headers));
}

/**
 * Log user activity
 * 
 * @param string $action Action name
 * @param array $data Additional data
 */
function logActivity($action, $data = []) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO activity_logs (user_id, action, ip_address, user_agent, data, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ');
        
        $userId = isset($data['user_id']) ? $data['user_id'] : null;
        $ip = isset($data['ip']) ? $data['ip'] : $_SERVER['REMOTE_ADDR'];
        $userAgent = isset($data['user_agent']) ? $data['user_agent'] : $_SERVER['HTTP_USER_AGENT'];
        $jsonData = json_encode($data);
        
        $stmt->execute([$userId, $action, $ip, $userAgent, $jsonData]);
    } catch (PDOException $e) {
        error_log('Activity log error: ' . $e->getMessage());
    }
}
