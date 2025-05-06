<?php
/**
 * Global Constants
 * 
 * Central configuration file for the Entertainment Hub application
 */

// Database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'entertainment_hub');
define('DB_USER', 'root');
define('DB_PASS', '');

// Site settings
define('SITE_NAME', 'Entertainment Hub');
define('SITE_URL', 'http://localhost/Projet');
define('DEBUG_MODE', true);

// Authentication settings
define('ACCESS_TOKEN_LIFETIME', 3600);      // 1 hour in seconds
define('REFRESH_TOKEN_LIFETIME', 2592000);  // 30 days in seconds
define('JWT_SECRET', 'your-secret-key-change-in-production');
define('COOKIE_PREFIX', 'eh_');
define('REMEMBER_ME_DURATION', 2592000);    // 30 days in seconds
define('MIN_PASSWORD_LENGTH', 8);
define('HASH_COST', 12);
define('MAX_LOGIN_ATTEMPTS', 5);
define('PASSWORD_RESET_LIFETIME', 3600);    // 1 hour in seconds

// Advanced authentication settings
define('LOGIN_TIMEOUT', 900);          // 15 minutes timeout after too many failed logins
define('EMAIL_FROM_NAME', 'Entertainment Hub');
define('EMAIL_FROM', MAIL_FROM);       // Using already defined mail from address

// Email settings
define('MAIL_FROM', 'noreply@entertainmenthub.com');
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
define('MAX_UPLOAD_SIZE', 5242880);    // 5MB in bytes
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif']);
define('UPLOADS_URL', SITE_URL . '/uploads');
define('ASSETS_URL', SITE_URL . '/assets');
define('IMAGES_PATH', __DIR__ . '/../../uploads/images');

// Logging settings
define('LOG_ERRORS', true);
define('LOGS_PATH', __DIR__ . '/../../logs');