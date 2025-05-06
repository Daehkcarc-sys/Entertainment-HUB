<?php
/**
 * Movies API Handler
 * 
 * Processes API requests for movie resources.
 */

/**
 * Main handler function for movie requests
 * 
 * @param string $method HTTP method
 * @param string|null $movieId Movie ID or null for collection
 * @param string|null $subResource Sub-resource name (e.g., 'ratings', 'comments')
 * @param array $requestData Request body data
 * @param array $queryParams Query parameters
 * @return array Response data
 * @throws Exception if method not allowed or resource not found
 */
function handleMoviesRequest($method, $movieId, $subResource, $requestData, $queryParams) {
    // Handle collection requests (no specific movie)
    if ($movieId === null) {
        switch ($method) {
            case 'GET':
                return getMovies($queryParams);
            case 'POST':
                // Check if user has admin permissions
                checkAdminPermission();
                return createMovie($requestData);
            default:
                throw new Exception('Method not allowed for movies collection', 405);
        }
    }
    
    // Handle specific movie requests
    if ($subResource === null) {
        switch ($method) {
            case 'GET':
                return getMovie($movieId);
            case 'PUT':
                // Check if user has admin permissions
                checkAdminPermission();
                return updateMovie($movieId, $requestData);
            case 'DELETE':
                // Check if user has admin permissions
                checkAdminPermission();
                return deleteMovie($movieId);
            default:
                throw new Exception('Method not allowed for movie resource', 405);
        }
    }
    
    // Handle sub-resources
    switch ($subResource) {
        case 'ratings':
            require_once __DIR__ . '/ratings_handler.php';
            return handleMovieRatings($method, $movieId, $requestData, $queryParams);
        
        case 'comments':
            require_once __DIR__ . '/comments_handler.php';
            return handleMovieComments($method, $movieId, $requestData, $queryParams);
        
        case 'similar':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed for similar movies', 405);
            }
            return getSimilarMovies($movieId, $queryParams);
        
        default:
            throw new Exception('Sub-resource not found', 404);
    }
}

/**
 * Get a list of movies with optional filtering and pagination
 * 
 * @param array $params Query parameters for filtering and pagination
 * @return array Movies list and metadata
 */
function getMovies($params) {
    // Set default parameters
    $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
    $perPage = isset($params['per_page']) ? min(50, max(1, intval($params['per_page']))) : 20;
    $offset = ($page - 1) * $perPage;
    
    // Build base query
    $sql = "SELECT SQL_CALC_FOUND_ROWS m.* FROM movies m";
    $countSql = "SELECT FOUND_ROWS() as total";
    $whereConditions = [];
    $queryParams = [];
    
    // Apply filters if provided
    
    // Filter by title
    if (isset($params['title']) && !empty($params['title'])) {
        $whereConditions[] = "m.title LIKE :title";
        $queryParams['title'] = '%' . $params['title'] . '%';
    }
    
    // Filter by year
    if (isset($params['year']) && !empty($params['year'])) {
        $whereConditions[] = "YEAR(m.release_date) = :year";
        $queryParams['year'] = $params['year'];
    }
    
    // Filter by director
    if (isset($params['director']) && !empty($params['director'])) {
        $whereConditions[] = "m.director LIKE :director";
        $queryParams['director'] = '%' . $params['director'] . '%';
    }
    
    // Filter by genre
    if (isset($params['genre']) && !empty($params['genre'])) {
        $sql .= " JOIN content_genres cg ON m.id = cg.content_id AND cg.content_type = 'movie'
                  JOIN genres g ON cg.genre_id = g.id";
        $whereConditions[] = "g.name = :genre";
        $queryParams['genre'] = $params['genre'];
    }
    
    // Add where clause if conditions exist
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    // Add ordering
    $sortField = isset($params['sort']) ? $params['sort'] : 'release_date';
    $sortDirection = isset($params['order']) && strtoupper($params['order']) === 'ASC' ? 'ASC' : 'DESC';
    
    // Validate sort field to prevent SQL injection
    $allowedSortFields = ['title', 'release_date', 'created_at'];
    if (!in_array($sortField, $allowedSortFields)) {
        $sortField = 'release_date';
    }
    
    $sql .= " ORDER BY m.$sortField $sortDirection";
    
    // Add pagination
    $sql .= " LIMIT :offset, :limit";
    $queryParams['offset'] = $offset;
    $queryParams['limit'] = $perPage;
    
    try {
        // Execute query
        $stmt = executeQuery($sql, $queryParams);
        $movies = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countStmt = executeQuery($countSql);
        $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
        $totalMovies = $countResult['total'];
        
        // Calculate pagination metadata
        $totalPages = ceil($totalMovies / $perPage);
        
        // Process results to add URLs and format data
        foreach ($movies as &$movie) {
            formatMovieData($movie);
        }
        
        return [
            'movies' => $movies,
            'pagination' => [
                'total' => (int) $totalMovies,
                'per_page' => $perPage,
                'current_page' => $page,
                'total_pages' => $totalPages,
                'has_next_page' => $page < $totalPages,
                'has_prev_page' => $page > 1
            ]
        ];
    } catch (Exception $e) {
        logMessage('Error fetching movies: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to retrieve movies', 500);
    }
}

/**
 * Get a specific movie by ID
 * 
 * @param int|string $movieId Movie ID or slug
 * @return array Movie data
 * @throws Exception if movie not found
 */
function getMovie($movieId) {
    try {
        // Determine if ID or slug was provided
        $field = is_numeric($movieId) ? 'id' : 'slug';
        
        // Get movie data
        $sql = "SELECT m.* FROM movies m WHERE m.$field = :id";
        $stmt = executeQuery($sql, ['id' => $movieId]);
        $movie = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$movie) {
            throw new Exception('Movie not found', 404);
        }
        
        // Get genres
        $genreSql = "SELECT g.id, g.name FROM genres g
                     JOIN content_genres cg ON g.id = cg.genre_id
                     WHERE cg.content_type = 'movie' AND cg.content_id = :movie_id";
        $genreStmt = executeQuery($genreSql, ['movie_id' => $movie['id']]);
        $genres = $genreStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get cast and crew
        $castSql = "SELECT p.id, p.name, cp.character_name, cp.role
                    FROM people p
                    JOIN content_people cp ON p.id = cp.person_id
                    WHERE cp.content_type = 'movie' AND cp.content_id = :movie_id
                    ORDER BY cp.role, cp.order";
        $castStmt = executeQuery($castSql, ['movie_id' => $movie['id']]);
        $castAndCrew = $castStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group cast and crew by role
        $cast = [];
        $crew = [];
        foreach ($castAndCrew as $person) {
            if ($person['role'] === 'actor') {
                $cast[] = [
                    'id' => $person['id'],
                    'name' => $person['name'],
                    'character' => $person['character_name']
                ];
            } else {
                if (!isset($crew[$person['role']])) {
                    $crew[$person['role']] = [];
                }
                $crew[$person['role']][] = [
                    'id' => $person['id'],
                    'name' => $person['name']
                ];
            }
        }
        
        // Get average rating
        $ratingSql = "SELECT AVG(rating) as average_rating, COUNT(*) as rating_count
                      FROM ratings
                      WHERE content_type = 'movie' AND content_id = :movie_id";
        $ratingStmt = executeQuery($ratingSql, ['movie_id' => $movie['id']]);
        $ratingData = $ratingStmt->fetch(PDO::FETCH_ASSOC);
        
        // Format main movie data
        formatMovieData($movie);
        
        // Add additional data
        $movie['genres'] = $genres;
        $movie['cast'] = $cast;
        $movie['crew'] = $crew;
        $movie['rating'] = [
            'average' => $ratingData['average_rating'] ? round(floatval($ratingData['average_rating']), 1) : null,
            'count' => (int) $ratingData['rating_count']
        ];
        
        return $movie;
    } catch (Exception $e) {
        if ($e->getCode() === 404) {
            throw $e;
        }
        logMessage('Error fetching movie: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to retrieve movie', 500);
    }
}

/**
 * Create a new movie
 * 
 * @param array $data Movie data
 * @return array Created movie data
 * @throws Exception if validation fails or creation fails
 */
function createMovie($data) {
    // Validate required fields
    $requiredFields = ['title', 'release_date'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Missing required field: $field", 400);
        }
    }
    
    try {
        // Begin transaction
        getDbConnection()->beginTransaction();
        
        // Generate slug from title
        $data['slug'] = createSlug($data['title']);
        
        // Check for slug duplicates
        $checkSql = "SELECT COUNT(*) as count FROM movies WHERE slug = :slug";
        $checkStmt = executeQuery($checkSql, ['slug' => $data['slug']]);
        $checkResult = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($checkResult['count'] > 0) {
            // Append a unique identifier to slug
            $data['slug'] = $data['slug'] . '-' . uniqid();
        }
        
        // Prepare insert data
        $insertData = [
            'title' => $data['title'],
            'original_title' => $data['original_title'] ?? null,
            'release_date' => $data['release_date'],
            'director' => $data['director'] ?? null,
            'duration' => isset($data['duration']) ? (int) $data['duration'] : null,
            'synopsis' => $data['synopsis'] ?? null,
            'poster' => $data['poster'] ?? null,
            'backdrop' => $data['backdrop'] ?? null,
            'trailer_url' => $data['trailer_url'] ?? null,
            'imdb_id' => $data['imdb_id'] ?? null,
            'tmdb_id' => isset($data['tmdb_id']) ? (int) $data['tmdb_id'] : null,
            'slug' => $data['slug'],
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Insert movie
        $sql = "INSERT INTO movies (title, original_title, release_date, director, duration, synopsis, 
                poster, backdrop, trailer_url, imdb_id, tmdb_id, slug, created_at, updated_at)
                VALUES (:title, :original_title, :release_date, :director, :duration, :synopsis, 
                :poster, :backdrop, :trailer_url, :imdb_id, :tmdb_id, :slug, :created_at, :updated_at)";
        
        executeQuery($sql, $insertData);
        $movieId = getDbConnection()->lastInsertId();
        
        // Handle genres if provided
        if (isset($data['genres']) && is_array($data['genres'])) {
            foreach ($data['genres'] as $genreId) {
                $genreSql = "INSERT INTO content_genres (content_type, content_id, genre_id) 
                            VALUES ('movie', :movie_id, :genre_id)";
                executeQuery($genreSql, [
                    'movie_id' => $movieId,
                    'genre_id' => $genreId
                ]);
            }
        }
        
        // Commit transaction
        getDbConnection()->commit();
        
        // Return the created movie
        return getMovie($movieId);
    } catch (Exception $e) {
        // Rollback transaction
        getDbConnection()->rollBack();
        
        logMessage('Error creating movie: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to create movie', 500);
    }
}

/**
 * Update an existing movie
 * 
 * @param int|string $movieId Movie ID or slug
 * @param array $data Updated movie data
 * @return array Updated movie data
 * @throws Exception if movie not found or update fails
 */
function updateMovie($movieId, $data) {
    try {
        // Determine if ID or slug was provided
        $field = is_numeric($movieId) ? 'id' : 'slug';
        
        // Check if movie exists
        $checkSql = "SELECT id FROM movies WHERE $field = :id";
        $checkStmt = executeQuery($checkSql, ['id' => $movieId]);
        $movie = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$movie) {
            throw new Exception('Movie not found', 404);
        }
        
        // Actual movie ID
        $movieId = $movie['id'];
        
        // Begin transaction
        getDbConnection()->beginTransaction();
        
        // Prepare update data
        $updateFields = [];
        $updateData = ['id' => $movieId];
        
        // Only update provided fields
        $allowedFields = [
            'title', 'original_title', 'release_date', 'director', 'duration', 
            'synopsis', 'poster', 'backdrop', 'trailer_url', 'imdb_id', 'tmdb_id'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $updateData[$field] = $data[$field];
            }
        }
        
        // Update slug if title is changed
        if (isset($data['title'])) {
            $slug = createSlug($data['title']);
            
            // Check for slug duplicates (excluding current movie)
            $checkSlugSql = "SELECT COUNT(*) as count FROM movies WHERE slug = :slug AND id != :id";
            $checkSlugStmt = executeQuery($checkSlugSql, ['slug' => $slug, 'id' => $movieId]);
            $checkResult = $checkSlugStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($checkResult['count'] > 0) {
                // Append a unique identifier to slug
                $slug = $slug . '-' . uniqid();
            }
            
            $updateFields[] = "slug = :slug";
            $updateData['slug'] = $slug;
        }
        
        // Add updated_at timestamp
        $updateFields[] = "updated_at = :updated_at";
        $updateData['updated_at'] = date('Y-m-d H:i:s');
        
        // If there are fields to update
        if (!empty($updateFields)) {
            $sql = "UPDATE movies SET " . implode(", ", $updateFields) . " WHERE id = :id";
            executeQuery($sql, $updateData);
        }
        
        // Update genres if provided
        if (isset($data['genres']) && is_array($data['genres'])) {
            // Delete existing genres
            $deleteGenresSql = "DELETE FROM content_genres WHERE content_type = 'movie' AND content_id = :movie_id";
            executeQuery($deleteGenresSql, ['movie_id' => $movieId]);
            
            // Insert new genres
            foreach ($data['genres'] as $genreId) {
                $genreSql = "INSERT INTO content_genres (content_type, content_id, genre_id) 
                           VALUES ('movie', :movie_id, :genre_id)";
                executeQuery($genreSql, [
                    'movie_id' => $movieId,
                    'genre_id' => $genreId
                ]);
            }
        }
        
        // Commit transaction
        getDbConnection()->commit();
        
        // Return the updated movie
        return getMovie($movieId);
    } catch (Exception $e) {
        // Rollback transaction
        getDbConnection()->rollBack();
        
        if ($e->getCode() === 404) {
            throw $e;
        }
        
        logMessage('Error updating movie: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to update movie', 500);
    }
}

/**
 * Delete a movie
 * 
 * @param int|string $movieId Movie ID or slug
 * @return array Success message
 * @throws Exception if movie not found or deletion fails
 */
function deleteMovie($movieId) {
    try {
        // Determine if ID or slug was provided
        $field = is_numeric($movieId) ? 'id' : 'slug';
        
        // Check if movie exists
        $checkSql = "SELECT id FROM movies WHERE $field = :id";
        $checkStmt = executeQuery($checkSql, ['id' => $movieId]);
        $movie = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$movie) {
            throw new Exception('Movie not found', 404);
        }
        
        // Actual movie ID
        $movieId = $movie['id'];
        
        // Begin transaction
        getDbConnection()->beginTransaction();
        
        // Delete related data first
        
        // Delete genres
        $deleteGenresSql = "DELETE FROM content_genres WHERE content_type = 'movie' AND content_id = :movie_id";
        executeQuery($deleteGenresSql, ['movie_id' => $movieId]);
        
        // Delete cast and crew
        $deleteCastSql = "DELETE FROM content_people WHERE content_type = 'movie' AND content_id = :movie_id";
        executeQuery($deleteCastSql, ['movie_id' => $movieId]);
        
        // Delete ratings
        $deleteRatingsSql = "DELETE FROM ratings WHERE content_type = 'movie' AND content_id = :movie_id";
        executeQuery($deleteRatingsSql, ['movie_id' => $movieId]);
        
        // Delete comments
        $deleteCommentsSql = "DELETE FROM comments WHERE content_type = 'movie' AND content_id = :movie_id";
        executeQuery($deleteCommentsSql, ['movie_id' => $movieId]);
        
        // Delete watchlist entries
        $deleteWatchlistSql = "DELETE FROM watchlist WHERE content_type = 'movie' AND content_id = :movie_id";
        executeQuery($deleteWatchlistSql, ['movie_id' => $movieId]);
        
        // Delete tags
        $deleteTagsSql = "DELETE FROM content_tags WHERE content_type = 'movie' AND content_id = :movie_id";
        executeQuery($deleteTagsSql, ['movie_id' => $movieId]);
        
        // Finally, delete the movie
        $deleteSql = "DELETE FROM movies WHERE id = :movie_id";
        executeQuery($deleteSql, ['movie_id' => $movieId]);
        
        // Commit transaction
        getDbConnection()->commit();
        
        return ['message' => 'Movie deleted successfully'];
    } catch (Exception $e) {
        // Rollback transaction
        getDbConnection()->rollBack();
        
        if ($e->getCode() === 404) {
            throw $e;
        }
        
        logMessage('Error deleting movie: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to delete movie', 500);
    }
}

/**
 * Get similar movies based on genres and other factors
 * 
 * @param int|string $movieId Movie ID or slug
 * @param array $params Query parameters
 * @return array Similar movies
 * @throws Exception if movie not found or query fails
 */
function getSimilarMovies($movieId, $params) {
    try {
        // Determine if ID or slug was provided
        $field = is_numeric($movieId) ? 'id' : 'slug';
        
        // Get movie data
        $sql = "SELECT id, release_date FROM movies WHERE $field = :id";
        $stmt = executeQuery($sql, ['id' => $movieId]);
        $movie = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$movie) {
            throw new Exception('Movie not found', 404);
        }
        
        // Set default parameters
        $limit = isset($params['limit']) ? min(20, max(1, intval($params['limit']))) : 10;
        
        // Get genre IDs for the movie
        $genreSql = "SELECT genre_id FROM content_genres 
                     WHERE content_type = 'movie' AND content_id = :movie_id";
        $genreStmt = executeQuery($genreSql, ['movie_id' => $movie['id']]);
        $genres = $genreStmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($genres)) {
            // If no genres, just get movies from similar time period
            $year = date('Y', strtotime($movie['release_date']));
            
            $similarSql = "SELECT m.* FROM movies m 
                         WHERE m.id != :movie_id 
                         AND YEAR(m.release_date) BETWEEN :year_min AND :year_max 
                         ORDER BY RAND() LIMIT :limit";
            
            $similarParams = [
                'movie_id' => $movie['id'],
                'year_min' => $year - 2,
                'year_max' => $year + 2,
                'limit' => $limit
            ];
        } else {
            // Get movies with overlapping genres
            $placeholders = implode(',', array_fill(0, count($genres), '?'));
            
            $similarSql = "SELECT m.*, COUNT(cg.genre_id) as matching_genres
                         FROM movies m
                         JOIN content_genres cg ON m.id = cg.content_id AND cg.content_type = 'movie'
                         WHERE m.id != ?
                         AND cg.genre_id IN ($placeholders)
                         GROUP BY m.id
                         ORDER BY matching_genres DESC, ABS(YEAR(m.release_date) - YEAR(?)) ASC
                         LIMIT ?";
            
            $similarParams = array_merge(
                [$movie['id']],
                $genres,
                [$movie['release_date']],
                [$limit]
            );
        }
        
        // Execute query with array parameters
        $similarStmt = getDbConnection()->prepare($similarSql);
        $similarStmt->execute($similarParams);
        $similarMovies = $similarStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process results to add URLs and format data
        foreach ($similarMovies as &$similarMovie) {
            formatMovieData($similarMovie);
            // Remove unnecessary fields
            unset($similarMovie['matching_genres']);
        }
        
        return ['movies' => $similarMovies];
    } catch (Exception $e) {
        if ($e->getCode() === 404) {
            throw $e;
        }
        
        logMessage('Error fetching similar movies: ' . $e->getMessage(), 'error');
        throw new Exception('Failed to retrieve similar movies', 500);
    }
}

/**
 * Format movie data for API response
 * 
 * @param array &$movie Movie data by reference
 * @return void
 */
function formatMovieData(&$movie) {
    // Format dates
    if (isset($movie['release_date'])) {
        $movie['release_date'] = date('Y-m-d', strtotime($movie['release_date']));
        $movie['year'] = date('Y', strtotime($movie['release_date']));
    }
    
    // Format timestamp fields
    foreach (['created_at', 'updated_at'] as $field) {
        if (isset($movie[$field])) {
            $movie[$field] = date('c', strtotime($movie[$field]));
        }
    }
    
    // Add URL paths
    if (isset($movie['poster']) && $movie['poster']) {
        $movie['poster_url'] = UPLOADS_URL . '/images/movies/posters/' . $movie['poster'];
    } else {
        $movie['poster_url'] = null;
    }
    
    if (isset($movie['backdrop']) && $movie['backdrop']) {
        $movie['backdrop_url'] = UPLOADS_URL . '/images/movies/backdrops/' . $movie['backdrop'];
    } else {
        $movie['backdrop_url'] = null;
    }
    
    // Add API URL
    $movie['api_url'] = API_BASE_URL . '/movies/' . $movie['id'];
    
    // Add frontend URL
    $movie['url'] = SITE_URL . '/movies/' . $movie['slug'];
}

/**
 * Check if the current user has admin permissions
 * 
 * @throws Exception if user doesn't have admin permissions
 */
function checkAdminPermission() {
    // In a real application, this would check the user's role
    // Here we just check if the API call is in debug mode
    
    global $apiKey;
    if (!(DEBUG_MODE && $apiKey === 'debug_key')) {
        throw new Exception('You do not have permission to perform this action', 403);
    }
}