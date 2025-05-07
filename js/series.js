/**
 * Series.js - JavaScript functionality for the series page
 * Handles interactions, animations, and dynamic content loading
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initSeriesCarousel();
    initSeriesTabs();
    initSeriesFilters();
    initSeriesActions();
    
    // Add animation classes to elements on page load
    animateSeriesElements();
});

/**
 * Initialize the carousel component for featured series
 */
function initSeriesCarousel() {
    const carousel = document.querySelector('.series-carousel');
    const slides = document.querySelectorAll('.series-carousel-slide');
    const indicators = document.querySelectorAll('.series-carousel-indicator');
    
    if (!carousel || slides.length === 0) return;
    
    let currentSlide = 0;
    
    // Set up carousel indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Auto-advance carousel
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }, 5000);
    
    function goToSlide(index) {
        carousel.style.transform = `translateX(-${index * 100}%)`;
        
        // Update active indicator
        indicators.forEach(ind => ind.classList.remove('active'));
        indicators[index].classList.add('active');
        
        currentSlide = index;
    }
}

/**
 * Initialize tabs for series content sections
 */
function initSeriesTabs() {
    const tabButtons = document.querySelectorAll('.series-tab-btn');
    const tabContents = document.querySelectorAll('.series-tab-content');
    
    if (tabButtons.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show target content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.getAttribute('id') === target) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * Initialize series filtering and search functionality
 */
function initSeriesFilters() {
    const searchInput = document.querySelector('.series-search-input');
    const genreSelect = document.querySelector('.series-genre-select');
    const sortSelect = document.querySelector('.series-sort-select');
    const seriesCards = document.querySelectorAll('.series-card');
    
    if (!searchInput) return;
    
    // Search functionality
    searchInput.addEventListener('input', filterSeries);
    
    // Filter by genre
    if (genreSelect) {
        genreSelect.addEventListener('change', filterSeries);
    }
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', sortSeries);
    }
    
    function filterSeries() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGenre = genreSelect ? genreSelect.value : 'all';
        
        seriesCards.forEach(card => {
            const title = card.querySelector('.series-title').textContent.toLowerCase();
            const genres = card.getAttribute('data-genres') || '';
            
            const matchesSearch = title.includes(searchTerm);
            const matchesGenre = selectedGenre === 'all' || genres.includes(selectedGenre);
            
            if (matchesSearch && matchesGenre) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    function sortSeries() {
        const sortBy = sortSelect.value;
        const seriesGrid = document.querySelector('.series-grid');
        
        if (!seriesGrid) return;
        
        const cardsArray = Array.from(seriesCards);
        
        cardsArray.sort((a, b) => {
            if (sortBy === 'rating') {
                const ratingA = parseFloat(a.getAttribute('data-rating')) || 0;
                const ratingB = parseFloat(b.getAttribute('data-rating')) || 0;
                return ratingB - ratingA;
            } else if (sortBy === 'title') {
                const titleA = a.querySelector('.series-title').textContent;
                const titleB = b.querySelector('.series-title').textContent;
                return titleA.localeCompare(titleB);
            } else if (sortBy === 'newest') {
                const dateA = new Date(a.getAttribute('data-release') || 0);
                const dateB = new Date(b.getAttribute('data-release') || 0);
                return dateB - dateA;
            }
            return 0;
        });
        
        // Re-append cards in sorted order
        cardsArray.forEach(card => seriesGrid.appendChild(card));
    }
}

/**
 * Initialize interactive actions like save to watchlist, rate, etc.
 */
function initSeriesActions() {
    const watchlistButtons = document.querySelectorAll('.action-button[data-action="watchlist"]');
    const ratingButtons = document.querySelectorAll('.action-button[data-action="rate"]');
    
    // Watchlist functionality
    watchlistButtons.forEach(button => {
        button.addEventListener('click', function() {
            const seriesId = this.closest('.series-card').getAttribute('data-id');
            const isSaved = this.classList.contains('saved');
            
            toggleWatchlist(seriesId, !isSaved);
            
            // Toggle saved state
            this.classList.toggle('saved');
            this.querySelector('i').className = isSaved ? 'fas fa-bookmark' : 'fas fa-bookmark-fill';
            
            // Show notification
            showNotification(isSaved ? 'Removed from watchlist' : 'Added to watchlist');
        });
    });
    
    // Rating functionality
    ratingButtons.forEach(button => {
        button.addEventListener('click', function() {
            const seriesId = this.closest('.series-card').getAttribute('data-id');
            
            // Create and show rating modal
            showRatingModal(seriesId);
        });
    });
}

/**
 * Toggle series in user's watchlist
 * @param {string} seriesId - ID of the series
 * @param {boolean} add - Whether to add (true) or remove (false)
 */
function toggleWatchlist(seriesId, add) {
    // Example implementation - would typically involve an API call
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    if (add) {
        if (!watchlist.includes(seriesId)) {
            watchlist.push(seriesId);
        }
    } else {
        watchlist = watchlist.filter(id => id !== seriesId);
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

/**
 * Display a notification toast
 * @param {string} message - Message to display
 */
function showNotification(message) {
    const notification = document.querySelector('.series-notification');
    
    if (!notification) {
        // Create notification element if it doesn't exist
        const newNotification = document.createElement('div');
        newNotification.className = 'series-notification';
        newNotification.textContent = message;
        document.body.appendChild(newNotification);
        
        setTimeout(() => {
            newNotification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            newNotification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(newNotification);
            }, 500);
        }, 3000);
    } else {
        // Update existing notification
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

/**
 * Show modal for rating series
 * @param {string} seriesId - ID of the series to rate
 */
function showRatingModal(seriesId) {
    // Create modal if it doesn't exist
    let modal = document.querySelector('.rating-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'rating-modal';
        modal.innerHTML = `
            <div class="rating-modal-content">
                <span class="rating-modal-close">&times;</span>
                <h3>Rate this series</h3>
                <div class="rating-stars">
                    <span class="star" data-value="1">★</span>
                    <span class="star" data-value="2">★</span>
                    <span class="star" data-value="3">★</span>
                    <span class="star" data-value="4">★</span>
                    <span class="star" data-value="5">★</span>
                </div>
                <textarea placeholder="Write your review (optional)"></textarea>
                <button class="submit-rating">Submit</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Set up modal events
        const closeBtn = modal.querySelector('.rating-modal-close');
        const stars = modal.querySelectorAll('.star');
        const submitBtn = modal.querySelector('.submit-rating');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                setStarRating(value);
            });
            
            star.addEventListener('mouseover', function() {
                const value = this.getAttribute('data-value');
                highlightStars(value);
            });
        });
        
        modal.querySelector('.rating-stars').addEventListener('mouseout', function() {
            const selectedValue = modal.getAttribute('data-selected-rating');
            highlightStars(selectedValue || 0);
        });
        
        submitBtn.addEventListener('click', function() {
            const rating = modal.getAttribute('data-selected-rating');
            const review = modal.querySelector('textarea').value;
            
            if (rating) {
                submitRating(seriesId, rating, review);
                modal.classList.remove('show');
            }
        });
    }
    
    // Reset modal state
    modal.setAttribute('data-series-id', seriesId);
    modal.removeAttribute('data-selected-rating');
    modal.querySelector('textarea').value = '';
    highlightStars(0);
    
    // Show modal
    modal.classList.add('show');
    
    function setStarRating(value) {
        modal.setAttribute('data-selected-rating', value);
        highlightStars(value);
    }
    
    function highlightStars(value) {
        const stars = modal.querySelectorAll('.star');
        stars.forEach(star => {
            const starValue = star.getAttribute('data-value');
            if (starValue <= value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
}

/**
 * Submit rating to backend
 * @param {string} seriesId - ID of the series
 * @param {string} rating - Rating value (1-5)
 * @param {string} review - Review text
 */
function submitRating(seriesId, rating, review) {
    // Example implementation - would typically involve an API call
    console.log(`Rating submitted for series ${seriesId}: ${rating} stars`);
    
    if (review) {
        console.log(`Review: ${review}`);
    }
    
    // Show confirmation
    showNotification('Rating submitted successfully!');
    
    // Update UI if needed
    const seriesCard = document.querySelector(`.series-card[data-id="${seriesId}"]`);
    if (seriesCard) {
        const ratingElement = seriesCard.querySelector('.series-rating');
        if (ratingElement) {
            // Update with new average including this rating (simplified)
            ratingElement.textContent = rating;
        }
    }
}

/**
 * Apply animations to series elements on page load
 */
function animateSeriesElements() {
    // Staggered animation for series cards
    const seriesCards = document.querySelectorAll('.series-card');
    seriesCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animated');
        }, 100 * index);
    });
    
    // Animate hero section
    const heroSection = document.querySelector('.series-hero');
    if (heroSection) {
        heroSection.classList.add('animated');
    }
}

/**
 * Load more series when user scrolls to bottom (infinite scroll)
 */
window.addEventListener('scroll', function() {
    const scrollPosition = window.innerHeight + window.pageYOffset;
    const pageHeight = document.body.offsetHeight;
    
    // If we're near the bottom of the page
    if (pageHeight - scrollPosition < 300) {
        loadMoreSeries();
    }
});

/**
 * Load additional series (for infinite scroll)
 */
let isLoading = false;
let page = 1;

function loadMoreSeries() {
    if (isLoading) return;
    
    const seriesGrid = document.querySelector('.series-grid');
    if (!seriesGrid) return;
    
    isLoading = true;
    page++;
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'series-loading';
    seriesGrid.appendChild(loadingIndicator);
    
    // Simulate API call delay
    setTimeout(() => {
        // This would be replaced with actual data from your backend
        const mockData = getMockSeriesData();
        
        // Remove loading indicator
        seriesGrid.removeChild(loadingIndicator);
        
        // Append new series cards
        mockData.forEach(series => {
            const seriesCard = createSeriesCard(series);
            seriesGrid.appendChild(seriesCard);
            
            // Animate after a short delay
            setTimeout(() => {
                seriesCard.classList.add('animated');
            }, 100);
        });
        
        isLoading = false;
    }, 1000);
}

/**
 * Create a series card element
 * @param {Object} series - Series data
 * @return {HTMLElement} - Series card element
 */
function createSeriesCard(series) {
    const card = document.createElement('div');
    card.className = 'series-card';
    card.setAttribute('data-id', series.id);
    card.setAttribute('data-rating', series.rating);
    card.setAttribute('data-genres', series.genres.join(','));
    card.setAttribute('data-release', series.releaseDate);
    
    card.innerHTML = `
        <div class="series-image">
            <img src="${series.image}" alt="${series.title}">
            <div class="series-rating">${series.rating}</div>
        </div>
        <div class="series-info">
            <h3 class="series-title">${series.title}</h3>
            <div class="series-meta">
                <span>${series.releaseYear}</span>
                <span>${series.episodes} episodes</span>
            </div>
            <div class="series-tags">
                ${series.genres.map(genre => `<span class="series-tag">${genre}</span>`).join('')}
            </div>
            <div class="series-actions">
                <button class="action-button" data-action="watchlist">
                    <i class="fas fa-bookmark"></i> Watchlist
                </button>
                <button class="action-button" data-action="rate">
                    <i class="fas fa-star"></i> Rate
                </button>
            </div>
        </div>
    `;
    
    // Set up event handlers
    const watchlistBtn = card.querySelector('[data-action="watchlist"]');
    const rateBtn = card.querySelector('[data-action="rate"]');
    
    watchlistBtn.addEventListener('click', function() {
        const isSaved = this.classList.contains('saved');
        toggleWatchlist(series.id, !isSaved);
        this.classList.toggle('saved');
        showNotification(isSaved ? 'Removed from watchlist' : 'Added to watchlist');
    });
    
    rateBtn.addEventListener('click', function() {
        showRatingModal(series.id);
    });
    
    return card;
}

/**
 * Get mock data for demonstration purposes
 * @return {Array} - Array of series data objects
 */
function getMockSeriesData() {
    return [
        {
            id: 'series-' + Math.floor(Math.random() * 1000),
            title: "Space Explorers",
            image: "../images/Series.jpg", 
            rating: (3.5 + Math.random() * 1.5).toFixed(1),
            releaseYear: 2023,
            releaseDate: "2023-03-15",
            episodes: Math.floor(Math.random() * 24) + 8,
            genres: ["Sci-Fi", "Adventure"]
        },
        {
            id: 'series-' + Math.floor(Math.random() * 1000),
            title: "Medieval Kingdom",
            image: "../images/Series.jpg",
            rating: (3.5 + Math.random() * 1.5).toFixed(1),
            releaseYear: 2022,
            releaseDate: "2022-09-22", 
            episodes: Math.floor(Math.random() * 24) + 8,
            genres: ["Fantasy", "Drama"]
        },
        {
            id: 'series-' + Math.floor(Math.random() * 1000),
            title: "Detective Stories",
            image: "../images/Series.jpg",
            rating: (3.5 + Math.random() * 1.5).toFixed(1),
            releaseYear: 2021,
            releaseDate: "2021-11-05",
            episodes: Math.floor(Math.random() * 24) + 8, 
            genres: ["Mystery", "Thriller"]
        }
    ];
}