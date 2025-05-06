/**
 * Common JavaScript functionality for Entertainment Hub
 * Features:
 * - Navigation generation
 * - Theme switching (dark/light mode)
 * - Mobile menu toggle
 * - User menu dropdown
 * - Scroll-to-top button
 * - Dynamic breadcrumbs
 * - Search functionality
 * - User authentication state management
 * - Input validation
 * - Lazy loading for images
 * - Intersection animations
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all common functionality
    initNavigation();
    initThemeToggle();
    initMobileMenu();
    initUserMenu();
    initScrollToTop();
    initBreadcrumbs();
    initLazyLoading();
    initIntersectionAnimations();
    initSearchFunctionality();
    initAccessibility();
    
    // Page specific initializations
    const currentPage = getCurrentPage();
    switch(currentPage) {
        case 'anime': initAnimePage(); break;
        case 'manga': initMangaPage(); break;
        case 'movies': initMoviesPage(); break;
        case 'series': initSeriesPage(); break;
        case 'games': initGamesPage(); break;
        case 'community': initCommunityPage(); break;
        case 'watchlist': initWatchlistPage(); break;
        case 'profile': initProfilePage(); break;
        case 'signin': initAuthPage(); break;
    }
});

/**
 * Get the current page based on URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().split('.')[0];
    return filename || 'index';
}

/**
 * Initialize the main navigation
 */
function initNavigation() {
    const navItems = [
        { name: 'Home', url: 'index.html', icon: 'fa-home' },
        { name: 'Movies', url: 'movies.html', icon: 'fa-film' },
        { name: 'Series', url: 'series.html', icon: 'fa-tv' },
        { name: 'Anime', url: 'anime.html', icon: 'fa-dragon' },
        { name: 'Manga', url: 'manga.html', icon: 'fa-book' },
        { name: 'Games', url: 'games.html', icon: 'fa-gamepad' },
        { name: 'Community', url: 'community.html', icon: 'fa-users' }
    ];
    
    const navList = document.querySelector('.nav-list');
    if (!navList) return;
    
    const currentPage = getCurrentPage();
    
    navItems.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.innerHTML = `<i class="fas ${item.icon}"></i> ${item.name}`;
        
        if (currentPage === item.url.split('.')[0]) {
            a.classList.add('active');
        }
        
        li.appendChild(a);
        navList.appendChild(li);
    });
}

/**
 * Initialize theme toggle (dark/light mode)
 */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply theme
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
            themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    } else if (osPrefersDark) {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
    
    // Theme toggle click handler
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        const icon = this.querySelector('i');
        if (newTheme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    });
    
    // Listen for OS theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) { // Only if user hasn't manually set preference
            const newTheme = e.matches ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            
            // Update icon
            const icon = themeToggle.querySelector('i');
            if (newTheme === 'dark') {
                icon.classList.replace('fa-moon', 'fa-sun');
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
            }
        }
    });
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!menuToggle || !navList) return;
    
    menuToggle.addEventListener('click', function() {
        navList.classList.toggle('open');
        this.classList.toggle('active');
        
        // Accessibility
        const isExpanded = navList.classList.contains('open');
        this.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navList.contains(event.target) && !menuToggle.contains(event.target) && navList.classList.contains('open')) {
            navList.classList.remove('open');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', false);
        }
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && navList.classList.contains('open')) {
            navList.classList.remove('open');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', false);
        }
    });
}

/**
 * Initialize user menu dropdown
 */
function initUserMenu() {
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userDropdown = document.querySelector('.user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!userMenuToggle || !userDropdown) return;
    
    // Check if user is logged in
    const isLoggedIn = checkUserAuthState();
    
    // Toggle dropdown
    userMenuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
        
        // Accessibility
        const isExpanded = userDropdown.classList.contains('show');
        this.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!userDropdown.contains(event.target) && !userMenuToggle.contains(event.target)) {
            userDropdown.classList.remove('show');
            userMenuToggle.setAttribute('aria-expanded', false);
        }
    });
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear authentication
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            
            // Redirect to home or login page
            window.location.href = 'index.html';
        });
    }
}

/**
 * Check user authentication state
 */
function checkUserAuthState() {
    const authToken = localStorage.getItem('authToken');
    return !!authToken;
}

/**
 * Initialize scroll-to-top button
 */
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('back-to-top-btn');
    if (!scrollToTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    
    // Smooth scroll to top
    scrollToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Initialize dynamic breadcrumbs
 */
function initBreadcrumbs() {
    const main = document.querySelector('main');
    if (!main) return;
    
    const currentPage = getCurrentPage();
    if (currentPage === 'index') return;
    
    const breadcrumbsContainer = document.createElement('nav');
    breadcrumbsContainer.className = 'breadcrumbs';
    breadcrumbsContainer.setAttribute('aria-label', 'Breadcrumb');
    
    const breadcrumbsList = document.createElement('ol');
    
    // Home link
    const homeLi = document.createElement('li');
    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.textContent = 'Home';
    homeLi.appendChild(homeLink);
    breadcrumbsList.appendChild(homeLi);
    
    // Current page
    const currentLi = document.createElement('li');
    currentLi.textContent = capitalizeFirstLetter(currentPage);
    currentLi.setAttribute('aria-current', 'page');
    breadcrumbsList.appendChild(currentLi);
    
    breadcrumbsContainer.appendChild(breadcrumbsList);
    
    // Insert at the beginning of main
    main.insertBefore(breadcrumbsContainer, main.firstChild);
}

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    // Use native lazy loading if supported
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img:not(.no-lazy)');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
        });
    } else {
        // Fallback to Intersection Observer
        const lazyImages = document.querySelectorAll('img:not(.no-lazy)');
        
        if (!lazyImages.length) return;
        
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            lazyImageObserver.observe(img);
        });
    }
}

/**
 * Initialize intersection animations
 */
function initIntersectionAnimations() {
    // Apply animations when elements come into view
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if (!animatedElements.length) return;
    
    const animateObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animationClass = element.dataset.animation || 'fade-in';
                element.classList.add(animationClass);
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.2 });
    
    animatedElements.forEach(el => {
        animateObserver.observe(el);
    });
}

/**
 * Initialize search functionality
 */
function initSearchFunctionality() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    if (!searchForm || !searchInput) return;
    
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm.length < 2) {
            showToast('Please enter at least 2 characters to search');
            return;
        }
        
        // Redirect to search page with query
        window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
    });
}

/**
 * Initialize accessibility features
 */
function initAccessibility() {
    // Make sure all interactive elements have appropriate ARIA roles
    const buttons = document.querySelectorAll('button:not([role])');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });
    
    // Make sure all images have alt text
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
        img.setAttribute('alt', '');
    });
    
    // Add skip to content link
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.className = 'skip-link';
        skipLink.href = '#main';
        skipLink.textContent = 'Skip to content';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
}

/**
 * Page specific initializations
 */
function initAnimePage() {
    initSeasonalTabs();
    initRatingSliders();
    initAnimeQuiz();
}

function initMangaPage() {
    // Manga specific functionality
}

function initMoviesPage() {
    // Movies specific functionality
}

function initSeriesPage() {
    // Series specific functionality
}

function initGamesPage() {
    // Games specific functionality
}

function initCommunityPage() {
    // Community specific functionality
}

function initWatchlistPage() {
    // Watchlist specific functionality
}

function initProfilePage() {
    // Profile specific functionality
}

function initAuthPage() {
    initFormValidation();
}

/**
 * Initialize seasonal anime tabs
 */
function initSeasonalTabs() {
    const seasonTabs = document.querySelectorAll('.season-tab');
    const seasonalGrids = document.querySelectorAll('.seasonal-grid');
    
    if (!seasonTabs.length || !seasonalGrids.length) return;
    
    seasonTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const season = this.dataset.season;
            
            // Hide all grids, show selected
            seasonalGrids.forEach(grid => {
                grid.style.display = 'none';
            });
            document.getElementById(season).style.display = 'grid';
            
            // Update active tab
            seasonTabs.forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // If content not loaded yet, load it
            const grid = document.getElementById(season);
            if (grid.dataset.loaded !== 'true') {
                loadSeasonalAnime(season);
            }
        });
    });
}

/**
 * Load seasonal anime data
 */
function loadSeasonalAnime(season) {
    const grid = document.getElementById(season);
    if (!grid) return;
    
    // In a real application, you would fetch this data from a server
    // For now, we'll simulate loading with a placeholder
    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Simulate API call delay
    setTimeout(() => {
        // Sample data - in a real app, this would come from an API
        const animeData = getSeasonalAnimeData(season);
        
        // Clear loading state
        grid.innerHTML = '';
        
        // Add anime cards
        animeData.forEach(anime => {
            const card = createAnimeCard(anime);
            grid.appendChild(card);
        });
        
        // Mark as loaded
        grid.dataset.loaded = 'true';
    }, 1000);
}

/**
 * Get seasonal anime data - simulated
 */
function getSeasonalAnimeData(season) {
    // Simulate different seasonal data
    switch(season) {
        case 'winter2025':
            return [
                {
                    title: 'Attack on Titan Final Season',
                    image: 'attack on titan.jpg',
                    rating: 9.2,
                    studio: 'MAPPA',
                    episodes: 12,
                    tags: ['Action', 'Drama', 'Fantasy'],
                    platforms: ['netflix', 'amazon', 'crunchyroll']
                },
                {
                    title: 'My Hero Academia S8',
                    image: 'Heroacademia.jpg',
                    rating: 8.7,
                    studio: 'Bones',
                    episodes: 24,
                    tags: ['Action', 'Superhero', 'School'],
                    platforms: ['hulu', 'crunchyroll']
                },
                {
                    title: 'Chainsaw Man Part 2',
                    image: 'Chainsaw.jpg',
                    rating: 9.5,
                    studio: 'MAPPA',
                    episodes: 12,
                    tags: ['Action', 'Horror', 'Supernatural'],
                    platforms: ['hulu', 'amazon']
                }
            ];
        case 'fall2024':
            return [
                {
                    title: 'Demon Slayer: New Arc',
                    image: 'DemonSlayer.jpg',
                    rating: 9.1,
                    studio: 'Ufotable',
                    episodes: 13,
                    tags: ['Action', 'Supernatural', 'Historical'],
                    platforms: ['netflix', 'crunchyroll']
                },
                {
                    title: 'Jujutsu Kaisen S3',
                    image: 'JJK.jpeg',
                    rating: 9.4,
                    studio: 'MAPPA',
                    episodes: 12,
                    tags: ['Action', 'Supernatural', 'School'],
                    platforms: ['crunchyroll', 'hulu']
                }
            ];
        default:
            return [];
    }
}

/**
 * Create anime card element
 */
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    
    const platformIcons = {
        netflix: '<i class="fab fa-netflix" title="Available on Netflix"></i>',
        hulu: '<i class="fab fa-hulu" title="Available on Hulu"></i>',
        amazon: '<i class="fab fa-amazon" title="Available on Amazon Prime"></i>',
        crunchyroll: '<i class="fas fa-play-circle" title="Available on Crunchyroll"></i>'
    };
    
    let platformsHTML = '';
    anime.platforms.forEach(platform => {
        platformsHTML += platformIcons[platform] || '';
    });
    
    let tagsHTML = '';
    anime.tags.forEach(tag => {
        tagsHTML += `<span class="anime-tag ${tag.toLowerCase()}">${tag}</span>`;
    });
    
    card.innerHTML = `
        <div class="anime-image">
            <img src="${anime.image}" alt="${anime.title}">
            <div class="anime-overlay">
                <span class="anime-rating">${anime.rating}</span>
                <div class="anime-actions">
                    <button class="action-button" aria-label="Add to watchlist">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="action-button" aria-label="Rate anime">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="action-button" aria-label="More information">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="anime-info">
            <h3>${anime.title}</h3>
            <div class="anime-meta">
                <span class="studio">${anime.studio}</span>
                <span class="episodes">${anime.episodes} Episodes</span>
            </div>
            <div class="anime-tags">
                ${tagsHTML}
            </div>
            <div class="stream-platforms">
                ${platformsHTML}
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Initialize rating sliders
 */
function initRatingSliders() {
    const sliders = document.querySelectorAll('input[type="range"]');
    
    sliders.forEach(slider => {
        const output = slider.nextElementSibling;
        
        if (output && output.tagName === 'OUTPUT') {
            // Set initial value
            output.textContent = slider.value;
            
            // Update on input
            slider.addEventListener('input', function() {
                output.textContent = this.value;
            });
        }
    });
    
    // Initialize overall rating calculation
    const ratingForm = document.getElementById('anime-rating-form');
    if (ratingForm) {
        const categorySliders = ratingForm.querySelectorAll('.rating-sliders input[type="range"]');
        const starInputs = ratingForm.querySelectorAll('.star-rating input');
        
        // Calculate average from sliders and update star rating
        categorySliders.forEach(slider => {
            slider.addEventListener('input', updateOverallRating);
        });
        
        function updateOverallRating() {
            let sum = 0;
            let count = 0;
            
            categorySliders.forEach(slider => {
                sum += parseFloat(slider.value);
                count++;
            });
            
            const average = sum / count;
            const starIndex = Math.round(average / 2) - 1;
            
            if (starInputs[starIndex]) {
                starInputs[starIndex].checked = true;
            }
        }
    }
}

/**
 * Initialize anime quiz
 */
function initAnimeQuiz() {
    const quizForm = document.getElementById('anime-quiz-form');
    if (!quizForm) return;
    
    quizForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Quiz answers
        const correctAnswers = {
            q1: 'detective',
            q2: 'yourname'
        };
        
        let score = 0;
        let total = Object.keys(correctAnswers).length;
        
        // Check answers
        for (const [question, answer] of Object.entries(correctAnswers)) {
            const selectedOption = document.querySelector(`input[name="${question}"]:checked`);
            if (selectedOption && selectedOption.value === answer) {
                score++;
            }
        }
        
        // Show results
        showQuizResults(score, total);
    });
}

/**
 * Show quiz results
 */
function showQuizResults(score, total) {
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) return;
    
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'quiz-results fade-in';
    
    const percentage = (score / total) * 100;
    let message;
    
    if (percentage === 100) {
        message = 'Perfect score! You\'re an anime expert!';
    } else if (percentage >= 75) {
        message = 'Great job! You really know your anime!';
    } else if (percentage >= 50) {
        message = 'Not bad! You have decent anime knowledge.';
    } else {
        message = 'Looks like you have more anime to watch. Keep exploring!';
    }
    
    resultsDiv.innerHTML = `
        <h3>Your Score: ${score}/${total} (${percentage}%)</h3>
        <p>${message}</p>
        <button class="quiz-restart">Try Again</button>
    `;
    
    // Replace form with results
    quizContainer.innerHTML = '';
    quizContainer.appendChild(resultsDiv);
    
    // Add restart functionality
    const restartBtn = quizContainer.querySelector('.quiz-restart');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }
}

/**
 * Initialize form validation
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const formFields = form.querySelectorAll('input, textarea, select');
        
        formFields.forEach(field => {
            // Add validation classes
            if (field.required) {
                field.addEventListener('invalid', function() {
                    field.classList.add('is-invalid');
                });
                
                field.addEventListener('input', function() {
                    if (field.validity.valid) {
                        field.classList.remove('is-invalid');
                        field.classList.add('is-valid');
                    }
                });
            }
            
            // Check password strength
            if (field.type === 'password' && field.id === 'password') {
                field.addEventListener('input', checkPasswordStrength);
            }
        });
    });
}

/**
 * Check password strength
 */
function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthMeter = document.getElementById('password-strength');
    if (!strengthMeter) return;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update UI
    const strengthText = ['Very weak', 'Weak', 'Moderate', 'Strong', 'Very strong'][strength - 1] || '';
    strengthMeter.textContent = strengthText;
    
    // Update CSS class
    strengthMeter.className = 'password-strength';
    if (strength > 0) {
        strengthMeter.classList.add(`strength-${strength}`);
    }
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
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    toast.textContent = message;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * Helper: Capitalize first letter of a string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * User authentication functions
 */

// Simulate login (in a real app, this would connect to a backend)
function loginUser(email, password) {
    // Mock authentication - in a real app, this would be an API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Demo credentials
            if (email === 'demo@example.com' && password === 'password123') {
                const userData = {
                    id: 1,
                    name: 'Demo User',
                    email: 'demo@example.com',
                    avatar: 'swagspidey.jpg'
                };
                
                const authToken = 'mock-jwt-token-' + Date.now();
                
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                resolve(userData);
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1000);
    });
}

// Register new user
function registerUser(name, email, password) {
    // Mock registration - in a real app, this would be an API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Check if user already exists (mock)
            if (email === 'demo@example.com') {
                reject(new Error('User already exists'));
                return;
            }
            
            const userData = {
                id: Math.floor(Math.random() * 10000) + 2,
                name: name,
                email: email,
                avatar: 'Avatar.jpg'
            };
            
            const authToken = 'mock-jwt-token-' + Date.now();
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            resolve(userData);
        }, 1000);
    });
}

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Function to simulate API calls for any data
function fetchData(endpoint, params = {}) {
    // This is a mock function that simulates API calls
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const mockData = getMockData(endpoint, params);
            if (mockData) {
                resolve(mockData);
            } else {
                reject(new Error('Data not found'));
            }
        }, 800);
    });
}

// Generate mock data for simulated API calls
function getMockData(endpoint, params) {
    // In a real app, this would be replaced with actual API calls
    switch(endpoint) {
        case 'trending-anime':
            return [
                {
                    id: 1,
                    title: 'Attack on Titan',
                    image: 'attack on titan.jpg',
                    rating: 9.2
                },
                {
                    id: 2,
                    title: 'Demon Slayer',
                    image: 'DemonSlayer.jpg',
                    rating: 9.0
                },
                {
                    id: 3,
                    title: 'Jujutsu Kaisen',
                    image: 'JJK.jpeg',
                    rating: 9.1
                }
            ];
        default:
            return null;
    }
}