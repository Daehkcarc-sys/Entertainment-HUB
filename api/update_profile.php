<?php
/**
 * Profile Update Handler
 * Processes updates to user profile information
 */

// Start the session
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    $_SESSION['flash_message'] = 'You must be logged in to update your profile.';
    $_SESSION['flash_message_type'] = 'error';
    header('Location: ../signin.php');
    exit;
}

// Include necessary files
require_once 'db_config.php';

// Verify CSRF token
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        $_SESSION['flash_message'] = 'Invalid security token. Please try again.';
        $_SESSION['flash_message_type'] = 'error';
        header('Location: ../settings.php');
        exit;
    }
}

// Initialize database connection
try {
    $db = getDbConnection();
    
    // Sanitize and validate inputs
    $username = trim($_POST['username'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $bio = trim($_POST['bio'] ?? '');
    $interests = $_POST['interests'] ?? '';
    
    // Validate username
    if (empty($username) || strlen($username) < 3) {
        $_SESSION['flash_message'] = 'Username must be at least 3 characters.';
        $_SESSION['flash_message_type'] = 'error';
        header('Location: ../settings.php');
        exit;
    }
    
    // Validate email
    if (!$email) {
        $_SESSION['flash_message'] = 'Please enter a valid email address.';
        $_SESSION['flash_message_type'] = 'error';
        header('Location: ../settings.php');
        exit;
    }
    
    // Check if the username is already taken by another user
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ? AND id != ?');
    $stmt->execute([$username, $_SESSION['user_id']]);
    if ($stmt->fetch()) {
        $_SESSION['flash_message'] = 'This username is already taken.';
        $_SESSION['flash_message_type'] = 'error';
        header('Location: ../settings.php');
        exit;
    }
    
    // Check if the email is already taken by another user
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $stmt->execute([$email, $_SESSION['user_id']]);
    if ($stmt->fetch()) {
        $_SESSION['flash_message'] = 'This email is already registered to another account.';
        $_SESSION['flash_message_type'] = 'error';
        header('Location: ../settings.php');
        exit;
    }
    
    // Limit bio length
    if (strlen($bio) > 250) {
        $bio = substr($bio, 0, 250);
    }
    
    // Store interests as JSON
    $interestsArray = !empty($interests) ? explode(',', $interests) : [];
    $interestsJson = json_encode($interestsArray);
    
    // Update user's profile in the database
    $stmt = $db->prepare('UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?');
    $stmt->execute([$username, $email, $bio, $_SESSION['user_id']]);
    
    // Check if user has interests table entry and create or update accordingly
    $stmt = $db->prepare('SELECT COUNT(*) FROM user_interests WHERE user_id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    
    if ($stmt->fetchColumn() > 0) {
        // Update existing interests
        $stmt = $db->prepare('UPDATE user_interests SET interests = ? WHERE user_id = ?');
        $stmt->execute([$interestsJson, $_SESSION['user_id']]);
    } else {
        // Create new interests entry
        $stmt = $db->prepare('INSERT INTO user_interests (user_id, interests) VALUES (?, ?)');
        $stmt->execute([$_SESSION['user_id'], $interestsJson]);
    }
    
    // Update session variables
    $_SESSION['username'] = $username;
    $_SESSION['email'] = $email;
    
    // Success message
    $_SESSION['flash_message'] = 'Your profile has been updated successfully.';
    $_SESSION['flash_message_type'] = 'success';
    
    // Redirect back to settings page
    header('Location: ../settings.php');
    exit;
    
} catch (PDOException $e) {
    $_SESSION['flash_message'] = 'Error updating profile: ' . $e->getMessage();
    $_SESSION['flash_message_type'] = 'error';
    header('Location: ../settings.php');
    exit;
}