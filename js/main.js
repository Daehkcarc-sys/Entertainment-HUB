/**
 * Main JavaScript
 * 
 * Core functionality for the Entertainment Hub website
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initializeThemeToggle();
    initializeCarousels();
    initializeTabs();
    initializeDropdowns();
    initializeTooltips();
    initializeScrollAnimations();
    initializeSearch();
    initializeMobileMenu();
    initializeBackToTop();
    initializeAccordions();
    
    // Hide page loader when everything is ready
    setTimeout(() => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, 300);
});

/**
 * Theme Toggle Functionality
 * Handles switching between light and dark themes
 */
function initializeThemeToggle() {
    const themeToggleBtn = document.querySelector('.theme-toggle');
    if (!themeToggleBtn) return;
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme)) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.setAttribute('data-theme', 'light');
    }
    
    // Handle theme toggle click
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Add animation effect on theme change
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
    });
}

/**
 * Carousel Functionality
 * Powers the various carousels/sliders throughout the site
 */
function initializeCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    
    carousels.forEach(carousel => {
        const container = carousel.querySelector('.carousel-container');
        const items = carousel.querySelectorAll('.carousel-item');
        const prevButton = carousel.querySelector('.carousel-prev');
        const nextButton = carousel.querySelector('.carousel-next');
        const indicators = carousel.querySelector('.carousel-indicators');
        
        if (!container || items.length === 0) return;
        
        let currentIndex = 0;
        let autoplayInterval = null;
        const autoplay = carousel.getAttribute('data-autoplay') === 'true';
        const interval = parseInt(carousel.getAttribute('data-interval')) || 5000;
        const slidesPerView = parseInt(carousel.getAttribute('data-slides-per-view')) || 1;
        
        // Create indicators if they don't exist
        if (indicators && !indicators.children.length) {
            items.forEach((_, index) => {
                const indicator = document.createElement('button');
                indicator.classList.add('carousel-indicator');
                indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
                indicator.setAttribute('data-slide', index);
                if (index === 0) indicator.classList.add('active');
                
                indicator.addEventListener('click', () => goToSlide(index));
                indicators.appendChild(indicator);
            });
        }
        
        // Navigation functions
        function goToSlide(index) {
            // Ensure index is within bounds
            if (index < 0) index = items.length - 1;
            if (index >= items.length) index = 0;
            
            currentIndex = index;
            
            // Calculate scroll position
            const slideWidth = items[0].offsetWidth;
            const scrollPosition = slideWidth * currentIndex;
            
            // Smooth scroll to new position
            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
            
            // Update indicators
            const activeIndicator = indicators ? indicators.querySelector('.active') : null;
            const newIndicator = indicators ? indicators.querySelector(`[data-slide="${currentIndex}"]`) : null;
            
            if (activeIndicator) activeIndicator.classList.remove('active');
            if (newIndicator) newIndicator.classList.add('active');
            
            // Reset autoplay timer
            if (autoplay) {
                clearInterval(autoplayInterval);
                startAutoplay();
            }
        }
        
        function nextSlide() {
            goToSlide(currentIndex + 1);
        }
        
        function prevSlide() {
            goToSlide(currentIndex - 1);
        }
        
        function startAutoplay() {
            if (autoplay) {
                autoplayInterval = setInterval(nextSlide, interval);
            }
        }
        
        // Add event listeners
        if (prevButton) prevButton.addEventListener('click', prevSlide);
        if (nextButton) nextButton.addEventListener('click', nextSlide);
        
        // Start autoplay if enabled
        startAutoplay();
        
        // Pause autoplay on hover
        carousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
        carousel.addEventListener('mouseleave', startAutoplay);
        
        // Handle swipe gestures for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        container.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        container.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                nextSlide();
            } else if (touchEndX > touchStartX + swipeThreshold) {
                prevSlide();
            }
        }
    });
}

/**
 * Tab Navigation
 * Handles tab switching for tabbed content
 */
function initializeTabs() {
    const tabContainers = document.querySelectorAll('.tabs');
    
    tabContainers.forEach(tabContainer => {
        const tabNavItems = tabContainer.querySelectorAll('.tab-nav-item');
        
        tabNavItems.forEach(tab => {
            tab.addEventListener('click', () => {
                // Get the target tab content ID
                const targetId = tab.getAttribute('data-tab-target');
                
                // Remove active class from all tabs
                tabNavItems.forEach(item => item.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Find all tab content sections
                const tabContents = document.querySelectorAll('.tab-content');
                
                // Hide all tab contents
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Show the target tab content
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    });
}

/**
 * Dropdown Menus
 * Controls the behavior of dropdown menus
 */
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (!toggle || !menu) return;
        
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Close all other dropdowns
            dropdowns.forEach(other => {
                if (other !== dropdown && other.classList.contains('active')) {
                    other.classList.remove('active');
                }
            });
            
            // Toggle the dropdown
            dropdown.classList.toggle('active');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        dropdowns.forEach(dropdown => {
            const isClickInside = dropdown.contains(e.target);
            if (!isClickInside && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });
    });
}

/**
 * Tooltip Functionality
 * Shows tooltips on hover for elements with data-tooltip attribute
 */
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(tooltip => {
        // Handle positioning if specified
        const position = tooltip.getAttribute('data-position') || 'top';
        tooltip.setAttribute('data-position', position);
    });
}

/**
 * Scroll Animation
 * Triggers animations when elements come into view
 */
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-scroll]');
    
    if (animatedElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.classList.add('visible');
                    
                    // If the animation should only happen once, stop observing
                    if (element.getAttribute('data-scroll-once') !== 'false') {
                        intersectionObserver.unobserve(element);
                    }
                } else {
                    // If the animation should repeat when out of view
                    const element = entry.target;
                    if (element.getAttribute('data-scroll-once') === 'false') {
                        element.classList.remove('visible');
                    }
                }
            });
        }, observerOptions);
        
        animatedElements.forEach(element => {
            // Apply any delay if specified
            const delay = element.getAttribute('data-delay');
            if (delay) {
                element.style.transitionDelay = `${delay}s`;
            }
            
            intersectionObserver.observe(element);
        });
    }
}

/**
 * Search Functionality
 * Powers the site search with dynamic results
 */
function initializeSearch() {
    const searchContainers = document.querySelectorAll('.search-container');
    
    searchContainers.forEach(container => {
        const searchInput = container.querySelector('input');
        const searchButton = container.querySelector('button');
        const resultsContainer = container.querySelector('.search-results');
        
        if (!searchInput || !resultsContainer) return;
        
        // Sample search results - in a real implementation this would fetch from an API
        const sampleResults = [
            { title: 'Oppenheimer', type: 'Movie', url: 'movies.html?id=oppenheimer' },
            { title: 'Attack on Titan', type: 'Anime', url: 'anime.html?id=aot' },
            { title: 'The Dark Knight', type: 'Movie', url: 'movies.html?id=dark-knight' },
            { title: 'Elden Ring', type: 'Game', url: 'games.html?id=elden-ring' },
            { title: 'Breaking Bad', type: 'Series', url: 'series.html?id=breaking-bad' },
            { title: 'One Piece', type: 'Manga', url: 'manga.html?id=onepiece' },
            { title: 'Dune', type: 'Movie', url: 'movies.html?id=dune' },
            { title: 'God of War', type: 'Game', url: 'games.html?id=gow' }
        ];
        
        let debounceTimer;
        
        function performSearch() {
            const query = searchInput.value.trim().toLowerCase();
            
            // Clear previous results
            resultsContainer.innerHTML = '';
            
            if (query.length < 2) {
                resultsContainer.style.display = 'none';
                return;
            }
            
            // Filter results based on query
            const filteredResults = sampleResults.filter(result => 
                result.title.toLowerCase().includes(query)
            );
            
            if (filteredResults.length > 0) {
                filteredResults.forEach(result => {
                    const resultItem = document.createElement('a');
                    resultItem.href = result.url;
                    resultItem.className = 'search-result-item';
                    resultItem.innerHTML = `
                        <div class="search-result-title">${highlightMatch(result.title, query)}</div>
                        <div class="search-result-type">${result.type}</div>
                    `;
                    resultsContainer.appendChild(resultItem);
                });
                
                resultsContainer.style.display = 'block';
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No results found';
                resultsContainer.appendChild(noResults);
                resultsContainer.style.display = 'block';
            }
        }
        
        function highlightMatch(text, query) {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<span class="highlight">$1</span>');
        }
        
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(performSearch, 300);
        });
        
        searchButton.addEventListener('click', performSearch);
        
        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                resultsContainer.style.display = 'none';
            }
        });
        
        // Handle keyboard navigation in search results
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                resultsContainer.style.display = 'none';
            } else if (e.key === 'Enter') {
                performSearch();
            }
        });
    });
}

/**
 * Mobile Menu Toggle
 * Controls the mobile navigation menu
 */
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!mobileToggle || !navList) return;
    
    mobileToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
        mobileToggle.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

/**
 * Back to Top Button
 * Shows a button to scroll back to top when scrolled down
 */
function initializeBackToTop() {
    const backToTopButton = document.querySelector('.back-to-top');
    
    if (!backToTopButton) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Accordion Functionality
 * Controls expandable/collapsible accordion elements
 */
function initializeAccordions() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        if (!header) return;
        
        header.addEventListener('click', () => {
            // Check if this accordion allows multiple open items
            const accordion = item.closest('.accordion');
            const allowMultiple = accordion ? 
                accordion.getAttribute('data-allow-multiple') === 'true' : false;
            
            if (!allowMultiple) {
                // Close other items
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.closest('.accordion') === accordion) {
                        otherItem.classList.remove('active');
                    }
                });
            }
            
            // Toggle this item
            item.classList.toggle('active');
        });
    });
}

/**
 * Utility Functions
 */

// Check if an element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Format date helper
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Debounce function to limit function calls
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}