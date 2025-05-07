/**
 * Authentication utilities for Entertainment Hub
 * Handles user login, registration, and session management on the frontend
 */

const Auth = {
    /**
     * Base API URL for authentication endpoints
     * Change this if your backend is hosted elsewhere
     */
    apiUrl: 'http://localhost/Projet/api/auth.php',
    
    /**
     * Login with email and password
     * @param {string} email User email
     * @param {string} password User password
     * @returns {Promise} Promise that resolves to user data or rejects with error
     */

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}?action=login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Store authentication data
            this.setSession(data.token, data.user);
            
            return data.user;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },
    
    /**
     * Register new user
     * @param {string} username Username
     * @param {string} email User email
     * @param {string} password User password
     * @returns {Promise} Promise that resolves to user data or rejects with error
     */
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.apiUrl}?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });
            
            let data;
            // Check if the response is valid JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // Handle HTML error responses (PHP errors)
                const htmlError = await response.text();
                console.error('Server returned non-JSON response:', htmlError);
                throw new Error('The server encountered an error. Please try again later.');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            // If registration is successful but requires email verification
            if (data.success && !data.token) {
                return { success: true, message: data.message };
            }
            
            // Store authentication data if immediate login is allowed
            if (data.token) {
                this.setSession(data.token, data.user, data.expires_at);
            }
            
            return data;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },
    
    /**
     * Verify authentication token
     * @returns {Promise} Promise that resolves to user data if authenticated
     */
    async verifyToken() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return null;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}?action=verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                this.logout();
                throw new Error(data.error || 'Token verification failed');
            }
            
            // Update stored user data
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            return data.user;
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout();
            return null;
        }
    },
    
    /**
     * Logout current user
     * @returns {Promise} Promise that resolves when logout is complete
     */
    async logout() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                await fetch(`${this.apiUrl}?action=logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('Logout API call failed:', error);
            }
        }
        
        // Clear local authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('tokenExpires');
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth:logout'));
    },
    
    /**
     * Set authentication session
     * @param {string} token Authentication token
     * @param {Object} user User data
     * @param {string} expiresAt Expiration timestamp
     */
    setSession(token, user, expiresAt) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        if (expiresAt) {
            localStorage.setItem('tokenExpires', expiresAt);
        }
        
        // Dispatch login event
        window.dispatchEvent(new CustomEvent('auth:login', {
            detail: { user }
        }));
    },
    
    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },
    
    /**
     * Get current user data
     * @returns {Object|null} User data or null if not authenticated
     */
    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },
    
    /**
     * Update user profile
     * @param {Object} userData Updated user data
     * @returns {Promise} Promise that resolves when update is complete
     */
    async updateProfile(userData) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required');
        }
        
        try {
            const response = await fetch(`${this.apiUrl}?action=updateProfile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Profile update failed');
            }
            
            // Update stored user data
            const currentUser = this.getCurrentUser();
            const updatedUser = { ...currentUser, ...data.user };
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            
            return updatedUser;
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    },
    
    /**
     * Initialize authentication state
     * Should be called when the application starts
     * @returns {Promise} Promise that resolves when initialization is complete
     */
    async init() {
        // Check if token exists and verify it
        if (this.isAuthenticated()) {
            try {
                await this.verifyToken();
            } catch (error) {
                console.error('Token verification failed during init:', error);
                this.logout();
            }
        }
        
        // Set up authentication state change listeners
        this.setupAuthListeners();
        
        return this.isAuthenticated();
    },
    
    /**
     * Set up authentication state change listeners
     */
    setupAuthListeners() {
        window.addEventListener('auth:login', () => {
            // Update UI elements based on authentication state
            document.body.classList.add('is-authenticated');
            this.updateAuthUI(true);
        });
        
        window.addEventListener('auth:logout', () => {
            document.body.classList.remove('is-authenticated');
            this.updateAuthUI(false);
        });
        
        // Initial UI update
        this.updateAuthUI(this.isAuthenticated());
    },
    
    /**
     * Update UI elements based on authentication state
     * @param {boolean} isAuthenticated Whether user is authenticated
     */
    updateAuthUI(isAuthenticated) {
        // Update user menu
        const userMenu = document.querySelector('.user-menu');
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userMenu && userMenuToggle && userDropdown) {
            if (isAuthenticated) {
                const user = this.getCurrentUser();
                
                // Update user avatar if available
                if (user && user.avatar) {
                    userMenuToggle.innerHTML = `
                        <img src="${user.avatar}" alt="${user.username}" class="user-avatar">
                    `;
                }
                
                // Update dropdown items
                userDropdown.innerHTML = `
                    <a href="profile.html" class="dropdown-item">
                        <i class="fas fa-user"></i> My Profile
                    </a>
                    <a href="watchlist.html" class="dropdown-item">
                        <i class="fas fa-bookmark"></i> My Watchlist
                    </a>
                    <a href="settings.html" class="dropdown-item">
                        <i class="fas fa-cog"></i> Settings
                    </a>
                    <button id="logout-btn" class="dropdown-item">
                        <i class="fas fa-sign-out-alt"></i> Log Out
                    </button>
                `;
                
                // Add logout button handler
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => this.logout());
                }
            } else {
                // Reset to default state for non-authenticated users
                userMenuToggle.innerHTML = '<i class="fas fa-user-circle"></i>';
                
                userDropdown.innerHTML = `
                    <a href="signin.html" class="dropdown-item">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </a>
                    <a href="signin.html?register=true" class="dropdown-item">
                        <i class="fas fa-user-plus"></i> Register
                    </a>
                `;
            }
        }
        
        // Update other authenticated-only elements
        const authElements = document.querySelectorAll('.auth-only');
        const guestElements = document.querySelectorAll('.guest-only');
        
        authElements.forEach(el => {
            el.style.display = isAuthenticated ? '' : 'none';
        });
        
        guestElements.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : '';
        });
    }
};

// Initialize authentication when document loads
document.addEventListener('DOMContentLoaded', () => {
    Auth.init().catch(error => {
        console.error('Authentication initialization failed:', error);
    });
});