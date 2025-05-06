/**
 * Entertainment Hub - Movies Page
 * Handles movie-specific functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeMoviesPage();
});

function initializeMoviesPage() {
  // Initialize tabs
  initializeTabs();
  
  // Initialize movie carousel
  initializeMovieCarousel();
  
  // Initialize movie filters
  initializeMovieFilters();
  
  // Initialize movie ratings
  initializeMovieRatings();
  
  // Initialize movie watchlist buttons
  initializeWatchlistButtons();
  
  // Initialize movie quiz
  initializeMovieQuiz();
}

// Initialize tabs
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get target tab
      const target = button.dataset.target;
      const targetContent = document.getElementById(target);
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show target content, hide others
      tabContents.forEach(content => content.classList.remove('active'));
      targetContent.classList.add('active');
      
      // If content is empty, load it
      if (targetContent.querySelector('.placeholder-text')) {
        loadTabContent(target, targetContent);
      }
    });
  });
}

// Load tab content
function loadTabContent(tabId, tabElement) {
  // Show loading state
  tabElement.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading ${tabId.replace('-', ' ')}...</span>
    </div>
  `;
  
  // Simulate loading delay
  setTimeout(() => {
    // Generate content based on tab ID
    let content = '';
    
    switch (tabId) {
      case 'new-releases':
        content = generateMovieGrid([
          { title: 'Dune: Part Two', year: 2024, rating: 8.9, image: '../images/Dune.jpg', director: 'Denis Villeneuve' },
          { title: 'The Batman', year: 2022, rating: 8.5, image: '../images/Darkknight.jpg', director: 'Matt Reeves' },
          { title: 'Everything Everywhere All at Once', year: 2022, rating: 8.7, image: '../images/Interstellar.jpg', director: 'Daniels' },
          { title: 'Top Gun: Maverick', year: 2022, rating: 8.3, image: '../images/Godfather.jpg', director: 'Joseph Kosinski' }
        ]);
        break;
        
      case 'coming-soon':
        content = generateMovieGrid([
          { title: 'Gladiator II', year: 2024, rating: null, image: '../images/Godfather.jpg', director: 'Ridley Scott' },
          { title: 'Furiosa: A Mad Max Saga', year: 2024, rating: null, image: '../images/Darkknight.jpg', director: 'George Miller' },
          { title: 'Mission: Impossible 8', year: 2025, rating: null, image: '../images/Interstellar.jpg', director: 'Christopher McQuarrie' },
          { title: 'Avatar 3', year: 2025, rating: null, image: '../images/Avatar.jpg', director: 'James Cameron' }
        ]);
        break;
        
      case 'classics':
        content = generateMovieGrid([
          { title: 'The Godfather', year: 1972, rating: 9.2, image: '../images/Godfather.jpg', director: 'Francis Ford Coppola' },
          { title: 'Pulp Fiction', year: 1994, rating: 8.9, image: '../images/PulpFiction.jpg', director: 'Quentin Tarantino' },
          { title: 'The Shawshank Redemption', year: 1994, rating: 9.3, image: '../images/Interstellar.jpg', director: 'Frank Darabont' },
          { title: 'Star Wars: Episode V', year: 1980, rating: 8.7, image: '../images/Starwars.jpg', director: 'Irvin Kershner' }
        ]);
        break;
        
      default:
        content = '<p>No content available for this tab.</p>';
    }
    
    // Update tab content
    tabElement.innerHTML = content;
    
    // Initialize new elements
    initializeWatchlistButtons();
  }, 1500);
}

// Generate movie grid HTML
function generateMovieGrid(movies) {
  let html = '<div class="movies-grid">';
  
  movies.forEach(movie => {
    html += `
      <figure class="movie-card">
        <div class="movie-poster">
          <img src="${movie.image}" alt="${movie.title} Poster">
          <div class="movie-overlay">
            ${movie.rating ? `
              <meter class="rating-meter" value="${movie.rating}" min="0" max="10" optimum="10" high="8" low="4">${movie.rating}/10</meter>
            ` : `
              <span class="coming-soon-badge">Coming Soon</span>
            `}
            <div class="movie-actions">
              <button class="action-button" data-id="${movie.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}" data-type="movie">
                <i class="fas fa-bookmark"></i>
              </button>
              <a href="ratings.html" class="action-button rating-btn">
                <i class="fas fa-star"></i>
              </a>
              <button class="action-button">
                <i class="fas fa-info-circle"></i>
              </button>
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
      </figure>
    `;
  });
  
  html += '</div>';
  return html;
}

// Initialize movie carousel
function initializeMovieCarousel() {
  const carousel = document.querySelector('.carousel-container');
  if (!carousel) return;
  
  const track = carousel.querySelector('.carousel-track');
  const slides = carousel.querySelectorAll('.carousel-slide');
  const prevButton = carousel.querySelector('.carousel-button.prev');
  const nextButton = carousel.querySelector('.carousel-button.next');
  
  if (!track || !slides.length) return;
  
  let currentIndex = 0;
  const slideWidth = slides[0].getBoundingClientRect().width;
  const slidesToShow = 3;
  const slidesToScroll = 1;
  
  // Set initial position
  updateCarouselPosition();
  
  // Add event listeners
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - slidesToScroll);
      updateCarouselPosition();
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentIndex = Math.min(slides.length - slidesToShow, currentIndex + slidesToScroll);
      updateCarouselPosition();
    });
  }
  
  // Update carousel position
  function updateCarouselPosition() {
    const translateX = -currentIndex * slideWidth;
    track.style.transform = `translateX(${translateX}px)`;
    
    // Update button states
    if (prevButton) {
      prevButton.disabled = currentIndex === 0;
    }
    
    if (nextButton) {
      nextButton.disabled = currentIndex >= slides.length - slidesToShow;
    }
  }
}

// Initialize movie filters
function initializeMovieFilters() {
  const yearFilter = document.getElementById('year-filter');
  const ratingFilter = document.getElementById('rating-filter');
  const sortMovies = document.getElementById('sort-movies');
  
  // Add event listeners
  if (yearFilter) {
    yearFilter.addEventListener('change', applyFilters);
  }
  
  if (ratingFilter) {
    ratingFilter.addEventListener('change', applyFilters);
  }
  
  if (sortMovies) {
    sortMovies.addEventListener('change', applyFilters);
  }
  
  // Apply filters
  function applyFilters() {
    // In a real app, this would fetch filtered data from an API
    // For demo purposes, we'll just show a toast
    window.EntertainmentHub.showToast('Filters applied!', 'success');
  }
}

// Initialize movie ratings
function initializeMovieRatings() {
  const ratingCriteria = document.querySelectorAll('.criteria-item');
  
  ratingCriteria.forEach(criteria => {
    // Add hover effect to show exact score
    criteria.addEventListener('mouseenter', () => {
      const score = criteria.querySelector('.criteria-score');
      const fill = criteria.querySelector('.criteria-fill');
      
      if (score && fill) {
        score.dataset.originalText = score.textContent;
        score.textContent = `${parseFloat(fill.style.width)}%`;
      }
    });
    
    criteria.addEventListener('mouseleave', () => {
      const score = criteria.querySelector('.criteria-score');
      
      if (score && score.dataset.originalText) {
        score.textContent = score.dataset.originalText;
      }
    });
  });
}

// Initialize watchlist buttons
function initializeWatchlistButtons() {
  const watchlistButtons = document.querySelectorAll('.action-button[data-id]');
  
  watchlistButtons.forEach(button => {
    const itemId = button.dataset.id;
    const itemType = button.dataset.type || 'movie';
    
    // Check if item is already in watchlist
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const isInWatchlist = watchlist.some(item => item.id === itemId && item.type === itemType);
    
    // Update button state
    if (isInWatchlist) {
      button.classList.add('active');
      button.innerHTML = '<i class="fas fa-bookmark"></i>';
      button.title = 'Remove from watchlist';
    } else {
      button.classList.remove('active');
      button.innerHTML = '<i class="far fa-bookmark"></i>';
      button.title = 'Add to watchlist';
    }
    
    // Add click event
    button.addEventListener('click', () => {
      toggleWatchlist(button, itemId, itemType);
    });
  });
}

// Toggle watchlist
function toggleWatchlist(button, itemId, itemType) {
  // Get current watchlist
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const isInWatchlist = watchlist.some(item => item.id === itemId && item.type === itemType);
  
  if (isInWatchlist) {
    // Remove from watchlist
    const newWatchlist = watchlist.filter(item => !(item.id === itemId && item.type === itemType));
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    
    // Update button
    button.classList.remove('active');
    button.innerHTML = '<i class="far fa-bookmark"></i>';
    button.title = 'Add to watchlist';
    
    // Show toast
    window.EntertainmentHub.showToast('Removed from watchlist', 'info');
  } else {
    // Add to watchlist
    const newItem = {
      id: itemId,
      type: itemType,
      dateAdded: new Date().toISOString()
    };
    
    watchlist.push(newItem);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    
    // Update button
    button.classList.add('active');
    button.innerHTML = '<i class="fas fa-bookmark"></i>';
    button.title = 'Remove from watchlist';
    
    // Show toast
    window.EntertainmentHub.showToast('Added to watchlist', 'success');
  }
}

// Initialize movie quiz
function initializeMovieQuiz() {
  const quizForm = document.getElementById('movie-quiz-form');
  
  if (quizForm) {
    quizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get answers
      const q1Answer = quizForm.querySelector('input[name="q1"]:checked')?.value;
      const q2Answer = quizForm.querySelector('input[name="q2"]:checked')?.value;
      
      // Check answers
      let score = 0;
      if (q1Answer === 'hitchcock') score++;
      if (q2Answer === 'parasite') score++;
      
      // Show result
      window.EntertainmentHub.showToast(`You scored ${score}/2 on the quiz!`, 'info');
      
      // Reset form
      quizForm.reset();
    });
  }
}
