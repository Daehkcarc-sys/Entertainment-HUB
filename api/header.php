<?php
// Start session management
session_start();

// Security headers
header("X-XSS-Protection: 1; mode=block");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://via.placeholder.com;");

// Check for persistent login via remember token
if (!isset($_SESSION['user_id']) && isset($_COOKIE['remember_token'])) {
    try {
        require_once 'db_config.php';
        $db = getDbConnection();
        
        // Verify token and get user
        $stmt = $db->prepare("
            SELECT u.id, u.username, u.email, u.role, u.avatar, u.last_login 
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > NOW()
        ");
        $stmt->execute([$_COOKIE['remember_token']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['avatar'] = $user['avatar'];
            $_SESSION['role'] = $user['role'];
            
            // Update last activity timestamp
            $stmt = $db->prepare("UPDATE users SET last_activity = NOW() WHERE id = ?");
            $stmt->execute([$user['id']]);
        }
    } catch (PDOException $e) {
        // Failed to restore session from cookie
    }
}

// Database connection
if (file_exists('includes/db_connect.php')) {
    require_once 'includes/db_connect.php';
} else if (file_exists('api/db_config.php')) {
    require_once 'api/db_config.php';
}

// CSRF protection
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// User authentication check
$isLoggedIn = isset($_SESSION['user_id']);
$currentUser = null;

if ($isLoggedIn) {
    // Get user data from session
    $currentUser = [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'email' => $_SESSION['email'],
        'role' => $_SESSION['role'] ?? 'user',
        'avatar' => $_SESSION['avatar'] ?? 'Avatar.jpg',
    ];
    
    try {
        // Update last activity timestamp if we have database connection
        if (isset($pdo)) {
            $stmt = $pdo->prepare("UPDATE users SET last_activity = NOW() WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
        } else if (function_exists('getDbConnection')) {
            $db = getDbConnection();
            $stmt = $db->prepare("UPDATE users SET last_activity = NOW() WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
        }
    } catch (PDOException $e) {
        // Failed to update last activity
    }
}

// Theme preference
$theme = isset($_COOKIE['theme']) ? htmlspecialchars($_COOKIE['theme']) : 'light';

// Function to check if user has permission
function hasPermission($permission) {
    global $currentUser;
    if (!$currentUser) return false;
    
    if ($currentUser['role'] === 'admin') return true;
    
    try {
        // Check specific permissions from user_permissions table
        if (isset($GLOBALS['pdo'])) {
            $pdo = $GLOBALS['pdo'];
            $stmt = $pdo->prepare("SELECT 1 FROM user_permissions WHERE user_id = ? AND permission = ?");
            $stmt->execute([$currentUser['id'], $permission]);
            return $stmt->fetchColumn() !== false;
        } else if (function_exists('getDbConnection')) {
            $db = getDbConnection();
            $stmt = $db->prepare("SELECT 1 FROM user_permissions WHERE user_id = ? AND permission = ?");
            $stmt->execute([$currentUser['id'], $permission]);
            return $stmt->fetchColumn() !== false;
        }
    } catch (PDOException $e) {
        return false;
    }
    
    return false;
}

// Get notifications for logged-in users
$notifications = [];
if ($isLoggedIn) {
    try {
        if (isset($pdo)) {
            $stmt = $pdo->prepare("
                SELECT n.id, n.type, n.content, n.created_at, n.is_read, n.related_id, n.related_type 
                FROM notifications n 
                WHERE n.user_id = ? 
                ORDER BY n.created_at DESC 
                LIMIT 5
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else if (function_exists('getDbConnection')) {
            $db = getDbConnection();
            $stmt = $db->prepare("
                SELECT n.id, n.type, n.content, n.created_at, n.is_read, n.related_id, n.related_type 
                FROM notifications n 
                WHERE n.user_id = ? 
                ORDER BY n.created_at DESC 
                LIMIT 5
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (PDOException $e) {
        // Failed to get notifications
    }
}

// Helper functions for notifications
function getNotificationIcon($type) {
    switch ($type) {
        case 'comment': return 'comment';
        case 'like': return 'heart';
        case 'follow': return 'user-plus';
        case 'mention': return 'at';
        case 'system': return 'bell';
        default: return 'bell';
    }
}

function getNotificationUrl($notification) {
    $baseUrl = '';
    switch ($notification['related_type']) {
        case 'post':
            return $baseUrl . 'post.php?id=' . $notification['related_id'];
        case 'comment':
            return $baseUrl . 'comment.php?id=' . $notification['related_id'];
        case 'user':
            return $baseUrl . 'profile.php?id=' . $notification['related_id'];
        default:
            return $baseUrl . 'notifications.php';
    }
}

function formatTimeAgo($datetime) {
    $time = strtotime($datetime);
    $diff = time() - $time;
    
    if ($diff < 60) {
        return 'Just now';
    } elseif ($diff < 3600) {
        $mins = round($diff / 60);
        return $mins . ' minute' . ($mins > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 86400) {
        $hours = round($diff / 3600);
        return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 604800) {
        $days = round($diff / 86400);
        return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 2592000) {
        $weeks = round($diff / 604800);
        return $weeks . ' week' . ($weeks > 1 ? 's' : '') . ' ago';
    } else {
        return date('M j, Y', $time);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? htmlspecialchars($pageTitle) . ' | ' : ''; ?>Entertainment Hub</title>
    
    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/common.css">
    <link rel="stylesheet" href="css/dark-theme.css">
    <?php if (isset($pageStyles)): ?>
        <?php foreach ($pageStyles as $style): ?>
            <link rel="stylesheet" href="<?php echo htmlspecialchars(str_replace('/css/', 'css/', $style)); ?>">
        <?php endforeach; ?>
    <?php endif; ?>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Scripts -->
    <script src="js/common.js"></script>
    <script src="js/components/user-menu.js"></script>
    <?php if (isset($pageScripts)): ?>
        <?php foreach ($pageScripts as $script): ?>
            <script src="<?php echo htmlspecialchars(str_replace('/js/', 'js/', $script)); ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <!-- Meta tags -->
    <?php if (isset($pageDescription)): ?>
        <meta name="description" content="<?php echo htmlspecialchars($pageDescription); ?>">
    <?php endif; ?>
    <?php if (isset($pageKeywords)): ?>
        <meta name="keywords" content="<?php echo htmlspecialchars($pageKeywords); ?>">
    <?php endif; ?>
    <meta name="author" content="Entertainment Hub">
    
    <!-- Theme Color for Mobile Browsers -->
    <meta name="theme-color" content="#6C63FF">
    
    <!-- Favicon -->
    <link rel="icon" href="images/favicon.ico" type="image/x-icon">
    
    <!-- Set data-theme attribute based on user preference -->
    <script>
        document.documentElement.setAttribute('data-theme', '<?php echo $theme; ?>');
        
        // Direct user menu toggle implementation
        document.addEventListener('DOMContentLoaded', function() {
            // Find the user menu toggle button and dropdown
            const userMenuToggle = document.querySelector('.user-menu-toggle');
            const userDropdown = document.querySelector('.user-dropdown');
            
            if (userMenuToggle && userDropdown) {
                // Add click event to toggle dropdown
                userMenuToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Toggle visibility
                    if (userDropdown.style.display === 'block') {
                        userDropdown.style.display = 'none';
                    } else {
                        userDropdown.style.display = 'block';
                    }
                });
                
                // Close when clicking elsewhere
                document.addEventListener('click', function(e) {
                    if (userDropdown.style.display === 'block' && !e.target.closest('.user-menu')) {
                        userDropdown.style.display = 'none';
                    }
                });
            }
        });
    </script>
</head>

<body data-theme="<?php echo $theme; ?>">
    <a class="skip-link" href="#main">Skip to content</a>
    
    <header class="site-header">
        <div class="container header-container">
            <div class="logo">
                <h1><i class="fas fa-film"></i> Entertainment Hub</h1>
            </div>
            <nav class="main-nav">
                <button class="mobile-menu-toggle" aria-label="Toggle menu">
                    <span class="hamburger-icon"></span>
                </button>
                <ul class="nav-list">
                    <li><a href="index.php" <?php echo ($currentPage === 'home') ? 'class="active"' : ''; ?>>Home</a></li>
                    <li><a href="movies.php" <?php echo ($currentPage === 'movies') ? 'class="active"' : ''; ?>>Movies</a></li>
                    <li><a href="anime.php" <?php echo ($currentPage === 'anime') ? 'class="active"' : ''; ?>>Anime</a></li>
                    <li><a href="manga.php" <?php echo ($currentPage === 'manga') ? 'class="active"' : ''; ?>>Manga</a></li>
                    <li><a href="series.php" <?php echo ($currentPage === 'series') ? 'class="active"' : ''; ?>>Series</a></li>
                    <li><a href="games.php" <?php echo ($currentPage === 'games') ? 'class="active"' : ''; ?>>Games</a></li>
                    <li><a href="leaderboard.php" <?php echo ($currentPage === 'leaderboard') ? 'class="active"' : ''; ?>>Leaderboard</a></li>
                    <li class="dropdown">
                        <a href="community.php" <?php echo ($currentPage === 'community') ? 'class="active"' : ''; ?>>Community <i class="fas fa-caret-down"></i></a>
                        <ul class="dropdown-menu">
                            <li><a href="discussions.php" <?php echo ($currentPage === 'discussions') ? 'class="active"' : ''; ?>>Discussions</a></li>
                            <li><a href="reviews.php" <?php echo ($currentPage === 'reviews') ? 'class="active"' : ''; ?>>Reviews</a></li>
                            <li><a href="polls.php" <?php echo ($currentPage === 'polls') ? 'class="active"' : ''; ?>>Polls</a></li>
                            <li><a href="events.php" <?php echo ($currentPage === 'events') ? 'class="active"' : ''; ?>>Events</a></li>
                        </ul>
                    </li>
                    <?php if ($isLoggedIn): ?>
                        <li><a href="watchlist.php" <?php echo ($currentPage === 'watchlist') ? 'class="active"' : ''; ?>>Watchlist</a></li>
                    <?php endif; ?>
                </ul>
            </nav>
            
            <div class="header-controls">
                <button id="theme-toggle" aria-label="Toggle dark mode">
                    <i class="fas fa-<?php echo $theme === 'dark' ? 'sun' : 'moon'; ?>"></i>
                </button>
                
                <?php if ($isLoggedIn): ?>
                <div class="notification-center">
                    <button class="notification-toggle" aria-expanded="false" aria-label="Notifications">
                        <i class="fas fa-bell"></i>
                        <?php 
                        $unreadCount = 0;
                        foreach ($notifications as $notification) {
                            if (!$notification['is_read']) $unreadCount++;
                        }
                        if ($unreadCount > 0): 
                        ?>
                        <span class="notification-badge"><?php echo $unreadCount; ?></span>
                        <?php endif; ?>
                    </button>
                    <div class="notification-dropdown">
                        <div class="notification-header">
                            <h3>Notifications</h3>
                            <button class="mark-all-read" data-action="mark-all-read">Mark all as read</button>
                        </div>
                        <div class="notification-list">
                            <?php if (empty($notifications)): ?>
                                <div class="notification-empty">No notifications yet</div>
                            <?php else: ?>
                                <?php foreach ($notifications as $notification): ?>
                                    <a href="<?php echo str_replace('/', '', getNotificationUrl($notification)); ?>" class="notification-item <?php echo $notification['is_read'] ? '' : 'unread'; ?>" data-id="<?php echo $notification['id']; ?>">
                                        <div class="notification-icon"><i class="fas fa-<?php echo getNotificationIcon($notification['type']); ?>"></i></div>
                                        <div class="notification-content">
                                            <p><?php echo htmlspecialchars($notification['content']); ?></p>
                                            <span class="notification-time"><?php echo formatTimeAgo($notification['created_at']); ?></span>
                                        </div>
                                    </a>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                        <div class="notification-footer">
                            <a href="notifications.php">View all notifications</a>
                        </div>
                    </div>
                </div>
                <div class="user-menu">
                    <button class="user-menu-toggle" aria-expanded="false" aria-label="User menu">
                        <?php if (!empty($currentUser['avatar'])): ?>
                            <img src="<?php echo file_exists('images/' . $currentUser['avatar']) ? 'images/' . htmlspecialchars($currentUser['avatar']) : 'https://via.placeholder.com/40/6C63FF/FFFFFF?text=U'; ?>" alt="Profile" class="user-avatar-small">
                        <?php else: ?>
                            <i class="fas fa-user"></i>
                        <?php endif; ?>
                    </button>
                    <div class="user-dropdown">
                        <div class="user-info">
                            <div class="user-avatar">
                                <?php if (!empty($currentUser['avatar'])): ?>
                                    <img src="<?php echo file_exists('images/' . $currentUser['avatar']) ? 'images/' . htmlspecialchars($currentUser['avatar']) : 'https://via.placeholder.com/80/6C63FF/FFFFFF?text=User'; ?>" alt="<?php echo htmlspecialchars($currentUser['username']); ?>">
                                <?php else: ?>
                                    <i class="fas fa-user-circle"></i>
                                <?php endif; ?>
                            </div>
                            <div class="user-details">
                                <h4><?php echo htmlspecialchars($currentUser['username']); ?></h4>
                                <p class="user-role"><?php echo ucfirst(htmlspecialchars($currentUser['role'])); ?></p>
                            </div>
                        </div>
                        <a href="profile.php" class="dropdown-item">
                            <i class="fas fa-user-circle"></i> My Profile
                        </a>
                        <a href="dashboard.php" class="dropdown-item">
                            <i class="fas fa-tachometer-alt"></i> Dashboard
                        </a>
                        <a href="settings.php" class="dropdown-item">
                            <i class="fas fa-cog"></i> Settings
                        </a>
                        <?php if ($currentUser['role'] === 'admin'): ?>
                            <a href="admin.php" class="dropdown-item admin-link">
                                <i class="fas fa-user-shield"></i> Admin Panel
                            </a>
                        <?php endif; ?>
                        <form action="logout.php" method="post" class="logout-form">
                            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                            <button type="submit" class="dropdown-item">
                                <i class="fas fa-sign-out-alt"></i> Log Out
                            </button>
                        </form>
                    </div>
                </div>
                <?php else: ?>
                <div class="auth-buttons">
                    <a href="signin.php" class="btn btn-outline">Sign In</a>
                    <a href="signin.php?register=true" class="btn btn-primary">Sign Up</a>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </header>

    <main id="main">
        <?php if (isset($_SESSION['flash_message'])): ?>
            <div class="flash-message <?php echo $_SESSION['flash_message_type'] ?? 'info'; ?>">
                <?php echo htmlspecialchars($_SESSION['flash_message']); ?>
                <button class="close-flash"><i class="fas fa-times"></i></button>
            </div>
            <?php unset($_SESSION['flash_message'], $_SESSION['flash_message_type']); ?>
        <?php endif; ?>
