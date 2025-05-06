/**
 * Entertainment Hub - Carousel
 * Handles all carousel functionality across the site
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeCarousels();
});

function initializeCarousels() {
  const carousels = document.querySelectorAll('.carousel-container');
  
  carousels.forEach(carousel => {
    const wrapper = carousel.querySelector('.carousel-wrapper');
    const items = carousel.querySelectorAll('.carousel-item');
    const prevBtn = carousel.querySelector('.carousel-control-prev');
    const nextBtn = carousel.querySelector('.carousel-control-next');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    
    // Skip if no items
    if (items.length === 0) return;
    
    // Get carousel options from data attributes
    const slidesPerView = parseInt(carousel.dataset.slidesPerView) || 1;
    const spacing = parseInt(carousel.dataset.spacing) || 0;
    const loop = carousel.dataset.loop === 'true';
    const autoplay = carousel.dataset.autoplay === 'true';
    const autoplayDelay = parseInt(carousel.dataset.autoplayDelay) || 5000;
    
    // Parse breakpoints if available
    let breakpoints = {};
    if (carousel.dataset.breakpoints) {
      try {
        breakpoints = JSON.parse(carousel.dataset.breakpoints);
      } catch (e) {
        console.error('Invalid breakpoints format:', e);
      }
    }
    
    // Set up carousel state
    const state = {
      currentIndex: 0,
      itemWidth: 0,
      itemsPerView: slidesPerView,
      totalItems: items.length,
      autoplayInterval: null,
      isDragging: false,
      startX: 0,
      currentX: 0,
      startTranslate: 0,
      currentTranslate: 0
    };
    
    // Initialize carousel
    initializeCarousel();
    
    // Set up event listeners
    if (prevBtn) prevBtn.addEventListener('click', goToPrevSlide);
    if (nextBtn) nextBtn.addEventListener('click', goToNextSlide);
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => goToSlide(index));
    });
    
    // Set up touch/mouse events for swiping
    wrapper.addEventListener('mousedown', startDrag);
    wrapper.addEventListener('touchstart', startDrag, { passive: true });
    wrapper.addEventListener('mousemove', drag);
    wrapper.addEventListener('touchmove', drag, { passive: false });
    wrapper.addEventListener('mouseup', endDrag);
    wrapper.addEventListener('touchend', endDrag);
    wrapper.addEventListener('mouseleave', endDrag);
    
    // Set up resize handler
    window.addEventListener('resize', handleResize);
    
    // Initialize carousel
    function initializeCarousel() {
      // Calculate item width based on container width and slides per view
      updateItemsPerView();
      updateItemWidth();
      
      // Position items
      positionItems();
      
      // Start autoplay if enabled
      if (autoplay) {
        startAutoplay();
      }
    }
    
    // Update items per view based on breakpoints
    function updateItemsPerView() {
      state.itemsPerView = slidesPerView;
      
      // Check breakpoints
      const windowWidth = window.innerWidth;
      
      // Sort breakpoints in descending order
      const breakpointWidths = Object.keys(breakpoints)
        .map(Number)
        .sort((a, b) => b - a);
      
      // Find the first breakpoint that matches
      for (const width of breakpointWidths) {
        if (windowWidth <= width) {
          state.itemsPerView = breakpoints[width].slidesPerView;
        }
      }
    }
    
    // Update item width
    function updateItemWidth() {
      const containerWidth = carousel.clientWidth;
      const totalSpacing = (state.itemsPerView - 1) * spacing;
      state.itemWidth = (containerWidth - totalSpacing) / state.itemsPerView;
      
      // Update item widths
      items.forEach(item => {
        item.style.width = `${state.itemWidth}px`;
        item.style.marginRight = `${spacing}px`;
      });
    }
    
    // Position items
    function positionItems() {
      const translateX = -state.currentIndex * (state.itemWidth + spacing);
      wrapper.style.transform = `translateX(${translateX}px)`;
      state.currentTranslate = translateX;
      
      // Update indicators
      updateIndicators();
    }
    
    // Update indicators
    function updateIndicators() {
      indicators.forEach((indicator, index) => {
        if (index === state.currentIndex) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }
    
    // Go to previous slide
    function goToPrevSlide() {
      if (state.currentIndex > 0) {
        state.currentIndex--;
      } else if (loop) {
        state.currentIndex = state.totalItems - state.itemsPerView;
      }
      
      positionItems();
      resetAutoplay();
    }
    
    // Go to next slide
    function goToNextSlide() {
      if (state.currentIndex < state.totalItems - state.itemsPerView) {
        state.currentIndex++;
      } else if (loop) {
        state.currentIndex = 0;
      }
      
      positionItems();
      resetAutoplay();
    }
    
    // Go to specific slide
    function goToSlide(index) {
      state.currentIndex = Math.min(
        Math.max(0, index),
        state.totalItems - state.itemsPerView
      );
      
      positionItems();
      resetAutoplay();
    }
    
    // Start autoplay
    function startAutoplay() {
      if (state.autoplayInterval) {
        clearInterval(state.autoplayInterval);
      }
      
      state.autoplayInterval = setInterval(() => {
        goToNextSlide();
      }, autoplayDelay);
    }
    
    // Reset autoplay
    function resetAutoplay() {
      if (autoplay) {
        clearInterval(state.autoplayInterval);
        startAutoplay();
      }
    }
    
    // Handle resize
    function handleResize() {
      updateItemsPerView();
      updateItemWidth();
      
      // Adjust current index if needed
      state.currentIndex = Math.min(
        state.currentIndex,
        state.totalItems - state.itemsPerView
      );
      
      positionItems();
    }
    
    // Start drag
    function startDrag(e) {
      state.isDragging = true;
      state.startX = getPositionX(e);
      state.startTranslate = state.currentTranslate;
      
      // Pause autoplay during drag
      if (autoplay) {
        clearInterval(state.autoplayInterval);
      }
      
      // Add grabbing cursor
      wrapper.style.cursor = 'grabbing';
    }
    
    // Drag
    function drag(e) {
      if (!state.isDragging) return;
      
      // Prevent default to stop scrolling on touch devices
      if (e.type === 'touchmove') {
        e.preventDefault();
      }
      
      state.currentX = getPositionX(e);
      const diff = state.currentX - state.startX;
      state.currentTranslate = state.startTranslate + diff;
      
      // Apply transform
      wrapper.style.transform = `translateX(${state.currentTranslate}px)`;
    }
    
    // End drag
    function endDrag() {
      if (!state.isDragging) return;
      
      state.isDragging = false;
      
      // Calculate how far we've moved
      const diff = state.currentTranslate - state.startTranslate;
      
      // If we've moved more than 20% of the item width, go to next/prev slide
      if (Math.abs(diff) > state.itemWidth * 0.2) {
        if (diff > 0) {
          goToPrevSlide();
        } else {
          goToNextSlide();
        }
      } else {
        // Otherwise, snap back to current
        positionItems();
      }
      
      // Reset cursor
      wrapper.style.cursor = 'grab';
      
      // Resume autoplay
      resetAutoplay();
    }
    
    // Get position X from mouse or touch event
    function getPositionX(e) {
      return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }
  });
}

// Export carousel functions
window.Carousel = {
  initialize: initializeCarousels
};
