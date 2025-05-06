/**
 * Entertainment Hub - Ratings System
 * This file handles all rating functionality across the site
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the ratings system
    initRatings();
    
    // Handle form submissions
    setupFormHandlers();
    
    // Setup interactive elements
    setupInteractiveElements();
});

/**
 * Initialize the ratings system
 */
function initRatings() {
    // Get all rating components
    const ratingComponents = document.querySelectorAll('.rating-component');
    
    ratingComponents.forEach(component => {
        const stars = component.querySelectorAll('.rating-star');
        const ratingInput = component.querySelector('.rating-value');
        const ratingDisplay = component.querySelector('.rating-display');
        
        // Set up star rating interaction
        stars.forEach((star, index) => {
            // Hover effect
            star.addEventListener('mouseenter', () => {
                // Highlight current star and all previous stars
                for (let i = 0; i <= index; i++) {
                    stars[i].classList.add('hover');
                }
            });
            
            star.addEventListener('mouseleave', () => {
                // Remove hover effect
                stars.forEach(s => s.classList.remove('hover'));
            });
            
            // Click to rate
            star.addEventListener('click', () => {
                const ratingValue = index + 1;
                
                // Update the input value
                if (ratingInput) {
                    ratingInput.value = ratingValue;
                }
                
                // Update the display
                if (ratingDisplay) {
                    ratingDisplay.textContent = ratingValue.toFixed(1);
                }
                
                // Update star appearance
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('active');
                        s.classList.remove('inactive');
                    } else {
                        s.classList.remove('active');
                        s.classList.add('inactive');
                    }
                });
                
                // Trigger custom event for rating change
                const event = new CustomEvent('rating:change', {
                    detail: {
                        element: component,
                        value: ratingValue,
                        itemId: component.dataset.itemId,
                        itemType: component.dataset.itemType
                    }
                });
                
                document.dispatchEvent(event);
                
                // Show the submit button if it was hidden
                const submitBtn = component.querySelector('.rating-submit');
                if (submitBtn) {
                    submitBtn.classList.remove('hidden');
                }
            });
        });
    });
    
    // Listen for rating change events
    document.addEventListener('rating:change', function(e) {
        console.log(`Rating changed: ${e.detail.itemType} #${e.detail.itemId} rated ${e.detail.value}`);
        
        // If we're on the detailed rating page, update the criteria bars
        updateCriteriaBars(e.detail.value);
    });
}

/**
 * Update the criteria bars based on the overall rating
 * @param {number} overallRating - The overall rating value
 */
function updateCriteriaBars(overallRating) {
    const criteriaBars = document.querySelectorAll('.criteria-item:not(.overall) .criteria-fill');
    
    if (criteriaBars.length === 0) return;
    
    // Generate slightly varied ratings for each criteria based on overall
    criteriaBars.forEach(bar => {
        // Random variation between -0.5 and +0.5
        const variation = (Math.random() - 0.5);
        let criteriaRating = overallRating + variation;
        
        // Ensure rating is between 1 and 10
        criteriaRating = Math.max(1, Math.min(10, criteriaRating));
        
        // Update the width of the bar
        bar.style.width = `${criteriaRating * 10}%`;
        
        // Update the score text if it exists
        const scoreElement = bar.closest('.criteria-item').querySelector('.criteria-score');
        if (scoreElement) {
            scoreElement.textContent = criteriaRating.toFixed(1);
        }
    });
    
    // Update overall bar
    const overallBar = document.querySelector('.criteria-item.overall .criteria-fill');
    if (overallBar) {
        overallBar.style.width = `${overallRating * 10}%`;
        
        const overallScore = document.querySelector('.criteria-item.overall .criteria-score');
        if (overallScore) {
            overallScore.textContent = overallRating.toFixed(1);
        }
    }
}

/**
 * Set up form handlers for rating submissions
 */
function setupFormHandlers() {
    const ratingForms = document.querySelectorAll('.rating-form');
    
    ratingForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const itemId = form.dataset.itemId;
            const itemType = form.dataset.itemType;
            const rating = formData.get('rating');
            const review = formData.get('review');
            
            // Validate the form
            if (!rating) {
                showToast('Please select a rating before submitting', 'error');
                return;
            }
            
            // In a real app, this would be an API call
            console.log(`Submitting rating: ${itemType} #${itemId} rated ${rating}`);
            console.log(`Review: ${review}`);
            
            // Simulate API call
            setTimeout(() => {
                // Show success message
                showToast('Your rating has been submitted successfully!', 'success');
                
                // Reset form or redirect
                if (form.dataset.resetOnSubmit === 'true') {
                    form.reset();
                    
                    // Reset stars
                    const stars = form.querySelectorAll('.rating-star');
                    stars.forEach(star => {
                        star.classList.remove('active', 'inactive', 'hover');
                    });
                    
                    // Hide submit button if needed
                    const submitBtn = form.querySelector('.rating-submit');
                    if (submitBtn && submitBtn.dataset.hideAfterSubmit === 'true') {
                        submitBtn.classList.add('hidden');
                    }
                } else if (form.dataset.redirectAfterSubmit) {
                    window.location.href = form.dataset.redirectAfterSubmit;
                }
                
                // Update UI to show the new rating
                updateRatingUI(itemId, itemType, rating);
            }, 1000);
        });
    });
}

/**
 * Update the UI to reflect a new rating
 * @param {string} itemId - The ID of the rated item
 * @param {string} itemType - The type of the rated item
 * @param {number} rating - The rating value
 */
function updateRatingUI(itemId, itemType, rating) {
    // Find all elements displaying this item's rating
    const ratingDisplays = document.querySelectorAll(`.rating-display[data-item-id="${itemId}"][data-item-type="${itemType}"]`);
    
    ratingDisplays.forEach(display => {
        display.textContent = parseFloat(rating).toFixed(1);
    });
    
    // Update rating bars if they exist
    const ratingBars = document.querySelectorAll(`.rating-bar[data-item-id="${itemId}"][data-item-type="${itemType}"] .rating-fill`);
    
    ratingBars.forEach(bar => {
        bar.style.width = `${rating * 10}%`;
    });
    
    // Update rating meters
    const ratingMeters = document.querySelectorAll(`meter.rating-meter[data-item-id="${itemId}"][data-item-type="${itemType}"]`);
    
    ratingMeters.forEach(meter => {
        meter.value = rating;
    });
    
    // If we're on a details page, update the rating breakdown
    updateRatingBreakdown(itemId, itemType, rating);
}

/**
 * Update the rating breakdown on details pages
 * @param {string} itemId - The ID of the rated item
 * @param {string} itemType - The type of the rated item
 * @param {number} rating - The rating value
 */
function updateRatingBreakdown(itemId, itemType, rating) {
    const breakdownSection = document.querySelector(`.rating-breakdown[data-item-id="${itemId}"][data-item-type="${itemType}"]`);
    
    if (!breakdownSection) return;
    
    // Update the average score
    const averageScore = breakdownSection.querySelector('.average-score .big-score');
    if (averageScore) {
        // Calculate new average (in a real app, this would come from the API)
        // For demo, we'll just slightly adjust the current value
        const currentAvg = parseFloat(averageScore.textContent);
        let newAvg = ((currentAvg * 100) + parseFloat(rating)) / 101; // Assuming 100 previous ratings
        averageScore.textContent = newAvg.toFixed(1);
    }
    
    // Update star display
    const starDisplay = breakdownSection.querySelector('.star-display');
    if (starDisplay) {
        // This would be more complex in a real app
        // For demo, we'll just ensure the stars match the rating
        let newAvg;
        if (averageScore) {
            const currentAvg = parseFloat(averageScore.textContent);
            newAvg = ((currentAvg * 100) + parseFloat(rating)) / 101;
        }
        updateStarDisplay(starDisplay, newAvg);
    }
    
    // Update review count
    const reviewCount = breakdownSection.querySelector('.review-count');
    if (reviewCount) {
        const match = reviewCount.textContent.match(/Based on (\d+) reviews/);
        if (match) {
            const count = parseInt(match[1]) + 1;
            reviewCount.textContent = `Based on ${count} reviews`;
        }
    }
}

/**
 * Update a star display to match a rating
 * @param {HTMLElement} starDisplay - The star display element
 * @param {number} rating - The rating value
 */
function updateStarDisplay(starDisplay, rating) {
    // Clear existing stars
    starDisplay.innerHTML = '';
    
    // Add full stars
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star';
        starDisplay.appendChild(star);
    }
    
    // Add half star if needed
    const remainder = rating - fullStars;
    if (remainder >= 0.25 && remainder < 0.75) {
        const halfStar = document.createElement('i');
        halfStar.className = 'fas fa-star-half-alt';
        starDisplay.appendChild(halfStar);
    } else if (remainder >= 0.75) {
        const star = document.createElement('i');
        star.className = 'fas fa-star';
        starDisplay.appendChild(star);
    }
    
    // Add empty stars to make 5 total
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        const emptyStar = document.createElement('i');
        emptyStar.className = 'far fa-star';
        starDisplay.appendChild(emptyStar);
    }
}

/**
 * Set up interactive elements on the ratings page
 */
function setupInteractiveElements() {
    // Criteria sliders
    const criteriaSliders = document.querySelectorAll('.criteria-slider');
    
    criteriaSliders.forEach(slider => {
        slider.addEventListener('input', function() {
            // Update the display value
            const display = slider.parentElement.querySelector('.criteria-value');
            if (display) {
                display.textContent = slider.value;
            }
            
            // Update the criteria bar if it exists
            const criteriaName = slider.dataset.criteria;
            const criteriaBar = document.querySelector(`.criteria-item[data-criteria="${criteriaName}"] .criteria-fill`);
            
            if (criteriaBar) {
                criteriaBar.style.width = `${slider.value * 10}%`;
            }
            
            // Update overall rating based on all criteria
            updateOverallRating();
        });
    });
    
    // Rating filters
    const ratingFilters = document.querySelectorAll('.rating-filter');
    
    ratingFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            const minRating = filter.value;
            
            // Find all rating items
            const ratingItems = document.querySelectorAll('.rating-item');
            
            ratingItems.forEach(item => {
                const itemRating = parseFloat(item.dataset.rating);
                
                if (minRating === 'all' || itemRating >= parseFloat(minRating)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
    
    // Sort options
    const sortOptions = document.querySelectorAll('.sort-option');
    
    sortOptions.forEach(option => {
        option.addEventListener('change', function() {
            const sortBy = option.value;
            const container = document.querySelector('.rating-items-container');
            
            if (!container) return;
            
            const items = Array.from(container.querySelectorAll('.rating-item'));
            
            // Sort the items
            items.sort((a, b) => {
                if (sortBy === 'highest') {
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                } else if (sortBy === 'lowest') {
                    return parseFloat(a.dataset.rating) - parseFloat(b.dataset.rating);
                } else if (sortBy === 'newest') {
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                } else if (sortBy === 'oldest') {
                    return new Date(a.dataset.date) - new Date(b.dataset.date);
                }
                return 0;
            });
            
            // Re-append the items in the new order
            items.forEach(item => {
                container.appendChild(item);
            });
        });
    });
    
    // Rating tabs
    const ratingTabs = document.querySelectorAll('.rating-tab');
    
    ratingTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            ratingTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const targetId = tab.dataset.target;
            const tabContents = document.querySelectorAll('.rating-tab-content');
            
            tabContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

/**
 * Update the overall rating based on all criteria
 */
function updateOverallRating() {
    const criteriaSliders = document.querySelectorAll('.criteria-slider');
    let totalRating = 0;
    let count = 0;
    
    criteriaSliders.forEach(slider => {
        totalRating += parseFloat(slider.value);
        count++;
    });
    
    if (count === 0) return;
    
    const overallRating = totalRating / count;
    
    // Update overall display
    const overallDisplay = document.querySelector('.overall-rating-value');
    if (overallDisplay) {
        overallDisplay.textContent = overallRating.toFixed(1);
    }
    
    // Update overall bar
    const overallBar = document.querySelector('.criteria-item.overall .criteria-fill');
    if (overallBar) {
        overallBar.style.width = `${overallRating * 10}%`;
    }
    
    // Update overall input
    const overallInput = document.querySelector('input[name="overall_rating"]');
    if (overallInput) {
        overallInput.value = overallRating.toFixed(1);
    }
    
    // Update star display
    const starDisplay = document.querySelector('.rating-stars');
    if (starDisplay) {
        updateStarDisplay(starDisplay, overallRating);
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add visible class after a small delay (for animation)
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            toast.remove();
        }, 300); // Match transition duration
    }, 3000);
}
