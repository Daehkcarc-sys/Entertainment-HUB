/**
 * Audio Player JavaScript
 * 
 * Custom audio player implementation for the website
 */

class AudioPlayer {
    constructor(selector) {
        // Find the audio player container
        this.container = document.querySelector(selector);
        if (!this.container) return;
        
        // Find audio element
        this.audio = this.container.querySelector('audio');
        if (!this.audio) {
            // Create audio element if it doesn't exist
            this.audio = document.createElement('audio');
            this.container.appendChild(this.audio);
        }
        
        // Get UI elements
        this.playBtn = this.container.querySelector('.audio-play');
        this.pauseBtn = this.container.querySelector('.audio-pause');
        this.prevBtn = this.container.querySelector('.audio-prev');
        this.nextBtn = this.container.querySelector('.audio-next');
        this.progress = this.container.querySelector('.audio-progress');
        this.progressBar = this.container.querySelector('.audio-progress-bar');
        this.currentTime = this.container.querySelector('.audio-time-current');
        this.totalTime = this.container.querySelector('.audio-time-total');
        this.volumeControl = this.container.querySelector('.audio-volume');
        this.volumeButton = this.container.querySelector('.audio-volume-btn');
        this.trackTitle = this.container.querySelector('.audio-track-title');
        this.trackArtist = this.container.querySelector('.audio-track-artist');
        this.trackCover = this.container.querySelector('.audio-cover');
        
        // Set up state
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.playlist = [];
        
        // Bind methods
        this.togglePlay = this.togglePlay.bind(this);
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.prevTrack = this.prevTrack.bind(this);
        this.nextTrack = this.nextTrack.bind(this);
        this.updateProgress = this.updateProgress.bind(this);
        this.setProgress = this.setProgress.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.toggleMute = this.toggleMute.bind(this);
        this.loadTrack = this.loadTrack.bind(this);
        
        // Initialize
        this.init();
    }
    
    init() {
        // Add event listeners
        if (this.playBtn) {
            this.playBtn.addEventListener('click', this.play);
        }
        
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', this.pause);
        }
        
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', this.prevTrack);
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', this.nextTrack);
        }
        
        if (this.progress) {
            this.progress.addEventListener('click', this.setProgress);
        }
        
        if (this.volumeControl) {
            this.volumeControl.addEventListener('input', this.setVolume);
        }
        
        if (this.volumeButton) {
            this.volumeButton.addEventListener('click', this.toggleMute);
        }
        
        // Audio event listeners
        this.audio.addEventListener('timeupdate', this.updateProgress);
        this.audio.addEventListener('ended', this.nextTrack);
        this.audio.addEventListener('canplay', () => {
            this.totalTime.textContent = this.formatTime(this.audio.duration);
        });
        
        // Set default volume
        this.audio.volume = 0.7;
        if (this.volumeControl) {
            this.volumeControl.value = this.audio.volume * 100;
        }
        
        // Find music on the page
        this.findMusicOnPage();
    }
    
    findMusicOnPage() {
        // Find all audio links on the page with data-audio-title attribute
        const audioLinks = document.querySelectorAll('[data-audio-track]');
        
        audioLinks.forEach(link => {
            const trackUrl = link.getAttribute('href') || link.getAttribute('data-audio-src');
            const trackTitle = link.getAttribute('data-audio-title') || 'Unknown Title';
            const trackArtist = link.getAttribute('data-audio-artist') || 'Unknown Artist';
            const trackCover = link.getAttribute('data-audio-cover') || 'images/default-audio-cover.jpg';
            
            if (trackUrl) {
                this.playlist.push({
                    url: trackUrl,
                    title: trackTitle,
                    artist: trackArtist,
                    cover: trackCover
                });
                
                // Add click event listener
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Find the index of this track
                    const trackIndex = this.playlist.findIndex(track => track.url === trackUrl);
                    if (trackIndex !== -1) {
                        this.currentTrackIndex = trackIndex;
                        this.loadTrack(this.currentTrackIndex);
                        this.play();
                    }
                });
            }
        });
        
        // Load first track if playlist has tracks
        if (this.playlist.length > 0) {
            this.loadTrack(0);
        }
    }
    
    loadTrack(index) {
        // Ensure index is within bounds
        if (index < 0) index = this.playlist.length - 1;
        if (index >= this.playlist.length) index = 0;
        
        this.currentTrackIndex = index;
        
        // Set audio source
        const track = this.playlist[index];
        this.audio.src = track.url;
        
        // Update track info
        if (this.trackTitle) {
            this.trackTitle.textContent = track.title;
        }
        
        if (this.trackArtist) {
            this.trackArtist.textContent = track.artist;
        }
        
        if (this.trackCover) {
            this.trackCover.src = track.cover;
        }
        
        // Reset time display
        if (this.currentTime) {
            this.currentTime.textContent = '0:00';
        }
        
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        this.audio.play();
        this.isPlaying = true;
        
        // Update UI
        if (this.playBtn) this.playBtn.style.display = 'none';
        if (this.pauseBtn) this.pauseBtn.style.display = 'inline-block';
        
        // Add playing class to container
        this.container.classList.add('playing');
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        
        // Update UI
        if (this.playBtn) this.playBtn.style.display = 'inline-block';
        if (this.pauseBtn) this.pauseBtn.style.display = 'none';
        
        // Remove playing class from container
        this.container.classList.remove('playing');
    }
    
    prevTrack() {
        this.loadTrack(this.currentTrackIndex - 1);
        
        // If it was playing, continue playing the previous track
        if (this.isPlaying) {
            this.play();
        }
    }
    
    nextTrack() {
        this.loadTrack(this.currentTrackIndex + 1);
        
        // If it was playing, continue playing the next track
        if (this.isPlaying) {
            this.play();
        }
    }
    
    updateProgress() {
        if (!this.audio.duration) return;
        
        // Calculate current progress percentage
        const progressPercent = (this.audio.currentTime / this.audio.duration) * 100;
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${progressPercent}%`;
        }
        
        // Update current time display
        if (this.currentTime) {
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    setProgress(e) {
        // Calculate click position as a percentage of the total width
        const width = this.progress.clientWidth;
        const clickX = e.offsetX;
        const percentage = (clickX / width);
        
        // Set the current time of audio based on the percentage
        this.audio.currentTime = this.audio.duration * percentage;
    }
    
    setVolume() {
        const value = this.volumeControl.value / 100;
        this.audio.volume = value;
        
        // Update volume icon based on level
        if (this.volumeButton) {
            const volumeIcon = this.volumeButton.querySelector('i');
            if (volumeIcon) {
                if (value === 0) {
                    volumeIcon.className = 'fas fa-volume-mute';
                } else if (value < 0.5) {
                    volumeIcon.className = 'fas fa-volume-down';
                } else {
                    volumeIcon.className = 'fas fa-volume-up';
                }
            }
        }
    }
    
    toggleMute() {
        this.audio.muted = !this.audio.muted;
        
        // Update volume icon
        if (this.volumeButton) {
            const volumeIcon = this.volumeButton.querySelector('i');
            if (volumeIcon) {
                if (this.audio.muted) {
                    volumeIcon.className = 'fas fa-volume-mute';
                } else {
                    if (this.audio.volume < 0.5) {
                        volumeIcon.className = 'fas fa-volume-down';
                    } else {
                        volumeIcon.className = 'fas fa-volume-up';
                    }
                }
            }
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    /**
     * Public methods for external control
     */
    
    // Add a track to the playlist
    addTrack(trackData) {
        this.playlist.push(trackData);
    }
    
    // Load and play a specific track from the playlist by index
    playTrack(index) {
        this.loadTrack(index);
        this.play();
    }
    
    // Toggle shuffle mode
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        // Implementation for shuffle playback would go here
    }
    
    // Toggle repeat mode
    toggleRepeat() {
        // Cycle through repeat modes: no-repeat -> repeat-all -> repeat-one
        if (!this.repeatMode) {
            this.repeatMode = 'all';
        } else if (this.repeatMode === 'all') {
            this.repeatMode = 'one';
        } else {
            this.repeatMode = null;
        }
        
        // Implementation for repeat playback would go here
    }
}

// Initialize audio player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main audio player
    window.audioPlayer = new AudioPlayer('#audioPlayer');
    
    // Add keyboard controls for the audio player
    document.addEventListener('keydown', (e) => {
        // Only if no input/textarea is focused
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            
            // Space - Play/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                window.audioPlayer.togglePlay();
            }
            
            // Arrow Right - Next Track
            else if (e.code === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                window.audioPlayer.nextTrack();
            }
            
            // Arrow Left - Previous Track
            else if (e.code === 'ArrowLeft' && e.ctrlKey) {
                e.preventDefault();
                window.audioPlayer.prevTrack();
            }
            
            // Arrow Up - Volume Up
            else if (e.code === 'ArrowUp' && e.ctrlKey) {
                e.preventDefault();
                if (window.audioPlayer.volumeControl) {
                    window.audioPlayer.volumeControl.value = Math.min(100, parseInt(window.audioPlayer.volumeControl.value) + 10);
                    window.audioPlayer.setVolume();
                }
            }
            
            // Arrow Down - Volume Down
            else if (e.code === 'ArrowDown' && e.ctrlKey) {
                e.preventDefault();
                if (window.audioPlayer.volumeControl) {
                    window.audioPlayer.volumeControl.value = Math.max(0, parseInt(window.audioPlayer.volumeControl.value) - 10);
                    window.audioPlayer.setVolume();
                }
            }
            
            // M - Mute/Unmute
            else if (e.code === 'KeyM') {
                e.preventDefault();
                window.audioPlayer.toggleMute();
            }
        }
    });
});