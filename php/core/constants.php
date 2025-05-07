<?php
/**
 * Global Constants
 * 
 * Central configuration file for the Entertainment Hub application
 */

// Debug mode (set to false in production)
define('DEBUG_MODE', true);

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'entertainment_hub');
define('DB_USER', 'root'); // Default WAMP username
define('DB_PASS', '');    // Default WAMP empty password

// Site configuration
define('SITE_URL', 'http://localhost/Projet');
define('SITE_NAME', 'Entertainment Hub');
define('ADMIN_EMAIL', 'admin@example.com');

// Security settings
define('SALT', 'f8e7d6c5b4a3929190');
define('JWT_SECRET', 'entertainment_hub_secret_key_2025');
define('SESSION_LIFETIME', 86400); // 24 hours in seconds

// File paths
define('UPLOAD_DIR', __DIR__ . '/../../uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB

// Default pagination values
define('ITEMS_PER_PAGE', 10);

// Email settings first (to avoid circular reference)
define('MAIL_FROM', 'noreply@entertainmenthub.com');
define('EMAIL_FROM_NAME', 'Entertainment Hub');

// Authentication settings
define('ACCESS_TOKEN_LIFETIME', 3600);      // 1 hour in seconds
define('REFRESH_TOKEN_LIFETIME', 2592000);  // 30 days in seconds
define('COOKIE_PREFIX', 'eh_');
define('REMEMBER_ME_DURATION', 2592000);    // 30 days in seconds
define('MIN_PASSWORD_LENGTH', 8);
define('HASH_COST', 12);
define('MAX_LOGIN_ATTEMPTS', 5);
define('PASSWORD_RESET_LIFETIME', 3600);    // 1 hour in seconds

// Advanced authentication settings
define('LOGIN_TIMEOUT', 900);          // 15 minutes timeout after too many failed logins
define('EMAIL_FROM', MAIL_FROM);       // Now MAIL_FROM is defined before it's used here
define('REQUIRE_EMAIL_VERIFICATION', true);

// API settings
define('API_RATE_LIMIT', 60);  // 60 requests per minute
define('ROTATE_REFRESH_TOKENS', true);

// CSRF protection
define('CSRF_EXPIRY', 7200);   // 2 hours in seconds

// Session settings
define('SESSION_NAME', 'entertainment_hub_session');
define('SESSION_TIMEOUT', 86400); // 24 hours in seconds

// File upload settings
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif']);
define('UPLOADS_URL', SITE_URL . '/uploads');
define('ASSETS_URL', SITE_URL . '/assets');
define('IMAGES_PATH', __DIR__ . '/../../uploads/images');

// Logging settings
define('LOG_ERRORS', true);
define('LOGS_PATH', __DIR__ . '/../../logs');