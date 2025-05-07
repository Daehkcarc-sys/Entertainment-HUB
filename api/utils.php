<?php
/**
 * Utility functions for Entertainment Hub
 * This file contains various utility functions for array manipulation,
 * file operations, and other helper functions.
 */

// Array Manipulation Functions
/**
 * Enhanced array push function that logs the addition
 * 
 * @param array &$arr The array to push into
 * @param mixed $elements One or more elements to push
 * @return int The new count of the array
 */
function enhanced_array_push(&$arr, ...$elements) {
    $original_count = count($arr);
    $result = array_push($arr, ...$elements);
    
    // Log for debugging purposes
    error_log("Added " . ($result - $original_count) . " elements to array. New size: $result");
    
    return $result;
}

/**
 * Enhanced array merge function with metrics
 * 
 * @param array ...$arrays Arrays to merge
 * @return array The merged array
 */
function enhanced_array_merge(...$arrays) {
    $total_keys = 0;
    $result = array();
    
    foreach ($arrays as $array) {
        $total_keys += count($array);
        $result = array_merge($result, $array);
    }
    
    $final_count = count($result);
    $duplicate_keys = $total_keys - $final_count;
    
    // Log for debugging purposes
    if ($duplicate_keys > 0) {
        error_log("Array merge completed. $duplicate_keys duplicate keys were overwritten.");
    }
    
    return $result;
}

/**
 * Sort an array based on a specific key and maintain index association
 * 
 * @param array &$array The array to sort
 * @param string $key The key to sort by
 * @param string $direction 'ASC' or 'DESC'
 * @return bool Success or failure
 */
function sort_array_by_key(&$array, $key, $direction = 'ASC') {
    if (empty($array)) {
        return false;
    }
    
    $result = ($direction === 'ASC') ? 
        uasort($array, function($a, $b) use ($key) {
            return $a[$key] <=> $b[$key];
        }) :
        uasort($array, function($a, $b) use ($key) {
            return $b[$key] <=> $a[$key];
        });
    
    return $result;
}

/**
 * Validate array against a schema
 * 
 * @param array $array The array to validate
 * @param array $schema The expected schema (keys and types)
 * @return array Array of errors, empty if valid
 */
function validate_array_schema($array, $schema) {
    $errors = [];
    
    foreach ($schema as $key => $type) {
        if (!isset($array[$key])) {
            $errors[] = "Missing required key: $key";
        } else if (gettype($array[$key]) !== $type && $type !== 'mixed') {
            $errors[] = "Key '$key' should be of type '$type', " . gettype($array[$key]) . " given";
        }
    }
    
    return $errors;
}

// File Operations
/**
 * Safely read a file with proper error handling
 * 
 * @param string $filepath Path to the file
 * @return string|false File contents or false on failure
 */
function safe_file_read($filepath) {
    try {
        if (!file_exists($filepath)) {
            throw new Exception("File not found: $filepath");
        }
        
        if (!is_readable($filepath)) {
            throw new Exception("File not readable: $filepath");
        }
        
        $handle = fopen($filepath, 'r');
        if ($handle === false) {
            throw new Exception("Failed to open file: $filepath");
        }
        
        $contents = '';
        while (!feof($handle)) {
            $contents .= fgets($handle);
        }
        
        fclose($handle);
        return $contents;
        
    } catch (Exception $e) {
        error_log("File read error: " . $e->getMessage());
        return false;
    }
}

/**
 * Safely write to a file with proper error handling
 * 
 * @param string $filepath Path to the file
 * @param string $content Content to write
 * @param string $mode Write mode ('w' for overwrite, 'a' for append)
 * @return bool Success or failure
 */
function safe_file_write($filepath, $content, $mode = 'w') {
    try {
        // Create directory if it doesn't exist
        $dir = dirname($filepath);
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true)) {
                throw new Exception("Failed to create directory: $dir");
            }
        }
        
        $handle = fopen($filepath, $mode);
        if ($handle === false) {
            throw new Exception("Failed to open file for writing: $filepath");
        }
        
        $result = fwrite($handle, $content);
        if ($result === false) {
            throw new Exception("Failed to write to file: $filepath");
        }
        
        fclose($handle);
        return true;
        
    } catch (Exception $e) {
        error_log("File write error: " . $e->getMessage());
        return false;
    }
}

/**
 * Log data to a specific log file
 * 
 * @param string $message Message to log
 * @param string $level Log level (INFO, ERROR, WARNING, DEBUG)
 * @param string $logfile Log file path (relative to logs directory)
 * @return bool Success or failure
 */
function log_to_file($message, $level = 'INFO', $logfile = 'application.log') {
    try {
        $log_dir = dirname(__DIR__) . '/logs';
        
        // Create logs directory if it doesn't exist
        if (!is_dir($log_dir)) {
            if (!mkdir($log_dir, 0755, true)) {
                throw new Exception("Failed to create logs directory");
            }
        }
        
        $log_path = $log_dir . '/' . $logfile;
        $timestamp = date('Y-m-d H:i:s');
        $formatted_message = "[$timestamp] [$level] $message" . PHP_EOL;
        
        return file_put_contents($log_path, $formatted_message, FILE_APPEND);
        
    } catch (Exception $e) {
        error_log("Logging error: " . $e->getMessage());
        return false;
    }
}

// Error Handling Functions
/**
 * Custom error handler function
 * 
 * @param int $errno Error number
 * @param string $errstr Error message
 * @param string $errfile File where error occurred
 * @param int $errline Line number where error occurred
 * @return bool Whether the error was handled
 */
function custom_error_handler($errno, $errstr, $errfile, $errline) {
    $error_type = match($errno) {
        E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR => 'FATAL ERROR',
        E_WARNING, E_CORE_WARNING, E_COMPILE_WARNING, E_USER_WARNING => 'WARNING',
        E_NOTICE, E_USER_NOTICE => 'NOTICE',
        E_DEPRECATED, E_USER_DEPRECATED => 'DEPRECATED',
        default => 'UNKNOWN ERROR'
    };
    
    $message = "$error_type: $errstr in $errfile on line $errline";
    log_to_file($message, 'ERROR', 'errors.log');
    
    // For fatal errors, show an error page
    if ($errno == E_ERROR || $errno == E_USER_ERROR) {
        ob_start();
        include_once dirname(__DIR__) . '/html/error.html';
        $error_page = ob_get_clean();
        echo $error_page;
        exit;
    }
    
    // Return true to prevent PHP's default error handler
    return true;
}

// Email Functionality
/**
 * Send an HTML email with proper headers and error handling
 * 
 * @param string $to Recipient email
 * @param string $subject Email subject
 * @param string $html_message HTML content of the email
 * @param string $text_message Plain text alternative
 * @param array $headers Additional headers
 * @return bool Success or failure
 */
function send_html_email($to, $subject, $html_message, $text_message = '', $headers = []) {
    // Generate a unique boundary
    $boundary = md5(time());
    
    // Default headers
    $default_headers = [
        'MIME-Version' => '1.0',
        'Content-Type' => "multipart/alternative; boundary=\"$boundary\"",
        'From' => 'Entertainment Hub <no-reply@entertainmenthub.com>',
        'X-Mailer' => 'PHP/' . phpversion()
    ];
    
    // Merge with custom headers
    $headers = enhanced_array_merge($default_headers, $headers);
    
    // Format headers for mail function
    $formatted_headers = '';
    foreach ($headers as $key => $value) {
        $formatted_headers .= "$key: $value\r\n";
    }
    
    // Create email body
    $body = "--$boundary\r\n";
    
    // Add plain text version
    if (empty($text_message)) {
        // Auto-generate plain text from HTML if not provided
        $text_message = strip_tags($html_message);
    }
    
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($text_message)) . "\r\n";
    
    // Add HTML version
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($html_message)) . "\r\n";
    
    // Close boundary
    $body .= "--$boundary--";
    
    // Try to send email
    try {
        if (!mail($to, $subject, $body, $formatted_headers)) {
            throw new Exception("Failed to send email to $to");
        }
        log_to_file("Email sent successfully to $to", 'INFO', 'email.log');
        return true;
    } catch (Exception $e) {
        log_to_file("Email error: " . $e->getMessage(), 'ERROR', 'email.log');
        return false;
    }
}
?>