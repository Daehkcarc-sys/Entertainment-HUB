/**
 * Advanced Search Functionality for Entertainment Hub
 * Handles all search interactions, filters, and result display
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize advanced search page functionality
    initFiltersToggle();
    initRangeSliders();
    initStarRating();
    initViewToggle();
    initSortControls();
    initPaginationControls();
    initSearchTabs();
    initFilterActions();
    initSearchResults();
    
    // Add wishlist/watchlist functionality to results
    initWatchlistButtons();
    
    // Auto-expand filters if there are active filters
    autoExpandFilters();
    
    // If URL has search parameters, execute search based on those
    processUrlParameters();
});

/**
 * Toggle the filters panel visibility
 */
function initFiltersToggle() {
    const toggleBtn = document.getElementById('toggle-filters');
    const filtersBody = document.querySelector('.filters-body');
    
    if (!toggleBtn || !filtersBody) return;
    
    toggleBtn.addEventListener('click', function() {
        filtersBody.classList.toggle('expanded');
        
        // Change arrow direction
        const icon = this.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    });
}

/**
 * Initialize range sliders for year and other numeric filters
 */
function initRangeSliders() {
    // Year range slider
    const yearFromInput = document.getElementById('year-range-from');
    const yearToInput = document.getElementById('year-range-to');
    const yearFromDisplay = document.getElementById('year-from');
    const yearToDisplay = document.getElementById('year-to');
    
    if (yearFromInput && yearToInput && yearFromDisplay && yearToDisplay) {
        // Set initial values
        yearFromDisplay.textContent = yearFromInput.value;
        yearToDisplay.textContent = yearToInput.value;
        
        // Update display when sliders change
        yearFromInput.addEventListener('input', function() {
            // Ensure "from" value doesn't exceed "to" value
            const fromValue = parseInt(this.value);
            const toValue = parseInt(yearToInput.value);
            
            if (fromValue > toValue) {
                this.value = toValue;
            }
            
            yearFromDisplay.textContent = this.value;
        });
        
        yearToInput.addEventListener('input', function() {
            // Ensure "to" value doesn't go below "from" value
            const fromValue = parseInt(yearFromInput.value);
            const toValue = parseInt(this.value);
            
            if (toValue < fromValue) {
                this.value = fromValue;
            }
            
            yearToDisplay.textContent = this.value;
        });
    }
    
    // Rating slider
    const ratingSlider = document.getElementById('rating-slider');
    const ratingValue = document.getElementById('rating-value');
    const starIcons = document.querySelector('.star-icons');
    
    if (ratingSlider && ratingValue && starIcons) {
        // Set initial value
        ratingValue.textContent = ratingSlider.value;
        updateStarIcons(ratingSlider.value);
        
        // Update display when slider changes
        ratingSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            ratingValue.textContent = value;
            updateStarIcons(value);
        });
    }
}

/**
 * Update star icons based on rating value
 */
function updateStarIcons(rating) {
    const starIcons = document.querySelector('.star-icons');
    if (!starIcons) return;
    
    // Reset icons
    starIcons.innerHTML = '';
    
    // Calculate number of full, half, and empty stars
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating / 2) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star';
        starIcons.appendChild(star);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
        const star = document.createElement('i');
        star.className = 'fas fa-star-half-alt';
        starIcons.appendChild(star);
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        const star = document.createElement('i');
        star.className = 'far fa-star';
        starIcons.appendChild(star);
    }
}

/**
 * Initialize star rating functionality
 */
function initStarRating() {
    // This is for interactive star rating if needed
    const starRatings = document.querySelectorAll('.star-rating-interactive');
    
    starRatings.forEach(ratingContainer => {
        const stars = ratingContainer.querySelectorAll('.star');
        const ratingInput = ratingContainer.querySelector('input[type="hidden"]');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', function() {
                const value = index + 1;
                if (ratingInput) ratingInput.value = value;
                
                // Update visual
                stars.forEach((s, i) => {
                    if (i < value) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
            
            star.addEventListener('mouseover', function() {
                const value = index + 1;
                
                // Highlight stars on hover
                stars.forEach((s, i) => {
                    if (i < value) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });
            
            star.addEventListener('mouseout', function() {
                // Remove hover effect
                stars.forEach(s => {
                    s.classList.remove('hover');
                });
            });
        });
    });
}

/**
 * Initialize view toggle (grid/list) functionality
 */
function initViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const resultsContainer = document.getElementById('search-results');
    
    if (!viewButtons.length || !resultsContainer) return;
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewType = this.dataset.view;
            
            // Update active button
            viewButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update results container class
            resultsContainer.className = 'search-results ' + viewType + '-view';
            
            // Save preference to localStorage
            localStorage.setItem('preferred-view', viewType);
        });
    });
    
    // Apply saved preference if available
    const savedView = localStorage.getItem('preferred-view');
    if (savedView) {
        const targetButton = document.querySelector(`.view-btn[data-view="${savedView}"]`);
        if (targetButton && !targetButton.classList.contains('active')) {
            targetButton.click();
        }
    }
}

/**
 * Initialize sort controls
 */
function initSortControls() {
    const sortSelect = document.getElementById('sort-select');
    
    if (!sortSelect) return;
    
    sortSelect.addEventListener('change', function() {
        // Save preference to localStorage
        localStorage.setItem('preferred-sort', this.value);
        
        // Re-sort and display results
        sortResults(this.value);
    });
    
    // Apply saved preference if available
    const savedSort = localStorage.getItem('preferred-sort');
    if (savedSort) {
        sortSelect.value = savedSort;
    }
}

/**
 * Sort results based on selected option
 */
function sortResults(sortOption) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    const results = Array.from(resultsContainer.querySelectorAll('.result-card'));
    if (!results.length) return;
    
    // Sort based on selected option
    results.sort((a, b) => {
        switch(sortOption) {
            case 'relevance':
                // Keep default order for relevance
                return 0;
                
            case 'date-desc':
                return getDateFromCard(b) - getDateFromCard(a);
                
            case 'date-asc':
                return getDateFromCard(a) - getDateFromCard(b);
                
            case 'rating-desc':
                return getRatingFromCard(b) - getRatingFromCard(a);
                
            case 'rating-asc':
                return getRatingFromCard(a) - getRatingFromCard(b);
                
            case 'az':
                return getTitleFromCard(a).localeCompare(getTitleFromCard(b));
                
            case 'za':
                return getTitleFromCard(b).localeCompare(getTitleFromCard(a));
                
            default:
                return 0;
        }
    });
    
    // Reorder the DOM
    results.forEach(card => {
        resultsContainer.appendChild(card);
    });
    
    // Show sort animation
    results.forEach(card => {
        card.classList.add('sort-animate');
        setTimeout(() => {
            card.classList.remove('sort-animate');
        }, 500);
    });
    
    // Show toast notification
    showToast(`Results sorted by ${sortSelect.selectedOptions[0].textContent}`);
}

/**
 * Helper functions to extract data from result cards
 */
function getDateFromCard(card) {
    const dateText = card.querySelector('.result-meta')?.textContent || '';
    const year = dateText.match(/\d{4}/) ? parseInt(dateText.match(/\d{4}/)[0]) : 0;
    return year;
}

function getRatingFromCard(card) {
    const ratingText = card.querySelector('.result-rating')?.textContent || '0';
    return parseFloat(ratingText) || 0;
}

function getTitleFromCard(card) {
    return card.querySelector('h3')?.textContent || '';
}

/**
 * Initialize pagination controls
 */
function initPaginationControls() {
    const paginationButtons = document.querySelectorAll('.pagination-number');
    const prevButton = document.querySelector('.pagination-btn.prev');
    const nextButton = document.querySelector('.pagination-btn.next');
    
    if (!paginationButtons.length) return;
    
    // Number button clicks
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            paginationButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Get page number
            const page = parseInt(this.textContent);
            loadPage(page);
            
            // Update prev/next button states
            updatePaginationControls();
        });
    });
    
    // Previous button
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (this.disabled) return;
            
            // Find current active page and go to previous
            const activePage = document.querySelector('.pagination-number.active');
            if (activePage) {
                const prevPage = activePage.previousElementSibling;
                if (prevPage && prevPage.classList.contains('pagination-number')) {
                    prevPage.click();
                }
            }
        });
    }
    
    // Next button
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (this.disabled) return;
            
            // Find current active page and go to next
            const activePage = document.querySelector('.pagination-number.active');
            if (activePage) {
                const nextPage = activePage.nextElementSibling;
                if (nextPage && nextPage.classList.contains('pagination-number')) {
                    nextPage.click();
                }
            }
        });
    }
    
    // Initial update of controls
    updatePaginationControls();
}

/**
 * Update the state of pagination controls
 */
function updatePaginationControls() {
    const prevButton = document.querySelector('.pagination-btn.prev');
    const nextButton = document.querySelector('.pagination-btn.next');
    const activePage = document.querySelector('.pagination-number.active');
    
    if (!activePage) return;
    
    // Update prev button state
    if (prevButton) {
        prevButton.disabled = !activePage.previousElementSibling || 
                             !activePage.previousElementSibling.classList.contains('pagination-number');
    }
    
    // Update next button state
    if (nextButton) {
        nextButton.disabled = !activePage.nextElementSibling || 
                             !activePage.nextElementSibling.classList.contains('pagination-number') ||
                             activePage.nextElementSibling.classList.contains('pagination-ellipsis');
    }
    
    // Scroll to top of results
    const resultsSection = document.querySelector('.search-results-section');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Load a specific page of results
 */
function loadPage(page) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    // In a real implementation, this would fetch page data from the server
    // For demo, we'll simulate loading with a placeholder
    
    resultsContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading results...</p></div>';
    
    // Simulate API delay
    setTimeout(() => {
        resultsContainer.innerHTML = '';
        
        // Generate mock results
        const mockResults = generateMockResults(page);
        
        if (mockResults.length === 0) {
            // Show no results message
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon"><i class="fas fa-search"></i></div>
                    <h3>No Results Found</h3>
                    <p>Please try adjusting your search criteria.</p>
                </div>
            `;
            return;
        }
        
        // Add results to container
        mockResults.forEach(result => {
            const resultCard = createResultCard(result);
            resultsContainer.appendChild(resultCard);
        });
        
        // Update results count
        const resultsCountElement = document.getElementById('results-count');
        if (resultsCountElement) {
            resultsCountElement.textContent = mockResults.length * 24; // Simulate total across pages
        }
        
        // Initialize watchlist buttons
        initWatchlistButtons();
        
    }, 800);
}

/**
 * Generate mock search results for demonstration
 */
function generateMockResults(page) {
    // Array of possible content types
    const contentTypes = ['movie', 'series', 'anime', 'manga', 'game'];
    
    // Array to hold mock results
    const mockResults = [];
    
    // Generate 12 mock results for the page
    for (let i = 0; i < 12; i++) {
        // Determine content type
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        
        // Select appropriate image based on content type
        let image;
        switch(contentType) {
            case 'movie':
                image = ['Oppenheimer.jpg', 'Darkknight.jpg', 'BladeRunner.jpg', 'Dune.jpg', 'FightClub.jpg', 'Godfather.jpg'][Math.floor(Math.random() * 6)];
                break;
            case 'series':
                image = ['Series.jpg', 'LastHorizon.jpg', 'Severence.jpg', 'Starwars.jpg'][Math.floor(Math.random() * 4)];
                break;
            case 'anime':
                image = ['attack on titan.jpg', 'DemonSlayer.jpg', 'JJK.jpeg', 'Heroacademia.jpg', 'Chainsaw.jpg'][Math.floor(Math.random() * 5)];
                break;
            case 'manga':
                image = ['OnePiece.jpg', 'Levi.jpg', 'Makima.jpg'][Math.floor(Math.random() * 3)];
                break;
            case 'game':
                image = ['EldenRing.jpg', 'GOW.jpg', 'minecraft.jpg'][Math.floor(Math.random() * 3)];
                break;
        }
        
        // Create mock result
        const mockResult = {
            id: `result-${page}-${i}`,
            title: getRandomTitle(contentType),
            image: image,
            type: contentType,
            year: 2000 + Math.floor(Math.random() * 25), // Random year between 2000-2025
            rating: (Math.floor(Math.random() * 40) + 60) / 10, // Random rating between 6.0-10.0
            genres: getRandomGenres()
        };
        
        mockResults.push(mockResult);
    }
    
    return mockResults;
}

/**
 * Get random title for mock results
 */
function getRandomTitle(type) {
    const titles = {
        movie: [
            'The Last Adventure', 'Midnight Chronicles', 'Beyond the Horizon',
            'Eternal Echoes', 'Whispers in the Dark', 'The Silent Guardian',
            'Forgotten Dreams', 'Legacy of Time', 'The Hidden Truth',
            'Shadows of Destiny'
        ],
        series: [
            'Dark Matters', 'The Lost City', 'Chronicles of the Unknown',
            'Echoes of Tomorrow', 'Skyward', 'The Final Frontier',
            'Parallel Lives', 'The Edge of Reality', 'Forgotten Realms',
            'Unseen Forces'
        ],
        anime: [
            'Spirit Blade', 'Dragon Quest: Legends', 'Magical Academy',
            'Cyber Nexus', 'Phantom Warriors', 'Destiny Awakens',
            'Soul Hunters', 'Crimson Sky', 'Guardian Spirit',
            'Infinite Horizon'
        ],
        manga: [
            'Blade of Destiny', 'Divine Soul', 'Crimson Moon',
            'Shadow Hunter', 'Eternal Bond', 'Lost Realms',
            'Spirit Walker', 'Dragon Heart', 'Mystic Saga',
            'Fallen Kingdom'
        ],
        game: [
            'Legends of Valor', 'Dark Horizon', 'Eternal Quest',
            'Realm of Shadows', 'Chronicles of Power', 'Cybernetic Dawn',
            'Fallen Empire', 'Legacy of Heroes', 'The Last Guardian',
            'Mystic Journey'
        ]
    };
    
    const typeArray = titles[type] || titles.movie;
    return typeArray[Math.floor(Math.random() * typeArray.length)];
}

/**
 * Get random genres for mock results
 */
function getRandomGenres() {
    const allGenres = [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
        'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Animation'
    ];
    
    const numGenres = Math.floor(Math.random() * 3) + 1; // 1-3 genres
    const genres = [];
    
    for (let i = 0; i < numGenres; i++) {
        const genre = allGenres[Math.floor(Math.random() * allGenres.length)];
        if (!genres.includes(genre)) {
            genres.push(genre);
        }
    }
    
    return genres;
}

/**
 * Create result card element from data
 */
function createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.dataset.id = result.id;
    card.dataset.type = result.type;
    
    card.innerHTML = `
        <div class="result-image">
            <img src="../images/${result.image}" alt="${result.title}">
            <span class="result-badge ${result.type}-badge">${capitalizeFirstLetter(result.type)}</span>
            <div class="result-rating">
                <i class="fas fa-star"></i> ${result.rating.toFixed(1)}
            </div>
        </div>
        <div class="result-info">
            <h3>${result.title}</h3>
            <div class="result-meta">
                ${result.year} | ${result.genres.join(', ')}
            </div>
            <div class="result-actions">
                <button class="btn-icon" aria-label="View details">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button class="btn-icon add-watchlist" data-id="${result.id}" data-type="${result.type}" aria-label="Add to watchlist">
                    <i class="far fa-bookmark"></i>
                </button>
                <button class="btn-icon" aria-label="Rate">
                    <i class="far fa-star"></i>
                </button>
                <button class="btn-icon share-button" data-title="${result.title}" aria-label="Share">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Initialize search tab functionality
 */
function initSearchTabs() {
    const searchTabs = document.querySelectorAll('.search-tab');
    
    if (!searchTabs.length) return;
    
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            searchTabs.forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            const contentType = this.dataset.contentType;
            
            // Filter results by content type
            filterResultsByType(contentType);
        });
    });
}

/**
 * Filter results by content type
 */
function filterResultsByType(contentType) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    const resultCards = resultsContainer.querySelectorAll('.result-card');
    
    if (contentType === 'all') {
        // Show all cards
        resultCards.forEach(card => {
            card.style.display = '';
        });
    } else {
        // Show only cards of selected type
        resultCards.forEach(card => {
            if (card.dataset.type === contentType) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Update results count
    const visibleResults = Array.from(resultCards).filter(card => card.style.display !== 'none');
    const resultsCountElement = document.getElementById('results-count');
    if (resultsCountElement) {
        resultsCountElement.textContent = visibleResults.length;
    }
    
    // Show toast notification
    const typeName = contentType === 'all' ? 'All content' : `${capitalizeFirstLetter(contentType)}s`;
    showToast(`Showing ${typeName} only`);
}

/**
 * Initialize filter actions (apply, reset)
 */
function initFilterActions() {
    const filtersForm = document.getElementById('advanced-filters-form');
    const resetBtn = document.getElementById('reset-filters');
    
    if (!filtersForm) return;
    
    filtersForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Apply filters
        applyFilters();
        
        // Save filter state to local storage
        saveFilterState();
    });
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Reset all form elements
            filtersForm.reset();
            
            // Reset range sliders
            const yearFromInput = document.getElementById('year-range-from');
            const yearToInput = document.getElementById('year-range-to');
            const yearFromDisplay = document.getElementById('year-from');
            const yearToDisplay = document.getElementById('year-to');
            
            if (yearFromInput && yearToInput && yearFromDisplay && yearToDisplay) {
                yearFromInput.value = yearFromInput.min;
                yearToInput.value = yearToInput.max;
                yearFromDisplay.textContent = yearFromInput.min;
                yearToDisplay.textContent = yearToInput.max;
            }
            
            // Reset rating slider
            const ratingSlider = document.getElementById('rating-slider');
            const ratingValue = document.getElementById('rating-value');
            
            if (ratingSlider && ratingValue) {
                ratingSlider.value = 0;
                ratingValue.textContent = '0';
                updateStarIcons(0);
            }
            
            // Reset filter state in local storage
            localStorage.removeItem('filter-state');
            
            // Reload page to reset results
            showToast('All filters have been reset');
            setTimeout(() => {
                loadPage(1);
            }, 500);
        });
    }
    
    // Load saved filter state if available
    loadFilterState();
}

/**
 * Save current filter state to local storage
 */
function saveFilterState() {
    const filterState = {
        contentTypes: Array.from(document.querySelectorAll('input[name="content-type"]:checked'))
            .map(input => input.value),
        genres: Array.from(document.querySelectorAll('input[name="genre"]:checked'))
            .map(input => input.value),
        yearFrom: document.getElementById('year-range-from')?.value,
        yearTo: document.getElementById('year-range-to')?.value,
        rating: document.getElementById('rating-slider')?.value,
        movieDuration: document.querySelector('input[name="movie-duration"]:checked')?.value,
        seriesLength: document.querySelector('input[name="series-length"]:checked')?.value,
        languages: Array.from(document.getElementById('language-select')?.selectedOptions || [])
            .map(option => option.value),
        availability: Array.from(document.querySelectorAll('input[name="availability"]:checked'))
            .map(input => input.value),
        advancedOptions: Array.from(document.querySelectorAll('input[name="advanced"]:checked'))
            .map(input => input.value)
    };
    
    localStorage.setItem('filter-state', JSON.stringify(filterState));
}

/**
 * Load saved filter state from local storage
 */
function loadFilterState() {
    const filterStateJson = localStorage.getItem('filter-state');
    if (!filterStateJson) return;
    
    try {
        const filterState = JSON.parse(filterStateJson);
        
        // Apply content types
        if (filterState.contentTypes) {
            filterState.contentTypes.forEach(type => {
                const input = document.querySelector(`input[name="content-type"][value="${type}"]`);
                if (input) input.checked = true;
            });
        }
        
        // Apply genres
        if (filterState.genres) {
            filterState.genres.forEach(genre => {
                const input = document.querySelector(`input[name="genre"][value="${genre}"]`);
                if (input) input.checked = true;
            });
        }
        
        // Apply year range
        const yearFromInput = document.getElementById('year-range-from');
        const yearToInput = document.getElementById('year-range-to');
        const yearFromDisplay = document.getElementById('year-from');
        const yearToDisplay = document.getElementById('year-to');
        
        if (yearFromInput && yearToInput && yearFromDisplay && yearToDisplay && 
            filterState.yearFrom && filterState.yearTo) {
            yearFromInput.value = filterState.yearFrom;
            yearToInput.value = filterState.yearTo;
            yearFromDisplay.textContent = filterState.yearFrom;
            yearToDisplay.textContent = filterState.yearTo;
        }
        
        // Apply rating
        const ratingSlider = document.getElementById('rating-slider');
        const ratingValue = document.getElementById('rating-value');
        
        if (ratingSlider && ratingValue && filterState.rating) {
            ratingSlider.value = filterState.rating;
            ratingValue.textContent = filterState.rating;
            updateStarIcons(filterState.rating);
        }
        
        // Apply movie duration
        if (filterState.movieDuration) {
            const input = document.querySelector(`input[name="movie-duration"][value="${filterState.movieDuration}"]`);
            if (input) input.checked = true;
        }
        
        // Apply series length
        if (filterState.seriesLength) {
            const input = document.querySelector(`input[name="series-length"][value="${filterState.seriesLength}"]`);
            if (input) input.checked = true;
        }
        
        // Apply languages
        const languageSelect = document.getElementById('language-select');
        if (languageSelect && filterState.languages) {
            Array.from(languageSelect.options).forEach(option => {
                option.selected = filterState.languages.includes(option.value);
            });
        }
        
        // Apply availability
        if (filterState.availability) {
            filterState.availability.forEach(value => {
                const input = document.querySelector(`input[name="availability"][value="${value}"]`);
                if (input) input.checked = true;
            });
        }
        
        // Apply advanced options
        if (filterState.advancedOptions) {
            filterState.advancedOptions.forEach(value => {
                const input = document.querySelector(`input[name="advanced"][value="${value}"]`);
                if (input) input.checked = true;
            });
        }
    } catch (error) {
        console.error('Error loading filter state:', error);
    }
}

/**
 * Auto-expand filters if there are active filters
 */
function autoExpandFilters() {
    const filtersBody = document.querySelector('.filters-body');
    const toggleBtn = document.getElementById('toggle-filters');
    
    if (!filtersBody || !toggleBtn) return;
    
    // Check if any filters are active
    const hasActiveFilters = Boolean(
        document.querySelector('input[name="genre"]:checked') ||
        document.querySelector('input[name="availability"]:checked') ||
        document.querySelector('input[name="advanced"]:checked') ||
        (document.getElementById('rating-slider')?.value > 0)
    );
    
    // Auto-expand if there are active filters
    if (hasActiveFilters) {
        filtersBody.classList.add('expanded');
        
        // Update toggle button icon
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    }
}

/**
 * Apply filters to search results
 */
function applyFilters() {
    // In a real implementation, this would send the filter values to the server
    // For demo, we'll simulate filtering by reloading the current page
    
    // Show loading
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Applying filters...</p></div>';
    }
    
    // Simulate API delay
    setTimeout(() => {
        loadPage(1); // Reload first page with "filtered" results
        
        // Show toast notification
        showToast('Filters applied successfully');
        
        // Close filters on mobile
        if (window.innerWidth < 768) {
            const filtersBody = document.querySelector('.filters-body');
            if (filtersBody && filtersBody.classList.contains('expanded')) {
                const toggleBtn = document.getElementById('toggle-filters');
                if (toggleBtn) toggleBtn.click();
            }
        }
    }, 800);
}

/**
 * Initialize search results
 */
function initSearchResults() {
    // Load initial results
    loadPage(1);
    
    // Listen for search form submission
    const searchForm = document.getElementById('main-search-form');
    const searchInput = document.getElementById('main-search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const searchTerm = searchInput.value.trim();
            if (searchTerm.length < 2) {
                showToast('Please enter at least 2 characters to search');
                return;
            }
            
            // Execute search
            executeSearch(searchTerm);
        });
    }
    
    // Initialize share buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.share-button')) {
            const button = e.target.closest('.share-button');
            const title = button.dataset.title;
            
            // Attempt to use Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: title,
                    text: `Check out ${title} on Entertainment Hub!`,
                    url: window.location.href
                })
                .catch(err => {
                    showToast('Unable to share. Link copied to clipboard instead.');
                    copyToClipboard(window.location.href);
                });
            } else {
                // Fallback to copying link
                copyToClipboard(window.location.href);
                showToast('Link copied to clipboard!');
            }
        }
    });
}

/**
 * Execute search with the given query
 */
function executeSearch(query) {
    // Update page title and search input
    document.title = `Search results for "${query}" | Entertainment Hub`;
    
    // Show loading
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Searching...</p></div>';
    }
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('q', query);
    window.history.replaceState({}, '', url);
    
    // Simulate API delay
    setTimeout(() => {
        loadPage(1); // Load "search results"
    }, 800);
}

/**
 * Process URL parameters for search
 */
function processUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('q');
    
    if (searchQuery) {
        // Set search input value
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
            searchInput.value = searchQuery;
        }
        
        // Execute search
        executeSearch(searchQuery);
    }
}

/**
 * Initialize watchlist buttons
 */
function initWatchlistButtons() {
    const watchlistButtons = document.querySelectorAll('.add-watchlist');
    
    watchlistButtons.forEach(button => {
        // Check if item is already in watchlist
        const itemId = button.dataset.id;
        const itemType = button.dataset.type;
        const isInWatchlist = checkIfInWatchlist(itemId, itemType);
        
        // Update button appearance if in watchlist
        if (isInWatchlist) {
            button.classList.add('added');
            button.querySelector('i').classList.replace('far', 'fas');
        } else {
            button.classList.remove('added');
            button.querySelector('i').classList.replace('fas', 'far');
        }
        
        // Add click handler
        button.addEventListener('click', function() {
            const itemId = this.dataset.id;
            const itemType = this.dataset.type;
            
            if (this.classList.contains('added')) {
                // Remove from watchlist
                removeFromWatchlist(itemId, itemType);
                this.classList.remove('added');
                this.querySelector('i').classList.replace('fas', 'far');
                showToast(`Removed from your ${itemType === 'game' ? 'wishlist' : 'watchlist'}`);
            } else {
                // Add to watchlist
                addToWatchlist(itemId, itemType);
                this.classList.add('added');
                this.querySelector('i').classList.replace('far', 'fas');
                showToast(`Added to your ${itemType === 'game' ? 'wishlist' : 'watchlist'}`);
            }
        });
    });
}

/**
 * Check if item is in watchlist
 */
function checkIfInWatchlist(itemId, itemType) {
    // In a real app, this would check the user's actual watchlist
    // For demo, we'll use localStorage
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    return watchlist.some(item => item.id === itemId && item.type === itemType);
}

/**
 * Add item to watchlist
 */
function addToWatchlist(itemId, itemType) {
    // In a real app, this would make an API call
    // For demo, we'll use localStorage
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    // Add item if not already in list
    if (!watchlist.some(item => item.id === itemId && item.type === itemType)) {
        watchlist.push({
            id: itemId,
            type: itemType,
            addedAt: new Date().toISOString()
        });
        
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
}

/**
 * Remove item from watchlist
 */
function removeFromWatchlist(itemId, itemType) {
    // In a real app, this would make an API call
    // For demo, we'll use localStorage
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    watchlist = watchlist.filter(item => !(item.id === itemId && item.type === itemType));
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon;
    switch (type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        case 'error': icon = 'fa-times-circle'; break;
        default: icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('animate-in');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.add('animate-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    // Create temporary input element
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    
    // Select and copy
    input.focus();
    input.select();
    document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(input);
}

/**
 * Helper function to capitalize first letter
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}