<?php
/**
 * Series API Endpoints
 * 
 * Handles operations related to TV series:
 * - Fetching series details and metadata
 * - Managing episodes and seasons
 * - Tracking watch progress
 * - Getting recommendations
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
 * Handle GET requests for series data
 */
function handleGetRequest() {
    global $conn;
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'get_series':
            $seriesId = $_GET['id'] ?? 0;
            getSeriesDetails($conn, $seriesId);
            break;
            
        case 'get_episodes':
            $seriesId = $_GET['id'] ?? 0;
            $season = $_GET['season'] ?? 0;
            getSeriesEpisodes($conn, $seriesId, $season);
            break;
            
        case 'get_popular':
            $limit = $_GET['limit'] ?? 10;
            $genre = $_GET['genre'] ?? '';
            getPopularSeries($conn, $limit, $genre);
            break;
            
        case 'get_trending':
            $category = $_GET['category'] ?? 'weekly'; // weekly, monthly, all-time
            $limit = $_GET['limit'] ?? 10;
            getTrendingSeries($conn, $category, $limit);
            break;
            
        case 'get_watch_progress':
            $userId = authenticate();
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            $seriesId = $_GET['id'] ?? 0;
            getWatchProgress($conn, $userId, $seriesId);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

/**
 * Handle POST requests for series interactions
 */
function handlePostRequest() {
    global $conn;
    
    $userId = authenticate();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'update_watch_progress':
            updateWatchProgress($conn, $userId);
            break;
            
        case 'add_to_watchlist':
            addSeriestoWatchlist($conn, $userId);
            break;
            
        case 'remove_from_watchlist':
            removeSeriesFromWatchlist($conn, $userId);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

/**
 * Get details for a specific series
 */
function getSeriesDetails($conn, $seriesId) {
    try {
        if (!$seriesId) {
            http_response_code(400);
            echo json_encode(['error' => 'Series ID required']);
            return;
        }
        
        // Get series from content_items table
        $stmt = $conn->prepare("
            SELECT * FROM content_items 
            WHERE id = ? AND content_type = 'series'
        ");
        $stmt->execute([$seriesId]);
        $series = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$series) {
            http_response_code(404);
            echo json_encode(['error' => 'Series not found']);
            return;
        }
        
        // Get genres for this series
        $stmt = $conn->prepare("
            SELECT cg.id, cg.name, cg.slug
            FROM content_genres cg
            JOIN content_item_genres cig ON cg.id = cig.genre_id
            WHERE cig.content_item_id = ?
        ");
        $stmt->execute([$seriesId]);
        $genres = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $series['genres'] = $genres;
        
        // Get series-specific metadata
        $stmt = $conn->prepare("
            SELECT * FROM series_metadata 
            WHERE series_id = ?
        ");
        $stmt->execute([$seriesId]);
        $metadata = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($metadata) {
            $series = array_merge($series, $metadata);
        }
        
        // Get season information
        $stmt = $conn->prepare("
            SELECT season_number, COUNT(*) as episode_count, 
                   MIN(air_date) as season_start, MAX(air_date) as season_end
            FROM series_episodes
            WHERE series_id = ?
            GROUP BY season_number
            ORDER BY season_number
        ");
        $stmt->execute([$seriesId]);
        $seasons = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $series['seasons'] = $seasons;
        
        // Get cast information
        $stmt = $conn->prepare("
            SELECT p.id, p.name, p.photo, sc.character_name, sc.role
            FROM series_cast sc
            JOIN people p ON sc.person_id = p.id
            WHERE sc.series_id = ?
            ORDER BY sc.importance ASC
            LIMIT 10
        ");
        $stmt->execute([$seriesId]);
        $cast = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $series['cast'] = $cast;
        
        // Get rating statistics
        $stmt = $conn->prepare("
            SELECT COUNT(*) as rating_count, AVG(rating) as average_rating
            FROM content_ratings
            WHERE content_id = ? AND content_type = 'series'
        ");
        $stmt->execute([$seriesId]);
        $ratings = $stmt->fetch(PDO::FETCH_ASSOC);
        $series['ratings'] = $ratings;
        
        echo json_encode([
            'success' => true,
            'series' => $series
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get episodes for a specific series and season
 */
function getSeriesEpisodes($conn, $seriesId, $season) {
    try {
        if (!$seriesId) {
            http_response_code(400);
            echo json_encode(['error' => 'Series ID required']);
            return;
        }
        
        // If season is 0, get all episodes
        if ($season == 0) {
            $stmt = $conn->prepare("
                SELECT * FROM series_episodes
                WHERE series_id = ?
                ORDER BY season_number, episode_number
            ");
            $stmt->execute([$seriesId]);
        } else {
            $stmt = $conn->prepare("
                SELECT * FROM series_episodes
                WHERE series_id = ? AND season_number = ?
                ORDER BY episode_number
            ");
            $stmt->execute([$seriesId, $season]);
        }
        
        $episodes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'series_id' => $seriesId,
            'season' => $season,
            'episodes' => $episodes
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get popular series with optional genre filter
 */
function getPopularSeries($conn, $limit, $genre) {
    try {
        $limit = min(50, max(1, intval($limit))); // Limit between 1 and 50
        
        if (!empty($genre)) {
            $stmt = $conn->prepare("
                SELECT ci.* 
                FROM content_items ci
                JOIN content_item_genres cig ON ci.id = cig.content_item_id
                JOIN content_genres cg ON cig.genre_id = cg.id
                WHERE ci.content_type = 'series'
                AND (cg.slug = ? OR cg.name = ?)
                ORDER BY ci.popularity DESC, ci.rating DESC
                LIMIT ?
            ");
            $stmt->execute([$genre, $genre, $limit]);
        } else {
            $stmt = $conn->prepare("
                SELECT * FROM content_items
                WHERE content_type = 'series'
                ORDER BY popularity DESC, rating DESC
                LIMIT ?
            ");
            $stmt->execute([$limit]);
        }
        
        $series = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add genres to each series
        foreach ($series as &$s) {
            $stmt = $conn->prepare("
                SELECT cg.id, cg.name, cg.slug
                FROM content_genres cg
                JOIN content_item_genres cig ON cg.id = cig.genre_id
                WHERE cig.content_item_id = ?
            ");
            $stmt->execute([$s['id']]);
            $s['genres'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'series' => $series
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get trending series for a specific timeframe
 */
function getTrendingSeries($conn, $category, $limit) {
    try {
        $limit = min(50, max(1, intval($limit))); // Limit between 1 and 50
        
        switch ($category) {
            case 'weekly':
                $timeframe = "AND view_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
                break;
            case 'monthly':
                $timeframe = "AND view_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
                break;
            default:
                $timeframe = "";
        }
        
        $stmt = $conn->prepare("
            SELECT ci.*, COUNT(cv.id) as view_count
            FROM content_items ci
            JOIN content_views cv ON ci.id = cv.content_id
            WHERE ci.content_type = 'series'
            AND cv.content_type = 'series'
            $timeframe
            GROUP BY ci.id
            ORDER BY view_count DESC, ci.popularity DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $series = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add genres to each series
        foreach ($series as &$s) {
            $stmt = $conn->prepare("
                SELECT cg.id, cg.name, cg.slug
                FROM content_genres cg
                JOIN content_item_genres cig ON cg.id = cig.genre_id
                WHERE cig.content_item_id = ?
            ");
            $stmt->execute([$s['id']]);
            $s['genres'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'category' => $category,
            'series' => $series
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get user's watch progress for a series
 */
function getWatchProgress($conn, $userId, $seriesId) {
    try {
        if (!$seriesId) {
            http_response_code(400);
            echo json_encode(['error' => 'Series ID required']);
            return;
        }
        
        // Get all episodes for the series
        $stmt = $conn->prepare("
            SELECT * FROM series_episodes
            WHERE series_id = ?
            ORDER BY season_number, episode_number
        ");
        $stmt->execute([$seriesId]);
        $episodes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get watch progress for each episode
        foreach ($episodes as &$episode) {
            $stmt = $conn->prepare("
                SELECT * FROM watch_progress
                WHERE user_id = ? AND episode_id = ?
                ORDER BY watched_at DESC
                LIMIT 1
            ");
            $stmt->execute([$userId, $episode['id']]);
            $progress = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($progress) {
                $episode['watched'] = true;
                $episode['progress'] = $progress['progress_seconds'];
                $episode['completed'] = $progress['completed'];
                $episode['watched_at'] = $progress['watched_at'];
            } else {
                $episode['watched'] = false;
                $episode['progress'] = 0;
                $episode['completed'] = false;
            }
        }
        
        // Organize episodes by season
        $seasonData = [];
        foreach ($episodes as $episode) {
            $seasonNum = $episode['season_number'];
            if (!isset($seasonData[$seasonNum])) {
                $seasonData[$seasonNum] = [
                    'season_number' => $seasonNum,
                    'episodes' => [],
                    'total_episodes' => 0,
                    'watched_episodes' => 0
                ];
            }
            
            $seasonData[$seasonNum]['episodes'][] = $episode;
            $seasonData[$seasonNum]['total_episodes']++;
            
            if ($episode['watched'] && $episode['completed']) {
                $seasonData[$seasonNum]['watched_episodes']++;
            }
        }
        
        echo json_encode([
            'success' => true,
            'user_id' => $userId,
            'series_id' => $seriesId,
            'seasons' => array_values($seasonData)
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Update watch progress for a specific episode
 */
function updateWatchProgress($conn, $userId) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['episode_id']) || !isset($data['progress_seconds'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
        
        $episodeId = $data['episode_id'];
        $progressSeconds = $data['progress_seconds'];
        $completed = $data['completed'] ?? false;
        $seriesId = $data['series_id'] ?? 0;
        
        // Check if episode exists
        $stmt = $conn->prepare("SELECT * FROM series_episodes WHERE id = ?");
        $stmt->execute([$episodeId]);
        $episode = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$episode) {
            http_response_code(404);
            echo json_encode(['error' => 'Episode not found']);
            return;
        }
        
        // Get the series ID if not provided
        if (!$seriesId) {
            $seriesId = $episode['series_id'];
        }
        
        // Record content view
        $stmt = $conn->prepare("
            INSERT INTO content_views (user_id, content_id, content_type, view_date)
            VALUES (?, ?, 'series', NOW())
        ");
        $stmt->execute([$userId, $seriesId]);
        
        // Check if progress exists
        $stmt = $conn->prepare("
            SELECT id FROM watch_progress
            WHERE user_id = ? AND episode_id = ?
        ");
        $stmt->execute([$userId, $episodeId]);
        $existingProgress = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingProgress) {
            // Update existing progress
            $stmt = $conn->prepare("
                UPDATE watch_progress
                SET progress_seconds = ?, completed = ?, watched_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$progressSeconds, $completed ? 1 : 0, $existingProgress['id']]);
        } else {
            // Insert new progress
            $stmt = $conn->prepare("
                INSERT INTO watch_progress (user_id, episode_id, series_id, progress_seconds, completed, watched_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $episodeId, $seriesId, $progressSeconds, $completed ? 1 : 0]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Watch progress updated successfully'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Add a series to user's watchlist
 */
function addSeriestoWatchlist($conn, $userId) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['series_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Series ID required']);
            return;
        }
        
        $seriesId = $data['series_id'];
        
        // Check if series exists
        $stmt = $conn->prepare("
            SELECT id FROM content_items 
            WHERE id = ? AND content_type = 'series'
        ");
        $stmt->execute([$seriesId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Series not found']);
            return;
        }
        
        // Check if already in watchlist
        $stmt = $conn->prepare("
            SELECT * FROM watchlist
            WHERE user_id = ? AND content_id = ? AND content_type = 'series'
        ");
        $stmt->execute([$userId, $seriesId]);
        
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Series is already in watchlist'
            ]);
            return;
        }
        
        // Add to watchlist
        $stmt = $conn->prepare("
            INSERT INTO watchlist (user_id, content_id, content_type, added_at)
            VALUES (?, ?, 'series', NOW())
        ");
        $stmt->execute([$userId, $seriesId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Series added to watchlist successfully'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Remove a series from user's watchlist
 */
function removeSeriesFromWatchlist($conn, $userId) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['series_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Series ID required']);
            return;
        }
        
        $seriesId = $data['series_id'];
        
        // Remove from watchlist
        $stmt = $conn->prepare("
            DELETE FROM watchlist
            WHERE user_id = ? AND content_id = ? AND content_type = 'series'
        ");
        $stmt->execute([$userId, $seriesId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Series not found in watchlist'
            ]);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Series removed from watchlist successfully'
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