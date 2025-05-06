/**
 * Error Handling Module for Entertainment Hub
 * Provides centralized error handling, logging, and recovery
 */

// Declare showNotification (assuming it's a global function or imported elsewhere)
// For demonstration purposes, we'll define a dummy function.
// In a real application, you would either import it or ensure it's globally available.
const showNotification = (message, type, duration) => {
  console.log(`Notification: ${message} (Type: ${type}, Duration: ${duration})`)
}

// Declare Auth (assuming it's a global object or imported elsewhere)
// For demonstration purposes, we'll define a dummy object.
// In a real application, you would either import it or ensure it's globally available.
const Auth = {
  refreshToken: () => {
    return new Promise((resolve, reject) => {
      console.log("Refreshing token...")
      // Simulate token refresh success/failure
      setTimeout(() => {
        //resolve(); // Simulate success
        reject() // Simulate failure
      }, 1000)
    })
  },
}

const ErrorHandler = {
  // Error types
  errorTypes: {
    NETWORK: "network_error",
    API: "api_error",
    AUTHENTICATION: "auth_error",
    VALIDATION: "validation_error",
    RUNTIME: "runtime_error",
    RESOURCE: "resource_error",
  },

  // Error log
  errorLog: [],

  // Maximum number of errors to keep in memory
  maxLogSize: 50,

  /**
   * Initialize error handling
   */
  init() {
    this.setupGlobalErrorHandling()
    this.setupNetworkErrorHandling()
    this.setupConsoleErrorHandling()

    // Load previous errors from sessionStorage
    this.loadErrorLog()
  },

  /**
   * Set up global error handling
   */
  setupGlobalErrorHandling() {
    // Handle uncaught exceptions
    window.addEventListener("error", (event) => {
      this.handleError({
        type: this.errorTypes.RUNTIME,
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
      })

      // Don't prevent default to allow browser's default error handling
      return false
    })

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError({
        type: this.errorTypes.RUNTIME,
        message: event.reason?.message || "Unhandled Promise Rejection",
        error: event.reason,
        timestamp: new Date().toISOString(),
      })

      // Don't prevent default
      return false
    })
  },

  /**
   * Set up network error handling
   */
  setupNetworkErrorHandling() {
    // Override fetch to catch network errors
    const originalFetch = window.fetch
    window.fetch = async (url, options = {}) => {
      try {
        const response = await originalFetch(url, options)

        // Handle API errors (4xx, 5xx)
        if (!response.ok) {
          let errorData
          try {
            errorData = await response.clone().json()
          } catch (e) {
            errorData = { message: "Unknown API error" }
          }

          this.handleError({
            type: this.errorTypes.API,
            message: errorData.message || `API Error: ${response.status} ${response.statusText}`,
            status: response.status,
            url: url.toString(),
            method: options.method || "GET",
            timestamp: new Date().toISOString(),
          })
        }

        return response
      } catch (error) {
        // Handle network errors
        this.handleError({
          type: this.errorTypes.NETWORK,
          message: error.message || "Network request failed",
          url: url.toString(),
          method: options.method || "GET",
          error,
          timestamp: new Date().toISOString(),
        })

        throw error
      }
    }
  },

  /**
   * Set up console error handling
   */
  setupConsoleErrorHandling() {
    // Override console.error to log errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args)

      // Log the error
      const errorMessage = args
        .map((arg) => {
          if (arg instanceof Error) {
            return arg.message
          } else if (typeof arg === "object") {
            try {
              return JSON.stringify(arg)
            } catch (e) {
              return String(arg)
            }
          } else {
            return String(arg)
          }
        })
        .join(" ")

      this.handleError({
        type: this.errorTypes.RUNTIME,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      })
    }
  },

  /**
   * Handle an error
   * @param {Object} errorInfo Error information
   */
  handleError(errorInfo) {
    // Add to error log
    this.errorLog.unshift(errorInfo)

    // Trim log if it gets too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Save to sessionStorage
    this.saveErrorLog()

    // Send to server if in production
    if (process.env.NODE_ENV === "production") {
      this.reportErrorToServer(errorInfo)
    }

    // Show user notification for critical errors
    if (this.isCriticalError(errorInfo)) {
      this.showErrorNotification(errorInfo)
    }

    // Attempt recovery based on error type
    this.attemptRecovery(errorInfo)
  },

  /**
   * Check if an error is critical
   * @param {Object} errorInfo Error information
   * @returns {boolean} True if critical
   */
  isCriticalError(errorInfo) {
    // Network errors are critical
    if (errorInfo.type === this.errorTypes.NETWORK) {
      return true
    }

    // API server errors are critical
    if (errorInfo.type === this.errorTypes.API && errorInfo.status >= 500) {
      return true
    }

    // Authentication errors that aren't 401 are critical
    if (errorInfo.type === this.errorTypes.AUTHENTICATION && errorInfo.status !== 401) {
      return true
    }

    // Resource errors are critical
    if (errorInfo.type === this.errorTypes.RESOURCE) {
      return true
    }

    return false
  },

  /**
   * Show error notification to user
   * @param {Object} errorInfo Error information
   */
  showErrorNotification(errorInfo) {
    // Check if notification function exists
    if (typeof showNotification === "function") {
      let message = "An error occurred. Please try again later."

      // Customize message based on error type
      switch (errorInfo.type) {
        case this.errorTypes.NETWORK:
          message = "Network connection issue. Please check your internet connection."
          break
        case this.errorTypes.API:
          if (errorInfo.status >= 500) {
            message = "Server error. Our team has been notified."
          }
          break
        case this.errorTypes.AUTHENTICATION:
          message = "Authentication error. Please sign in again."
          break
        case this.errorTypes.RESOURCE:
          message = "Failed to load a resource. Please refresh the page."
          break
      }

      showNotification(message, "error", 10000)
    } else {
      // Fallback to alert for critical errors if showNotification isn't available
      if (this.isCriticalError(errorInfo)) {
        alert("An error occurred. Please try again later.")
      }
    }
  },

  /**
   * Attempt to recover from error
   * @param {Object} errorInfo Error information
   */
  attemptRecovery(errorInfo) {
    switch (errorInfo.type) {
      case this.errorTypes.NETWORK:
        // For network errors, we can try to detect when connection is restored
        window.addEventListener("online", this.handleConnectionRestored)
        break

      case this.errorTypes.AUTHENTICATION:
        // For auth errors, we might need to refresh the token or redirect to login
        if (errorInfo.status === 401) {
          // Try to refresh token
          if (typeof Auth !== "undefined" && typeof Auth.refreshToken === "function") {
            Auth.refreshToken().catch(() => {
              // If refresh fails, redirect to login
              window.location.href = "signin.html"
            })
          } else {
            // No Auth module, redirect to login
            window.location.href = "signin.html"
          }
        }
        break

      case this.errorTypes.RESOURCE:
        // For resource errors, we can try to reload the resource
        if (errorInfo.element && errorInfo.element.tagName === "IMG") {
          // Try to reload the image with a fallback
          errorInfo.element.src = "images/placeholder.jpg"
        }
        break
    }
  },

  /**
   * Handle connection restored
   */
  handleConnectionRestored() {
    // Remove the event listener
    window.removeEventListener("online", ErrorHandler.handleConnectionRestored)

    // Show notification
    if (typeof showNotification === "function") {
      showNotification("Connection restored!", "success")
    }

    // Reload current page data
    window.location.reload()
  },

  /**
   * Report error to server
   * @param {Object} errorInfo Error information
   */
  reportErrorToServer(errorInfo) {
    // Don't report validation errors
    if (errorInfo.type === this.errorTypes.VALIDATION) {
      return
    }

    // Add user and session information
    const errorData = {
      ...errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")).id : "guest",
    }

    // Send to server
    fetch("../api/error-log.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
      // Allow request to complete even if page is unloaded
      keepalive: true,
    }).catch(() => {
      // If reporting fails, store for later
      this.storeErrorForLaterReporting(errorData)
    })
  },

  /**
   * Store error for later reporting
   * @param {Object} errorData Error data
   */
  storeErrorForLaterReporting(errorData) {
    try {
      // Get stored errors
      const storedErrors = JSON.parse(localStorage.getItem("pendingErrorReports") || "[]")

      // Add new error
      storedErrors.push(errorData)

      // Limit number of stored errors
      if (storedErrors.length > 20) {
        storedErrors.splice(0, storedErrors.length - 20)
      }

      // Save back to localStorage
      localStorage.setItem("pendingErrorReports", JSON.stringify(storedErrors))
    } catch (e) {
      // If localStorage fails, we can't do much
      console.warn("Failed to store error for later reporting:", e)
    }
  },

  /**
   * Send pending error reports
   */
  sendPendingErrorReports() {
    try {
      // Get stored errors
      const storedErrors = JSON.parse(localStorage.getItem("pendingErrorReports") || "[]")

      if (storedErrors.length === 0) {
        return
      }

      // Send to server
      fetch("../api/error-log-batch.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ errors: storedErrors }),
      })
        .then((response) => {
          if (response.ok) {
            // Clear stored errors
            localStorage.removeItem("pendingErrorReports")
          }
        })
        .catch(() => {
          // Keep errors for next attempt
        })
    } catch (e) {
      console.warn("Failed to send pending error reports:", e)
    }
  },

  /**
   * Save error log to sessionStorage
   */
  saveErrorLog() {
    try {
      sessionStorage.setItem("errorLog", JSON.stringify(this.errorLog))
    } catch (e) {
      console.warn("Failed to save error log to sessionStorage:", e)
    }
  },

  /**
   * Load error log from sessionStorage
   */
  loadErrorLog() {
    try {
      const storedLog = sessionStorage.getItem("errorLog")
      if (storedLog) {
        this.errorLog = JSON.parse(storedLog)
      }
    } catch (e) {
      console.warn("Failed to load error log from sessionStorage:", e)
    }
  },

  /**
   * Get error log
   * @returns {Array} Error log
   */
  getErrorLog() {
    return [...this.errorLog]
  },

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = []
    this.saveErrorLog()
  },
}

// Initialize error handling when document loads
document.addEventListener("DOMContentLoaded", () => {
  ErrorHandler.init()

  // Try to send any pending error reports
  ErrorHandler.sendPendingErrorReports()

  // Make error handler available globally
  window.ErrorHandler = ErrorHandler

  // Add error handling for resource loading
  document.querySelectorAll('img, video, audio, script, link[rel="stylesheet"]').forEach((element) => {
    element.addEventListener("error", (event) => {
      ErrorHandler.handleError({
        type: ErrorHandler.errorTypes.RESOURCE,
        message: `Failed to load resource: ${element.src || element.href}`,
        element: element,
        timestamp: new Date().toISOString(),
      })
    })
  })
})
