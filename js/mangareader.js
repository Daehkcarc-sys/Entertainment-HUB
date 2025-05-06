/**
 * Entertainment Hub - Manga Reader
 * Handles manga reader functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeMangaReader();
});

function initializeMangaReader() {
  // DOM Elements
  const readerView = document.getElementById('reader-view');
  const pageView = document.getElementById('page-view');
  const doublePageView = document.getElementById('double-page-view');
  const longstripView = document.getElementById('longstrip-view');
  const currentPageElement = document.getElementById('current-page');
  const totalPagesElement = document.getElementById('total-pages');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const singlePageBtn = document.getElementById('single-page-btn');
  const doublePageBtn = document.getElementById('double-page-btn');
  const longstripBtn = document.getElementById('longstrip-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const autoScrollBtn = document.getElementById('auto-scroll-btn');
  const readerSettingsBtn = document.getElementById('reader-settings-btn');
  const readerOptions = document.getElementById('reader-options');
  const shortcutsBtn = document.getElementById('shortcuts-btn');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const closeShortcutsBtn = document.getElementById('close-shortcuts');
  const bookmarkButton = document.getElementById('bookmark-button');
  const pageSliderHandle = document.getElementById('page-slider-handle');
  const pageSliderFill = document.getElementById('page-slider-fill');
  const readingProgress = document.getElementById('reading-progress');
  const currentPageImage = document.getElementById('current-page-image');
  const chapterSelector = document.getElementById('chapter-selector');
  const downloadChapterBtn = document.getElementById('download-chapter');
  
  // Reader state
  const state = {
    currentPage: 1,
    totalPages: 24,
    isAutoScrolling: false,
    autoScrollInterval: null,
    isBookmarked: false,
    viewMode: 'single',
    readingDirection: 'ltr',
    brightness: 100,
    contrast: 100,
    currentChapter: '117',
    pageImages: [
      '../images/Chainsaw.jpg',
      '../images/Makima.jpg',
      '../images/JJK.jpeg',
      '../images/Levi.jpg',
      '../images/Abousen.jpg',
      '../images/DemonSlayer.jpg',
      '../images/Heroacademia.jpg',
      '../images/OnePiece.jpg'
    ]
  };
  
  // Initialize reader
  function init() {
    if (!readerView) return;
    
    updatePageDisplay();
    updateProgressBar();
    updatePageImage();
    initEventListeners();
    
    // Check if there's a saved bookmark for this chapter
    checkBookmark();
  }
  
  // Update the current page display
  function updatePageDisplay() {
    if (currentPageElement) {
      currentPageElement.textContent = state.currentPage;
    }
    
    if (totalPagesElement) {
      totalPagesElement.textContent = state.totalPages;
    }
    
    // Enable/disable navigation buttons
    if (prevPageBtn) {
      prevPageBtn.disabled = state.currentPage <= 1;
    }
    
    if (nextPageBtn) {
      nextPageBtn.disabled = state.currentPage >= state.totalPages;
    }
  }
  
  // Update the progress bar
  function updateProgressBar() {
    const progress = (state.currentPage - 1) / (state.totalPages - 1) * 100;
    
    if (pageSliderFill) {
      pageSliderFill.style.width = `${progress}%`;
    }
    
    if (pageSliderHandle) {
      pageSliderHandle.style.left = `${progress}%`;
    }
    
    if (readingProgress) {
      readingProgress.style.width = `${progress}%`;
    }
  }
  
  // Update the displayed page image
  function updatePageImage() {
    if (!currentPageImage) return;
    
    // Get image for current page
    const imageIndex = (state.currentPage - 1) % state.pageImages.length;
    currentPageImage.src = state.pageImages[imageIndex];
    
    // Add page turn animation
    currentPageImage.classList.remove('page-turn');
    void currentPageImage.offsetWidth; // Trigger reflow
    currentPageImage.classList.add('page-turn');
    
    // Save reading progress
    saveReadingProgress();
  }
  
  // Handle page navigation
  function goToPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > state.totalPages) return;
    
    state.currentPage = pageNumber;
    updatePageDisplay();
    updateProgressBar();
    updatePageImage();
  }
  
  // Navigate to next page
  function nextPage() {
    if (state.currentPage < state.totalPages) {
      goToPage(state.currentPage + 1);
    } else if (state.viewMode === 'longstrip') {
      // If in longstrip mode and at the end, show completion message
      window.EntertainmentHub.showToast('You have reached the end of this chapter!', 'info');
    }
  }
  
  // Navigate to previous page
  function prevPage() {
    if (state.currentPage > 1) {
      goToPage(state.currentPage - 1);
    }
  }
  
  // Toggle reader view mode
  function setViewMode(mode) {
    state.viewMode = mode;
    
    // Reset all buttons
    if (singlePageBtn) singlePageBtn.classList.remove('btn-active');
    if (doublePageBtn) doublePageBtn.classList.remove('btn-active');
    if (longstripBtn) longstripBtn.classList.remove('btn-active');
    
    // Hide all views
    if (pageView) pageView.style.display = 'none';
    if (doublePageView) doublePageView.style.display = 'none';
    if (longstripView) longstripView.style.display = 'none';
    
    // Show selected view
    switch(mode) {
      case 'single':
        if (pageView) pageView.style.display = 'flex';
        if (singlePageBtn) singlePageBtn.classList.add('btn-active');
        break;
      case 'double':
        if (doublePageView) doublePageView.style.display = 'flex';
        if (doublePageBtn) doublePageBtn.classList.add('btn-active');
        break;
      case 'longstrip':
        if (longstripView) longstripView.style.display = 'flex';
        if (longstripBtn) longstripBtn.classList.add('btn-active');
        
        // Disable page navigation in longstrip mode
        if (prevPageBtn) prevPageBtn.disabled = true;
        if (nextPageBtn) nextPageBtn.disabled = true;
        break;
    }
    
    // Save preference
    localStorage.setItem('manga-view-mode', mode);
  }
  
  // Toggle fullscreen mode
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      readerView.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
  
  // Toggle auto-scroll
  function toggleAutoScroll() {
    state.isAutoScrolling = !state.isAutoScrolling;
    
    if (state.isAutoScrolling) {
      if (autoScrollBtn) autoScrollBtn.classList.add('btn-active');
      
      if (state.viewMode === 'longstrip') {
        // For longstrip, scroll the view
        const scrollSpeed = 1; // pixels per frame
        const scrollInterval = setInterval(() => {
          window.scrollBy(0, scrollSpeed);
          
          // Check if we've reached the bottom
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            clearInterval(scrollInterval);
            state.isAutoScrolling = false;
            if (autoScrollBtn) autoScrollBtn.classList.remove('btn-active');
            window.EntertainmentHub.showToast('You have reached the end of this chapter!', 'info');
          }
        }, 20);
        
        state.autoScrollInterval = scrollInterval;
      } else {
        // For paged views, change pages automatically
        state.autoScrollInterval = setInterval(() => {
          if (state.currentPage < 
