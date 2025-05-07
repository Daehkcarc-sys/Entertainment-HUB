<?php
/**
 * Content Relationships API Endpoints
 * 
 * Handles operations related to content relationships:
 * - Finding related content across different media types
 * - Suggesting related movies, series, anime, games, etc.
 * - Managing content item relationships
 */

header('Content-Type: application/json');
require_once 'db_connect1.php';
require_once 'functions.php';
require_once 'auth.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Process API requests based on method
switch ($method) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

/**
 * Handle GET requests for content relationships
 */
function handleGetRequest() {
    global $conn;
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'get_related':
            $contentId = $_GET['content_id'] ?? 0;
            $contentType = $_GET['content_type'] ?? '';
            getRelatedContent($conn, $contentId, $contentType);
            break;
            
        case 'get_cross_type_related':
            $contentId = $_GET['content_id'] ?? 0;
            $contentType = $_GET['content_type'] ?? '';
            $targetType = $_GET['target_type'] ?? '';
            getCrossTypeRelatedContent($conn, $contentId, $contentType, $targetType);
            break;
            
        case 'get_popular_by_type':
            $contentType = $_GET['content_type'] ?? 'movie';
            $limit = $_GET['limit'] ?? 10;
            getPopularByType($conn, $contentType, $limit);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

/**
 * Handle POST requests for content relationships
 */
function handlePostRequest() {
    global $conn;
    
    $userId = authenticate();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    // Check if user is admin or moderator
    $userRole = getUserRole($conn, $userId);
    if ($userRole != 'admin' && $userRole != 'moderator') {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        return;
    }
    
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'create_relationship':
            createContentRelationship($conn);
            break;
            
        case 'update_relationship':
            updateContentRelationship($conn);
            break;
            
        case 'delete_relationship':
            deleteContentRelationship($conn);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

/**
 * Get related content items of the same type
 */
function getRelatedContent($conn, $contentId, $contentType) {
    try {
        if (!$contentId || !$contentType) {
            http_response_code(400);
            echo json_encode(['error' => 'Content ID and type are required']);
            return;
        }
        
        // Get content item to ensure it exists
        $stmt = $conn->prepare("
            SELECT id, title 
            FROM content_items 
            WHERE id = ? AND content_type = ?
        ");
        $stmt->execute([$contentId, $contentType]);
        $content = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$content) {
            http_response_code(404);
            echo json_encode(['error' => 'Content item not found']);
            return;
        }
        
        // Get directly related items of the same type
        $stmt = $conn->prepare("
            SELECT ci.*
            FROM content_items ci
            JOIN content_relationships cr ON (
                (cr.source_item_id = ? AND cr.related_item_id = ci.id) OR 
                (cr.related_item_id = ? AND cr.source_item_id = ci.id)
            )
            WHERE ci.content_type = ?
            ORDER BY cr.strength DESC, ci.rating DESC
            LIMIT 10
        ");
        $stmt->execute([$contentId, $contentId, $contentType]);
        $directlyRelated = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If we have fewer than 5 direct relationships, supplement with genre-based recommendations
        if (count($directlyRelated) < 5) {
            // Get genres of the content item
            $stmt = $conn->prepare("
                SELECT cg.id
                FROM content_genres cg
                JOIN content_item_genres cig ON cg.id = cig.genre_id
                WHERE cig.content_item_id = ?
            ");
            $stmt->execute([$contentId]);
            $genreIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (!empty($genreIds)) {
                $placeholders = implode(',', array_fill(0, count($genreIds), '?'));
                
                // Get items with matching genres
                $stmt = $conn->prepare("
                    SELECT ci.*, COUNT(cig.genre_id) AS genre_matches
                    FROM content_items ci
                    JOIN content_item_genres cig ON ci.id = cig.content_item_id
                    WHERE ci.content_type = ? 
                    AND ci.id != ? 
                    AND cig.genre_id IN ({$placeholders})
                    GROUP BY ci.id
                    ORDER BY genre_matches DESC, ci.rating DESC
                    LIMIT 10
                ");
                
                $params = [$contentType, $contentId];
                foreach ($genreIds as $genreId) {
                    $params[] = $genreId;
                }
                
                $stmt->execute($params);
                $genreRelated = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Merge and remove duplicates
                $relatedIds = array_map(function($item) { return $item['id']; }, $directlyRelated);
                foreach ($genreRelated as $item) {
                    if (!in_array($item['id'], $relatedIds)) {
                        $directlyRelated[] = $item;
                        if (count($directlyRelated) >= 10) {
                            break;
                        }
                    }
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'content' => $content,
            'related_items' => $directlyRelated
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get related content of a different type (cross-type relationships)
 */
function getCrossTypeRelatedContent($conn, $contentId, $contentType, $targetType) {
    try {
        if (!$contentId || !$contentType || !$targetType) {
            http_response_code(400);
            echo json_encode(['error' => 'Content ID, source type, and target type are required']);
            return;
        }
        
        // Check if the content item exists
        $stmt = $conn->prepare("
            SELECT id, title 
            FROM content_items 
            WHERE id = ? AND content_type = ?
        ");
        $stmt->execute([$contentId, $contentType]);
        $content = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$content) {
            http_response_code(404);
            echo json_encode(['error' => 'Content item not found']);
            return;
        }
        
        // Get directly related items of the target type
        $stmt = $conn->prepare("
            SELECT ci.*, cr.relationship_type
            FROM content_items ci
            JOIN content_relationships cr ON (
                (cr.source_item_id = ? AND cr.related_item_id = ci.id) OR 
                (cr.related_item_id = ? AND cr.source_item_id = ci.id)
            )
            WHERE ci.content_type = ?
            ORDER BY cr.strength DESC, ci.rating DESC
            LIMIT 10
        ");
        $stmt->execute([$contentId, $contentId, $targetType]);
        $directlyRelated = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If we have fewer than 5 direct relationships, supplement with genre-based recommendations
        if (count($directlyRelated) < 5) {
            // Get genres of the content item
            $stmt = $conn->prepare("
                SELECT cg.id
                FROM content_genres cg
                JOIN content_item_genres cig ON cg.id = cig.genre_id
                WHERE cig.content_item_id = ?
            ");
            $stmt->execute([$contentId]);
            $genreIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (!empty($genreIds)) {
                $placeholders = implode(',', array_fill(0, count($genreIds), '?'));
                
                // Get items of target type with matching genres
                $stmt = $conn->prepare("
                    SELECT ci.*, COUNT(cig.genre_id) AS genre_matches
                    FROM content_items ci
                    JOIN content_item_genres cig ON ci.id = cig.content_item_id
                    WHERE ci.content_type = ? 
                    AND cig.genre_id IN ({$placeholders})
                    GROUP BY ci.id
                    ORDER BY genre_matches DESC, ci.rating DESC, ci.popularity DESC
                    LIMIT 10
                ");
                
                $params = [$targetType];
                foreach ($genreIds as $genreId) {
                    $params[] = $genreId;
                }
                
                $stmt->execute($params);
                $genreRelated = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Merge and remove duplicates
                $relatedIds = array_map(function($item) { return $item['id']; }, $directlyRelated);
                foreach ($genreRelated as $item) {
                    if (!in_array($item['id'], $relatedIds)) {
                        $directlyRelated[] = $item;
                        if (count($directlyRelated) >= 10) {
                            break;
                        }
                    }
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'content' => $content,
            'related_items' => $directlyRelated
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get popular content by type
 */
function getPopularByType($conn, $contentType, $limit) {
    try {
        $limit = min(50, max(1, intval($limit))); // Limit between 1 and 50
        
        $stmt = $conn->prepare("
            SELECT id, title, slug, description, release_date, cover_image, rating, popularity
            FROM content_items
            WHERE content_type = ?
            ORDER BY popularity DESC, rating DESC
            LIMIT ?
        ");
        $stmt->execute([$contentType, $limit]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'items' => $items
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Create a new content relationship
 */
function createContentRelationship($conn) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['source_id']) || !isset($data['related_id']) || !isset($data['relationship_type'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
        
        $sourceId = $data['source_id'];
        $relatedId = $data['related_id'];
        $relationshipType = $data['relationship_type'];
        $strength = $data['strength'] ?? 5;
        
        // Validate source and related items exist
        $stmt = $conn->prepare("
            SELECT id FROM content_items WHERE id IN (?, ?)
        ");
        $stmt->execute([$sourceId, $relatedId]);
        $foundIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($foundIds) != 2) {
            http_response_code(404);
            echo json_encode(['error' => 'One or both content items not found']);
            return;
        }
        
        // Check if relationship already exists
        $stmt = $conn->prepare("
            SELECT id FROM content_relationships
            WHERE (source_item_id = ? AND related_item_id = ?) OR
                  (source_item_id = ? AND related_item_id = ?)
        ");
        $stmt->execute([$sourceId, $relatedId, $relatedId, $sourceId]);
        
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Relationship already exists']);
            return;
        }
        
        // Create relationship
        $stmt = $conn->prepare("
            INSERT INTO content_relationships 
            (source_item_id, related_item_id, relationship_type, strength) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$sourceId, $relatedId, $relationshipType, $strength]);
        
        $relationshipId = $conn->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'relationship_id' => $relationshipId
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Update an existing content relationship
 */
function updateContentRelationship($conn) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['relationship_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Relationship ID required']);
            return;
        }
        
        $relationshipId = $data['relationship_id'];
        $relationshipType = $data['relationship_type'] ?? null;
        $strength = $data['strength'] ?? null;
        
        // Check if relationship exists
        $stmt = $conn->prepare("SELECT id FROM content_relationships WHERE id = ?");
        $stmt->execute([$relationshipId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Relationship not found']);
            return;
        }
        
        // Build update query dynamically based on provided fields
        $updateFields = [];
        $params = [];
        
        if ($relationshipType !== null) {
            $updateFields[] = "relationship_type = ?";
            $params[] = $relationshipType;
        }
        
        if ($strength !== null) {
            $updateFields[] = "strength = ?";
            $params[] = $strength;
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        // Add relationship ID to params
        $params[] = $relationshipId;
        
        // Update relationship
        $stmt = $conn->prepare("
            UPDATE content_relationships
            SET " . implode(", ", $updateFields) . "
            WHERE id = ?
        ");
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Relationship updated successfully'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Delete a content relationship
 */
function deleteContentRelationship($conn) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['relationship_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Relationship ID required']);
            return;
        }
        
        $relationshipId = $data['relationship_id'];
        
        // Delete relationship
        $stmt = $conn->prepare("DELETE FROM content_relationships WHERE id = ?");
        $stmt->execute([$relationshipId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Relationship not found']);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Relationship deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get user role
 */
function getUserRole($conn, $userId) {
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetchColumn();
}