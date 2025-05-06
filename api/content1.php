<?php
/**
 * Content API for Entertainment Hub
 * Handles content retrieval, creation, updating, and deletion
 */

// Start session and include required files
session_start();
require_once 'db_config.php';  // Updated to use the correct path
require_once 'functions.php';   // Updated to use the correct path

// Set content type to JSON
header('Content-Type: application/json');

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

// Get content ID and type from query parameters
$contentId = isset($_GET['id']) ? $_GET['id'] : null;
$contentType = isset($_GET['type']) ? $_GET['type'] : null;

// Process based on request method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($contentId) {
            getContentDetails($contentId, $contentType);
        } else {
            getContentList($contentType);
        }
        break;
    case 'POST':
        createContent();
        break;
    case 'PUT':
        updateContent($contentId);
        break;
    case 'DELETE':
        deleteContent($contentId);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

/**
 * Get content details by ID
 * 
 * @param int $id Content ID
 * @param string $type Content type
 */
function getContentDetails($id, $type) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Content ID is required']);
        return;
    }
    
    // Validate content type
    $validTypes = ['movie', 'series', 'anime', 'manga', 'game'];
    if ($type && !in_array($type, $validTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid content type']);
        return;
    }
    
    global $pdo;
    
    try {
        // Build query based on content type
        $query = 'SELECT c.*, ';
        
        if ($type) {
            switch ($type) {
                case 'movie':
                    $query .= 'm.director, m.duration, m.release_date, m.mpaa_rating ';
                    $query .= 'FROM content c JOIN movies m ON c.id = m.content_id ';
                    break;
                case 'series':
                    $query .= 's.creator, s.seasons, s.episodes, s.start_year, s.end_year ';
                    $query .= 'FROM content c JOIN series s ON c.id = s.content_id ';
                    break;
                case 'anime':
                    $query .= 'a.studio, a.episodes, a.season, a.year, a.status ';
                    $query .= 'FROM content c JOIN anime a ON c.id = a.content_id ';
                    break;
                case 'manga':
                    $query .= 'mg.author, mg.volumes, mg.chapters, mg.status, mg.publication_start, mg.publication_end ';
                    $query .= 'FROM content c JOIN manga mg ON c.id = mg.content_id ';
                    break;
                case 'game':
                    $query .= 'g.developer, g.publisher, g.release_date, g.platforms, g.esrb_rating ';
                    $query .= 'FROM content c JOIN games g ON c.id = g.content_id ';
                    break;
            }
        } else {
            // If no type specified, just get basic content info
            $query .= 'c.type ';
            $query .= 'FROM content c ';
        }
        
        $query .= 'WHERE c.id = ?';
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        $content = $stmt->fetch();
        
        if (!$content) {
            http_response_code(404);
            echo json_encode(['error' => 'Content not found']);
            return;
        }
        
        // Get genres
        $stmt = $pdo->prepare('
            SELECT g.id, g.name 
            FROM genres g 
            JOIN content_genres cg ON g.id = cg.genre_id 
            WHERE cg.content_id = ?
        ');
        $stmt->execute([$id]);
        $genres = $stmt->fetchAll();
        $content['genres'] = $genres;
        
        // Get ratings
        $stmt = $pdo->prepare('
            SELECT AVG(rating) as average_rating, COUNT(*) as rating_count 
            FROM ratings 
            WHERE content_id = ?
        ');
        $stmt->execute([$id]);
        $ratings = $stmt->fetch();
        $content['average_rating'] = $ratings['average_rating'] ? round($ratings['average_rating'], 1) : null;
        $content['rating_count'] = $ratings['rating_count'];
        
        // Get related content
        $stmt = $pdo->prepare('
            SELECT c.id, c.title, c.poster, c.type 
            FROM content c 
            JOIN content_relations cr ON c.id = cr.related_content_id 
            WHERE cr.content_id = ?
        ');
        $stmt->execute([$id]);
        $relatedContent = $stmt->fetchAll();
        $content['related_content'] = $relatedContent;
        
        // Increment view count
        $stmt = $pdo->prepare('UPDATE content SET views = views + 1 WHERE id = ?');
        $stmt->execute([$id]);
        
        // Log content view if user is logged in
        if (isset($_SESSION['user_id'])) {
            logContentView($_SESSION['user_id'], $id);
        }
        
        echo json_encode([
            'success' => true,
            'content' => $content
        ]);
        
    } catch (PDOException $e) {
        error_log('Content details error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while fetching content details']);
    }
}

/**
 * Get content list with optional filtering
 * 
 * @param string $type Content type filter
 */
function getContentList($type = null) {
    // Get query parameters for filtering and pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    
    // Validate and sanitize inputs
    $validTypes = ['movie', 'series', 'anime', 'manga', 'game'];
    if ($type && !in_array($type, $validTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid content type']);
        return;
    }
    
    global $pdo;
    
    try {
        // Base query
        $query = 'SELECT c.*, ';
        $queryCount = 'SELECT COUNT(*) FROM content c ';
        
        if ($type) {
            switch ($type) {
                case 'movie':
                    $query .= 'm.director, m.duration, m.release_date, m.mpaa_rating ';
                    $queryCount .= 'JOIN movies m ON c.id = m.content_id ';
                    $query .= 'FROM content c JOIN movies m ON c.id = m.content_id ';
                    break;
                case 'series':
                    $query .= 's.creator, s.seasons, s.episodes, s.start_year, s.end_year ';
                    $queryCount .= 'JOIN series s ON c.id = s.content_id ';
                    $query .= 'FROM content c JOIN series s ON c.id = s.content_id ';
                    break;
                case 'anime':
                    $query .= 'a.studio, a.episodes, a.season, a.year, a.status ';
                    $queryCount .= 'JOIN anime a ON c.id = a.content_id ';
                    $query .= 'FROM content c JOIN anime a ON c.id = a.content_id ';
                    break;
                case 'manga':
                    $query .= 'mg.author, mg.volumes, mg.chapters, mg.status, mg.publication_start, mg.publication_end ';
                    $queryCount .= 'JOIN manga mg ON c.id = mg.content_id ';
                    $query .= 'FROM content c JOIN manga mg ON c.id = mg.content_id ';
                    break;
                case 'game':
                    $query .= 'g.developer, g.publisher, g.release_date, g.platforms, g.esrb_rating ';
                    $queryCount .= 'JOIN games g ON c.id = g.content_id ';
                    $query .= 'FROM content c JOIN games g ON c.id = g.content_id ';
                    break;
            }
        } else {
            // If no type specified, just get basic content info
            $query .= 'c.type ';
            $query .= 'FROM content c ';
        }
        
        // Prepare and execute count query
        $stmt = $pdo->prepare($queryCount);
        $stmt->execute();
        $total = $stmt->fetchColumn();
        
        // Prepare and execute main query
        $query .= ' LIMIT :limit OFFSET :offset';
        $stmt = $pdo->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $contentList = $stmt->fetchAll();
        
        // Format response
        $response = [
            'success' => true,
            'data' => $contentList,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]
        ];
        
        echo json_encode($response);
        
    } catch (PDOException $e) {
        error_log('Content list error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while fetching content list']);
    }
}

/**
 * Create new content entry
 */
function createContent() {
    // Check required fields
    $requiredFields = ['title', 'type', 'description'];
    foreach ($requiredFields as $field) {
        if (!isset($_POST[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    global $pdo;
    
    try {
        // Insert content
        $stmt = $pdo->prepare('
            INSERT INTO content (title, type, description, created_at) 
            VALUES (?, ?, ?, NOW())
        ');
        $stmt->execute([$_POST['title'], $_POST['type'], $_POST['description']]);
        $contentId = $pdo->lastInsertId();
        
        // Insert additional data based on content type
        switch ($_POST['type']) {
            case 'movie':
                $stmt = $pdo->prepare('
                    INSERT INTO movies (content_id, director, duration, release_date, mpaa_rating) 
                    VALUES (?, ?, ?, ?, ?)
                ');
                $stmt->execute([$contentId, $_POST['director'], $_POST['duration'], $_POST['release_date'], $_POST['mpaa_rating']]);
                break;
            case 'series':
                $stmt = $pdo->prepare('
                    INSERT INTO series (content_id, creator, seasons, episodes, start_year, end_year) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([$contentId, $_POST['creator'], $_POST['seasons'], $_POST['episodes'], $_POST['start_year'], $_POST['end_year']]);
                break;
            case 'anime':
                $stmt = $pdo->prepare('
                    INSERT INTO anime (content_id, studio, episodes, season, year, status) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([$contentId, $_POST['studio'], $_POST['episodes'], $_POST['season'], $_POST['year'], $_POST['status']]);
                break;
            case 'manga':
                $stmt = $pdo->prepare('
                    INSERT INTO manga (content_id, author, volumes, chapters, status, publication_start, publication_end) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([$contentId, $_POST['author'], $_POST['volumes'], $_POST['chapters'], $_POST['status'], $_POST['publication_start'], $_POST['publication_end']]);
                break;
            case 'game':
                $stmt = $pdo->prepare('
                    INSERT INTO games (content_id, developer, publisher, release_date, platforms, esrb_rating) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([$contentId, $_POST['developer'], $_POST['publisher'], $_POST['release_date'], $_POST['platforms'], $_POST['esrb_rating']]);
                break;
        }
        
        echo json_encode(['success' => true, 'id' => $contentId]);
        
    } catch (PDOException $e) {
        error_log('Content creation error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while creating content']);
    }
}

/**
 * Update existing content entry
 * 
 * @param int $id Content ID
 */
function updateContent($id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Content ID is required']);
        return;
    }
    
    // Check required fields
    $requiredFields = ['title', 'type', 'description'];
    foreach ($requiredFields as $field) {
        if (!isset($_POST[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    global $pdo;
    
    try {
        // Update content
        $stmt = $pdo->prepare('
            UPDATE content 
            SET title = ?, type = ?, description = ?, updated_at = NOW() 
            WHERE id = ?
        ');
        $stmt->execute([$_POST['title'], $_POST['type'], $_POST['description'], $id]);
        
        // Update additional data based on content type
        switch ($_POST['type']) {
            case 'movie':
                $stmt = $pdo->prepare('
                    UPDATE movies 
                    SET director = ?, duration = ?, release_date = ?, mpaa_rating = ? 
                    WHERE content_id = ?
                ');
                $stmt->execute([$_POST['director'], $_POST['duration'], $_POST['release_date'], $_POST['mpaa_rating'], $id]);
                break;
            case 'series':
                $stmt = $pdo->prepare('
                    UPDATE series 
                    SET creator = ?, seasons = ?, episodes = ?, start_year = ?, end_year = ? 
                    WHERE content_id = ?
                ');
                $stmt->execute([$_POST['creator'], $_POST['seasons'], $_POST['episodes'], $_POST['start_year'], $_POST['end_year'], $id]);
                break;
            case 'anime':
                $stmt = $pdo->prepare('
                    UPDATE anime 
                    SET studio = ?, episodes = ?, season = ?, year = ?, status = ? 
                    WHERE content_id = ?
                ');
                $stmt->execute([$_POST['studio'], $_POST['episodes'], $_POST['season'], $_POST['year'], $_POST['status'], $id]);
                break;
            case 'manga':
                $stmt = $pdo->prepare('
                    UPDATE manga 
                    SET author = ?, volumes = ?, chapters = ?, status = ?, publication_start = ?, publication_end = ? 
                    WHERE content_id = ?
                ');
                $stmt->execute([$_POST['author'], $_POST['volumes'], $_POST['chapters'], $_POST['status'], $_POST['publication_start'], $_POST['publication_end'], $id]);
                break;
            case 'game':
                $stmt = $pdo->prepare('
                    UPDATE games 
                    SET developer = ?, publisher = ?, release_date = ?, platforms = ?, esrb_rating = ? 
                    WHERE content_id = ?
                ');
                $stmt->execute([$_POST['developer'], $_POST['publisher'], $_POST['release_date'], $_POST['platforms'], $_POST['esrb_rating'], $id]);
                break;
        }
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        error_log('Content update error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while updating content']);
    }
}

/**
 * Delete content entry
 * 
 * @param int $id Content ID
 */
function deleteContent($id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Content ID is required']);
        return;
    }
    
    global $pdo;
    
    try {
        // Delete content
        $stmt = $pdo->prepare('DELETE FROM content WHERE id = ?');
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        error_log('Content deletion error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while deleting content']);
    }
}

/**
 * Log content view for analytics
 * 
 * @param int $userId User ID
 * @param int $contentId Content ID
 * @return void
 */
function logContentView($userId, $contentId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO content_views (user_id, content_id, viewed_at)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$userId, $contentId]);
    } catch (PDOException $e) {
        // Just log error, don't interrupt the user experience
        error_log('Failed to log content view: ' . $e->getMessage());
    }
}

