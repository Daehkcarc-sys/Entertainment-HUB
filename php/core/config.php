<?php
/**
 * Application Configuration
 * 
 * Global settings for the Entertainment Hub application.
 */

// Application paths
define('ROOT_PATH', dirname(__DIR__, 2));
define('UPLOADS_PATH', ROOT_PATH . '/uploads');
define('IMAGES_PATH', UPLOADS_PATH . '/images');
define('FILES_PATH', UPLOADS_PATH . '/files');
define('LOGS_PATH', ROOT_PATH . '/logs');

// URL and path configurations
define('SITE_URL', 'http://' . $_SERVER['HTTP_HOST'] . '/Projet'); // Adjust for production
define('ASSETS_URL', SITE_URL . '/assets');
define('UPLOADS_URL', SITE_URL . '/uploads');

// Security settings
define('HASH_COST', 12); // Cost factor for password hashing
define('CSRF_EXPIRY', 7200); // 2 hours expiration for CSRF tokens
define('SESSION_NAME', 'entertainment_hub_session');
define('COOKIE_PREFIX', 'eh_');

// Email configuration
define('EMAIL_FROM', 'noreply@entertainment-hub.com');
define('EMAIL_FROM_NAME', 'Entertainment Hub');
define('EMAIL_SMTP_HOST', 'smtp.example.com'); // Change in production
define('EMAIL_SMTP_PORT', 587);
define('EMAIL_SMTP_USER', ''); // Set in production
define('EMAIL_SMTP_PASS', ''); // Set in production

// Content settings
define('ITEMS_PER_PAGE', 12);
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_FILE_TYPES', ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

// Authentication settings
define('MIN_PASSWORD_LENGTH', 8);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_TIMEOUT', 15 * 60); // 15 minutes timeout after too many failed attempts
define('SESSION_TIMEOUT', 24 * 60 * 60); // 24 hours
define('REMEMBER_ME_DURATION', 30 * 24 * 60 * 60); // 30 days

// API settings
define('API_RATE_LIMIT', 60); // Requests per minute
define('API_KEY_EXPIRY', 30 * 24 * 60 * 60); // 30 days

// Development settings
define('DEBUG_MODE', true); // Set to false in production
define('ERROR_REPORTING_LEVEL', E_ALL); // Adjust for production
define('LOG_ERRORS', true);

// Initialize error handling based on environment
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    error_reporting(ERROR_REPORTING_LEVEL);
} else {
    ini_set('display_errors', 0);
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
}

// Set default timezone
date_default_timezone_set('UTC');