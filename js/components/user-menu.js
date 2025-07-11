/**
 * Simple User Menu Toggle Functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Direct implementation for user menu dropdown
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userDropdown = document.querySelector('.user-dropdown');
    
    // Only proceed if we have both elements
    if (userMenuToggle && userDropdown) {
        // Toggle dropdown directly when clicking the toggle button
        userMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Check if dropdown is currently visible
            const isVisible = userDropdown.style.display === 'block';
            
            // Toggle the dropdown visibility
            userDropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            // If dropdown is open and click was outside the user menu
            if (userDropdown.style.display === 'block' && !e.target.closest('.user-menu')) {
                userDropdown.style.display = 'none';
            }
        });
        
        // Don't close dropdown when clicking inside it
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    console.log('User menu functionality loaded successfully');
});
