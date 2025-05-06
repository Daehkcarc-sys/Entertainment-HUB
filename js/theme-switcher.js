/**
 * Theme Switcher for Entertainment Hub
 * Handles dark/light mode toggle and persists user preference
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get theme elements
    const body = document.body;
    let themeToggle = document.getElementById('theme-toggle');
    
    // Create theme toggle button if it doesn't exist
    if (!themeToggle) {
        themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle dark mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        
        // Add to the document
        const header = document.querySelector('.site-header .container');
        if (header) {
            // Add to header actions if they exist
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                headerActions.appendChild(themeToggle);
            } else {
                header.appendChild(themeToggle);
            }
        } else {
            document.body.appendChild(themeToggle);
        }
    }
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply theme based on preference
    if (savedTheme) {
        body.dataset.theme = savedTheme;
        updateThemeIcon(savedTheme);
    } else if (prefersDarkScheme) {
        body.dataset.theme = 'dark';
        updateThemeIcon('dark');
    } else {
        body.dataset.theme = 'light';
        updateThemeIcon('light');
    }
    
    // Listen for theme toggle click
    themeToggle.addEventListener('click', () => {
        const currentTheme = body.dataset.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Show toast notification
        showThemeChangeToast(newTheme);
    });
    
    // Function to update theme icon
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
        
        // Add smooth transition for the icon
        icon.style.transition = 'transform 0.5s ease';
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            icon.style.transform = '';
        }, 500);
    }
    
    // Function to show theme change toast
    function showThemeChangeToast(theme) {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast message
        const toast = document.createElement('div');
        toast.className = 'toast animate-in';
        toast.classList.add(theme === 'dark' ? 'toast-dark' : 'toast-light');
        
        // Set message content
        const message = theme === 'dark' 
            ? '<i class="fas fa-moon"></i> Dark mode enabled' 
            : '<i class="fas fa-sun"></i> Light mode enabled';
            
        toast.innerHTML = message;
        
        // Add toast to container
        toastContainer.appendChild(toast);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.add('animate-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) { // Only if user hasn't set a preference
            const newTheme = e.matches ? 'dark' : 'light';
            body.dataset.theme = newTheme;
            updateThemeIcon(newTheme);
        }
    });
});