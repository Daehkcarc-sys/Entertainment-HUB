/**
 * Entertainment Hub - Common JavaScript functionality
 * Shared across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize music player
    setupMusicPlayer();
    
    // Initialize header dropdown functionality
    setupHeaderDropdowns();
    
    // Initialize back to top button
    setupBackToTopButton();
    
    // Initialize enhanced theme toggle
    initializeThemeToggle();
    
    // Initialize quiz system
    initializeQuizSystem();
    
    // Initialize lazy loading for images
    setupLazyLoading();

    // Initialize mobile menu toggle
    initializeMobileMenu();
    
    // Hide page loader when everything is ready
    setTimeout(() => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, 300);
});

/**
 * Music Player Setup
 */
function setupMusicPlayer() {
    if (document.querySelector('.music-player')) return; // Avoid duplicates
    
    // Create music player HTML
    const musicPlayerHTML = `
        <div class="music-player" id="music-player">
            <div class="music-player-toggle">
                <i class="fas fa-music"></i>
            </div>
            <div class="music-player-container">
                <div class="music-player-header">
                    <span class="music-player-title">Now Playing</span>
                    <div class="music-player-controls">
                        <button class="music-minimize-btn"><i class="fas fa-minus"></i></button>
                        <button class="music-close-btn"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="music-info">
                    <div class="music-thumbnail">
                        <img src="../images/lofi-thumbnail.jpg" alt="Music Thumbnail" id="music-thumbnail" onerror="this.src='../images/Animewallpaper.jpg'">
                    </div>
                    <div class="music-details">
                        <h4 id="music-title">Morning Routine</h4>
                        <p id="music-artist">Lofi Study Music</p>
                    </div>
                </div>
                <div class="music-progress">
                    <span id="current-time">0:00</span>
                    <div class="progress-bar">
                        <div class="progress" id="music-progress"></div>
                    </div>
                    <span id="total-duration">3:45</span>
                </div>
                <div class="music-controls">
                    <button id="prev-btn"><i class="fas fa-step-backward"></i></button>
                    <button id="play-pause-btn"><i class="fas fa-play"></i></button>
                    <button id="next-btn"><i class="fas fa-step-forward"></i></button>
                    <div class="volume-control">
                        <i class="fas fa-volume-up" id="volume-icon"></i>
                        <input type="range" id="volume-slider" min="0" max="100" value="70">
                    </div>
                </div>
            </div>
            <audio id="audio-player" src="../Morning-Routine-Lofi-Study-Music(chosic.com).mp3"></audio>
        </div>
    `;
    
    // Insert music player into body
    const musicPlayerElement = document.createElement('div');
    musicPlayerElement.innerHTML = musicPlayerHTML;
    document.body.appendChild(musicPlayerElement);
    
    // Initialize music player functionality
    initMusicPlayer();
}

/**
 * Initialize Music Player Functionality
 */
function initMusicPlayer() {
    const player = document.getElementById('music-player');
    const audioElement = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const progressBar = document.getElementById('music-progress');
    const currentTimeDisplay = document.getElementById('current-time');
    const totalDurationDisplay = document.getElementById('total-duration');
    const toggleBtn = document.querySelector('.music-player-toggle');
    const minimizeBtn = document.querySelector('.music-minimize-btn');
    const closeBtn = document.querySelector('.music-close-btn');
    
    // Playlist (can be expanded later)
    const playlist = [
        {
            title: 'Morning Routine',
            artist: 'Lofi Study Music',
            file: '../Morning-Routine-Lofi-Study-Music(chosic.com).mp3',
            thumbnail: '../images/lofi-thumbnail.jpg'
        }
    ];
    
    let currentTrack = 0;
    
    // Load track
    function loadTrack(trackIndex) {
        if (trackIndex < 0) trackIndex = playlist.length - 1;
        if (trackIndex >= playlist.length) trackIndex = 0;
        
        currentTrack = trackIndex;
        audioElement.src = playlist[trackIndex].file;
        
        document.getElementById('music-title').textContent = playlist[trackIndex].title;
        document.getElementById('music-artist').textContent = playlist[trackIndex].artist;
        
        const thumbnail = document.getElementById('music-thumbnail');
        if (playlist[trackIndex].thumbnail) {
            thumbnail.src = playlist[trackIndex].thumbnail;
        }
        
        updateTotalDuration();
    }
    
    // Toggle play/pause
    playPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioElement.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // Previous track
    prevBtn.addEventListener('click', () => {
        loadTrack(currentTrack - 1);
        if (!audioElement.paused) {
            audioElement.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    });
    
    // Next track
    nextBtn.addEventListener('click', () => {
        loadTrack(currentTrack + 1);
        if (!audioElement.paused) {
            audioElement.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    });
    
    // Volume control
    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        audioElement.volume = volume;
        
        // Update volume icon based on level
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    });
    
    // Volume icon click to mute/unmute
    let previousVolume = 0.7;
    volumeIcon.addEventListener('click', () => {
        if (audioElement.volume > 0) {
            previousVolume = audioElement.volume;
            audioElement.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.className = 'fas fa-volume-mute';
        } else {
            audioElement.volume = previousVolume;
            volumeSlider.value = previousVolume * 100;
            volumeIcon.className = previousVolume < 0.5 ? 'fas fa-volume-down' : 'fas fa-volume-up';
        }
    });
    
    // Update progress bar
    audioElement.addEventListener('timeupdate', () => {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update current time display
        const currentMinutes = Math.floor(audioElement.currentTime / 60);
        const currentSeconds = Math.floor(audioElement.currentTime % 60).toString().padStart(2, '0');
        currentTimeDisplay.textContent = `${currentMinutes}:${currentSeconds}`;
    });
    
    // Update total duration display
    function updateTotalDuration() {
        audioElement.addEventListener('loadedmetadata', () => {
            const totalMinutes = Math.floor(audioElement.duration / 60);
            const totalSeconds = Math.floor(audioElement.duration % 60).toString().padStart(2, '0');
            totalDurationDisplay.textContent = `${totalMinutes}:${totalSeconds}`;
        });
    }
    
    // Click on progress bar to seek
    document.querySelector('.progress-bar').addEventListener('click', (e) => {
        const progressBarWidth = document.querySelector('.progress-bar').clientWidth;
        const clickX = e.offsetX;
        const seekTime = (clickX / progressBarWidth) * audioElement.duration;
        audioElement.currentTime = seekTime;
    });
    
    // Toggle player visibility
    toggleBtn.addEventListener('click', () => {
        player.classList.toggle('expanded');
    });
    
    // Minimize player
    minimizeBtn.addEventListener('click', () => {
        player.classList.remove('expanded');
    });
    
    // Close player (just minimize for now, can be changed to completely hide if needed)
    closeBtn.addEventListener('click', () => {
        player.classList.remove('expanded');
        audioElement.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
    
    // Auto-play when track ends
    audioElement.addEventListener('ended', () => {
        loadTrack(currentTrack + 1);
        audioElement.play();
    });
    
    // Initialize with first track
    loadTrack(0);
}

/**
 * Header dropdown functionality
 */
function setupHeaderDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            // Toggle dropdown on click
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                menu.classList.toggle('show');
                
                // Close other open dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        const otherMenu = otherDropdown.querySelector('.dropdown-menu');
                        if (otherMenu && otherMenu.classList.contains('show')) {
                            otherMenu.classList.remove('show');
                        }
                    }
                });
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });
        }
    });
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
}

/**
 * Back to top button
 */
function setupBackToTopButton() {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    
    if (backToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('active');
            } else {
                backToTopBtn.classList.remove('active');
            }
        });
        
        // Scroll to top when clicked
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Enhanced Theme Toggle Functionality
 * Improved dark mode implementation that works consistently across all pages
 */
function initializeThemeToggle() {
    const themeToggleBtn = document.querySelector('.theme-toggle');
    if (!themeToggleBtn) return;
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme)) {
        document.body.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.setAttribute('data-theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Handle theme toggle click
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon based on theme
        if (newTheme === 'dark') {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        // Add animation effect on theme change
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
    });
}

/**
 * Mobile Menu Toggle 
 * Controls the mobile navigation menu
 */
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!mobileToggle || !navList) return;
    
    mobileToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
        mobileToggle.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

/**
 * Quiz System Initialization
 * Powers the interactive quizzes across all pages
 */
function initializeQuizSystem() {
    // Find all quiz triggers and attach event listeners
    const quizTriggers = document.querySelectorAll('.quiz-trigger');
    
    quizTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const quizType = this.dataset.quizType || 'general';
            
            // Add a visual feedback on click
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 1000);
            
            // Load the appropriate quiz based on type
            loadQuiz(quizType);
        });
    });
    
    // Add global event listener for quiz-related events
    document.addEventListener('click', function(event) {
        // Close quiz modal if clicking outside
        if (event.target.classList.contains('quiz-modal')) {
            closeQuizModal();
        }
        
        // Close button for modal
        if (event.target.closest('.close-modal')) {
            closeQuizModal();
        }
        
        // Submit quiz
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
        
        // Retry quiz
        if (event.target.classList.contains('retry-quiz')) {
            const quizContainer = event.target.closest('.quiz-container');
            const quizType = quizContainer ? quizContainer.dataset.quizType : 'general';
            
            // Close current quiz
            closeQuizModal();
            
            // Load a new quiz of the same type
            setTimeout(() => {
                loadQuiz(quizType);
            }, 300);
        }
    });

    // Add keyboard navigation support for quizzes
    document.addEventListener('keydown', function(event) {
        const quizModal = document.querySelector('.quiz-modal');
        
        if (quizModal && quizModal.classList.contains('active')) {
            if (event.key === 'Escape') {
                closeQuizModal();
            }
        }
    });
}

/**
 * Load a quiz based on type
 * @param {string} quizType - Type of quiz to load (movies, anime, etc.)
 */
function loadQuiz(quizType) {
    // Show loading indicator
    showLoadingIndicator();
    
    // Get quiz data based on type
    const quizData = getQuizByType(quizType);
    
    if (quizData) {
        // Hide loading and display quiz
        hideLoadingIndicator();
        displayQuiz(quizData);
    } else {
        hideLoadingIndicator();
        showErrorMessage('Quiz not available at the moment. Please try again later.');
    }
}

/**
 * Display loading indicator
 */
function showLoadingIndicator() {
    // Remove any existing loading indicator
    const existingLoader = document.getElementById('quiz-loader');
    if (existingLoader) {
        existingLoader.remove();
    }
    
    const loader = document.createElement('div');
    loader.id = 'quiz-loader';
    loader.className = 'quiz-loader';
    loader.innerHTML = `
        <div class="spinner"></div>
        <p>Loading quiz...</p>
    `;
    
    document.body.appendChild(loader);
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
    const loader = document.getElementById('quiz-loader');
    if (loader) {
        loader.remove();
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'quiz-error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button class="btn-interactive error-close">Close</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
        errorDiv.remove();
    });
    
    setTimeout(() => {
        errorDiv.classList.add('fade-in');
    }, 10);
    
    setTimeout(() => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => {
            errorDiv.remove();
        }, 500);
    }, 5000);
}

/**
 * Get quiz data by type
 * @param {string} quizType - Type of quiz to get
 * @returns {Object} - Quiz data object
 */
function getQuizByType(quizType) {
    // Pre-defined quizzes for different entertainment categories
    const quizzes = {
        'general': {
            id: 'general-quiz',
            title: 'General Entertainment Quiz',
            description: 'Test your knowledge across movies, series, anime, and more!',
            quizType: 'general',
            questions: [
                {
                    text: 'Which of these franchises has the highest-grossing film of all time?',
                    options: ['Star Wars', 'Marvel Cinematic Universe', 'Avatar', 'Jurassic Park'],
                    correct: '2'
                },
                {
                    text: 'Which anime series features a character named Monkey D. Luffy?',
                    options: ['Naruto', 'One Piece', 'Bleach', 'Dragon Ball'],
                    correct: '1'
                },
                {
                    text: 'Which TV show features dragons, white walkers, and the Iron Throne?',
                    options: ['The Witcher', 'Game of Thrones', 'House of the Dragon', 'Lord of the Rings'],
                    correct: '1'
                },
                {
                    text: 'Which of these is NOT a manga created by Masashi Kishimoto?',
                    options: ['Naruto', 'Boruto', 'Samurai 8', 'One Punch Man'],
                    correct: '3'
                },
                {
                    text: 'Who directed the movie "Inception"?',
                    options: ['Steven Spielberg', 'Christopher Nolan', 'James Cameron', 'Quentin Tarantino'],
                    correct: '1'
                }
            ]
        },
        'movies': {
            id: 'movies-quiz',
            title: 'Movie Knowledge Quiz',
            description: 'Test your knowledge of popular movies!',
            quizType: 'movies',
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
                },
                {
                    text: 'Which of these films is directed by Jordan Peele?',
                    options: ['A Quiet Place', 'Get Out', 'The Conjuring', 'Hereditary'],
                    correct: '1'
                }
            ]
        },
        'anime': {
            id: 'anime-quiz',
            title: 'Anime Knowledge Quiz',
            description: 'Test your knowledge of popular anime series!',
            quizType: 'anime',
            questions: [
                {
                    text: 'Which anime features a boy named Izuku Midoriya who dreams of becoming a hero?',
                    options: ['One Piece', 'Naruto', 'My Hero Academia', 'Attack on Titan'],
                    correct: '2'
                },
                {
                    text: 'In "Attack on Titan", what are the giant humanoid creatures called?',
                    options: ['Yokai', 'Titans', 'Hollows', 'Demons'],
                    correct: '1'
                },
                {
                    text: 'Which anime features a Death Note that can kill anyone whose name is written in it?',
                    options: ['Tokyo Ghoul', 'Death Parade', 'Death Note', 'Future Diary'],
                    correct: '2'
                },
                {
                    text: 'Which studio animated "Demon Slayer: Kimetsu no Yaiba"?',
                    options: ['MAPPA', 'Madhouse', 'Ufotable', 'Kyoto Animation'],
                    correct: '2'
                },
                {
                    text: 'Who is the main character in "Jujutsu Kaisen"?',
                    options: ['Megumi Fushiguro', 'Yuji Itadori', 'Nobara Kugisaki', 'Satoru Gojo'],
                    correct: '1'
                }
            ]
        },
        'series': {
            id: 'series-quiz',
            title: 'TV Series Knowledge Quiz',
            description: 'Test your knowledge of popular TV shows!',
            quizType: 'series',
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
                    text: 'Which show features the character Walter White?',
                    options: ['Better Call Saul', 'Breaking Bad', 'Ozark', 'Narcos'],
                    correct: '1'
                },
                {
                    text: 'Which series is based on George R.R. Martin\'s fantasy novels?',
                    options: ['The Witcher', 'Wheel of Time', 'Game of Thrones', 'Shadow and Bone'],
                    correct: '2'
                },
                {
                    text: 'Which show features a group of survivors in a post-apocalyptic world overrun by zombies?',
                    options: ['Lost', 'The 100', 'The Walking Dead', 'The Last of Us'],
                    correct: '2'
                }
            ]
        }
    };
    
    // Return quiz by type or default to general quiz
    return quizzes[quizType] || quizzes['general'];
}

/**
 * Display the quiz modal
 * @param {Object} quizData - Quiz data to display
 */
function displayQuiz(quizData) {
    // Create or get quiz modal
    let quizModal = document.querySelector('.quiz-modal');
    if (!quizModal) {
        quizModal = document.createElement('div');
        quizModal.className = 'quiz-modal';
        document.body.appendChild(quizModal);
    }
    
    // Set up quiz timer
    const startTime = Date.now();
    
    // Generate quiz HTML
    const quizHTML = generateQuizHTML(quizData, startTime);
    
    // Insert quiz into modal
    quizModal.innerHTML = quizHTML;
    
    // Show modal with animation
    setTimeout(() => {
        quizModal.classList.add('active');
        
        // Add scale-in animation to modal content
        const modalContent = quizModal.querySelector('.quiz-modal-content');
        if (modalContent) {
            modalContent.classList.add('scale-in');
        }
        
        // Start quiz timer
        startQuizTimer(quizModal);
        
        // Initialize progress bar
        updateQuizProgress(quizModal);
    }, 10);
}

/**
 * Generate HTML for a quiz
 * @param {Object} quizData - Quiz data object
 * @param {number} startTime - Start time in milliseconds
 * @returns {string} - HTML for quiz
 */
function generateQuizHTML(quizData, startTime) {
    let questionsHTML = '';
    
    quizData.questions.forEach((question, index) => {
        let optionsHTML = '';
        
        question.options.forEach((option, optIndex) => {
            optionsHTML += `
                <div class="option">
                    <input type="radio" id="q${index}_o${optIndex}" name="q${index}" value="${optIndex}">
                    <label for="q${index}_o${optIndex}">${option}</label>
                </div>
            `;
        });
        
        questionsHTML += `
            <div class="quiz-question" data-correct="${question.correct}">
                <h4><span class="question-number">${index + 1}.</span> ${question.text}</h4>
                <div class="options-container">
                    ${optionsHTML}
                </div>
                <div class="answer-feedback" style="display: none;"></div>
            </div>
        `;
    });
    
    return `
        <div class="quiz-modal-content">
            <button class="close-modal" aria-label="Close quiz">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="quiz-container" data-quiz-type="${quizData.quizType}" data-start-time="${startTime}">
                <div class="quiz-header">
                    <h3>${quizData.title}</h3>
                    <p>${quizData.description}</p>
                    <div class="quiz-timer">00:00</div>
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
                    <button class="submit-quiz btn-primary">Submit Answers</button>
                </div>
                
                <div class="quiz-results" style="display: none;"></div>
            </div>
        </div>
    `;
}

/**
 * Start quiz timer
 * @param {HTMLElement} quizModal - Quiz modal element
 */
function startQuizTimer(quizModal) {
    const timerElement = quizModal.querySelector('.quiz-timer');
    const startTime = parseInt(quizModal.querySelector('.quiz-container').dataset.startTime);
    const timeTakenInput = quizModal.querySelector('input[name="time_taken"]');
    
    if (!timerElement || !startTime) return;
    
    const updateTimer = () => {
        const currentTime = Date.now();
        const elapsedTime = Math.floor((currentTime - startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        
        timerElement.textContent = `${minutes}:${seconds}`;
        
        if (timeTakenInput) {
            timeTakenInput.value = elapsedTime;
        }
    };
    
    // Update timer immediately
    updateTimer();
    
    // Set interval for timer updates
    const timerInterval = setInterval(updateTimer, 1000);
    
    // Store interval ID in a data attribute to clear it later
    quizModal.dataset.timerInterval = timerInterval;
}

/**
 * Update quiz progress bar
 * @param {HTMLElement} quizModal - Quiz modal element
 */
function updateQuizProgress(quizModal) {
    const progressBar = quizModal.querySelector('.progress-fill');
    const progressText = quizModal.querySelector('.progress-text');
    const questions = quizModal.querySelectorAll('.quiz-question');
    const totalQuestions = questions.length;
    
    if (!progressBar || !progressText || !questions.length) return;
    
    // Function to update progress
    function updateProgress() {
        const answeredQuestions = Array.from(questions).filter(q => 
            q.querySelector('input[type="radio"]:checked')
        ).length;
        
        const progressPercentage = (answeredQuestions / totalQuestions) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${answeredQuestions}/${totalQuestions} questions answered`;
        
        // Change color based on progress
        if (progressPercentage === 100) {
            progressBar.style.backgroundColor = 'var(--success-color, #28a745)';
        } else if (progressPercentage > 50) {
            progressBar.style.backgroundColor = 'var(--accent-color, #007bff)';
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
 * Close the quiz modal
 */
function closeQuizModal() {
    const quizModal = document.querySelector('.quiz-modal');
    
    if (quizModal) {
        // Clear timer interval
        if (quizModal.dataset.timerInterval) {
            clearInterval(parseInt(quizModal.dataset.timerInterval));
        }
        
        // Add fade-out animation
        quizModal.classList.add('fade-out');
        
        // Remove modal after animation
        setTimeout(() => {
            quizModal.remove();
        }, 300);
    }
}

/**
 * Score a quiz and display results
 * @param {HTMLElement} quizContainer - Quiz container element
 */
function scoreQuiz(quizContainer) {
    const questions = quizContainer.querySelectorAll('.quiz-question');
    let correctAnswers = 0;
    let totalQuestions = questions.length;
    
    // Calculate score
    questions.forEach(question => {
        const selectedOption = question.querySelector('input[type="radio"]:checked');
        const correctOption = question.dataset.correct;
        const feedbackElement = question.querySelector('.answer-feedback');
        
        if (selectedOption) {
            if (selectedOption.value === correctOption) {
                correctAnswers++;
                question.classList.add('correct');
                feedbackElement.innerHTML = '<span class="correct"><i class="fas fa-check-circle"></i> Correct!</span>';
                feedbackElement.style.display = 'block';
            } else {
                question.classList.add('incorrect');
                const correctAnswerText = question.querySelector(`input[value="${correctOption}"]`).nextElementSibling.textContent;
                feedbackElement.innerHTML = `<span class="incorrect"><i class="fas fa-times-circle"></i> Incorrect. Correct answer: ${correctAnswerText}</span>`;
                feedbackElement.style.display = 'block';
            }
        } else {
            question.classList.add('unanswered');
            feedbackElement.innerHTML = '<span class="unanswered"><i class="fas fa-exclamation-circle"></i> Question not answered</span>';
            feedbackElement.style.display = 'block';
        }
    });
    
    // Calculate score percentage
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Display results
    const resultsElement = quizContainer.querySelector('.quiz-results');
    
    // Generate message based on score
    let scoreMessage;
    if (scorePercentage >= 90) {
        scoreMessage = "Excellent! You're a master of entertainment knowledge!";
    } else if (scorePercentage >= 75) {
        scoreMessage = "Great job! You know your stuff!";
    } else if (scorePercentage >= 60) {
        scoreMessage = "Good effort! Keep watching and learning!";
    } else if (scorePercentage >= 40) {
        scoreMessage = "Not bad. You've got room to improve your entertainment knowledge.";
    } else {
        scoreMessage = "Keep exploring and try again! There's a lot to learn.";
    }
    
    // Generate results HTML
    resultsElement.innerHTML = `
        <h3>Quiz Results</h3>
        <div class="score-container">
            <div class="score-circle">
                <div class="score-number">${scorePercentage}%</div>
                <div class="score-label">${correctAnswers} of ${totalQuestions} correct</div>
            </div>
        </div>
        <p class="score-message">${scoreMessage}</p>
        <div class="quiz-result-controls">
            <button class="retry-quiz btn-secondary">Try Again</button>
            <button class="close-modal btn-primary">Close</button>
        </div>
    `;
    
    // Show results
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
    
    // Clear timer interval
    const quizModal = quizContainer.closest('.quiz-modal');
    if (quizModal && quizModal.dataset.timerInterval) {
        clearInterval(parseInt(quizModal.dataset.timerInterval));
    }
    
    // Save quiz attempt to localStorage
    saveQuizAttempt(quizContainer.dataset.quizType, scorePercentage);
}

/**
 * Save quiz attempt to localStorage
 * @param {string} quizType - Type of quiz
 * @param {number} score - Score percentage
 */
function saveQuizAttempt(quizType, score) {
    const attempts = JSON.parse(localStorage.getItem('quiz-attempts') || '{}');
    
    if (!attempts[quizType]) {
        attempts[quizType] = [];
    }
    
    // Add new attempt
    attempts[quizType].push({
        score: score,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 attempts
    if (attempts[quizType].length > 10) {
        attempts[quizType] = attempts[quizType].slice(-10);
    }
    
    localStorage.setItem('quiz-attempts', JSON.stringify(attempts));
}

/**
 * Lazy Loading for Images
 * Improves page load performance by loading images only when they're about to enter the viewport
 */
function setupLazyLoading() {
    // Check if Intersection Observer API is supported
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    
                    // Optional: Load higher resolution image if available
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                    }
                    
                    // Add a fade-in animation
                    img.classList.add('fade-in');
                    
                    // Remove from observation after loading
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
        
    } else {
        // Fallback for browsers that don't support Intersection Observer
        // Simple scroll-based lazy loading
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        function lazyLoadImages() {
            const windowHeight = window.innerHeight;
            
            lazyImages.forEach(img => {
                const rect = img.getBoundingClientRect();
                const inView = rect.top <= windowHeight + 100 && rect.bottom >= 0;
                
                if (inView && !img.src) {
                    img.src = img.dataset.src;
                    
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                    }
                    
                    img.classList.add('fade-in');
                }
            });
        }
        
        // Initial check
        lazyLoadImages();
        
        // Add event listener for scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            // Throttle the scroll event
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    lazyLoadImages();
                    scrollTimeout = null;
                }, 100);
            }
        });
    }
}