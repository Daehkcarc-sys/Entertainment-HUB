<?php
// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Generate CSRF token if not exists
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Set default language if not set
if (!isset($_SESSION['language'])) {
    $_SESSION['language'] = 'en';
}

// Check if user is logged in
$isLoggedIn = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
?>
</main>

    <footer class="site-footer">
        <div class="container footer-content">
            <div class="footer-section about">
                <h2 class="footer-heading">About Entertainment Hub</h2>
                <p>Your ultimate platform for discovering, tracking, and discussing entertainment content across movies, TV shows, anime, manga, and games.</p>
                <div class="social-links">
                    <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                    <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                    <a href="#" aria-label="Discord"><i class="fab fa-discord"></i></a>
                </div>
            </div>
            
            <div class="footer-section links">
                <h2 class="footer-heading">Quick Links</h2>
                <ul>
                    <li><a href="index.php">Home</a></li>
                    <li><a href="about.php">About</a></li>
                    <li><a href="privacy.php">Privacy Policy</a></li>
                    <li><a href="terms.php">Terms of Service</a></li>
                    <li><a href="faq.php">FAQ</a></li>
                    <li><a href="contact.php">Contact Us</a></li>
                </ul>
            </div>
            
            <div class="footer-section download">
                <h2 class="footer-heading">Get Our App</h2>
                <p>Track your entertainment on the go:</p>
                <div class="app-links">
                    <a href="#"><img src="/images/appstore.jpg" alt="Download on App Store"></a>
                    <a href="#"><img src="/images/Googleplay.jpg" alt="Get it on Google Play"></a>
                </div>
            </div>
            
            <div class="footer-section newsletter">
                <h2 class="footer-heading">Stay Updated</h2>
                <p>Subscribe to our newsletter for the latest updates:</p>
                <form class="newsletter-form" action="subscribe.php" method="post">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    <input type="email" name="email" placeholder="Your Email Address" aria-label="Your Email Address" required>
                    <button type="submit" class="btn btn-primary">Subscribe</button>
                </form>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="container">
                <p>&copy; <?php echo date('Y'); ?> Entertainment Hub. All Rights Reserved.</p>
                <div class="language-selector">
                    <form action="change_language.php" method="post" id="language-form">
                        <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                        <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($_SERVER['REQUEST_URI']); ?>">
                        <select name="language" aria-label="Change language" onchange="this.form.submit()">
                            <option value="en" <?php echo ($_SESSION['language'] === 'en') ? 'selected' : ''; ?>>English</option>
                            <option value="fr" <?php echo ($_SESSION['language'] === 'fr') ? 'selected' : ''; ?>>Français</option>
                            <option value="es" <?php echo ($_SESSION['language'] === 'es') ? 'selected' : ''; ?>>Español</option>
                            <option value="de" <?php echo ($_SESSION['language'] === 'de') ? 'selected' : ''; ?>>Deutsch</option>
                            <option value="ja" <?php echo ($_SESSION['language'] === 'ja') ? 'selected' : ''; ?>>日本語</option>
                        </select>
                    </form>
                </div>
            </div>
        </div>
    </footer>

    <!-- Back to Top Button -->
    <button id="back-to-top-btn" class="back-to-top" aria-label="Back to top">
        <i class="fas fa-chevron-up"></i>
    </button>
    
    <!-- Scripts -->
    <script src="/js/common.js"></script>
    <?php if (isset($pageScripts)): ?>
        <?php foreach ($pageScripts as $script): ?>
            <script src="<?php echo htmlspecialchars($script); ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <?php if ($isLoggedIn): ?>
    <script>
    // Notification handling
    document.addEventListener('DOMContentLoaded', function() {
        const markAllReadBtn = document.querySelector('[data-action="mark-all-read"]');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                fetch('api/notifications/mark-all-read.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': '<?php echo $_SESSION['csrf_token']; ?>'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.querySelectorAll('.notification-item.unread').forEach(item => {
                            item.classList.remove('unread');
                        });
                        const badge = document.querySelector('.notification-badge');
                        if (badge) badge.remove();
                    }
                });
            });
        }
        
        // Individual notification click
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const notificationId = this.dataset.id;
                fetch(`api/notifications/mark-read.php?id=${notificationId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': '<?php echo $_SESSION['csrf_token']; ?>'
                    }
                });
                this.classList.remove('unread');
            });
        });
    });
    </script>
    <?php endif; ?>
</body>
</html>
<?php
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
            $baseUrl = 'post.php?id=' . $notification['related_id'];
            break;
        case 'comment':
            $baseUrl = 'comment.php?id=' . $notification['related_id'];
            break;
        case 'user':
            $baseUrl = 'profile.php?id=' . $notification['related_id'];
            break;
        default:
            $baseUrl = 'notifications.php';
    }
    return $baseUrl . '&notification=' . $notification['id'];
}

function formatTimeAgo($timestamp) {
    $time = strtotime($timestamp);
    $now = time();
    $diff = $now - $time;
    
    if ($diff < 60) {
        return 'Just now';
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
    } else {
        return date('M j, Y', $time);
    }
}
?>
