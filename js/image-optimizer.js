/**
 * Image Optimizer for Entertainment Hub
 * Features:
 * - Progressive image loading with blur-up effect
 * - Lazy loading with IntersectionObserver
 * - Responsive image sizing
 * - Image error handling
 */

document.addEventListener('DOMContentLoaded', function() {
    initImageOptimizer();
});

/**
 * Initialize image optimization features
 */
function initImageOptimizer() {
    // Check for IntersectionObserver support
    if ('IntersectionObserver' in window) {
        setupLazyLoading();
        setupProgressiveLoading();
    } else {
        // Fallback for older browsers
        loadAllImages();
    }
    
    // Set up error handling for images
    setupImageErrorHandling();
    
    // Optimize background images
    optimizeBackgroundImages();
}

/**
 * Set up lazy loading for images
 */
function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]:not(.progressive-img)');
    
    if (!lazyImages.length) return;
    
    const lazyImageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                
                // If there's srcset, load that too
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                }
                
                img.classList.add('loaded');
                lazyImageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px 0px', // Start loading 100px before they come into view
        threshold: 0.01
    });
    
    lazyImages.forEach(function(lazyImage) {
        // Only observe images that don't have src already set
        if (!lazyImage.src || lazyImage.src === window.location.href) {
            lazyImageObserver.observe(lazyImage);
        }
    });
}

/**
 * Set up progressive image loading with blur-up effect
 */
function setupProgressiveLoading() {
    const progressiveImages = document.querySelectorAll('.progressive-img');
    
    if (!progressiveImages.length) return;
    
    const progressiveImageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const wrapper = entry.target;
                const img = wrapper.querySelector('img');
                
                if (!img) return;
                
                // Load high-quality image
                const highResImage = new Image();
                highResImage.src = img.dataset.src;
                
                // When high-res image loads, replace the placeholder
                highResImage.onload = function() {
                    wrapper.classList.add('loaded');
                    img.src = highResImage.src;
                    
                    // Fade in the high-res image
                    setTimeout(() => {
                        img.classList.add('loaded');
                    }, 50);
                };
                
                progressiveImageObserver.unobserve(wrapper);
            }
        });
    }, {
        rootMargin: '200px 0px',
        threshold: 0.01
    });
    
    progressiveImages.forEach(function(wrapper) {
        progressiveImageObserver.observe(wrapper);
    });
}

/**
 * Set up error handling for images
 */
function setupImageErrorHandling() {
    // Apply error handler to all images
    document.querySelectorAll('img').forEach(function(img) {
        img.addEventListener('error', handleImageError);
    });
    
    // Also handle future images that may be added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.tagName === 'IMG') {
                    node.addEventListener('error', handleImageError);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('img').forEach(function(img) {
                        img.addEventListener('error', handleImageError);
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Handle image loading errors
 */
function handleImageError() {
    // Replace with placeholder image
    this.src = '../images/placeholder.jpg';
    
    // Add error class for styling
    this.classList.add('img-error');
    
    // Add descriptive alt text
    if (!this.alt || this.alt === '') {
        this.alt = 'Image not available';
    }
    
    // Add error icon overlay
    const parent = this.parentNode;
    if (parent && !parent.querySelector('.img-error-icon')) {
        const errorIcon = document.createElement('div');
        errorIcon.className = 'img-error-icon';
        errorIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        parent.appendChild(errorIcon);
        
        // Add title to explain the error
        parent.setAttribute('title', 'Image could not be loaded');
    }
}

/**
 * Optimize background images 
 */
function optimizeBackgroundImages() {
    const bgElements = document.querySelectorAll('[data-bg]');
    
    if (!bgElements.length) return;
    
    const bgObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Load the background image
                element.style.backgroundImage = `url(${element.dataset.bg})`;
                element.classList.add('bg-loaded');
                
                bgObserver.unobserve(element);
            }
        });
    }, {
        rootMargin: '200px 0px',
        threshold: 0.01
    });
    
    bgElements.forEach(function(element) {
        bgObserver.observe(element);
    });
}

/**
 * Fallback for browsers without IntersectionObserver
 */
function loadAllImages() {
    // Load all lazy images
    document.querySelectorAll('img[data-src]').forEach(function(img) {
        img.src = img.dataset.src;
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
        }
    });
    
    // Load all background images
    document.querySelectorAll('[data-bg]').forEach(function(element) {
        element.style.backgroundImage = `url(${element.dataset.bg})`;
    });
}

/**
 * Add CSS for the image optimizations
 */
(function() {
    const style = document.createElement('style');
    style.textContent = `
        /* Lazy loading styles */
        img.loaded {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        /* Progressive image loading styles */
        .progressive-img {
            position: relative;
            overflow: hidden;
            background: #f0f0f0;
        }
        
        .progressive-img img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }
        
        .progressive-img img.placeholder {
            opacity: 1;
            filter: blur(10px);
            transform: scale(1.05);
        }
        
        .progressive-img.loaded img.placeholder {
            opacity: 0;
        }
        
        .progressive-img img.loaded {
            opacity: 1;
        }
        
        /* Background image loading */
        [data-bg] {
            background-position: center;
            background-size: cover;
            background-repeat: no-repeat;
            transition: opacity 0.3s ease-in-out;
            opacity: 0;
        }
        
        [data-bg].bg-loaded {
            opacity: 1;
        }
        
        /* Error styling */
        .img-error {
            background-color: #f1f1f1;
            border: 1px solid #ddd;
        }
        
        .img-error-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #888;
            font-size: 1.5rem;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
})();

/**
 * Helper function to convert any image to progressive loading
 */
function makeImageProgressive(imgElement) {
    // Skip if already set up
    if (imgElement.closest('.progressive-img')) return;
    
    // Save original attributes
    const src = imgElement.src;
    const alt = imgElement.alt;
    const classList = imgElement.className;
    
    // Create new structure
    const wrapper = document.createElement('div');
    wrapper.className = 'progressive-img ' + (classList || '');
    
    // Create placeholder
    const placeholder = document.createElement('img');
    placeholder.className = 'placeholder';
    placeholder.src = createPlaceholder(imgElement);
    placeholder.alt = alt;
    
    // Update original image
    imgElement.className = '';
    imgElement.removeAttribute('src');
    imgElement.dataset.src = src;
    
    // Assemble the elements
    wrapper.appendChild(placeholder);
    wrapper.appendChild(imgElement);
    
    // Replace the original image with our new structure
    imgElement.parentNode.insertBefore(wrapper, imgElement.nextSibling);
    imgElement.parentNode.removeChild(imgElement);
    
    return wrapper;
}

/**
 * Create a tiny placeholder version of the image
 */
function createPlaceholder(img) {
    // If we have the image data, we could create a tiny version
    // For now, use a simple placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlZWUiLz48L3N2Zz4=';
}