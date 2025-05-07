<?php
// Set page variables
$pageTitle = "My Profile";
$pageStyles = ["css/profile.css"];
$currentPage = "profile";

// Path fix for file inclusions
$base_path = __DIR__;

// Include header
include 'api/header.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    // Redirect to login page with redirect parameter
    $_SESSION['auth_error'] = 'Please log in to view your profile';
    header('Location: signin.php?redirect=profile');
    exit;
}

// Get user ID from session or URL
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
$isOwnProfile = true;

// If viewing someone else's profile
if (isset($_GET['id']) && $_GET['id'] != $_SESSION['user_id']) {
    $userId = $_GET['id'];
    $isOwnProfile = false;
}

// Get user data
try {
    $db = getDbConnection();
    
    $stmt = $db->prepare('SELECT u.id, u.username, u.email, u.avatar, u.bio, u.created_at, u.role, 
                           COUNT(DISTINCT w.id) AS watchlist_count,
                           COUNT(DISTINCT r.id) AS reviews_count
                          FROM users u
                          LEFT JOIN watchlist_items w ON u.id = w.user_id
                          LEFT JOIN reviews r ON u.id = r.user_id
                          WHERE u.id = ?
                          GROUP BY u.id');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    // Get user activities
    $stmt = $db->prepare('SELECT r.id, r.item_type, r.rating, r.title, r.created_at
                          FROM reviews r
                          WHERE r.user_id = ?
                          ORDER BY r.created_at DESC
                          LIMIT 5');
    $stmt->execute([$userId]);
    $activities = $stmt->fetchAll();
    
} catch (PDOException $e) {
    $_SESSION['flash_message'] = 'Failed to load profile data. Please try again.';
    $_SESSION['flash_message_type'] = 'error';
    $user = null;
}

// Check if user exists
if (!$user) {
    $_SESSION['flash_message'] = 'User not found';
    $_SESSION['flash_message_type'] = 'error';
    header('Location: index.php');
    exit;
}

// Calculate member for duration
$memberSince = new DateTime($user['created_at']);
$now = new DateTime();
$interval = $memberSince->diff($now);
$memberDuration = '';

if ($interval->y > 0) {
    $memberDuration = $interval->y . ' year' . ($interval->y > 1 ? 's' : '');
} elseif ($interval->m > 0) {
    $memberDuration = $interval->m . ' month' . ($interval->m > 1 ? 's' : '');
} else {
    $memberDuration = $interval->d . ' day' . ($interval->d > 1 ? 's' : '');
}

// Define avatar path
$avatarPath = !empty($user['avatar']) ? 'images/' . $user['avatar'] : 'https://via.placeholder.com/300/6C63FF/FFFFFF?text=User';
if (!empty($user['avatar']) && !file_exists('images/' . $user['avatar'])) {
    $avatarPath = 'https://via.placeholder.com/300/6C63FF/FFFFFF?text=' . substr($user['username'], 0, 1);
}
?>

<main id="main" class="profile-page container">
    <div class="profile-header">
        <div class="profile-cover">
            <div class="cover-overlay"></div>
        </div>
        
        <div class="profile-info">
            <div class="profile-avatar">
                <img src="<?php echo htmlspecialchars($avatarPath); ?>" 
                    alt="<?php echo htmlspecialchars($user['username']); ?>'s avatar">
                <?php if ($isOwnProfile): ?>
                <button class="change-avatar-btn" title="Change avatar">
                    <i class="fas fa-camera"></i>
                </button>
                <?php endif; ?>
            </div>
            
            <div class="profile-details">
                <h1 class="profile-username"><?php echo htmlspecialchars($user['username']); ?> 
                    <?php if ($user['role'] === 'admin'): ?>
                    <span class="admin-badge" title="Administrator"><i class="fas fa-shield-alt"></i></span>
                    <?php elseif ($user['role'] === 'moderator'): ?>
                    <span class="mod-badge" title="Moderator"><i class="fas fa-gavel"></i></span>
                    <?php endif; ?>
                </h1>
                
                <div class="profile-stats">
                    <div class="stat">
                        <span class="stat-value"><?php echo $user['watchlist_count']; ?></span>
                        <span class="stat-label">Watchlist Items</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value"><?php echo $user['reviews_count']; ?></span>
                        <span class="stat-label">Reviews</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value"><?php echo $memberDuration; ?></span>
                        <span class="stat-label">Member For</span>
                    </div>
                </div>
                
                <?php if ($isOwnProfile): ?>
                <div class="profile-actions">
                    <a href="settings.php" class="btn btn-outline"><i class="fas fa-cog"></i> Edit Profile</a>
                </div>
                <?php else: ?>
                <div class="profile-actions">
                    <button class="btn btn-primary follow-btn"><i class="fas fa-user-plus"></i> Follow</button>
                    <button class="btn btn-outline message-btn"><i class="fas fa-envelope"></i> Message</button>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="profile-content">
        <div class="profile-sidebar">
            <div class="profile-card">
                <h3>About</h3>
                <div class="profile-bio">
                    <?php if (!empty($user['bio'])): ?>
                        <p><?php echo nl2br(htmlspecialchars($user['bio'])); ?></p>
                    <?php else: ?>
                        <p class="text-muted"><?php echo $isOwnProfile ? 'Add a bio to tell others about yourself...' : 'No bio available'; ?></p>
                    <?php endif; ?>
                    
                    <?php if ($isOwnProfile && empty($user['bio'])): ?>
                        <a href="settings.php" class="btn btn-sm btn-outline">Add Bio</a>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="profile-card">
                <h3>Interests</h3>
                <div class="tag-cloud">
                    <span class="tag">Anime</span>
                    <span class="tag">Sci-Fi</span>
                    <span class="tag">Action</span>
                    <span class="tag">Comedy</span>
                    <span class="tag">RPG Games</span>
                    <?php if ($isOwnProfile): ?>
                    <a href="settings.php" class="edit-tags"><i class="fas fa-pencil-alt"></i></a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <div class="profile-main">
            <div class="profile-tabs">
                <button class="tab-btn active" data-tab="activity">Activity</button>
                <button class="tab-btn" data-tab="watchlist">Watchlist</button>
                <button class="tab-btn" data-tab="reviews">Reviews</button>
                <button class="tab-btn" data-tab="favorites">Favorites</button>
            </div>
            
            <div class="tab-content">
                <div id="activity" class="tab-pane active">
                    <h3>Recent Activity</h3>
                    
                    <?php if (empty($activities)): ?>
                        <p class="no-data">No recent activity to display.</p>
                    <?php else: ?>
                        <div class="activity-timeline">
                            <?php foreach ($activities as $activity): ?>
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="fas fa-<?php echo $activity['item_type'] === 'review' ? 'pen-fancy' : 'star'; ?>"></i>
                                    </div>
                                    <div class="activity-content">
                                        <p>
                                            <?php echo htmlspecialchars($user['username']); ?> reviewed 
                                            <strong><?php echo htmlspecialchars($activity['title']); ?></strong>
                                            <?php if (isset($activity['rating'])): ?>
                                                and rated it <span class="rating"><?php echo $activity['rating']; ?>/10</span>
                                            <?php endif; ?>
                                        </p>
                                        <span class="activity-time"><?php echo date('F j, Y', strtotime($activity['created_at'])); ?></span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
                
                <div id="watchlist" class="tab-pane">
                    <h3>Watchlist</h3>
                    <p class="no-data">Watchlist items will be displayed here.</p>
                </div>
                
                <div id="reviews" class="tab-pane">
                    <h3>Reviews</h3>
                    <p class="no-data">Reviews will be displayed here.</p>
                </div>
                
                <div id="favorites" class="tab-pane">
                    <h3>Favorites</h3>
                    <p class="no-data">Favorite content will be displayed here.</p>
                </div>
            </div>
        </div>
    </div>
</main>

<div class="modal" id="avatar-modal">
    <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h2>Change Profile Avatar</h2>
        
        <form id="avatar-form" method="post" action="api/update_avatar.php" enctype="multipart/form-data">
            <div class="avatar-preview">
                <img id="avatar-preview-img" src="<?php echo htmlspecialchars($avatarPath); ?>" alt="Avatar preview">
            </div>
            
            <div class="form-group">
                <label for="avatar-upload" class="btn btn-outline btn-full">
                    <i class="fas fa-upload"></i> Select Image
                </label>
                <input type="file" id="avatar-upload" name="avatar" accept="image/*" style="display: none;">
            </div>
            
            <button type="submit" class="btn btn-primary btn-full">
                <i class="fas fa-save"></i> Save Avatar
            </button>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            const tabId = this.dataset.tab;
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Avatar change functionality
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    const avatarModal = document.getElementById('avatar-modal');
    const modalClose = document.querySelector('.modal-close');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview-img');
    
    // Only setup if elements exist (for own profile)
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            avatarModal.style.display = 'block';
        });
        
        modalClose.addEventListener('click', function() {
            avatarModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === avatarModal) {
                avatarModal.style.display = 'none';
            }
        });
        
        // Preview avatar before upload
        avatarUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.src = e.target.result;
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Show dropdown menu when user menu is clicked
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            userDropdown.style.display = isExpanded ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuToggle.contains(e.target) && !userDropdown.contains(e.target)) {
                userMenuToggle.setAttribute('aria-expanded', 'false');
                userDropdown.style.display = 'none';
            }
        });
    }
});
</script>

<?php include 'api/footer.php'; ?>