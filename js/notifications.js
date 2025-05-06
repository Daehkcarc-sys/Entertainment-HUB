/**
 * Entertainment Hub - Notifications
 * Handles notifications functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeNotifications();
});

function initializeNotifications() {
  // Initialize notification tabs
  initializeNotificationTabs();
  
  // Initialize notification actions
  initializeNotificationActions();
  
  // Initialize notification filters
  initializeNotificationFilters();
  
  // Initialize pagination
  initializePagination();
}

// Initialize notification tabs
function initializeNotificationTabs() {
  const tabButtons = document.querySelectorAll('.notification-tabs .tab-btn');
  const notificationItems = document.querySelectorAll('.notification-item');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.dataset.tab;
      
      // Update active tab
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter notifications
      notificationItems.forEach(item => {
        if (category === 'all' || item.dataset.type === category) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Initialize notification actions
function initializeNotificationActions() {
  // Mark all as read button
  const markAllBtn = document.querySelector('.mark-all-btn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', markAllAsRead);
  }
  
  // Individual mark as read buttons
  const markReadBtns = document.querySelectorAll('.mark-read-btn');
  markReadBtns.forEach(button => {
    button.addEventListener('click', function() {
      const notificationItem = this.closest('.notification-item');
      if (notificationItem) {
        markAsRead(notificationItem);
      }
    });
  });
  
  // Reply buttons
  const replyBtns = document.querySelectorAll('.reply-btn');
  replyBtns.forEach(button => {
    button.addEventListener('click', function() {
      const notificationItem = this.closest('.notification-item');
      if (notificationItem) {
        showReplyForm(notificationItem);
      }
    });
  });
  
  // View buttons
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(button => {
    button.addEventListener('click', function() {
      // In a real app, this would navigate to the content
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast('Viewing content...', 'info');
    });
  });
  
  // Watch/Read buttons
  const watchBtns = document.querySelectorAll('.watch-btn, .read-btn');
  watchBtns.forEach(button => {
    button.addEventListener('click', function() {
      // In a real app, this would navigate to the content
      // For demo purposes, we'll just show a toast
      const action = this.classList.contains('watch-btn') ? 'Watching' : 'Reading';
      window.EntertainmentHub.showToast(`${action} content...`, 'info');
    });
  });
  
  // Follow buttons
  const followBtns = document.querySelectorAll('.follow-btn');
  followBtns.forEach(button => {
    button.addEventListener('click', function() {
      // In a real app, this would follow the user
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast('Following user...', 'success');
    });
  });
}

// Mark all notifications as read
function markAllAsRead() {
  const unreadNotifications = document.querySelectorAll('.notification-item.unread');
  
  unreadNotifications.forEach(notification => {
    markAsRead(notification);
  });
  
  // Show toast
  window.EntertainmentHub.showToast(`Marked ${unreadNotifications.length} notifications as read`, 'success');
}

// Mark a single notification as read
function markAsRead(notification) {
  notification.classList.remove('unread');
  
  // In a real app, this would update the server
  // For demo purposes, we'll just update the UI
  const markReadBtn = notification.querySelector('.mark-read-btn');
  if (markReadBtn) {
    markReadBtn.style.display = 'none';
  }
}

// Show reply form for a notification
function showReplyForm(notification) {
  // Check if form already exists
  if (notification.querySelector('.reply-form')) return;
  
  // Create reply form
  const replyForm = document.createElement('div');
  replyForm.className = 'reply-form';
  replyForm.innerHTML = `
    <textarea placeholder="Write your reply..." rows="2"></textarea>
    <div class="reply-actions">
      <button type="button" class="cancel-reply">Cancel</button>
      <button type="button" class="submit-reply">Reply</button>
    </div>
  `;
  
  // Add form to notification
  notification.appendChild(replyForm);
  
  // Focus textarea
  const textarea = replyForm.querySelector('textarea');
  if (textarea) textarea.focus();
  
  // Add event listeners
  const cancelBtn = replyForm.querySelector('.cancel-reply');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      replyForm.remove();
    });
  }
  
  const submitBtn = replyForm.querySelector('.submit-reply');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const replyText = textarea.value.trim();
      
      if (replyText) {
        // In a real app, this would send the reply to the server
        // For demo purposes, we'll just show a toast
        window.EntertainmentHub.showToast('Reply sent!', 'success');
        
        // Remove form
        replyForm.remove();
        
        // Mark as read
        markAsRead(notification);
      } else {
        window.EntertainmentHub.showToast('Please enter a reply', 'error');
      }
    });
  }
}

// Initialize notification filters
function initializeNotificationFilters() {
  const filterSelect = document.getElementById('filter-notifications');
  
  if (filterSelect) {
    filterSelect.addEventListener('change', function() {
      const filter = this.value;
      const notificationItems = document.querySelectorAll('.notification-item');
      
      notificationItems.forEach(item => {
        if (filter === 'all' || (filter === 'unread' && item.classList.contains('unread')) || item.dataset.type === filter) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
}

// Initialize pagination
function initializePagination() {
  const paginationButtons = document.querySelectorAll('.pagination-btn');
  
  paginationButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Update active button
      paginationButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // In a real app, this would load the corresponding page
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast('Loading page...', 'info');
    });
  });
}
