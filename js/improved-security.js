/**
 * Security Module for Entertainment Hub
 * Implements security best practices for client-side code
 */

const Security = {
  /**
   * Initialize security features
   */
  init() {
    this.setupCSRFProtection()
    this.setupContentSecurityPolicy()
    this.setupXSSProtection()
    this.monitorForVulnerabilities()
  },

  /**
   * Set up CSRF protection
   */
  setupCSRFProtection() {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")

    if (!csrfToken) {
      console.warn("CSRF token not found. CSRF protection is not active.")
      return
    }

    // Add CSRF token to all fetch/XHR requests
    const originalFetch = window.fetch
    window.fetch = function (url, options = {}) {
      options = options || {}
      options.headers = options.headers || {}

      // Only add CSRF token to same-origin requests
      const isSameOrigin = url.startsWith("/") || url.startsWith(window.location.origin)
      if (isSameOrigin) {
        options.headers["X-CSRF-Token"] = csrfToken
      }

      return originalFetch.call(this, url, options)
    }

    // Also protect XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (method, url) {
      const isSameOrigin = url.startsWith("/") || url.startsWith(window.location.origin)

      this.addEventListener("readystatechange", function () {
        if (this.readyState === 1 && isSameOrigin) {
          this.setRequestHeader("X-CSRF-Token", csrfToken)
        }
      })

      originalOpen.apply(this, arguments)
    }
  },

  /**
   * Set up Content Security Policy
   */
  setupContentSecurityPolicy() {
    // This would normally be set server-side, but we can check if it's properly configured
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')

    if (!cspMeta) {
      console.warn("Content Security Policy meta tag not found. Consider adding CSP for enhanced security.")
    }
  },

  /**
   * Set up XSS protection
   */
  setupXSSProtection() {
    // Sanitize HTML helper function
    window.sanitizeHTML = (html) => {
      const temp = document.createElement("div")
      temp.textContent = html
      return temp.innerHTML
    }

    // Sanitize URL helper function
    window.sanitizeURL = (url) => {
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
    }

    // Declare DOMPurify if it's not already available
    const DOMPurify = window.DOMPurify
    if (typeof DOMPurify === "undefined") {
      console.warn("DOMPurify is not available. XSS protection might be limited.")
    }

    // Override innerHTML to sanitize content
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML")
    Object.defineProperty(Element.prototype, "innerHTML", {
      set(value) {
        // Only sanitize in production
        if (process.env.NODE_ENV === "production") {
          const sanitized = DOMPurify ? DOMPurify.sanitize(value) : value
          originalInnerHTML.set.call(this, sanitized)
        } else {
          originalInnerHTML.set.call(this, value)
        }
      },
      get() {
        return originalInnerHTML.get.call(this)
      },
    })
  },

  /**
   * Monitor for common security vulnerabilities
   */
  monitorForVulnerabilities() {
    // Check for insecure password fields
    const passwordFields = document.querySelectorAll('input[type="password"]')
    passwordFields.forEach((field) => {
      const form = field.closest("form")
      if (form && !form.getAttribute("action").startsWith("https:")) {
        console.warn("Password field found in non-HTTPS form. This is insecure.")
      }
    })

    // Check for missing security headers
    fetch(window.location.href, { method: "HEAD" })
      .then((response) => {
        const securityHeaders = [
          "Content-Security-Policy",
          "X-Content-Type-Options",
          "X-Frame-Options",
          "X-XSS-Protection",
        ]

        const missingHeaders = securityHeaders.filter((header) => !response.headers.get(header))

        if (missingHeaders.length > 0) {
          console.warn("Missing security headers:", missingHeaders.join(", "))
        }
      })
      .catch((error) => {
        console.error("Failed to check security headers:", error)
      })
  },

  /**
   * Validate form inputs
   * @param {HTMLFormElement} form Form to validate
   * @returns {boolean} True if valid
   */
  validateForm(form) {
    const inputs = form.querySelectorAll("input, textarea, select")
    let isValid = true

    inputs.forEach((input) => {
      // Skip disabled or hidden inputs
      if (input.disabled || input.type === "hidden") {
        return
      }

      // Clear previous error messages
      const errorElement = input.nextElementSibling
      if (errorElement && errorElement.classList.contains("error-message")) {
        errorElement.remove()
      }

      // Validate required fields
      if (input.required && !input.value.trim()) {
        this.showInputError(input, "This field is required")
        isValid = false
        return
      }

      // Validate email fields
      if (input.type === "email" && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(input.value.trim())) {
          this.showInputError(input, "Please enter a valid email address")
          isValid = false
          return
        }
      }

      // Validate password fields
      if (input.type === "password" && input.dataset.validateStrength === "true") {
        const password = input.value.trim()
        if (password.length < 8) {
          this.showInputError(input, "Password must be at least 8 characters long")
          isValid = false
          return
        }

        // Check for password strength if required
        if (input.dataset.requireStrong === "true") {
          const hasUppercase = /[A-Z]/.test(password)
          const hasLowercase = /[a-z]/.test(password)
          const hasNumber = /[0-9]/.test(password)
          const hasSpecial = /[^A-Za-z0-9]/.test(password)

          if (!(hasUppercase && hasLowercase && hasNumber && hasSpecial)) {
            this.showInputError(input, "Password must include uppercase, lowercase, number, and special character")
            isValid = false
            return
          }
        }
      }

      // Validate URL fields
      if (input.type === "url" && input.value.trim()) {
        try {
          new URL(input.value)
        } catch (e) {
          this.showInputError(input, "Please enter a valid URL")
          isValid = false
          return
        }
      }

      // Custom validation based on data attributes
      if (input.dataset.validate) {
        const validationType = input.dataset.validate
        const value = input.value.trim()

        switch (validationType) {
          case "username":
            if (value.length < 3) {
              this.showInputError(input, "Username must be at least 3 characters")
              isValid = false
            }
            break
          case "phone":
            const phoneRegex = /^\+?[0-9]{10,15}$/
            if (!phoneRegex.test(value)) {
              this.showInputError(input, "Please enter a valid phone number")
              isValid = false
            }
            break
          case "date":
            const date = new Date(value)
            if (isNaN(date.getTime())) {
              this.showInputError(input, "Please enter a valid date")
              isValid = false
            }
            break
        }
      }
    })

    return isValid
  },

  /**
   * Show error message for input
   * @param {HTMLElement} input Input element
   * @param {string} message Error message
   */
  showInputError(input, message) {
    // Create error message element
    const errorElement = document.createElement("div")
    errorElement.className = "error-message"
    errorElement.textContent = message

    // Insert after input
    input.parentNode.insertBefore(errorElement, input.nextSibling)

    // Add error class to input
    input.classList.add("input-error")

    // Remove error when input changes
    input.addEventListener(
      "input",
      () => {
        if (errorElement.parentNode) {
          errorElement.remove()
        }
        input.classList.remove("input-error")
      },
      { once: true },
    )
  },
}

// Initialize security features when document loads
document.addEventListener("DOMContentLoaded", () => {
  Security.init()

  // Make validate form method available globally
  window.validateForm = (form) => Security.validateForm(form)

  // Add form validation to all forms
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      if (!Security.validateForm(this)) {
        e.preventDefault()
        e.stopPropagation()
      }
    })
  })
})
