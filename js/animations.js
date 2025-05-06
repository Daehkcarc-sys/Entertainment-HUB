/**
 * Entertainment Hub - Animations Library
 * Implements smooth transitions and effects for better user experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all animations
    initAnimations();
});

/**
 * Initialize animations throughout the site
 */
function initAnimations() {
    // Add page transition effects
    setupPageTransitions();
    
    // Set up scroll animations
    setupScrollAnimations();
    
    // Set up hover effects
    setupHoverEffects();
    
    // Set up button animations
    setupButtonAnimations();
    
    // Set up card animations
    setupCardAnimations();
    
    // Set up modal animations
    setupModalAnimations();
    
    // Set up navigation animations
    setupNavigationAnimations();
}

/**
 * Set up smooth page transitions
 */
function setupPageTransitions() {
    // Capture all internal links
    document.querySelectorAll('a').forEach(link => {
        // Skip external links, anchor links, etc.
        if (
            !link.href ||
            link.target === '_blank' ||
            link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:') ||
            link.href.includes('#') ||
            link.getAttribute('download') !== null
        ) {
            return;
        }
        
        // Ensure it's an internal link
        const linkUrl = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        if (linkUrl.host !== currentUrl.host) {
            return;
        }
        
        // Add click handler for internal navigation
        link.addEventListener('click', function(e) {
            // Skip if modifier key is pressed
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }
            
            e.preventDefault();
            
            // Get target URL
            const targetUrl = this.href;
            
            // Add exit animation
            document.body.classList.add('page-exit');
            
            // Change page after animation completes
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 300); // Matches animation duration
        });
    });
    
    // Add entry animation when page loads
    if (document.readyState === 'complete') {
        document.body.classList.add('page-enter');
    } else {
        window.addEventListener('load', () => {
            document.body.classList.add('page-enter');
        });
    }
}

/**
 * Set up scroll-triggered animations
 */
function setupScrollAnimations() {
    // Elements that should animate when scrolled into view
    const animatables = document.querySelectorAll('.animate-on-scroll');
    
    if (!animatables.length) return;
    
    // Set up observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Get animation type from data attribute or use default
                const animationType = element.dataset.animation || 'fade-in';
                element.classList.add('animated', animationType);
                
                // Stop observing after animation is triggered
                observer.unobserve(element);
            }
        });
    }, {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: '0px 0px -10% 0px' // Adjust trigger point to be slightly above the bottom of viewport
    });
    
    // Start observing elements
    animatables.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Set up hover effects
 */
function setupHoverEffects() {
    // Cards with hover effects
    const hoverCards = document.querySelectorAll('.hover-effect');
    
    hoverCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.add('hover-out');
            setTimeout(() => {
                this.classList.remove('hover', 'hover-out');
            }, 300); // Match animation duration
        });
    });
}

/**
 * Set up button animations
 */
function setupButtonAnimations() {
    // Ripple effect for buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn, .btn *')) {
            const button = e.target.closest('.btn');
            
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            button.appendChild(ripple);
            
            // Set ripple position based on click
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - (size / 2)}px`;
            ripple.style.top = `${e.clientY - rect.top - (size / 2)}px`;
            
            // Add active class
            ripple.classList.add('active');
            
            // Remove ripple after animation completes
            setTimeout(() => {
                ripple.remove();
            }, 600); // Match animation duration
        }
    });
}

/**
 * Set up card animations
 */
function setupCardAnimations() {
    // Card stagger effect for lists of cards
    const cardContainers = document.querySelectorAll('.card-container, .results-container');
    
    cardContainers.forEach(container => {
        const cards = container.querySelectorAll('.card, .result-card');
        
        cards.forEach((card, index) => {
            // Check if card is already visible (for initial page load)
            const rect = card.getBoundingClientRect();
            const isVisible = rect.top <= window.innerHeight;
            
            if (isVisible) {
                // Stagger the animation based on index
                setTimeout(() => {
                    card.classList.add('card-visible');
                }, index * 80); // 80ms stagger between cards
            }
        });
        
        // Handle cards that come into view later
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    
                    // Get all the sibling cards in view
                    const siblings = Array.from(container.querySelectorAll('.card, .result-card'));
                    const visibleIndex = siblings.indexOf(card);
                    
                    setTimeout(() => {
                        card.classList.add('card-visible');
                    }, visibleIndex * 50); // Shorter delay for scroll-triggered
                    
                    observer.unobserve(card);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        });
        
        cards.forEach(card => {
            // Only observe cards that aren't already visible
            if (!card.classList.contains('card-visible')) {
                observer.observe(card);
            }
        });
    });
}

/**
 * Set up modal animations
 */
function setupModalAnimations() {
    // Modal triggers
    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            
            const modalId = this.dataset.modalTarget;
            const modal = document.getElementById(modalId);
            
            if (modal) {
                openModal(modal);
            }
        });
    });
    
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close when clicking overlay
    document.addEventListener('click', function(e) {
        if (e.target.matches('.modal')) {
            closeModal(e.target);
        }
    });
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.active');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

/**
 * Open a modal with animation
 */
function openModal(modal) {
    if (!modal) return;
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add animation classes
    setTimeout(() => {
        modal.classList.add('active');
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('active');
        }
    }, 10);
}

/**
 * Close a modal with animation
 */
function closeModal(modal) {
    if (!modal) return;
    
    // Remove animation classes
    modal.classList.remove('active');
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('active');
    }
    
    // Hide modal after animation completes
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300); // Match animation duration
}

/**
 * Set up navigation animations
 */
function setupNavigationAnimations() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileNav.classList.toggle('active');
            
            // Toggle body scroll
            if (mobileNav.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }
    
    // Dropdown animations
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            const parent = this.parentElement;
            const dropdown = parent.querySelector('.dropdown-menu');
            
            if (!dropdown) return;
            
            // Check if already open
            const isOpen = dropdown.classList.contains('show');
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                if (menu !== dropdown) {
                    menu.classList.remove('show');
                    menu.closest('.dropdown').classList.remove('active');
                }
            });
            
            // Toggle this dropdown
            dropdown.classList.toggle('show');
            parent.classList.toggle('active');
            
            // If opening, set up click outside listener
            if (!isOpen) {
                const closeDropdown = function(event) {
                    if (!parent.contains(event.target)) {
                        dropdown.classList.remove('show');
                        parent.classList.remove('active');
                        document.removeEventListener('click', closeDropdown);
                    }
                };
                
                // Delay adding listener to avoid immediate close
                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                }, 0);
            }
        });
    });
}

/**
 * Add necessary CSS for animations
 */
(function() {
    const style = document.createElement('style');
    style.textContent = `
        /* Page transitions */
        body {
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
        }
        
        body.page-exit {
            opacity: 0;
        }
        
        body.page-enter {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        /* Scroll animations */
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .animate-on-scroll.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .animate-on-scroll[data-animation="fade-left"] {
            transform: translateX(-30px);
        }
        
        .animate-on-scroll[data-animation="fade-right"] {
            transform: translateX(30px);
        }
        
        .animate-on-scroll[data-animation="zoom-in"] {
            transform: scale(0.9);
        }
        
        .animate-on-scroll.animated[data-animation="fade-left"],
        .animate-on-scroll.animated[data-animation="fade-right"],
        .animate-on-scroll.animated[data-animation="zoom-in"] {
            transform: none;
        }
        
        /* Card animations */
        .card, .result-card {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        
        .card-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Hover effects */
        .hover-effect {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-effect.hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
        }
        
        .hover-effect.hover-out {
            transition-duration: 0.3s;
        }
        
        /* Button ripple effect */
        .btn {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(1);
                opacity: 0;
            }
        }
        
        /* Modal animations */
        .modal {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .modal.active {
            opacity: 1;
        }
        
        .modal-content {
            transform: translateY(20px) scale(0.98);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .modal-content.active {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        
        /* Navigation animations */
        .mobile-nav {
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
        }
        
        .mobile-nav.active {
            transform: translateX(0);
        }
        
        .dropdown-menu {
            opacity: 0;
            transform: translateY(10px);
            visibility: hidden;
            transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.2s;
        }
        
        .dropdown-menu.show {
            opacity: 1;
            transform: translateY(0);
            visibility: visible;
            transition-delay: 0s;
        }
        
        /* Common animation keyframes */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();