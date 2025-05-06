<?php
/**
 * User Authentication System
 * 
 * Handles user login, registration, password management, and authorization.
 */

// Include required files
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/functions.php';

/**
 * Authenticate a user by username/email and password
 * 
 * @param string $identifier Username or email
 * @param string $password Password
 * @param bool $rememberMe Whether to remember the user
 * @return array|bool User data if authenticated, false otherwise
 */
function authenticateUser($identifier, $password, $rememberMe = false) {
    // Check for too many failed login attempts
    if (checkLoginAttempts($identifier)) {
        return ['error' => 'Too many failed login attempts. Please try again later.'];
    }
    
    try {
        // Check if identifier is email or username
        $isEmail = isValidEmail($identifier);
        $field = $isEmail ? 'email' : 'username';
        
        // Get user by email or username
        $sql = "SELECT * FROM users WHERE $field = :identifier AND is_active = 1 LIMIT 1";
        $stmt = executeQuery($sql, ['identifier' => $identifier]);
        $user = $stmt->fetch();
        
        if (!$user) {
            // Record failed attempt
            recordFailedLogin($identifier);
            return ['error' => 'Invalid username/email or password.'];
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            // Record failed attempt
            recordFailedLogin($identifier);
            return ['error' => 'Invalid username/email or password.'];
        }
        
        // Check if password needs rehashing
        if (password_needs_rehash($user['password'], PASSWORD_DEFAULT, ['cost' => HASH_COST])) {
            $newHash = password_hash($password, PASSWORD_DEFAULT, ['cost' => HASH_COST]);
            $updateSql = "UPDATE users SET password = :password WHERE id = :id";
            executeQuery($updateSql, ['password' => $newHash, 'id' => $user['id']]);
        }
        
        // Clear failed login attempts
        clearFailedLogins($identifier);
        
        // Update last login
        $updateSql = "UPDATE users SET last_login = NOW() WHERE id = :id";
        executeQuery($updateSql, ['id' => $user['id']]);
        
        // Set remember me cookie if requested
        if ($rememberMe) {
            createRememberMeToken($user['id']);
        }
        
        // Create session for the logged in user
        createUserSession($user);
        
        return $user;
    } catch (Exception $e) {
        logMessage('Authentication error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during authentication.'];
    }
}

/**
 * Register a new user
 * 
 * @param array $userData User data
 * @return array|bool User ID if registration successful, array with error if not
 */
function registerUser($userData) {
    try {
        // Validate required fields
        $requiredFields = ['username', 'email', 'password', 'confirm_password'];
        foreach ($requiredFields as $field) {
            if (empty($userData[$field])) {
                return ['error' => ucfirst($field) . ' is required.'];
            }
        }
        
        // Validate username format
        if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $userData['username'])) {
            return ['error' => 'Username must be 3-20 characters and contain only letters, numbers, and underscores.'];
        }
        
        // Validate email
        if (!isValidEmail($userData['email'])) {
            return ['error' => 'Please enter a valid email address.'];
        }
        
        // Check password strength
        if (strlen($userData['password']) < MIN_PASSWORD_LENGTH) {
            return ['error' => 'Password must be at least ' . MIN_PASSWORD_LENGTH . ' characters.'];
        }
        
        // Check if passwords match
        if ($userData['password'] !== $userData['confirm_password']) {
            return ['error' => 'Passwords do not match.'];
        }
        
        // Check if username or email already exists
        $sql = "SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1";
        $stmt = executeQuery($sql, [
            'username' => $userData['username'],
            'email' => $userData['email']
        ]);
        
        if ($stmt->fetch()) {
            return ['error' => 'Username or email already exists.'];
        }
        
        // Hash password
        $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT, ['cost' => HASH_COST]);
        
        // Generate verification token if email verification enabled
        $verificationToken = null;
        $isActive = 1;  // Set to 0 if email verification is required
        
        if (defined('REQUIRE_EMAIL_VERIFICATION') && REQUIRE_EMAIL_VERIFICATION) {
            $verificationToken = generateToken();
            $isActive = 0;
        }
        
        // Insert user into database
        $sql = "INSERT INTO users (username, email, password, verification_token, is_active, created_at) 
                VALUES (:username, :email, :password, :verification_token, :is_active, NOW())";
        
        $params = [
            'username' => $userData['username'],
            'email' => $userData['email'],
            'password' => $hashedPassword,
            'verification_token' => $verificationToken,
            'is_active' => $isActive
        ];
        
        executeQuery($sql, $params);
        $userId = getDbConnection()->lastInsertId();
        
        // Send verification email if required
        if ($verificationToken !== null) {
            sendVerificationEmail($userData['email'], $verificationToken);
        }
        
        return $userId;
    } catch (Exception $e) {
        logMessage('Registration error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during registration.'];
    }
}

/**
 * Create a session for logged in user
 * 
 * @param array $user User data
 * @return void
 */
function createUserSession($user) {
    // Store essential user data in session
    setSession('user_id', $user['id']);
    setSession('username', $user['username']);
    setSession('user_role', $user['role']);
    setSession('user_email', $user['email']);
    
    // Set login time
    setSession('login_time', time());
    
    // Log the login
    logMessage('User logged in: ' . $user['username'], 'info');
}

/**
 * Check if user is logged in by session or remember me cookie
 * 
 * @return bool True if logged in, false otherwise
 */
function checkLoggedIn() {
    // Check if user is already logged in via session
    if (isLoggedIn()) {
        return true;
    }
    
    // Check for remember me cookie
    if (isset($_COOKIE[COOKIE_PREFIX . 'remember'])) {
        $cookie = $_COOKIE[COOKIE_PREFIX . 'remember'];
        $cookieParts = explode(':', $cookie);
        
        if (count($cookieParts) === 2) {
            list($userId, $token) = $cookieParts;
            
            // Verify token
            $sql = "SELECT * FROM user_tokens WHERE user_id = :user_id AND token = :token AND type = 'remember_me' AND expires_at > NOW()";
            $stmt = executeQuery($sql, [
                'user_id' => $userId,
                'token' => $token
            ]);
            
            $tokenData = $stmt->fetch();
            
            if ($tokenData) {
                // Get user data
                $sql = "SELECT * FROM users WHERE id = :id AND is_active = 1";
                $stmt = executeQuery($sql, ['id' => $userId]);
                $user = $stmt->fetch();
                
                if ($user) {
                    // Create new session
                    createUserSession($user);
                    
                    // Refresh remember me token
                    createRememberMeToken($userId);
                    
                    return true;
                }
            }
        }
        
        // If we get here, the token is invalid, so delete the cookie
        setcookie(COOKIE_PREFIX . 'remember', '', time() - 3600, '/');
    }
    
    return false;
}

/**
 * Create remember me token
 * 
 * @param int $userId User ID
 * @return void
 */
function createRememberMeToken($userId) {
    // Generate token
    $token = generateToken();
    $expires = time() + REMEMBER_ME_DURATION;
    
    // Delete any existing remember me tokens for this user
    $sql = "DELETE FROM user_tokens WHERE user_id = :user_id AND type = 'remember_me'";
    executeQuery($sql, ['user_id' => $userId]);
    
    // Insert new token
    $sql = "INSERT INTO user_tokens (user_id, token, type, expires_at, created_at) 
            VALUES (:user_id, :token, 'remember_me', FROM_UNIXTIME(:expires), NOW())";
    
    executeQuery($sql, [
        'user_id' => $userId,
        'token' => $token,
        'expires' => $expires
    ]);
    
    // Set cookie
    setcookie(
        COOKIE_PREFIX . 'remember',
        $userId . ':' . $token,
        $expires,
        '/',
        '',
        isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        true  // HttpOnly
    );
}

/**
 * Log out user
 * 
 * @return void
 */
function logoutUser() {
    // Delete remember me cookie and token if exists
    if (isset($_COOKIE[COOKIE_PREFIX . 'remember'])) {
        $cookie = $_COOKIE[COOKIE_PREFIX . 'remember'];
        $cookieParts = explode(':', $cookie);
        
        if (count($cookieParts) === 2) {
            list($userId, $token) = $cookieParts;
            
            // Delete token from database
            $sql = "DELETE FROM user_tokens WHERE user_id = :user_id AND token = :token AND type = 'remember_me'";
            executeQuery($sql, [
                'user_id' => $userId,
                'token' => $token
            ]);
        }
        
        // Delete cookie
        setcookie(COOKIE_PREFIX . 'remember', '', time() - 3600, '/');
    }
    
    // Log the logout if user was logged in
    if (isLoggedIn()) {
        logMessage('User logged out: ' . getSession('username'), 'info');
    }
    
    // Destroy session
    destroySession();
}

/**
 * Reset user password
 * 
 * @param string $email User email
 * @return array Result with success or error message
 */
function resetPassword($email) {
    try {
        if (!isValidEmail($email)) {
            return ['error' => 'Please enter a valid email address.'];
        }
        
        // Check if user exists
        $sql = "SELECT id, username FROM users WHERE email = :email AND is_active = 1";
        $stmt = executeQuery($sql, ['email' => $email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            // Don't reveal if email exists or not
            return ['success' => 'If your email exists in our system, you will receive a password reset link.'];
        }
        
        // Generate reset token
        $token = generateToken();
        $expires = time() + 3600; // 1 hour
        
        // Delete any existing password reset tokens for this user
        $sql = "DELETE FROM user_tokens WHERE user_id = :user_id AND type = 'password_reset'";
        executeQuery($sql, ['user_id' => $user['id']]);
        
        // Insert new token
        $sql = "INSERT INTO user_tokens (user_id, token, type, expires_at, created_at) 
                VALUES (:user_id, :token, 'password_reset', FROM_UNIXTIME(:expires), NOW())";
        
        executeQuery($sql, [
            'user_id' => $user['id'],
            'token' => $token,
            'expires' => $expires
        ]);
        
        // Send password reset email
        sendPasswordResetEmail($email, $user['username'], $token);
        
        return ['success' => 'If your email exists in our system, you will receive a password reset link.'];
    } catch (Exception $e) {
        logMessage('Password reset error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during password reset.'];
    }
}

/**
 * Change user password
 * 
 * @param int $userId User ID
 * @param string $currentPassword Current password
 * @param string $newPassword New password
 * @param string $confirmPassword Confirm new password
 * @return array Result with success or error message
 */
function changePassword($userId, $currentPassword, $newPassword, $confirmPassword) {
    try {
        // Get user data
        $sql = "SELECT * FROM users WHERE id = :id AND is_active = 1";
        $stmt = executeQuery($sql, ['id' => $userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return ['error' => 'User not found.'];
        }
        
        // Verify current password
        if (!password_verify($currentPassword, $user['password'])) {
            return ['error' => 'Current password is incorrect.'];
        }
        
        // Check if new password is same as current
        if (password_verify($newPassword, $user['password'])) {
            return ['error' => 'New password must be different from current password.'];
        }
        
        // Check password strength
        if (strlen($newPassword) < MIN_PASSWORD_LENGTH) {
            return ['error' => 'Password must be at least ' . MIN_PASSWORD_LENGTH . ' characters.'];
        }
        
        // Check if new passwords match
        if ($newPassword !== $confirmPassword) {
            return ['error' => 'Passwords do not match.'];
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT, ['cost' => HASH_COST]);
        
        // Update password
        $sql = "UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id";
        executeQuery($sql, [
            'password' => $hashedPassword,
            'id' => $userId
        ]);
        
        // Log password change
        logMessage('User ID ' . $userId . ' changed their password', 'info');
        
        return ['success' => 'Password changed successfully.'];
    } catch (Exception $e) {
        logMessage('Password change error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred while changing password.'];
    }
}

/**
 * Check if user has exceeded maximum login attempts
 * 
 * @param string $identifier Username or email
 * @return bool True if too many attempts, false otherwise
 */
function checkLoginAttempts($identifier) {
    // Get login attempts from database for this user/IP
    $ip = getClientIp();
    $sql = "SELECT COUNT(*) as attempts, MAX(attempted_at) as last_attempt 
            FROM login_attempts 
            WHERE identifier = :identifier OR ip_address = :ip 
            AND success = 0 
            AND attempted_at > DATE_SUB(NOW(), INTERVAL " . LOGIN_TIMEOUT . " SECOND)";
    
    $stmt = executeQuery($sql, [
        'identifier' => $identifier,
        'ip' => $ip
    ]);
    
    $result = $stmt->fetch();
    
    if ($result && $result['attempts'] >= MAX_LOGIN_ATTEMPTS) {
        // Check if timeout has passed
        if ($result['last_attempt']) {
            $lastAttempt = strtotime($result['last_attempt']);
            $timeElapsed = time() - $lastAttempt;
            
            if ($timeElapsed < LOGIN_TIMEOUT) {
                return true; // Too many attempts and timeout not passed
            }
        }
    }
    
    return false;
}

/**
 * Record failed login attempt
 * 
 * @param string $identifier Username or email
 * @return void
 */
function recordFailedLogin($identifier) {
    $ip = getClientIp();
    $sql = "INSERT INTO login_attempts (identifier, ip_address, success, attempted_at) 
            VALUES (:identifier, :ip_address, 0, NOW())";
    
    executeQuery($sql, [
        'identifier' => $identifier,
        'ip_address' => $ip
    ]);
}

/**
 * Clear failed login attempts
 * 
 * @param string $identifier Username or email
 * @return void
 */
function clearFailedLogins($identifier) {
    $ip = getClientIp();
    $sql = "INSERT INTO login_attempts (identifier, ip_address, success, attempted_at) 
            VALUES (:identifier, :ip_address, 1, NOW())";
    
    executeQuery($sql, [
        'identifier' => $identifier,
        'ip_address' => $ip
    ]);
}

/**
 * Send verification email
 * 
 * @param string $email User email
 * @param string $token Verification token
 * @return bool True if email sent, false otherwise
 */
function sendVerificationEmail($email, $token) {
    $subject = 'Verify Your Email Address';
    $verificationUrl = SITE_URL . '/verify.php?token=' . $token;
    
    $message = "
    <html>
    <head>
        <title>Verify Your Email Address</title>
    </head>
    <body>
        <h1>Welcome to Entertainment Hub!</h1>
        <p>Thank you for registering. Please click the link below to verify your email address:</p>
        <p><a href=\"$verificationUrl\">Verify Email Address</a></p>
        <p>If you didn't register on our site, please ignore this email.</p>
        <p>Regards,<br>The Entertainment Hub Team</p>
    </body>
    </html>
    ";
    
    return sendEmail($email, $subject, $message);
}

/**
 * Send password reset email
 * 
 * @param string $email User email
 * @param string $username Username
 * @param string $token Reset token
 * @return bool True if email sent, false otherwise
 */
function sendPasswordResetEmail($email, $username, $token) {
    $subject = 'Password Reset Request';
    $resetUrl = SITE_URL . '/reset-password.php?token=' . $token;
    
    $message = "
    <html>
    <head>
        <title>Password Reset Request</title>
    </head>
    <body>
        <h1>Hello, $username!</h1>
        <p>We received a request to reset your password. Please click the link below to reset it:</p>
        <p><a href=\"$resetUrl\">Reset Your Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>Regards,<br>The Entertainment Hub Team</p>
    </body>
    </html>
    ";
    
    return sendEmail($email, $subject, $message);
}

/**
 * Send email using PHP mail function or configured SMTP
 * 
 * @param string $to Recipient email
 * @param string $subject Email subject
 * @param string $message Email message (HTML)
 * @return bool True if email sent, false otherwise
 */
function sendEmail($to, $subject, $message) {
    // Add a plain text version
    $plainText = strip_tags($message);
    
    // Set headers
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM . '>',
        'Reply-To: ' . EMAIL_FROM,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    try {
        // Check if we should use SMTP
        if (defined('EMAIL_SMTP_HOST') && !empty(EMAIL_SMTP_HOST)) {
            // Use PHPMailer or similar library for SMTP
            // This is a placeholder for SMTP implementation
            // Typically, you would implement this with a library like PHPMailer
            
            logMessage('SMTP email sending not implemented yet', 'warning');
            $mailSent = mail($to, $subject, $message, implode("\r\n", $headers));
        } else {
            // Use PHP mail function
            $mailSent = mail($to, $subject, $message, implode("\r\n", $headers));
        }
        
        if (!$mailSent) {
            logMessage('Failed to send email to ' . $to, 'error');
            return false;
        }
        
        return true;
    } catch (Exception $e) {
        logMessage('Email sending error: ' . $e->getMessage(), 'error');
        return false;
    }
}

/**
 * Verify user email with token
 * 
 * @param string $token Verification token
 * @return array Result with success or error message
 */
function verifyUserEmail($token) {
    try {
        // Find user with this token
        $sql = "SELECT id FROM users WHERE verification_token = :token AND is_active = 0";
        $stmt = executeQuery($sql, ['token' => $token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return ['error' => 'Invalid or expired verification token.'];
        }
        
        // Update user status
        $sql = "UPDATE users SET is_active = 1, verification_token = NULL, email_verified_at = NOW() WHERE id = :id";
        executeQuery($sql, ['id' => $user['id']]);
        
        return ['success' => 'Your email has been verified. You can now log in.'];
    } catch (Exception $e) {
        logMessage('Email verification error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during email verification.'];
    }
}

/**
 * Validate password reset token
 * 
 * @param string $token Reset token
 * @return array User data if valid, error otherwise
 */
function validateResetToken($token) {
    try {
        $sql = "SELECT u.id, u.username, u.email 
                FROM user_tokens t
                JOIN users u ON t.user_id = u.id
                WHERE t.token = :token 
                AND t.type = 'password_reset' 
                AND t.expires_at > NOW()
                AND u.is_active = 1";
        
        $stmt = executeQuery($sql, ['token' => $token]);
        $tokenData = $stmt->fetch();
        
        if (!$tokenData) {
            return ['error' => 'Invalid or expired reset token.'];
        }
        
        return $tokenData;
    } catch (Exception $e) {
        logMessage('Reset token validation error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during token validation.'];
    }
}

/**
 * Complete password reset with new password
 * 
 * @param string $token Reset token
 * @param string $password New password
 * @param string $confirmPassword Confirm new password
 * @return array Result with success or error message
 */
function completePasswordReset($token, $password, $confirmPassword) {
    try {
        // Validate token and get user
        $tokenData = validateResetToken($token);
        
        if (isset($tokenData['error'])) {
            return $tokenData;
        }
        
        // Check password strength
        if (strlen($password) < MIN_PASSWORD_LENGTH) {
            return ['error' => 'Password must be at least ' . MIN_PASSWORD_LENGTH . ' characters.'];
        }
        
        // Check if passwords match
        if ($password !== $confirmPassword) {
            return ['error' => 'Passwords do not match.'];
        }
        
        // Hash new password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT, ['cost' => HASH_COST]);
        
        // Update password
        $sql = "UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id";
        executeQuery($sql, [
            'password' => $hashedPassword,
            'id' => $tokenData['id']
        ]);
        
        // Delete used token
        $sql = "DELETE FROM user_tokens WHERE token = :token AND type = 'password_reset'";
        executeQuery($sql, ['token' => $token]);
        
        // Log password reset
        logMessage('User ID ' . $tokenData['id'] . ' reset their password', 'info');
        
        return ['success' => 'Your password has been reset successfully. You can now log in with your new password.'];
    } catch (Exception $e) {
        logMessage('Password reset completion error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during password reset.'];
    }
}

/**
 * Get user profile data
 * 
 * @param int $userId User ID
 * @return array|bool User data if found, false otherwise
 */
function getUserProfile($userId) {
    try {
        $sql = "SELECT id, username, email, first_name, last_name, bio, avatar, role, 
                created_at, last_login, email_verified_at 
                FROM users WHERE id = :id AND is_active = 1";
        
        $stmt = executeQuery($sql, ['id' => $userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return false;
        }
        
        // Set avatar URL if exists
        if ($user['avatar']) {
            $user['avatar_url'] = UPLOADS_URL . '/images/avatars/' . $user['avatar'];
        } else {
            $user['avatar_url'] = ASSETS_URL . '/images/default-avatar.png';
        }
        
        return $user;
    } catch (Exception $e) {
        logMessage('Error fetching user profile: ' . $e->getMessage(), 'error');
        return false;
    }
}

/**
 * Update user profile
 * 
 * @param int $userId User ID
 * @param array $data Profile data to update
 * @return array Result with success or error message
 */
function updateUserProfile($userId, $data) {
    try {
        // Validate user exists
        $user = getUserProfile($userId);
        
        if (!$user) {
            return ['error' => 'User not found.'];
        }
        
        // Fields that can be updated
        $allowedFields = ['first_name', 'last_name', 'bio'];
        $updateData = [];
        $params = ['id' => $userId];
        
        // Build update query
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[] = "$field = :$field";
                $params[$field] = sanitizeInput($data[$field]);
            }
        }
        
        if (empty($updateData)) {
            return ['error' => 'No data to update.'];
        }
        
        // Update profile
        $sql = "UPDATE users SET " . implode(', ', $updateData) . ", updated_at = NOW() WHERE id = :id";
        executeQuery($sql, $params);
        
        return ['success' => 'Profile updated successfully.'];
    } catch (Exception $e) {
        logMessage('Profile update error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred while updating profile.'];
    }
}

/**
 * Update user avatar
 * 
 * @param int $userId User ID
 * @param array $file Uploaded file data ($_FILES)
 * @return array Result with success or error message
 */
function updateUserAvatar($userId, $file) {
    try {
        // Validate user exists
        $user = getUserProfile($userId);
        
        if (!$user) {
            return ['error' => 'User not found.'];
        }
        
        // Check if file was uploaded
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return ['error' => 'No file uploaded or upload error.'];
        }
        
        // Validate file type
        $mimeType = mime_content_type($file['tmp_name']);
        if (!isAllowedFileType($mimeType, true)) {
            return ['error' => 'Invalid file type. Allowed types: ' . implode(', ', ALLOWED_IMAGE_TYPES)];
        }
        
        // Validate file size
        if ($file['size'] > MAX_UPLOAD_SIZE) {
            return ['error' => 'File too large. Maximum size: ' . formatFileSize(MAX_UPLOAD_SIZE)];
        }
        
        // Create directory if it doesn't exist
        $uploadDir = IMAGES_PATH . '/avatars';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('avatar_') . '.' . $extension;
        $filepath = $uploadDir . '/' . $filename;
        
        // Move file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return ['error' => 'Failed to save file.'];
        }
        
        // Delete old avatar if exists
        if ($user['avatar'] && file_exists($uploadDir . '/' . $user['avatar'])) {
            unlink($uploadDir . '/' . $user['avatar']);
        }
        
        // Update user avatar in database
        $sql = "UPDATE users SET avatar = :avatar, updated_at = NOW() WHERE id = :id";
        executeQuery($sql, [
            'avatar' => $filename,
            'id' => $userId
        ]);
        
        return ['success' => 'Avatar updated successfully.', 'avatar_url' => UPLOADS_URL . '/images/avatars/' . $filename];
    } catch (Exception $e) {
        logMessage('Avatar update error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred while updating avatar.'];
    }
}