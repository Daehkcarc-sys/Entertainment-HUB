/**
 * Entertainment Hub - Authentication
 * Handles user authentication, registration, and profile management
 */

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');

// Initialize authentication
document.addEventListener('DOMContentLoaded', () => {
  initializeAuth();
});

// Initialize authentication
function initializeAuth() {
  // Check if user is logged in
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  // Update UI based on authentication status
  updateAuthUI(isAuthenticated, currentUser);
  
  // Initialize login form
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Initialize register form
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Initialize logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Handle social login buttons
  const socialLoginButtons = document.querySelectorAll('.social-login-btn');
  socialLoginButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      window.EntertainmentHub.showToast('Social login will be available soon!', 'info');
    });
  });
}

// Handle login form submission
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me')?.checked || false;
  
  // Simple validation
  if (!email || !password) {
    window.EntertainmentHub.showToast('Please enter both email and password', 'error');
    return;
  }
  
  // In a real app, this would make an API call to authenticate
  // For demo purposes, we'll simulate a successful login
  simulateLogin(email, rememberMe);
}

// Handle register form submission
function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const agreeTerms = document.getElementById('agree-terms')?.checked || false;
  
  // Simple validation
  if (!username || !email || !password) {
    window.EntertainmentHub.showToast('Please fill in all required fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    window.EntertainmentHub.showToast('Passwords do not match', 'error');
    return;
  }
  
  if (!agreeTerms) {
    window.EntertainmentHub.showToast('You must agree to the terms and conditions', 'error');
    return;
  }
  
  // In a real app, this would make an API call to register
  // For demo purposes, we'll simulate a successful registration
  simulateRegistration(username, email);
}

// Handle logout
function handleLogout() {
  // Clear authentication state
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('currentUser');
  
  // Update UI
  updateAuthUI(false, null);
  
  // Show success message
  window.EntertainmentHub.showToast('You have been logged out successfully', 'success');
  
  // Redirect to home page
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
}

// Update UI based on authentication status
function updateAuthUI(isAuthenticated, user) {
  const authLinks = document.querySelectorAll('.auth-links');
  const userProfileLinks = document.querySelectorAll('.user-profile-link');
  const userMenus = document.querySelectorAll('.user-menu');
  const usernames = document.querySelectorAll('.username');
  const userAvatars = document.querySelectorAll('.user-avatar');
  
  if (isAuthenticated && user) {
    // Hide sign in/sign up links
    authLinks.forEach(link => {
      link.style.display = 'none';
    });
    
    // Show user profile links and menus
    userProfileLinks.forEach(link => {
      link.style.display = 'block';
    });
    
    userMenus.forEach(menu => {
      menu.style.display = 'flex';
    });
    
    // Update username displays
    usernames.forEach(element => {
      element.textContent = user.username;
    });
    
    // Update user avatars
    userAvatars.forEach(avatar => {
      if (avatar.tagName === 'IMG') {
        avatar.src = user.avatar || '../images/Avatar.jpg';
        avatar.alt = `${user.username}'s avatar`;
      }
    });
    
    // Show content that requires authentication
    document.querySelectorAll('.signed-in-only').forEach(element => {
      element.classList.add('visible');
    });
    
    document.querySelectorAll('.not-signed-in-message').forEach(element => {
      element.style.display = 'none';
    });
    
    document.querySelectorAll('.signed-in-content').forEach(element => {
      element.style.display = 'block';
    });
  } else {
    // Show sign in/sign up links
    authLinks.forEach(link => {
      link.style.display = 'block';
    });
    
    // Hide user profile links and menus
    userProfileLinks.forEach(link => {
      link.style.display = 'none';
    });
    
    userMenus.forEach(menu => {
      menu.style.display = 'none';
    });
    
    // Hide content that requires authentication
    document.querySelectorAll('.signed-in-only').forEach(element => {
      element.classList.remove('visible');
    });
    
    document.querySelectorAll('.not-signed-in-message').forEach(element => {
      element.style.display = 'block';
    });
    
    document.querySelectorAll('.signed-in-content').forEach(element => {
      element.style.display = 'none';
    });
  }
}

// Simulate login (for demo purposes)
function simulateLogin(email, rememberMe) {
  // Show loading state
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  submitBtn.disabled = true;
  
  // Simulate API call delay
  setTimeout(() => {
    // Create mock user
    const user = {
      id: 'user123',
      username: email.split('@')[0],
      email: email,
      avatar: '../images/Avatar.jpg',
      joinDate: new Date().toISOString()
    };
    
    // Store authentication state
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Update UI
    updateAuthUI(true, user);
    
    // Show success message
    window.EntertainmentHub.showToast('Login successful! Welcome back.', 'success');
    
    // Redirect to previous page or home
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  }, 1500);
}

// Simulate registration (for demo purposes)
function simulateRegistration(username, email) {
  // Show loading state
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
  submitBtn.disabled = true;
  
  // Simulate API call delay
  setTimeout(() => {
    // Create mock user
    const user = {
      id: 'user' + Math.floor(Math.random() * 1000),
      username: username,
      email: email,
      avatar: '../images/Avatar.jpg',
      joinDate: new Date().toISOString()
    };
    
    // Store authentication state
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Update UI
    updateAuthUI(true, user);
    
    // Show success message
    window.EntertainmentHub.showToast('Registration successful! Welcome to Entertainment Hub.', 'success');
    
    // Redirect to home page
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }, 2000);
}

// Export Auth object for use in other scripts
window.Auth = {
  isAuthenticated: () => localStorage.getItem('isAuthenticated') === 'true',
  getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser') || 'null'),
  login: simulateLogin,
  logout: handleLogout,
  register: simulateRegistration
};
