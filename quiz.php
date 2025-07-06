<?php
session_start();

// Set page variables
$pageTitle = "Interactive Quizzes";
$pageStyles = ["css/quiz.css"];
$currentPage = "quiz";

// Include database connection
require_once 'api/db_connect1.php';

// Include header
include 'api/header.php';

// Check if quiz ID is specified in the URL
$quizId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$quizType = isset($_GET['type']) ? $_GET['type'] : 'all';

// Get available quiz types for the filter
try {
    $db = getDbConnection();
    $stmt = $db->query("SELECT DISTINCT quiz_type FROM quizzes WHERE status = 'published'");
    $quizTypes = $stmt->fetchAll(PDO::FETCH_COLUMN);
} catch (PDOException $e) {
    $quizTypes = ['movies', 'anime', 'series', 'manga', 'games'];
}

// Function to get quizzes by type
function getQuizzesByType($db, $type) {
    try {
        if ($type === 'all') {
            $stmt = $db->query("
                SELECT id, title, description, quiz_type, difficulty 
                FROM quizzes 
                WHERE status = 'published'
                ORDER BY created_at DESC
                LIMIT 20
            ");
        } else {
            $stmt = $db->prepare("
                SELECT id, title, description, quiz_type, difficulty 
                FROM quizzes 
                WHERE quiz_type = ? AND status = 'published'
                ORDER BY created_at DESC
                LIMIT 20
            ");
            $stmt->execute([$type]);
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error fetching quizzes: " . $e->getMessage());
        return [];
    }
}

// Get quizzes if no specific quiz is selected
$quizzes = [];
if (!$quizId) {
    try {
        $db = getDbConnection();
        $quizzes = getQuizzesByType($db, $quizType);
    } catch (PDOException $e) {
        error_log("Error connecting to database: " . $e->getMessage());
    }
}
?>

<main id="main" class="container quiz-page">
    <div class="page-header">
        <h1><?php echo $quizId ? 'Taking Quiz' : 'Interactive Quizzes'; ?></h1>
        <p class="page-description">
            Test your knowledge with our interactive quizzes on various entertainment topics.
        </p>
    </div>

    <?php if (!$quizId): ?>
        <!-- Quiz filter section -->
        <div class="quiz-filters">
            <div class="filter-group">
                <label>Filter by type:</label>
                <div class="filter-options">
                    <a href="?type=all" class="filter-option <?php echo $quizType === 'all' ? 'active' : ''; ?>">All</a>
                    <?php foreach ($quizTypes as $type): ?>
                        <a href="?type=<?php echo urlencode($type); ?>" 
                           class="filter-option <?php echo $quizType === $type ? 'active' : ''; ?>">
                            <?php echo ucfirst(htmlspecialchars($type)); ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- Quiz listing -->
        <div class="quiz-grid">
            <?php if (empty($quizzes)): ?>
                <div class="no-quizzes">
                    <i class="fas fa-question-circle"></i>
                    <p>No quizzes available for this category. Check back soon!</p>
                </div>
            <?php else: ?>
                <?php foreach ($quizzes as $quiz): ?>
                    <div class="quiz-card">
                        <div class="quiz-card-header">
                            <span class="quiz-type"><?php echo ucfirst(htmlspecialchars($quiz['quiz_type'])); ?></span>
                            <span class="quiz-difficulty <?php echo strtolower($quiz['difficulty']); ?>">
                                <?php echo ucfirst(htmlspecialchars($quiz['difficulty'])); ?>
                            </span>
                        </div>
                        <div class="quiz-card-content">
                            <h3 class="quiz-title"><?php echo htmlspecialchars($quiz['title']); ?></h3>
                            <p class="quiz-description"><?php echo htmlspecialchars($quiz['description']); ?></p>
                        </div>
                        <div class="quiz-card-footer">
                            <button class="btn quiz-trigger" data-quiz-id="<?php echo $quiz['id']; ?>">Take Quiz</button>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <!-- Display sample quizzes even if none in database -->
        <?php if (empty($quizzes)): ?>
            <div class="sample-quizzes">
                <h2>Popular Quizzes</h2>
                <div class="quiz-grid">
                    <!-- Sample quiz 1 -->
                    <div class="quiz-card">
                        <div class="quiz-card-header">
                            <span class="quiz-type">Movies</span>
                            <span class="quiz-difficulty medium">Medium</span>
                        </div>
                        <div class="quiz-card-content">
                            <h3 class="quiz-title">Movie Trivia Challenge</h3>
                            <p class="quiz-description">Test your knowledge of classic and modern films with this movie trivia challenge.</p>
                        </div>
                        <div class="quiz-card-footer">
                            <button class="btn quiz-trigger" data-quiz-id="sample1">Take Quiz</button>
                        </div>
                    </div>
                    
                    <!-- Sample quiz 2 -->
                    <div class="quiz-card">
                        <div class="quiz-card-header">
                            <span class="quiz-type">Anime</span>
                            <span class="quiz-difficulty easy">Easy</span>
                        </div>
                        <div class="quiz-card-content">
                            <h3 class="quiz-title">Anime Characters Quiz</h3>
                            <p class="quiz-description">How well do you know your favorite anime characters? Take this quiz to find out!</p>
                        </div>
                        <div class="quiz-card-footer">
                            <button class="btn quiz-trigger" data-quiz-id="sample2">Take Quiz</button>
                        </div>
                    </div>
                    
                    <!-- Sample quiz 3 -->
                    <div class="quiz-card">
                        <div class="quiz-card-header">
                            <span class="quiz-type">Games</span>
                            <span class="quiz-difficulty hard">Hard</span>
                        </div>
                        <div class="quiz-card-content">
                            <h3 class="quiz-title">Ultimate Gaming Quiz</h3>
                            <p class="quiz-description">Only true gamers will ace this challenging quiz about video game history and lore.</p>
                        </div>
                        <div class="quiz-card-footer">
                            <button class="btn quiz-trigger" data-quiz-id="sample3">Take Quiz</button>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>

    <?php else: ?>
        <!-- Single quiz view - Will be populated by JavaScript -->
        <div class="quiz-container" data-quiz-id="<?php echo $quizId; ?>">
            <div class="quiz-loading">
                <div class="spinner"></div>
                <p>Loading quiz...</p>
            </div>
        </div>
    <?php endif; ?>
</main>

<script src="js/quiz.js"></script>

<!-- Add local quiz data for sample quizzes -->
<script>
// Sample quiz data for the front-end when backend is not available
const sampleQuizzes = {
    "sample1": {
        "id": "sample1",
        "title": "Movie Trivia Challenge",
        "description": "Test your knowledge of classic and modern films with this movie trivia challenge.",
        "quizType": "movies",
        "difficulty": "medium",
        "questions": [
            {
                "text": "Which film won the Oscar for Best Picture in 2020?",
                "options": ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"],
                "correct": "2" // Parasite
            },
            {
                "text": "Who directed the movie 'Inception'?",
                "options": ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Quentin Tarantino"],
                "correct": "1" // Christopher Nolan
            },
            {
                "text": "Which actor played Iron Man in the Marvel Cinematic Universe?",
                "options": ["Chris Evans", "Chris Hemsworth", "Mark Ruffalo", "Robert Downey Jr."],
                "correct": "3" // Robert Downey Jr.
            },
            {
                "text": "What year was the first Star Wars movie released?",
                "options": ["1975", "1977", "1980", "1983"],
                "correct": "1" // 1977
            },
            {
                "text": "Who played the Joker in 'The Dark Knight'?",
                "options": ["Joaquin Phoenix", "Jack Nicholson", "Heath Ledger", "Jared Leto"],
                "correct": "2" // Heath Ledger
            }
        ]
    },
    "sample2": {
        "id": "sample2",
        "title": "Anime Characters Quiz",
        "description": "How well do you know your favorite anime characters? Take this quiz to find out!",
        "quizType": "anime",
        "difficulty": "easy",
        "questions": [
            {
                "text": "Which anime character has the catchphrase 'Believe it!'?",
                "options": ["Goku", "Luffy", "Naruto", "Ichigo"],
                "correct": "2" // Naruto
            },
            {
                "text": "In 'Attack on Titan', what is Eren Yeager able to transform into?",
                "options": ["A Titan", "A Dragon", "A Wolf", "A Bird"],
                "correct": "0" // A Titan
            },
            {
                "text": "Which character is known as the 'Pirate Hunter' in 'One Piece'?",
                "options": ["Luffy", "Zoro", "Sanji", "Nami"],
                "correct": "1" // Zoro
            },
            {
                "text": "In 'Death Note', what is the name of the Shinigami who drops the Death Note?",
                "options": ["Rem", "Light", "L", "Ryuk"],
                "correct": "3" // Ryuk
            }
        ]
    },
    "sample3": {
        "id": "sample3",
        "title": "Ultimate Gaming Quiz",
        "description": "Only true gamers will ace this challenging quiz about video game history and lore.",
        "quizType": "games",
        "difficulty": "hard",
        "questions": [
            {
                "text": "Which company developed the game 'The Legend of Zelda'?",
                "options": ["Sony", "Microsoft", "Nintendo", "Sega"],
                "correct": "2" // Nintendo
            },
            {
                "text": "What year was the first PlayStation console released?",
                "options": ["1991", "1994", "1997", "2000"],
                "correct": "1" // 1994
            },
            {
                "text": "In the game 'Minecraft', what material are the strongest tools made from?",
                "options": ["Gold", "Diamond", "Iron", "Netherite"],
                "correct": "3" // Netherite
            },
            {
                "text": "Which game features a protagonist named Gordon Freeman?",
                "options": ["Half-Life", "Doom", "Quake", "Duke Nukem"],
                "correct": "0" // Half-Life
            },
            {
                "text": "What is the name of the final boss in 'Dark Souls'?",
                "options": ["Ornstein", "Seath the Scaleless", "Gwyn, Lord of Cinder", "The Nameless King"],
                "correct": "2" // Gwyn, Lord of Cinder
            }
        ]
    }
};

// Function to get local quiz data for samples
function getLocalQuizData(id, type = null) {
    return sampleQuizzes[id] || null;
}
</script>

<?php include 'api/footer.php'; ?>