/**
 * Interactive Quiz System
 * 
 * Provides functionality for interactive quizzes across all pages.
 * Supports multiple choice questions, scoring, and feedback.
 * Connects to the server-side quiz API.
 */

document.addEventListener('DOMContentLoaded', function() {
    initQuizSystem();
    initGlobalInteractiveElements();
});

/**
 * Initialize the quiz system
 */
function initQuizSystem() {
    // Find all quiz triggers and attach event listeners
    const quizTriggers = document.querySelectorAll('.quiz-trigger');
    quizTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const quizId = this.dataset.quizId;
            const quizType = this.closest('.quiz-container')?.dataset.quizType || 'general';
            
            // Add a visual feedback on click
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 1000);
            
            loadQuizById(quizId, quizType);
        });
    });
    
    // Add global event listener for quiz-related events with improved interactions
    document.addEventListener('click', function(event) {
        // Close quiz modal if clicking outside
        if (event.target.classList.contains('quiz-modal')) {
            closeQuizModal();
        }
        
        // Close button for modal
        if (event.target.closest('.close-modal')) {
            closeQuizModal();
        }
        
        // Submit quiz with visual feedback
        if (event.target.classList.contains('submit-quiz')) {
            const submitBtn = event.target;
            const quizContainer = submitBtn.closest('.quiz-container');
            
            // Add loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
            
            // Short timeout to show the loading state
            setTimeout(() => {
                if (quizContainer) {
                    scoreQuiz(quizContainer);
                }
                // Reset button text after scoring
                submitBtn.innerHTML = 'Submit Answers';
                submitBtn.disabled = false;
            }, 800);
        }
        
        // Retry quiz with animation
        if (event.target.classList.contains('retry-quiz')) {
            const quizContainer = event.target.closest('.quiz-container');
            if (quizContainer) {
                // Add animation class to container
                quizContainer.classList.add('fade-in');
                
                resetQuiz(quizContainer);
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    quizContainer.classList.remove('fade-in');
                }, 500);
            }
        }
    });

    // Initialize related content recommendations where available
    initRelatedContent();
    
    // Add keyboard navigation support for quizzes
    document.addEventListener('keydown', function(event) {
        const quizModal = document.querySelector('.quiz-modal.active');
        
        if (quizModal) {
            // ESC key closes the modal
            if (event.key === 'Escape') {
                closeQuizModal();
            }
            
            // Enter key submits the quiz if focused on submit button
            if (event.key === 'Enter' && document.activeElement.classList.contains('submit-quiz')) {
                document.activeElement.click();
            }
        }
    });
}

/**
 * Initialize global interactive elements
 */
function initGlobalInteractiveElements() {
    // Back to top button
    addBackToTopButton();
    
    // Add tooltips to interactive elements
    addTooltips();
    
    // Add hover effects to cards
    addCardHoverEffects();
    
    // Add image zoom effects
    addImageZoomEffects();
    
    // Add tab functionality
    initTabs();
    
    // Initialize accordions
    initAccordions();
    
    // Enhance dropdowns
    enhanceDropdowns();
    
    // Initialize modals
    initModals();
    
    // Add skeleton loading to lazy-loaded content
    addSkeletonLoading();
    
    // Add scroll animations
    addScrollAnimations();
}

/**
 * Load quiz data from API and display the quiz modal
 * @param {string} quizId - The ID of the quiz to load
 * @param {string} quizType - The type of quiz (movies, series, anime, etc.)
 */
function loadQuizById(quizId, quizType) {
    showLoadingIndicator();
    
    // First try to fetch quiz from the API
    fetchQuizFromAPI(quizId)
        .then(quizData => {
            hideLoadingIndicator();
            if (quizData) {
                displayQuiz(quizData);
            } else {
                // Fall back to local data if API fails
                const localQuizData = getLocalQuizData(quizId, quizType);
                if (localQuizData) {
                    displayQuiz(localQuizData);
                } else {
                    showErrorMessage('Quiz not available. Please try again later.');
                }
            }
        })
        .catch(error => {
            console.error('Error fetching quiz:', error);
            hideLoadingIndicator();
            
            // Fall back to local data if API fails
            const localQuizData = getLocalQuizData(quizId, quizType);
            if (localQuizData) {
                displayQuiz(localQuizData);
            } else {
                showErrorMessage('Quiz not available. Please try again later.');
            }
        });
}

/**
 * Fetch quiz data from API
 * @param {string} quizId - The ID of the quiz to fetch
 * @returns {Promise<Object>} - The quiz data
 */
async function fetchQuizFromAPI(quizId) {
    try {
        const response = await fetch(`/api/quiz.php?action=get_quiz&id=${quizId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.success && data.quiz) {
            return transformAPIQuizData(data.quiz);
        }
        return null;
    } catch (error) {
        console.error('Error fetching quiz from API:', error);
        return null;
    }
}

/**
 * Transform API quiz data to the format expected by the UI
 * @param {Object} apiQuiz - The quiz data from the API
 * @returns {Object} - Transformed quiz data
 */
function transformAPIQuizData(apiQuiz) {
    const transformedQuestions = apiQuiz.questions.map(q => {
        const options = q.options.map(o => o.option_text);
        // Find correct option
        const correctOption = q.options.findIndex(o => o.is_correct);
        
        return {
            text: q.question_text,
            options: options,
            correct: correctOption.toString()
        };
    });
    
    return {
        id: apiQuiz.id,
        title: apiQuiz.title,
        description: apiQuiz.description,
        quizType: apiQuiz.quiz_type,
        questions: transformedQuestions
    };
}

/**
 * Display the quiz modal with the provided quiz data
 * @param {Object} quizData - The quiz data to display
 */
function displayQuiz(quizData) {
    // Create quiz modal if it doesn't exist
    let quizModal = document.querySelector('.quiz-modal');
    if (!quizModal) {
        quizModal = document.createElement('div');
        quizModal.className = 'quiz-modal custom-scrollbar';
        document.body.appendChild(quizModal);
    }
    
    // Set up quiz timer
    const startTime = Date.now();
    
    // Generate quiz HTML with progress bar
    const quizHTML = generateQuizHTML(quizData, startTime);
    
    // Insert quiz into modal
    quizModal.innerHTML = quizHTML;
    
    // Show modal with animation
    setTimeout(() => {
        quizModal.classList.add('active');
        
        // Add scale-in animation to modal content
        const modalContent = quizModal.querySelector('.quiz-modal-content');
        modalContent.classList.add('scale-in');
    }, 10);
    
    // Add event listeners for the newly created quiz
    setupQuizEventListeners(quizModal);
    
    // Start quiz timer
    startQuizTimer(quizModal);
    
    // Initialize progress bar
    updateQuizProgress(quizModal);
    
    // Add accessibility improvements
    improveQuizAccessibility(quizModal);
}

/**
 * Update quiz progress bar based on answered questions
 * @param {HTMLElement} quizModal - The quiz modal element
 */
function updateQuizProgress(quizModal) {
    const progressBar = quizModal.querySelector('.progress-fill');
    const progressText = quizModal.querySelector('.progress-text');
    const questions = quizModal.querySelectorAll('.quiz-question');
    const totalQuestions = questions.length;
    
    function updateProgress() {
        const answeredQuestions = Array.from(questions).filter(q => 
            q.querySelector('input[type="radio"]:checked')
        ).length;
        
        const progressPercentage = (answeredQuestions / totalQuestions) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${answeredQuestions}/${totalQuestions} questions answered`;
        
        // Change color based on progress
        if (progressPercentage === 100) {
            progressBar.style.backgroundColor = 'var(--success)';
        } else if (progressPercentage > 50) {
            progressBar.style.backgroundColor = 'var(--accent-color)';
        }
    }
    
    // Initial update
    updateProgress();
    
    // Update progress when an answer is selected
    quizModal.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateProgress);
    });
}

/**
 * Improve quiz accessibility
 * @param {HTMLElement} quizModal - The quiz modal element
 */
function improveQuizAccessibility(quizModal) {
    // Add proper ARIA roles
    quizModal.setAttribute('role', 'dialog');
    quizModal.setAttribute('aria-modal', 'true');
    quizModal.setAttribute('aria-labelledby', 'quiz-title');
    
    // Add title ID
    const quizTitle = quizModal.querySelector('.quiz-header h3');
    if (quizTitle) {
        quizTitle.id = 'quiz-title';
    }
    
    // Make close button more accessible
    const closeBtn = quizModal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.setAttribute('aria-label', 'Close quiz');
    }
    
    // Add keyboard navigation for options
    const options = quizModal.querySelectorAll('.option');
    options.forEach(option => {
        option.tabIndex = 0;
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                const radio = this.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    });
}

/**
 * Score a quiz and display results with enhanced animations
 * @param {HTMLElement} quizContainer - The quiz container element
 */
function scoreQuiz(quizContainer) {
    const questions = quizContainer.querySelectorAll('.quiz-question');
    let correctAnswers = 0;
    let totalQuestions = questions.length;
    
    // Collect user answers
    const userAnswers = [];
    
    // Add staggered animation to feedback
    let animationDelay = 0;
    const animationStep = 200; // milliseconds between each question animation
    
    questions.forEach((question, index) => {
        const selectedOption = question.querySelector('input[type="radio"]:checked');
        const correctOption = question.dataset.correct;
        const feedbackElement = question.querySelector('.answer-feedback');
        const questionId = question.dataset.questionId;
        
        // Add answer to collection for API submission
        if (selectedOption) {
            userAnswers.push({
                question_id: questionId,
                option_id: selectedOption.dataset.optionId,
                is_correct: selectedOption.value === correctOption
            });
            
            if (selectedOption.value === correctOption) {
                correctAnswers++;
                
                // Add delayed animation for correct answer feedback
                setTimeout(() => {
                    question.classList.add('correct', 'fade-in');
                    feedbackElement.innerHTML = '<span class="correct"><i class="fas fa-check-circle"></i> Correct!</span>';
                    feedbackElement.style.display = 'block';
                }, animationDelay);
            } else {
                // Add delayed animation for incorrect answer feedback
                setTimeout(() => {
                    question.classList.add('incorrect', 'fade-in');
                    feedbackElement.innerHTML = '<span class="incorrect"><i class="fas fa-times-circle"></i> Incorrect. The correct answer is: ' + 
                        question.querySelector(`input[value="${correctOption}"]`).nextElementSibling.textContent + '</span>';
                    feedbackElement.style.display = 'block';
                }, animationDelay);
            }
        } else {
            // Add delayed animation for unanswered question feedback
            setTimeout(() => {
                question.classList.add('incorrect', 'fade-in');
                feedbackElement.innerHTML = '<span class="unanswered"><i class="fas fa-exclamation-circle"></i> Question was not answered.</span>';
                feedbackElement.style.display = 'block';
            }, animationDelay);
        }
        
        animationDelay += animationStep;
    });
    
    // Show results with a delay for better UX
    setTimeout(() => {
        // Calculate score
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Get results element
        const resultsElement = quizContainer.querySelector('.quiz-results');
        
        // Generate rating stars based on score
        const ratingStars = generateRatingStars(score);
        
        // Create results HTML with animated score counter
        resultsElement.innerHTML = `
            <h3>Quiz Results</h3>
            <div class="score-value" id="score-counter">0</div>
            <div class="score-visual">${ratingStars}</div>
            <div class="score-message">${getScoreMessage(score)}</div>
            <div class="quiz-controls">
                <button class="retry-quiz btn-interactive"><i class="fas fa-redo"></i> Try Again</button>
                <button class="close-modal btn-interactive"><i class="fas fa-times"></i> Close</button>
            </div>
        `;
        
        // Animate the score counter
        animateScoreCounter(score, quizContainer);
        
        // Show results with animation
        resultsElement.classList.add('scale-in');
        resultsElement.style.display = 'block';
        
        // Hide submit button
        const submitButton = quizContainer.querySelector('.submit-quiz');
        if (submitButton) {
            submitButton.style.display = 'none';
        }
        
        // Stop timer
        const timerElement = quizContainer.querySelector('.quiz-timer');
        if (timerElement) {
            timerElement.classList.add('timer-stopped');
        }
        
        // Get quiz ID and time taken
        const quizId = quizContainer.dataset.quizId;
        const timeTaken = parseInt(quizContainer.querySelector('input[name="time_taken"]').value, 10);
        
        // Save quiz attempt to API if user is logged in
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
            submitQuizToAPI(quizId, userAnswers, timeTaken);
        } else {
            // Save locally if not logged in
            saveQuizAttemptLocally(quizId, score);
        }
    }, animationDelay + 200); // Add extra delay for better UX
}

/**
 * Animate score counter from 0 to final score
 * @param {number} finalScore - The final score to count up to
 * @param {HTMLElement} container - The container element
 */
function animateScoreCounter(finalScore, container) {
    const counterElement = container.querySelector('#score-counter');
    const duration = 1500; // milliseconds
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    const animate = () => {
        frame++;
        const progress = frame / totalFrames;
        const currentCount = Math.floor(finalScore * progress);
        
        counterElement.textContent = `${currentCount}%`;
        
        if (frame < totalFrames) {
            requestAnimationFrame(animate);
        } else {
            counterElement.textContent = `${finalScore}%`;
        }
    };
    
    requestAnimationFrame(animate);
}

/**
 * Generate rating stars based on score
 * @param {number} score - Score percentage (0-100)
 * @returns {string} - HTML for star rating
 */
function generateRatingStars(score) {
    const totalStars = 5;
    const filledStars = Math.round((score / 100) * totalStars);
    
    let starsHTML = '<div class="rating-stars">';
    
    for (let i = 1; i <= totalStars; i++) {
        if (i <= filledStars) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    
    starsHTML += '</div>';
    return starsHTML;
}

/**
 * Generate HTML for a quiz with improved UI elements
 * @param {Object} quizData - The quiz data object
 * @param {number} startTime - The start time in milliseconds
 * @returns {string} - HTML for the quiz
 */
function generateQuizHTML(quizData, startTime) {
    let questionsHTML = '';
    
    quizData.questions.forEach((question, index) => {
        let optionsHTML = '';
        question.options.forEach((option, optIndex) => {
            optionsHTML += `
                <div class="option" tabindex="0">
                    <input type="radio" id="q${index}_o${optIndex}" name="q${index}" value="${optIndex}" data-option-id="${question.optionIds ? question.optionIds[optIndex] : optIndex}">
                    <label for="q${index}_o${optIndex}">${option}</label>
                </div>
            `;
        });
        
        questionsHTML += `
            <div class="quiz-question" data-correct="${question.correct}" data-question-id="${question.id || index}">
                <div class="question-number">${index + 1}</div>
                <h4>${question.text}</h4>
                <div class="options-container">
                    ${optionsHTML}
                </div>
                <div class="answer-feedback" style="display: none;"></div>
            </div>
        `;
    });
    
    return `
        <div class="quiz-modal-content custom-scrollbar">
            <button class="close-modal" aria-label="Close quiz">
                <i class="fas fa-times"></i>
            </button>
            <div class="quiz-container" data-quiz-id="${quizData.id}" data-start-time="${startTime}">
                <div class="quiz-header">
                    <h3 id="quiz-title">${quizData.title}</h3>
                    <p>${quizData.description}</p>
                    <div class="quiz-timer">0:00</div>
                </div>
                
                <div class="quiz-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-text">0/${quizData.questions.length} questions answered</div>
                </div>
                
                <div class="quiz-questions">
                    ${questionsHTML}
                </div>
                
                <div class="quiz-controls">
                    <input type="hidden" name="time_taken" value="0">
                    <button class="submit-quiz btn-interactive"><i class="fas fa-check-circle"></i> Submit Answers</button>
                </div>
                <div class="quiz-results" style="display: none;"></div>
            </div>
        </div>
    `;
}

/**
 * Get a message based on the quiz score
 * @param {number} score - Score percentage (0-100)
 * @returns {string} - Message for the user
 */
function getScoreMessage(score) {
    if (score >= 90) return "Excellent! You're a master!";
    if (score >= 80) return "Great job! You know your stuff!";
    if (score >= 70) return "Good work! You're getting there!";
    if (score >= 60) return "Not bad. Room for improvement.";
    return "Keep studying and try again!";
}

/**
 * Save quiz attempt to localStorage
 * @param {string} quizId - The ID of the quiz
 * @param {number} score - The score percentage
 */
function saveQuizAttemptLocally(quizId, score) {
    const attempts = JSON.parse(localStorage.getItem('quiz-attempts') || '{}');
    
    if (!attempts[quizId]) {
        attempts[quizId] = [];
    }
    
    attempts[quizId].push({
        score: score,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('quiz-attempts', JSON.stringify(attempts));
}

/**
 * Initialize related content recommendations
 */
function initRelatedContent() {
    // Find cross-content navigation elements
    const crossContentItems = document.querySelectorAll('.cross-content-item');
    
    // Get current page type
    const pageType = getPageType();
    
    if (pageType && crossContentItems.length > 0) {
        // Get content ID from URL if available
        const contentId = getContentIdFromURL();
        
        if (contentId) {
            // Enhance cross-content links with API-based recommendations
            enhanceCrossContentLinks(contentId, pageType);
        }
    }
}

/**
 * Get current page type based on URL or body class
 * @returns {string|null} - Page type (movie, series, anime, etc.) or null
 */
function getPageType() {
    const body = document.body;
    
    if (body.classList.contains('movies-page')) return 'movie';
    if (body.classList.contains('series-page')) return 'series';
    if (body.classList.contains('anime-page')) return 'anime';
    if (body.classList.contains('games-page')) return 'game';
    if (body.classList.contains('manga-page')) return 'manga';
    
    return null;
}

/**
 * Extract content ID from URL if available
 * @returns {string|null} - Content ID or null
 */
function getContentIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Enhance cross-content navigation links with API recommendations
 * @param {string} contentId - Current content ID
 * @param {string} contentType - Current content type
 */
function enhanceCrossContentLinks(contentId, contentType) {
    const crossContentItems = document.querySelectorAll('.cross-content-item');
    
    crossContentItems.forEach(item => {
        const href = item.getAttribute('href');
        const targetType = getTargetTypeFromHref(href);
        
        if (targetType && contentId) {
            // Update with "loading" state
            const detailsDiv = item.querySelector('.cross-content-details p');
            const originalText = detailsDiv.textContent;
            detailsDiv.innerHTML = '<em>Finding recommendations for you...</em>';
            
            // Fetch cross-type related content
            fetchCrossTypeRelatedContent(contentId, contentType, targetType)
                .then(data => {
                    if (data && data.related_items && data.related_items.length > 0) {
                        // Update description with first related item
                        const relatedItem = data.related_items[0];
                        detailsDiv.textContent = `Try: "${relatedItem.title}"`;
                        
                        // Update link to point directly to the related item
                        item.href = `${href}?id=${relatedItem.id}`;
                    } else {
                        detailsDiv.textContent = originalText;
                    }
                })
                .catch(error => {
                    console.error('Error fetching related content:', error);
                    detailsDiv.textContent = originalText;
                });
        }
    });
}

/**
 * Get target content type from href
 * @param {string} href - Link href attribute
 * @returns {string|null} - Target content type or null
 */
function getTargetTypeFromHref(href) {
    if (href.includes('movies.html')) return 'movie';
    if (href.includes('series.html')) return 'series';
    if (href.includes('anime.html')) return 'anime';
    if (href.includes('games.html')) return 'game';
    if (href.includes('manga.html')) return 'manga';
    
    return null;
}

/**
 * Fetch cross-type related content from API
 * @param {string} contentId - Source content ID
 * @param {string} contentType - Source content type
 * @param {string} targetType - Target content type
 * @returns {Promise<Object>} - Related content data
 */
async function fetchCrossTypeRelatedContent(contentId, contentType, targetType) {
    try {
        const response = await fetch(`/api/content_relationships.php?action=get_cross_type_related&content_id=${contentId}&content_type=${contentType}&target_type=${targetType}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        return data.success ? data : null;
    } catch (error) {
        console.error('Error fetching cross-type related content:', error);
        return null;
    }
}

/**
 * Fetch recommendations by content type
 * @param {string} contentType - Content type (movie, series, etc.)
 */
async function fetchRecommendationsByType(contentType) {
    try {
        // Map quiz types to content types
        const typeMapping = {
            'movies': 'movie',
            'series': 'series',
            'anime': 'anime',
            'games': 'game',
            'manga': 'manga'
        };
        
        const mappedType = typeMapping[contentType] || contentType;
        
        const response = await fetch(`/api/content_relationships.php?action=get_popular_by_type&content_type=${mappedType}&limit=3`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.success && data.items) {
            displayRecommendations(contentType, data.items);
        } else {
            hideRecommendationsContainer(contentType);
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        hideRecommendationsContainer(contentType);
    }
}

/**
 * Display recommendations in the quiz results
 * @param {string} contentType - Content type
 * @param {Array} items - Content items to display
 */
function displayRecommendations(contentType, items) {
    const container = document.getElementById(`quiz-recs-${contentType}`);
    
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p>No recommendations available at this time.</p>';
        return;
    }
    
    let html = '<div class="recommendations-list">';
    
    items.forEach(item => {
        html += `
            <a href="${getUrlForContentType(contentType)}?id=${item.id}" class="recommendation-item">
                <div class="rec-image">
                    <img src="/images/${item.cover_image || 'placeholder.jpg'}" alt="${item.title}">
                </div>
                <div class="rec-info">
                    <h5>${item.title}</h5>
                    <div class="rec-rating">
                        <i class="fas fa-star"></i>
                        <span>${item.rating || 'N/A'}</span>
                    </div>
                </div>
            </a>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Hide recommendations container if no results
 * @param {string} contentType - Content type
 */
function hideRecommendationsContainer(contentType) {
    const container = document.getElementById(`quiz-recs-${contentType}`);
    if (container) {
        const parent = container.closest('.quiz-recommendations');
        if (parent) {
            parent.style.display = 'none';
        }
    }
}

/**
 * Get URL for content type
 * @param {string} contentType - Content type
 * @returns {string} - URL for the content type
 */
function getUrlForContentType(contentType) {
    const urlMapping = {
        'movies': '/html/movies.html',
        'series': '/html/series.html',
        'anime': '/html/anime.html',
        'games': '/html/games.html',
        'manga': '/html/manga.html'
    };
    
    return urlMapping[contentType] || '/html/index.html';
}

/**
 * Get local quiz data by ID or type
 * @param {string} quizId - The ID of the quiz to retrieve
 * @param {string} quizType - The type of quiz as a fallback
 * @returns {Object|null} - The quiz data or null if not found
 */
function getLocalQuizData(quizId, quizType) {
    // Pre-defined quizzes for fallback
    const quizzes = {
        'movies-quiz': {
            id: 'movies-quiz',
            title: 'Movie Knowledge Quiz',
            description: 'Test your knowledge of popular movies!',
            questions: [
                {
                    text: 'Which film won the Academy Award for Best Picture in 2023?',
                    options: ['Barbie', 'Everything Everywhere All at Once', 'Oppenheimer', 'The Fabelmans'],
                    correct: '1'
                },
                {
                    text: 'Who directed the 2024 sci-fi epic "Dune: Part Two"?',
                    options: ['Christopher Nolan', 'Denis Villeneuve', 'James Cameron', 'Steven Spielberg'],
                    correct: '1'
                },
                {
                    text: 'Which actor plays Tony Stark/Iron Man in the Marvel Cinematic Universe?',
                    options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
                    correct: '1'
                },
                {
                    text: 'What is the highest-grossing film of all time as of 2025?',
                    options: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'],
                    correct: '0'
                }
            ]
        },
        'series-quiz': {
            id: 'series-quiz',
            title: 'TV Series Knowledge Quiz',
            description: 'How well do you know popular TV shows?',
            questions: [
                {
                    text: 'Which streaming service produced "Stranger Things"?',
                    options: ['Netflix', 'Amazon Prime', 'Disney+', 'HBO Max'],
                    correct: '0'
                },
                {
                    text: 'Which TV series follows the Dutton family and their Montana ranch?',
                    options: ['Yellowstone', '1883', 'Succession', 'Longmire'],
                    correct: '0'
                },
                {
                    text: 'Which show features the character of Eleven with telekinetic abilities?',
                    options: ['The Boys', 'The Umbrella Academy', 'Stranger Things', 'Locke & Key'],
                    correct: '2'
                },
                {
                    text: 'Which series is based on George R.R. Martin\'s fantasy novels?',
                    options: ['The Witcher', 'Wheel of Time', 'Game of Thrones', 'Shadow and Bone'],
                    correct: '2'
                }
            ]
        },
        // More quizzes here...
    };
    
    // Try to find by ID first
    if (quizzes[quizId]) {
        return quizzes[quizId];
    }
    
    // If not found, try to match by type
    if (quizType) {
        const typeQuizId = `${quizType}-quiz`;
        if (quizzes[typeQuizId]) {
            return quizzes[typeQuizId];
        }
    }
    
    return null;
}

/**
 * Add back to top button
 */
function addBackToTopButton() {
    // Check if the button already exists
    if (document.querySelector('.back-to-top')) return;
    
    // Create back to top button
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(backToTop);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    // Scroll to top on click
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Add tooltips to elements with 'data-tooltip' attribute
 */
function addTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        // Skip if already processed
        if (element.classList.contains('tooltip')) return;
        
        // Get tooltip text
        const tooltipText = element.dataset.tooltip;
        
        // Add tooltip class to element
        element.classList.add('tooltip');
        
        // Create tooltip text element
        const tooltipTextElement = document.createElement('span');
        tooltipTextElement.className = 'tooltip-text';
        tooltipTextElement.textContent = tooltipText;
        
        // Append tooltip text element to element
        element.appendChild(tooltipTextElement);
    });
}

/**
 * Add hover effects to cards
 */
function addCardHoverEffects() {
    // Add hover effect to content cards
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('hover-card');
    });
}

/**
 * Add image zoom effects
 */
function addImageZoomEffects() {
    // Find all card images and add zoom effect
    document.querySelectorAll('.card-img').forEach(imgContainer => {
        imgContainer.classList.add('img-zoom-container');
        
        const img = imgContainer.querySelector('img');
        if (img) {
            img.classList.add('img-zoom');
        }
    });
}

/**
 * Initialize tabbed interfaces
 */
function initTabs() {
    const tabContainers = document.querySelectorAll('.tabs');
    
    tabContainers.forEach(container => {
        const tabNavItems = container.querySelectorAll('.tab-nav-item');
        const tabContents = container.querySelectorAll('.tab-content');
        
        // Set initial active tab
        if (tabNavItems.length && tabContents.length) {
            tabNavItems[0].classList.add('active');
            tabContents[0].classList.add('active');
            
            // Add click event listeners to tab navigation items
            tabNavItems.forEach(navItem => {
                navItem.addEventListener('click', () => {
                    // Get tab ID
                    const tabId = navItem.dataset.tabTarget;
                    
                    // Remove active class from all tabs and contents
                    tabNavItems.forEach(item => item.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding content
                    navItem.classList.add('active');
                    container.querySelector(`#${tabId}`).classList.add('active');
                });
            });
        }
    });
}

/**
 * Initialize accordion elements
 */
function initAccordions() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        if (header) {
            header.addEventListener('click', () => {
                // Toggle active class
                item.classList.toggle('active');
            });
        }
    });
}

/**
 * Enhance dropdown menus
 */
function enhanceDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        
        if (toggle) {
            // Toggle dropdown on click
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.toggle('active');
                
                // Close all other dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
}

/**
 * Initialize modal dialogs
 */
function initModals() {
    // Find all modal triggers
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get modal ID
            const modalId = trigger.dataset.modalTarget;
            
            // Get modal element
            const modal = document.querySelector(`#${modalId}`);
            
            if (modal) {
                // Show modal
                modal.classList.add('active');
                
                // Add event listener to close button
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        modal.classList.remove('active');
                    });
                }
                
                // Close modal when clicking outside content
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
    });
}

/**
 * Add skeleton loading to lazy-loaded content
 */
function addSkeletonLoading() {
    // Find all lazy load containers
    const lazyContainers = document.querySelectorAll('[data-lazy-load]');
    
    lazyContainers.forEach(container => {
        // Create skeleton loader based on data-skeleton-type
        const skeletonType = container.dataset.skeletonType || 'card';
        
        // Replace container content with skeleton
        if (skeletonType === 'card') {
            const count = container.dataset.itemCount || 3;
            let skeletonHTML = '';
            
            for (let i = 0; i < count; i++) {
                skeletonHTML += `
                    <div class="skeleton-card">
                        <div class="skeleton skeleton-image"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text short"></div>
                    </div>
                `;
            }
            
            container.innerHTML = skeletonHTML;
        }
    });
}

/**
 * Add scroll animations to elements
 */
function addScrollAnimations() {
    // Find all elements with data-scroll attribute
    const scrollAnimElements = document.querySelectorAll('[data-scroll]');
    
    if (scrollAnimElements.length === 0) return;
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Get animation type
                    const animType = entry.target.dataset.scroll;
                    
                    // Add animation class
                    entry.target.classList.add(animType);
                    
                    // Stop observing this element
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        // Observe each element
        scrollAnimElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        scrollAnimElements.forEach(element => {
            element.classList.add(element.dataset.scroll);
        });
    }
}

// ... rest of existing code ...