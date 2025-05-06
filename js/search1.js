/**
 * Entertainment Hub - Search
 * Handles search functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeSearch();
});

function initializeSearch() {
  // Get search query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  const searchCategory = urlParams.get('category') || 'all';
  
  // Update search input with query
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }
  
  // Update category filter
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter && searchCategory) {
    categoryFilter.value = searchCategory;
  }
  
  // Perform search if query exists
  if (searchQuery) {
    performSearch(searchQuery, searchCategory);
  }
  
  // Initialize search form
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const query = searchInput.value.trim();
      const category = categoryFilter ? categoryFilter.value : 'all';
      
      if (query) {
        // Update URL without reloading page
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        url.searchParams.set('category', category);
        window.history.pushState({}, '', url);
        
        // Perform search
        performSearch(query, category);
      }
    });
  }
  
  // Initialize filters
  initializeSearchFilters();
}

// Perform search
function performSearch(query, category) {
  // Show loading state
  const resultsContainer = document.getElementById('search-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Searching for "${query}" in ${category === 'all' ? 'all categories' : category}...</span>
      </div>
    `;
    
    // Simulate search delay
    setTimeout(() => {
      // Generate search results
      const results = generateSearchResults(query, category);
      
      // Update results container
      resultsContainer.innerHTML = results;
      
      // Initialize result actions
      initializeResultActions();
    }, 1500);
  }
}

// Generate search results
function generateSearchResults(query, category) {
  // Sample data for search results
  const allResults = {
    movies: [
      { title: 'Oppenheimer', year: 2023, rating: 9.2, image: '../images/Oppenheimer.jpg', type: 'movie' },
      { title: 'Interstellar', year: 2014, rating: 8.7, image: '../images/Interstellar.jpg', type: 'movie' },
      { title: 'The Dark Knight', year: 2008, rating: 9.0, image: '../images/Darkknight.jpg', type: 'movie' }
    ],
    series: [
      { title: 'The Last of Us', year: 2023, rating: 9.2, image: '../images/Series.jpg', type: 'series' },
      { title: 'Severance', year: 2022, rating: 9.0, image: '../images/Severence.jpg', type: 'series' }
    ],
    anime: [
      { title: 'Attack on Titan', year: 2023, rating: 9.3, image: '../images/attack on titan.jpg', type: 'anime' },
      { title: 'Jujutsu Kaisen', year: 2023, rating: 9.4, image: '../images/JJK.jpeg', type: 'anime' }
    ],
    manga: [
      { title: 'Chainsaw Man', year: 2023, rating: 9.3, image: '../images/Chainsaw.jpg', type: 'manga' },
      { title: 'One Piece', year: 2023, rating: 9.6, image: '../images/OnePiece.jpg', type: 'manga' }
    ],
    games: [
      { title: 'Elden Ring', year: 2022, rating: 9.5, image: '../images/EldenRing.jpg', type: 'game' },
      { title: 'God of War Ragnarök', year: 2022, rating: 9.2, image: '../images/GOW.jpg', type: 'game' }
    ]
  };
  
  // Filter results by category
  let filteredResults = [];
  
  if (category === 'all') {
    // Combine all categories
    Object.values(allResults).forEach(categoryResults => {
      filteredResults = filteredResults.concat(categoryResults);
    });
  } else {
    // Use specific category
    filteredResults = allResults[category] || [];
  }
  
  // Filter by query (case-insensitive)
  const queryLower = query.toLowerCase();
  filteredResults = filteredResults.filter(item => 
    item.title.toLowerCase().includes(queryLower)
  );
  
  // Generate HTML
  if (filteredResults.length === 0) {
    return `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No results found</h3>
        <p>We couldn't find any matches for "${query}" in ${category === 'all' ? 'all categories' : category}.</p>
        <p>Try adjusting your search or browse our categories.</p>
      </div>
    `;
  }
  
  let html = `
    <div class="search-summary">
      <h3>Found ${filteredResults.length} results for "${query}"</h3>
    </div>
    <div class="search-results-grid">
  `;
  
  filteredResults.forEach(result => {
    html += `
      <div class="search-result-card">
        <div class="result-image">
          <img src="${result.image}" alt="${result.title}">
          <span class="result-type">${result.type}</span>
        </div>
        <div class="result-info">
          <h3>${result.title}</h3>
          <div class="result-meta">
            <span class="result-year">${result.year}</span>
            <span class="result-rating"><i class="fas fa-star"></i> ${result.rating}</span>
          </div>
          <div class="result-actions">
            <a href="${result.type}.html" class="btn btn-primary btn-sm">View Details</a>
            <button class="btn btn-outline btn-sm add-to-list" data-id="${result.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}" data-type="${result.type}">
              <i class="far fa-bookmark"></i> Add to List
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  return html;
}

// Initialize search filters
function initializeSearchFilters() {
  const sortSelect = document.getElementById('sort-results');
  const filterButtons = document.querySelectorAll('.filter-option');
  
  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      // In a real app, this would sort the results
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast(`Sorting results by ${this.options[this.selectedIndex].text}`, 'info');
    });
  }
  
  // Filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Toggle active state
      this.classList.toggle('active');
      
      // In a real app, this would filter the results
      // For demo purposes, we'll just show a toast
      const filterName = this.textContent.trim();
      const isActive = this.classList.contains('active');
      
      window.EntertainmentHub.showToast(`${isActive ? 'Applied' : 'Removed'} filter: ${filterName}`, 'info');
    });
  });
}

// Initialize result actions
function initializeResultActions() {
  const addToListButtons = document.querySelectorAll('.add-to-list');
  
  addToListButtons.forEach(button => {
    const itemId = button.dataset.id;
    const itemType = button.dataset.type;
    
    // Check if item is already in list
    let listName, list;
    
    switch (itemType) {
      case 'movie':
      case 'series':
      case 'anime':
        listName = 'watchlist';
        list = JSON.parse(localStorage.getItem('watchlist') || '[]');
        break;
      case 'manga':
        listName = 'readingList';
        list = JSON.parse(localStorage.getItem('readingList') || '[]');
        break;
      case 'game':
        listName = 'wishlist';
        list = JSON.parse(localStorage.getItem('wishlist') || '[]');
        break;
    }
    
    const isInList = list.some(item => item.id === itemId);
    
    // Update button state
    if (isInList) {
      button.classList.add('added');
      button.innerHTML = '<i class="fas fa-bookmark"></i> Added';
    }
    
    // Add click event
    button.addEventListener('click', function() {
      toggleItemInList(this, itemId, itemType, listName, list);
    });
  });
}

// Toggle item in list
function toggleItemInList(button, itemId, itemType, listName, list) {
  const isInList = list.some(item => item.id === itemId);

  if (isInList) {
    // Remove from list
    list = list.filter(item => item.id !== itemId);
    button.classList.remove('added');
    button.innerHTML = '<i class="far fa-bookmark"></i> Add to List';
  } else {
    // Add to list
    const First = itemId.split('-')[0];
    const us = itemId.split('-')[1];
    const create = First.charAt(0).toUpperCase() + First.slice(1)
    const a = us.charAt(0).toUpperCase() + us.slice(1)
    list.push({ id: itemId, type: itemType, title: create + " " + a });
    button.classList.add('added');
    button.innerHTML = '<i class="fas fa-bookmark"></i> Added';
  }

  // Update local storage
  localStorage.setItem(listName, JSON.stringify(list));
}
