document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const ratingsTableBody = document.getElementById('ratingsTableBody');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const sortFilter = document.getElementById('sortFilter');
    const tabs = document.querySelectorAll('.tab');
    const ratingModal = document.getElementById('ratingModal');
    const ratingForm = document.getElementById('ratingForm');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    const openAddRatingBtn = document.getElementById('openAddRatingBtn');
    const closeModal = document.getElementById('closeModal');
    const starPicker = document.getElementById('starPicker');
    const stars = starPicker.querySelectorAll('i.fa-star');
    
    // State variables
    let currentFilter = 'all';
    let ratings = getSampleRatings(); // Will be replaced with API/localStorage in a real app
    let currentEditId = null;
    let selectedRating = 0;

    // Initialize the page
    renderRatings();
    setupEventListeners();

    // Set up all event listeners
    function setupEventListeners() {
        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.tab;
                renderRatings();
            });
        });

        // Filtering and sorting
        searchInput.addEventListener('input', renderRatings);
        sortFilter.addEventListener('change', renderRatings);

        // Modal events
        openAddRatingBtn.addEventListener('click', openAddRatingModal);
        closeModal.addEventListener('click', closeRatingModal);
        ratingForm.addEventListener('submit', handleRatingSubmit);

        // Star rating picker
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                selectedRating = value;
                updateStarDisplay(value);
                document.getElementById('ratingValue').value = value;
            });

            star.addEventListener('mouseover', () => {
                const value = parseInt(star.dataset.value);
                stars.forEach((s, i) => {
                    if (i < value) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });

            starPicker.addEventListener('mouseleave', () => {
                updateStarDisplay(selectedRating);
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === ratingModal) {
                closeRatingModal();
            }
        });
    }

    // Render ratings based on current filters
    function renderRatings() {
        // Remove skeleton rows
        document.querySelectorAll('.skeleton-row').forEach(row => row.remove());

        // Filter by selected tab
        let filtered = ratings;
        if (currentFilter !== 'all') {
            filtered = filtered.filter(rating => 
                rating.type.toLowerCase() === currentFilter);
        }

        // Filter by search input
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(rating => 
                rating.title.toLowerCase().includes(searchTerm));
        }

        // Sort by selected option
        const sortOption = sortFilter.value;
        switch (sortOption) {
            case 'recent':
                filtered.sort((a, b) => new Date(b.dateRated) - new Date(a.dateRated));
                break;
            case 'highest':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                filtered.sort((a, b) => a.rating - b.rating);
                break;
            case 'alpha':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        // Check if we have any ratings to display
        if (filtered.length === 0) {
            ratingsTableBody.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            ratingsTableBody.innerHTML = filtered.map(rating => `
                <tr>
                    <td><a href="#" class="title-link">${rating.title}</a></td>
                    <td>${rating.type}</td>
                    <td>
                        <div class="star-rating">
                            ${generateStars(rating.rating)}
                        </div>
                    </td>
                    <td>${formatDate(rating.dateRated)}</td>
                    <td class="ratings-actions">
                        <button onclick="editRating('${rating.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteRating('${rating.id}')" style="background:#ff6b6b;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Open the add rating modal
    function openAddRatingModal() {
        resetModal();
        modalTitle.textContent = 'Add New Rating';
        submitBtnText.textContent = 'Save Rating';
        ratingModal.style.display = 'flex';
    }

    // Open the edit rating modal
    window.editRating = function(id) {
        resetModal();
        const rating = ratings.find(r => r.id === id);
        if (rating) {
            currentEditId = id;
            modalTitle.textContent = 'Edit Rating';
            submitBtnText.textContent = 'Update Rating';

            // Fill form with existing values
            document.getElementById('titleInput').value = rating.title;
            document.getElementById('typeSelect').value = rating.type;
            document.getElementById('reviewText').value = rating.review || '';
            document.getElementById('ratingValue').value = rating.rating;
            
            selectedRating = rating.rating;
            updateStarDisplay(rating.rating);
            
            ratingModal.style.display = 'flex';
        }
    };

    // Delete a rating
    window.deleteRating = function(id) {
        if (confirm('Are you sure you want to delete this rating?')) {
            ratings = ratings.filter(r => r.id !== id);
            renderRatings();
            // In a real app: saveRatingsToStorage or call API
        }
    };

    // Close the rating modal
    function closeRatingModal() {
        ratingModal.style.display = 'none';
        resetModal();
    }

    // Reset modal form
    function resetModal() {
        ratingForm.reset();
        currentEditId = null;
        selectedRating = 0;
        document.getElementById('ratingValue').value = '';
        updateStarDisplay(0);
    }

    // Handle form submission
    function handleRatingSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('titleInput').value;
        const type = document.getElementById('typeSelect').value;
        const rating = parseInt(document.getElementById('ratingValue').value);
        const review = document.getElementById('reviewText').value;
        
        if (!title || !type || !rating) {
            alert('Please fill all required fields');
            return;
        }
        
        if (currentEditId) {
            // Update existing rating
            const index = ratings.findIndex(r => r.id === currentEditId);
            if (index !== -1) {
                ratings[index] = {
                    ...ratings[index],
                    title,
                    type,
                    rating,
                    review,
                    dateRated: new Date().toISOString() // Update date
                };
            }
        } else {
            // Add new rating
            const newRating = {
                id: generateUniqueId(),
                title,
                type,
                rating,
                review,
                dateRated: new Date().toISOString()
            };
            ratings.unshift(newRating); // Add to beginning
        }
        
        // Close modal and update UI
        closeRatingModal();
        renderRatings();
        
        // In a real app: saveRatingsToStorage or call API
    }

    // Helper function to update star display
    function updateStarDisplay(value) {
        stars.forEach((star, i) => {
            star.classList.toggle('active', i < value);
        });
    }

    // Helper function to generate star HTML
    function generateStars(rating) {
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2 === 1;
        let starsHTML = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        // Half star if needed
        if (halfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Display the numeric value
        starsHTML += ` <span style="color:#666;font-size:0.9rem">(${rating}/10)</span>`;
        
        return starsHTML;
    }

    // Helper function to format dates
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Generate a unique ID for new ratings
    function generateUniqueId() {
        return 'rating_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Sample ratings data (for demo purposes)
    function getSampleRatings() {
        return [
            {
                id: 'rating_1',
                title: 'The Dark Knight',
                type: 'Movie',
                rating: 10,
                dateRated: '2025-04-15T14:22:00Z',
                review: 'A masterpiece of modern cinema.'
            },
            {
                id: 'rating_2',
                title: 'Attack on Titan',
                type: 'Anime',
                rating: 9,
                dateRated: '2025-04-20T18:15:00Z',
                review: 'Incredible story and animation.'
            },
            {
                id: 'rating_3',
                title: 'Berserk',
                type: 'Manga',
                rating: 10,
                dateRated: '2025-04-05T09:40:00Z',
                review: 'Dark masterpiece with stunning artwork.'
            },
            {
                id: 'rating_4',
                title: 'Breaking Bad',
                type: 'Series',
                rating: 10,
                dateRated: '2025-03-22T20:10:00Z',
                review: 'One of the best TV series ever made.'
            },
            {
                id: 'rating_5',
                title: 'The Last of Us',
                type: 'Game',
                rating: 9,
                dateRated: '2025-03-15T12:30:00Z',
                review: 'Emotionally powerful storytelling.'
            },
            {
                id: 'rating_6',
                title: 'Pulp Fiction',
                type: 'Movie',
                rating: 9,
                dateRated: '2025-02-28T14:45:00Z',
                review: 'Tarantino at his best.'
            },
            {
                id: 'rating_7',
                title: 'Demon Slayer',
                type: 'Anime',
                rating: 8,
                dateRated: '2025-02-10T19:20:00Z',
                review: 'Amazing animation and likeable characters.'
            },
        ];
    }
});