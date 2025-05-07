<?php
/**
 * Authentication Handler
 * Processes form submissions for login, registration and logout
 */

// Start the session
session_start();

// Include necessary files
require_once 'db_config.php';

// Verify CSRF token
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        $_SESSION['auth_error'] = 'Invalid security token. Please try again.';
        header('Location: ../signin.php');
        exit;
    }
}

// Get the action
$action = isset($_POST['action']) ? $_POST['action'] : '';

// Process based on action
switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'register':
        handleRegister();
        break;
    case 'admin_login':
        handleAdminLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    default:
        $_SESSION['auth_error'] = 'Invalid action.';
        header('Location: ../signin.php');
        break;
}

/**
 * Handle user login
 */
function handleLogin() {
    // Validate required fields
    if (!isset($_POST['email']) || !isset($_POST['password'])) {
        $_SESSION['auth_error'] = 'Email and password are required.';
        header('Location: ../signin.php');
        exit;
    }
    
    // Sanitize inputs
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'];
    $remember = isset($_POST['remember']) ? true : false;
    
    // Validate email
    if (!$email) {
        $_SESSION['auth_error'] = 'Invalid email format.';
        header('Location: ../signin.php');
        exit;
    }
    
    try {
        $db = getDbConnection();
        
        // Check user credentials
        $stmt = $db->prepare('SELECT id, username, email, password_hash, avatar, role FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        // Verify user existence and password
        if ($user && password_verify($password, $user['password_hash'])) {
            // Set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['avatar'] = $user['avatar'];
            $_SESSION['role'] = $user['role'];
            
            // Update last login time
            $stmt = $db->prepare('UPDATE users SET last_login = NOW(), last_activity = NOW() WHERE id = ?');
            $stmt->execute([$user['id']]);
            
            // Create persistent login if remember is checked
            if ($remember) {
                $token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
                
                // Store in database
                $stmt = $db->prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
                $stmt->execute([$user['id'], $token, $expires]);
                
                // Set cookie
                setcookie('remember_token', $token, strtotime('+30 days'), '/', '', false, true);
            }
            
            // Success message and redirect
            $_SESSION['flash_message'] = 'Welcome back, ' . $user['username'] . '!';
            $_SESSION['flash_message_type'] = 'success';
            header('Location: ../index.php');
            exit;
        } else {
            $_SESSION['auth_error'] = 'Invalid email or password.';
            header('Location: ../signin.php');
            exit;
        }
    } catch (PDOException $e) {
        $_SESSION['auth_error'] = 'Login failed due to a system error. Please try again later.';
        header('Location: ../signin.php');
        exit;
    }
}

/**
 * Handle user registration
 */
function handleRegister() {
    // Validate required fields
    if (!isset($_POST['username']) || !isset($_POST['email']) || !isset($_POST['password']) || !isset($_POST['confirm_password']) || !isset($_POST['terms'])) {
        $_SESSION['auth_error'] = 'All fields are required.';
        header('Location: ../signin.php?register=true');
        exit;
    }
    
    // Sanitize inputs
    $username = filter_var($_POST['username'], FILTER_SANITIZE_STRING);
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirm_password'];
    
    // Validate email
    if (!$email) {
        $_SESSION['auth_error'] = 'Invalid email format.';
        header('Location: ../signin.php?register=true');
        exit;
    }
    
    // Validate username length
    if (strlen($username) < 3) {
        $_SESSION['auth_error'] = 'Username must be at least 3 characters.';
        header('Location: ../signin.php?register=true');
        exit;
    }
    
    // Validate password strength
    if (strlen($password) < 8) {
        $_SESSION['auth_error'] = 'Password must be at least 8 characters.';
        header('Location: ../signin.php?register=true');
        exit;
    }
    
    // Ensure passwords match
    if ($password !== $confirmPassword) {
        $_SESSION['auth_error'] = 'Passwords do not match.';
        header('Location: ../signin.php?register=true');
        exit;
    }
    
    try {
        $db = getDbConnection();
        
        // Check if email already exists
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        
        if ($stmt->fetch()) {
            $_SESSION['auth_error'] = 'Email is already registered.';
            header('Location: ../signin.php?register=true');
            exit;
        }
        
        // Check if username already exists
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        
        if ($stmt->fetch()) {
            $_SESSION['auth_error'] = 'Username is already taken.';
            header('Location: ../signin.php?register=true');
            exit;
        }
        
        // Hash password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert new user
        $stmt = $db->prepare('INSERT INTO users (username, email, password_hash, avatar, created_at, role) 
                             VALUES (?, ?, ?, ?, NOW(), ?)');
        $stmt->execute([$username, $email, $passwordHash, 'Avatar.jpg', 'user']);
        
        $userId = $db->lastInsertId();
        
        // Set session variables
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;
        $_SESSION['email'] = $email;
        $_SESSION['avatar'] = 'Avatar.jpg';
        $_SESSION['role'] = 'user';
        
        // Create initial user settings
        $stmt = $db->prepare('INSERT INTO user_settings (user_id, theme, notification_preferences, privacy_settings, created_at) 
                             VALUES (?, ?, ?, ?, NOW())');
        $stmt->execute([
            $userId, 
            'light', 
            json_encode(['email' => true, 'site' => true]), 
            json_encode(['public_profile' => true, 'show_activity' => true])
        ]);
        
        // Success message and redirect
        $_SESSION['flash_message'] = 'Account created successfully. Welcome to Entertainment Hub, ' . $username . '!';
        $_SESSION['flash_message_type'] = 'success';
        header('Location: ../index.php');
        exit;
    } catch (PDOException $e) {
        $_SESSION['auth_error'] = 'Registration failed due to a system error. Please try again later.';
        header('Location: ../signin.php?register=true');
        exit;
    }
}

/**
 * Handle admin login
 */
function handleAdminLogin() {
    // Validate required fields
    if (!isset($_POST['email']) || !isset($_POST['password']) || !isset($_POST['code'])) {
        $_SESSION['auth_error'] = 'All fields are required.';
        header('Location: ../signin.php');
        exit;
    }
    
    // Sanitize inputs
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'];
    $code = $_POST['code'];
    
    // Admin code (in a real app, this would be stored securely)
    $validAdminCode = 'admin2025';
    
    // Validate email
    if (!$email) {
        $_SESSION['auth_error'] = 'Invalid email format.';
        header('Location: ../signin.php');
        exit;
    }
    
    // Verify admin code
    if ($code !== $validAdminCode) {
        $_SESSION['auth_error'] = 'Invalid admin authorization code.';
        header('Location: ../signin.php');
        exit;
    }
    
    try {
        $db = getDbConnection();
        
        // Check user credentials and verify admin role
        $stmt = $db->prepare('SELECT id, username, email, password_hash, avatar, role FROM users 
                             WHERE email = ? AND role = ?');
        $stmt->execute([$email, 'admin']);
        $admin = $stmt->fetch();
        
        // Verify admin existence and password
        if ($admin && password_verify($password, $admin['password_hash'])) {
            // Set session variables
            $_SESSION['user_id'] = $admin['id'];
            $_SESSION['username'] = $admin['username'];
            $_SESSION['email'] = $admin['email'];
            $_SESSION['avatar'] = $admin['avatar'];
            $_SESSION['role'] = $admin['role'];
            $_SESSION['is_admin'] = true;
            
            // Update last login time
            $stmt = $db->prepare('UPDATE users SET last_login = NOW(), last_activity = NOW() WHERE id = ?');
            $stmt->execute([$admin['id']]);
            
            // Success message and redirect to admin dashboard
            $_SESSION['flash_message'] = 'Welcome back, Administrator ' . $admin['username'] . '!';
            $_SESSION['flash_message_type'] = 'success';
            header('Location: ../admin.php');
            exit;
        } else {
            $_SESSION['auth_error'] = 'Invalid admin credentials.';
            header('Location: ../signin.php');
            exit;
        }
    } catch (PDOException $e) {
        $_SESSION['auth_error'] = 'Login failed due to a system error. Please try again later.';
        header('Location: ../signin.php');
        exit;
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Check for CSRF token
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        header('Location: ../index.php');
        exit;
    }
    
    // Clear remember token cookie if exists
    if (isset($_COOKIE['remember_token'])) {
        // Delete token from database
        try {
            $db = getDbConnection();
            $stmt = $db->prepare('DELETE FROM user_sessions WHERE token = ?');
            $stmt->execute([$_COOKIE['remember_token']]);
        } catch (PDOException $e) {
            // Continue with logout even if token deletion fails
        }
        
        // Clear cookie
        setcookie('remember_token', '', time() - 3600, '/', '', false, true);
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
    header('Location: ../index.php');
    exit;
}