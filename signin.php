<?php
// Start session
session_start();

// Check if user is already logged in
if (isset($_SESSION['user_id'])) {
    // Redirect to home page if already logged in
    header('Location: index.php');
    exit;
}

$pageTitle = "Sign In";
$pageStyles = ["/css/signin.css"];
$currentPage = "signin";

// Include header
include 'api/header.php';
?>

<main class="auth-container">
    <div class="auth-card animate-on-scroll" data-animation="fade-in">
        <div class="auth-tabs">
            <button class="tab-btn active" data-tab="signin">Sign In</button>
            <button class="tab-btn" data-tab="signup">Sign Up</button>
            <button class="tab-btn" data-tab="admin">Admin Access</button>
        </div>
        
        <div class="auth-forms">
            <!-- Alerts container for messages -->
            <div id="auth-alerts" class="auth-alerts">
                <?php if (isset($_SESSION['auth_error'])): ?>
                    <div class="alert alert-error">
                        <i class="fas fa-exclamation-circle"></i> <?php echo $_SESSION['auth_error']; ?>
                    </div>
                    <?php unset($_SESSION['auth_error']); ?>
                <?php endif; ?>
                
                <?php if (isset($_SESSION['auth_success'])): ?>
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i> <?php echo $_SESSION['auth_success']; ?>
                    </div>
                    <?php unset($_SESSION['auth_success']); ?>
                <?php endif; ?>
            </div>
            
            <!-- Sign In Form -->
            <section id="signin" class="auth-form active">
                <h2><i class="fas fa-sign-in-alt"></i> Sign In</h2>
                <form id="signin-form" action="api/auth_handler.php" method="post">
                    <input type="hidden" name="action" value="login">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    
                    <div class="form-group">
                        <label for="signin-email">Email</label>
                        <div class="input-with-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="signin-email" name="email" placeholder="Enter your email" required autocomplete="email">
                        </div>
                        <div class="input-error" id="signin-email-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signin-password">Password</label>
                        <div class="input-with-icon password-input">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="signin-password" name="password" placeholder="Enter your password" required autocomplete="current-password">
                            <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="input-error" id="signin-password-error"></div>
                    </div>
                    
                    <div class="form-options">
                        <label class="checkbox-container">
                            <input type="checkbox" id="remember-me" name="remember">
                            <span class="checkmark"></span>
                            Remember me
                        </label>
                        <a href="#" class="forgot-password">Forgot password?</a>
                    </div>
                    
                    <button type="submit" class="submit-btn">
                        <span class="btn-text">Sign In</span>
                        <span class="btn-loader"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                    
                    <div class="social-signin">
                        <p>Or sign in with:</p>
                        <div class="social-buttons">
                            <button type="button" class="social-btn google">
                                <i class="fab fa-google"></i> Google
                            </button>
                            <button type="button" class="social-btn facebook">
                                <i class="fab fa-facebook-f"></i> Facebook
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            <!-- Sign Up Form -->
            <section id="signup" class="auth-form">
                <h2><i class="fas fa-user-plus"></i> Sign Up</h2>
                <form id="signup-form" action="api/auth_handler.php" method="post">
                    <input type="hidden" name="action" value="register">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    
                    <div class="form-group">
                        <label for="signup-username">Username</label>
                        <div class="input-with-icon">
                            <i class="fas fa-user"></i>
                            <input type="text" id="signup-username" name="username" placeholder="Choose a username" required>
                        </div>
                        <div class="input-error" id="signup-username-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-email">Email</label>
                        <div class="input-with-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="signup-email" name="email" placeholder="Enter your email" required>
                        </div>
                        <div class="input-error" id="signup-email-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <div class="input-with-icon password-input">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="signup-password" name="password" placeholder="Create a password" required>
                            <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div id="password-strength" class="password-strength"></div>
                        <ul class="password-requirements">
                            <li id="req-length"><i class="fas fa-times-circle"></i> At least 8 characters</li>
                            <li id="req-uppercase"><i class="fas fa-times-circle"></i> At least 1 uppercase letter</li>
                            <li id="req-lowercase"><i class="fas fa-times-circle"></i> At least 1 lowercase letter</li>
                            <li id="req-number"><i class="fas fa-times-circle"></i> At least 1 number</li>
                            <li id="req-special"><i class="fas fa-times-circle"></i> At least 1 special character</li>
                        </ul>
                        <div class="input-error" id="signup-password-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-confirm">Confirm Password</label>
                        <div class="input-with-icon password-input">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="signup-confirm" name="confirm_password" placeholder="Confirm your password" required>
                            <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="input-error" id="signup-confirm-error"></div>
                    </div>
                    
                    <div class="form-options">
                        <label class="checkbox-container">
                            <input type="checkbox" id="terms" name="terms" required>
                            <span class="checkmark"></span>
                            I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                        </label>
                        <div class="input-error" id="terms-error"></div>
                    </div>
                    
                    <button type="submit" class="submit-btn">
                        <span class="btn-text">Create Account</span>
                        <span class="btn-loader"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </form>
            </section>

            <!-- Admin Form -->
            <section id="admin" class="auth-form">
                <h2><i class="fas fa-user-shield"></i> Admin Access</h2>
                <div class="admin-notice">
                    <p><i class="fas fa-info-circle"></i> This form is for authorized personnel only. All registrations are subject to approval by the system administrator.</p>
                </div>
                <form id="admin-form" action="api/auth_handler.php" method="post">
                    <input type="hidden" name="action" value="admin_login">
                    <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                    
                    <div class="form-group">
                        <label for="admin-email">Admin Email</label>
                        <div class="input-with-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="admin-email" name="email" placeholder="Enter your admin email" required>
                        </div>
                        <div class="input-error" id="admin-email-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="admin-password">Admin Password</label>
                        <div class="input-with-icon password-input">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="admin-password" name="password" placeholder="Enter admin password" required>
                            <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="input-error" id="admin-password-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="admin-code">Authorization Code</label>
                        <div class="input-with-icon">
                            <i class="fas fa-key"></i>
                            <input type="text" id="admin-code" name="code" placeholder="Enter admin authorization code" required>
                        </div>
                        <div class="input-error" id="admin-code-error"></div>
                    </div>
                    
                    <button type="submit" class="submit-btn admin-submit">
                        <span class="btn-text">Access Admin Panel</span>
                        <span class="btn-loader"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </form>
            </section>
        </div>
    </div>
    
    <!-- Features Section -->
    <div class="auth-features">
        <div class="feature-card animate-on-scroll" data-animation="fade-in-up" data-delay="100">
            <i class="fas fa-shield-alt"></i>
            <h3>Secure Account</h3>
            <p>Your data is encrypted and protected with the latest security standards</p>
        </div>
        <div class="feature-card animate-on-scroll" data-animation="fade-in-up" data-delay="200">
            <i class="fas fa-bookmark"></i>
            <h3>Personalized Watchlist</h3>
            <p>Create custom lists of your favorite anime, movies, and games</p>
        </div>
        <div class="feature-card animate-on-scroll" data-animation="fade-in-up" data-delay="300">
            <i class="fas fa-comments"></i>
            <h3>Join Discussions</h3>
            <p>Connect with community members and share your opinions</p>
        </div>
    </div>
</main>

<?php include 'api/footer.php'; ?>