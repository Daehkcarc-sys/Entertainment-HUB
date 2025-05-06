/**
 * Entertainment Hub - News
 * Handles news page functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeNewsPage();
});

function initializeNewsPage() {
  // Initialize news articles
  initializeNewsArticles();
  
  // Initialize media players
  initializeMediaPlayers();
  
  // Initialize trending news
  initializeTrendingNews();
}

// Initialize news articles
function initializeNewsArticles() {
  const newsArticles = document.querySelectorAll('section.news article');
  
  newsArticles.forEach(article => {
    article.addEventListener('click', function() {
      const articleTitle = this.querySelector('h3').textContent;
      
      // In a real app, this would navigate to the full article
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast(`Reading article: ${articleTitle}`, 'info');
    });
  });
}

// Initialize media players
function initializeMediaPlayers() {
  // Video player
  const videoPlayer = document.getElementById('featured-trailer');
  if (videoPlayer) {
    // Add custom controls
    const videoContainer = videoPlayer.closest('.video-container');
    
    if (videoContainer) {
      // Create custom play button overlay
      const playButton = document.createElement('button');
      playButton.className = 'video-play-button';
      playButton.innerHTML = '<i class="fas fa-play"></i>';
      playButton.setAttribute('aria-label', 'Play video');
      
      videoContainer.appendChild(playButton);
      
      // Add click event
      playButton.addEventListener('click', () => {
        if (videoPlayer.paused) {
          videoPlayer.play();
          playButton.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          videoPlayer.pause();
          playButton.innerHTML = '<i class="fas fa-play"></i>';
        }
      });
      
      // Hide button when video is playing
      videoPlayer.addEventListener('play', () => {
        playButton.classList.add('playing');
      });
      
      videoPlayer.addEventListener('pause', () => {
        playButton.classList.remove('playing');
      });
    }
  }
  
  // Audio player
  const audioPlayer = document.getElementById('podcast-preview');
  if (audioPlayer) {
    // Add custom audio visualization (simplified)
    const audioContainer = audioPlayer.closest('.audio-preview');
    
    if (audioContainer) {
      // Create visualization container
      const visualizer = document.createElement('div');
      visualizer.className = 'audio-visualizer';
      
      // Add bars
      for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        visualizer.appendChild(bar);
      }
      
      // Insert before audio element
      audioContainer.insertBefore(visualizer, audioPlayer);
      
      // Animate bars when audio is playing
      audioPlayer.addEventListener('play', () => {
        visualizer.classList.add('playing');
        animateVisualizer(visualizer);
      });
      
      audioPlayer.addEventListener('pause', () => {
        visualizer.classList.remove('playing');
      });
    }
  }
}

// Animate audio visualizer
function animateVisualizer(visualizer) {
  const bars = visualizer.querySelectorAll('.visualizer-bar');
  
  // Animation function
  function updateBars() {
    bars.forEach(bar => {
      // Generate random height between 20% and 100%
      const height = Math.floor(Math.random() * 80) + 20;
      bar.style.height = `${height}%`;
    });
    
    // Continue animation if still playing
    if (visualizer.classList.contains('playing')) {
      requestAnimationFrame(updateBars);
    }
  }
  
  // Start animation
  updateBars();
}

// Initialize trending news
function initializeTrendingNews() {
  const trendingItems = document.querySelectorAll('section.trending-news li');
  
  trendingItems.forEach(item => {
    item.addEventListener('click', function() {
      const newsTitle = this.textContent;
      
      // In a real app, this would navigate to the news article
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast(`Reading trending news: ${newsTitle}`, 'info');
    });
  });
}
