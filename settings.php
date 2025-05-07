<?php
// Set page variables
$pageTitle = "Account Settings";
$pageStyles = ["css/settings.css"];
$currentPage = "settings";

// Include header
include 'api/header.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    // Redirect to login page with redirect parameter
    $_SESSION['auth_error'] = 'Please log in to access your account settings';
    header('Location: signin.php?redirect=settings');
    exit;
}

// Get user data
try {
    $db = getDbConnection();
    
    $stmt = $db->prepare('SELECT id, username, email, avatar, bio, role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    
    // Get user preferences
    $stmt = $db->prepare('SELECT theme, notification_preferences, privacy_settings 
                          FROM user_settings 
                          WHERE user_id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $settings = $stmt->fetch();
    
    if (!$settings) {
        // Create default settings if none exist
        $settings = [
            'theme' => 'light',
            'notification_preferences' => json_encode(['email' => true, 'site' => true]),
            'privacy_settings' => json_encode(['public_profile' => true, 'show_activity' => true])
        ];
    }
    
    // Parse JSON settings
    if (is_string($settings['notification_preferences'])) {
        $notificationPrefs = json_decode($settings['notification_preferences'], true) ?: ['email' => true, 'site' => true];
    } else {
        $notificationPrefs = ['email' => true, 'site' => true];
    }
    
    if (is_string($settings['privacy_settings'])) {
        $privacySettings = json_decode($settings['privacy_settings'], true) ?: ['public_profile' => true, 'show_activity' => true];
    } else {
        $privacySettings = ['public_profile' => true, 'show_activity' => true];
    }
    
} catch (PDOException $e) {
    $_SESSION['flash_message'] = 'Failed to load user settings. Please try again.';
    $_SESSION['flash_message_type'] = 'error';
    $user = null;
    $settings = null;
    $notificationPrefs = ['email' => true, 'site' => true];
    $privacySettings = ['public_profile' => true, 'show_activity' => true];
}

// Define avatar path with fallback
$avatarPath = !empty($user['avatar']) ? 'images/' . $user['avatar'] : 'https://via.placeholder.com/150/6C63FF/FFFFFF?text=User';
if (!empty($user['avatar']) && !file_exists('images/' . $user['avatar'])) {
    $avatarPath = 'https://via.placeholder.com/150/6C63FF/FFFFFF?text=' . substr($user['username'], 0, 1);
}
?>

<main id="main" class="settings-page container">
    <h1 class="page-title">Account Settings</h1>

    <div class="settings-layout">
        <!-- Settings navigation -->
        <div class="settings-nav">
            <ul>
                <li class="active"><a href="#profile" data-section="profile">Profile Information</a></li>
                <li><a href="#account" data-section="account">Account Settings</a></li>
                <li><a href="#notifications" data-section="notifications">Notifications</a></li>
                <li><a href="#privacy" data-section="privacy">Privacy</a></li>
                <li><a href="#appearance" data-section="appearance">Appearance</a></li>
                <?php if ($user['role'] === 'admin'): ?>
                <li class="admin-section"><a href="admin.php">Admin Panel</a></li>
                <?php endif; ?>
                <li class="danger-section"><a href="#danger" data-section="danger">Delete Account</a></li>
            </ul>
        </div>

        <!-- Settings content -->
        <div class="settings-content">
            <!-- Profile section -->
            <section id="profile" class="settings-section active">
                <h2>Profile Information</h2>
                <p class="section-desc">Update your personal information and how others see you on the platform</p>
                
                <form action="api/update_profile.php" method="post" class="settings-form">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    
                    <div class="avatar-section">
                        <div class="current-avatar">
                            <img src="<?php echo htmlspecialchars($avatarPath); ?>" alt="Profile avatar">
                        </div>
                        <div class="avatar-actions">
                            <a href="profile.php" class="btn btn-sm btn-outline">Change Avatar</a>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($user['username']); ?>" required>
                        <p class="form-hint">This is how your name appears across the site</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($user['email']); ?>" required>
                        <p class="form-hint">Used for login and notifications</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="bio">Bio</label>
                        <textarea id="bio" name="bio" rows="4"><?php echo htmlspecialchars($user['bio'] ?? ''); ?></textarea>
                        <p class="form-hint">Tell us a bit about yourself (max 250 characters)</p>
                    </div>
                    
                    <div class="form-group">
                        <label>Interests</label>
                        <div class="tags-input">
                            <input type="text" id="interest-input" placeholder="Add an interest...">
                            <button type="button" class="btn btn-sm" id="add-interest">Add</button>
                        </div>
                        <div class="tags-container">
                            <span class="tag">Anime <i class="fas fa-times remove-tag"></i></span>
                            <span class="tag">Sci-Fi <i class="fas fa-times remove-tag"></i></span>
                            <span class="tag">Action <i class="fas fa-times remove-tag"></i></span>
                            <span class="tag">Comedy <i class="fas fa-times remove-tag"></i></span>
                            <span class="tag">RPG Games <i class="fas fa-times remove-tag"></i></span>
                        </div>
                        <input type="hidden" name="interests" id="interests-value" value="Anime,Sci-Fi,Action,Comedy,RPG Games">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </section>

            <!-- Account section -->
            <section id="account" class="settings-section">
                <h2>Account Settings</h2>
                <p class="section-desc">Manage your account security and preferences</p>
                
                <form action="api/update_password.php" method="post" class="settings-form">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    
                    <h3>Change Password</h3>
                    
                    <div class="form-group">
                        <label for="current-password">Current Password</label>
                        <input type="password" id="current-password" name="current_password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="new-password">New Password</label>
                        <input type="password" id="new-password" name="new_password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm-password">Confirm New Password</label>
                        <input type="password" id="confirm-password" name="confirm_password" required>
                        <p class="form-hint">Password must be at least 8 characters with uppercase, lowercase, number and special character</p>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Update Password</button>
                    </div>
                </form>
                
                <hr class="settings-divider">
                
                <h3>Linked Accounts</h3>
                <p class="section-desc">Connect your accounts for easy login</p>
                
                <div class="linked-accounts">
                    <div class="linked-account">
                        <div class="account-info">
                            <i class="fab fa-google"></i>
                            <span>Google</span>
                        </div>
                        <button class="btn btn-sm btn-outline">Connect</button>
                    </div>
                    
                    <div class="linked-account">
                        <div class="account-info">
                            <i class="fab fa-facebook"></i>
                            <span>Facebook</span>
                        </div>
                        <button class="btn btn-sm btn-outline">Connect</button>
                    </div>
                </div>
            </section>

            <!-- Notifications section -->
            <section id="notifications" class="settings-section">
                <h2>Notification Preferences</h2>
                <p class="section-desc">Manage how and when you want to be notified</p>
                
                <form action="api/update_notifications.php" method="post" class="settings-form">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    
                    <h3>Email Notifications</h3>
                    <div class="settings-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="email_new_messages" <?php echo isset($notificationPrefs['email_new_messages']) && $notificationPrefs['email_new_messages'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            New messages
                        </label>
                        
                        <label class="toggle-switch">
                            <input type="checkbox" name="email_new_followers" <?php echo isset($notificationPrefs['email_new_followers']) && $notificationPrefs['email_new_followers'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            New followers
                        </label>
                        
                        <label class="toggle-switch">
                            <input type="checkbox" name="email_comments" <?php echo isset($notificationPrefs['email_comments']) && $notificationPrefs['email_comments'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            Comments on your content
                        </label>
                    </div>
                    
                    <h3>Site Notifications</h3>
                    <div class="settings-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="site_new_messages" <?php echo isset($notificationPrefs['site_new_messages']) && $notificationPrefs['site_new_messages'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            New messages
                        </label>
                        
                        <label class="toggle-switch">
                            <input type="checkbox" name="site_new_followers" <?php echo isset($notificationPrefs['site_new_followers']) && $notificationPrefs['site_new_followers'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            New followers
                        </label>
                        
                        <label class="toggle-switch">
                            <input type="checkbox" name="site_comments" <?php echo isset($notificationPrefs['site_comments']) && $notificationPrefs['site_comments'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            Comments on your content
                        </label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Preferences</button>
                    </div>
                </form>
            </section>

            <!-- Privacy section -->
            <section id="privacy" class="settings-section">
                <h2>Privacy Settings</h2>
                <p class="section-desc">Control your privacy and what others can see about you</p>
                
                <form action="api/update_privacy.php" method="post" class="settings-form">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    
                    <div class="settings-group">
                        <label class="toggle-switch">
                            <input type="checkbox" name="public_profile" <?php echo isset($privacySettings['public_profile']) && $privacySettings['public_profile'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            Public Profile
                        </label>
                        <p class="setting-desc">Allow others to view your profile</p>
                        
                        <label class="toggle-switch">
                            <input type="checkbox" name="show_activity" <?php echo isset($privacySettings['show_activity']) && $privacySettings['show_activity'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            Activity Visibility
                        </label>
                        <p class="setting-desc">Show your activity on your profile</p>
                        
                        <label class="toggle-switch">
                            <input type="checkbox" name="show_watchlist" <?php echo isset($privacySettings['show_watchlist']) && $privacySettings['show_watchlist'] ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                            Watchlist Visibility
                        </label>
                        <p class="setting-desc">Allow others to see your watchlist</p>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Privacy Settings</button>
                    </div>
                </form>
            </section>

            <!-- Appearance section -->
            <section id="appearance" class="settings-section">
                <h2>Appearance</h2>
                <p class="section-desc">Customize how Entertainment Hub looks for you</p>
                
                <div class="theme-selector">
                    <h3>Choose Theme</h3>
                    <div class="theme-options">
                        <label class="theme-option">
                            <input type="radio" name="theme" value="light" <?php echo ($theme === 'light') ? 'checked' : ''; ?>>
                            <span class="theme-preview light-theme">
                                <i class="fas fa-sun"></i>
                                <span>Light</span>
                            </span>
                        </label>
                        
                        <label class="theme-option">
                            <input type="radio" name="theme" value="dark" <?php echo ($theme === 'dark') ? 'checked' : ''; ?>>
                            <span class="theme-preview dark-theme">
                                <i class="fas fa-moon"></i>
                                <span>Dark</span>
                            </span>
                        </label>
                        
                        <label class="theme-option">
                            <input type="radio" name="theme" value="system" <?php echo ($theme === 'system') ? 'checked' : ''; ?>>
                            <span class="theme-preview system-theme">
                                <i class="fas fa-desktop"></i>
                                <span>System</span>
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            <!-- Danger Zone section -->
            <section id="danger" class="settings-section danger-zone">
                <h2>Danger Zone</h2>
                <p class="section-desc">Permanent actions that cannot be undone</p>
                
                <div class="danger-action">
                    <div class="danger-info">
                        <h3>Delete Account</h3>
                        <p>This will permanently delete your account and all your data</p>
                    </div>
                    <button type="button" class="btn btn-danger" id="delete-account-btn">Delete Account</button>
                </div>
            </section>
        </div>
    </div>
    
    <!-- Delete Account Confirmation Modal -->
    <div class="modal" id="delete-account-modal">
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h2>Confirm Account Deletion</h2>
            <p>This action <strong>cannot</strong> be undone. All your data, including:</p>
            <ul>
                <li>Profile information</li>
                <li>Watchlist items</li>
                <li>Reviews and ratings</li>
                <li>Comments and discussion posts</li>
            </ul>
            <p>Will be permanently deleted.</p>
            
            <form action="api/delete_account.php" method="post">
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                
                <div class="form-group">
                    <label for="delete-password">Enter your password to confirm</label>
                    <input type="password" id="delete-password" name="password" required>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-container">
                        <input type="checkbox" name="confirm_delete" required>
                        <span class="checkmark"></span>
                        I understand that this action is permanent
                    </label>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-outline" id="cancel-delete">Cancel</button>
                    <button type="submit" class="btn btn-danger">Delete My Account</button>
                </div>
            </form>
        </div>
    </div>
</main>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Settings navigation
    const navLinks = document.querySelectorAll('.settings-nav a');
    const settingsSections = document.querySelectorAll('.settings-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get section ID
            const sectionId = this.dataset.section;
            if (!sectionId) return; // Skip if it's the admin panel link
            
            // Update active nav link
            navLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
            
            // Show corresponding section
            settingsSections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
            
            // Update URL without reload
            history.pushState(null, null, `settings.php#${sectionId}`);
        });
    });
    
    // Interests tags functionality
    const addInterestBtn = document.getElementById('add-interest');
    const interestInput = document.getElementById('interest-input');
    const tagsContainer = document.querySelector('.tags-container');
    const interestsValueInput = document.getElementById('interests-value');
    
    if (addInterestBtn && interestInput && tagsContainer) {
        // Add new interest tag
        addInterestBtn.addEventListener('click', function() {
            const interestValue = interestInput.value.trim();
            if (interestValue) {
                addInterestTag(interestValue);
                interestInput.value = '';
            }
        });
        
        // Add interest tag when pressing Enter
        interestInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addInterestBtn.click();
            }
        });
        
        // Remove tag functionality
        tagsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-tag')) {
                const tag = e.target.closest('.tag');
                tag.remove();
                updateInterestsValue();
            }
        });
        
        // Function to add interest tag
        function addInterestTag(value) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `${value} <i class="fas fa-times remove-tag"></i>`;
            tagsContainer.appendChild(tag);
            updateInterestsValue();
        }
        
        // Update hidden input with all interests
        function updateInterestsValue() {
            const tags = tagsContainer.querySelectorAll('.tag');
            const interests = Array.from(tags).map(tag => tag.textContent.trim());
            interestsValueInput.value = interests.join(',');
        }
    }
    
    // Theme selector functionality
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const theme = this.value;
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);
            
            // Save theme preference
            fetch('api/update_theme.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `theme=${theme}&csrf_token=${encodeURIComponent(document.querySelector('input[name="csrf_token"]').value)}`
            });
        });
    });
    
    // Delete account modal
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const modalClose = document.querySelector('#delete-account-modal .modal-close');
    
    if (deleteAccountBtn && deleteAccountModal) {
        // Show modal
        deleteAccountBtn.addEventListener('click', function() {
            deleteAccountModal.style.display = 'block';
        });
        
        // Hide modal with cancel button
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', function() {
                deleteAccountModal.style.display = 'none';
            });
        }
        
        // Hide modal with close button
        if (modalClose) {
            modalClose.addEventListener('click', function() {
                deleteAccountModal.style.display = 'none';
            });
        }
        
        // Hide modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === deleteAccountModal) {
                deleteAccountModal.style.display = 'none';
            }
        });
    }
    
    // Check for URL hash to show specific section
    function checkUrlHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const section = document.getElementById(hash);
            const navLink = document.querySelector(`.settings-nav a[data-section="${hash}"]`);
            
            if (section && navLink) {
                // Update active nav link
                navLinks.forEach(link => {
                    link.parentElement.classList.remove('active');
                });
                navLink.parentElement.classList.add('active');
                
                // Show corresponding section
                settingsSections.forEach(s => {
                    s.classList.remove('active');
                });
                section.classList.add('active');
            }
        }
    }
    
    // Check hash on page load
    checkUrlHash();
    
    // Check hash on hash change
    window.addEventListener('hashchange', checkUrlHash);
});
</script>

<?php include 'api/footer.php'; ?>