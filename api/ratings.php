<?php
/**
 * Ratings API for Entertainment Hub
 * Handles user ratings and reviews for content
 */

// Start session and include required files
session_start();
require_once __DIR__ . '/db_config.php';  // Use absolute path with __DIR__
require_once __DIR__ . '/functions.php';   // Use absolute path with __DIR__

// Get database connection
$pdo = getDbConnection();

// Set content type to JSON
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Check for CSRF token on POST, PUT, DELETE requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $headers = getallheaders();
    $csrfToken = isset($headers['X-CSRF-Token']) ? $headers['X-CSRF-Token'] : '';
    
    if (!isset($_SESSION['csrf_token']) || $csrfToken !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid CSRF token']);
        exit;
    }
}

// Process based on request method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['content_id'])) {
            getContentRatings($_GET['content_id']);
        } elseif (isset($_GET['user_id'])) {
            getUserRatings($_GET['user_id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing content_id or user_id parameter']);
        }
        break;
    case 'POST':
        submitRating();
        break;
    case 'PUT':
        if (isset($_GET['id'])) {
            updateRating($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing rating id parameter']);
        }
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteRating($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing rating id parameter']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

/**
 * Get ratings for a specific content
 * 
 * @param int $contentId Content ID
 */
function getContentRatings($contentId) {
    global $pdo;
    
    try {
        // Get content info
        $stmt = $pdo->prepare("
            SELECT id, title, type, poster 
            FROM content 
            WHERE id = ?
        ");
        $stmt->execute([$contentId]);
        $content = $stmt->fetch();
        
        if (!$content) {
            http_response_code(404);
            echo json_encode(['error' => 'Content not found']);
            return;
        }
        
        // Get rating statistics
        $stmt = $pdo->prepare("
            SELECT 
                AVG(rating) as average_rating,
                COUNT(*) as total_ratings,
                COUNT(CASE WHEN review IS NOT NULL AND review != '' THEN 1 END) as total_reviews,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
                SUM(CASE WHEN rating = 6 THEN 1 ELSE 0 END) as rating_6,
                SUM(CASE WHEN rating = 7 THEN 1 ELSE 0 END) as rating_7,
                SUM(CASE WHEN rating = 8 THEN 1 ELSE 0 END) as rating_8,
                SUM(CASE WHEN rating = 9 THEN 1 ELSE 0 END) as rating_9,
                SUM(CASE WHEN rating = 10 THEN 1 ELSE 0 END) as rating_10
            FROM ratings
            WHERE content_id = ?
        ");
        $stmt->execute([$contentId]);
        $stats = $stmt->fetch();
        
        // Get user's rating if logged in
        $userRating = null;
        if (isset($_SESSION['user_id'])) {
            $stmt = $pdo->prepare("
                SELECT id, rating, review, created_at, updated_at
                FROM ratings
                WHERE content_id = ? AND user_id = ?
            ");
            $stmt->execute([$contentId, $_SESSION['user_id']]);
            $userRating = $stmt->fetch();
        }
        
        // Get recent reviews with pagination
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        if ($page < 1) $page = 1;
        if ($limit < 1 || $limit > 50) $limit = 10;
        $offset = ($page - 1) * $limit;
        
        $stmt = $pdo->prepare("
            SELECT 
                r.id, r.rating, r.review, r.created_at, r.updated_at,
                u.id as user_id, u.username, u.avatar
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.content_id = ? AND r.review IS NOT NULL AND r.review != ''
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$contentId, $limit, $offset]);
        $reviews = $stmt->fetchAll();
        
        // Get total reviews count for pagination
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM ratings 
            WHERE content_id = ? AND review IS NOT NULL AND review != ''
        ");
        $stmt->execute([$contentId]);
        $totalReviews = $stmt->fetchColumn();
        
        // Format response
        echo json_encode([
            'success' => true,
            'content' => $content,
            'stats' => [
                'average_rating' => round($stats['average_rating'], 1),
                'total_ratings' => (int)$stats['total_ratings'],
                'total_reviews' => (int)$stats['total_reviews'],
                'distribution' => [
                    1 => (int)$stats['rating_1'],
                    2 => (int)$stats['rating_2'],
                    3 => (int)$stats['rating_3'],
                    4 => (int)$stats['rating_4'],
                    5 => (int)$stats['rating_5'],
                    6 => (int)$stats['rating_6'],
                    7 => (int)$stats['rating_7'],
                    8 => (int)$stats['rating_8'],
                    9 => (int)$stats['rating_9'],
                    10 => (int)$stats['rating_10']
                ]
            ],
            'user_rating' => $userRating,
            'reviews' => $reviews,
            'pagination' => [
                'total' => $totalReviews,
                'per_page' => $limit,
                'current_page' => $page,
                'last_page' => ceil($totalReviews / $limit)
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log('Get content ratings error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while fetching ratings']);
    }
}

/**
 * Get ratings by a specific user
 * 
 * @param int $userId User ID
 */
function getUserRatings($userId) {
    global $pdo;
    
    try {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT id, username, avatar FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }
        
        // Get pagination parameters
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        if ($page < 1) $page = 1;
        if ($limit < 1 || $limit > 100) $limit = 20;
        $offset = ($page - 1) * $limit;
        
        // Get filter parameters
        $contentType = isset($_GET['type']) ? $_GET['type'] : null;
        $hasReview = isset($_GET['has_review']) ? (bool)$_GET['has_review'] : null;
        $minRating = isset($_GET['min_rating']) ? (int)$_GET['min_rating'] : null;
        $maxRating = isset($_GET['max_rating']) ? (int)$_GET['max_rating'] : null;
        
        // Build query
        $sql = "
            SELECT 
                r.id, r.rating, r.review, r.created_at, r.updated_at,
                c.id as content_id, c.title, c.type, c.poster, c.release_year
            FROM ratings r
            JOIN content c ON r.content_id = c.id
            WHERE r.user_id = ?
        ";
        
        $params = [$userId];
        
        // Add filters
        if ($contentType) {
            $sql .= " AND c.type = ?";
            $params[] = $contentType;
        }
        
        if ($hasReview !== null) {
            if ($hasReview) {
                $sql .= " AND r.review IS NOT NULL AND r.review != ''";
            } else {
                $sql .= " AND (r.review IS NULL OR r.review = '')";
            }
        }
        
        if ($minRating !== null) {
            $sql .= " AND r.rating >= ?";
            $params[] = $minRating;
        }
        
        if ($maxRating !== null) {
            $sql .= " AND r.rating <= ?";
            $params[] = $maxRating;
        }
        
        // Add sorting
        $sortBy = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'date';
        $sortOrder = isset($_GET['sort_order']) ? strtoupper($_GET['sort_order']) : 'DESC';
        
        if ($sortOrder !== 'ASC' && $sortOrder !== 'DESC') {
            $sortOrder = 'DESC';
        }
        
        switch ($sortBy) {
            case 'rating':
                $sql .= " ORDER BY r.rating $sortOrder, r.created_at DESC";
                break;
            case 'title':
                $sql .= " ORDER BY c.title $sortOrder";
                break;
            case 'type':
                $sql .= " ORDER BY c.type $sortOrder, c.title ASC";
                break;
            case 'date':
            default:
                $sql .= " ORDER BY r.created_at $sortOrder";
                break;
        }
        
        // Add pagination
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        // Execute query
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $ratings = $stmt->fetchAll();
        
        // Get total count for pagination
        $countSql = "
            SELECT COUNT(*) 
            FROM ratings r
            JOIN content c ON r.content_id = c.id
            WHERE r.user_id = ?
        ";
        
        $countParams = [$userId];
        
        // Add filters to count query
        if ($contentType) {
            $countSql .= " AND c.type = ?";
            $countParams[] = $contentType;
        }
        
        if ($hasReview !== null) {
            if ($hasReview) {
                $countSql .= " AND r.review IS NOT NULL AND r.review != ''";
            } else {
                $countSql .= " AND (r.review IS NULL OR r.review = '')";
            }
        }
        
        if ($minRating !== null) {
            $countSql .= " AND r.rating >= ?";
            $countParams[] = $minRating;
        }
        
        if ($maxRating !== null) {
            $countSql .= " AND r.rating <= ?";
            $countParams[] = $maxRating;
        }
        
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($countParams);
        $totalCount = $countStmt->fetchColumn();
        
        // Get rating statistics
        $statsStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_ratings,
                COUNT(CASE WHEN review IS NOT NULL AND review != '' THEN 1 END) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating >= 8 THEN 1 ELSE 0 END) as positive_ratings,
                SUM(CASE WHEN rating <= 4 THEN 1 ELSE 0 END) as negative_ratings
            FROM ratings
            WHERE user_id = ?
        ");
        $statsStmt->execute([$userId]);
        $stats = $statsStmt->fetch();
        
        // Format response
        echo json_encode([
            'success' => true,
            'user' => $user,
            'stats' => [
                'total_ratings' => (int)$stats['total_ratings'],
                'total_reviews' => (int)$stats['total_reviews'],
                'average_rating' => round($stats['average_rating'], 1),
                'positive_ratings' => (int)$stats['positive_ratings'],
                'negative_ratings' => (int)$stats['negative_ratings']
            ],
            'ratings' => $ratings,
            'pagination' => [
                'total' => $totalCount,
                'per_page' => $limit,
                'current_page' => $page,
                'last_page' => ceil($totalCount / $limit)
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log('Get user ratings error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while fetching ratings']);
    }
}

/**
 * Submit a new rating or update existing one
 */
function submitRating() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['contentId']) || !isset($input['rating'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Content ID and rating are required']);
        return;
    }
    
    $contentId = $input['contentId'];
    $rating = (int)$input['rating'];
    $review = isset($input['review']) ? trim($input['review']) : null;
    $userId = $_SESSION['user_id'];
    
    // Validate rating
    if ($rating < 1 || $rating > 10) {
        http_response_code(400);
        echo json_encode(['error' => 'Rating must be between 1 and 10']);
        return;
    }
    
    // Validate review length if provided
    if ($review !== null && strlen($review) > 2000) {
        http_response_code(400);
        echo json_encode(['error' => 'Review must be less than 2000 characters']);
        return;
    }
    
    global $pdo;
    
    try {
        // Check if content exists
        $stmt = $pdo->prepare("SELECT id FROM content WHERE id = ?");
        $stmt->execute([$contentId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Content not found']);
            return;
        }
        
        // Begin transaction
        $pdo->beginTransaction();
        
        // Check if user already rated this content
        $stmt = $pdo->prepare("SELECT id FROM ratings WHERE user_id = ? AND content_id = ?");
        $stmt->execute([$userId, $contentId]);
        $existingRating = $stmt->fetch();
        
        if ($existingRating) {
            // Update existing rating
            $stmt = $pdo->prepare("
                UPDATE ratings 
                SET rating = ?, review = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$rating, $review, $existingRating['id']]);
            $ratingId = $existingRating['id'];
            $isNew = false;
        } else {
            // Insert new rating
            $stmt = $pdo->prepare("
                INSERT INTO ratings (user_id, content_id, rating, review, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$userId, $contentId, $rating, $review]);
            $ratingId = $pdo->lastInsertId();
            $isNew = true;
        }
        
        // Update content rating statistics
        $stmt = $pdo->prepare("
            UPDATE content 
            SET 
                rating_sum = (SELECT SUM(rating) FROM ratings WHERE content_id = ?),
                rating_count = (SELECT COUNT(*) FROM ratings WHERE content_id = ?),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$contentId, $contentId, $contentId]);
        
        // Commit transaction
        $pdo->commit();
        
        // Get updated rating data
        $stmt = $pdo->prepare("
            SELECT r.id, r.rating, r.review, r.created_at, r.updated_at,
                   u.username, u.avatar
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        ");
        $stmt->execute([$ratingId]);
        $ratingData = $stmt->fetch();
        
        // Get updated content rating statistics
        $stmt = $pdo->prepare("
            SELECT 
                AVG(rating) as average_rating,
                COUNT(*) as total_ratings
            FROM ratings
            WHERE content_id = ?
        ");
        $stmt->execute([$contentId]);
        $stats = $stmt->fetch();
        
        // Create notification for content creator if this is a review
        if ($review && !empty($review)) {
            $stmt = $pdo->prepare("
                SELECT c.created_by
                FROM content c
                WHERE c.id = ? AND c.created_by IS NOT NULL AND c.created_by != ?
            ");
            $stmt->execute([$contentId, $userId]);
            $creator = $stmt->fetch();
            
            if ($creator) {
                createNotification(
                    $creator['created_by'],
                    'review',
                    $isNew ? 'New review on your content' : 'Updated review on your content',
                    $contentId,
                    'content'
                );
            }
        }
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => $isNew ? 'Rating submitted successfully' : 'Rating updated successfully',
            'rating' => $ratingData,
            'stats' => [
                'average_rating' => round($stats['average_rating'], 1),
                'total_ratings' => (int)$stats['total_ratings']
            ]
        ]);
        
    } catch (PDOException $e) {
        // Rollback transaction on error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        error_log('Submit rating error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while submitting rating']);
    }
}

/**
 * Update an existing rating
 * 
 * @param int $ratingId Rating ID
 */
function updateRating($ratingId) {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['rating'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Rating is required']);
        return;
    }
    
    $rating = (int)$input['rating'];
    $review = isset($input['review']) ? trim($input['review']) : null;
    $userId = $_SESSION['user_id'];
    
    // Validate rating
    if ($rating < 1 || $rating > 10) {
        http_response_code(400);
        echo json_encode(['error' => 'Rating must be between 1 and 10']);
        return;
    }
    
    // Validate review length if provided
    if ($review !== null && strlen($review) > 2000) {
        http_response_code(400);
        echo json_encode(['error' => 'Review must be less than 2000 characters']);
        return;
    }
    
    global $pdo;
    
    try {
        // Check if rating exists
        $stmt = $pdo->prepare("SELECT id, content_id FROM ratings WHERE id = ? AND user_id = ?");
        $stmt->execute([$ratingId, $userId]);
        $existingRating = $stmt->fetch();
        
        if (!$existingRating) {
            http_response_code(404);
            echo json_encode(['error' => 'Rating not found']);
            return;
        }
        
        // Update rating
        $stmt = $pdo->prepare("
            UPDATE ratings 
            SET rating = ?, review = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$rating, $review, $ratingId]);
        
        // Update content rating statistics
        $stmt = $pdo->prepare("
            UPDATE content 
            SET 
                rating_sum = (SELECT SUM(rating) FROM ratings WHERE content_id = ?),
                rating_count = (SELECT COUNT(*) FROM ratings WHERE content_id = ?),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$existingRating['content_id'], $existingRating['content_id'], $existingRating['content_id']]);
        
        // Return success response
        echo json_encode(['success' => true, 'message' => 'Rating updated successfully']);
        
    } catch (PDOException $e) {
        error_log('Update rating error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while updating rating']);
    }
}

/**
 * Delete a rating
 * 
 * @param int $ratingId Rating ID
 */
function deleteRating($ratingId) {
    $userId = $_SESSION['user_id'];
    
    global $pdo;
    
    try {
        // Check if rating exists
        $stmt = $pdo->prepare("SELECT id, content_id FROM ratings WHERE id = ? AND user_id = ?");
        $stmt->execute([$ratingId, $userId]);
        $rating = $stmt->fetch();
        
        if (!$rating) {
            http_response_code(404);
            echo json_encode(['error' => 'Rating not found']);
            return;
        }
        
        // Delete rating
        $stmt = $pdo->prepare("DELETE FROM ratings WHERE id = ?");
        $stmt->execute([$ratingId]);
        
        // Update content rating statistics
        $stmt = $pdo->prepare("
            UPDATE content 
            SET 
                rating_sum = (SELECT SUM(rating) FROM ratings WHERE content_id = ?),
                rating_count = (SELECT COUNT(*) FROM ratings WHERE content_id = ?),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$rating['content_id'], $rating['content_id'], $rating['content_id']]);
        
        // Return success response
        echo json_encode(['success' => true, 'message' => 'Rating deleted successfully']);
        
    } catch (PDOException $e) {
        error_log('Delete rating error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while deleting rating']);
    }
}

