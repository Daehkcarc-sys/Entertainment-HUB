<?php
/**
 * Avatar Update Handler
 * Processes profile avatar image uploads
 */

// Start session
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    $_SESSION['flash_message'] = 'You must be logged in to update your avatar.';
    $_SESSION['flash_message_type'] = 'error';
    header('Location: ../signin.php');
    exit;
}

// Check if file was uploaded
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    $_SESSION['flash_message'] = 'No file uploaded or upload error occurred.';
    $_SESSION['flash_message_type'] = 'error';
    header('Location: ../profile.php');
    exit;
}

// Include database configuration
require_once 'db_config.php';

// Set up allowed file types and max size
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxFileSize = 5 * 1024 * 1024; // 5MB

// Check file type
$fileType = $_FILES['avatar']['type'];
if (!in_array($fileType, $allowedTypes)) {
    $_SESSION['flash_message'] = 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.';
    $_SESSION['flash_message_type'] = 'error';
    header('Location: ../profile.php');
    exit;
}

// Check file size
if ($_FILES['avatar']['size'] > $maxFileSize) {
    $_SESSION['flash_message'] = 'File too large. Maximum file size is 5MB.';
    $_SESSION['flash_message_type'] = 'error';
    header('Location: ../profile.php');
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = '../images/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$fileName = 'avatar_' . $_SESSION['user_id'] . '_' . time() . '.jpg';
$uploadPath = $uploadDir . $fileName;

// Process and resize image
try {
    // Check if GD library is available
    if (!extension_loaded('gd')) {
        throw new Exception('GD library is not available.');
    }
    
    // Create image from uploaded file
    $image = null;
    switch ($fileType) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($_FILES['avatar']['tmp_name']);
            break;
        case 'image/png':
            $image = imagecreatefrompng($_FILES['avatar']['tmp_name']);
            break;
        case 'image/gif':
            $image = imagecreatefromgif($_FILES['avatar']['tmp_name']);
            break;
        case 'image/webp':
            $image = imagecreatefromwebp($_FILES['avatar']['tmp_name']);
            break;
        default:
            throw new Exception('Unsupported image format.');
    }
    
    if (!$image) {
        throw new Exception('Failed to create image resource.');
    }
    
    // Get image dimensions
    $width = imagesx($image);
    $height = imagesy($image);
    
    // Create a square crop (centered)
    $size = min($width, $height);
    $x = ($width - $size) / 2;
    $y = ($height - $size) / 2;
    
    // Create new square image
    $squareImage = imagecreatetruecolor(300, 300);
    
    // Preserve transparency for PNG images
    if ($fileType === 'image/png') {
        imagealphablending($squareImage, false);
        imagesavealpha($squareImage, true);
    }
    
    // Resize and crop the image
    imagecopyresampled($squareImage, $image, 0, 0, $x, $y, 300, 300, $size, $size);
    
    // Save the resized image as JPEG
    imagejpeg($squareImage, $uploadPath, 90);
    
    // Free memory
    imagedestroy($image);
    imagedestroy($squareImage);
    
} catch (Exception $e) {
    // If image processing fails, try to move the uploaded file directly
    if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadPath)) {
        $_SESSION['flash_message'] = 'Error uploading file: ' . $e->getMessage();
        $_SESSION['flash_message_type'] = 'error';
        header('Location: ../profile.php');
        exit;
    }
}

// Update user's avatar in the database
try {
    $db = getDbConnection();
    
    // Get current avatar to delete later if not default
    $stmt = $db->prepare('SELECT avatar FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $oldAvatar = $stmt->fetchColumn();
    
    // Update avatar in database
    $stmt = $db->prepare('UPDATE users SET avatar = ? WHERE id = ?');
    $stmt->execute([$fileName, $_SESSION['user_id']]);
    
    // Update session avatar
    $_SESSION['avatar'] = $fileName;
    
    // Delete old avatar file if it's not the default
    if ($oldAvatar && $oldAvatar !== 'Avatar.jpg' && file_exists($uploadDir . $oldAvatar)) {
        unlink($uploadDir . $oldAvatar);
    }
    
    // Success message and redirect
    $_SESSION['flash_message'] = 'Avatar updated successfully!';
    $_SESSION['flash_message_type'] = 'success';
    header('Location: ../profile.php');
    exit;
    
} catch (PDOException $e) {
    $_SESSION['flash_message'] = 'Error updating avatar in database.';
    $_SESSION['flash_message_type'] = 'error';
    header('Location: ../profile.php');
    exit;
}