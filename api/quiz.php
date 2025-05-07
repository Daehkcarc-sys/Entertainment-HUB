<?php
/**
 * Quiz API Endpoints
 * 
 * Handles all quiz-related operations:
 * - Fetching quizzes by type (movies, series, anime, etc.)
 * - Fetching quiz questions and options
 * - Submitting quiz answers and recording scores
 * - Retrieving user quiz history
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
 * Handle GET requests for quiz data
 */
function handleGetRequest() {
    global $conn;
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'get_quizzes':
            $quizType = $_GET['type'] ?? 'all';
            getQuizzesByType($conn, $quizType);
            break;
            
        case 'get_quiz':
            $quizId = $_GET['id'] ?? 0;
            getQuizWithQuestions($conn, $quizId);
            break;
            
        case 'user_history':
            $userId = authenticate();
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            getUserQuizHistory($conn, $userId);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

/**
 * Handle POST requests for quiz submissions
 */
function handlePostRequest() {
    global $conn;
    
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'submit_answers':
            $userId = authenticate();
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            submitQuizAnswers($conn, $userId);
            break;
            
        case 'create_quiz':
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
            createQuiz($conn, $userId);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

/**
 * Get quizzes by type
 */
function getQuizzesByType($conn, $type) {
    try {
        if ($type === 'all') {
            $stmt = $conn->prepare("
                SELECT id, title, description, quiz_type, difficulty, status
                FROM quizzes 
                WHERE status = 'published'
                ORDER BY created_at DESC
            ");
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("
                SELECT id, title, description, quiz_type, difficulty, status
                FROM quizzes 
                WHERE quiz_type = ? AND status = 'published'
                ORDER BY created_at DESC
            ");
            $stmt->execute([$type]);
        }
        
        $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'quizzes' => $quizzes
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get a quiz with its questions and options
 */
function getQuizWithQuestions($conn, $quizId) {
    try {
        // Get quiz details
        $stmt = $conn->prepare("
            SELECT id, title, description, quiz_type, difficulty
            FROM quizzes 
            WHERE id = ? AND status = 'published'
        ");
        $stmt->execute([$quizId]);
        $quiz = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$quiz) {
            http_response_code(404);
            echo json_encode(['error' => 'Quiz not found']);
            return;
        }
        
        // Get quiz questions
        $stmt = $conn->prepare("
            SELECT id, question_text, question_order
            FROM quiz_questions
            WHERE quiz_id = ?
            ORDER BY question_order
        ");
        $stmt->execute([$quizId]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get options for each question
        foreach ($questions as &$question) {
            $stmt = $conn->prepare("
                SELECT id, option_text, option_order
                FROM quiz_options
                WHERE question_id = ?
                ORDER BY option_order
            ");
            $stmt->execute([$question['id']]);
            $question['options'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $quiz['questions'] = $questions;
        
        echo json_encode([
            'success' => true,
            'quiz' => $quiz
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Submit quiz answers and record score
 */
function submitQuizAnswers($conn, $userId) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['quiz_id']) || !isset($data['answers'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data']);
            return;
        }
        
        $quizId = $data['quiz_id'];
        $answers = $data['answers'];
        $timeTaken = $data['time_taken'] ?? null;
        
        // Start transaction
        $conn->beginTransaction();
        
        // Get correct answers
        $score = 0;
        $maxScore = 0;
        
        foreach ($answers as $answer) {
            $questionId = $answer['question_id'];
            $selectedOptionId = $answer['option_id'];
            
            // Check if the selected option is correct
            $stmt = $conn->prepare("
                SELECT is_correct 
                FROM quiz_options 
                WHERE id = ? AND question_id = ?
            ");
            $stmt->execute([$selectedOptionId, $questionId]);
            $isCorrect = $stmt->fetchColumn();
            
            if ($isCorrect) {
                $score++;
            }
            $maxScore++;
        }
        
        // Calculate percentage
        $percentage = ($maxScore > 0) ? ($score / $maxScore) * 100 : 0;
        
        // Record quiz attempt
        $stmt = $conn->prepare("
            INSERT INTO quiz_attempts (user_id, quiz_id, score, max_score, percentage, time_taken)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $quizId, $score, $maxScore, $percentage, $timeTaken]);
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'score' => $score,
            'max_score' => $maxScore,
            'percentage' => $percentage
        ]);
        
    } catch (PDOException $e) {
        // Rollback transaction on error
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get user quiz history
 */
function getUserQuizHistory($conn, $userId) {
    try {
        $stmt = $conn->prepare("
            SELECT qa.id, q.title, q.quiz_type, qa.score, qa.max_score, qa.percentage, qa.completed_at
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = ?
            ORDER BY qa.completed_at DESC
        ");
        $stmt->execute([$userId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'history' => $history
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Create a new quiz
 */
function createQuiz($conn, $userId) {
    try {
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['title']) || !isset($data['quiz_type']) || !isset($data['questions'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data']);
            return;
        }
        
        // Start transaction
        $conn->beginTransaction();
        
        // Insert quiz
        $stmt = $conn->prepare("
            INSERT INTO quizzes (title, description, quiz_type, difficulty, created_by)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['title'],
            $data['description'] ?? '',
            $data['quiz_type'],
            $data['difficulty'] ?? 'medium',
            $userId
        ]);
        
        $quizId = $conn->lastInsertId();
        
        // Insert questions and options
        $questionOrder = 0;
        foreach ($data['questions'] as $question) {
            $stmt = $conn->prepare("
                INSERT INTO quiz_questions (quiz_id, question_text, question_order)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([
                $quizId,
                $question['text'],
                $questionOrder++
            ]);
            
            $questionId = $conn->lastInsertId();
            
            // Insert options
            $optionOrder = 0;
            foreach ($question['options'] as $option) {
                $stmt = $conn->prepare("
                    INSERT INTO quiz_options (question_id, option_text, is_correct, option_order)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([
                    $questionId,
                    $option['text'],
                    $option['is_correct'] ?? false,
                    $optionOrder++
                ]);
            }
        }
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'quiz_id' => $quizId
        ]);
        
    } catch (PDOException $e) {
        // Rollback transaction on error
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        
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