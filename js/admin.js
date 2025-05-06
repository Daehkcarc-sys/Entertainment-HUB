/**
 * Entertainment Hub - Admin Dashboard JavaScript
 * This file handles all dynamic functionality for the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin dashboard
    initAdminDashboard();
});

/**
 * Main initialization function for the admin dashboard
 */
function initAdminDashboard() {
    // Setup section navigation
    setupSectionNavigation();
    
    // Initialize data tables functionality
    initDataTables();
    
    // Initialize quick action buttons
    initQuickActions();
    
    // Initialize modals
    initModals();
    
    // Initialize form handlers
    initFormHandlers();
    
    // Log initialization
    console.log('Admin dashboard initialized successfully');
}

/**
 * Setup navigation between admin dashboard sections
 */
function setupSectionNavigation() {
    const navButtons = document.querySelectorAll('.admin-nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get section to show
            const sectionId = button.getAttribute('data-section');
            
            // Hide all sections
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all buttons
            navButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show targeted section
            document.getElementById(`${sectionId}-section`).classList.add('active');
            
            // Add active class to clicked button
            button.classList.add('active');
        });
    });
}

/**
 * Initialize data tables with sorting, filtering, and pagination
 */
function initDataTables() {
    // Users table functionality
    initUserTable();
    
    // Content table functionality
    initContentTable();
    
    // Other tables would be initialized here
}

/**
 * Initialize users table functionality
 */
function initUserTable() {
    // User search functionality
    const userSearchBtn = document.getElementById('search-user-btn');
    if (userSearchBtn) {
        userSearchBtn.addEventListener('click', () => {
            const searchQuery = document.getElementById('user-search').value.toLowerCase();
            const filterValue = document.getElementById('user-filter').value;
            
            // For demo purposes, we'll just log the search
            console.log(`Searching for users: "${searchQuery}" with filter: ${filterValue}`);
            
            // In a real application, this would send an AJAX request to the backend
            // For now, simulate a search with an alert
            alert(`Searching for users matching "${searchQuery}" with filter: ${filterValue}`);
        });
    }
    
    // Add User button
    const addUserBtn = document.getElementById('add-new-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showModal('user-modal', 'Add New User', createUserForm());
        });
    }
    
    // Select all checkboxes
    const selectAllUsers = document.getElementById('select-all-users');
    if (selectAllUsers) {
        selectAllUsers.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.user-select');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllUsers.checked;
            });
        });
    }
    
    // Individual user actions
    setupUserActionButtons();
    
    // Bulk action handler
    const applyBulkAction = document.getElementById('apply-bulk-action');
    if (applyBulkAction) {
        applyBulkAction.addEventListener('click', () => {
            const action = document.getElementById('bulk-action-select').value;
            if (!action) {
                alert('Please select an action to perform');
                return;
            }
            
            const selectedUsers = document.querySelectorAll('.user-select:checked');
            if (selectedUsers.length === 0) {
                alert('Please select at least one user');
                return;
            }
            
            // Get IDs of selected users (for demonstration, get from parent row)
            const userIds = Array.from(selectedUsers).map(checkbox => {
                const row = checkbox.closest('tr');
                return row.querySelector('td:nth-child(2)').textContent;
            });
            
            confirmAction(`Are you sure you want to ${action} ${selectedUsers.length} selected users?`, () => {
                // In a real app, this would send an AJAX request to perform the action
                alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action applied to ${selectedUsers.length} users`);
                console.log(`Action ${action} applied to user IDs:`, userIds);
            });
        });
    }
    
    // Sort table columns
    document.querySelectorAll('#users-table th i.fa-sort').forEach(icon => {
        icon.parentElement.addEventListener('click', () => {
            // For demo purposes - in a real app this would sort the table
            const column = icon.parentElement.textContent.trim();
            alert(`Sorting table by ${column}`);
        });
    });
    
    // Pagination handlers
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', () => {
                // This would handle actual pagination in a real app
                if (btn.classList.contains('active')) return;
                
                // Reset active state
                document.querySelectorAll('.pagination-btn').forEach(b => b.classList.remove('active'));
                
                // Set active state on clicked button
                btn.classList.add('active');
                
                // In a real app, this would load the appropriate page
                // For demo, we'll just log the action
                console.log(`Navigate to page ${btn.textContent}`);
            });
        }
    });
}

/**
 * Initialize content table functionality
 */
function initContentTable() {
    // Content search functionality
    const contentSearchBtn = document.getElementById('search-content-btn');
    if (contentSearchBtn) {
        contentSearchBtn.addEventListener('click', () => {
            const searchQuery = document.getElementById('content-search').value.toLowerCase();
            const filterValue = document.getElementById('content-filter').value;
            
            // For demo purposes, we'll just log the search
            console.log(`Searching for content: "${searchQuery}" with filter: ${filterValue}`);
            
            // In a real application, this would send an AJAX request to the backend
            // For now, simulate a search with an alert
            alert(`Searching for content matching "${searchQuery}" with filter: ${filterValue}`);
        });
    }
    
    // Category filters
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all category buttons
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get category to filter by
            const category = btn.getAttribute('data-category');
            
            // In a real app, this would filter the table
            console.log(`Filtering content by category: ${category}`);
            alert(`Showing ${category} content`);
        });
    });
    
    // Add content button
    const addContentBtn = document.getElementById('add-new-content-btn');
    if (addContentBtn) {
        addContentBtn.addEventListener('click', () => {
            showModal('content-modal', 'Add New Content', createContentForm());
        });
    }
    
    // Select all checkboxes
    const selectAllContent = document.getElementById('select-all-content');
    if (selectAllContent) {
        selectAllContent.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.content-select');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllContent.checked;
            });
        });
    }
    
    // Individual content actions
    setupContentActionButtons();
    
    // Bulk action handler
    const applyContentAction = document.getElementById('apply-content-action');
    if (applyContentAction) {
        applyContentAction.addEventListener('click', () => {
            const action = document.getElementById('content-bulk-action').value;
            if (!action) {
                alert('Please select an action to perform');
                return;
            }
            
            const selectedContent = document.querySelectorAll('.content-select:checked');
            if (selectedContent.length === 0) {
                alert('Please select at least one content item');
                return;
            }
            
            // Get titles of selected content (for demonstration)
            const contentTitles = Array.from(selectedContent).map(checkbox => {
                const row = checkbox.closest('tr');
                return row.querySelector('td:nth-child(3)').textContent;
            });
            
            confirmAction(`Are you sure you want to ${action} ${selectedContent.length} selected items?`, () => {
                // In a real app, this would send an AJAX request to perform the action
                alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action applied to ${selectedContent.length} items`);
                console.log(`Action ${action} applied to content:`, contentTitles);
            });
        });
    }
}

/**
 * Setup action buttons for users table
 */
function setupUserActionButtons() {
    // View user buttons
    document.querySelectorAll('#users-table .view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            const userId = row.querySelector('td:nth-child(2)').textContent;
            const username = row.querySelector('td:nth-child(3)').textContent;
            
            // In a real app, this would fetch user details via AJAX
            // For demo, show a simple view with the available data
            showModal('user-modal', `View User: ${username}`, createUserViewDetails(row));
        });
    });
    
    // Edit user buttons
    document.querySelectorAll('#users-table .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            const userId = row.querySelector('td:nth-child(2)').textContent;
            const username = row.querySelector('td:nth-child(3)').textContent;
            
            // In a real app, this would fetch user details via AJAX and populate a form
            // For demo, create a form with the available data
            showModal('user-modal', `Edit User: ${username}`, createUserForm(row));
        });
    });
    
    // Delete user buttons
    document.querySelectorAll('#users-table .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            const userId = row.querySelector('td:nth-child(2)').textContent;
            const username = row.querySelector('td:nth-child(3)').textContent;
            
            confirmAction(`Are you sure you want to delete user "${username}"?`, () => {
                // In a real app, this would send an AJAX request to delete the user
                alert(`User "${username}" has been deleted`);
                
                // For demo, just hide the row
                row.style.display = 'none';
            });
        });
    });
}

/**
 * Setup action buttons for content table
 */
function setupContentActionButtons() {
    // View content buttons
    document.querySelectorAll('#content-table .view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            const title = row.querySelector('td:nth-child(3)').textContent;
            
            // In a real app, this would fetch content details via AJAX
            // For demo, show a simple view with the available data
            showModal('content-modal', `View Content: ${title}`, createContentViewDetails(row));
        });
    });
    
    // Edit content buttons
    document.querySelectorAll('#content-table .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            const title = row.querySelector('td:nth-child(3)').textContent;
            
            // In a real app, this would fetch content details via AJAX and populate a form
            // For demo, create a form with the available data
            showModal('content-modal', `Edit Content: ${title}`, createContentForm(row));
        });
    });
    
    // Delete content buttons
    document.querySelectorAll('#content-table .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            const title = row.querySelector('td:nth-child(3)').textContent;
            
            confirmAction(`Are you sure you want to delete "${title}"?`, () => {
                // In a real app, this would send an AJAX request to delete the content
                alert(`Content "${title}" has been deleted`);
                
                // For demo, just hide the row
                row.style.display = 'none';
            });
        });
    });
}

/**
 * Initialize quick action buttons
 */
function initQuickActions() {
    // Add content button
    const addContentBtn = document.getElementById('add-content-btn');
    if (addContentBtn) {
        addContentBtn.addEventListener('click', () => {
            showModal('content-modal', 'Add New Content', createContentForm());
        });
    }
    
    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showModal('user-modal', 'Add New User', createUserForm());
        });
    }
    
    // Send notification button
    const sendNotificationBtn = document.getElementById('send-notification-btn');
    if (sendNotificationBtn) {
        sendNotificationBtn.addEventListener('click', () => {
            showModal('content-modal', 'Send Notification', createNotificationForm());
        });
    }
    
    // Backup button
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            confirmAction('Are you sure you want to create a database backup?', () => {
                // Simulate backup process with a timeout
                alert('Database backup process started. This may take a few minutes.');
                setTimeout(() => {
                    alert('Database backup completed successfully!');
                }, 3000);
            });
        });
    }
    
    // System status button
    const systemStatusBtn = document.getElementById('system-status-btn');
    if (systemStatusBtn) {
        systemStatusBtn.addEventListener('click', () => {
            showModal('content-modal', 'System Status', createSystemStatusDetails());
        });
    }
    
    // Generate report button
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            showModal('content-modal', 'Generate Report', createReportForm());
        });
    }
}

/**
 * Initialize modal functionality
 */
function initModals() {
    // Close modal when clicking the X button
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close modal when clicking outside the content
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    // Cancel button in confirm modal
    const cancelAction = document.getElementById('cancel-action');
    if (cancelAction) {
        cancelAction.addEventListener('click', () => {
            closeModal(document.getElementById('confirm-modal'));
        });
    }
}

/**
 * Initialize form handlers
 */
function initFormHandlers() {
    // We would add form submission handlers here
    // For the demo, we'll handle these in their respective modal show functions
}

/**
 * Show a modal with the specified ID, title, and content
 */
function showModal(modalId, title, content) {
    const modal = document.getElementById(modalId);
    const titleElement = document.getElementById(`${modalId}-title`);
    const bodyElement = document.getElementById(`${modalId}-body`);
    
    // Set the title and content
    if (titleElement) titleElement.textContent = title;
    if (bodyElement) bodyElement.innerHTML = content;
    
    // Show the modal
    modal.classList.add('show');
    
    // Add the form handlers if needed
    initModalFormHandlers(modalId);
}

/**
 * Initialize form handlers specifically for modals
 */
function initModalFormHandlers(modalId) {
    // Add event listeners for forms in the modal
    const modal = document.getElementById(modalId);
    const form = modal.querySelector('form');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // For demo purposes, we'll just alert that the form was submitted
            alert('Form submitted successfully!');
            
            // Close the modal
            closeModal(modal);
        });
    }
}

/**
 * Close a modal
 */
function closeModal(modal) {
    modal.classList.remove('show');
}

/**
 * Show confirmation dialog
 */
function confirmAction(message, confirmCallback) {
    const modal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-action');
    
    // Set the message
    confirmMessage.textContent = message;
    
    // Setup the confirm button
    const oldConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(oldConfirmBtn, confirmBtn);
    
    document.getElementById('confirm-action').addEventListener('click', () => {
        confirmCallback();
        closeModal(modal);
    });
    
    // Show the modal
    modal.classList.add('show');
}

/**
 * Create a user form for adding/editing users
 */
function createUserForm(userData = null) {
    // If userData is provided, populate the form with that data
    const username = userData ? userData.querySelector('td:nth-child(3)').textContent : '';
    const email = userData ? userData.querySelector('td:nth-child(4)').textContent : '';
    const role = userData ? userData.querySelector('td:nth-child(5) .badge').textContent : '';
    const status = userData ? userData.querySelector('td:nth-child(7) .status-badge').textContent : 'Active';
    
    return `
        <form id="user-form" class="admin-form">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" value="${username}" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" value="${email}" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" ${userData ? 'placeholder="Leave blank to keep current password"' : 'required'}>
            </div>
            <div class="form-group">
                <label for="role">Role</label>
                <select id="role" name="role" required>
                    <option value="admin" ${role === 'Admin' ? 'selected' : ''}>Admin</option>
                    <option value="moderator" ${role === 'Moderator' ? 'selected' : ''}>Moderator</option>
                    <option value="regular" ${role === 'Regular' ? 'selected' : ''}>Regular User</option>
                </select>
            </div>
            <div class="form-group">
                <label for="status">Status</label>
                <select id="status" name="status" required>
                    <option value="active" ${status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="banned" ${status === 'Banned' ? 'selected' : ''}>Banned</option>
                </select>
            </div>
            <div class="form-group">
                <label for="profile-pic">Profile Picture</label>
                <input type="file" id="profile-pic" name="profile_pic">
            </div>
            <div class="form-buttons">
                <button type="button" class="secondary-btn close-modal">Cancel</button>
                <button type="submit" class="primary-btn">${userData ? 'Update User' : 'Add User'}</button>
            </div>
        </form>
    `;
}

/**
 * Create user view details
 */
function createUserViewDetails(userData) {
    const username = userData.querySelector('td:nth-child(3)').textContent;
    const email = userData.querySelector('td:nth-child(4)').textContent;
    const role = userData.querySelector('td:nth-child(5) .badge').textContent;
    const joined = userData.querySelector('td:nth-child(6)').textContent;
    const status = userData.querySelector('td:nth-child(7) .status-badge').textContent;
    
    return `
        <div class="user-details">
            <div class="user-avatar">
                <i class="fas fa-user-circle fa-5x"></i>
            </div>
            <div class="user-info">
                <h3>${username}</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Role:</strong> <span class="badge ${role.toLowerCase()}">${role}</span></p>
                <p><strong>Joined:</strong> ${joined}</p>
                <p><strong>Status:</strong> <span class="status-badge ${status.toLowerCase()}">${status}</span></p>
            </div>
            <div class="user-stats">
                <div class="stat-item">
                    <span class="stat-value">247</span>
                    <span class="stat-label">Reviews</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">1.2K</span>
                    <span class="stat-label">Comments</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">89</span>
                    <span class="stat-label">Lists</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="primary-btn edit-user-btn">Edit User</button>
                <button class="danger-btn delete-user-btn">Delete User</button>
            </div>
        </div>
    `;
}

/**
 * Create a content form for adding/editing content
 */
function createContentForm(contentData = null) {
    // If contentData is provided, populate the form with that data
    const title = contentData ? contentData.querySelector('td:nth-child(3)').textContent : '';
    const category = contentData ? contentData.querySelector('td:nth-child(4) .badge').textContent : '';
    const status = contentData ? contentData.querySelector('td:nth-child(5) .status-badge').textContent : 'Draft';
    
    return `
        <form id="content-form" class="admin-form">
            <div class="form-group">
                <label for="title">Title</label>
                <input type="text" id="title" name="title" value="${title}" required>
            </div>
            <div class="form-group">
                <label for="category">Category</label>
                <select id="category" name="category" required>
                    <option value="movies" ${category === 'Movies' ? 'selected' : ''}>Movies</option>
                    <option value="series" ${category === 'Series' ? 'selected' : ''}>Series</option>
                    <option value="anime" ${category === 'Anime' ? 'selected' : ''}>Anime</option>
                    <option value="manga" ${category === 'Manga' ? 'selected' : ''}>Manga</option>
                    <option value="games" ${category === 'Games' ? 'selected' : ''}>Games</option>
                </select>
            </div>
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description" rows="4" required>${contentData ? 'Sample description for ' + title : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="thumbnail">Thumbnail Image</label>
                <input type="file" id="thumbnail" name="thumbnail">
            </div>
            <div class="form-group">
                <label for="release-date">Release Date</label>
                <input type="date" id="release-date" name="release_date" value="2025-05-01">
            </div>
            <div class="form-group">
                <label for="status">Status</label>
                <select id="status" name="status" required>
                    <option value="published" ${status === 'Published' ? 'selected' : ''}>Published</option>
                    <option value="draft" ${status === 'Draft' ? 'selected' : ''}>Draft</option>
                    <option value="pending" ${status === 'Pending' ? 'selected' : ''}>Pending Review</option>
                    <option value="archived" ${status === 'Archived' ? 'selected' : ''}>Archived</option>
                </select>
            </div>
            <div class="form-buttons">
                <button type="button" class="secondary-btn close-modal">Cancel</button>
                <button type="submit" class="primary-btn">${contentData ? 'Update Content' : 'Add Content'}</button>
            </div>
        </form>
    `;
}

/**
 * Create content view details
 */
function createContentViewDetails(contentData) {
    const title = contentData.querySelector('td:nth-child(3)').textContent;
    const thumbnailSrc = contentData.querySelector('td:nth-child(2) img').src;
    const category = contentData.querySelector('td:nth-child(4) .badge').textContent;
    const status = contentData.querySelector('td:nth-child(5) .status-badge').textContent;
    const addedBy = contentData.querySelector('td:nth-child(6)').textContent;
    const date = contentData.querySelector('td:nth-child(7)').textContent;
    
    return `
        <div class="content-details">
            <div class="content-header">
                <img src="${thumbnailSrc}" alt="${title}" class="content-image">
                <div class="content-header-info">
                    <h3>${title}</h3>
                    <p><span class="badge ${category.toLowerCase()}">${category}</span> <span class="status-badge ${status.toLowerCase()}">${status}</span></p>
                    <p><strong>Added by:</strong> ${addedBy} on ${date}</p>
                </div>
            </div>
            <div class="content-body">
                <div class="content-section">
                    <h4>Description</h4>
                    <p>Sample description for ${title}. This is where the full description of the content would be displayed. In a real application, this would be fetched from the database.</p>
                </div>
                <div class="content-section">
                    <h4>Details</h4>
                    <table class="details-table">
                        <tr>
                            <th>Release Date:</th>
                            <td>May 1, 2025</td>
                        </tr>
                        <tr>
                            <th>Runtime:</th>
                            <td>2h 45m</td>
                        </tr>
                        <tr>
                            <th>Rating:</th>
                            <td>4.8/5 (245 votes)</td>
                        </tr>
                        <tr>
                            <th>Views:</th>
                            <td>12.4K</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="content-actions">
                <button class="primary-btn edit-content-btn">Edit Content</button>
                <button class="danger-btn delete-content-btn">Delete Content</button>
            </div>
        </div>
    `;
}

/**
 * Create a notification form
 */
function createNotificationForm() {
    return `
        <form id="notification-form" class="admin-form">
            <div class="form-group">
                <label for="notification-title">Notification Title</label>
                <input type="text" id="notification-title" name="title" required>
            </div>
            <div class="form-group">
                <label for="notification-message">Message</label>
                <textarea id="notification-message" name="message" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="notification-type">Notification Type</label>
                <select id="notification-type" name="type" required>
                    <option value="info">Information</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                </select>
            </div>
            <div class="form-group">
                <label for="notification-recipients">Recipients</label>
                <select id="notification-recipients" name="recipients" required>
                    <option value="all">All Users</option>
                    <option value="admins">Admins Only</option>
                    <option value="moderators">Moderators Only</option>
                    <option value="regular">Regular Users Only</option>
                </select>
            </div>
            <div class="form-group">
                <label for="notification-schedule">Schedule</label>
                <select id="notification-schedule" name="schedule">
                    <option value="now">Send Now</option>
                    <option value="scheduled">Schedule</option>
                </select>
            </div>
            <div class="form-group" id="schedule-date-container" style="display: none;">
                <label for="schedule-date">Date & Time</label>
                <input type="datetime-local" id="schedule-date" name="schedule_date">
            </div>
            <div class="form-buttons">
                <button type="button" class="secondary-btn close-modal">Cancel</button>
                <button type="submit" class="primary-btn">Send Notification</button>
            </div>
        </form>
        <script>
            // Toggle schedule date field visibility
            document.getElementById('notification-schedule').addEventListener('change', function() {
                document.getElementById('schedule-date-container').style.display = 
                    this.value === 'scheduled' ? 'block' : 'none';
            });
        </script>
    `;
}

/**
 * Create system status details
 */
function createSystemStatusDetails() {
    return `
        <div class="system-status">
            <div class="status-section">
                <h3>System Information</h3>
                <table class="status-table">
                    <tr>
                        <th>Server Status:</th>
                        <td><span class="status-indicator online"></span> Online</td>
                    </tr>
                    <tr>
                        <th>PHP Version:</th>
                        <td>8.2.4</td>
                    </tr>
                    <tr>
                        <th>Database:</th>
                        <td>MySQL 8.0.27</td>
                    </tr>
                    <tr>
                        <th>Last Backup:</th>
                        <td>May 4, 2025 (23 hours ago)</td>
                    </tr>
                </table>
            </div>
            
            <div class="status-section">
                <h3>Resource Usage</h3>
                <div class="resource-usage">
                    <div class="resource-meter">
                        <div class="meter-label">CPU Usage</div>
                        <div class="meter">
                            <div class="meter-bar" style="width: 35%;"></div>
                        </div>
                        <div class="meter-value">35%</div>
                    </div>
                    <div class="resource-meter">
                        <div class="meter-label">Memory Usage</div>
                        <div class="meter">
                            <div class="meter-bar" style="width: 62%;"></div>
                        </div>
                        <div class="meter-value">62%</div>
                    </div>
                    <div class="resource-meter">
                        <div class="meter-label">Disk Usage</div>
                        <div class="meter">
                            <div class="meter-bar" style="width: 48%;"></div>
                        </div>
                        <div class="meter-value">48%</div>
                    </div>
                </div>
            </div>
            
            <div class="status-section">
                <h3>Activity Log</h3>
                <table class="log-table">
                    <tr>
                        <td class="log-time">05-05-2025 09:12:08</td>
                        <td class="log-level info">INFO</td>
                        <td class="log-message">System backup completed successfully</td>
                    </tr>
                    <tr>
                        <td class="log-time">05-05-2025 08:03:41</td>
                        <td class="log-level warning">WARNING</td>
                        <td class="log-message">High server load detected</td>
                    </tr>
                    <tr>
                        <td class="log-time">05-04-2025 22:15:30</td>
                        <td class="log-level error">ERROR</td>
                        <td class="log-message">Failed login attempt from 192.168.1.55</td>
                    </tr>
                    <tr>
                        <td class="log-time">05-04-2025 18:22:10</td>
                        <td class="log-level info">INFO</td>
                        <td class="log-message">Database optimization completed</td>
                    </tr>
                </table>
            </div>
            
            <div class="system-actions">
                <button class="primary-btn" id="restart-services-btn">Restart Services</button>
                <button class="primary-btn" id="clear-cache-btn">Clear Cache</button>
                <button class="primary-btn" id="view-full-logs-btn">View Full Logs</button>
            </div>
        </div>
        
        <script>
            // Add event listeners for the system action buttons
            document.getElementById('restart-services-btn').addEventListener('click', function() {
                alert('Restarting services... This may take a few moments.');
            });
            
            document.getElementById('clear-cache-btn').addEventListener('click', function() {
                alert('Cache cleared successfully!');
            });
            
            document.getElementById('view-full-logs-btn').addEventListener('click', function() {
                alert('Redirecting to full system logs...');
            });
        </script>
    `;
}

/**
 * Create report generation form
 */
function createReportForm() {
    return `
        <form id="report-form" class="admin-form">
            <div class="form-group">
                <label for="report-type">Report Type</label>
                <select id="report-type" name="report_type" required>
                    <option value="user-activity">User Activity</option>
                    <option value="content-performance">Content Performance</option>
                    <option value="system-performance">System Performance</option>
                    <option value="engagement">User Engagement</option>
                    <option value="revenue">Revenue</option>
                </select>
            </div>
            <div class="form-group">
                <label for="date-range">Date Range</label>
                <select id="date-range" name="date_range" required>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last-7-days" selected>Last 7 Days</option>
                    <option value="last-30-days">Last 30 Days</option>
                    <option value="this-month">This Month</option>
                    <option value="last-month">Last Month</option>
                    <option value="custom">Custom Range</option>
                </select>
            </div>
            <div class="form-row" id="custom-date-range" style="display: none;">
                <div class="form-group half">
                    <label for="start-date">Start Date</label>
                    <input type="date" id="start-date" name="start_date">
                </div>
                <div class="form-group half">
                    <label for="end-date">End Date</label>
                    <input type="date" id="end-date" name="end_date">
                </div>
            </div>
            <div class="form-group">
                <label for="report-format">Format</label>
                <select id="report-format" name="report_format" required>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                </select>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="include-charts" name="include_charts" checked>
                    Include Charts and Graphs
                </label>
            </div>
            <div class="form-buttons">
                <button type="button" class="secondary-btn close-modal">Cancel</button>
                <button type="submit" class="primary-btn">Generate Report</button>
            </div>
        </form>
        <script>
            // Toggle custom date range fields
            document.getElementById('date-range').addEventListener('change', function() {
                document.getElementById('custom-date-range').style.display = 
                    this.value === 'custom' ? 'flex' : 'none';
            });
        </script>
    `;
}