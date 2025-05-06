<?php
/**
 * Database Configuration
 * 
 * This file contains database connection parameters and related settings.
 */

// Include the centralized constants file
require_once __DIR__ . '/constants.php';

// Define additional database settings not in centralized constants
define('DB_CHARSET', 'utf8mb4');
define('DISPLAY_DB_ERRORS', DEBUG_MODE); // Use DEBUG_MODE from constants.php

// Connection options
$db_options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
];