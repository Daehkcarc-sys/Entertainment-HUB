/**
 * Entertainment Hub - Main JavaScript
 * This file contains shared functionality across the entire site
 * April 2025
 */

document.addEventListener('DOMContentLoaded', () => {
    // Load common components from common.js
    if (typeof createUnifiedHeader === 'function') {
        createUnifiedHeader();
    }
    if (typeof createUnifiedFooter === 'function') {
        createUnifiedFooter();
    }
    if (typeof createBreadcrumbs === 'function') {
        createBreadcrumbs();
    }
    if (typeof setupSearchSystem === 'function') {
        setupSearchSystem();
    }
    if (typeof initializeRecommendationLinks === 'function') {
        initializeRecommendationLinks();
    }

    // Initialize components
    initializeDarkMode();
    initializePageLoader();
    initializeScrollTopButton();
    initializeMobileMenu();
    initializeCarousels();
    initializeAnimations();
    initializeCounters();
    initializeTooltips();
    initializePopups();
    initializeNotifications();
    initializeForms();
    initializeTrendingFilters();
    initializeSmoothScrolling();
    initializeCardAnimations(); // Added new card animations function
    initializeAnimeNotifications(); // Initialize anime notifications
    
    // Set up event listeners for common UI elements
    setupEventListeners();

    // Animate recommendation cards on page load
    const recommendationCards = document.querySelectorAll('.recommendation-card');
    
    if (recommendationCards.length) {
        recommendationCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 100 * index);
        });
    }
    
    // Add animation for user cards
    const userCards = document.querySelectorAll('.user-card');
    
    if (userCards.length) {
        userCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.querySelector('.connect-btn').classList.add('pulse-animation');
            });
            
            card.addEventListener('mouseleave', () => {
                card.querySelector('.connect-btn').classList.remove('pulse-animation');
            });
        });
    }
    
    // Handle connect button clicks
    const connectButtons = document.querySelectorAll('.connect-btn');
    if (connectButtons.length) {
        connectButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentText = this.textContent;
                if (currentText === 'Connect') {
                    this.textContent = 'Connected';
                    this.classList.add('connected');
                    // We could add notification logic here
                } else {
                    this.textContent = 'Connect';
                    this.classList.remove('connected');
                }
            });
        });
    }
});

// Add smooth scrolling for recommendation sections
const scrollContainers = document.querySelectorAll('.users-scroll, .recommendations-container');
if (scrollContainers.length) {
    scrollContainers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('active');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.classList.remove('active');
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.classList.remove('active');
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed
            container.scrollLeft = scrollLeft - walk;
        });
    });
}

// NEW FUNCTION: Initialize card animations and interactions
function initializeCardAnimations() {
    // All types of content cards across the site
    const contentCards = document.querySelectorAll('.reco-card, .movie-card, .series-card, .anime-card, .game-card, .manga-card, .recommendation-item, .trending-item');
    
    if (contentCards.length) {
        // Add parallax hover effect to cards
        contentCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                // Get position of mouse relative to card
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element
                const y = e.clientY - rect.top; // y position within the element
                
                // Calculate rotation based on mouse position
                // Divide by small numbers to limit rotation angle
                const rotateY = (x - rect.width / 2) / 15;
                const rotateX = (rect.height / 2 - y) / 15;
                
                // Apply transform
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                card.style.transition = 'transform 0.1s ease';
                
                // Add reflection effect
                const image = card.querySelector('img');
                if (image) {
                    const shine = x / rect.width * 100;
                    image.style.filter = `brightness(1.05) contrast(1.05)`;
                }
            });
            
            card.addEventListener('mouseleave', () => {
                // Reset transform on mouse leave
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                card.style.transition = 'transform 0.5s ease';
                
                // Remove reflection effect
                const image = card.querySelector('img');
                if (image) {
                    image.style.filter = '';
                }
            });
        });
    }
    
    // Handle horizontal card scrolling for all card containers
    const cardContainers = document.querySelectorAll('.scrollable-cards, .similar-users, .reco-grid, .recommendations-row');
    
    if (cardContainers.length) {
        cardContainers.forEach(container => {
            // Add scroll buttons if not already present
            if (!container.querySelector('.scroll-btn-left') && !container.classList.contains('no-scroll-buttons')) {
                // Create scroll buttons
                const leftButton = document.createElement('button');
                leftButton.className = 'scroll-btn scroll-btn-left';
                leftButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
                
                const rightButton = document.createElement('button');
                rightButton.className = 'scroll-btn scroll-btn-right';
                rightButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
                
                // Add buttons to container
                container.appendChild(leftButton);
                container.appendChild(rightButton);
                
                // Get scroll amount based on first child width
                const firstChild = container.querySelector('.reco-card, .movie-card, .series-card, .user-card, .anime-card, .game-card, .recommendation-item');
                const scrollAmount = firstChild ? (firstChild.offsetWidth + 20) : 300;
                
                // Scroll left
                leftButton.addEventListener('click', () => {
                    container.scrollBy({
                        left: -scrollAmount,
                        behavior: 'smooth'
                    });
                });
                
                // Scroll right
                rightButton.addEventListener('click', () => {
                    container.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                });
                
                // Show/hide buttons based on scroll position
                container.addEventListener('scroll', () => {
                    if (container.scrollLeft <= 10) {
                        leftButton.classList.add('hidden');
                    } else {
                        leftButton.classList.remove('hidden');
                    }
                    
                    if (container.scrollLeft >= (container.scrollWidth - container.clientWidth - 10)) {
                        rightButton.classList.add('hidden');
                    } else {
                        rightButton.classList.remove('hidden');
                    }
                });
                
                // Initial state
                leftButton.classList.add('hidden');
            }
            
            // Add horizontal wheel scrolling for card containers
            container.addEventListener('wheel', (e) => {
                // If user is holding shift key or this is a horizontal scroll device
                if (e.deltaX !== 0 || e.shiftKey) return;
                
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }, { passive: false });
        });
    }
    
    // Add lazy loading functionality
    const cardImages = document.querySelectorAll('.reco-image img, .movie-card img, .series-card img, .anime-card img, .game-card img, .manga-card img');
    
    if (cardImages.length && 'IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px'
        });
        
        cardImages.forEach(img => {
            // Only observe images with data-src
            if (img.getAttribute('data-src')) {
                imageObserver.observe(img);
            }
        });
    }
}

// NEW FUNCTION: Anime Notification System
/**
 * Anime Notification System - NEW FEATURE
 * Tracks and notifies users about new anime releases and updates
 */
function initializeAnimeNotifications() {
    // Check if user has opted in to notifications
    const notificationsEnabled = localStorage.getItem('animeNotificationsEnabled') === 'true';
    
    // Create toggle switch in anime pages
    const animeContent = document.querySelector('.anime-content');
    if (animeContent && !document.querySelector('.anime-notification-toggle')) {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'notification-toggle-container';
        toggleContainer.innerHTML = `
            <label class="notification-toggle">
                <input type="checkbox" id="anime-notification-toggle" ${notificationsEnabled ? 'checked' : ''}>
                <span class="notification-toggle-slider"></span>
            </label>
            <span>Notify me about new episodes and releases</span>
        `;
        
        animeContent.insertBefore(toggleContainer, animeContent.firstChild);
        
        // Add event listener to toggle
        const toggle = document.getElementById('anime-notification-toggle');
        toggle.addEventListener('change', function() {
            localStorage.setItem('animeNotificationsEnabled', this.checked);
            
            if (this.checked) {
                showNotification('You will now receive notifications about new anime releases!', 'success');
                registerAnimeNotificationTopics();
            } else {
                showNotification('Anime notifications have been disabled.', 'info');
                unregisterAnimeNotificationTopics();
            }
        });
    }
    
    // Check for new releases on page load (if enabled)
    if (notificationsEnabled) {
        checkForNewAnimeReleases();
    }
}

/**
 * Checks for new anime releases and notifies the user
 */
function checkForNewAnimeReleases() {
    // In a production environment, this would fetch from an API
    // For demo purposes, we'll simulate some new releases
    const lastCheck = localStorage.getItem('lastAnimeCheck');
    const now = new Date().getTime();
    
    // Only check once per day to avoid spamming notifications
    if (!lastCheck || (now - parseInt(lastCheck) > 24 * 60 * 60 * 1000)) {
        // Simulate new releases (in production would come from API)
        const newReleases = [
            { title: 'Demon Slayer', episode: 'Season 4, Episode 3', releaseDate: '2025-04-19' },
            { title: 'Chainsaw Man', episode: 'Season 2, Episode 1', releaseDate: '2025-04-20' },
            { title: 'Jujutsu Kaisen', episode: 'Season 3, Episode 5', releaseDate: '2025-04-18' }
        ];
        
        // Get user's followed anime from localStorage
        const userFollowing = JSON.parse(localStorage.getItem('userFollowedAnime') || '[]');
        
        // Notify about new episodes for anime the user follows
        newReleases.forEach(anime => {
            // Only notify if this is for an anime the user follows
            if (userFollowing.includes(anime.title)) {
                // Check if we've already notified about this specific episode
                const notificationKey = `${anime.title}-${anime.episode}`;
                if (!localStorage.getItem(notificationKey)) {
                    // Create notification
                    showNotification(`New episode available: ${anime.title} - ${anime.episode}`, 'anime');
                    
                    // Mark as notified
                    localStorage.setItem(notificationKey, 'true');
                }
            }
        });
        
        // Update last check time
        localStorage.setItem('lastAnimeCheck', now.toString());
    }
}

/**
 * Register user preferences for anime notification topics
 */
function registerAnimeNotificationTopics() {
    // In production, this would register with a push notification service
    // For now, we'll just save to localStorage
    let followedAnime = JSON.parse(localStorage.getItem('userFollowedAnime') || '[]');
    
    // Add default popular anime if user hasn't selected any
    if (followedAnime.length === 0) {
        followedAnime = ['Demon Slayer', 'Attack on Titan', 'Jujutsu Kaisen', 'One Piece', 'Chainsaw Man'];
        localStorage.setItem('userFollowedAnime', JSON.stringify(followedAnime));
    }
}

/**
 * Unregister from anime notification topics
 */
function unregisterAnimeNotificationTopics() {
    // In production, this would unregister with a push notification service
    // We'll keep the user's preferences but disable notifications
}

/**
 * Allows user to follow/unfollow specific anime for notifications
 */
function toggleAnimeFollow(animeTitle) {
    let followedAnime = JSON.parse(localStorage.getItem('userFollowedAnime') || '[]');
    
    if (followedAnime.includes(animeTitle)) {
        // Unfollow
        followedAnime = followedAnime.filter(title => title !== animeTitle);
        showNotification(`You'll no longer receive updates for ${animeTitle}`, 'info');
    } else {
        // Follow
        followedAnime.push(animeTitle);
        showNotification(`You'll now receive updates for ${animeTitle}`, 'success');
    }
    
    localStorage.setItem('userFollowedAnime', JSON.stringify(followedAnime));
}

/**
 * Initialize all carousels on the page
 */
function initializeCarousels() {
    // Hero carousel
    const heroCarousel = document.querySelector('.hero-carousel');
    if (heroCarousel) {
        const slides = heroCarousel.querySelectorAll('.carousel-slide');
        const indicators = heroCarousel.querySelectorAll('.carousel-indicators .indicator');
        const prevBtn = heroCarousel.querySelector('.carousel-button.prev');
        const nextBtn = heroCarousel.querySelector('.carousel-button.next');
        let currentSlide = 0;
        let slideInterval;
        
        function showSlide(index) {
            // Hide all slides
            slides.forEach(slide => slide.classList.remove('active'));
            indicators.forEach(indicator => indicator.classList.remove('active'));
            
            // Show selected slide
            slides[index].classList.add('active');
            indicators[index].classList.add('active');
            currentSlide = index;
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
        
        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }
        
        // Event listeners
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => showSlide(index));
        });
        
        // Auto slide
        function startSlideShow() {
            slideInterval = setInterval(nextSlide, 5000);
        }
        
        function pauseSlideShow() {
            clearInterval(slideInterval);
        }
        
        // Start autoplay and pause on hover
        startSlideShow();
        
        heroCarousel.addEventListener('mouseenter', pauseSlideShow);
        heroCarousel.addEventListener('mouseleave', startSlideShow);
        
        // Swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        heroCarousel.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        heroCarousel.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                nextSlide();
            } else if (touchEndX - touchStartX > 50) {
                prevSlide();
            }
        }, { passive: true });
    }
    
    // Testimonial slider
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (testimonialSlider) {
        const track = testimonialSlider.querySelector('.testimonial-track');
        const items = testimonialSlider.querySelectorAll('.testimonial-item');
        const indicators = testimonialSlider.querySelectorAll('.testimonial-indicators .indicator');
        let currentIndex = 0;
        
        function showTestimonial(index) {
            indicators.forEach(ind => ind.classList.remove('active'));
            indicators[index].classList.add('active');
            
            track.style.transform = `translateX(-${index * 100}%)`;
            currentIndex = index;
        }
        
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => showTestimonial(index));
        });
        
        // Auto rotate testimonials
        setInterval(() => {
            currentIndex = (currentIndex + 1) % items.length;
            showTestimonial(currentIndex);
        }, 8000);
    }
    
    // Trending slider
    const trendingSlider = document.querySelector('.trending-slider');
    if (trendingSlider) {
        const prevBtn = document.querySelector('.trending-prev');
        const nextBtn = document.querySelector('.trending-next');
        const items = trendingSlider.querySelectorAll('.trending-item');
        const itemWidth = items[0]?.offsetWidth + 20; // including margin
        let currentPosition = 0;
        let maxPosition = Math.max(0, items.length * itemWidth - trendingSlider.offsetWidth);
        
        function slide(direction) {
            if (direction === 'next') {
                currentPosition = Math.min(currentPosition + itemWidth * 2, maxPosition);
            } else {
                currentPosition = Math.max(currentPosition - itemWidth * 2, 0);
            }
            
            trendingSlider.style.transform = `translateX(-${currentPosition}px)`;
            
            // Update button states
            prevBtn.disabled = currentPosition === 0;
            nextBtn.disabled = currentPosition >= maxPosition;
        }
        
        if (prevBtn) prevBtn.addEventListener('click', () => slide('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => slide('next'));
        
        // Update on resize
        window.addEventListener('resize', () => {
            // Recalculate dimensions
            maxPosition = Math.max(0, items.length * itemWidth - trendingSlider.offsetWidth);
            
            // Reset position if needed
            if (currentPosition > maxPosition) {
                currentPosition = maxPosition;
                trendingSlider.style.transform = `translateX(-${currentPosition}px)`;
            }
            
            // Update button states
            if (prevBtn) prevBtn.disabled = currentPosition === 0;
            if (nextBtn) nextBtn.disabled = currentPosition >= maxPosition;
        });
    }
}

/**
 * Initialize AOS animations
 */
function initializeAnimations() {
    // Check if AOS is loaded
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }
}

/**
 * Initialize counter animations for stats
 */
function initializeCounters() {
    const stats = document.querySelectorAll('.stat-number');
    
    if (stats.length) {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const countTo = parseInt(target.getAttribute('data-count'), 10);
                    let currentCount = 0;
                    const increment = Math.ceil(countTo / 50);
                    const duration = 1500;
                    const interval = duration / (countTo / increment);
                    
                    const counter = setInterval(() => {
                        currentCount += increment;
                        if (currentCount >= countTo) {
                            target.textContent = countTo;
                            clearInterval(counter);
                        } else {
                            target.textContent = currentCount;
                        }
                    }, interval);
                    
                    observer.unobserve(target);
                }
            });
        }, options);
        
        stats.forEach(stat => {
            observer.observe(stat);
        });
    }
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        const tooltipText = trigger.getAttribute('data-tooltip');
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
        
        function positionTooltip(event) {
            const rect = trigger.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        }
        
        trigger.addEventListener('mouseenter', () => {
            positionTooltip();
            tooltip.style.opacity = '1';
        });
        
        trigger.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}

/**
 * Initialize popup system
 */
function initializePopups() {
    // Create popup container if it doesn't exist
    let popupContainer = document.querySelector('.popup-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.className = 'popup-container';
        
        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'popup-overlay';
        
        popupContainer.appendChild(popupOverlay);
        document.body.appendChild(popupContainer);
        
        // Close popup when clicking overlay
        popupOverlay.addEventListener('click', () => {
            closePopup();
        });
    }
    
    // Setup trigger elements
    const popupTriggers = document.querySelectorAll('[data-popup]');
    
    popupTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const popupType = trigger.getAttribute('data-popup');
            const content = trigger.getAttribute('data-content');
            
            if (popupType === 'image' && content) {
                showImagePopup(content);
            } else if (popupType === 'video' && content) {
                showVideoPopup(content);
            } else if (popupType === 'iframe' && content) {
                showIframePopup(content);
            }
        });
    });
}

/**
 * Show image in popup
 */
function showImagePopup(imageUrl) {
    const popupContainer = document.querySelector('.popup-container');
    
    // Create content if it doesn't exist
    let popupContent = popupContainer.querySelector('.popup-content');
    if (!popupContent) {
        popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        popupContainer.appendChild(popupContent);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'popup-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.addEventListener('click', closePopup);
        popupContent.appendChild(closeButton);
    }
    
    // Show loading spinner
    popupContent.innerHTML = '<div class="popup-loading"><div class="spinner"></div></div>';
    
    // Load image
    const img = new Image();
    img.className = 'popup-image';
    img.onload = function() {
        popupContent.innerHTML = '';
        popupContent.appendChild(img);
        
        // Add close button again
        const closeButton = document.createElement('button');
        closeButton.className = 'popup-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.addEventListener('click', closePopup);
        popupContent.appendChild(closeButton);
    };
    
    img.src = imageUrl;
    
    // Show popup
    popupContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Show video in popup
 */
function showVideoPopup(videoUrl) {
    const popupContainer = document.querySelector('.popup-container');
    
    // Create content if it doesn't exist
    let popupContent = popupContainer.querySelector('.popup-content');
    if (!popupContent) {
        popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        popupContainer.appendChild(popupContent);
    }
    
    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    
    // Check if it's a YouTube URL
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        // Extract YouTube video ID
        let videoId = '';
        if (videoUrl.includes('youtube.com/watch')) {
            videoId = new URL(videoUrl).searchParams.get('v');
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1];
        }
        
        if (videoId) {
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            
            videoContainer.appendChild(iframe);
        }
    } else {
        // Regular video file
        const video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        
        const source = document.createElement('source');
        source.src = videoUrl;
        source.type = `video/${videoUrl.split('.').pop()}`;
        
        video.appendChild(source);
        videoContainer.appendChild(video);
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', closePopup);
    
    // Clear and set content
    popupContent.innerHTML = '';
    popupContent.appendChild(closeButton);
    popupContent.appendChild(videoContainer);
    
    // Show popup
    popupContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Show iframe in popup
 */
function showIframePopup(iframeUrl) {
    const popupContainer = document.querySelector('.popup-container');
    
    // Create content if it doesn't exist
    let popupContent = popupContainer.querySelector('.popup-content');
    if (!popupContent) {
        popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        popupContainer.appendChild(popupContent);
    }
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '80vh';
    iframe.src = iframeUrl;
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', closePopup);
    
    // Clear and set content
    popupContent.innerHTML = '';
    popupContent.appendChild(closeButton);
    popupContent.appendChild(iframe);
    
    // Show popup
    popupContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close popup
 */
function closePopup() {
    const popupContainer = document.querySelector('.popup-container');
    const popupContent = popupContainer.querySelector('.popup-content');
    
    // Hide popup
    popupContainer.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear content after animation
    setTimeout(() => {
        if (popupContent) {
            const closeButton = popupContent.querySelector('.popup-close');
            popupContent.innerHTML = '';
            if (closeButton) popupContent.appendChild(closeButton);
        }
    }, 300);
}

/**
 * Initialize notification system
 */
function initializeNotifications() {
    // Create notification container if it doesn't exist
    let notificationsContainer = document.querySelector('.notifications-container');
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
}

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - Type of notification: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duration in ms before auto-close
 */
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.querySelector('.notifications-container');
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const content = document.createElement('div');
    content.className = 'notification-content';
    content.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    });
    
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-close
    if (duration) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('hide');
                setTimeout(() => {
                    if (notification.parentElement) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }
}

/**
 * Initialize form handling
 */
function initializeForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Demo form handling - in a real app, you'd submit this to a server
            const formType = form.getAttribute('data-form-type');
            
            // For demo newsletter form
            if (form.classList.contains('newsletter-form')) {
                e.preventDefault();
                
                // Simulate submission
                const email = form.querySelector('input[type="email"]').value;
                if (email) {
                    // Success message
                    showNotification('Thank you for subscribing to our newsletter!', 'success');
                    form.reset();
                } else {
                    showNotification('Please enter a valid email address.', 'error');
                }
            }
            
            // For demo poll form
            if (form.classList.contains('poll-options')) {
                e.preventDefault();
                
                // Check if an option is selected
                const selected = form.querySelector('input[name="poll"]:checked');
                if (selected) {
                    showNotification('Thank you for voting!', 'success');
                    form.querySelector('.poll-submit').disabled = true;
                    form.querySelector('.poll-submit').textContent = 'Voted';
                } else {
                    showNotification('Please select an option before voting.', 'warning');
                }
            }
            
            // For demo discovery form
            if (form.classList.contains('discovery-form')) {
                e.preventDefault();
                
                const placeholder = document.querySelector('.discovery-placeholder');
                const items = document.querySelector('.discovery-items');
                
                if (placeholder && items) {
                    placeholder.style.display = 'none';
                    items.style.display = 'grid';
                    items.innerHTML = `
                        <div class="discovery-loading">
                            <div class="spinner"></div>
                            <p>Generating personalized recommendations...</p>
                        </div>
                    `;
                    
                    // Simulate API call with delay
                    setTimeout(() => {
                        // In a real app, this would be dynamic based on user's selections
                        items.innerHTML = `
                            <div class="recommendation-item">
                                <div class="recommendation-poster">
                                    <img src="Interstellar.jpg" alt="Interstellar">
                                    <div class="recommendation-type">Movie</div>
                                </div>
                                <div class="recommendation-details">
                                    <h3>Interstellar</h3>
                                    <div class="recommendation-meta">
                                        <span><i class="fas fa-star"></i> 9.3</span>
                                        <span>2014</span>
                                    </div>
                                </div>
                            </div>
                            <div class="recommendation-item">
                                <div class="recommendation-poster">
                                    <img src="Steins.jpg" alt="Steins;Gate">
                                    <div class="recommendation-type">Anime</div>
                                </div>
                                <div class="recommendation-details">
                                    <h3>Steins;Gate</h3>
                                    <div class="recommendation-meta">
                                        <span><i class="fas fa-star"></i> 9.5</span>
                                        <span>2011</span>
                                    </div>
                                </div>
                            </div>
                            <div class="recommendation-item">
                                <div class="recommendation-poster">
                                    <img src="LastHorizon.jpg" alt="Last Horizon">
                                    <div class="recommendation-type">Game</div>
                                </div>
                                <div class="recommendation-details">
                                    <h3>Last Horizon</h3>
                                    <div class="recommendation-meta">
                                        <span><i class="fas fa-star"></i> 9.1</span>
                                        <span>2024</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        showNotification('Recommendations generated based on your preferences!', 'success');
                    }, 2000);
                }
            }
        });
    });
}

/**
 * Initialize trending filters
 */
function initializeTrendingFilters() {
    const filterButtons = document.querySelectorAll('.trend-filter');
    
    if (filterButtons.length) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.getAttribute('data-filter');
                
                // In a real app, you'd fetch different data here
                // For this demo, we'll just show a notification
                showNotification(`Showing trending content for: ${filter}`, 'info');
            });
        });
    }
}

/**
 * Set up smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                
                window.scrollTo({
                    top: targetPosition - headerHeight - 20,
                    behavior: 'smooth'
                });
                
                // Update URL
                history.pushState(null, null, targetId);
            }
        });
    });
}

/**
 * Set up event listeners for common UI elements
 */
function setupEventListeners() {
    // Initialize click listeners for buttons that show notifications
    document.querySelectorAll('[data-notification]').forEach(element => {
        element.addEventListener('click', function() {
            const message = this.getAttribute('data-notification-message') || 'Action completed!';
            const type = this.getAttribute('data-notification-type') || 'info';
            showNotification(message, type);
        });
    });
    
    // Rating system
    document.querySelectorAll('.rating-system').forEach(ratingSystem => {
        const stars = ratingSystem.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                // Set the rating value
                ratingSystem.setAttribute('data-rating', index + 1);
                
                // Update visual state
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('active');
                    } else {
            
            countSpan.textContent = count;
            
            // In a real app, you'd send this to a server
        });
    });
}

// Utility functions

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - Time limit in milliseconds
 */
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

/**
 * Debounce function to prevent a function from being called too frequently
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 */
function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Format relative time from a date
 * @param {Date|string|number} date - The date to format
 */
function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.round((now - then) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30.4);
    const years = Math.round(days / 365);
    
    if (seconds < 60) {
        return 'just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (days < 7) {
        return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (weeks < 4) {
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else if (months < 12) {
        return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
        return `${years} year${years === 1 ? '' : 's'} ago`;
    }
}