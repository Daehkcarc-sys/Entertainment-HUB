/**
 * Entertainment Hub - Games
 * Handles games page functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeGamesPage();
});

function initializeGamesPage() {
  // Initialize game tabs
  initializeGameTabs();
  
  // Initialize game filters
  initializeGameFilters();
  
  // Initialize game details tabs
  initializeGameDetailsTabs();
  
  // Initialize game wishlist buttons
  initializeWishlistButtons();
  
  // Initialize quick filters
  initializeQuickFilters();
  
  // Initialize genre cards
  initializeGenreCards();
}

// Initialize game tabs
function initializeGameTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const target = this.dataset.target;
      
      // Update active button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Show target content, hide others
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add('active');
        
        // If content has placeholder, load it
        if (targetContent.querySelector('.placeholder-text')) {
          loadGameTabContent(target, targetContent);
        }
      }
    });
  });
}

// Load game tab content
function loadGameTabContent(tabId, tabElement) {
  // Show loading state
  tabElement.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading ${tabId.replace(/-/g, ' ')}...</span>
    </div>
  `;
  
  // Simulate loading delay
  setTimeout(() => {
    // Generate content based on tab ID
    let content = '';
    
    switch (tabId) {
      case 'new-releases':
        content = generateGameGrid([
          { title: 'Final Fantasy XVI', platform: ['PS5'], genre: 'RPG', rating: 8.7, image: '../images/GOW.jpg' },
          { title: 'Starfield', platform: ['PC', 'Xbox'], genre: 'RPG, Space', rating: 8.5, image: '../images/EldenRing.jpg' },
          { title: 'Resident Evil 4 Remake', platform: ['PC', 'PS5', 'Xbox'], genre: 'Horror', rating: 9.0, image: '../images/Darkknight.jpg' },
          { title: 'Hogwarts Legacy', platform: ['PC', 'PS5', 'Xbox', 'Switch'], genre: 'RPG', rating: 8.3, image: '../images/Avatar.jpg' }
        ]);
        break;
        
      case 'upcoming':
        content = generateGameGrid([
          { title: 'Dragon Age: Dreadwolf', platform: ['PC', 'PS5', 'Xbox'], genre: 'RPG', rating: null, image: '../images/GOW.jpg' },
          { title: 'Fable', platform: ['PC', 'Xbox'], genre: 'RPG', rating: null, image: '../images/EldenRing.jpg' },
          { title: 'Star Wars Outlaws', platform: ['PC', 'PS5', 'Xbox'], genre: 'Action Adventure', rating: null, image: '../images/Starwars.jpg' },
          { title: 'Avowed', platform: ['PC', 'Xbox'], genre: 'RPG', rating: null, image: '../images/Avatar.jpg' }
        ]);
        break;
        
      case 'indie':
        content = generateGameGrid([
          { title: 'Hades II', platform: ['PC'], genre: 'Roguelike', rating: 9.2, image: '../images/SpiritedAway.jpg' },
          { title: 'Hollow Knight: Silksong', platform: ['PC', 'Switch'], genre: 'Metroidvania', rating: null, image: '../images/Darkknight.jpg' },
          { title: 'Stardew Valley', platform: ['PC', 'PS5', 'Xbox', 'Switch', 'Mobile'], genre: 'Simulation', rating: 9.1, image: '../images/minecraft.jpg' },
          { title: 'Cult of the Lamb', platform: ['PC', 'PS5', 'Xbox', 'Switch'], genre: 'Roguelike', rating: 8.5, image: '../images/Avatar.jpg' }
        ]);
        break;
        
      default:
        content = '<p>No content available for this tab.</p>';
    }
    
    // Update tab content
    tabElement.innerHTML = content;
    
    // Initialize wishlist buttons
    initializeWishlistButtons();
  }, 1500);
}

// Generate game grid HTML
function generateGameGrid(games) {
  let html = '<div class="game-grid">';
  
  games.forEach(game => {
    html += `
      <article class="game-card">
        <div class="game-thumbnail">
          <img src="${game.image}" alt="${game.title}">
          <div class="game-platform-icons">
            ${generatePlatformIcons(game.platform)}
          </div>
        </div>
        <div class="game-info">
          <h3>${game.title}</h3>
          <div class="game-meta">
            <span class="genre">${game.genre}</span>
            <span class="release-year">${game.rating ? '2023' : 'Coming Soon'}</span>
          </div>
          ${game.rating ? `
            <div class="rating">
              <div class="rating-bar">
                <div class="rating-fill" style="width: ${game.rating * 10}%"></div>
              </div>
              <span class="rating-number">${game.rating}</span>
            </div>
          ` : `
            <div class="coming-soon">
              <span class="badge">Anticipated</span>
            </div>
          `}
        </div>
      </article>
    `;
  });
  
  html += '</div>';
  return html;
}

// Generate platform icons
function generatePlatformIcons(platforms) {
  let html = '';
  
  if (platforms.includes('PC')) {
    html += '<i class="fas fa-desktop" title="PC"></i>';
  }
  
  if (platforms.includes('PS5')) {
    html += '<i class="fab fa-playstation" title="PlayStation 5"></i>';
  }
  
  if (platforms.includes('Xbox')) {
    html += '<i class="fab fa-xbox" title="Xbox Series X"></i>';
  }
  
  if (platforms.includes('Switch')) {
    html += '<i class="fab fa-nintendo-switch" title="Nintendo Switch"></i>';
  }
  
  if (platforms.includes('Mobile')) {
    html += '<i class="fas fa-mobile-alt" title="Mobile"></i>';
  }
  
  return html;
}

// Initialize game filters
function initializeGameFilters() {
  const platformFilter = document.getElementById('platform-filter');
  const releaseFilter = document.getElementById('release-filter');
  const sortSelect = document.getElementById('sort-select');
  const filterTags = document.querySelectorAll('.filter-tag');
  
  // Platform filter
  if (platformFilter) {
    platformFilter.addEventListener('change', applyFilters);
  }
  
  // Release year filter
  if (releaseFilter) {
    releaseFilter.addEventListener('change', applyFilters);
  }
  
  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilters);
  }
  
  // Filter tags
  filterTags.forEach(tag => {
    tag.addEventListener('click', function() {
      // Toggle active state
      filterTags.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Apply filter
      applyFilters();
    });
  });
  
  // Apply filters
  function applyFilters() {
    // In a real app, this would filter the games
    // For demo purposes, we'll just show a toast
    window.EntertainmentHub.showToast('Filters applied!', 'success');
  }
}

// Initialize game details tabs
function initializeGameDetailsTabs() {
  const detailTabs = document.querySelectorAll('.detail-tab');
  const detailContents = document.querySelectorAll('.detail-content');
  
  detailTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.target;
      
      // Update active tab
      detailTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Show target content, hide others
      detailContents.forEach(content => {
        content.classList.remove('active');
      });
      
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Initialize wishlist buttons
function initializeWishlistButtons() {
  const wishlistButtons = document.querySelectorAll('.add-wishlist');
  
  wishlistButtons.forEach(button => {
    const gameId = button.dataset.id;
    
    // Check if game is already in wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isInWishlist = wishlist.some(item => item.id === gameId);
    
    // Update button state
    if (isInWishlist) {
      button.classList.add('added');
      button.innerHTML = '<i class="fas fa-check"></i> Added';
    }
    
    // Add click event
    button.addEventListener('click', function() {
      toggleWishlist(this, gameId);
    });
  });
}

// Toggle wishlist
function toggleWishlist(button, gameId) {
  // Get current wishlist
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const isInWishlist = wishlist.some(item => item.id === gameId);
  
  if (isInWishlist) {
    // Remove from wishlist
    const newWishlist = wishlist.filter(item => item.id !== gameId);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    
    // Update button
    button.classList.remove('added');
    button.innerHTML = 'Add to Wishlist';
    
    // Show toast
    window.EntertainmentHub.showToast('Removed from wishlist', 'info');
  } else {
    // Add to wishlist
    const newItem = {
      id: gameId,
      type: 'game',
      dateAdded: new Date().toISOString()
    };
    
    wishlist.push(newItem);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // Update button
    button.classList.add('added');
    button.innerHTML = '<i class="fas fa-check"></i> Added';
    
    // Show toast
    window.EntertainmentHub.showToast('Added to wishlist', 'success');
  }
}

// Initialize quick filters
function initializeQuickFilters() {
  const filterPills = document.querySelectorAll('.filter-pill');
  
  filterPills.forEach(pill => {
    pill.addEventListener('click', function() {
      // Toggle active state
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      
      // Apply filter
      const filter = this.textContent.trim().toLowerCase();
      
      // In a real app, this would filter the games
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast(`Showing ${filter} games`, 'info');
    });
  });
}

// Initialize genre cards
function initializeGenreCards() {
  const genreCards = document.querySelectorAll('.genre-card');
  
  genreCards.forEach(card => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      
      const genre = this.querySelector('span').textContent.trim();
      
      // In a real app, this would filter by genre
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast(`Browsing ${genre} games`, 'info');
    });
  });
}
