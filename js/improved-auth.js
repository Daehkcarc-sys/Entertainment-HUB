/**
 * Authentication utilities for Entertainment Hub
 * Handles user login, registration, and session management on the frontend
 */

const Auth = {
  /**
   * Base API URL for authentication endpoints
   */
  apiUrl: "../api/auth.php",

  /**
   * Login with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise} Promise that resolves to user data or rejects with error
   */
  async login(email, password) {
    try {
      // Validate inputs before sending to server
      if (!this.validateEmail(email)) {
        throw new Error("Invalid email format")
      }

      if (!password || password.length < 8) {
        throw new Error("Password must be at least 8 characters")
      }

      const response = await fetch(`${this.apiUrl}?action=login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCsrfToken(), // Add CSRF protection
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        credentials: "include", // Include cookies for session management
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Store authentication data
      this.setSession(data.token, data.user)

      // Log successful login for analytics
      this.logActivity("login_success")

      return data.user
    } catch (error) {
      // Log failed login attempt
      this.logActivity("login_failed", { error: error.message })
      console.error("Login failed:", error)
      throw error
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
      // Validate inputs before sending to server
      if (!username || username.length < 3) {
        throw new Error("Username must be at least 3 characters")
      }

      if (!this.validateEmail(email)) {
        throw new Error("Invalid email format")
      }

      if (!this.validatePassword(password)) {
        throw new Error("Password must be at least 8 characters and include a number and special character")
      }

      const response = await fetch(`${this.apiUrl}?action=register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCsrfToken(), // Add CSRF protection
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
        credentials: "include", // Include cookies for session management
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // If registration requires email verification
      if (data.success && !data.token && data.message) {
        // Log email verification event
        this.logActivity("registration_verification_sent")
        return {
          success: true,
          requireVerification: true,
          message: data.message
        }
      }

      // Store authentication data if immediate login is allowed
      if (data.token) {
        this.setSession(data.token, data.user, data.tokenExpires, data.refreshToken)
        // Log successful registration for analytics
        this.logActivity("registration_success")
      }

      return data
    } catch (error) {
      // Log failed registration attempt
      this.logActivity("registration_failed", { error: error.message })
      console.error("Registration failed:", error)
      throw error
    }
  },

  /**
   * Verify authentication token
   * @returns {Promise} Promise that resolves to user data if authenticated
   */
  async verifyToken() {
    const token = localStorage.getItem("authToken")
    if (!token) {
      return null
    }

    try {
      const response = await fetch(`${this.apiUrl}?action=verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": this.getCsrfToken(), // Add CSRF protection
        },
        credentials: "include", // Include cookies for session management
      })

      const data = await response.json()

      if (!response.ok) {
        this.logout()
        throw new Error(data.error || "Token verification failed")
      }

      // Check token expiration
      if (data.tokenExpires && new Date(data.tokenExpires) < new Date()) {
        this.refreshToken()
        return null
      }

      // Update stored user data
      localStorage.setItem("userData", JSON.stringify(data.user))

      return data.user
    } catch (error) {
      console.error("Token verification failed:", error)
      this.logout()
      return null
    }
  },

  /**
   * Refresh authentication token
   * @returns {Promise} Promise that resolves when token is refreshed
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) {
      this.logout()
      return null
    }

    try {
      const response = await fetch(`${this.apiUrl}?action=refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCsrfToken(), // Add CSRF protection
        },
        body: JSON.stringify({
          refreshToken,
        }),
        credentials: "include", // Include cookies for session management
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Token refresh failed")
      }

      // Store new tokens
      this.setSession(data.token, data.user, data.tokenExpires, data.refreshToken)

      return data.user
    } catch (error) {
      console.error("Token refresh failed:", error)
      this.logout()
      return null
    }
  },

  /**
   * Logout current user
   * @returns {Promise} Promise that resolves when logout is complete
   */
  async logout() {
    const token = localStorage.getItem("authToken")
    if (token) {
      try {
        await fetch(`${this.apiUrl}?action=logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CSRF-Token": this.getCsrfToken(), // Add CSRF protection
          },
          credentials: "include", // Include cookies for session management
        })

        // Log logout for analytics
        this.logActivity("logout_success")
      } catch (error) {
        console.error("Logout API call failed:", error)
      }
    }

    // Clear local authentication data
    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userData")
    localStorage.removeItem("tokenExpires")

    // Dispatch logout event
    window.dispatchEvent(new CustomEvent("auth:logout"))
  },

  /**
   * Set authentication session
   * @param {string} token Authentication token
   * @param {Object} user User data
   * @param {string} expiresAt Expiration timestamp
   * @param {string} refreshToken Refresh token
   */
  setSession(token, user, expiresAt, refreshToken) {
    localStorage.setItem("authToken", token)
    localStorage.setItem("userData", JSON.stringify(user))

    if (expiresAt) {
      localStorage.setItem("tokenExpires", expiresAt)
    }

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken)
    }

    // Dispatch login event
    window.dispatchEvent(
      new CustomEvent("auth:login", {
        detail: { user },
      }),
    )
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem("authToken")
    const expires = localStorage.getItem("tokenExpires")

    if (!token) {
      return false
    }

    // Check if token is expired
    if (expires && new Date(expires) < new Date()) {
      // Token is expired, try to refresh
      this.refreshToken()
      return false
    }

    return true
  },

  /**
   * Get current user data
   * @returns {Object|null} User data or null if not authenticated
   */
  getCurrentUser() {
    const userData = localStorage.getItem("userData")
    return userData ? JSON.parse(userData) : null
  },

  /**
   * Update user profile
   * @param {Object} userData Updated user data
   * @returns {Promise} Promise that resolves when update is complete
   */
  async updateProfile(userData) {
    const token = localStorage.getItem("authToken")
    if (!token) {
      throw new Error("Authentication required")
    }

    try {
      // Validate inputs
      if (userData.email && !this.validateEmail(userData.email)) {
        throw new Error("Invalid email format")
      }

      const response = await fetch(`${this.apiUrl}?action=updateProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": this.getCsrfToken(), // Add CSRF protection
        },
        body: JSON.stringify(userData),
        credentials: "include", // Include cookies for session management
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Profile update failed")
      }

      // Update stored user data
      const currentUser = this.getCurrentUser()
      const updatedUser = { ...currentUser, ...data.user }
      localStorage.setItem("userData", JSON.stringify(updatedUser))

      // Log profile update for analytics
      this.logActivity("profile_update_success")

      return updatedUser
    } catch (error) {
      // Log failed profile update
      this.logActivity("profile_update_failed", { error: error.message })
      console.error("Profile update failed:", error)
      throw error
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
        await this.verifyToken()
      } catch (error) {
        console.error("Token verification failed during init:", error)
        this.logout()
      }
    }

    // Set up authentication state change listeners
    this.setupAuthListeners()

    return this.isAuthenticated()
  },

  /**
   * Set up authentication state change listeners
   */
  setupAuthListeners() {
    window.addEventListener("auth:login", () => {
      // Update UI elements based on authentication state
      document.body.classList.add("is-authenticated")
      this.updateAuthUI(true)
    })

    window.addEventListener("auth:logout", () => {
      document.body.classList.remove("is-authenticated")
      this.updateAuthUI(false)
    })

    // Initial UI update
    this.updateAuthUI(this.isAuthenticated())
  },

  /**
   * Update UI elements based on authentication state
   * @param {boolean} isAuthenticated Whether user is authenticated
   */
  updateAuthUI(isAuthenticated) {
    // Update user menu
    const userMenu = document.querySelector(".user-menu")
    const userMenuToggle = document.querySelector(".user-menu-toggle")
    const userDropdown = document.querySelector(".user-dropdown")

    if (userMenu && userMenuToggle && userDropdown) {
      if (isAuthenticated) {
        const user = this.getCurrentUser()

        // Update user avatar if available
        if (user && user.avatar) {
          userMenuToggle.innerHTML = `
                        <img src="${this.sanitizeUrl(user.avatar)}" alt="${this.escapeHtml(user.username)}" class="user-avatar">
                    `
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
                `

        // Add logout button handler
        const logoutBtn = document.getElementById("logout-btn")
        if (logoutBtn) {
          logoutBtn.addEventListener("click", () => this.logout())
        }
      } else {
        // Reset to default state for non-authenticated users
        userMenuToggle.innerHTML = '<i class="fas fa-user-circle"></i>'

        userDropdown.innerHTML = `
                    <a href="signin.html" class="dropdown-item">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </a>
                    <a href="signin.html?register=true" class="dropdown-item">
                        <i class="fas fa-user-plus"></i> Register
                    </a>
                `
      }
    }

    // Update other authenticated-only elements
    const authElements = document.querySelectorAll(".auth-only")
    const guestElements = document.querySelectorAll(".guest-only")

    authElements.forEach((el) => {
      el.style.display = isAuthenticated ? "" : "none"
    })

    guestElements.forEach((el) => {
      el.style.display = isAuthenticated ? "none" : ""
    })
  },

  /**
   * Get CSRF token from meta tag
   * @returns {string} CSRF token
   */
  getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    return metaTag ? metaTag.getAttribute("content") : ""
  },

  /**
   * Validate email format
   * @param {string} email Email to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase())
  },

  /**
   * Validate password strength
   * @param {string} password Password to validate
   * @returns {boolean} True if valid
   */
  validatePassword(password) {
    // At least 8 characters, 1 number, 1 uppercase, 1 lowercase, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return re.test(password)
  },

  /**
   * Log user activity for analytics
   * @param {string} action Action name
   * @param {Object} data Additional data
   */
  logActivity(action, data = {}) {
    // In a real app, this would send data to an analytics endpoint
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Activity] ${action}`, data)
    }

    // Send to analytics endpoint
    try {
      fetch("../api/analytics.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          timestamp: new Date().toISOString(),
          userId: this.getCurrentUser()?.id || "guest",
          data,
        }),
        keepalive: true, // Allow request to complete even if page is unloaded
      })
    } catch (error) {
      console.error("Failed to log activity:", error)
    }
  },

  /**
   * Sanitize URL to prevent XSS
   * @param {string} url URL to sanitize
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    if (!url) return ""

    try {
      const parsed = new URL(url, window.location.origin)
      // Only allow http and https protocols
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return ""
      }
      return parsed.href
    } catch (e) {
      return ""
    }
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} html HTML to escape
   * @returns {string} Escaped HTML
   */
  escapeHtml(html) {
    if (!html) return ""

    const div = document.createElement("div")
    div.textContent = html
    return div.innerHTML
  },
}

// Initialize authentication when document loads
document.addEventListener("DOMContentLoaded", () => {
  Auth.init().catch((error) => {
    console.error("Authentication initialization failed:", error)
  })
})
