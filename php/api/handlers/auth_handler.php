<?php
/**
 * Authentication API Handler
 * 
 * Handles user authentication, registration, password resets, etc.
 */

// Include constants file
require_once __DIR__ . '/../../core/constants.php';

/**
 * Main handler function for authentication requests
 * 
 * @param string $method HTTP method
 * @param string|null $action Auth action (login, register, etc.)
 * @param array $requestData Request data
 * @return array Response data
 * @throws Exception if method not allowed or action not supported
 */
function handleAuthRequest($method, $action, $requestData) {
    if ($method !== 'POST') {
        throw new Exception('Method not allowed for auth endpoints', 405);
    }
    
    switch ($action) {
        case 'login':
            return handleLogin($requestData);
        
        case 'register':
            return handleRegistration($requestData);
        
        case 'logout':
            return handleLogout($requestData);
        
        case 'forgot-password':
            return handleForgotPassword($requestData);
        
        case 'reset-password':
            return handleResetPassword($requestData);
        
        case 'verify-email':
            return handleEmailVerification($requestData);
        
        case 'refresh-token':
            return handleTokenRefresh($requestData);
        
        default:
            throw new Exception('Auth action not supported', 404);
    }
}

/**
 * Handle user login
 * 
 * @param array $data Login credentials and options
 * @return array Authentication result with tokens
 * @throws Exception if login fails
 */
function handleLogin($data) {
    // Validate required fields
    if (!isset($data['identifier']) || empty($data['identifier'])) {
        throw new Exception('Email or username is required', 400);
    }
    
    if (!isset($data['password']) || empty($data['password'])) {
        throw new Exception('Password is required', 400);
    }
    
    $identifier = $data['identifier'];
    $password = $data['password'];
    $rememberMe = isset($data['remember_me']) && $data['remember_me'];
    
    try {
        // Check for too many failed attempts
        $ip = getClientIp();
        $attemptsSql = "SELECT COUNT(*) as count FROM login_attempts 
                        WHERE (identifier = :identifier OR ip_address = :ip) 
                        AND success = 0
                        AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)";
        
        $attemptsStmt = executeQuery($attemptsSql, [
            'identifier' => $identifier,
            'ip' => $ip
        ]);
        
        $attempts = $attemptsStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($attempts['count'] >= MAX_LOGIN_ATTEMPTS) {
            // Log this attempt too
            logLoginAttempt($identifier, $ip, false);
            
            throw new Exception('Too many failed login attempts. Please try again later.', 429);
        }
        
        // Get user by email or username
        $userSql = "SELECT id, username, email, password, is_active, role, email_verified_at 
                   FROM users 
                   WHERE (email = :identifier OR username = :identifier)";
        
        $userStmt = executeQuery($userSql, ['identifier' => $identifier]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify user exists and is active
        if (!$user) {
            logLoginAttempt($identifier, $ip, false);
            throw new Exception('Invalid credentials', 401);
        }
        
        if (!$user['is_active']) {
            logLoginAttempt($identifier, $ip, false);
            throw new Exception('Account is disabled', 403);
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            logLoginAttempt($identifier, $ip, false);
            throw new Exception('Invalid credentials', 401);
        }
        
        // Check if email is verified (if required)
        if (REQUIRE_EMAIL_VERIFICATION && !$user['email_verified_at']) {
            // Send a new verification email
            sendVerificationEmail($user['id'], $user['email']);
            
            throw new Exception('Email not verified. A new verification email has been sent.', 403);
        }
        
        // Update password hash if needed
        if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $updateSql = "UPDATE users SET password = :password WHERE id = :id";
            executeQuery($updateSql, [
                'id' => $user['id'],
                'password' => $newHash
            ]);
        }
        
        // Update last login timestamp
        $updateLoginSql = "UPDATE users SET last_login = NOW() WHERE id = :id";
        executeQuery($updateLoginSql, ['id' => $user['id']]);
        
        // Generate access token and refresh token
        $accessToken = generateAccessToken($user);
        $refreshToken = null;
        
        if ($rememberMe) {
            $refreshToken = generateRefreshToken($user['id']);
        }
        
        // Log successful login
        logLoginAttempt($identifier, $ip, true);
        
        // Return tokens and user info
        return [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role']
            ],
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => ACCESS_TOKEN_LIFETIME
        ];
    } catch (Exception $e) {
        // Only log unexpected errors
        if ($e->getCode() >= 500) {
            logMessage('Login error: ' . $e->getMessage(), 'error');
        }
        throw $e;
    }
}

/**
 * Handle user registration
 * 
 * @param array $data Registration information
 * @return array Registration result
 * @throws Exception if registration fails
 */
function handleRegistration($data) {
    // Validate required fields
    if (!isset($data['username']) || !preg_match('/^[a-zA-Z0-9_]{3,20}$/', $data['username'])) {
        throw new Exception('Username must be 3-20 characters and contain only letters, numbers, and underscores', 400);
    }
    
    if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Valid email address is required', 400);
    }
    
    if (!isset($data['password']) || strlen($data['password']) < 8) {
        throw new Exception('Password must be at least 8 characters', 400);
    }
    
    // Check for password strength
    if (!preg_match('/[A-Z]/', $data['password']) || 
        !preg_match('/[a-z]/', $data['password']) || 
        !preg_match('/[0-9]/', $data['password'])) {
        throw new Exception('Password must include uppercase, lowercase, and numbers', 400);
    }
    
    try {
        // Begin transaction
        getDbConnection()->beginTransaction();
        
        // Check if username or email already exists
        $checkSql = "SELECT username, email FROM users WHERE username = :username OR email = :email";
        $checkStmt = executeQuery($checkSql, [
            'username' => $data['username'],
            'email' => $data['email']
        ]);
        $existingUser = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingUser) {
            if ($existingUser['username'] === $data['username']) {
                throw new Exception('Username already taken', 409);
            } else {
                throw new Exception('Email already registered', 409);
            }
        }
        
        // Generate verification token if email verification is required
        $verificationToken = REQUIRE_EMAIL_VERIFICATION ? generateRandomToken() : null;
        $isActive = !REQUIRE_EMAIL_VERIFICATION;
        
        // Hash password
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Insert user
        $sql = "INSERT INTO users (username, email, password, first_name, last_name, role, verification_token, 
                is_active, created_at, updated_at)
                VALUES (:username, :email, :password, :first_name, :last_name, 'user', :verification_token, 
                :is_active, NOW(), NOW())";
        
        executeQuery($sql, [
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => $passwordHash,
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
            'verification_token' => $verificationToken,
            'is_active' => $isActive ? 1 : 0
        ]);
        
        $userId = getDbConnection()->lastInsertId();
        
        // Create initial user preferences
        $prefsSql = "INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at)
                    VALUES (:user_id, 'theme', 'light', NOW()),
                           (:user_id, 'notifications', 'all', NOW()),
                           (:user_id, 'privacy', 'public', NOW())";
        
        executeQuery($prefsSql, ['user_id' => $userId]);
        
        // Create initial leaderboard entry
        $leaderboardSql = "INSERT INTO leaderboard (user_id, points, last_updated)
                          VALUES (:user_id, 0, NOW())";
        
        executeQuery($leaderboardSql, ['user_id' => $userId]);
        
        // Send verification email if required
        if (REQUIRE_EMAIL_VERIFICATION) {
            sendVerificationEmail($userId, $data['email'], $verificationToken);
        }
        
        // Commit transaction
        getDbConnection()->commit();
        
        return [
            'message' => REQUIRE_EMAIL_VERIFICATION ? 
                        'Registration successful. Please check your email to verify your account.' : 
                        'Registration successful. You may now log in.',
            'user_id' => $userId,
            'require_verification' => REQUIRE_EMAIL_VERIFICATION
        ];
    } catch (Exception $e) {
        // Rollback transaction
        getDbConnection()->rollBack();
        
        // Rethrow specific errors
        if ($e->getCode() === 409) {
            throw $e;
        }
        
        logMessage('Registration error: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to register user', 500);
    }
}

/**
 * Handle user logout
 * 
 * @param array $data Logout data (refresh token)
 * @return array Logout result
 */
function handleLogout($data) {
    // Revoke refresh token if provided
    if (isset($data['refresh_token']) && !empty($data['refresh_token'])) {
        try {
            $sql = "DELETE FROM user_tokens WHERE token = :token AND type = 'refresh'";
            executeQuery($sql, ['token' => $data['refresh_token']]);
        } catch (Exception $e) {
            logMessage('Logout error: ' . $e->getMessage(), 'error');
            // Continue anyway
        }
    }
    
    return ['message' => 'Logged out successfully'];
}

/**
 * Handle password reset request
 * 
 * @param array $data Password reset request data
 * @return array Reset request result
 * @throws Exception if email not found or request fails
 */
function handleForgotPassword($data) {
    if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Valid email address is required', 400);
    }
    
    try {
        // Check if user exists
        $sql = "SELECT id, username FROM users WHERE email = :email AND is_active = 1";
        $stmt = executeQuery($sql, ['email' => $data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Generate reset token
            $token = generateRandomToken();
            $expires = date('Y-m-d H:i:s', time() + PASSWORD_RESET_LIFETIME);
            
            // Remove any existing tokens
            $deleteSql = "DELETE FROM user_tokens WHERE user_id = :user_id AND type = 'reset'";
            executeQuery($deleteSql, ['user_id' => $user['id']]);
            
            // Store token
            $tokenSql = "INSERT INTO user_tokens (user_id, token, type, expires_at, created_at)
                         VALUES (:user_id, :token, 'reset', :expires_at, NOW())";
            executeQuery($tokenSql, [
                'user_id' => $user['id'],
                'token' => $token,
                'expires_at' => $expires
            ]);
            
            // Send reset email
            sendPasswordResetEmail($user['id'], $data['email'], $user['username'], $token);
        }
        
        // Always return success to prevent email enumeration
        return [
            'message' => 'If your email is registered, you will receive password reset instructions.'
        ];
    } catch (Exception $e) {
        logMessage('Password reset request error: ' . $e->getMessage(), 'error');
        // Still return success message
        return [
            'message' => 'If your email is registered, you will receive password reset instructions.'
        ];
    }
}

/**
 * Handle password reset confirmation
 * 
 * @param array $data Password reset data including token and new password
 * @return array Reset result
 * @throws Exception if reset fails
 */
function handleResetPassword($data) {
    // Validate required fields
    if (!isset($data['token']) || empty($data['token'])) {
        throw new Exception('Reset token is required', 400);
    }
    
    if (!isset($data['password']) || strlen($data['password']) < 8) {
        throw new Exception('Password must be at least 8 characters', 400);
    }
    
    // Check for password strength
    if (!preg_match('/[A-Z]/', $data['password']) || 
        !preg_match('/[a-z]/', $data['password']) || 
        !preg_match('/[0-9]/', $data['password'])) {
        throw new Exception('Password must include uppercase, lowercase, and numbers', 400);
    }
    
    try {
        // Begin transaction
        getDbConnection()->beginTransaction();
        
        // Find token
        $tokenSql = "SELECT user_id FROM user_tokens 
                    WHERE token = :token 
                    AND type = 'reset' 
                    AND expires_at > NOW()";
        
        $tokenStmt = executeQuery($tokenSql, ['token' => $data['token']]);
        $tokenData = $tokenStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$tokenData) {
            throw new Exception('Invalid or expired reset token', 400);
        }
        
        $userId = $tokenData['user_id'];
        
        // Update password
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $updateSql = "UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id";
        executeQuery($updateSql, [
            'id' => $userId,
            'password' => $passwordHash
        ]);
        
        // Delete all reset tokens for this user
        $deleteTokenSql = "DELETE FROM user_tokens WHERE user_id = :user_id AND type = 'reset'";
        executeQuery($deleteTokenSql, ['user_id' => $userId]);
        
        // Commit transaction
        getDbConnection()->commit();
        
        return ['message' => 'Password reset successful. You may now log in with your new password.'];
    } catch (Exception $e) {
        // Rollback transaction
        getDbConnection()->rollBack();
        
        logMessage('Password reset error: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to reset password', 500);
    }
}

/**
 * Handle email verification
 * 
 * @param array $data Verification data including token
 * @return array Verification result
 * @throws Exception if verification fails
 */
function handleEmailVerification($data) {
    if (!isset($data['token']) || empty($data['token'])) {
        throw new Exception('Verification token is required', 400);
    }
    
    try {
        // Begin transaction
        getDbConnection()->beginTransaction();
        
        // Find user by verification token
        $sql = "SELECT id FROM users WHERE verification_token = :token AND is_active = 0";
        $stmt = executeQuery($sql, ['token' => $data['token']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            throw new Exception('Invalid or expired verification token', 400);
        }
        
        // Update user status
        $updateSql = "UPDATE users SET 
                    is_active = 1, 
                    email_verified_at = NOW(), 
                    verification_token = NULL, 
                    updated_at = NOW() 
                    WHERE id = :id";
        
        executeQuery($updateSql, ['id' => $user['id']]);
        
        // Commit transaction
        getDbConnection()->commit();
        
        return ['message' => 'Email verified successfully. You may now log in.'];
    } catch (Exception $e) {
        // Rollback transaction
        getDbConnection()->rollBack();
        
        logMessage('Email verification error: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to verify email', 500);
    }
}

/**
 * Handle refresh token to get new access token
 * 
 * @param array $data Refresh token data
 * @return array New tokens
 * @throws Exception if refresh fails
 */
function handleTokenRefresh($data) {
    if (!isset($data['refresh_token']) || empty($data['refresh_token'])) {
        throw new Exception('Refresh token is required', 400);
    }
    
    try {
        // Begin transaction
        getDbConnection()->beginTransaction();
        
        // Find refresh token
        $tokenSql = "SELECT t.user_id, t.id as token_id, u.username, u.email, u.role
                   FROM user_tokens t
                   JOIN users u ON t.user_id = u.id
                   WHERE t.token = :token 
                   AND t.type = 'refresh' 
                   AND t.expires_at > NOW()
                   AND u.is_active = 1";
        
        $tokenStmt = executeQuery($tokenSql, ['token' => $data['refresh_token']]);
        $tokenData = $tokenStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$tokenData) {
            throw new Exception('Invalid or expired refresh token', 401);
        }
        
        // Generate new access token
        $user = [
            'id' => $tokenData['user_id'],
            'username' => $tokenData['username'],
            'email' => $tokenData['email'],
            'role' => $tokenData['role']
        ];
        
        $accessToken = generateAccessToken($user);
        
        // Optionally rotate refresh token for better security
        if (ROTATE_REFRESH_TOKENS) {
            // Delete old token
            $deleteTokenSql = "DELETE FROM user_tokens WHERE id = :id";
            executeQuery($deleteTokenSql, ['id' => $tokenData['token_id']]);
            
            // Generate new refresh token
            $refreshToken = generateRefreshToken($user['id']);
        } else {
            $refreshToken = $data['refresh_token'];
        }
        
        // Commit transaction
        getDbConnection()->commit();
        
        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => ACCESS_TOKEN_LIFETIME
        ];
    } catch (Exception $e) {
        // Rollback transaction
        getDbConnection()->rollBack();
        
        logMessage('Token refresh error: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to refresh token', 500);
    }
}

/**
 * Generate a JWT access token for a user
 * 
 * @param array $user User data
 * @return string JWT token
 */
function generateAccessToken($user) {
    // In a real application, you would use a proper JWT library
    // This is a simplified implementation for demonstration
    
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT'
    ];
    
    $payload = [
        'sub' => $user['id'],
        'name' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'iat' => time(),
        'exp' => time() + ACCESS_TOKEN_LIFETIME
    ];
    
    $headerEncoded = base64url_encode(json_encode($header));
    $payloadEncoded = base64url_encode(json_encode($payload));
    
    $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", JWT_SECRET, true);
    $signatureEncoded = base64url_encode($signature);
    
    return "$headerEncoded.$payloadEncoded.$signatureEncoded";
}

/**
 * Generate a refresh token for a user
 * 
 * @param int $userId User ID
 * @return string Refresh token
 */
function generateRefreshToken($userId) {
    $token = generateRandomToken();
    $expires = date('Y-m-d H:i:s', time() + REFRESH_TOKEN_LIFETIME);
    
    $sql = "INSERT INTO user_tokens (user_id, token, type, expires_at, created_at)
            VALUES (:user_id, :token, 'refresh', :expires_at, NOW())";
    
    executeQuery($sql, [
        'user_id' => $userId,
        'token' => $token,
        'expires_at' => $expires
    ]);
    
    return $token;
}

/**
 * Generate a random secure token
 * 
 * @param int $length Token length
 * @return string Random token
 */
function generateRandomToken($length = 32) {
    if (function_exists('random_bytes')) {
        return bin2hex(random_bytes($length / 2));
    } elseif (function_exists('openssl_random_pseudo_bytes')) {
        return bin2hex(openssl_random_pseudo_bytes($length / 2));
    } else {
        // Fallback to a less secure method
        $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $result = '';
        for ($i = 0; $i < $length; $i++) {
            $result .= $chars[rand(0, strlen($chars) - 1)];
        }
        return $result;
    }
}

/**
 * Base64URL encode (JWT-safe)
 * 
 * @param string $data Data to encode
 * @return string Base64URL encoded string
 */
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Log a login attempt
 * 
 * @param string $identifier Username or email
 * @param string $ip IP address
 * @param bool $success Whether login was successful
 * @return void
 */
function logLoginAttempt($identifier, $ip, $success) {
    try {
        $sql = "INSERT INTO login_attempts (identifier, ip_address, success, attempted_at)
                VALUES (:identifier, :ip, :success, NOW())";
        
        executeQuery($sql, [
            'identifier' => $identifier,
            'ip' => $ip,
            'success' => $success ? 1 : 0
        ]);
    } catch (Exception $e) {
        logMessage('Failed to log login attempt: ' . $e->getMessage(), 'error');
    }
}

/**
 * Send email verification email
 * 
 * @param int $userId User ID
 * @param string $email User's email
 * @param string|null $token Verification token (if not provided, will fetch from DB)
 * @return bool Whether email was sent
 */
function sendVerificationEmail($userId, $email, $token = null) {
    // If token not provided, fetch it from the database
    if (!$token) {
        $sql = "SELECT verification_token FROM users WHERE id = :id";
        $stmt = executeQuery($sql, ['id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !$user['verification_token']) {
            return false;
        }
        
        $token = $user['verification_token'];
    }
    
    $verifyUrl = SITE_URL . '/verify-email?token=' . $token;
    
    $subject = SITE_NAME . ' - Verify Your Email Address';
    $message = "Hello,\n\nThank you for registering with " . SITE_NAME . "!\n\n" .
              "Please click the link below to verify your email address:\n" .
              $verifyUrl . "\n\n" .
              "This link will expire in 24 hours.\n\n" .
              "If you did not create this account, please ignore this email.\n\n" .
              "Best regards,\n" . SITE_NAME . " Team";
    
    return sendEmail($email, $subject, $message);
}

/**
 * Send password reset email
 * 
 * @param int $userId User ID
 * @param string $email User's email
 * @param string $username User's username
 * @param string $token Reset token
 * @return bool Whether email was sent
 */
function sendPasswordResetEmail($userId, $email, $username, $token) {
    $resetUrl = SITE_URL . '/reset-password?token=' . $token;
    
    $subject = SITE_NAME . ' - Password Reset Request';
    $message = "Hello " . $username . ",\n\n" .
              "We received a request to reset your password for your account at " . SITE_NAME . ".\n\n" .
              "Please click the link below to reset your password:\n" .
              $resetUrl . "\n\n" .
              "This link will expire in 1 hour.\n\n" .
              "If you did not request a password reset, please ignore this email or contact support if you have concerns.\n\n" .
              "Best regards,\n" . SITE_NAME . " Team";
    
    return sendEmail($email, $subject, $message);
}

/**
 * Send an email
 * 
 * @param string $to Recipient email
 * @param string $subject Email subject
 * @param string $message Email body
 * @param string $from From email address (optional)
 * @return bool Whether email was sent
 */
function sendEmail($to, $subject, $message, $from = null) {
    if (!$from) {
        $from = MAIL_FROM;
    }
    
    $headers = "From: " . $from . "\r\n" .
              "Reply-To: " . $from . "\r\n" .
              "X-Mailer: PHP/" . phpversion();
    
    try {
        return mail($to, $subject, $message, $headers);
    } catch (Exception $e) {
        logMessage('Failed to send email: ' . $e->getMessage(), 'error');
        return false;
    }
}