/**
 * Entertainment Hub - Page Connectivity Script
 * Improves navigation, adds dynamic links between pages, and enhances user experience
 */

class PageConnectivity {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    /**
     * Initialize connectivity features
     */
    init() {
        this.highlightCurrentNavItem();
        this.setupContextualLinks();
        this.setupBackLinks();
        this.setupRelatedContent();
        this.setupBreadcrumbs();
    }

    /**
     * Get current page name from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split("/").pop();
        return page || "index.html";
    }

    /**
     * Highlight current page in navigation
     */
    highlightCurrentNavItem() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === this.currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Set up contextual links based on content
     */
    setupContextualLinks() {
        // Find elements that should link to related content
        const contentItems = document.querySelectorAll('.carousel-item, .review-card, .featured-item');
        
        contentItems.forEach(item => {
            const type = this.getContentType(item);
            const id = this.getContentId(item);
            
            if (type && id) {
                const links = item.querySelectorAll('a:not([href]), .carousel-caption h3, .carousel-image');
                links.forEach(link => {
                    if (!link.hasAttribute('href')) {
                        link.style.cursor = 'pointer';
                        link.addEventListener('click', () => {
                            window.location.href = this.buildContentLink(type, id);
                        });
                    }
                });
            }
        });
    }

    /**
     * Get content type based on element classes and context
     */
    getContentType(element) {
        if (element.classList.contains('movie') || element.querySelector('.carousel-badge')?.textContent === 'Movie') {
            return 'movie';
        } else if (element.classList.contains('anime') || element.querySelector('.carousel-badge')?.textContent === 'Anime') {
            return 'anime';
        } else if (element.classList.contains('manga') || element.querySelector('.carousel-badge')?.textContent === 'Manga') {
            return 'manga';
        } else if (element.classList.contains('series') || element.querySelector('.carousel-badge')?.textContent === 'Series') {
            return 'series';
        } else if (element.classList.contains('game') || element.querySelector('.carousel-badge')?.textContent === 'Game') {
            return 'game';
        }
        
        // Try to infer from images or text content
        const img = element.querySelector('img');
        const title = element.querySelector('h3')?.textContent.toLowerCase() || '';
        
        if (img) {
            const imgSrc = img.getAttribute('src').toLowerCase();
            if (imgSrc.includes('movie') || title.includes('movie')) {
                return 'movie';
            } else if (imgSrc.includes('anime') || title.includes('anime')) {
                return 'anime';
            } else if (imgSrc.includes('manga') || title.includes('manga')) {
                return 'manga';
            } else if (imgSrc.includes('series') || title.includes('series') || title.includes('season')) {
                return 'series';
            } else if (imgSrc.includes('game') || title.includes('game')) {
                return 'game';
            }
        }
        
        return null;
    }

    /**
     * Extract content ID from element
     */
    getContentId(element) {
        // Try to get from data attribute
        if (element.dataset.id) {
            return element.dataset.id;
        }
        
        // Try to extract from title
        const title = element.querySelector('h3')?.textContent;
        if (title) {
            return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        
        return null;
    }

    /**
     * Build link to content page
     */
    buildContentLink(type, id) {
        switch (type) {
            case 'movie':
                return `movies.html?id=${id}`;
            case 'anime':
                return `anime.html?id=${id}`;
            case 'manga':
                return `manga.html?id=${id}`;
            case 'series':
                return `series.html?id=${id}`;
            case 'game':
                return `games.html?id=${id}`;
            default:
                return '#';
        }
    }

    /**
     * Set up back links for detail pages
     */
    setupBackLinks() {
        const isDetailPage = window.location.search.includes('id=');
        
        if (isDetailPage) {
            // Create back button if it doesn't exist
            if (!document.querySelector('.back-link')) {
                const container = document.querySelector('main > .container') || document.querySelector('main');
                
                if (container) {
                    const backLink = document.createElement('a');
                    backLink.className = 'back-link';
                    backLink.innerHTML = '<i class="fas fa-arrow-left"></i> Back to list';
                    backLink.href = this.getParentPage();
                    
                    container.insertBefore(backLink, container.firstChild);
                }
            }
        }
    }

    /**
     * Get parent page for current detail page
     */
    getParentPage() {
        const pageName = this.currentPage.split('?')[0];
        return pageName; // Already points to the list page
    }

    /**
     * Set up related content section on detail pages
     */
    setupRelatedContent() {
        const isDetailPage = window.location.search.includes('id=');
        
        if (isDetailPage) {
            const contentId = new URLSearchParams(window.location.search).get('id');
            const contentType = this.getCurrentContentType();
            
            if (contentId && contentType) {
                this.loadRelatedContent(contentType, contentId);
            }
        }
    }

    /**
     * Get current content type based on page name
     */
    getCurrentContentType() {
        const page = this.currentPage.split('?')[0].replace('.html', '');
        
        switch (page) {
            case 'movies':
                return 'movie';
            case 'anime':
                return 'anime';
            case 'manga':
                return 'manga';
            case 'series':
                return 'series';
            case 'games':
                return 'game';
            default:
                return null;
        }
    }

    /**
     * Load related content for detail pages
     */
    loadRelatedContent(type, id) {
        // In a real implementation, this would fetch related content from an API
        // For now, we'll just create a placeholder section
        
        const mainElement = document.querySelector('main');
        if (!mainElement || document.querySelector('.related-content')) {
            return;
        }
        
        const relatedSection = document.createElement('section');
        relatedSection.className = 'related-content';
        
        relatedSection.innerHTML = `
            <div class="container">
                <h2>Related Content</h2>
                <div class="related-items">
                    <p>Related ${type}s would appear here based on user preferences and content similarity.</p>
                </div>
            </div>
        `;
        
        mainElement.appendChild(relatedSection);
    }

    /**
     * Set up breadcrumbs for easier navigation
     */
    setupBreadcrumbs() {
        const isDetailPage = window.location.search.includes('id=');
        const headerElement = document.querySelector('header');
        
        if (!headerElement || document.querySelector('.breadcrumb')) {
            return;
        }
        
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.innerHTML = `<div class="container"><ul><li><a href="index.html">Home</a></li>`;
        
        if (this.currentPage !== 'index.html') {
            const pageTitle = this.getPageTitle();
            const pageName = this.currentPage.split('?')[0];
            
            breadcrumb.innerHTML += `<li><a href="${pageName}">${pageTitle}</a></li>`;
            
            if (isDetailPage) {
                const contentId = new URLSearchParams(window.location.search).get('id');
                const contentName = this.formatContentName(contentId);
                breadcrumb.innerHTML += `<li>${contentName}</li>`;
            }
        }
        
        breadcrumb.innerHTML += `</ul></div>`;
        headerElement.after(breadcrumb);
    }

    /**
     * Get readable page title based on filename
     */
    getPageTitle() {
        const pageName = this.currentPage.split('?')[0].replace('.html', '');
        return pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }

    /**
     * Format content ID into readable name
     */
    formatContentName(contentId) {
        if (!contentId) return '';
        return contentId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.PageConnectivity = new PageConnectivity();
});