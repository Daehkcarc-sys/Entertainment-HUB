// movies.js - Adds interactive functionality to the movies page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize movie carousel
    initializeCarousel();
    
    // Initialize category tabs
    initializeTabs();
    
    // Initialize rating system
    initializeRatingSystem();
    
    // Initialize search and filter functionality
    initializeSearchFilter();
    
    // Initialize existing rating buttons
    initializeRatingButtons();
});

// Carousel Functionality
function initializeCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-button.next');
    const prevButton = document.querySelector('.carousel-button.prev');
    
    if (!track || !slides.length || !nextButton || !prevButton) return;
    
    const slideWidth = slides[0].getBoundingClientRect().width;
    
    // Arrange slides next to one another
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });
    
    // Move slide function
    const moveToSlide = (track, currentSlide, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
        currentSlide.classList.remove('current-slide');
        targetSlide.classList.add('current-slide');
    };
    
    // Update dots function (if we have dots)
    const updateDots = (currentDot, targetDot) => {
        if (!currentDot || !targetDot) return;
        currentDot.classList.remove('current-slide');
        targetDot.classList.add('current-slide');
    };
    
    // Hide/show arrows function
    const hideShowArrows = (slides, prevButton, nextButton, targetIndex) => {
        if (targetIndex === 0) {
            prevButton.classList.add('is-hidden');
            nextButton.classList.remove('is-hidden');
        } else if (targetIndex === slides.length - 1) {
            prevButton.classList.remove('is-hidden');
            nextButton.classList.add('is-hidden');
        } else {
            prevButton.classList.remove('is-hidden');
            nextButton.classList.remove('is-hidden');
        }
    };
    
    // When I click left, move slides to the left
    prevButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        let prevSlide;
        
        if (currentSlide === slides[0] || !currentSlide) {
            prevSlide = slides[slides.length - 1]; // Loop to the end
        } else {
            prevSlide = currentSlide.previousElementSibling;
        }
        
        moveToSlide(track, currentSlide, prevSlide);
        
        // Update dots if present
        const currentDot = document.querySelector('.carousel-dots .current-slide');
        const targetDot = document.querySelector(`.carousel-dots button:nth-child(${slides.indexOf(prevSlide) + 1})`);
        updateDots(currentDot, targetDot);
        
        // Hide/show arrows
        hideShowArrows(slides, prevButton, nextButton, slides.indexOf(prevSlide));
    });
    
    // When I click right, move slides to the right
    nextButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        let nextSlide;
        
        if (currentSlide === slides[slides.length - 1] || !currentSlide) {
            nextSlide = slides[0]; // Loop to the start
        } else {
            nextSlide = currentSlide.nextElementSibling;
        }
        
        moveToSlide(track, currentSlide, nextSlide);
        
        // Update dots if present
        const currentDot = document.querySelector('.carousel-dots .current-slide');
        const targetDot = document.querySelector(`.carousel-dots button:nth-child(${slides.indexOf(nextSlide) + 1})`);
        updateDots(currentDot, targetDot);
        
        // Hide/show arrows
        hideShowArrows(slides, prevButton, nextButton, slides.indexOf(nextSlide));
    });
    
    // Dots navigation (if we have dots)
    const dotsNav = document.querySelector('.carousel-dots');
    if (dotsNav) {
        const dots = Array.from(dotsNav.children);
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', e => {
                const currentSlide = track.querySelector('.current-slide') || slides[0];
                const targetSlide = slides[index];
                
                moveToSlide(track, currentSlide, targetSlide);
                
                // Update dots
                updateDots(document.querySelector('.carousel-dots .current-slide'), dot);
                
                // Hide/show arrows
                hideShowArrows(slides, prevButton, nextButton, index);
            });
        });
    }
}

// Tabs Functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (!tabButtons.length || !tabContents.length) return;
    
    // Hide all tab contents initially
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Show first tab content
    tabContents[0].classList.add('active');
    
    // Add click event to each tab button
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const targetId = button.dataset.target;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Lazy load content if it's a placeholder
                const placeholder = targetContent.querySelector('.placeholder-text');
                if (placeholder) {
                    loadTabContent(targetId);
                }
            }
        });
    });
}

// Function to simulate loading tab content
function loadTabContent(tabId) {
    const tabContent = document.getElementById(tabId);
    if (!tabContent) return;
    
    const moviesGrid = tabContent.querySelector('.movies-grid');
    if (!moviesGrid) return;
    
    // Clear placeholder
    moviesGrid.innerHTML = '';
    
    // Simulate content loading
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-spinner';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    moviesGrid.appendChild(loadingIndicator);
    
    // Simulate API fetch delay
    setTimeout(() => {
        moviesGrid.innerHTML = '';
        
        // Create sample movie cards based on tab
        const movies = getMoviesForTab(tabId);
        
        movies.forEach(movie => {
            const card = createMovieCard(movie);
            moviesGrid.appendChild(card);
        });
    }, 1000);
}

// Helper function to get movies for a specific tab
function getMoviesForTab(tabId) {
    // Sample data for different tabs
    const moviesByTab = {
        'new-releases': [
            { title: 'Dune: Part Two', year: 2024, rating: 8.7, poster: 'Dune.jpg', director: 'Denis Villeneuve' },
            { title: 'Oppenheimer', year: 2023, rating: 8.5, poster: 'Oppenheimer.jpg', director: 'Christopher Nolan' },
            { title: 'Blade Runner 2049', year: 2023, rating: 8.3, poster: 'BladeRunner.jpg', director: 'Denis Villeneuve' },
            { title: 'Avatar: The Way of Water', year: 2022, rating: 8.0, poster: 'Avatar.jpg', director: 'James Cameron' }
        ],
        'coming-soon': [
            { title: 'Gladiator II', year: 2024, rating: null, poster: 'FightClub.jpg', director: 'Ridley Scott' },
            { title: 'Mission: Impossible 8', year: 2025, rating: null, poster: 'movie.jpg', director: 'Christopher McQuarrie' },
            { title: 'Star Wars: New Jedi Order', year: 2025, rating: null, poster: 'Starwars.jpg', director: 'Dave Filoni' },
            { title: 'Avatar 3', year: 2025, rating: null, poster: 'Avatar.jpg', director: 'James Cameron' }
        ],
        'classics': [
            { title: 'Pulp Fiction', year: 1994, rating: 8.9, poster: 'PulpFiction.jpg', director: 'Quentin Tarantino' },
            { title: 'Star Wars: A New Hope', year: 1977, rating: 8.6, poster: 'Starwars.jpg', director: 'George Lucas' },
            { title: 'The Godfather', year: 1972, rating: 9.2, poster: 'Godfather.jpg', director: 'Francis Ford Coppola' },
            { title: 'Goodfellas', year: 1990, rating: 8.7, poster: 'GoodFellas.jpg', director: 'Martin Scorsese' }
        ]
    };
    
    return moviesByTab[tabId] || [];
}

// Helper function to create movie card
function createMovieCard(movie) {
    const figure = document.createElement('figure');
    figure.className = 'movie-card';
    
    const ratingDisplay = movie.rating ? 
        `<meter class="rating-meter" value="${movie.rating}" min="0" max="10" optimum="10" high="8" low="4">${movie.rating}/10</meter>` : 
        '<span class="coming-soon-badge">Coming Soon</span>';
    
    figure.innerHTML = `
        <div class="movie-poster">
            <img src="D:\\Study stuff\\Web\\Projet\\${movie.poster}" alt="${movie.title} Poster">
            <div class="movie-overlay">
                ${ratingDisplay}
                <div class="movie-actions">
                    <button class="action-button"><i class="fas fa-bookmark"></i></button>
                    <button class="action-button"><i class="fas fa-star"></i></button>
                    <button class="action-button"><i class="fas fa-info-circle"></i></button>
                </div>
            </div>
        </div>
        <figcaption>
            <h3>${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-year">${movie.year}</span>
                ${movie.rating ? `<span class="movie-rating">${movie.rating}</span>` : ''}
            </div>
        </figcaption>
    `;
    
    return figure;
}

// Rating system functionality
function initializeRatingSystem() {
    // Star rating system
    const starInputs = document.querySelectorAll('.star-rating input');
    starInputs.forEach(input => {
        input.addEventListener('change', handleStarRating);
    });
    
    // Range sliders for category ratings
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const output = slider.nextElementSibling;
        
        // Initialize output with slider value
        if (output) {
            output.textContent = slider.value;
        }
        
        // Update output when slider changes
        slider.addEventListener('input', () => {
            if (output) {
                output.textContent = slider.value;
            }
        });
    });
}

// Star rating handler
function handleStarRating(e) {
    const clickedRating = parseInt(e.target.value);
    const starLabels = document.querySelectorAll('.star-rating label');
    
    // Update stars appearance based on selection
    starLabels.forEach((label, index) => {
        if (5 - index <= clickedRating) {
            label.classList.add('selected');
        } else {
            label.classList.remove('selected');
        }
    });
}

// Filter and search functionality
function initializeFilters() {
    const searchForm = document.querySelector('.search-container form');
    const filterInputs = document.querySelectorAll('.filter-sort-container select');
    
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = document.getElementById('movie-search').value;
            performSearch(searchTerm);
        });
    }
    
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            applyFilters();
        });
    });
}

// Function to simulate searching movies
function performSearch(term) {
    console.log(`Searching for: ${term}`);
    // This would typically connect to a backend API
    
    // Show search indicator
    const mainContent = document.querySelector('main');
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.innerHTML = `
        <h3>Search Results for "${term}"</h3>
        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Searching...</div>
    `;
    
    // Insert search results at top of main content
    mainContent.insertBefore(searchResults, mainContent.firstChild);
    
    // Simulate search delay
    setTimeout(() => {
        searchResults.querySelector('.loading-spinner').remove();
        
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'movies-grid';
        
        // Sample search results - would come from API in real app
        const searchMatches = [
            { title: 'Interstellar', year: 2014, rating: 8.7, poster: 'Interstellar.jpg', director: 'Christopher Nolan' },
            { title: 'Inception', year: 2010, rating: 8.8, poster: 'Darkknight.jpg', director: 'Christopher Nolan' }
        ];
        
        if (searchMatches.length) {
            searchMatches.forEach(movie => {
                const card = createMovieCard(movie);
                resultsGrid.appendChild(card);
            });
        } else {
            resultsGrid.innerHTML = `<p>No results found for "${term}"</p>`;
        }
        
        searchResults.appendChild(resultsGrid);
    }, 1000);
}

// Function to simulate applying filters
function applyFilters() {
    const year = document.getElementById('year-filter').value;
    const rating = document.getElementById('rating-filter').value;
    const sort = document.getElementById('sort-movies').value;
    
    console.log(`Filtering by: Year=${year}, Rating=${rating}, Sort=${sort}`);
    // This would typically filter data from a backend API
    
    // Update UI to show filters are applied
    const filterBadges = document.querySelector('.filter-badges');
    if (!filterBadges) {
        const newBadges = document.createElement('div');
        newBadges.className = 'filter-badges';
        newBadges.innerHTML = `
            <p>Active filters:</p>
            <span class="filter-badge">${year !== 'all' ? year : 'All Years'}</span>
            <span class="filter-badge">${rating !== 'all' ? rating + '+ Stars' : 'All Ratings'}</span>
            <span class="filter-badge">Sorted by: ${sort}</span>
            <button class="clear-filters">Clear All</button>
        `;
        
        const filterSection = document.querySelector('.search-filter-section');
        if (filterSection) {
            filterSection.appendChild(newBadges);
            
            // Add event listener to clear filters button
            newBadges.querySelector('.clear-filters').addEventListener('click', () => {
                document.getElementById('year-filter').value = 'all';
                document.getElementById('rating-filter').value = 'all';
                document.getElementById('sort-movies').value = 'popularity';
                newBadges.remove();
            });
        }
    }
}

// Movie action buttons functionality (bookmark, rate, info)
function initializeMovieActions() {
    const actionButtons = document.querySelectorAll('.movie-actions .action-button');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const icon = button.querySelector('i');
            const action = icon.className;
            const movieCard = button.closest('.movie-card');
            const movieTitle = movieCard?.querySelector('h3')?.textContent || 'Unknown Movie';
            
            if (action.includes('fa-bookmark')) {
                toggleWatchlist(button, movieTitle);
            } else if (action.includes('fa-star')) {
                openRatingModal(movieTitle);
            } else if (action.includes('fa-info-circle')) {
                showMovieDetails(movieTitle);
            }
        });
    });
}

// Toggle movie in watchlist
function toggleWatchlist(button, movieTitle) {
    const icon = button.querySelector('i');
    
    // Toggle bookmark appearance
    if (icon.classList.contains('fas')) {
        icon.className = 'far fa-bookmark';
        showNotification(`Removed "${movieTitle}" from your watchlist`);
    } else {
        icon.className = 'fas fa-bookmark';
        showNotification(`Added "${movieTitle}" to your watchlist`);
    }
}

// Open rating modal for a movie
function openRatingModal(movieTitle) {
    // Scroll to rating form and pre-fill the movie title
    const rateSection = document.getElementById('rate-movie');
    if (rateSection) {
        rateSection.scrollIntoView({ behavior: 'smooth' });
        
        const titleInput = document.getElementById('movie-title-input');
        if (titleInput) {
            titleInput.value = movieTitle;
        }
        
        // Highlight the form
        rateSection.classList.add('highlight');
        setTimeout(() => {
            rateSection.classList.remove('highlight');
        }, 2000);
    }
}

// Show movie details
function showMovieDetails(movieTitle) {
    // In a real application, this would fetch movie details
    showNotification(`Loading details for "${movieTitle}"...`);
    
    // Scroll to spotlight section as example
    const spotlight = document.querySelector('.movie-spotlight');
    if (spotlight) {
        spotlight.scrollIntoView({ behavior: 'smooth' });
    }
}

// Utility function to show notifications
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Make visible
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Function to initialize rating buttons
function initializeRatingButtons() {
    // Any dynamically added rating buttons should link to ratings.html
    document.querySelectorAll('.action-button:not(.rating-btn)').forEach(button => {
        if (button.querySelector('i.fa-star')) {
            button.classList.add('rating-btn');
            // If it's not an anchor element, replace with anchor
            if (button.tagName !== 'A') {
                const star = button.innerHTML;
                const parent = button.parentNode;
                const anchor = document.createElement('a');
                anchor.href = 'ratings.html';
                anchor.className = 'action-button rating-btn';
                anchor.innerHTML = star;
                parent.replaceChild(anchor, button);
            }
        }
    });
}

// Handle "Rate This Movie" button in the spotlight section
const rateButtons = document.querySelectorAll('.btn-primary');
rateButtons.forEach(button => {
    if (button.textContent.includes('Rate') && !button.getAttribute('href')) {
        button.setAttribute('href', 'ratings.html');
    }
});

// Initialize any range sliders in the rate-movie-section to show their values
document.querySelectorAll('input[type="range"]').forEach(range => {
    const output = range.nextElementSibling;
    if (output && output.tagName === 'OUTPUT') {
        range.addEventListener('input', () => {
            output.textContent = range.value;
        });
    }
});