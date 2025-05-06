<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
<section id="signup" class="auth-form">
                    <h2><i class="fas fa-user-plus"></i> Sign Up</h2>
                    <form id="signup-form" method="post" action="api/auth.php?action=register">
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
 
</body>
</html>