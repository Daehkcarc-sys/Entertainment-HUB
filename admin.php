<?php
// Start session and include necessary files
session_start();

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    $_SESSION['auth_error'] = 'You must be logged in as an administrator to access this page.';
    header('Location: signin.php');
    exit;
}

$pageTitle = "Admin Dashboard";
$pageStyles = [
    "css/common.css",
    "css/admin.css",
    "css/components.css",
    "css/dark-theme.css"
];
$currentPage = "admin";

// Include header
include 'api/header.php';
?>

<main id="main" class="admin-dashboard">
    <div class="admin-layout">
        <!-- Admin Sidebar -->
        <div class="admin-sidebar">
            <nav class="admin-nav">
                <ul>
                    <li><button class="admin-nav-btn active" data-section="dashboard">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </button></li>
                    <li><button class="admin-nav-btn" data-section="users">
                        <i class="fas fa-users"></i> User Management
                    </button></li>
                    <li><button class="admin-nav-btn" data-section="content">
                        <i class="fas fa-photo-video"></i> Content Management
                    </button></li>
                    <li><button class="admin-nav-btn" data-section="reports">
                        <i class="fas fa-flag"></i> Reports
                    </button></li>
                    <li><button class="admin-nav-btn" data-section="settings">
                        <i class="fas fa-cog"></i> Settings
                    </button></li>
                </ul>
            </nav>
        </div>

        <!-- Admin Content Area -->
        <div class="admin-content">
            <!-- Dashboard Section -->
            <section id="dashboard-section" class="admin-section active">
                <div class="admin-header">
                    <h1>Admin Dashboard</h1>
                    <p class="last-login">Last login: <?php echo $_SESSION['last_login'] ?? 'Never'; ?></p>
                </div>

                <div class="dashboard-stats">
                    <!-- Stats will be dynamically loaded -->
                </div>

                <div class="quick-actions">
                    <h2>Quick Actions</h2>
                    <div class="quick-actions-grid">
                        <button class="quick-action-btn" id="add-content-btn">
                            <i class="fas fa-plus"></i>
                            <span>Add New Content</span>
                        </button>
                        <button class="quick-action-btn" id="add-user-btn">
                            <i class="fas fa-user-plus"></i>
                            <span>Add New User</span>
                        </button>
                        <button class="quick-action-btn" id="generate-report-btn">
                            <i class="fas fa-chart-bar"></i>
                            <span>Generate Report</span>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Other sections will be added dynamically via JavaScript -->
        </div>
    </div>
</main>

<!-- Include footer -->
<?php include 'api/footer.php'; ?>

<!-- Admin specific JavaScript -->
<script src="js/admin.js"></script>