/**
 * Series Detail Page JavaScript
 * Handles loading and interaction with series details, episodes, and related content
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get series ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');
    
    if (!seriesId) {
        showError('No series specified. Please select a series from the <a href="series.html">series page</a>.');
        return;
    }
    
    // Initialize page components
    initPage(seriesId);
});

/**
 * Initialize the page with series data
 */
async function initPage(seriesId) {
    try {
        // Load series details
        const seriesDetails = await fetchSeriesDetails(seriesId);
        
        if (!seriesDetails) {
            showError('Series not found or unavailable.');
            return;
        }
        
        // Update page components
        updateSeriesHeader(seriesDetails);
        loadSeriesSeasons(seriesId, seriesDetails.seasons);
        loadSeriesCast(seriesId, seriesDetails.cast);
        loadSeriesReviews(seriesId);
        loadRelatedContent(seriesId, seriesDetails);
        loadDiscussions(seriesId);
        
        // Setup event listeners after data is loaded
        setupEventListeners(seriesId, seriesDetails);
        
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load series details. Please try again later.');
    }
}

/**
 * Fetch series details from API
 */
async function fetchSeriesDetails(seriesId) {
    try {
        const response = await fetch(`../api/series.php?action=get_series&id=${seriesId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch series details');
        }
        
        return data.series;
        
    } catch (error) {
        console.error('Error fetching series details:', error);
        throw error;
    }
}

/**
 * Update the page header with series information
 */
function updateSeriesHeader(series) {
    // Set page title
    document.title = `${series.title} | Entertainment Hub`;
    
    // Update hero section
    const heroSection = document.getElementById('series-hero');
    
    // Set backdrop image
    const backdrop = heroSection.querySelector('.content-hero-backdrop');
    backdrop.style.backgroundImage = `url('${series.backdrop_path}')`;
    
    // Set poster image
    const posterContainer = heroSection.querySelector('.content-poster');
    posterContainer.innerHTML = `<img src="${series.poster_path}" alt="${series.title} Poster">`;
    
    // Update title and year/network
    const titleElement = heroSection.querySelector('.content-title');
    titleElement.textContent = series.title;
    
    const yearNetworkElement = heroSection.querySelector('.content-year-network');
    yearNetworkElement.innerHTML = `
        <span class="year">${new Date(series.first_air_date).getFullYear()}</span>
        ${series.network ? `<span class="separator">•</span> <span class="network">${series.network}</span>` : ''}
    `;
    
    // Update rating and seasons
    const ratingElement = heroSection.querySelector('.content-rating');
    ratingElement.innerHTML = `
        <i class="fas fa-star"></i> ${(series.ratings && series.ratings.average_rating) ? parseFloat(series.ratings.average_rating).toFixed(1) : 'N/A'}
        ${(series.ratings && series.ratings.rating_count) ? `<span class="rating-count">(${series.ratings.rating_count})</span>` : ''}
    `;
    
    const seasonsElement = heroSection.querySelector('.content-seasons');
    if (series.seasons && series.seasons.length > 0) {
        const totalEpisodes = series.seasons.reduce((total, season) => total + parseInt(season.episode_count), 0);
        seasonsElement.innerHTML = `${series.seasons.length} Season${series.seasons.length !== 1 ? 's' : ''} • ${totalEpisodes} Episode${totalEpisodes !== 1 ? 's' : ''}`;
    }
    
    const statusElement = heroSection.querySelector('.content-status');
    statusElement.textContent = series.status || 'Unknown';
    
    // Update genres
    const genresElement = heroSection.querySelector('.content-genres');
    genresElement.innerHTML = '';
    
    if (series.genres && series.genres.length > 0) {
        series.genres.forEach(genre => {
            const genreTag = document.createElement('span');
            genreTag.classList.add('content-genre');
            genreTag.textContent = genre.name;
            genresElement.appendChild(genreTag);
        });
    }
    
    // Update overview
    const overviewElement = heroSection.querySelector('.content-overview');
    overviewElement.textContent = series.overview;
    
    // Update creators and air date
    const creatorsElement = heroSection.querySelector('.creators-list');
    if (series.created_by) {
        creatorsElement.textContent = series.created_by;
    } else {
        creatorsElement.textContent = 'Unknown';
    }
    
    const airDateElement = heroSection.querySelector('.first-air-date');
    if (series.first_air_date) {
        const date = new Date(series.first_air_date);
        airDateElement.textContent = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
        airDateElement.textContent = 'Unknown';
    }
    
    // Update buttons
    const watchlistButton = heroSection.querySelector('.watchlist-button');
    
    // Check if series is in user's watchlist
    checkWatchlistStatus(series.id)
        .then(inWatchlist => {
            if (inWatchlist) {
                watchlistButton.innerHTML = '<i class="fas fa-bookmark"></i><span>Remove from Watchlist</span>';
                watchlistButton.classList.add('in-watchlist');
            } else {
                watchlistButton.innerHTML = '<i class="far fa-bookmark"></i><span>Add to Watchlist</span>';
                watchlistButton.classList.remove('in-watchlist');
            }
        })
        .catch(error => console.error('Error checking watchlist status:', error));
}

/**
 * Load seasons and episodes for the series
 */
async function loadSeriesSeasons(seriesId, seasons) {
    if (!seasons || seasons.length === 0) {
        document.getElementById('episodes-list').innerHTML = '<p class="no-episodes">No episodes available for this series.</p>';
        return;
    }
    
    // Populate season selector
    const seasonSelect = document.getElementById('season-select');
    seasonSelect.innerHTML = '';
    
    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season.season_number;
        option.textContent = `Season ${season.season_number}`;
        seasonSelect.appendChild(option);
    });
    
    // Load episodes for first season
    await loadSeasonEpisodes(seriesId, seasons[0].season_number);
    
    // Add event listener for season change
    seasonSelect.addEventListener('change', function() {
        loadSeasonEpisodes(seriesId, this.value);
    });
}

/**
 * Load episodes for a specific season
 */
async function loadSeasonEpisodes(seriesId, seasonNumber) {
    try {
        const episodesList = document.getElementById('episodes-list');
        episodesList.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading episodes...</p>
            </div>
        `;
        
        // Get watch progress if user is logged in
        let watchProgress = null;
        if (isLoggedIn()) {
            try {
                const progressResponse = await fetch(`../api/series.php?action=get_watch_progress&id=${seriesId}`);
                const progressData = await progressResponse.json();
                
                if (progressData.success) {
                    watchProgress = progressData;
                }
            } catch (error) {
                console.error('Error fetching watch progress:', error);
            }
        }
        
        // Fetch episodes
        const response = await fetch(`../api/series.php?action=get_episodes&id=${seriesId}&season=${seasonNumber}`);
        const data = await response.json();
        
        if (!data.success || !data.episodes || data.episodes.length === 0) {
            episodesList.innerHTML = '<p class="no-episodes">No episodes available for this season.</p>';
            return;
        }
        
        // Render episodes
        episodesList.innerHTML = '';
        
        data.episodes.forEach(episode => {
            // Check if episode was watched
            let isWatched = false;
            let watchProgress = 0;
            
            if (watchProgress && watchProgress.seasons) {
                const seasonData = watchProgress.seasons.find(s => s.season_number == seasonNumber);
                if (seasonData) {
                    const episodeData = seasonData.episodes.find(e => e.id == episode.id);
                    if (episodeData) {
                        isWatched = episodeData.completed;
                        watchProgress = episodeData.progress_seconds;
                    }
                }
            }
            
            const episodeItem = document.createElement('div');
            episodeItem.classList.add('episode-item');
            if (isWatched) episodeItem.classList.add('watched');
            
            const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'Unknown';
            
            episodeItem.innerHTML = `
                <div class="episode-number">${episode.episode_number}</div>
                <div class="episode-details">
                    <h3 class="episode-title">${episode.title}</h3>
                    <div class="episode-meta">
                        <span class="air-date">${airDate}</span>
                        <span class="runtime">${episode.runtime || '—'} min</span>
                    </div>
                    <p class="episode-overview">${episode.overview || 'No description available.'}</p>
                </div>
                <div class="episode-actions">
                    <button class="watch-button" data-episode-id="${episode.id}">
                        <i class="fas ${isWatched ? 'fa-check-circle' : 'fa-play-circle'}"></i>
                        <span>${isWatched ? 'Watched' : 'Watch'}</span>
                    </button>
                </div>
            `;
            
            // Add click event for the episode
            episodeItem.querySelector('.watch-button').addEventListener('click', function() {
                openEpisodeModal(episode, isWatched);
            });
            
            episodesList.appendChild(episodeItem);
        });
        
        // Update watch progress summary
        updateWatchProgressSummary(seasonNumber, watchProgress);
        
    } catch (error) {
        console.error('Error loading episodes:', error);
        document.getElementById('episodes-list').innerHTML = '<p class="error">Failed to load episodes. Please try again later.</p>';
    }
}

/**
 * Update the watch progress summary for the current season
 */
function updateWatchProgressSummary(seasonNumber, watchProgress) {
    const summaryElement = document.getElementById('watch-progress-summary');
    
    if (!watchProgress || !watchProgress.seasons) {
        summaryElement.style.display = 'none';
        return;
    }
    
    const seasonData = watchProgress.seasons.find(s => s.season_number == seasonNumber);
    
    if (!seasonData) {
        summaryElement.style.display = 'none';
        return;
    }
    
    const { watched_episodes, total_episodes } = seasonData;
    const percentage = total_episodes > 0 ? (watched_episodes / total_episodes * 100) : 0;
    
    summaryElement.style.display = 'block';
    summaryElement.querySelector('.progress-fill').style.width = `${percentage}%`;
    summaryElement.querySelector('.progress-text').textContent = `${watched_episodes} of ${total_episodes} episodes watched`;
}

/**
 * Open episode modal with details
 */
function openEpisodeModal(episode, isWatched) {
    const modal = document.getElementById('episode-modal');
    
    // Set episode details
    modal.querySelector('.episode-title').textContent = episode.title;
    modal.querySelector('.episode-number').textContent = `Season ${episode.season_number}, Episode ${episode.episode_number}`;
    modal.querySelector('.episode-runtime').textContent = `${episode.runtime || '—'} min`;
    modal.querySelector('.date-value').textContent = episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'Unknown';
    modal.querySelector('.episode-synopsis').textContent = episode.overview || 'No description available.';
    
    // Set images
    const imageGallery = modal.querySelector('.image-gallery');
    if (episode.images && episode.images.length > 0) {
        imageGallery.innerHTML = '';
        episode.images.forEach(image => {
            const img = document.createElement('img');
            img.src = image.path;
            img.alt = `${episode.title} - Image`;
            imageGallery.appendChild(img);
        });
    } else {
        imageGallery.innerHTML = '<p class="no-images">No images available for this episode.</p>';
    }
    
    // Update mark watched button
    const markWatchedBtn = modal.querySelector('.mark-watched');
    if (isWatched) {
        markWatchedBtn.innerHTML = '<i class="fas fa-check"></i><span>Watched</span>';
        markWatchedBtn.classList.add('watched');
    } else {
        markWatchedBtn.innerHTML = '<i class="far fa-check"></i><span>Mark as Watched</span>';
        markWatchedBtn.classList.remove('watched');
    }
    
    // Event listener for mark as watched
    markWatchedBtn.onclick = function() {
        if (!isLoggedIn()) {
            showLoginPrompt();
            return;
        }
        
        markEpisodeAsWatched(episode.id, episode.series_id, !isWatched)
            .then(() => {
                // Close modal and reload episodes
                closeEpisodeModal();
                loadSeasonEpisodes(episode.series_id, episode.season_number);
            })
            .catch(error => console.error('Error updating watch status:', error));
    };
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Close button event
    modal.querySelector('#close-episode-modal').onclick = closeEpisodeModal;
    
    // Close on outside click
    window.onclick = function(event) {
        if (event.target === modal) {
            closeEpisodeModal();
        }
    };
}

/**
 * Close episode modal
 */
function closeEpisodeModal() {
    const modal = document.getElementById('episode-modal');
    modal.style.display = 'none';
}

/**
 * Load cast information
 */
async function loadSeriesCast(seriesId, castData) {
    const castList = document.getElementById('cast-list');
    
    // If cast data is already available, use it
    if (castData && castData.length > 0) {
        renderCast(castData);
        return;
    }
    
    // Otherwise fetch from API
    try {
        // You may need to implement this endpoint
        const response = await fetch(`../api/content_relationships.php?action=get_cast&content_id=${seriesId}&content_type=series`);
        const data = await response.json();
        
        if (data.success && data.cast && data.cast.length > 0) {
            renderCast(data.cast);
        } else {
            castList.innerHTML = '<p>No cast information available.</p>';
        }
    } catch (error) {
        console.error('Error fetching cast:', error);
        castList.innerHTML = '<p class="error">Failed to load cast information.</p>';
    }
    
    function renderCast(cast) {
        castList.innerHTML = '';
        
        cast.forEach(person => {
            const castItem = document.createElement('div');
            castItem.classList.add('cast-item');
            
            castItem.innerHTML = `
                <div class="cast-photo">
                    <img src="${person.photo || '../images/Avatar.jpg'}" alt="${person.name}">
                </div>
                <div class="cast-details">
                    <h3 class="actor-name">${person.name}</h3>
                    <p class="character-name">${person.character_name || ''}</p>
                </div>
            `;
            
            castList.appendChild(castItem);
        });
    }
}

/**
 * Load series reviews
 */
async function loadSeriesReviews(seriesId) {
    const reviewsList = document.getElementById('reviews-list');
    
    try {
        const response = await fetch(`../api/ratings.php?action=get_reviews&content_id=${seriesId}&content_type=series`);
        const data = await response.json();
        
        if (data.success && data.reviews && data.reviews.length > 0) {
            reviewsList.innerHTML = '';
            
            data.reviews.forEach(review => {
                const reviewItem = document.createElement('div');
                reviewItem.classList.add('review-item');
                
                const date = new Date(review.created_at).toLocaleDateString();
                
                reviewItem.innerHTML = `
                    <div class="review-header">
                        <div class="reviewer-info">
                            <img src="${review.user_avatar || '../images/Avatar.jpg'}" alt="${review.username}" class="reviewer-avatar">
                            <div class="reviewer-meta">
                                <h4 class="reviewer-name">${review.username}</h4>
                                <span class="review-date">${date}</span>
                            </div>
                        </div>
                        <div class="review-rating">
                            <i class="fas fa-star"></i>
                            <span>${review.rating}</span>/10
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.review_text || ''}</p>
                    </div>
                    <div class="review-actions">
                        <button class="helpful-button" data-review-id="${review.id}">
                            <i class="far fa-thumbs-up"></i>
                            <span>Helpful</span>
                            <span class="helpful-count">${review.helpful_count || 0}</span>
                        </button>
                    </div>
                `;
                
                reviewsList.appendChild(reviewItem);
                
                // Add event listener for helpful button
                reviewItem.querySelector('.helpful-button').addEventListener('click', function() {
                    if (!isLoggedIn()) {
                        showLoginPrompt();
                        return;
                    }
                    
                    markReviewAsHelpful(review.id)
                        .then(data => {
                            const helpfulCount = this.querySelector('.helpful-count');
                            helpfulCount.textContent = data.count;
                            this.classList.add('marked-helpful');
                        })
                        .catch(error => console.error('Error marking review as helpful:', error));
                });
            });
            
        } else {
            reviewsList.innerHTML = '<div class="review-placeholder"><p>No reviews yet. Be the first to review!</p></div>';
        }
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsList.innerHTML = '<p class="error">Failed to load reviews. Please try again later.</p>';
    }
}

/**
 * Load related content
 */
async function loadRelatedContent(seriesId, seriesDetails) {
    const similarSeriesTab = document.getElementById('similar-series').querySelector('.content-grid');
    const fromNetworkTab = document.getElementById('from-network').querySelector('.content-grid');
    const relatedMoviesTab = document.getElementById('related-movies').querySelector('.content-grid');
    
    try {
        // Fetch similar series
        const similarResponse = await fetch(`../api/content_relationships.php?action=get_similar&content_id=${seriesId}&content_type=series&limit=6`);
        const similarData = await similarResponse.json();
        
        if (similarData.success && similarData.similar && similarData.similar.length > 0) {
            similarSeriesTab.innerHTML = '';
            
            similarData.similar.forEach(series => {
                similarSeriesTab.appendChild(createContentCard(series, 'series'));
            });
        } else {
            similarSeriesTab.innerHTML = '<p>No similar series found.</p>';
        }
        
        // Fetch series from same network
        if (seriesDetails && seriesDetails.network) {
            const networkResponse = await fetch(`../api/content1.php?action=search&content_type=series&keyword=${encodeURIComponent(seriesDetails.network)}&field=network&limit=6`);
            const networkData = await networkResponse.json();
            
            if (networkData.success && networkData.results && networkData.results.length > 0) {
                fromNetworkTab.innerHTML = '';
                
                // Filter out current series
                const networkSeries = networkData.results.filter(s => s.id != seriesId);
                
                if (networkSeries.length > 0) {
                    networkSeries.forEach(series => {
                        fromNetworkTab.appendChild(createContentCard(series, 'series'));
                    });
                } else {
                    fromNetworkTab.innerHTML = '<p>No other series found from this network.</p>';
                }
            } else {
                fromNetworkTab.innerHTML = '<p>No series found from this network.</p>';
            }
        } else {
            fromNetworkTab.innerHTML = '<p>Network information not available.</p>';
        }
        
        // Fetch related movies
        const moviesResponse = await fetch(`../api/content_relationships.php?action=get_related_movies&series_id=${seriesId}&limit=6`);
        const moviesData = await moviesResponse.json();
        
        if (moviesData.success && moviesData.movies && moviesData.movies.length > 0) {
            relatedMoviesTab.innerHTML = '';
            
            moviesData.movies.forEach(movie => {
                relatedMoviesTab.appendChild(createContentCard(movie, 'movie'));
            });
        } else {
            relatedMoviesTab.innerHTML = '<p>No related movies found.</p>';
        }
        
    } catch (error) {
        console.error('Error loading related content:', error);
        similarSeriesTab.innerHTML = '<p class="error">Failed to load similar series.</p>';
        fromNetworkTab.innerHTML = '<p class="error">Failed to load network series.</p>';
        relatedMoviesTab.innerHTML = '<p class="error">Failed to load related movies.</p>';
    }
}

/**
 * Create a content card (series or movie)
 */
function createContentCard(item, contentType) {
    const card = document.createElement('div');
    card.classList.add('themed-card', `${contentType}-card`);
    
    const link = document.createElement('a');
    link.href = contentType === 'series' ? `series-detail.html?id=${item.id}` : `movie-detail.html?id=${item.id}`;
    
    const cardImage = document.createElement('div');
    cardImage.classList.add('themed-card-image', `${contentType}-image`);
    cardImage.innerHTML = `
        <img src="${item.poster_path || item.backdrop_path || '../images/placeholder.jpg'}" alt="${item.title}">
        <div class="${contentType}-overlay">
            <span class="${contentType}-rating">${parseFloat(item.rating).toFixed(1)}</span>
        </div>
    `;
    
    const cardContent = document.createElement('div');
    cardContent.classList.add('themed-card-content', `${contentType}-info`);
    cardContent.innerHTML = `
        <h3 class="themed-card-title">${item.title}</h3>
        <div class="themed-card-meta">
            ${contentType === 'series' ? 
                (item.first_air_date ? `<span class="year">${new Date(item.first_air_date).getFullYear()}</span>` : '') :
                (item.release_date ? `<span class="year">${new Date(item.release_date).getFullYear()}</span>` : '')
            }
        </div>
    `;
    
    link.appendChild(cardImage);
    link.appendChild(cardContent);
    card.appendChild(link);
    
    return card;
}

/**
 * Load discussions for the series
 */
async function loadDiscussions(seriesId) {
    const discussionsList = document.getElementById('discussions-list');
    
    try {
        const response = await fetch(`../api/discussions.php?content_id=${seriesId}&content_type=series`);
        const data = await response.json();
        
        if (data.success && data.discussions && data.discussions.length > 0) {
            discussionsList.innerHTML = '';
            
            data.discussions.forEach(discussion => {
                const discussionItem = document.createElement('div');
                discussionItem.classList.add('discussion-item');
                
                const date = new Date(discussion.created_at).toLocaleDateString();
                
                discussionItem.innerHTML = `
                    <div class="discussion-header">
                        <h4 class="discussion-title">${discussion.title}</h4>
                        <div class="discussion-stats">
                            <span class="replies-count">
                                <i class="fas fa-comment"></i>
                                ${discussion.replies_count || 0}
                            </span>
                            <span class="views-count">
                                <i class="fas fa-eye"></i>
                                ${discussion.views_count || 0}
                            </span>
                        </div>
                    </div>
                    <div class="discussion-meta">
                        <div class="user-info">
                            <img src="${discussion.user_avatar || '../images/Avatar.jpg'}" alt="${discussion.username}" class="user-avatar">
                            <span class="username">${discussion.username}</span>
                        </div>
                        <span class="post-date">${date}</span>
                    </div>
                    <div class="discussion-preview">
                        <p>${truncateText(discussion.content, 150)}</p>
                    </div>
                    <a href="discussions.html?id=${discussion.id}" class="read-more">Read Discussion</a>
                `;
                
                discussionsList.appendChild(discussionItem);
            });
            
        } else {
            discussionsList.innerHTML = '<div class="discussion-placeholder"><p>No discussions yet. Start a conversation!</p></div>';
        }
        
    } catch (error) {
        console.error('Error loading discussions:', error);
        discussionsList.innerHTML = '<p class="error">Failed to load discussions. Please try again later.</p>';
    }
}

/**
 * Setup event listeners for the page
 */
function setupEventListeners(seriesId, seriesDetails) {
    // Tab navigation in related content
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and buttons
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.related-content-tab').forEach(tab => tab.classList.remove('active'));
            
            // Add active class to current tab and button
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Watchlist button
    const watchlistButton = document.querySelector('.watchlist-button');
    
    watchlistButton.addEventListener('click', function() {
        if (!isLoggedIn()) {
            showLoginPrompt();
            return;
        }
        
        const inWatchlist = this.classList.contains('in-watchlist');
        
        toggleWatchlistStatus(seriesId, !inWatchlist)
            .then(success => {
                if (success) {
                    if (inWatchlist) {
                        this.innerHTML = '<i class="far fa-bookmark"></i><span>Add to Watchlist</span>';
                        this.classList.remove('in-watchlist');
                        showNotification('Removed from your watchlist');
                    } else {
                        this.innerHTML = '<i class="fas fa-bookmark"></i><span>Remove from Watchlist</span>';
                        this.classList.add('in-watchlist');
                        showNotification('Added to your watchlist');
                    }
                }
            })
            .catch(error => console.error('Error toggling watchlist status:', error));
    });
    
    // Rate button
    const rateButton = document.querySelector('.rate-button');
    
    rateButton.addEventListener('click', function() {
        if (!isLoggedIn()) {
            showLoginPrompt();
            return;
        }
        
        openRatingModal(seriesId);
    });
    
    // Share button
    const shareButton = document.querySelector('.share-button');
    
    shareButton.addEventListener('click', function() {
        if (navigator.share) {
            navigator.share({
                title: seriesDetails.title,
                text: `Check out ${seriesDetails.title} on Entertainment Hub!`,
                url: window.location.href
            })
            .catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            const tempInput = document.createElement('input');
            tempInput.value = window.location.href;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showNotification('Link copied to clipboard!');
        }
    });
    
    // Page navigation
    const navLinks = document.querySelectorAll('.content-nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update active link
                document.querySelectorAll('.content-nav-links a').forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Scroll spy
    window.addEventListener('scroll', debounce(function() {
        const sections = document.querySelectorAll('.content-section');
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (pageYOffset >= sectionTop - 100 && pageYOffset < sectionTop + sectionHeight - 100) {
                currentSection = '#' + section.getAttribute('id');
            }
        });
        
        if (currentSection) {
            document.querySelectorAll('.content-nav-links a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === currentSection) {
                    link.classList.add('active');
                }
            });
        }
    }, 100));
}

/**
 * Open rating modal
 */
function openRatingModal(seriesId) {
    const modal = document.getElementById('rating-modal');
    const stars = modal.querySelectorAll('.star-rating i');
    const submitButton = modal.querySelector('.submit-rating');
    let selectedRating = 0;
    
    // Reset modal state
    stars.forEach(star => star.className = 'far fa-star');
    modal.querySelector('.rating-label').textContent = 'Click to rate';
    modal.querySelector('textarea').value = '';
    submitButton.disabled = true;
    
    // Get existing rating if available
    fetch(`../api/ratings.php?action=get_user_rating&content_id=${seriesId}&content_type=series`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.rating) {
                selectedRating = data.rating.rating;
                updateStars(selectedRating);
                modal.querySelector('textarea').value = data.rating.review_text || '';
                submitButton.disabled = false;
            }
        })
        .catch(error => console.error('Error fetching user rating:', error));
    
    // Star rating interaction
    stars.forEach(star => {
        // Hover effect
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            updateStars(rating, true);
        });
        
        // Click to set rating
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            updateStars(selectedRating);
            modal.querySelector('.rating-label').textContent = `${selectedRating}/10 - ${getRatingLabel(selectedRating)}`;
            submitButton.disabled = false;
        });
    });
    
    // Mouse leave event for star container
    modal.querySelector('.star-rating').addEventListener('mouseleave', function() {
        if (selectedRating > 0) {
            updateStars(selectedRating);
        } else {
            stars.forEach(star => star.className = 'far fa-star');
        }
    });
    
    // Submit button event
    submitButton.onclick = function() {
        if (!selectedRating) return;
        
        const reviewText = modal.querySelector('textarea').value;
        
        submitRating(seriesId, 'series', selectedRating, reviewText)
            .then(success => {
                if (success) {
                    closeRatingModal();
                    showNotification('Your rating has been submitted!');
                    
                    // Reload reviews section
                    loadSeriesReviews(seriesId);
                }
            })
            .catch(error => console.error('Error submitting rating:', error));
    };
    
    function updateStars(rating, isHover = false) {
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.className = isHover ? 'fas fa-star hover' : 'fas fa-star';
            } else {
                star.className = 'far fa-star';
            }
        });
    }
    
    function getRatingLabel(rating) {
        if (rating >= 9) return 'Masterpiece';
        if (rating >= 8) return 'Great';
        if (rating >= 7) return 'Good';
        if (rating >= 6) return 'Fine';
        if (rating >= 5) return 'Average';
        if (rating >= 4) return 'Below Average';
        if (rating >= 3) return 'Bad';
        if (rating >= 2) return 'Very Bad';
        return 'Terrible';
    }
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Close button event
    modal.querySelector('#close-rating-modal').onclick = closeRatingModal;
    
    // Close on outside click
    window.onclick = function(event) {
        if (event.target === modal) {
            closeRatingModal();
        }
    };
}

/**
 * Close rating modal
 */
function closeRatingModal() {
    document.getElementById('rating-modal').style.display = 'none';
}

/**
 * Check if a series is in the user's watchlist
 */
async function checkWatchlistStatus(seriesId) {
    if (!isLoggedIn()) {
        return false;
    }
    
    try {
        const response = await fetch(`../api/watchlist.php?action=check&content_id=${seriesId}&content_type=series`);
        const data = await response.json();
        
        return data.success && data.in_watchlist;
    } catch (error) {
        console.error('Error checking watchlist status:', error);
        return false;
    }
}

/**
 * Toggle watchlist status (add/remove)
 */
async function toggleWatchlistStatus(seriesId, addToWatchlist) {
    try {
        const action = addToWatchlist ? 'add_to_watchlist' : 'remove_from_watchlist';
        
        const response = await fetch('../api/series.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                series_id: seriesId
            })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error toggling watchlist status:', error);
        return false;
    }
}

/**
 * Mark episode as watched/unwatched
 */
async function markEpisodeAsWatched(episodeId, seriesId, isCompleted) {
    try {
        const response = await fetch('../api/series.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_watch_progress',
                episode_id: episodeId,
                series_id: seriesId,
                progress_seconds: 0,
                completed: isCompleted
            })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error marking episode as watched:', error);
        return false;
    }
}

/**
 * Mark review as helpful
 */
async function markReviewAsHelpful(reviewId) {
    try {
        const response = await fetch('../api/ratings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'mark_helpful',
                review_id: reviewId
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error marking review as helpful:', error);
        throw error;
    }
}

/**
 * Submit rating
 */
async function submitRating(contentId, contentType, rating, reviewText) {
    try {
        const response = await fetch('../api/ratings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'submit_rating',
                content_id: contentId,
                content_type: contentType,
                rating: rating,
                review_text: reviewText
            })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error submitting rating:', error);
        return false;
    }
}

/**
 * Show login prompt
 */
function showLoginPrompt() {
    showNotification('Please sign in to use this feature', 'signin.html');
}

/**
 * Show notification
 */
function showNotification(message, linkUrl = null) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    
    if (linkUrl) {
        notification.innerHTML = `
            <p>${message}</p>
            <a href="${linkUrl}" class="notification-link">Sign In</a>
        `;
    } else {
        notification.textContent = message;
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return !!localStorage.getItem('user_token');
}

/**
 * Show error message on page
 */
function showError(message) {
    const main = document.querySelector('main');
    main.innerHTML = `
        <div class="error-container">
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Oops! Something went wrong</h2>
                <p>${message}</p>
                <a href="series.html" class="themed-btn-primary">Back to Series</a>
            </div>
        </div>
    `;
}

/**
 * Helper function to truncate text with ellipsis
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Debounce function to limit the rate at which a function can fire
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}