/**
 * Entertainment Hub - Common JavaScript
 * Handles functionality shared across all pages
 */

// DOM Elements
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const backToTopBtn = document.getElementById('back-to-top-btn');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navList = document.querySelector('.nav-list');
const searchForm = document.querySelector('.search-container form');
const notificationToggle = document.querySelector('.notification-toggle');
const notificationDropdown = document.querySelector('.notification-dropdown');
const userMenuToggle = document.querySelector('.user-menu-toggle');
const userDropdown = document.querySelector('.user-dropdown');

// Global state
const state = {
  theme: localStorage.getItem('theme') || 'light',
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
  notifications: [],
  watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
  readingList: JSON.parse(localStorage.getItem('readingList') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
  ratings: JSON.parse(localStorage.getItem('ratings') || '{}'),
  lastVisited: JSON.parse(localStorage.getItem('lastVisited') || '{}')
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Remove page loader if it exists
  const pageLoader = document.getElementById('page-loader');
  if (pageLoader) {
    setTimeout(() => {
      pageLoader.classList.add('fade-out');
      setTimeout(() => {
        pageLoader.style.display = 'none';
      }, 500);
    }, 500);
  }

  // Apply saved theme
  applyTheme(state.theme);

  // Initialize components
  initializeThemeToggle();
  initializeBackToTop();
  initializeMobileMenu();
  initializeSearchForm();
  initializeDropdowns();
  initializeAnimations();
  updateAuthUI();
  
  // Track page visit
  trackPageVisit();
  
  // Check for dead links and fix them
  fixDeadLinks();
});

// Theme handling
function applyTheme(theme) {
  if (theme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggle.setAttribute('aria-label', 'Switch to light mode');
    }
  } else {
    body.setAttribute('data-theme', 'light');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
  }
  localStorage.setItem('theme', theme);
  state.theme = theme;
}

function initializeThemeToggle() {
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }
}

// Back to top button
function initializeBackToTop() {
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

// Mobile menu
function initializeMobileMenu() {
  if (mobileMenuToggle && navList) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuToggle.classList.toggle('active');
      navList.classList.toggle('active');
      
      // Update ARIA attributes
      const isExpanded = mobileMenuToggle.classList.contains('active');
      mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
    });
  }
}

// Search form
function initializeSearchForm() {
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const searchInput = searchForm.querySelector('input[type="search"]');
      if (searchInput && searchInput.value.trim()) {
        // Get the current page category
        const currentPage = getCurrentPageCategory();
        
        // Redirect to search results page with appropriate parameters
        window.location.href = `search.html?q=${encodeURIComponent(searchInput.value)}&category=${currentPage}`;
      }
    });
  }
}

// Dropdown menus (notifications, user menu)
function initializeDropdowns() {
  // Notification dropdown
  if (notificationToggle && notificationDropdown) {
    notificationToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle('active');
      
      // Update ARIA attributes
      const isExpanded = notificationDropdown.classList.contains('active');
      notificationToggle.setAttribute('aria-expanded', isExpanded);
      
      // Close user dropdown if open
      if (userDropdown && userDropdown.classList.contains('active')) {
        userDropdown.classList.remove('active');
        userMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  // User menu dropdown
  if (userMenuToggle && userDropdown) {
    userMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
      
      // Update ARIA attributes
      const isExpanded = userDropdown.classList.contains('active');
      userMenuToggle.setAttribute('aria-expanded', isExpanded);
      
      // Close notification dropdown if open
      if (notificationDropdown && notificationDropdown.classList.contains('active')) {
        notificationDropdown.classList.remove('active');
        notificationToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (notificationDropdown && !notificationToggle.contains(e.target) && !notificationDropdown.contains(e.target)) {
      notificationDropdown.classList.remove('active');
      if (notificationToggle) notificationToggle.setAttribute('aria-expanded', 'false');
    }
    
    if (userDropdown && !userMenuToggle.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('active');
      if (userMenuToggle) userMenuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Animations
function initializeAnimations() {
  // Animate elements when they enter the viewport
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  
  if (animateElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animation = entry.target.dataset.animation || 'fade-in';
          entry.target.classList.add(animation);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    animateElements.forEach(element => {
      observer.observe(element);
    });
  }
}

// Authentication UI updates
function updateAuthUI() {
  const authLinks = document.querySelectorAll('.auth-links');
  const userProfileLinks = document.querySelectorAll('.user-profile-link');
  
  if (state.isAuthenticated) {
    // Hide sign in/sign up links
    authLinks.forEach(link => {
      link.style.display = 'none';
    });
    
    // Show user profile links
    userProfileLinks.forEach(link => {
      link.style.display = 'block';
    });
  } else {
    // Show sign in/sign up links
    authLinks.forEach(link => {
      link.style.display = 'block';
    });
    
    // Hide user profile links
    userProfileLinks.forEach(link => {
      link.style.display = 'none';
    });
  }
}

// Track page visits for recommendations
function trackPageVisit() {
  const currentPage = window.location.pathname;
  const pageCategory = getCurrentPageCategory();
  
  if (pageCategory) {
    // Get item ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    if (itemId) {
      // Update last visited items
      if (!state.lastVisited[pageCategory]) {
        state.lastVisited[pageCategory] = [];
      }
      
      // Add to beginning of array, remove duplicates
      state.lastVisited[pageCategory] = [
        itemId,
        ...state.lastVisited[pageCategory].filter(id => id !== itemId)
      ].slice(0, 10); // Keep only last 10 items
      
      localStorage.setItem('lastVisited', JSON.stringify(state.lastVisited));
    }
  }
}

// Get current page category
function getCurrentPageCategory() {
  const path = window.location.pathname;
  
  if (path.includes('movies')) return 'movies';
  if (path.includes('series')) return 'series';
  if (path.includes('anime')) return 'anime';
  if (path.includes('manga')) return 'manga';
  if (path.includes('games')) return 'games';
  
  return 'all';
}

// Fix dead links
function fixDeadLinks() {
  const links = document.querySelectorAll('a');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    
    // Skip links with # or javascript:void(0)
    if (!href || href === '#' || href.startsWith('javascript:')) {
      // Prevent default behavior for # links
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('This feature is coming soon!', 'info');
      });
      return;
    }
    
    // Check if the link points to a page that doesn't exist yet
    if (href.endsWith('.html') && !isValidPage(href)) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('This page is under construction. Check back soon!', 'info');
      });
    }
  });
}

// Check if a page exists
function isValidPage(href) {
  // List of valid pages
  const validPages = [
    'index.html',
    'movies.html',
    'anime.html',
    'manga.html',
    'series.html',
    'games.html',
    'leaderboard.html',
    'community.html',
    'discussions.html',
    'watchlist.html',
    'profile.html',
    'signin.html',
    'signup.html',
    'search.html',
    'ratings.html',
    'mangareader.html',
    'privacy.html',
    'terms.html',
    'news.html',
    'polls.html',
    'notifications.html'
  ];
  
  // Extract the filename from the href
  const filename = href.split('/').pop();
  
  return validPages.includes(filename);
}

// Toast notification system
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fade-in`;
  
  // Set icon based on type
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

// Export functions for use in other scripts
window.EntertainmentHub = {
  showToast,
  getCurrentPageCategory,
  state
};
