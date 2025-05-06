/**
 * Leaderboard.js - Adds interactive functionality to the leaderboard page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize category tabs
    initCategoryTabs();
    
    // Initialize filters
    initFilters();
    
    // Initialize sorting for tables
    initTableSorting();
    
    // Initialize animations for rank badges
    initRankBadgeAnimations();

    // Initialize scroll animations
    initScrollAnimations();

    // Fetch initial leaderboard data
    fetchLeaderboardData('all', 'all-time');

    // Set up auto-refresh timer
    initAutoRefresh();
});

/**
 * Initializes the category tabs functionality
 */
function initCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all panels
            panels.forEach(panel => {
                panel.classList.remove('active');
                panel.classList.remove('fade-in');
            });
            
            // Show the panel corresponding to the clicked tab
            const targetPanel = document.getElementById(tab.dataset.target);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.classList.add('fade-in');
                
                // Fetch data for this category
                const category = tab.dataset.category || 'all';
                const activeFilter = targetPanel.querySelector('.filter-group .btn.active');
                const period = activeFilter ? activeFilter.dataset.period : 'all-time';
                
                fetchLeaderboardData(category, period, targetPanel);
            }
        });
    });
}

/**
 * Initializes the filter buttons functionality
 */
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-group .btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the parent filter group
            const filterGroup = button.closest('.filter-group');
            
            // Remove active class from all buttons in this group
            filterGroup.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the filter value and category
            const period = button.dataset.period || 'all-time';
            const tabPanel = button.closest('.tab-panel');
            const category = tabPanel ? tabPanel.dataset.category : 'all';
            
            // Fetch updated data
            fetchLeaderboardData(category, period, tabPanel);
        });
    });
}

/**
 * Initializes sorting functionality for the leaderboard tables
 */
function initTableSorting() {
    const tables = document.querySelectorAll('.leaderboard-table table');
    
    tables.forEach(table => {
        const headers = table.querySelectorAll('th[data-sort]');
        
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const sortKey = header.dataset.sort;
                const sortDirection = header.classList.contains('sort-asc') ? 'desc' : 'asc';
                
                // Remove sort classes from all headers
                headers.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Add appropriate sort class to clicked header
                header.classList.add(`sort-${sortDirection}`);
                
                // Get all rows except the header row
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                // Sort the rows
                const sortedRows = sortRows(rows, sortKey, sortDirection);
                
                // Re-append the sorted rows
                sortedRows.forEach(row => {
                    tbody.appendChild(row);
                });
                
                // Add visual indicator to the sorted column
                updateSortIndicator(header, sortDirection);
            });
        });
    });
}

/**
 * Updates the sort indicator in the table header
 */
function updateSortIndicator(header, direction) {
    // Remove existing indicators
    const oldIndicator = header.querySelector('.sort-indicator');
    if (oldIndicator) {
        oldIndicator.remove();
    }
    
    // Create new indicator
    const indicator = document.createElement('span');
    indicator.className = 'sort-indicator';
    indicator.textContent = direction === 'asc' ? ' ↑' : ' ↓';
    header.appendChild(indicator);
}

/**
 * Sorts table rows based on the given key and direction
 */
function sortRows(rows, key, direction) {
    return rows.sort((a, b) => {
        const aValue = a.querySelector(`[data-${key}]`).dataset[key];
        const bValue = b.querySelector(`[data-${key}]`).dataset[key];
        
        let comparison = 0;
        
        // Handle numeric values
        if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
            comparison = parseFloat(aValue) - parseFloat(bValue);
        } else {
            // Handle string values
            comparison = aValue.localeCompare(bValue);
        }
        
        // Adjust for sort direction
        return direction === 'asc' ? comparison : -comparison;
    });
}

/**
 * Initializes animations for rank badges
 */
function initRankBadgeAnimations() {
    const rankBadges = document.querySelectorAll('.rank-badge');
    
    rankBadges.forEach(badge => {
        // Add animation class on hover
        badge.addEventListener('mouseenter', () => {
            if (badge.classList.contains('rank-1') || 
                badge.classList.contains('rank-2') || 
                badge.classList.contains('rank-3')) {
                badge.classList.add('animate-pulse');
            }
        });
        
        // Remove animation class when hover ends
        badge.addEventListener('mouseleave', () => {
            badge.classList.remove('animate-pulse');
        });
    });
}

/**
 * Initializes scroll animations for elements
 */
function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    // Initial check for elements in viewport
    checkElementsInViewport(animateElements);
    
    // Check on scroll
    window.addEventListener('scroll', () => {
        checkElementsInViewport(animateElements);
    });
}

/**
 * Checks if elements are in viewport and applies animations
 */
function checkElementsInViewport(elements) {
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isInViewport = (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 && 
            rect.bottom >= 0
        );
        
        if (isInViewport) {
            el.classList.add('revealed');
        }
    });
}

/**
 * Shows loading state for a container
 */
function showLoading(container) {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = container.querySelector('.loading-overlay');
    
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay fade-in';
        loadingOverlay.innerHTML = '<div class="loading-spinner"><i class="fas fa-circle-notch"></i><span>Loading leaderboard data...</span></div>';
        container.appendChild(loadingOverlay);
    } else {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.classList.add('fade-in');
    }
}

/**
 * Hides loading state for a container
 */
function hideLoading(container) {
    const loadingOverlay = container.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            loadingOverlay.classList.remove('fade-out');
        }, 500);
    }
}

/**
 * Fetches leaderboard data from the API
 */
function fetchLeaderboardData(category = 'all', period = 'all-time', container = null) {
    // Determine which container to update
    if (!container) {
        if (category === 'all') {
            container = document.querySelector('.global-leaderboard');
        } else {
            container = document.querySelector(`.tab-panel[data-category="${category}"]`);
        }
    }
    
    if (!container) return;
    
    // Show loading state
    showLoading(container);
    
    // Build API URL
    const apiUrl = `api/leaderboard.php?category=${category}&period=${period}&limit=10&page=1`;
    
    // Fetch data from API
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                // Update the leaderboard with the new data
                updateLeaderboardUI(container, data.data, category);
            } else {
                console.error('API error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching leaderboard data:', error);
            // Show error message in UI
            showErrorMessage(container, 'Could not load leaderboard data. Please try again later.');
        })
        .finally(() => {
            // Hide loading state
            hideLoading(container);
        });
}

/**
 * Updates the leaderboard UI with new data
 */
function updateLeaderboardUI(container, items, category) {
    // Find the leaderboard table
    const leaderboardTable = container.querySelector('.leaderboard-table tbody');
    
    if (!leaderboardTable) return;
    
    // Clear existing table rows
    leaderboardTable.innerHTML = '';
    
    // Add new rows with staggered animations
    items.forEach((item, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.style.animationDelay = `${index * 0.05}s`;
        
        // Create rank cell with badge
        const rankCell = document.createElement('td');
        rankCell.className = 'rank-cell';
        
        const rankBadge = document.createElement('div');
        rankBadge.className = `rank-badge rank-${rank} ${rank <= 3 ? 'pulse' : ''}`;
        rankBadge.textContent = rank;
        rankCell.appendChild(rankBadge);
        
        // Create media cell with image and title
        const mediaCell = document.createElement('td');
        mediaCell.className = 'media-cell';
        
        const mediaContent = document.createElement('div');
        mediaContent.className = 'media-content';
        
        const mediaImageContainer = document.createElement('div');
        mediaImageContainer.className = 'img-zoom-container';
        
        const mediaImage = document.createElement('img');
        mediaImage.src = item.cover_image || 'default-cover.jpg';
        mediaImage.alt = item.title;
        mediaImage.className = 'media-image img-zoom';
        
        mediaImageContainer.appendChild(mediaImage);
        
        const mediaInfo = document.createElement('div');
        mediaInfo.className = 'media-info';
        
        const mediaTitle = document.createElement('h3');
        mediaTitle.textContent = item.title;
        
        const mediaDetails = document.createElement('div');
        mediaDetails.className = 'media-details';
        mediaDetails.innerHTML = `<span class="year">${item.release_year}</span> • <span class="category">${item.category}</span>`;
        
        mediaInfo.appendChild(mediaTitle);
        mediaInfo.appendChild(mediaDetails);
        
        mediaContent.appendChild(mediaImageContainer);
        mediaContent.appendChild(mediaInfo);
        mediaCell.appendChild(mediaContent);
        
        // Create rating cell
        const ratingCell = document.createElement('td');
        ratingCell.className = 'rating-cell';
        
        // Add stars for top-rated content
        if (item.rating >= 9) {
            ratingCell.innerHTML = `
                <div class="rating star-animate" data-rating="${item.rating}">
                    ${item.rating.toFixed(1)}
                    <i class="fas fa-star"></i>
                </div>`;
        } else {
            ratingCell.innerHTML = `<div class="rating" data-rating="${item.rating}">${item.rating.toFixed(1)}</div>`;
        }
        
        // Create views cell
        const viewsCell = document.createElement('td');
        viewsCell.className = 'views-cell';
        viewsCell.innerHTML = `<div class="views-count" data-views="${item.view_count}">${formatNumber(item.view_count)}</div>`;
        
        // Create reviews cell
        const reviewsCell = document.createElement('td');
        reviewsCell.className = 'reviews-cell';
        reviewsCell.innerHTML = `<div class="reviews-count" data-reviews="${item.review_count}">${formatNumber(item.review_count)}</div>`;
        
        // Add trend indicator if available
        if (item.trend) {
            const trendIndicator = document.createElement('span');
            trendIndicator.className = `trend-indicator ${item.trend > 0 ? 'trend-up' : item.trend < 0 ? 'trend-down' : 'trend-stable'}`;
            trendIndicator.innerHTML = item.trend > 0 ? '<i class="fas fa-arrow-up"></i>' : 
                                      item.trend < 0 ? '<i class="fas fa-arrow-down"></i>' : 
                                      '<i class="fas fa-equals"></i>';
            reviewsCell.appendChild(trendIndicator);
        }
        
        // Add all cells to the row
        row.appendChild(rankCell);
        row.appendChild(mediaCell);
        row.appendChild(ratingCell);
        row.appendChild(viewsCell);
        row.appendChild(reviewsCell);
        
        // Add data attributes for sorting
        row.querySelector('[data-rating]').dataset.rating = item.rating;
        row.querySelector('[data-views]').dataset.views = item.view_count;
        row.querySelector('[data-reviews]').dataset.reviews = item.review_count;
        
        // Add the row to the table with a rank-based class
        row.classList.add('rank-animation');
        leaderboardTable.appendChild(row);
    });
    
    // Add click event to rows for additional details
    const tableRows = leaderboardTable.querySelectorAll('tr');
    tableRows.forEach(row => {
        row.addEventListener('click', () => {
            showContentDetails(row);
        });
    });
}

/**
 * Shows detailed information about the selected content
 */
function showContentDetails(row) {
    // Get content details from the row
    const title = row.querySelector('.media-info h3').textContent;
    const image = row.querySelector('.media-image').src;
    const rating = row.querySelector('[data-rating]').dataset.rating;
    
    // Check if details modal already exists
    let detailsModal = document.getElementById('content-details-modal');
    
    if (!detailsModal) {
        // Create modal if it doesn't exist
        detailsModal = document.createElement('div');
        detailsModal.id = 'content-details-modal';
        detailsModal.className = 'modal';
        
        detailsModal.innerHTML = `
            <div class="modal-content slide-in-up">
                <div class="modal-header">
                    <h2 id="modal-title"></h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-image-container img-zoom-container">
                        <img id="modal-image" class="img-zoom" alt="Content cover">
                    </div>
                    <div class="modal-details">
                        <div class="detail-group">
                            <h3>Rating</h3>
                            <div class="star-rating-large">
                                <span id="modal-rating"></span>
                            </div>
                        </div>
                        <div class="detail-group">
                            <h3>Details</h3>
                            <div id="modal-details"></div>
                        </div>
                        <div class="detail-group">
                            <h3>Actions</h3>
                            <div class="modal-actions">
                                <button class="btn btn-primary">Add to Watchlist</button>
                                <button class="btn btn-secondary">Write Review</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            
        document.body.appendChild(detailsModal);
        
        // Add close functionality
        const closeButton = detailsModal.querySelector('.close-modal');
        closeButton.addEventListener('click', () => {
            detailsModal.classList.add('fade-out');
            setTimeout(() => {
                detailsModal.style.display = 'none';
                detailsModal.classList.remove('fade-out');
            }, 300);
        });
        
        // Close modal when clicking outside
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                detailsModal.classList.add('fade-out');
                setTimeout(() => {
                    detailsModal.style.display = 'none';
                    detailsModal.classList.remove('fade-out');
                }, 300);
            }
        });
    }
    
    // Update modal with content information
    detailsModal.querySelector('#modal-title').textContent = title;
    detailsModal.querySelector('#modal-image').src = image;
    detailsModal.querySelector('#modal-rating').textContent = parseFloat(rating).toFixed(1);
    
    // Generate stars based on rating
    const starsContainer = detailsModal.querySelector('.star-rating-large');
    const starRating = parseFloat(rating);
    starsContainer.innerHTML = `<span id="modal-rating">${starRating.toFixed(1)}</span>`;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        if (i <= Math.floor(starRating / 2)) {
            star.className = 'fas fa-star';
        } else if (i === Math.ceil(starRating / 2) && starRating % 2 !== 0) {
            star.className = 'fas fa-star-half-alt';
        } else {
            star.className = 'far fa-star';
        }
        starsContainer.appendChild(star);
    }
    
    // Display the modal with animation
    detailsModal.style.display = 'flex';
    
    // In a real application, you would fetch additional details from your API here
    // and populate the modal-details section
}

/**
 * Formats a number with commas for thousands
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Shows an error message in the container
 */
function showErrorMessage(container, message) {
    let errorMessage = container.querySelector('.error-message');
    
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message slide-in-up';
        container.appendChild(errorMessage);
    }
    
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Hide the error after 5 seconds with fade out animation
    setTimeout(() => {
        errorMessage.classList.add('fade-out');
        setTimeout(() => {
            errorMessage.style.display = 'none';
            errorMessage.classList.remove('fade-out');
        }, 500);
    }, 5000);
}

/**
 * Sets up auto-refresh timer to keep leaderboards updated
 */
function initAutoRefresh() {
    // Refresh leaderboards every 5 minutes
    setInterval(() => {
        const activeTab = document.querySelector('.category-tab.active');
        if (activeTab) {
            const category = activeTab.dataset.category || 'all';
            const tabPanel = document.getElementById(activeTab.dataset.target);
            const activeFilter = tabPanel.querySelector('.filter-group .btn.active');
            const period = activeFilter ? activeFilter.dataset.period : 'all-time';
            
            fetchLeaderboardData(category, period, tabPanel);
        } else {
            // Refresh global leaderboard if no tab is active
            fetchLeaderboardData('all', 'all-time');
        }
    }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Simulate loading for testing purposes
 * This function can be removed in production
 */
function simulateLoading() {
    const container = document.querySelector('.active') || document.querySelector('.global-leaderboard');
    
    if (container) {
        showLoading(container);
        
        setTimeout(() => {
            hideLoading(container);
        }, 1500);
    }
}