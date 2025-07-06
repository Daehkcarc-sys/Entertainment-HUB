<?php
session_start();

// Set page variables
$pageTitle = "Home";
$pageStyles = [
    "css/common.css",
    "css/styles.css",
    "css/home.css",
    "css/components.css",
    "css/dark-theme.css"
];
$pageScripts = ["js/common.js"];
$currentPage = "home";

// Include header
include 'api/header.php';
?>

<main class="main-content">
    <div class="container">
        <h1>Welcome to Entertainment Hub</h1>
        <?php if (isset($_SESSION['flash_message'])): ?>
            <div class="alert alert-<?php echo $_SESSION['flash_message_type'] ?? 'info'; ?>">
                <?php 
                echo $_SESSION['flash_message'];
                unset($_SESSION['flash_message']);
                unset($_SESSION['flash_message_type']);
                ?>
            </div>
        <?php endif; ?>
        
        <!-- Main content will go here -->
        <div class="content-grid">
            <!-- Content sections will be added here -->
        </div>
    </div>
</main>

<?php include 'api/footer.php'; ?>