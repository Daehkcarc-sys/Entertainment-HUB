<?php
/**
 * Leaderboard API Endpoint
 * Returns leaderboard data based on category and time period
 */

// Include the database configuration
require_once('db_config.php');

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get parameters from request
$category = isset($_GET['category']) ? $_GET['category'] : 'all';
$period = isset($_GET['period']) ? $_GET['period'] : 'all-time';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

// Calculate offset for pagination
$offset = ($page - 1) * $limit;

try {
    // Connect to database
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Base query for all categories
    if ($category === 'all') {
        $sql = "SELECT 
                id, 
                title, 
                category, 
                cover_image, 
                rating, 
                view_count, 
                review_count, 
                release_year
                FROM content 
                WHERE 1=1";
    } else {
        // Category specific query
        $sql = "SELECT 
                id, 
                title, 
                category, 
                cover_image, 
                rating, 
                view_count, 
                review_count, 
                release_year
                FROM content 
                WHERE category = :category";
    }
    
    // Add time period condition
    switch ($period) {
        case 'this-week':
            $sql .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
            break;
        case 'this-month':
            $sql .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
            break;
        case 'this-year':
            $sql .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
            break;
        default:
            // All time, no additional condition needed
            break;
    }
    
    // Complete the query with ordering, limit and offset
    $sql .= " ORDER BY rating DESC, view_count DESC 
              LIMIT :limit OFFSET :offset";
    
    // Prepare and execute the statement
    $stmt = $conn->prepare($sql);
    
    // Bind parameters
    if ($category !== 'all') {
        $stmt->bindParam(':category', $category, PDO::PARAM_STR);
    }
    
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    
    // Fetch all results
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Count total records for pagination
    $countSql = str_replace('SELECT id, title, category, cover_image, rating, view_count, review_count, release_year', 'SELECT COUNT(*)', 
                          explode('LIMIT', $sql)[0]);
                          
    $countStmt = $conn->prepare($countSql);
    if ($category !== 'all') {
        $countStmt->bindParam(':category', $category, PDO::PARAM_STR);
    }
    $countStmt->execute();
    $totalCount = $countStmt->fetchColumn();
    
    // Prepare response
    $response = [
        'status' => 'success',
        'data' => $results,
        'meta' => [
            'total' => (int)$totalCount,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($totalCount / $limit)
        ]
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    // Error handling
    $response = [
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ];
    
    http_response_code(500);
    echo json_encode($response);
}
?>