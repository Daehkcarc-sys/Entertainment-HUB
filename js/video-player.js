/**
 * Video Player JavaScript
 * 
 * This script handles the video player functionality for the games page
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeVideoPlayer();
});

/**
 * Initialize the video player with all functionality
 */
function initializeVideoPlayer() {
    const videoElement = document.getElementById('featured-gameplay');
    
    // Exit if video element doesn't exist
    if (!videoElement) return;
    
    const fullscreenBtn = document.getElementById('fullscreen-video');
    const pipBtn = document.getElementById('picture-in-picture');
    const shareBtn = document.getElementById('share-video');
    
    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', () => {
        if (videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
        } else if (videoElement.webkitRequestFullscreen) { /* Safari */
            videoElement.webkitRequestFullscreen();
        } else if (videoElement.msRequestFullscreen) { /* IE11 */
            videoElement.msRequestFullscreen();
        }
    });
    
    // Picture-in-Picture functionality
    pipBtn.addEventListener('click', () => {
        if (document.pictureInPictureEnabled && !videoElement.disablePictureInPicture) {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else {
                videoElement.requestPictureInPicture()
                    .catch(error => {
                        console.error('Error attempting to enable picture-in-picture mode:', error);
                    });
            }
        } else {
            alert('Picture-in-Picture is not supported in your browser');
        }
    });
    
    // Share functionality
    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'Awesome Gaming Content',
                text: 'Check out this amazing gameplay video!',
                url: window.location.href,
            })
            .catch(error => {
                console.log('Error sharing:', error);
                showShareFallback();
            });
        } else {
            showShareFallback();
        }
    });
    
    // Add video event listeners
    videoElement.addEventListener('play', () => {
        console.log('Video started playing');
    });
    
    videoElement.addEventListener('pause', () => {
        console.log('Video paused');
    });
    
    // Handle video errors
    videoElement.addEventListener('error', (e) => {
        console.error('Video error:', e);
        const videoContainer = videoElement.closest('.video-wrapper');
        if (videoContainer) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'video-error';
            errorMsg.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Video playback error. Please try again later.</p>
            `;
            videoContainer.appendChild(errorMsg);
        }
    });
}

/**
 * Fallback for browsers that don't support the Web Share API
 */
function showShareFallback() {
    // Create a temporary input to copy the URL
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = window.location.href;
    document.body.appendChild(input);
    input.select();
    
    try {
        // Copy the URL
        document.execCommand('copy');
        alert('Link copied to clipboard! You can now share it manually.');
    } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Couldn\'t copy the link automatically. Please copy the URL from your address bar.');
    }
    
    document.body.removeChild(input);
}