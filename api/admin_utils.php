<?php
/**
 * Admin Utility Functions
 * Helper functions for admin operations
 */

/**
 * Verify if user has admin privileges
 * 
 * @return bool True if user is admin, false otherwise
 */
function verifyAdminAccess() {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
        return false;
    }
    
    return $_SESSION['role'] === 'admin';
}

/**
 * Get dashboard statistics
 * 
 * @return array Array containing dashboard statistics
 */
function getDashboardStats() {
    try {
        $db = getDbConnection();
        
        // Get total users
        $userStmt = $db->query('SELECT COUNT(*) as total FROM users');
        $totalUsers = $userStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get new users this month
        $newUsersStmt = $db->query('SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)');
        $newUsers = $newUsersStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Calculate user growth
        $lastMonthStmt = $db->query('SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)');
        $lastMonth = $lastMonthStmt->fetch(PDO::FETCH_ASSOC)['total'];
        $userGrowth = $lastMonth > 0 ? (($newUsers - $lastMonth) / $lastMonth) * 100 : 0;
        
        // Get total content items
        $contentStmt = $db->query('SELECT COUNT(*) as total FROM content');
        $totalContent = $contentStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get new content this week
        $newContentStmt = $db->query('SELECT COUNT(*) as total FROM content WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)');
        $newContent = $newContentStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get review statistics
        $reviewStmt = $db->query('SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews');
        $reviewData = $reviewStmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'totalUsers' => $totalUsers,
            'userGrowth' => round($userGrowth, 1),
            'totalContent' => $totalContent,
            'newContent' => $newContent,
            'totalReviews' => $reviewData['total'],
            'avgRating' => round($reviewData['avg_rating'], 1)
        ];
        
    } catch (PDOException $e) {
        error_log('Error getting dashboard stats: ' . $e->getMessage());
        return [
            'error' => 'Failed to load dashboard statistics'
        ];
    }
}

/**
 * Log admin action
 * 
 * @param string $action Action performed
 * @param array $data Additional data about the action
 * @return bool True if logged successfully, false otherwise
 */
function logAdminAction($action, $data = []) {
    try {
        $db = getDbConnection();
        
        $stmt = $db->prepare('INSERT INTO admin_logs (admin_id, action, data, ip_address, created_at) VALUES (?, ?, ?, ?, NOW())');
        return $stmt->execute([
            $_SESSION['user_id'],
            $action,
            json_encode($data),
            $_SERVER['REMOTE_ADDR']
        ]);
        
    } catch (PDOException $e) {
        error_log('Error logging admin action: ' . $e->getMessage());
        return false;
    }
}

/**
 * Format data for admin table display
 * 
 * @param array $data Raw data from database
 * @param array $fields Fields to include in output
 * @return array Formatted data for display
 */
function formatTableData($data, $fields) {
    $formatted = [];
    foreach ($data as $row) {
        $formattedRow = [];
        foreach ($fields as $field => $config) {
            $value = $row[$field] ?? '';
            
            switch ($config['type']) {
                case 'date':
                    $formattedRow[$field] = date($config['format'] ?? 'Y-m-d', strtotime($value));
                    break;
                case 'status':
                    $formattedRow[$field] = [
                        'value' => $value,
                        'class' => 'status-badge ' . strtolower($value)
                    ];
                    break;
                case 'badge':
                    $formattedRow[$field] = [
                        'value' => $value,
                        'class' => 'badge ' . strtolower($value)
                    ];
                    break;
                default:
                    $formattedRow[$field] = $value;
            }
        }
        $formatted[] = $formattedRow;
    }
    return $formatted;
}

/**
 * Validate and sanitize admin input
 * 
 * @param array $input Input data
 * @param array $rules Validation rules
 * @return array Sanitized data or error messages
 */
function validateAdminInput($input, $rules) {
    $errors = [];
    $sanitized = [];
    
    foreach ($rules as $field => $rule) {
        $value = $input[$field] ?? null;
        
        if ($rule['required'] && empty($value)) {
            $errors[$field] = $rule['message'] ?? "Field $field is required";
            continue;
        }
        
        if (!empty($value)) {
            switch ($rule['type']) {
                case 'email':
                    $value = filter_var($value, FILTER_VALIDATE_EMAIL);
                    if (!$value) {
                        $errors[$field] = 'Invalid email format';
                    }
                    break;
                case 'int':
                    $value = filter_var($value, FILTER_VALIDATE_INT);
                    if ($value === false) {
                        $errors[$field] = 'Must be a valid number';
                    }
                    break;
                case 'string':
                    $value = filter_var($value, FILTER_SANITIZE_STRING);
                    if (isset($rule['min']) && strlen($value) < $rule['min']) {
                        $errors[$field] = "Must be at least {$rule['min']} characters";
                    }
                    if (isset($rule['max']) && strlen($value) > $rule['max']) {
                        $errors[$field] = "Must not exceed {$rule['max']} characters";
                    }
                    break;
            }
            
            if (!isset($errors[$field])) {
                $sanitized[$field] = $value;
            }
        }
    }
    
    return [
        'errors' => $errors,
        'sanitized' => $sanitized
    ];
}