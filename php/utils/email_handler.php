<?php
/**
 * Email Handler Class
 * 
 * Handles all email operations for the Entertainment Hub platform including:
 * - User verification emails
 * - Password reset emails
 * - Notification emails
 * - Newsletter emails
 * - Content update notifications
 */
class EmailHandler {
    // Email configuration
    private $smtpHost;
    private $smtpPort;
    private $smtpUsername;
    private $smtpPassword;
    private $fromEmail;
    private $fromName;
    private $replyToEmail;
    private $useHtml;
    
    /**
     * Constructor - initializes email configuration
     */
    public function __construct() {
        // Load configuration from config
        $this->smtpHost = SMTP_HOST;
        $this->smtpPort = SMTP_PORT;
        $this->smtpUsername = SMTP_USERNAME;
        $this->smtpPassword = SMTP_PASSWORD;
        $this->fromEmail = MAIL_FROM;
        $this->fromName = SITE_NAME;
        $this->replyToEmail = MAIL_REPLY_TO;
        $this->useHtml = true;
    }
    
    /**
     * Send a welcome email to a new user
     * 
     * @param string $email User email
     * @param string $username Username
     * @param string|null $verificationToken Verification token (if email verification is required)
     * @return bool Whether email was sent successfully
     */
    public function sendWelcomeEmail($email, $username, $verificationToken = null) {
        $subject = "Welcome to " . $this->fromName . "!";
        
        if ($this->useHtml) {
            $body = $this->getWelcomeEmailHtml($username, $verificationToken);
        } else {
            $body = $this->getWelcomeEmailText($username, $verificationToken);
        }
        
        return $this->send($email, $subject, $body);
    }
    
    /**
     * Send a password reset email
     * 
     * @param string $email User email
     * @param string $username Username
     * @param string $resetToken Reset token
     * @return bool Whether email was sent successfully
     */
    public function sendPasswordResetEmail($email, $username, $resetToken) {
        $subject = "Reset Your " . $this->fromName . " Password";
        
        if ($this->useHtml) {
            $body = $this->getPasswordResetEmailHtml($username, $resetToken);
        } else {
            $body = $this->getPasswordResetEmailText($username, $resetToken);
        }
        
        return $this->send($email, $subject, $body);
    }
    
    /**
     * Send a notification email for new content
     * 
     * @param string $email User email
     * @param string $username Username
     * @param array $content Content information
     * @return bool Whether email was sent successfully
     */
    public function sendContentUpdateEmail($email, $username, $content) {
        $subject = "New " . ucfirst($content['type']) . " Update: " . $content['title'];
        
        if ($this->useHtml) {
            $body = $this->getContentUpdateEmailHtml($username, $content);
        } else {
            $body = $this->getContentUpdateEmailText($username, $content);
        }
        
        return $this->send($email, $subject, $body);
    }
    
    /**
     * Send a notification email for new community activity
     * 
     * @param string $email User email
     * @param string $username Username
     * @param array $activity Activity information
     * @return bool Whether email was sent successfully
     */
    public function sendActivityNotificationEmail($email, $username, $activity) {
        $subject = "New Activity on " . $this->fromName;
        
        if ($this->useHtml) {
            $body = $this->getActivityNotificationEmailHtml($username, $activity);
        } else {
            $body = $this->getActivityNotificationEmailText($username, $activity);
        }
        
        return $this->send($email, $subject, $body);
    }
    
    /**
     * Send a weekly newsletter
     * 
     * @param string $email User email
     * @param string $username Username
     * @param array $content Newsletter content
     * @return bool Whether email was sent successfully
     */
    public function sendWeeklyNewsletter($email, $username, $content) {
        $subject = $this->fromName . " Weekly: " . $content['title'];
        
        if ($this->useHtml) {
            $body = $this->getWeeklyNewsletterHtml($username, $content);
        } else {
            $body = $this->getWeeklyNewsletterText($username, $content);
        }
        
        return $this->send($email, $subject, $body);
    }
    
    /**
     * Send an email verification email
     * 
     * @param string $email User email
     * @param string $username Username
     * @param string $verificationToken Verification token
     * @return bool Whether email was sent successfully
     */
    public function sendVerificationEmail($email, $username, $verificationToken) {
        $subject = "Verify Your Email Address for " . $this->fromName;
        
        if ($this->useHtml) {
            $body = $this->getVerificationEmailHtml($username, $verificationToken);
        } else {
            $body = $this->getVerificationEmailText($username, $verificationToken);
        }
        
        return $this->send($email, $subject, $body);
    }
    
    /**
     * Send a general email
     * 
     * @param string $email Recipient email
     * @param string $subject Email subject
     * @param string $body Email body
     * @param array $attachments Optional file attachments
     * @return bool Whether email was sent successfully
     */
    public function send($email, $subject, $body, $attachments = []) {
        // Use PHP's built-in mail function for simple configurations
        if (!SMTP_ENABLED) {
            $headers = "From: {$this->fromName} <{$this->fromEmail}>\r\n";
            $headers .= "Reply-To: {$this->replyToEmail}\r\n";
            
            if ($this->useHtml) {
                $headers .= "MIME-Version: 1.0\r\n";
                $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            }
            
            return @mail($email, $subject, $body, $headers);
        }
        
        // For more complex configurations, you'd typically use a library like PHPMailer
        // This is a simplified example and should be replaced with a proper implementation
        
        try {
            // In a real implementation, you would initialize PHPMailer or similar library here
            
            // Log the email attempt
            $this->logEmail($email, $subject, 'queued');
            
            // For demonstration purposes, we're just returning true
            // In a real implementation, this would send the actual email
            
            // Log successful send
            $this->logEmail($email, $subject, 'sent');
            
            return true;
        } catch (Exception $e) {
            // Log error
            $this->logEmail($email, $subject, 'failed', $e->getMessage());
            return false;
        }
    }
    
    /**
     * Log email send attempt
     * 
     * @param string $recipient Recipient email
     * @param string $subject Email subject
     * @param string $status Email status (queued, sent, failed)
     * @param string $error Error message if applicable
     * @return void
     */
    private function logEmail($recipient, $subject, $status, $error = null) {
        try {
            global $db;
            
            $sql = "INSERT INTO email_log (recipient_email, subject, status, error_message, created_at)
                    VALUES (:email, :subject, :status, :error, NOW())";
            
            executeQuery($sql, [
                'email' => $recipient,
                'subject' => $subject,
                'status' => $status,
                'error' => $error
            ]);
        } catch (Exception $e) {
            // Log to file as fallback
            error_log("Email log error: " . $e->getMessage(), 0);
        }
    }
    
    /**
     * Generate HTML welcome email
     * 
     * @param string $username Username
     * @param string|null $verificationToken Verification token
     * @return string HTML email body
     */
    private function getWelcomeEmailHtml($username, $verificationToken = null) {
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Welcome to ' . htmlspecialchars($this->fromName) . '</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #3498db; color: #ffffff; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #999999; }
                .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to ' . htmlspecialchars($this->fromName) . '!</h1>
                </div>
                <div class="content">
                    <p>Hello ' . htmlspecialchars($username) . ',</p>
                    <p>Thank you for joining our entertainment community! We\'re excited to have you with us.</p>
                    <p>Here you\'ll be able to:</p>
                    <ul>
                        <li>Discover new movies, TV series, anime, and manga</li>
                        <li>Track your watchlist and reading progress</li>
                        <li>Rate and review your favorite content</li>
                        <li>Join discussions with other fans</li>
                        <li>Get personalized recommendations</li>
                    </ul>';
        
        if ($verificationToken) {
            $verifyUrl = SITE_URL . '/verify-email?token=' . urlencode($verificationToken);
            $html .= '<p>To get started, please verify your email address by clicking the button below:</p>
                      <p style="text-align: center;">
                          <a href="' . $verifyUrl . '" class="button">Verify Email Address</a>
                      </p>
                      <p>Or copy and paste this URL into your browser:</p>
                      <p>' . $verifyUrl . '</p>';
        } else {
            $html .= '<p>To get started, just <a href="' . SITE_URL . '/login">log in to your account</a> and start exploring!</p>';
        }
        
        $html .= '
                    <p>If you have any questions or need help, feel free to contact our support team.</p>
                    <p>Happy exploring!</p>
                    <p>The ' . htmlspecialchars($this->fromName) . ' Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to you because you signed up for ' . htmlspecialchars($this->fromName) . '.</p>
                    <p>If you didn\'t create this account, please <a href="' . SITE_URL . '/contact">contact us</a>.</p>
                    <p>&copy; ' . date('Y') . ' ' . htmlspecialchars($this->fromName) . '. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Generate plain text welcome email
     * 
     * @param string $username Username
     * @param string|null $verificationToken Verification token
     * @return string Plain text email body
     */
    private function getWelcomeEmailText($username, $verificationToken = null) {
        $text = "Welcome to " . $this->fromName . "!\n\n";
        $text .= "Hello " . $username . ",\n\n";
        $text .= "Thank you for joining our entertainment community! We're excited to have you with us.\n\n";
        $text .= "Here you'll be able to:\n";
        $text .= "- Discover new movies, TV series, anime, and manga\n";
        $text .= "- Track your watchlist and reading progress\n";
        $text .= "- Rate and review your favorite content\n";
        $text .= "- Join discussions with other fans\n";
        $text .= "- Get personalized recommendations\n\n";
        
        if ($verificationToken) {
            $verifyUrl = SITE_URL . '/verify-email?token=' . urlencode($verificationToken);
            $text .= "To get started, please verify your email address by visiting this URL:\n";
            $text .= $verifyUrl . "\n\n";
        } else {
            $text .= "To get started, just log in to your account at " . SITE_URL . "/login and start exploring!\n\n";
        }
        
        $text .= "If you have any questions or need help, feel free to contact our support team.\n\n";
        $text .= "Happy exploring!\n\n";
        $text .= "The " . $this->fromName . " Team\n\n";
        $text .= "---\n";
        $text .= "This email was sent to you because you signed up for " . $this->fromName . ".\n";
        $text .= "If you didn't create this account, please contact us at " . SITE_URL . "/contact\n";
        $text .= "© " . date('Y') . " " . $this->fromName . ". All rights reserved.";
        
        return $text;
    }
    
    /**
     * Generate HTML password reset email
     * 
     * @param string $username Username
     * @param string $resetToken Reset token
     * @return string HTML email body
     */
    private function getPasswordResetEmailHtml($username, $resetToken) {
        $resetUrl = SITE_URL . '/reset-password?token=' . urlencode($resetToken);
        
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reset Your ' . htmlspecialchars($this->fromName) . ' Password</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #3498db; color: #ffffff; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #999999; }
                .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; }
                .warning { color: #e74c3c; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello ' . htmlspecialchars($username) . ',</p>
                    <p>We received a request to reset the password for your account at ' . htmlspecialchars($this->fromName) . '.</p>
                    <p>To reset your password, click the button below:</p>
                    <p style="text-align: center;">
                        <a href="' . $resetUrl . '" class="button">Reset Your Password</a>
                    </p>
                    <p>Or copy and paste this URL into your browser:</p>
                    <p>' . $resetUrl . '</p>
                    <p>This password reset link will expire in 1 hour.</p>
                    <p class="warning">If you did not request a password reset, please ignore this email or contact us if you have concerns.</p>
                    <p>Best regards,</p>
                    <p>The ' . htmlspecialchars($this->fromName) . ' Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to you in response to your password reset request.</p>
                    <p>If you continue to have problems, please <a href="' . SITE_URL . '/contact">contact us</a>.</p>
                    <p>&copy; ' . date('Y') . ' ' . htmlspecialchars($this->fromName) . '. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Generate plain text password reset email
     * 
     * @param string $username Username
     * @param string $resetToken Reset token
     * @return string Plain text email body
     */
    private function getPasswordResetEmailText($username, $resetToken) {
        $resetUrl = SITE_URL . '/reset-password?token=' . urlencode($resetToken);
        
        $text = "Password Reset Request\n\n";
        $text .= "Hello " . $username . ",\n\n";
        $text .= "We received a request to reset the password for your account at " . $this->fromName . ".\n\n";
        $text .= "To reset your password, please visit this URL:\n";
        $text .= $resetUrl . "\n\n";
        $text .= "This password reset link will expire in 1 hour.\n\n";
        $text .= "If you did not request a password reset, please ignore this email or contact us if you have concerns.\n\n";
        $text .= "Best regards,\n";
        $text .= "The " . $this->fromName . " Team\n\n";
        $text .= "---\n";
        $text .= "This email was sent to you in response to your password reset request.\n";
        $text .= "If you continue to have problems, please contact us at " . SITE_URL . "/contact\n";
        $text .= "© " . date('Y') . " " . $this->fromName . ". All rights reserved.";
        
        return $text;
    }
    
    /**
     * Generate HTML verification email
     * 
     * @param string $username Username
     * @param string $verificationToken Verification token
     * @return string HTML email body
     */
    private function getVerificationEmailHtml($username, $verificationToken) {
        $verifyUrl = SITE_URL . '/verify-email?token=' . urlencode($verificationToken);
        
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Verify Your Email for ' . htmlspecialchars($this->fromName) . '</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #3498db; color: #ffffff; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #999999; }
                .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Verify Your Email Address</h1>
                </div>
                <div class="content">
                    <p>Hello ' . htmlspecialchars($username) . ',</p>
                    <p>Thank you for registering with ' . htmlspecialchars($this->fromName) . '!</p>
                    <p>To activate your account and start exploring our platform, please verify your email address:</p>
                    <p style="text-align: center;">
                        <a href="' . $verifyUrl . '" class="button">Verify Email Address</a>
                    </p>
                    <p>Or copy and paste this URL into your browser:</p>
                    <p>' . $verifyUrl . '</p>
                    <p>This verification link will expire in 24 hours.</p>
                    <p>If you did not create an account with us, please ignore this email.</p>
                    <p>Welcome aboard!</p>
                    <p>The ' . htmlspecialchars($this->fromName) . ' Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to you because you signed up for ' . htmlspecialchars($this->fromName) . '.</p>
                    <p>If you have any questions, please <a href="' . SITE_URL . '/contact">contact us</a>.</p>
                    <p>&copy; ' . date('Y') . ' ' . htmlspecialchars($this->fromName) . '. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Generate plain text verification email
     * 
     * @param string $username Username
     * @param string $verificationToken Verification token
     * @return string Plain text email body
     */
    private function getVerificationEmailText($username, $verificationToken) {
        $verifyUrl = SITE_URL . '/verify-email?token=' . urlencode($verificationToken);
        
        $text = "Verify Your Email Address\n\n";
        $text .= "Hello " . $username . ",\n\n";
        $text .= "Thank you for registering with " . $this->fromName . "!\n\n";
        $text .= "To activate your account and start exploring our platform, please visit this URL to verify your email address:\n";
        $text .= $verifyUrl . "\n\n";
        $text .= "This verification link will expire in 24 hours.\n\n";
        $text .= "If you did not create an account with us, please ignore this email.\n\n";
        $text .= "Welcome aboard!\n\n";
        $text .= "The " . $this->fromName . " Team\n\n";
        $text .= "---\n";
        $text .= "This email was sent to you because you signed up for " . $this->fromName . ".\n";
        $text .= "If you have any questions, please contact us at " . SITE_URL . "/contact\n";
        $text .= "© " . date('Y') . " " . $this->fromName . ". All rights reserved.";
        
        return $text;
    }
    
    /**
     * Generate HTML content update email
     * 
     * @param string $username Username
     * @param array $content Content information
     * @return string HTML email body
     */
    private function getContentUpdateEmailHtml($username, $content) {
        $contentUrl = SITE_URL . '/' . $content['type'] . '/' . $content['slug'];
        $contentImage = isset($content['image']) ? $content['image'] : SITE_URL . '/images/default-' . $content['type'] . '.jpg';
        
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New ' . ucfirst(htmlspecialchars($content['type'])) . ' Update: ' . htmlspecialchars($content['title']) . '</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #3498db; color: #ffffff; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #999999; }
                .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; }
                .content-image { display: block; max-width: 100%; height: auto; margin: 0 auto 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New ' . ucfirst(htmlspecialchars($content['type'])) . ' Update</h1>
                </div>
                <div class="content">
                    <p>Hello ' . htmlspecialchars($username) . ',</p>
                    <p>Great news! There\'s an update to <strong>' . htmlspecialchars($content['title']) . '</strong> that we thought you\'d want to know about.</p>
                    <img src="' . $contentImage . '" alt="' . htmlspecialchars($content['title']) . '" class="content-image">
                    <h2>' . htmlspecialchars($content['title']) . '</h2>';
        
        if (isset($content['description'])) {
            $html .= '<p>' . nl2br(htmlspecialchars($content['description'])) . '</p>';
        }
        
        if (isset($content['release_date'])) {
            $html .= '<p><strong>Release Date:</strong> ' . htmlspecialchars($content['release_date']) . '</p>';
        }
        
        $html .= '<p style="text-align: center;">
                    <a href="' . $contentUrl . '" class="button">View Details</a>
                  </p>
                  <p>Enjoy!</p>
                  <p>The ' . htmlspecialchars($this->fromName) . ' Team</p>
                </div>
                <div class="footer">
                    <p>You\'re receiving this email because you\'re following this content or have set up alerts for this type of content.</p>
                    <p>To change your notification settings, <a href="' . SITE_URL . '/settings/notifications">click here</a>.</p>
                    <p>&copy; ' . date('Y') . ' ' . htmlspecialchars($this->fromName) . '. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Generate plain text content update email
     * 
     * @param string $username Username
     * @param array $content Content information
     * @return string Plain text email body
     */
    private function getContentUpdateEmailText($username, $content) {
        $contentUrl = SITE_URL . '/' . $content['type'] . '/' . $content['slug'];
        
        $text = "New " . ucfirst($content['type']) . " Update: " . $content['title'] . "\n\n";
        $text .= "Hello " . $username . ",\n\n";
        $text .= "Great news! There's an update to \"" . $content['title'] . "\" that we thought you'd want to know about.\n\n";
        $text .= $content['title'] . "\n\n";
        
        if (isset($content['description'])) {
            $text .= $content['description'] . "\n\n";
        }
        
        if (isset($content['release_date'])) {
            $text .= "Release Date: " . $content['release_date'] . "\n\n";
        }
        
        $text .= "View Details: " . $contentUrl . "\n\n";
        $text .= "Enjoy!\n\n";
        $text .= "The " . $this->fromName . " Team\n\n";
        $text .= "---\n";
        $text .= "You're receiving this email because you're following this content or have set up alerts for this type of content.\n";
        $text .= "To change your notification settings, go to " . SITE_URL . "/settings/notifications\n";
        $text .= "© " . date('Y') . " " . $this->fromName . ". All rights reserved.";
        
        return $text;
    }
    
    /**
     * Generate HTML activity notification email
     * 
     * @param string $username Username
     * @param array $activity Activity information
     * @return string HTML email body
     */
    private function getActivityNotificationEmailHtml($username, $activity) {
        $actionUrl = SITE_URL . $activity['url'];
        
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New Activity on ' . htmlspecialchars($this->fromName) . '</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #3498db; color: #ffffff; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #999999; }
                .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; }
                .activity { border-left: 4px solid #3498db; padding-left: 15px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Activity on ' . htmlspecialchars($this->fromName) . '</h1>
                </div>
                <div class="content">
                    <p>Hello ' . htmlspecialchars($username) . ',</p>
                    <p>There\'s new activity for you on ' . htmlspecialchars($this->fromName) . ':</p>
                    
                    <div class="activity">
                        <h3>' . htmlspecialchars($activity['title']) . '</h3>
                        <p>' . nl2br(htmlspecialchars($activity['description'])) . '</p>';
        
        if (isset($activity['from_user'])) {
            $html .= '<p>From: <strong>' . htmlspecialchars($activity['from_user']) . '</strong></p>';
        }
        
        $html .= '<p><strong>Time:</strong> ' . htmlspecialchars($activity['time']) . '</p>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="' . $actionUrl . '" class="button">View Activity</a>
                    </p>
                    
                    <p>The ' . htmlspecialchars($this->fromName) . ' Team</p>
                </div>
                <div class="footer">
                    <p>You\'re receiving this email because you have notification preferences set up for this type of activity.</p>
                    <p>To change your notification settings, <a href="' . SITE_URL . '/settings/notifications">click here</a>.</p>
                    <p>&copy; ' . date('Y') . ' ' . htmlspecialchars($this->fromName) . '. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Generate plain text activity notification email
     * 
     * @param string $username Username
     * @param array $activity Activity information
     * @return string Plain text email body
     */
    private function getActivityNotificationEmailText($username, $activity) {
        $actionUrl = SITE_URL . $activity['url'];
        
        $text = "New Activity on " . $this->fromName . "\n\n";
        $text .= "Hello " . $username . ",\n\n";
        $text .= "There's new activity for you on " . $this->fromName . ":\n\n";
        $text .= "----------------\n";
        $text .= $activity['title'] . "\n\n";
        $text .= $activity['description'] . "\n\n";
        
        if (isset($activity['from_user'])) {
            $text .= "From: " . $activity['from_user'] . "\n";
        }
        
        $text .= "Time: " . $activity['time'] . "\n";
        $text .= "----------------\n\n";
        $text .= "View Activity: " . $actionUrl . "\n\n";
        $text .= "The " . $this->fromName . " Team\n\n";
        $text .= "---\n";
        $text .= "You're receiving this email because you have notification preferences set up for this type of activity.\n";
        $text .= "To change your notification settings, go to " . SITE_URL . "/settings/notifications\n";
        $text .= "© " . date('Y') . " " . $this->fromName . ". All rights reserved.";
        
        return $text;
    }
    
    /**
     * Generate HTML weekly newsletter
     * 
     * @param string $username Username
     * @param array $content Newsletter content
     * @return string HTML email body
     */
    private function getWeeklyNewsletterHtml($username, $content) {
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>' . htmlspecialchars($this->fromName) . ' Weekly: ' . htmlspecialchars($content['title']) . '</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #3498db; color: #ffffff; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #999999; }
                .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; }
                .section { margin-bottom: 30px; }
                .item { margin-bottom: 20px; border-bottom: 1px solid #eeeeee; padding-bottom: 20px; }
                .item:last-child { border-bottom: none; }
                .item img { display: block; max-width: 100%; height: auto; margin: 0 auto 10px; }
                h2 { color: #3498db; }
                h3 { margin-top: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>' . htmlspecialchars($this->fromName) . ' Weekly</h1>
                    <p>' . htmlspecialchars($content['title']) . '</p>
                </div>
                <div class="content">
                    <p>Hello ' . htmlspecialchars($username) . ',</p>
                    <p>' . nl2br(htmlspecialchars($content['intro'])) . '</p>';
        
        // Featured content
        if (isset($content['featured']) && !empty($content['featured'])) {
            $html .= '<div class="section">
                        <h2>Featured Content</h2>';
            
            $featured = $content['featured'];
            $featuredUrl = SITE_URL . '/' . $featured['type'] . '/' . $featured['slug'];
            $featuredImage = isset($featured['image']) ? $featured['image'] : SITE_URL . '/images/default-' . $featured['type'] . '.jpg';
            
            $html .= '<div class="item">
                        <img src="' . $featuredImage . '" alt="' . htmlspecialchars($featured['title']) . '">
                        <h3>' . htmlspecialchars($featured['title']) . '</h3>
                        <p>' . nl2br(htmlspecialchars($featured['description'])) . '</p>
                        <p><a href="' . $featuredUrl . '" class="button">Check it out</a></p>
                      </div>
                    </div>';
        }
        
        // New releases
        if (isset($content['new_releases']) && !empty($content['new_releases'])) {
            $html .= '<div class="section">
                        <h2>New Releases</h2>';
            
            foreach ($content['new_releases'] as $item) {
                $itemUrl = SITE_URL . '/' . $item['type'] . '/' . $item['slug'];
                $html .= '<div class="item">
                            <h3>' . htmlspecialchars($item['title']) . '</h3>
                            <p>' . nl2br(htmlspecialchars($item['description'])) . '</p>
                            <p><a href="' . $itemUrl . '">View Details</a></p>
                          </div>';
            }
            
            $html .= '</div>';
        }
        
        // Popular content
        if (isset($content['popular']) && !empty($content['popular'])) {
            $html .= '<div class="section">
                        <h2>Trending This Week</h2>';
            
            foreach ($content['popular'] as $item) {
                $itemUrl = SITE_URL . '/' . $item['type'] . '/' . $item['slug'];
                $html .= '<div class="item">
                            <h3>' . htmlspecialchars($item['title']) . '</h3>
                            <p>' . nl2br(htmlspecialchars($item['description'])) . '</p>
                            <p><a href="' . $itemUrl . '">View Details</a></p>
                          </div>';
            }
            
            $html .= '</div>';
        }
        
        // Community highlights
        if (isset($content['community']) && !empty($content['community'])) {
            $html .= '<div class="section">
                        <h2>Community Highlights</h2>';
            
            foreach ($content['community'] as $item) {
                $itemUrl = SITE_URL . $item['url'];
                $html .= '<div class="item">
                            <h3>' . htmlspecialchars($item['title']) . '</h3>
                            <p>' . nl2br(htmlspecialchars($item['description'])) . '</p>
                            <p><a href="' . $itemUrl . '">Join the Discussion</a></p>
                          </div>';
            }
            
            $html .= '</div>';
        }
        
        // Closing
        $html .= '<p>' . nl2br(htmlspecialchars($content['closing'])) . '</p>
                  <p>See you next week!</p>
                  <p>The ' . htmlspecialchars($this->fromName) . ' Team</p>
                </div>
                <div class="footer">
                    <p>You\'re receiving this email because you\'re subscribed to our weekly newsletter.</p>
                    <p>To unsubscribe or change your email preferences, <a href="' . SITE_URL . '/settings/notifications">click here</a>.</p>
                    <p>&copy; ' . date('Y') . ' ' . htmlspecialchars($this->fromName) . '. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Generate plain text weekly newsletter
     * 
     * @param string $username Username
     * @param array $content Newsletter content
     * @return string Plain text email body
     */
    private function getWeeklyNewsletterText($username, $content) {
        $text = $this->fromName . " Weekly: " . $content['title'] . "\n\n";
        $text .= "Hello " . $username . ",\n\n";
        $text .= $content['intro'] . "\n\n";
        
        // Featured content
        if (isset($content['featured']) && !empty($content['featured'])) {
            $featured = $content['featured'];
            $featuredUrl = SITE_URL . '/' . $featured['type'] . '/' . $featured['slug'];
            
            $text .= "=== FEATURED CONTENT ===\n\n";
            $text .= $featured['title'] . "\n";
            $text .= $featured['description'] . "\n";
            $text .= "Check it out: " . $featuredUrl . "\n\n";
        }
        
        // New releases
        if (isset($content['new_releases']) && !empty($content['new_releases'])) {
            $text .= "=== NEW RELEASES ===\n\n";
            
            foreach ($content['new_releases'] as $item) {
                $itemUrl = SITE_URL . '/' . $item['type'] . '/' . $item['slug'];
                $text .= $item['title'] . "\n";
                $text .= $item['description'] . "\n";
                $text .= "View Details: " . $itemUrl . "\n\n";
            }
        }
        
        // Popular content
        if (isset($content['popular']) && !empty($content['popular'])) {
            $text .= "=== TRENDING THIS WEEK ===\n\n";
            
            foreach ($content['popular'] as $item) {
                $itemUrl = SITE_URL . '/' . $item['type'] . '/' . $item['slug'];
                $text .= $item['title'] . "\n";
                $text .= $item['description'] . "\n";
                $text .= "View Details: " . $itemUrl . "\n\n";
            }
        }
        
        // Community highlights
        if (isset($content['community']) && !empty($content['community'])) {
            $text .= "=== COMMUNITY HIGHLIGHTS ===\n\n";
            
            foreach ($content['community'] as $item) {
                $itemUrl = SITE_URL . $item['url'];
                $text .= $item['title'] . "\n";
                $text .= $item['description'] . "\n";
                $text .= "Join the Discussion: " . $itemUrl . "\n\n";
            }
        }
        
        // Closing
        $text .= $content['closing'] . "\n\n";
        $text .= "See you next week!\n\n";
        $text .= "The " . $this->fromName . " Team\n\n";
        $text .= "---\n";
        $text .= "You're receiving this email because you're subscribed to our weekly newsletter.\n";
        $text .= "To unsubscribe or change your email preferences, go to " . SITE_URL . "/settings/notifications\n";
        $text .= "© " . date('Y') . " " . $this->fromName . ". All rights reserved.";
        
        return $text;
    }
}