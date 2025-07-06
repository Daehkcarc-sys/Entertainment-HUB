<?php
/**
 * Admin Handler
 * Processes admin panel actions with proper authentication checks
 */

// Start session and include necessary files
session_start();
require_once 'db_config.php';
require_once 'admin_utils.php';

// Check admin authentication for all requests
if (!verifyAdminAccess()) {
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Get the requested action
$action = $_GET['action'] ?? '';

// Process the action
try {
    header('Content-Type: application/json');
    
    switch ($action) {
        case 'get_stats':
            $stats = getDashboardStats();
            if (isset($stats['error'])) {
                throw new Exception($stats['error']);
            }
            echo json_encode(['success' => true, 'stats' => $stats]);
            break;
            
        case 'get_users':
            // Get users list with pagination
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $search = $_GET['search'] ?? '';
            
            $db = getDbConnection();
            $offset = ($page - 1) * $limit;
            
            // Build query based on search term
            $sql = "SELECT id, username, email, role, status, created_at FROM users WHERE 1=1";
            $params = [];
            
            if ($search) {
                $sql .= " AND (username LIKE ? OR email LIKE ?)";
                $searchTerm = "%$search%";
                $params = [$searchTerm, $searchTerm];
            }
            
            // Get total count for pagination
            $countStmt = $db->prepare(str_replace('SELECT id, username', 'SELECT COUNT(*)', $sql));
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get paginated results
            $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format user data for display
            $formattedUsers = formatTableData($users, [
                'id' => ['type' => 'string'],
                'username' => ['type' => 'string'],
                'email' => ['type' => 'string'],
                'role' => ['type' => 'badge'],
                'status' => ['type' => 'status'],
                'created_at' => ['type' => 'date', 'format' => 'M d, Y']
            ]);
            
            echo json_encode([
                'success' => true,
                'users' => $formattedUsers,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
            break;
            
        case 'update_user':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Method not allowed');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate input
            $validation = validateAdminInput($input, [
                'id' => ['type' => 'int', 'required' => true],
                'username' => ['type' => 'string', 'required' => true, 'min' => 3, 'max' => 50],
                'email' => ['type' => 'email', 'required' => true],
                'role' => ['type' => 'string', 'required' => true],
                'status' => ['type' => 'string', 'required' => true]
            ]);
            
            if (!empty($validation['errors'])) {
                throw new Exception('Validation failed: ' . json_encode($validation['errors']));
            }
            
            $data = $validation['sanitized'];
            
            // Update user
            $db = getDbConnection();
            $stmt = $db->prepare('UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ?');
            $stmt->execute([$data['username'], $data['email'], $data['role'], $data['status'], $data['id']]);
            
            // Log admin action
            logAdminAction('update_user', [
                'user_id' => $data['id'],
                'changes' => $data
            ]);
            
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
            break;
            
        case 'delete_user':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Method not allowed');
            }
            
            $userId = $_POST['user_id'] ?? null;
            if (!$userId) {
                throw new Exception('User ID is required');
            }
            
            // Prevent deleting self
            if ($userId == $_SESSION['user_id']) {
                throw new Exception('Cannot delete your own account');
            }
            
            $db = getDbConnection();
            
            // Get user info for logging
            $stmt = $db->prepare('SELECT username, email FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Delete user
            $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            
            // Log admin action
            logAdminAction('delete_user', [
                'user_id' => $userId,
                'user_info' => $user
            ]);
            
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}