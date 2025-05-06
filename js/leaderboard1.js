/**
 * Entertainment Hub - Leaderboard
 * Handles leaderboard functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeLeaderboard();
});

function initializeLeaderboard() {
  // Initialize category tabs
  initializeCategoryTabs();
  
  // Initialize leaderboard filters
  initializeLeaderboardFilters();
  
  // Initialize leaderboard animations
  initializeLeaderboardAnimations();
}

// Initialize category tabs
function initializeCategoryTabs() {
  const categoryTabs = document.querySelectorAll('.category-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const category = this.dataset.category;
      const targetPanel = document.getElementById(category + '-panel');
      
      // Update active tab
      categoryTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Show target panel, hide others
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });
      
      if (targetPanel) {
        targetPanel.classList.add('active');
        
        // If panel is empty, load data
        if (targetPanel.innerHTML.trim() === '') {
          loadCategoryData(category, targetPanel);
        }
      }
    });
  });
}

// Load category data
function loadCategoryData(category, targetPanel) {
  // Show loading spinner
  targetPanel.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading ${category} data...</span>
    </div>
  `;
  
  // Simulate network request
  setTimeout(() => {
    // Generate leaderboard table
    targetPanel.innerHTML = generateLeaderboardTable(category);
    
    // Add view more button
    const viewMoreBtn = document.createElement('div');
    viewMoreBtn.className = 'view-more text-center mt-4';
    viewMoreBtn.innerHTML = `<a href="${category}.html" class="btn btn-primary">View All Top ${category.charAt(0).toUpperCase() + category.slice(1)}</a>`;
    targetPanel.appendChild(viewMoreBtn);
  }, 1000);
}

// Generate leaderboard table
function generateLeaderboardTable(category) {
  // Get data for category
  const data = getCategoryData(category);
  
  let html = `
    <div class="leaderboard-table">
      <table class="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Title</th>
            <th>Year</th>
            <th>Genre</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  data.forEach((item, index) => {
    html += `
      <tr>
        <td><span class="rank">${index + 1}</span></td>
        <td>
          <div class="media">
            <img src="${item.image}" alt="${item.title}">
            <div class="media-body">
              <h4>${item.title}</h4>
              <p class="creator">${item.creator}</p>
            </div>
          </div>
        </td>
        <td>${item.year}</td>
        <td>${item.genres.join(', ')}</td>
        <td>
          <div class="rating-compact">
            <span>${item.rating}</span>
            <div class="stars-small">
              ${generateStars(item.rating)}
            </div>
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  return html;
}

// Generate stars based on rating
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHtml = '';
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
  
  // Add half star if needed
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  
  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }
  
  return starsHtml;
}

// Get data for category
function getCategoryData(category) {
  // Sample data for each category
  const data = {
    series: [
      {
        title: 'The Last of Us',
        creator: 'HBO',
        year: 2023,
        genres: ['Drama', 'Horror'],
        rating: 9.2,
        image: '../images/Series.jpg'
      },
      {
        title: 'Severance',
        creator: 'Apple TV+',
        year: 2022,
        genres: ['Sci-Fi', 'Thriller'],
        rating: 9.0,
        image: '../images/Severence.jpg'
      },
      {
        title: 'Last Horizon',
        creator: 'Netflix',
        year: 2024,
        genres: ['Drama', 'Mystery'],
        rating: 8.8,
        image: '../images/LastHorizon.jpg'
      }
    ],
    anime: [
      {
        title: 'Jujutsu Kaisen',
        creator: 'MAPPA',
        year: 2023,
        genres: ['Action', 'Fantasy'],
        rating: 9.4,
        image: '../images/JJK.jpeg'
      },
      {
        title: 'Attack on Titan',
        creator: 'MAPPA',
        year: 2023,
        genres: ['Action', 'Drama'],
        rating: 9.3,
        image: '../images/attack on titan.jpg'
      },
      {
        title: 'Demon Slayer',
        creator: 'Ufotable',
        year: 2023,
        genres: ['Action', 'Supernatural'],
        rating: 9.1,
        image: '../images/DemonSlayer.jpg'
      }
    ],
    manga: [
      {
        title: 'One Piece',
        creator: 'Eiichiro Oda',
        year: 2023,
        genres: ['Adventure', 'Fantasy'],
        rating: 9.6,
        image: '../images/OnePiece.jpg'
      },
      {
        title: 'Chainsaw Man',
        creator: 'Tatsuki Fujimoto',
        year: 2023,
        genres: ['Action', 'Horror'],
        rating: 9.3,
        image: '../images/Chainsaw.jpg'
      },
      {
        title: 'Jujutsu Kaisen',
        creator: 'Gege Akutami',
        year: 2023,
        genres: ['Action', 'Supernatural'],
        rating: 9.2,
        image: '../images/JJK.jpeg'
      }
    ],
    games: [
      {
        title: 'Elden Ring',
        creator: 'FromSoftware',
        year: 2022,
        genres: ['RPG', 'Open World'],
        rating: 9.5,
        image: '../images/EldenRing.jpg'
      },
      {
        title: 'God of War Ragnarök',
        creator: 'Santa Monica Studio',
        year: 2022,
        genres: ['Action', 'Adventure'],
        rating: 9.2,
        image: '../images/GOW.jpg'
      },
      {
        title: 'Minecraft',
        creator: 'Mojang',
        year: 2011,
        genres: ['Sandbox', 'Adventure'],
        rating: 9.0,
        image: '../images/minecraft.jpg'
      }
    ]
  };
  
  return data[category] || [];
}

// Initialize leaderboard filters
function initializeLeaderboardFilters() {
  const filterButtons = document.querySelectorAll('.leaderboard-filters .btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // In a real app, this would filter the data
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast(`Showing ${this.textContent.trim()} leaderboard`, 'info');
    });
  });
}

// Initialize leaderboard animations
function initializeLeaderboardAnimations() {
  // Animate leaderboard cards on scroll
  const leaderboardCards = document.querySelectorAll('.leaderboard-card');
  
  if (leaderboardCards.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add delay based on index
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, index * 150);
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    leaderboardCards.forEach(card => {
      observer.observe(card);
    });
  }
  
  // Animate user rank cards
  const userRankCards = document.querySelectorAll('.user-rank-card');
  
  if (userRankCards.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add delay based on index
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, index * 200);
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    userRankCards.forEach(card => {
      observer.observe(card);
    });
  }
}
