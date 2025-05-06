/**
 * Entertainment Hub - Manga
 * Handles manga page functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeMangaPage();
});

function initializeMangaPage() {
  // Initialize manga tabs
  initializeMangaTabs();
  
  // Initialize manga filters
  initializeMangaFilters();
  
  // Initialize reading list buttons
  initializeReadingListButtons();
  
  // Initialize manga quiz
  initializeMangaQuiz();
  
  // Initialize genre cards
  initializeGenreCards();
}

// Initialize manga tabs
function initializeMangaTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
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
      }
    });
  });
}

// Initialize manga filters
function initializeMangaFilters() {
  const statusFilter = document.getElementById('status-filter');
  const demographicFilter = document.getElementById('demographic-filter');
  const sortManga = document.getElementById('sort-manga');
  
  // Status filter
  if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
  }
  
  // Demographic filter
  if (demographicFilter) {
    demographicFilter.addEventListener('change', applyFilters);
  }
  
  // Sort select
  if (sortManga) {
    sortManga.addEventListener('change', applyFilters);
  }
  
  // Apply filters
  function applyFilters() {
    // In a real app, this would filter the manga
    // For demo purposes, we'll just show a toast
    window.EntertainmentHub.showToast('Filters applied!', 'success');
  }
}

// Initialize reading list buttons
function initializeReadingListButtons() {
  const readingListButtons = document.querySelectorAll('.add-wishlist, .action-button[data-id]');
  
  readingListButtons.forEach(button => {
    const mangaId = button.dataset.id;
    
    if (!mangaId) return;
    
    // Check if manga is already in reading list
    const readingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    const isInReadingList = readingList.some(item => item.id === mangaId);
    
    // Update button state
    if (isInReadingList) {
      button.classList.add('added');
      if (button.classList.contains('btn')) {
        button.innerHTML = '<i class="fas fa-check"></i> Added';
      } else {
        button.innerHTML = '<i class="fas fa-bookmark"></i>';
      }
    }
    
    // Add click event
    button.addEventListener('click', function() {
      toggleReadingList(this, mangaId);
    });
  });
}

// Toggle reading list
function toggleReadingList(button, mangaId) {
  // Get current reading list
  const readingList = JSON.parse(localStorage.getItem('readingList') || '[]');
  const isInReadingList = readingList.some(item => item.id === mangaId);
  
  if (isInReadingList) {
    // Remove from reading list
    const newReadingList = readingList.filter(item => item.id !== mangaId);
    localStorage.setItem('readingList', JSON.stringify(newReadingList));
    
    // Update button
    button.classList.remove('added');
    if (button.classList.contains('btn')) {
      button.innerHTML = 'Add to Reading List';
    } else {
      button.innerHTML = '<i class="far fa-bookmark"></i>';
    }
    
    // Show toast
    window.EntertainmentHub.showToast('Removed from reading list', 'info');
  } else {
    // Add to reading list
    const newItem = {
      id: mangaId,
      type: 'manga',
      dateAdded: new Date().toISOString()
    };
    
    readingList.push(newItem);
    localStorage.setItem('readingList', JSON.stringify(readingList));
    
    // Update button
    button.classList.add('added');
    if (button.classList.contains('btn')) {
      button.innerHTML = '<i class="fas fa-check"></i> Added';
    } else {
      button.innerHTML = '<i class="fas fa-bookmark"></i>';
    }
    
    // Show toast
    window.EntertainmentHub.showToast('Added to reading list', 'success');
  }
}

// Initialize manga quiz
function initializeMangaQuiz() {
  const quizForm = document.querySelector('.quiz-container');
  const currentQuestion = document.getElementById('current-question');
  const prevQuestionBtn = document.getElementById('prev-question');
  const nextQuestionBtn = document.getElementById('next-question');
  const quizQuestions = document.querySelectorAll('.quiz-question');
  const quizResults = document.querySelector('.quiz-results');
  const quizScore = document.getElementById('quiz-score');
  const retryQuizBtn = document.getElementById('retry-quiz');
  
  if (!quizForm) return;
  
  let currentQuestionIndex = 0;
  let answers = [];
  
  // Initialize quiz
  updateQuizState();
  
  // Add event listeners
  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuizState();
      }
    });
  }
  
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', () => {
      // Save current answer
      const selectedOption = quizQuestions[currentQuestionIndex].querySelector('input:checked');
      answers[currentQuestionIndex] = selectedOption ? selectedOption.value : null;
      
      if (currentQuestionIndex < quizQuestions.length - 1) {
        // Go to next question
        currentQuestionIndex++;
        updateQuizState();
      } else {
        // Show results
        showQuizResults();
      }
    });
  }
  
  if (retryQuizBtn) {
    retryQuizBtn.addEventListener('click', () => {
      // Reset quiz
      currentQuestionIndex = 0;
      answers = [];
      
      // Reset form
      quizForm.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
      });
      
      // Hide results, show questions
      if (quizResults) quizResults.classList.add('hidden');
      quizQuestions.forEach(question => {
        question.classList.remove('active');
      });
      
      // Show first question
      if (quizQuestions[0]) quizQuestions[0].classList.add('active');
      
      // Update state
      updateQuizState();
    });
  }
  
  // Update quiz state
  function updateQuizState() {
    // Update current question display
    if (currentQuestion) {
      currentQuestion.textContent = currentQuestionIndex + 1;
    }
    
    // Update active question
    quizQuestions.forEach((question, index) => {
      if (index === currentQuestionIndex) {
        question.classList.add('active');
      } else {
        question.classList.remove('active');
      }
    });
    
    // Update button states
    if (prevQuestionBtn) {
      prevQuestionBtn.disabled = currentQuestionIndex === 0;
    }
    
    if (nextQuestionBtn) {
      nextQuestionBtn.textContent = currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next';
    }
    
    // Restore saved answer if any
    if (answers[currentQuestionIndex]) {
      const savedOption = quizQuestions[currentQuestionIndex].querySelector(`input[value="${answers[currentQuestionIndex]}"]`);
      if (savedOption) savedOption.checked = true;
    }
    
    // Update progress bar
    const progressBar = document.querySelector('.quiz-progress .progress');
    if (progressBar) {
      const progressPercent = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
      progressBar.style.width = `${progressPercent}%`;
    }
  }
  
  // Show quiz results
  function showQuizResults() {
    // Calculate score
    const correctAnswers = [
      'akira-toriyama', // Q1: Which manga artist created Dragon Ball?
      'parasite'        // Q2: Which film won the Academy Award for Best Picture in 2020?
    ];
    
    let score = 0;
    answers.forEach((answer, index) => {
      if (answer === correctAnswers[index]) score++;
    });
    
    // Update score display
    if (quizScore) {
      quizScore.textContent = score;
    }
    
    // Hide questions, show results
    quizQuestions.forEach(question => {
      question.classList.remove('active');
    });
    
    if (quizResults) {
      quizResults.classList.remove('hidden');
    }
    
    // Show toast with score
    window.EntertainmentHub.showToast(`Quiz complete! You scored ${score}/${quizQuestions.length}`, 'success');
  }
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
      window.EntertainmentHub.showToast(`Browsing ${genre} manga`, 'info');
    });
  });
}
