<?php
/**
 * API Router
 * 
 * Handles routing of API requests to appropriate handlers.
 */

// Include required files
require_once __DIR__ . '/../core/config.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/functions.php';

// Set content type to JSON
header('Content-Type: application/json');

// Allow cross-origin requests (CORS)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Parse request URI to extract endpoint
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = '/Projet/php/api/';
$endpoint = substr($requestUri, strlen($basePath));

// Remove trailing slashes
$endpoint = rtrim($endpoint, '/');

// Parse query parameters
$queryParams = [];
if (isset($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $queryParams);
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get request data
$requestData = [];
$requestBody = file_get_contents('php://input');

if (!empty($requestBody)) {
    $requestData = json_decode($requestBody, true);
    
    // Check for JSON decode error
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(['error' => 'Invalid JSON in request body'], 400);
    }
}

// Merge request data with POST data
$requestData = array_merge($requestData, $_POST);

// Check API key if required
$apiKey = getApiKey();
$requireAuth = true;

// Public endpoints that don't require authentication
$publicEndpoints = [
    'movies' => ['GET'],
    'series' => ['GET'],
    'anime' => ['GET'],
    'manga' => ['GET'],
    'games' => ['GET'],
    'search' => ['GET'],
    'genres' => ['GET'],
    'auth/login' => ['POST'],
    'auth/register' => ['POST']
];

// Check if endpoint is public and method is allowed
foreach ($publicEndpoints as $pubEndpoint => $allowedMethods) {
    if (strpos($endpoint, $pubEndpoint) === 0 && in_array($method, $allowedMethods)) {
        $requireAuth = false;
        break;
    }
}

// Verify API key if authentication is required
if ($requireAuth) {
    if (!$apiKey) {
        sendResponse(['error' => 'API key is required'], 401);
    }
    
    if (!verifyApiKey($apiKey)) {
        sendResponse(['error' => 'Invalid API key'], 401);
    }
}

// Start logging the API request
$logId = logApiRequest($endpoint, $method, $apiKey, $requestData);

// Set the start time for execution time calculation
$startTime = microtime(true);

try {
    // Route the request to the appropriate handler
    $responseData = routeRequest($endpoint, $method, $requestData, $queryParams);
    
    // Calculate execution time
    $executionTime = microtime(true) - $startTime;
    
    // Update the log with the response and execution time
    updateApiLog($logId, 200, $executionTime);
    
    // Send the response
    sendResponse($responseData);
} catch (Exception $e) {
    // Handle exceptions
    $statusCode = $e->getCode() ?: 500;
    $responseData = ['error' => $e->getMessage()];
    
    // Calculate execution time
    $executionTime = microtime(true) - $startTime;
    
    // Update the log with the error response and execution time
    updateApiLog($logId, $statusCode, $executionTime);
    
    // Send the error response
    sendResponse($responseData, $statusCode);
}

/**
 * Route the request to the appropriate handler
 * 
 * @param string $endpoint API endpoint
 * @param string $method HTTP method
 * @param array $requestData Request data
 * @param array $queryParams Query parameters
 * @return array Response data
 * @throws Exception if the endpoint is not found or method not allowed
 */
function routeRequest($endpoint, $method, $requestData, $queryParams) {
    // Split the endpoint into parts
    $parts = explode('/', $endpoint);
    
    // Get the resource type and ID if provided
    $resourceType = $parts[0] ?? '';
    $resourceId = $parts[1] ?? null;
    $subResource = $parts[2] ?? null;
    
    // Check rate limits
    if (!checkRateLimit()) {
        throw new Exception('Rate limit exceeded. Please try again later.', 429);
    }
    
    // Route to the appropriate handler based on resource type
    switch ($resourceType) {
        case 'movies':
            require_once __DIR__ . '/handlers/movies_handler.php';
            return handleMoviesRequest($method, $resourceId, $subResource, $requestData, $queryParams);
        
        case 'series':
            require_once __DIR__ . '/handlers/series_handler.php';
            return handleSeriesRequest($method, $resourceId, $subResource, $requestData, $queryParams);
        
        case 'anime':
            require_once __DIR__ . '/handlers/anime_handler.php';
            return handleAnimeRequest($method, $resourceId, $subResource, $requestData, $queryParams);
        
        case 'manga':
            require_once __DIR__ . '/handlers/manga_handler.php';
            return handleMangaRequest($method, $resourceId, $subResource, $requestData, $queryParams);
        
        case 'games':
            require_once __DIR__ . '/handlers/games_handler.php';
            return handleGamesRequest($method, $resourceId, $subResource, $requestData, $queryParams);
        
        case 'users':
            require_once __DIR__ . '/handlers/users_handler.php';
            return handleUsersRequest($method, $resourceId, $subResource, $requestData, $queryParams);
        
        case 'search':
            require_once __DIR__ . '/handlers/search_handler.php';
            return handleSearchRequest($method, $requestData, $queryParams);
        
        case 'watchlist':
            require_once __DIR__ . '/handlers/watchlist_handler.php';
            return handleWatchlistRequest($method, $resourceId, $requestData, $queryParams);
        
        case 'ratings':
            require_once __DIR__ . '/handlers/ratings_handler.php';
            return handleRatingsRequest($method, $resourceId, $requestData, $queryParams);
        
        case 'discussions':
            require_once __DIR__ . '/handlers/discussions_handler.php';
            return handleDiscussionsRequest($method, $resourceId, $subResource, $requestData, $queryParams);
        
        case 'comments':
            require_once __DIR__ . '/handlers/comments_handler.php';
            return handleCommentsRequest($method, $resourceId, $requestData, $queryParams);
        
        case 'genres':
            require_once __DIR__ . '/handlers/genres_handler.php';
            return handleGenresRequest($method, $resourceId, $requestData, $queryParams);
        
        case 'auth':
            require_once __DIR__ . '/handlers/auth_handler.php';
            return handleAuthRequest($method, $resourceId, $requestData);
        
        default:
            throw new Exception('Endpoint not found', 404);
    }
}

/**
 * Get API key from request headers or parameters
 * 
 * @return string|null API key or null if not found
 */
function getApiKey() {
    // Check authorization header
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    
    // Check X-API-Key header
    if (isset($headers['X-API-Key'])) {
        return $headers['X-API-Key'];
    }
    
    // Check query parameter
    if (isset($_GET['api_key'])) {
        return $_GET['api_key'];
    }
    
    return null;
}

/**
 * Verify API key
 * 
 * @param string $apiKey API key to verify
 * @return bool True if valid, false otherwise
 */
function verifyApiKey($apiKey) {
    if (DEBUG_MODE && $apiKey === 'debug_key') {
        return true;
    }
    
    try {
        $sql = "SELECT * FROM api_keys WHERE api_key = :api_key AND is_active = 1";
        if (!DEBUG_MODE) {
            $sql .= " AND (expires_at IS NULL OR expires_at > NOW())";
        }
        
        $stmt = executeQuery($sql, ['api_key' => $apiKey]);
        $key = $stmt->fetch();
        
        if ($key) {
            // Update last used timestamp
            $updateSql = "UPDATE api_keys SET last_used = NOW() WHERE id = :id";
            executeQuery($updateSql, ['id' => $key['id']]);
            return true;
        }
        
        return false;
    } catch (Exception $e) {
        logMessage('API key verification error: ' . $e->getMessage(), 'error');
        return false;
    }
}

/**
 * Check rate limits
 * 
 * @return bool True if within limits, false otherwise
 */
function checkRateLimit() {
    if (DEBUG_MODE) {
        return true;
    }
    
    $ip = getClientIp();
    $apiKey = getApiKey();
    
    try {
        // Get API key ID if available
        $keyId = null;
        if ($apiKey) {
            $sql = "SELECT id FROM api_keys WHERE api_key = :api_key";
            $stmt = executeQuery($sql, ['api_key' => $apiKey]);
            $key = $stmt->fetch();
            if ($key) {
                $keyId = $key['id'];
            }
        }
        
        // Count requests in the last minute
        $sql = "SELECT COUNT(*) as request_count FROM api_log 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)";
        
        $params = [];
        
        if ($keyId) {
            $sql .= " AND api_key_id = :key_id";
            $params['key_id'] = $keyId;
        } else {
            $sql .= " AND ip_address = :ip";
            $params['ip'] = $ip;
        }
        
        $stmt = executeQuery($sql, $params);
        $result = $stmt->fetch();
        
        return $result['request_count'] < API_RATE_LIMIT;
    } catch (Exception $e) {
        logMessage('Rate limit check error: ' . $e->getMessage(), 'error');
        return true; // Allow request in case of error
    }
}

/**
 * Log API request
 * 
 * @param string $endpoint API endpoint
 * @param string $method HTTP method
 * @param string $apiKey API key
 * @param array $requestData Request data
 * @return int Log entry ID
 */
function logApiRequest($endpoint, $method, $apiKey, $requestData) {
    try {
        // Get API key ID if available
        $keyId = null;
        if ($apiKey) {
            $sql = "SELECT id FROM api_keys WHERE api_key = :api_key";
            $stmt = executeQuery($sql, ['api_key' => $apiKey]);
            $key = $stmt->fetch();
            if ($key) {
                $keyId = $key['id'];
            }
        }
        
        // Insert log entry
        $sql = "INSERT INTO api_log (api_key_id, endpoint, method, ip_address, request_data, response_code, execution_time, created_at)
                VALUES (:api_key_id, :endpoint, :method, :ip_address, :request_data, 0, 0, NOW())";
        
        $params = [
            'api_key_id' => $keyId,
            'endpoint' => $endpoint,
            'method' => $method,
            'ip_address' => getClientIp(),
            'request_data' => json_encode($requestData)
        ];
        
        executeQuery($sql, $params);
        return getDbConnection()->lastInsertId();
    } catch (Exception $e) {
        logMessage('API log error: ' . $e->getMessage(), 'error');
        return 0;
    }
}

/**
 * Update API log with response information
 * 
 * @param int $logId Log entry ID
 * @param int $statusCode HTTP status code
 * @param float $executionTime Execution time in seconds
 * @return void
 */
function updateApiLog($logId, $statusCode, $executionTime) {
    if (!$logId) {
        return;
    }
    
    try {
        $sql = "UPDATE api_log SET response_code = :status_code, execution_time = :execution_time 
                WHERE id = :id";
        
        $params = [
            'id' => $logId,
            'status_code' => $statusCode,
            'execution_time' => $executionTime
        ];
        
        executeQuery($sql, $params);
    } catch (Exception $e) {
        logMessage('API log update error: ' . $e->getMessage(), 'error');
    }
}

/**
 * Send JSON response
 * 
 * @param mixed $data Response data
 * @param int $statusCode HTTP status code
 * @return void
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    
    // Add metadata to the response
    $response = [
        'status' => $statusCode < 400 ? 'success' : 'error',
        'code' => $statusCode,
        'data' => $data
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}