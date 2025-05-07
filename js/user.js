/**
 * User Profile Management
 * This file handles user authentication, profile data fetching, and UI updates
 * for the profile page and user-related elements across the site.
 */

class UserProfile {
    constructor() {
        this.userData = null;
        this.isLoading = false;
        this.token = localStorage.getItem('authToken');
        
        // DOM element references
        this.pageLoader = document.getElementById('pageLoader');
        this.authDropdown = document.querySelector('.user-dropdown');
    }

    /**
     * Initialize the user profile functionality
     */
    async init() {
        // Hide page loader once everything is loaded
        window.addEventListener('load', () => {
            if (this.pageLoader) {
                this.pageLoader.style.display = 'none';
            }
        });
        
        try {
            // Check if user is authenticated
            if (this.token) {
                this.isLoading = true;
                await this.verifyToken();
                
                // Update user interface based on authentication status
                if (this.userData) {
                    this.updateUIForLoggedInState();
                } else {
                    this.updateUIForLoggedOutState();
                }
            } else {
                this.updateUIForLoggedOutState();
            }
        } catch (error) {
            console.error('Error initializing user profile:', error);
            this.updateUIForLoggedOutState();
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Verify the authentication token with the server
     */
    async verifyToken() {
        try {
            const response = await fetch('../api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ action: 'verify_token' })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.userData = data.user;
                    return true;
                }
            }
            
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            this.token = null;
            this.userData = null;
            return false;
        } catch (error) {
            console.error('Error verifying token:', error);
            this.userData = null;
            return false;
        }
    }

    /**
     * Update the UI to show logged in user information
     */
    updateUIForLoggedInState() {
        // Update the user menu in navigation
        if (this.authDropdown) {
            this.authDropdown.innerHTML = `
                <a href="profile.html" class="dropdown-item"><i class="fas fa-user"></i> My Profile</a>
                <a href="settings.html" class="dropdown-item"><i class="fas fa-cog"></i> Settings</a>
                <a href="#" id="logout-btn" class="dropdown-item"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;
            
            // Add logout event listener
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        }
        
        // Check if we're on the profile page
        if (document.querySelector('.profile-page')) {
            this.updateProfilePageContent();
        }
    }
    
    /**
     * Update the profile page with user data
     */
    updateProfilePageContent() {
        // Update username elements
        document.querySelectorAll('h1').forEach(header => {
            if (header.textContent.includes('FilmFanatic42')) {
                header.textContent = this.userData.username;
            }
        });
        
        // Update activity user references
        document.querySelectorAll('.activity-user').forEach(element => {
            if (element.textContent === 'You') {
                element.textContent = this.userData.username;
            }
        });
        
        // Update avatar images with user's avatar
        document.querySelectorAll('.profile-avatar img, .activity-avatar img').forEach(img => {
            if (this.userData.avatar) {
                img.src = this.userData.avatar;
                img.alt = `${this.userData.username}'s avatar`;
            }
        });
        
        // Update member since information
        document.querySelectorAll('.profile-info p').forEach(p => {
            if (p.textContent.includes('Member since')) {
                const joinDate = new Date(this.userData.joined_date);
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                p.textContent = `Member since ${monthNames[joinDate.getMonth()]} ${joinDate.getFullYear()}`;
            }
        });
        
        // Update statistics if available
        if (this.userData.stats) {
            const { reviews, lists, ratings, following, followers } = this.userData.stats;
            
            document.querySelectorAll('.stat-item').forEach(item => {
                const label = item.querySelector('.stat-label');
                const number = item.querySelector('.stat-number');
                
                if (label && number) {
                    if (label.textContent === 'Reviews' && reviews) {
                        number.textContent = reviews.toString();
                    } else if (label.textContent === 'Lists' && lists) {
                        number.textContent = lists.toString();
                    } else if (label.textContent === 'Ratings' && ratings) {
                        number.textContent = ratings.toString();
                    } else if (label.textContent === 'Following' && following) {
                        number.textContent = following.toString();
                    } else if (label.textContent === 'Followers' && followers) {
                        number.textContent = followers.toString();
                    }
                }
            });
        }
        
        // Update content sections if we have that data
        if (this.userData.activity) {
            this.updateActivitySection();
        }
        
        if (this.userData.manga_shelf) {
            this.updateMangaShelf();
        }
        
        if (this.userData.recommendations) {
            this.updateRecommendations();
        }
    }
    
    /**
     * Update the activity feed with user's actual activity
     */
    updateActivitySection() {
        const activityFeed = document.querySelector('.activity-feed');
        if (!activityFeed || !this.userData.activity || !this.userData.activity.length) {
            return;
        }
        
        // Clear existing activity
        activityFeed.innerHTML = '';
        
        // Add actual user activity
        this.userData.activity.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            
            activityItem.innerHTML = `
                <div class="activity-avatar">
                    <img src="${this.userData.avatar || '../images/Avatar.jpg'}" alt="${this.userData.username}'s avatar">
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="activity-user">${this.userData.username}</span>
                        <span class="activity-action">${activity.action}</span>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                    <div class="activity-body">
                        <a href="${activity.link || '#'}" class="activity-title">${activity.title}</a>
                        <p>${activity.description || ''}</p>
                    </div>
                    <div class="activity-footer">
                        <div class="activity-reactions">
                            <button><i class="fas fa-heart"></i> <span>${activity.likes || 0}</span></button>
                            <button><i class="fas fa-comment"></i> <span>${activity.comments || 0}</span></button>
                            <button><i class="fas fa-share"></i></button>
                        </div>
                    </div>
                </div>
            `;
            
            activityFeed.appendChild(activityItem);
        });
    }
    
    /**
     * Update manga shelf with user's actual manga collection
     */
    updateMangaShelf() {
        const mangaShelfGrid = document.querySelector('#manga-shelf .content-grid');
        if (!mangaShelfGrid || !this.userData.manga_shelf || !this.userData.manga_shelf.length) {
            return;
        }
        
        // Clear existing manga items
        mangaShelfGrid.innerHTML = '';
        
        // Add user's manga collection
        this.userData.manga_shelf.forEach(manga => {
            const progressPercent = manga.current_volume && manga.total_volumes ? 
                Math.round((manga.current_volume / manga.total_volumes) * 100) : 0;
                
            const mangaItem = document.createElement('div');
            mangaItem.className = 'manga-shelf-item';
            
            mangaItem.innerHTML = `
                <div class="manga-cover">
                    <img src="${manga.cover_image || '../images/placeholder.jpg'}" alt="${manga.title}">
                    <div class="manga-progress-badge">${manga.status === 'completed' ? 'Complete' : 'Vol. ' + manga.current_volume}</div>
                </div>
                <div class="manga-shelf-info">
                    <h3>${manga.title}</h3>
                    <div class="manga-author">by ${manga.author}</div>
                    <div class="progress-stats">
                        <span>${manga.current_volume}/${manga.total_volumes} volumes</span>
                        <span>${progressPercent}% complete</span>
                    </div>
                    <div class="manga-actions">
                        <button class="btn-sm">Read</button>
                        <button class="btn-sm btn-outline">Rate</button>
                    </div>
                </div>
            `;
            
            mangaShelfGrid.appendChild(mangaItem);
        });
    }
    
    /**
     * Update recommendations with user's personalized recommendations
     */
    updateRecommendations() {
        const recoGrid = document.querySelector('.reco-preview-grid');
        if (!recoGrid || !this.userData.recommendations || !this.userData.recommendations.items || !this.userData.recommendations.items.length) {
            return;
        }
        
        // Update recommendation stats if available
        if (this.userData.recommendations.stats) {
            const { accuracy, total, added_to_watchlist } = this.userData.recommendations.stats;
            
            document.querySelectorAll('.reco-stat-number').forEach(stat => {
                if (stat.textContent.includes('%')) {
                    stat.textContent = `${accuracy}%`;
                } else if (parseInt(stat.textContent) > 300) { // Assuming this is the total reco number
                    stat.textContent = total.toString();
                } else if (parseInt(stat.textContent) < 100) { // Assuming this is the watchlist number
                    stat.textContent = added_to_watchlist.toString();
                }
            });
        }
        
        // Clear existing recommendations
        recoGrid.innerHTML = '';
        
        // Add user's personalized recommendations
        this.userData.recommendations.items.slice(0, 3).forEach(reco => {
            const recoItem = document.createElement('div');
            recoItem.className = 'reco-preview-item';
            
            recoItem.innerHTML = `
                <img src="${reco.image || '../images/placeholder.jpg'}" alt="${reco.title}">
                <div class="reco-preview-content">
                    <span class="reco-match">${reco.match_percent}% Match</span>
                    <h4>${reco.title}</h4>
                    <span class="reco-type">${reco.type} • ${reco.genre}</span>
                    <a href="recommendations.html?id=${reco.id}" class="reco-action">View Details</a>
                </div>
            `;
            
            recoGrid.appendChild(recoItem);
        });
        
        // Update preference tags if available
        if (this.userData.recommendations.preferences) {
            const preferencesContainer = document.querySelector('.reco-preferences-tags');
            if (preferencesContainer) {
                preferencesContainer.innerHTML = '';
                
                this.userData.recommendations.preferences.forEach(pref => {
                    const prefTag = document.createElement('span');
                    prefTag.className = 'reco-preference';
                    prefTag.textContent = pref;
                    preferencesContainer.appendChild(prefTag);
                });
            }
        }
    }

    /**
     * Update the UI to show logged out state
     */
    updateUIForLoggedOutState() {
        if (this.authDropdown) {
            this.authDropdown.innerHTML = `
                <a href="signin.html" class="dropdown-item"><i class="fas fa-sign-in-alt"></i> Sign In</a>
                <a href="signup.html" class="dropdown-item"><i class="fas fa-user-plus"></i> Sign Up</a>
            `;
        }
        
        // If on profile page, redirect to login
        if (document.querySelector('.profile-page') && !this.isLoading) {
            window.location.href = 'signin.html?redirect=profile';
        }
    }

    /**
     * Log out the current user
     */
    async logout() {
        try {
            const response = await fetch('../api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ action: 'logout' })
            });
            
            localStorage.removeItem('authToken');
            this.token = null;
            this.userData = null;
            
            // Redirect to home page after successful logout
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
    
    /**
     * Format a date to a time ago string (e.g., "2 hours ago")
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval > 1) {
            return interval + " years ago";
        }
        if (interval === 1) {
            return "1 year ago";
        }
        
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) {
            return interval + " months ago";
        }
        if (interval === 1) {
            return "1 month ago";
        }
        
        interval = Math.floor(seconds / 86400);
        if (interval > 1) {
            return interval + " days ago";
        }
        if (interval === 1) {
            return "1 day ago";
        }
        
        interval = Math.floor(seconds / 3600);
        if (interval > 1) {
            return interval + " hours ago";
        }
        if (interval === 1) {
            return "1 hour ago";
        }
        
        interval = Math.floor(seconds / 60);
        if (interval > 1) {
            return interval + " minutes ago";
        }
        if (interval === 1) {
            return "1 minute ago";
        }
        
        return Math.floor(seconds) + " seconds ago";
    }
}

// Initialize the user profile handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const userProfile = new UserProfile();
    userProfile.init();
});