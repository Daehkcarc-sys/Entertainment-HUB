/**
 * Data Handling Module for Entertainment Hub
 * Provides centralized data fetching, caching, and state management
 */

const DataHandler = {
  // Base API URL
  apiUrl: "../api",

  // Cache storage
  cache: new Map(),

  // Cache expiration times (in milliseconds)
  cacheExpiration: {
    trending: 5 * 60 * 1000, // 5 minutes
    content: 15 * 60 * 1000, // 15 minutes
    user: 2 * 60 * 1000, // 2 minutes
    search: 10 * 60 * 1000, // 10 minutes
  },

  /**
   * Fetch data from API with caching
   * @param {string} endpoint API endpoint
   * @param {Object} options Fetch options
   * @param {string} cacheKey Cache key
   * @param {number} expiration Cache expiration time
   * @returns {Promise} Promise that resolves to data
   */
  async fetchData(endpoint, options = {}, cacheKey = null, expiration = null) {
    // Generate cache key if not provided
    const key = cacheKey || `${endpoint}:${JSON.stringify(options)}`

    // Check cache first
    const cachedData = this.getFromCache(key)
    if (cachedData) {
      return cachedData
    }

    try {
      // Add CSRF token to headers
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Add auth token if available
      const authToken = localStorage.getItem("authToken")
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`
      }

      // Add CSRF token if available
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken
      }

      // Make the request
      const response = await fetch(`${this.apiUrl}/${endpoint}`, {
        ...options,
        headers,
        credentials: "include", // Include cookies for session management
      })

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache the response
      this.saveToCache(key, data, expiration)

      return data
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      throw error
    }
  },

  /**
   * Get trending content
   * @param {string} category Content category
   * @param {string} period Time period
   * @param {number} limit Number of items to fetch
   * @returns {Promise} Promise that resolves to trending content
   */
  async getTrending(category = "all", period = "week", limit = 10) {
    const cacheKey = `trending:${category}:${period}:${limit}`
    return this.fetchData(
      `trending.php?category=${category}&period=${period}&limit=${limit}`,
      { method: "GET" },
      cacheKey,
      this.cacheExpiration.trending,
    )
  },

  /**
   * Get content details
   * @param {string} id Content ID
   * @param {string} type Content type
   * @returns {Promise} Promise that resolves to content details
   */
  async getContentDetails(id, type) {
    const cacheKey = `content:${type}:${id}`
    return this.fetchData(
      `content.php?id=${id}&type=${type}`,
      { method: "GET" },
      cacheKey,
      this.cacheExpiration.content,
    )
  },

  /**
   * Search content
   * @param {string} query Search query
   * @param {Object} filters Search filters
   * @returns {Promise} Promise that resolves to search results
   */
  async searchContent(query, filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      q: query,
      ...filters,
    }).toString()

    const cacheKey = `search:${queryParams}`
    return this.fetchData(`search.php?${queryParams}`, { method: "GET" }, cacheKey, this.cacheExpiration.search)
  },

  /**
   * Get user watchlist
   * @param {string} userId User ID
   * @returns {Promise} Promise that resolves to user watchlist
   */
  async getUserWatchlist(userId) {
    const cacheKey = `watchlist:${userId}`
    return this.fetchData(`watchlist.php?userId=${userId}`, { method: "GET" }, cacheKey, this.cacheExpiration.user)
  },

  /**
   * Add item to watchlist
   * @param {string} contentId Content ID
   * @param {string} contentType Content type
   * @returns {Promise} Promise that resolves when item is added
   */
  async addToWatchlist(contentId, contentType) {
    const userId = JSON.parse(localStorage.getItem("userData"))?.id
    if (!userId) {
      throw new Error("User not authenticated")
    }

    const result = await this.fetchData("watchlist.php", {
      method: "POST",
      body: JSON.stringify({
        action: "add",
        userId,
        contentId,
        contentType,
      }),
    })

    // Invalidate watchlist cache
    this.removeFromCache(`watchlist:${userId}`)

    return result
  },

  /**
   * Remove item from watchlist
   * @param {string} contentId Content ID
   * @param {string} contentType Content type
   * @returns {Promise} Promise that resolves when item is removed
   */
  async removeFromWatchlist(contentId, contentType) {
    const userId = JSON.parse(localStorage.getItem("userData"))?.id
    if (!userId) {
      throw new Error("User not authenticated")
    }

    const result = await this.fetchData("watchlist.php", {
      method: "POST",
      body: JSON.stringify({
        action: "remove",
        userId,
        contentId,
        contentType,
      }),
    })

    // Invalidate watchlist cache
    this.removeFromCache(`watchlist:${userId}`)

    return result
  },

  /**
   * Submit rating for content
   * @param {string} contentId Content ID
   * @param {string} contentType Content type
   * @param {number} rating Rating value
   * @param {string} review Review text
   * @returns {Promise} Promise that resolves when rating is submitted
   */
  async submitRating(contentId, contentType, rating, review = "") {
    const userId = JSON.parse(localStorage.getItem("userData"))?.id
    if (!userId) {
      throw new Error("User not authenticated")
    }

    return this.fetchData("ratings.php", {
      method: "POST",
      body: JSON.stringify({
        userId,
        contentId,
        contentType,
        rating,
        review,
      }),
    })
  },

  /**
   * Get leaderboard data
   * @param {string} category Content category
   * @param {string} period Time period
   * @param {number} limit Number of items to fetch
   * @returns {Promise} Promise that resolves to leaderboard data
   */
  async getLeaderboard(category = "all", period = "all-time", limit = 10) {
    const cacheKey = `leaderboard:${category}:${period}:${limit}`
    return this.fetchData(
      `leaderboard.php?category=${category}&period=${period}&limit=${limit}`,
      { method: "GET" },
      cacheKey,
      this.cacheExpiration.trending,
    )
  },

  /**
   * Save data to cache
   * @param {string} key Cache key
   * @param {*} data Data to cache
   * @param {number} expiration Expiration time in milliseconds
   */
  saveToCache(key, data, expiration = null) {
    const expirationTime = expiration || this.cacheExpiration.content
    const expires = Date.now() + expirationTime

    this.cache.set(key, {
      data,
      expires,
    })

    // Also save to sessionStorage for persistence across page loads
    try {
      sessionStorage.setItem(
        `cache:${key}`,
        JSON.stringify({
          data,
          expires,
        }),
      )
    } catch (e) {
      console.warn("Failed to save to sessionStorage:", e)
    }
  },

  /**
   * Get data from cache
   * @param {string} key Cache key
   * @returns {*} Cached data or null if not found or expired
   */
  getFromCache(key) {
    // Try memory cache first
    let cached = this.cache.get(key)

    // If not in memory, try sessionStorage
    if (!cached) {
      try {
        const storedCache = sessionStorage.getItem(`cache:${key}`)
        if (storedCache) {
          cached = JSON.parse(storedCache)
          // Restore to memory cache
          this.cache.set(key, cached)
        }
      } catch (e) {
        console.warn("Failed to read from sessionStorage:", e)
      }
    }

    // Check if cache exists and is not expired
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    // Remove expired cache
    if (cached) {
      this.removeFromCache(key)
    }

    return null
  },

  /**
   * Remove data from cache
   * @param {string} key Cache key
   */
  removeFromCache(key) {
    this.cache.delete(key)

    try {
      sessionStorage.removeItem(`cache:${key}`)
    } catch (e) {
      console.warn("Failed to remove from sessionStorage:", e)
    }
  },

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear()

    try {
      // Only clear our cache keys, not all sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("cache:")) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn("Failed to clear sessionStorage:", e)
    }
  },

  /**
   * Initialize data handler
   */
  init() {
    // Load cache from sessionStorage
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("cache:")) {
          const cacheKey = key.substring(6) // Remove 'cache:' prefix
          const cached = JSON.parse(sessionStorage.getItem(key))

          // Only restore if not expired
          if (cached && cached.expires > Date.now()) {
            this.cache.set(cacheKey, cached)
          } else {
            // Remove expired cache
            sessionStorage.removeItem(key)
          }
        }
      })
    } catch (e) {
      console.warn("Failed to initialize cache from sessionStorage:", e)
    }

    // Set up cache cleanup interval
    setInterval(
      () => {
        this.cleanupCache()
      },
      5 * 60 * 1000,
    ) // Clean up every 5 minutes
  },

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now()

    // Clean memory cache
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key)
      }
    }

    // Clean sessionStorage cache
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("cache:")) {
          try {
            const cached = JSON.parse(sessionStorage.getItem(key))
            if (cached && cached.expires <= now) {
              sessionStorage.removeItem(key)
            }
          } catch (e) {
            // Invalid JSON, remove the item
            sessionStorage.removeItem(key)
          }
        }
      })
    } catch (e) {
      console.warn("Failed to clean up sessionStorage cache:", e)
    }
  },
}

// Initialize data handler when document loads
document.addEventListener("DOMContentLoaded", () => {
  DataHandler.init()

  // Make available globally  () => {
  DataHandler.init()

  // Make available globally
  window.DataHandler = DataHandler
})
