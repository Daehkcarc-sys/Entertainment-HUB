<?php
/**
 * Search API for Entertainment Hub
 * Handles advanced search functionality across all content types
 */

// Start session and include required files
session_start();
require_once __DIR__ . '/db_config.php';  // Use absolute path with __DIR__
require_once __DIR__ . '/functions.php';   // Use absolute path with __DIR__

// Get database connection
$pdo = getDbConnection();

// Set content type to JSON
header('Content-Type: application/json');

// Get search query
$query = isset($_GET['q']) ? trim($_GET['q']) : '';

// Get filters
$contentTypes = isset($_GET['content_type']) ? explode(',', $_GET['content_type']) : [];
$genres = isset($_GET['genre']) ? explode(',', $_GET['genre']) : [];
$yearFrom = isset($_GET['year_from']) ? (int)$_GET['year_from'] : null;
$yearTo = isset($_GET['year_to']) ? (int)$_GET['year_to'] : null;
$minRating = isset($_GET['min_rating']) ? (float)$_GET['min_rating'] : null;
$language = isset($_GET['language']) ? explode(',', $_GET['language']) : [];
$availability = isset($_GET['availability']) ? explode(',', $_GET['availability']) : [];

// Get sorting options
$sortBy = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'relevance';
$sortOrder = isset($_GET['sort_order']) ? strtoupper($_GET['sort_order']) : 'DESC';

// Validate sort order
if ($sortOrder !== 'ASC' && $sortOrder !== 'DESC') {
    $sortOrder = 'DESC';
}

// Get pagination parameters
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

// Validate pagination
if ($page < 1) $page = 1;
if ($limit < 1 || $limit > 100) $limit = 20;
$offset = ($page - 1) * $limit;

// Perform search
try {
    global $pdo;
    
    // Build base query
    $sql = "
        SELECT 
            c.id, 
            c.title, 
            c.description, 
            c.poster, 
            c.type, 
            c.release_year,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as rating_count
        FROM 
            content c
        LEFT JOIN 
            ratings r ON c.id = r.content_id
    ";
    
    // Add joins for filters
    $joins = [];
    $where = [];
    $params = [];
    
    // Content type filter
    if (!empty($contentTypes)) {
        $placeholders = implode(',', array_fill(0, count($contentTypes), '?'));
        $where[] = "c.type IN ($placeholders)";
        $params = array_merge($params, $contentTypes);
    }
    
    // Genre filter
    if (!empty($genres)) {
        $joins[] = "JOIN content_genres cg ON c.id = cg.content_id";
        $joins[] = "JOIN genres g ON cg.genre_id = g.id";
        
        $genrePlaceholders = implode(',', array_fill(0, count($genres), '?'));
        $where[] = "g.name IN ($genrePlaceholders)";
        $params = array_merge($params, $genres);
    }
    
    // Year range filter
    if ($yearFrom !== null) {
        $where[] = "c.release_year >= ?";
        $params[] = $yearFrom;
    }
    
    if ($yearTo !== null) {
        $where[] = "c.release_year &lt;= ?";
        $params[] = $yearTo;
    }
    
    // Language filter
    if (!empty($language)) {
        $joins[] = "JOIN content_languages cl ON c.id = cl.content_id";
        $joins[] = "JOIN languages l ON cl.language_id = l.id";
        
        $languagePlaceholders = implode(',', array_fill(0, count($language), '?'));
        $where[] = "l.code IN ($languagePlaceholders)";
        $params = array_merge($params, $language);
    }
    
    // Availability filter
    if (!empty($availability)) {
        $joins[] = "JOIN content_platforms cp ON c.id = cp.content_id";
        $joins[] = "JOIN platforms p ON cp.platform_id = p.id";
        
        $availabilityPlaceholders = implode(',', array_fill(0, count($availability), '?'));
        $where[] = "p.code IN ($availabilityPlaceholders)";
        $params = array_merge($params, $availability);
    }
    
    // Minimum rating filter
    if ($minRating !== null) {
        $where[] = "COALESCE(AVG(r.rating), 0) >= ?";
        $params[] = $minRating;
    }
    
    // Search query
    if (!empty($query)) {
        $where[] = "(
            c.title LIKE ? OR 
            c.description LIKE ? OR 
            c.tags LIKE ?
        )";
        $searchParam = "%$query%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }
    
    // Add joins to query
    if (!empty($joins)) {
        $sql .= ' ' . implode(' ', array_unique($joins));
    }
    
    // Add where clauses
    if (!empty($where)) {
        $sql .= " WHERE " . implode(' AND ', $where);
    }
    
    // Add group by
    $sql .= " GROUP BY c.id";
    
    // Add sorting
    switch ($sortBy) {
        case 'title':
            $sql .= " ORDER BY c.title $sortOrder";
            break;
        case 'release_date':
            $sql .= " ORDER BY c.release_year $sortOrder, c.release_date $sortOrder";
            break;
        case 'rating':
            $sql .= " ORDER BY average_rating $sortOrder, rating_count $sortOrder";
            break;
        case 'popularity':
            $sql .= " ORDER BY c.views $sortOrder, rating_count $sortOrder";
            break;
        default: // relevance
            if (!empty($query)) {
                // For relevance, prioritize exact matches in title
                $sql .= " ORDER BY 
                    CASE WHEN c.title LIKE ? THEN 3
                         WHEN c.title LIKE ? THEN 2
                         WHEN c.description LIKE ? THEN 1
                         ELSE 0
                    END DESC,
                    c.views DESC,
                    average_rating DESC";
                $params[] = $query;
                $params[] = "$query%";
                $params[] = "%$query%";
            } else {
                // If no query, sort by views and rating
                $sql .= " ORDER BY c.views DESC, average_rating DESC";
            }
            break;
    }
    
    // Add pagination
    $sql .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    // Execute query
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    // Get total count for pagination
    $countSql = "
        SELECT COUNT(DISTINCT c.id) as total
        FROM content c
    ";
    
    // Add joins for filters
    if (!empty($joins)) {
        $countSql .= ' ' . implode(' ', array_unique($joins));
    }
    
    // Add where clauses
    if (!empty($where)) {
        $countSql .= " WHERE " . implode(' AND ', $where);
    }
    
    // Remove pagination params
    array_pop($params); // Remove offset
    array_pop($params); // Remove limit
    
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetchColumn();
    
    // Calculate pagination info
    $totalPages = ceil($totalCount / $limit);
    
    // Enhance results with additional data
    foreach ($results as &$result) {
        // Get genres for each result
        $genreStmt = $pdo->prepare("
            SELECT g.name
            FROM genres g
            JOIN content_genres cg ON g.id = cg.genre_id
            WHERE cg.content_id = ?
        ");
        $genreStmt->execute([$result['id']]);
        $result['genres'] = array_column($genreStmt->fetchAll(), 'name');
        
        // Get platforms for each result
        $platformStmt = $pdo->prepare("
            SELECT p.name, p.code
            FROM platforms p
            JOIN content_platforms cp ON p.id = cp.platform_id
            WHERE cp.content_id = ?
        ");
        $platformStmt->execute([$result['id']]);
        $result['platforms'] = $platformStmt->fetchAll();
    }
    
    // Log search query if user is logged in
    if (isset($_SESSION['user_id']) && !empty($query)) {
        logSearchQuery($_SESSION['user_id'], $query, count($results));
    }
    
    // Return results
    echo json_encode([
        'success' => true,
        'results' => $results,
        'pagination' => [
            'total' => $totalCount,
            'per_page' => $limit,
            'current_page' => $page,
            'last_page' => $totalPages,
            'from' => $offset + 1,
            'to' => min($offset + $limit, $totalCount)
        ],
        'filters' => [
            'query' => $query,
            'content_types' => $contentTypes,
            'genres' => $genres,
            'year_from' => $yearFrom,
            'year_to' => $yearTo,
            'min_rating' => $minRating,
            'language' => $language,
            'availability' => $availability
        ]
    ]);
    
} catch (PDOException $e) {
    error_log('Search error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred during search']);
}

/**
 * Log search query
 * 
 * @param int $userId User ID
 * @param string $query Search query
 * @param int $resultCount Number of results
 */
function logSearchQuery($userId, $query, $resultCount) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO search_logs (user_id, query, result_count, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $query, $resultCount]);
    } catch (PDOException $e) {
        error_log('Search log error: ' . $e->getMessage());
    }
}
