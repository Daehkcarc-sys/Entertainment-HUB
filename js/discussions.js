/**
 * Entertainment Hub - Discussions System
 * This file handles all discussion functionality across the site
 */

// Mock functions to prevent errors. In a real application, these would be defined elsewhere.
function setupFormHandlers() {
    console.warn("setupFormHandlers() is a placeholder. Implement the actual form handling logic.");
}

function setupInteractiveElements() {
    console.warn("setupInteractiveElements() is a placeholder. Implement the actual interactive elements setup logic.");
}

function showToast(message, type) {
    console.warn(`showToast() is a placeholder. Message: ${message}, Type: ${type}`);
    alert(message); // Simple alert as a placeholder
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the discussions system
    initDiscussions();
    
    // Handle form submissions
    setupFormHandlers();
    
    // Setup interactive elements
    setupInteractiveElements();
});

/**
 * Initialize the discussions system
 */
function initDiscussions() {
    // Set up comment reply functionality
    setupReplyFunctionality();
    
    // Set up voting functionality
    setupVotingFunctionality();
    
    // Set up sorting functionality
    setupSortingFunctionality();
    
    // Set up filtering functionality
    setupFilteringFunctionality();
}

/**
 * Set up reply functionality for comments
 */
function setupReplyFunctionality() {
    // Get all reply buttons
    const replyButtons = document.querySelectorAll('.reply-btn');
    
    replyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = button.closest('.comment').dataset.commentId;
            const replyForm = document.querySelector(`.reply-form[data-parent-id="${commentId}"]`);
            
            // If the form doesn't exist, create it
            if (!replyForm) {
                createReplyForm(button, commentId);
            } else {
                // Toggle the form visibility
                replyForm.classList.toggle('hidden');
                
                // Focus the textarea if visible
                if (!replyForm.classList.contains('hidden')) {
                    replyForm.querySelector('textarea').focus();
                }
            }
        });
    });
}

/**
 * Create a reply form for a comment
 * @param {HTMLElement} button - The reply button
 * @param {string} commentId - The ID of the parent comment
 */
function createReplyForm(button, commentId) {
    const comment = button.closest('.comment');
    const commentBody = comment.querySelector('.comment-body');
    
    // Create the form
    const form = document.createElement('form');
    form.className = 'reply-form';
    form.dataset.parentId = commentId;
    
    // Create the textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'reply-textarea';
    textarea.placeholder = 'Write your reply...';
    textarea.required = true;
    
    // Create the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'reply-buttons';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'cancel-reply-btn';
    cancelButton.textContent = 'Cancel';
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'submit-reply-btn';
    submitButton.textContent = 'Post Reply';
    
    // Assemble the form
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(submitButton);
    form.appendChild(textarea);
    form.appendChild(buttonContainer);
    
    // Insert after the comment body
    commentBody.insertAdjacentElement('afterend', form);
    
    // Focus the textarea
    textarea.focus();
    
    // Set up event listeners
    cancelButton.addEventListener('click', function() {
        form.classList.add('hidden');
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const replyText = textarea.value.trim();
        
        if (!replyText) {
            showToast('Please enter a reply', 'error');
            return;
        }
        
        // In a real app, this would be an API call
        console.log(`Submitting reply to comment #${commentId}: ${replyText}`);
        
        // Simulate API call
        setTimeout(() => {
            // Create the new reply
            createReplyElement(comment, replyText);
            
            // Clear and hide the form
            textarea.value = '';
            form.classList.add('hidden');
            
            // Show success message
            showToast('Your reply has been posted!', 'success');
        }, 1000);
    });
}

/**
 * Create a new reply element
 * @param {HTMLElement} parentComment - The parent comment
 * @param {string} replyText - The text of the reply
 */
function createReplyElement(parentComment, replyText) {
    // Get or create the replies container
    let repliesContainer = parentComment.querySelector('.comment-replies');
    
    if (!repliesContainer) {
        repliesContainer = document.createElement('div');
        repliesContainer.className = 'comment-replies';
        parentComment.appendChild(repliesContainer);
    }
    
    // Create the reply element
    const reply = document.createElement('div');
    reply.className = 'comment reply';
    reply.dataset.commentId = `reply-${Date.now()}`; // Generate a unique ID
    
    // Create the reply header
    const header = document.createElement('div');
    header.className = 'comment-header';
    
    const author = document.createElement('span');
    author.className = 'comment-author';
    author.textContent = 'You'; // In a real app, this would be the user's name
    
    const time = document.createElement('span');
    time.className = 'comment-time';
    time.textContent = 'Just now';
    
    header.appendChild(author);
    header.appendChild(time);
    
    // Create the reply body
    const body = document.createElement('div');
    body.className = 'comment-body';
    
    const text = document.createElement('p');
    text.textContent = replyText;
    
    body.appendChild(text);
    
    // Create the reply actions
    const actions = document.createElement('div');
    actions.className = 'comment-actions';
    
    const likeButton = document.createElement('button');
    likeButton.className = 'action-btn like-btn';
    likeButton.innerHTML = '<i class="far fa-thumbs-up"></i> Like (0)';
    
    const replyButton = document.createElement('button');
    replyButton.className = 'action-btn reply-btn';
    replyButton.innerHTML = '<i class="far fa-comment"></i> Reply';
    
    const reportButton = document.createElement('button');
    reportButton.className = 'action-btn report-btn';
    reportButton.innerHTML = '<i class="far fa-flag"></i> Report';
    
    actions.appendChild(likeButton);
    actions.appendChild(replyButton);
    actions.appendChild(reportButton);
    
    // Assemble the reply
    reply.appendChild(header);
    reply.appendChild(body);
    reply.appendChild(actions);
    
    // Add to the replies container
    repliesContainer.appendChild(reply);
    
    // Set up event listeners for the new reply
    likeButton.addEventListener('click', function() {
        handleLike(likeButton);
    });
    
    replyButton.addEventListener('click', function() {
        const commentId = reply.dataset.commentId;
        const replyForm = document.querySelector(`.reply-form[data-parent-id="${commentId}"]`);
        
        if (!replyForm) {
            createReplyForm(replyButton, commentId);
        } else {
            replyForm.classList.toggle('hidden');
            
            if (!replyForm.classList.contains('hidden')) {
                replyForm.querySelector('textarea').focus();
            }
        }
    });
}

/**
 * Set up voting functionality for comments
 */
function setupVotingFunctionality() {
    // Get all like buttons
    const likeButtons = document.querySelectorAll('.like-btn');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleLike(button);
        });
    });
    
    // Get all dislike buttons
    const dislikeButtons = document.querySelectorAll('.dislike-btn');
    
    dislikeButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleDislike(button);
        });
    });
}

/**
 * Handle like button click
 * @param {HTMLElement} button - The like button
 */
function handleLike(button) {
    // Check if already liked
    const isLiked = button.classList.contains('liked');
    
    // Get the comment
    const comment = button.closest('.comment');
    
    // Get the dislike button if it exists
    const dislikeButton = comment.querySelector('.dislike-btn');
    
    // In a real app, this would be an API call
    console.log(`${isLiked ? 'Unliking' : 'Liking'} comment #${comment.dataset.commentId}`);
    
    // Toggle liked state
    button.classList.toggle('liked');
    
    // Update the icon and count
    const countText = button.textContent.match(/Like $$(\d+)$$/);
    let count = countText ? parseInt(countText[1]) : 0;
    
    if (isLiked) {
        // Unliking
        count--;
        button.innerHTML = `<i class="far fa-thumbs-up"></i> Like (${count})`;
    } else {
        // Liking
        count++;
        button.innerHTML = `<i class="fas fa-thumbs-up"></i> Like (${count})`;
        
        // If disliked, remove dislike
        if (dislikeButton && dislikeButton.classList.contains('disliked')) {
            handleDislike(dislikeButton);
        }
    }
}

/**
 * Handle dislike button click
 * @param {HTMLElement} button - The dislike button
 */
function handleDislike(button) {
    // Check if already disliked
    const isDisliked = button.classList.contains('disliked');
    
    // Get the comment
    const comment = button.closest('.comment');
    
    // Get the like button if it exists
    const likeButton = comment.querySelector('.like-btn');
    
    // In a real app, this would be an API call
    console.log(`${isDisliked ? 'Undisliking' : 'Disliking'} comment #${comment.dataset.commentId}`);
    
    // Toggle disliked state
    button.classList.toggle('disliked');
    
    // Update the icon and count
    const countText = button.textContent.match(/Dislike $$(\d+)$$/);
    let count = countText ? parseInt(countText[1]) : 0;
    
    if (isDisliked) {
        // Undisliking
        count--;
        button.innerHTML = `<i class="far fa-thumbs-down"></i> Dislike (${count})`;
    } else {
        // Disliking
        count++;
        button.innerHTML = `<i class="fas fa-thumbs-down"></i> Dislike (${count})`;
        
        // If liked, remove like
        if (likeButton && likeButton.classList.contains('liked')) {
            handleLike(likeButton);
        }
    }
}

/**
 * Set up sorting functionality for comments
 */
function setupSortingFunctionality() {
    // Get all sort options
    const sortOptions = document.querySelectorAll('.comment-sort select');
    
    sortOptions.forEach(select => {
        select.addEventListener('change', function() {
            const sortBy = select.value;
            const commentsContainer = document.querySelector('.comment-list');
            
            if (!commentsContainer) return;
            
            const comments = Array.from(commentsContainer.querySelectorAll('.comment:not(.reply)'));
            
            // Sort the comments
            comments.sort((a, b) => {
                if (sortBy === 'newest') {
                    // In a real app, this would use actual timestamps
                    // For demo, we'll use the data attribute
                    return b.dataset.timestamp - a.dataset.timestamp;
                } else if (sortBy === 'oldest') {
                    return a.dataset.timestamp - b.dataset.timestamp;
                } else if (sortBy === 'most-liked') {
                    const aLikes = parseInt(a.querySelector('.like-btn').textContent.match(/$$(\d+)$$/)[1]);
                    const bLikes = parseInt(b.querySelector('.like-btn').textContent.match(/$$(\d+)$$/)[1]);
                    return bLikes - aLikes;
                }
                return 0;
            });
            
            // Re-append the comments in the new order
            comments.forEach(comment => {
                commentsContainer.appendChild(comment);
            });
        });
    });
}

/**
 * Set up filtering functionality for discussions
 */
function setupFilteringFunctionality() {
    // Get all filter options
    const filterOptions = document.querySelectorAll('.discussion-filter select, .discussion-filter input');
    
    filterOptions.forEach(filter => {
        filter.addEventListener('change', function() {
            applyFilters();
        });
    });
}

/**
 * Apply filters to discussions
 */
function applyFilters() {
    const categoryFilter = document.querySelector('.filter-category');
    const tagFilter = document.querySelector('.filter-tag');
    const dateFilter = document.querySelector('.filter-date');
    const searchFilter = document.querySelector('.filter-search');
    
    // Get filter values
    const category = categoryFilter ? categoryFilter.value : 'all';
    const tag = tagFilter ? tagFilter.value : 'all';
    const date = dateFilter ? dateFilter.value : 'all';
    const search = searchFilter ? searchFilter.value.toLowerCase() : '';
    
    // Get all discussion items
    const discussions = document.querySelectorAll('.discussion-item');
    
    discussions.forEach(discussion => {
        // Check category
        const discussionCategory = discussion.dataset.category;
        const categoryMatch = category === 'all' || discussionCategory === category;
        
        // Check tags
        const discussionTags = discussion.dataset.tags ? discussion.dataset.tags.split(',') : [];
        const tagMatch = tag === 'all' || discussionTags.includes(tag);
        
        // Check date
        const discussionDate = discussion.dataset.date;
        let dateMatch = true;
        if (date !== 'all') {
            // Implement date matching logic here based on your date format
            // This is a placeholder
            dateMatch = discussionDate === date;
        }
        
        // Check search
        const discussionTitle = discussion.querySelector('.discussion-title').textContent.toLowerCase();
        const searchMatch = discussionTitle.includes(search);
        
        // Show/hide discussion based on filters
        if (categoryMatch && tagMatch && dateMatch && searchMatch) {
            discussion.classList.remove('hidden');
        } else {
            discussion.classList.add('hidden');
        }
    });
}
