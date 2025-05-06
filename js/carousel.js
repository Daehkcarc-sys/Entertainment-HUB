/**
 * Carousel Component JavaScript
 * Handles all carousel functionality for the Entertainment Hub project
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all carousel components on the page
  initializeCarousels();
});

/**
 * Initialize all carousel components on the page
 */
function initializeCarousels() {
  const carousels = document.querySelectorAll('.carousel-container');
  
  carousels.forEach(carousel => {
    const wrapper = carousel.querySelector('.carousel-wrapper');
    const items = carousel.querySelectorAll('.carousel-item');
    const prevBtn = carousel.querySelector('.carousel-control-prev');
    const nextBtn = carousel.querySelector('.carousel-control-next');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    
    // Skip if this carousel has already been initialized
    if (carousel.dataset.initialized === 'true') return;
    
    // Mark as initialized
    carousel.dataset.initialized = 'true';
    
    // Get the number of slides per view (for content carousels)
    const slidesPerView = carousel.dataset.slidesPerView ? parseInt(carousel.dataset.slidesPerView) : 1;
    
    // Set the width of items
    items.forEach(item => {
      if (slidesPerView > 1) {
        item.style.width = `${100 / slidesPerView}%`;
      } else {
        item.style.width = '100%';
      }
    });
    
    // Variables to track carousel state
    let currentIndex = 0;
    let startX, moveX, initialPosition;
    let autoplayInterval;
    
    // Set up autoplay if specified
    if (carousel.dataset.autoplay === 'true') {
      const autoplayDelay = carousel.dataset.autoplayDelay || 5000;
      startAutoplay(autoplayDelay);
    }
    
    // Event listeners for controls
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToPrevSlide();
        if (autoplayInterval) {
          clearInterval(autoplayInterval);
          startAutoplay();
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToNextSlide();
        if (autoplayInterval) {
          clearInterval(autoplayInterval);
          startAutoplay();
        }
      });
    }
    
    // Set up indicators if they exist
    if (indicators.length > 0) {
      indicators.forEach((indicator, idx) => {
        indicator.addEventListener('click', () => {
          goToSlide(idx);
          if (autoplayInterval) {
            clearInterval(autoplayInterval);
            startAutoplay();
          }
        });
      });
    }
    
    // Touch event handling for swipes
    wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Mouse event handling for swipes
    wrapper.addEventListener('mousedown', handleMouseDown);
    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseup', handleMouseUp);
    wrapper.addEventListener('mouseleave', handleMouseUp);
    
    /**
     * Go to a specific slide
     * @param {number} index - The index of the slide to go to
     */
    function goToSlide(index) {
      // Calculate the total number of possible slides
      const totalItems = items.length;
      const totalSlides = Math.ceil((totalItems - (slidesPerView - 1)) / 1);
      
      // Ensure index is within bounds
      if (index < 0) index = 0;
      if (index >= totalSlides) index = totalSlides - 1;
      
      currentIndex = index;
      
      // Calculate the position to translate to
      const translateX = -currentIndex * (100 / slidesPerView);
      
      // Apply the translation
      wrapper.style.transform = `translateX(${translateX}%)`;
      
      // Update indicators
      updateIndicators();
    }
    
    /**
     * Go to the next slide
     */
    function goToNextSlide() {
      // Calculate the total number of possible slides
      const totalItems = items.length;
      const totalSlides = Math.ceil((totalItems - (slidesPerView - 1)) / 1);
      
      // Go to next slide, loop to beginning if at the end
      if (currentIndex < totalSlides - 1) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(0);
      }
    }
    
    /**
     * Go to the previous slide
     */
    function goToPrevSlide() {
      // Calculate the total number of possible slides
      const totalItems = items.length;
      const totalSlides = Math.ceil((totalItems - (slidesPerView - 1)) / 1);
      
      // Go to previous slide, loop to end if at the beginning
      if (currentIndex > 0) {
        goToSlide(currentIndex - 1);
      } else {
        goToSlide(totalSlides - 1);
      }
    }
    
    /**
     * Update the active state of indicators
     */
    function updateIndicators() {
      if (indicators.length === 0) return;
      
      indicators.forEach((indicator, idx) => {
        if (idx === currentIndex) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }
    
    /**
     * Start autoplay functionality
     * @param {number} delay - The delay between slides in ms
     */
    function startAutoplay(delay = 5000) {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
      
      autoplayInterval = setInterval(() => {
        goToNextSlide();
      }, delay);
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} e - The touch event
     */
    function handleTouchStart(e) {
      startX = e.touches[0].clientX;
      initialPosition = getCurrentTranslate();
      
      // Pause autoplay during user interaction
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} e - The touch event
     */
    function handleTouchMove(e) {
      if (!startX) return;
      
      moveX = e.touches[0].clientX;
      const diff = moveX - startX;
      
      // Prevent default to disable page scrolling while swiping carousel
      if (Math.abs(diff) > 5) {
        e.preventDefault();
      }
      
      // Calculate new position with resistance at edges
      const containerWidth = carousel.offsetWidth;
      const maxTranslate = 0;
      const minTranslate = -((items.length / slidesPerView) - 1) * containerWidth;
      
      let newPosition = initialPosition + diff;
      
      // Add resistance at edges
      if (newPosition > maxTranslate) {
        newPosition = maxTranslate + (newPosition - maxTranslate) * 0.3;
      } else if (newPosition < minTranslate) {
        newPosition = minTranslate + (newPosition - minTranslate) * 0.3;
      }
      
      // Apply the transform
      wrapper.style.transform = `translateX(${newPosition}px)`;
    }
    
    /**
     * Handle touch end event
     */
    function handleTouchEnd() {
      if (!startX || !moveX) {
        startX = null;
        moveX = null;
        return;
      }
      
      const diff = moveX - startX;
      
      // Determine if swipe was intentional
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToPrevSlide();
        } else {
          goToNextSlide();
        }
      } else {
        // Return to current slide
        goToSlide(currentIndex);
      }
      
      // Reset values
      startX = null;
      moveX = null;
      
      // Resume autoplay if needed
      if (carousel.dataset.autoplay === 'true') {
        const autoplayDelay = carousel.dataset.autoplayDelay || 5000;
        startAutoplay(autoplayDelay);
      }
    }
    
    /**
     * Handle mouse down event
     * @param {MouseEvent} e - The mouse event
     */
    function handleMouseDown(e) {
      e.preventDefault();
      startX = e.clientX;
      initialPosition = getCurrentTranslate();
      wrapper.style.cursor = 'grabbing';
      
      // Pause autoplay during user interaction
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    }
    
    /**
     * Handle mouse move event
     * @param {MouseEvent} e - The mouse event
     */
    function handleMouseMove(e) {
      if (!startX) return;
      
      moveX = e.clientX;
      const diff = moveX - startX;
      
      // Calculate new position with resistance at edges
      const containerWidth = carousel.offsetWidth;
      const maxTranslate = 0;
      const minTranslate = -((items.length / slidesPerView) - 1) * containerWidth;
      
      let newPosition = initialPosition + diff;
      
      // Add resistance at edges
      if (newPosition > maxTranslate) {
        newPosition = maxTranslate + (newPosition - maxTranslate) * 0.3;
      } else if (newPosition < minTranslate) {
        newPosition = minTranslate + (newPosition - minTranslate) * 0.3;
      }
      
      // Apply the transform
      wrapper.style.transform = `translateX(${newPosition}px)`;
    }
    
    /**
     * Handle mouse up event
     */
    function handleMouseUp() {
      if (!startX || !moveX) {
        startX = null;
        moveX = null;
        wrapper.style.cursor = '';
        return;
      }
      
      const diff = moveX - startX;
      
      // Determine if swipe was intentional
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToPrevSlide();
        } else {
          goToNextSlide();
        }
      } else {
        // Return to current slide
        goToSlide(currentIndex);
      }
      
      // Reset values
      startX = null;
      moveX = null;
      wrapper.style.cursor = '';
      
      // Resume autoplay if needed
      if (carousel.dataset.autoplay === 'true') {
        const autoplayDelay = carousel.dataset.autoplayDelay || 5000;
        startAutoplay(autoplayDelay);
      }
    }
    
    /**
     * Get the current translate value
     * @returns {number} The current translation value in pixels
     */
    function getCurrentTranslate() {
      const style = window.getComputedStyle(wrapper);
      const matrix = new DOMMatrixReadOnly(style.transform);
      return matrix.m41;
    }
    
    // Initialize the carousel by going to the first slide
    goToSlide(0);
  });
}

/**
 * Create a new carousel dynamically and add it to the DOM
 * @param {Object} options - Configuration options for the carousel
 * @returns {HTMLElement} The created carousel element
 */
function createCarousel(options = {}) {
  const defaultOptions = {
    id: `carousel-${Date.now()}`,
    container: document.body,
    items: [],
    autoplay: false,
    autoplayDelay: 5000,
    slidesPerView: 1,
    indicators: true,
    controls: true,
    bannerStyle: false
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Create carousel container
  const carouselContainer = document.createElement('div');
  carouselContainer.className = `carousel-container${config.bannerStyle ? ' banner' : ' content-carousel'}`;
  carouselContainer.id = config.id;
  carouselContainer.dataset.autoplay = config.autoplay.toString();
  carouselContainer.dataset.autoplayDelay = config.autoplayDelay.toString();
  carouselContainer.dataset.slidesPerView = config.slidesPerView.toString();
  
  // Create carousel wrapper
  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'carousel-wrapper';
  carouselContainer.appendChild(carouselWrapper);
  
  // Add carousel items
  config.items.forEach(item => {
    const carouselItem = document.createElement('div');
    carouselItem.className = 'carousel-item';
    carouselItem.innerHTML = item;
    carouselWrapper.appendChild(carouselItem);
  });
  
  // Add controls if needed
  if (config.controls) {
    const prevButton = document.createElement('button');
    prevButton.className = 'carousel-control carousel-control-prev';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.setAttribute('aria-label', 'Previous slide');
    
    const nextButton = document.createElement('button');
    nextButton.className = 'carousel-control carousel-control-next';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.setAttribute('aria-label', 'Next slide');
    
    carouselContainer.appendChild(prevButton);
    carouselContainer.appendChild(nextButton);
  }
  
  // Add indicators if needed
  if (config.indicators) {
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'carousel-indicators';
    
    const totalItems = config.items.length;
    const totalSlides = Math.ceil((totalItems - (config.slidesPerView - 1)) / 1);
    
    for (let i = 0; i < totalSlides; i++) {
      const indicator = document.createElement('button');
      indicator.className = 'carousel-indicator' + (i === 0 ? ' active' : '');
      indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
      indicatorsContainer.appendChild(indicator);
    }
    
    carouselContainer.appendChild(indicatorsContainer);
  }
  
  // Add carousel to container
  if (typeof config.container === 'string') {
    document.querySelector(config.container).appendChild(carouselContainer);
  } else {
    config.container.appendChild(carouselContainer);
  }
  
  // Initialize the carousel
  initializeCarousels();
  
  return carouselContainer;
}

// Export functions for use in other files
window.createCarousel = createCarousel;
window.initializeCarousels = initializeCarousels;