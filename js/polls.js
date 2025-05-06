/**
 * Entertainment Hub - Polls & Contests
 * Handles polls and contests functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initializePolls();
});

function initializePolls() {
  // Initialize poll forms
  initializePollForms();
  
  // Initialize contest entries
  initializeContestEntries();
}

// Initialize poll forms
function initializePollForms() {
  const pollForms = document.querySelectorAll('section.polls form');
  
  pollForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get selected option
      const selectedOption = form.querySelector('input[type="radio"]:checked');
      
      if (selectedOption) {
        // Get poll title
        const pollTitle = form.closest('article').querySelector('h3').textContent;
        
        // Show success message
        window.EntertainmentHub.showToast(`Vote for "${selectedOption.value}" in "${pollTitle}" recorded!`, 'success');
        
        // Disable form
        form.querySelectorAll('input[type="radio"]').forEach(input => {
          input.disabled = true;
        });
        
        form.querySelector('button[type="submit"]').disabled = true;
        
        // Show results
        showPollResults(form);
      } else {
        // Show error message
        window.EntertainmentHub.showToast('Please select an option before voting', 'error');
      }
    });
  });
}

// Show poll results
function showPollResults(form) {
  // Create results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'poll-results';
  
  // Generate random results (in a real app, this would come from the server)
  const options = form.querySelectorAll('input[type="radio"]');
  const totalVotes = Math.floor(Math.random() * 1000) + 500;
  
  let resultsHTML = `<h4>Results (${totalVotes} votes)</h4>`;
  
  options.forEach((option, index) => {
    // Generate random percentage for each option
    const percentage = Math.floor(Math.random() * 100) / 100;
    const votes = Math.floor(totalVotes * percentage);
    const percentDisplay = Math.round(percentage * 100);
    
    // Highlight selected option
    const isSelected = option.checked;
    const optionClass = isSelected ? 'selected-option' : '';
    
    resultsHTML += `
      <div class="result-item ${optionClass}">
        <div class="result-label">${option.value}</div>
        <div class="result-bar-container">
          <div class="result-bar" style="width: ${percentDisplay}%"></div>
          <span class="result-percentage">${percentDisplay}%</span>
        </div>
        <div class="result-votes">${votes} votes</div>
      </div>
    `;
  });
  
  // Add results to container
  resultsContainer.innerHTML = resultsHTML;
  
  // Add to DOM after the form
  form.parentNode.insertBefore(resultsContainer, form.nextSibling);
}

// Initialize contest entries
function initializeContestEntries() {
  const contestLinks = document.querySelectorAll('section.contests li');
  
  contestLinks.forEach(link => {
    link.addEventListener('click', function() {
      const contestName = this.textContent;
      
      // In a real app, this would navigate to the contest page
      // For demo purposes, we'll just show a toast
      window.EntertainmentHub.showToast(`Viewing contest: ${contestName}`, 'info');
    });
  });
}
