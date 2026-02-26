/**
 * VIHIGA TIMES - MAIN JAVASCRIPT
 * Production-Ready Version with Navigation Fixes
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    headerScrollThreshold: 80,
    slideDuration: 5000, // 5 seconds for better UX
    scrollOffset: 100,
    swipeThreshold: 50,
    autoScrollInterval: 5000,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const utils = {
    /**
     * Throttle function execution
     */
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Debounce function execution
     */
    debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },

    /**
     * Get current page path relative to root
     */
    getCurrentPath() {
      return window.location.pathname.replace(/\/$/, '') || '/';
    },

    /**
     * Normalize path for comparison
     */
    normalizePath(path) {
      return path.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
    },

    /**
     * Check if element exists in DOM
     */
    isElementInDOM(element) {
      return element && document.contains(element);
    }
  };

  // ============================================
  // NAVIGATION ACTIVE STATE MANAGER
  // ============================================
  const NavigationManager = {
    init() {
      this.highlightCurrentPage();
      this.setupMobileNavCloseHandlers();
    },

    /**
     * Highlight current page in navigation
     */
    highlightCurrentPage() {
      const currentPath = utils.normalizePath(utils.getCurrentPath());
      const navLinks = document.querySelectorAll('.nav-link, .mobile-nav__link');
      
      navLinks.forEach(link => {
        try {
          const linkUrl = new URL(link.href, window.location.origin);
          const linkPath = utils.normalizePath(linkUrl.pathname);
          
          // Exact match or parent category match (for article pages)
          if (currentPath === linkPath || 
              (currentPath.startsWith(linkPath) && linkPath !== '/')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        } catch (e) {
          // Invalid URL, skip
          console.warn('Invalid navigation URL:', link.href);
        }
      });
    },

    /**
     * Setup mobile nav close on link click and escape key
     */
    setupMobileNavCloseHandlers() {
      const mobileNav = document.querySelector('.mobile-nav');
      const menuToggle = document.querySelector('.menu-toggle');
      const mobileOverlay = document.querySelector('.mobile-overlay');
      
      if (!mobileNav || !menuToggle) return;

      // Close on link click
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          this.closeMobileMenu(menuToggle, mobileNav, mobileOverlay);
        });
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
          this.closeMobileMenu(menuToggle, mobileNav, mobileOverlay);
          menuToggle.focus(); // Return focus to toggle button
        }
      });
    },

    closeMobileMenu(toggle, nav, overlay) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('mobile-nav--active');
      if (overlay) overlay.classList.remove('mobile-overlay--active');
      document.body.style.overflow = '';
    }
  };

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  const SearchManager = {
    // Map search terms to section selectors (not IDs)
    searchMappings: {
      'local': '.category-section:has(#local-news-heading)',
      'local news': '.category-section:has(#local-news-heading)',
      'national': '.category-section:has(#national-heading)',
      'crime': '.category-section:has(#crime-heading)',
      'safety': '.category-section:has(#crime-heading)',
      'business': '.category-section:has(#business-heading)',
      'hustle': '.category-section:has(#business-heading)',
      'entertainment': '.category-section:has(#entertainment-heading)',
      'culture': '.category-section:has(#entertainment-heading)',
      'fashion': '.category-section:has(#fashion-heading)',
      'tech': '.category-section:has(#tech-heading)',
      'technology': '.category-section:has(#tech-heading)',
      'talent': '.category-section:has(#talent-heading)',
      'events': '.category-section:has(#events-heading)',
      'youth': '.category-section:has(#youth-heading)',
      'lifestyle': '.category-section:has(#youth-heading)',
      'trending': '.trending-picks',
      'latest': '.latest-stories',
      'stories': '.latest-stories'
    },

    init() {
      this.initDesktopSearch();
      this.initMobileSearch();
    },

    initDesktopSearch() {
      const searchForms = document.querySelectorAll('.search-form');
      
      searchForms.forEach(form => {
        const input = form.querySelector('.search-input');
        const errorEl = form.querySelector('.search-error');
        
        if (!input) return;

        // Handle form submission
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSearch(input.value.trim(), errorEl);
        });

        // Clear error on input
        input.addEventListener('input', () => {
          this.hideError(errorEl);
        });

        // Handle Enter key explicitly
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleSearch(input.value.trim(), errorEl);
          }
        });
      });
    },

    initMobileSearch() {
      const searchToggle = document.querySelector('.header__search-toggle');
      const searchContainer = document.querySelector('.header__search');
      
      if (!searchToggle || !searchContainer) return;
      
      searchToggle.addEventListener('click', () => {
        const isActive = searchContainer.classList.toggle('header__search--active');
        searchToggle.setAttribute('aria-expanded', isActive);
        
        if (isActive) {
          const input = searchContainer.querySelector('.search-input');
          if (input) {
            setTimeout(() => input.focus(), 100);
          }
        }
      });

      // Close search when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target) && !searchToggle.contains(e.target)) {
          searchContainer.classList.remove('header__search--active');
          searchToggle.setAttribute('aria-expanded', 'false');
        }
      });
    },

    handleSearch(query, errorEl) {
      if (!query) return;
      
      const normalizedQuery = query.toLowerCase().trim();
      
      // Check for exact match first
      if (this.searchMappings[normalizedQuery]) {
        this.scrollToSection(this.searchMappings[normalizedQuery]);
        this.hideError(errorEl);
        return;
      }
      
      // Check for partial match
      for (const [key, selector] of Object.entries(this.searchMappings)) {
        if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
          this.scrollToSection(selector);
          this.hideError(errorEl);
          return;
        }
      }
      
      // Try to find any heading containing the query
      const headings = document.querySelectorAll('h2[id], h3[id]');
      for (const heading of headings) {
        if (heading.textContent.toLowerCase().includes(normalizedQuery)) {
          this.scrollToElement(heading);
          this.hideError(errorEl);
          return;
        }
      }
      
      // No match found
      this.showError(errorEl);
    },

    scrollToSection(selector) {
      const section = document.querySelector(selector);
      if (section) {
        this.scrollToElement(section);
      }
    },

    scrollToElement(element) {
      const header = document.querySelector('.header');
      const headerHeight = header ? header.offsetHeight : 80;
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
      const offset = elementTop - headerHeight - 20;
      
      window.scrollTo({
        top: Math.max(0, offset),
        behavior: CONFIG.reducedMotion ? 'auto' : 'smooth'
      });
    },

    showError(errorEl) {
      if (!errorEl) return;
      errorEl.classList.add('search-error--visible');
      errorEl.setAttribute('aria-live', 'assertive');
      
      setTimeout(() => this.hideError(errorEl), 3000);
    },

    hideError(errorEl) {
      if (!errorEl) return;
      errorEl.classList.remove('search-error--visible');
      errorEl.setAttribute('aria-live', 'polite');
    }
  };

  // ============================================
  // MOBILE NAVIGATION
  // ============================================
  const MobileNavManager = {
    init() {
      const menuToggle = document.querySelector('.menu-toggle');
      const mobileNav = document.querySelector('.mobile-nav');
      const mobileOverlay = document.querySelector('.mobile-overlay');
      
      if (!menuToggle || !mobileNav) {
        console.warn('Mobile navigation elements not found');
        return;
      }

      this.menuToggle = menuToggle;
      this.mobileNav = mobileNav;
      this.mobileOverlay = mobileOverlay;
      this.isOpen = false;

      // Toggle click handler
      menuToggle.addEventListener('click', () => this.toggle());

      // Overlay click handler
      if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => this.close());
      }

      // Close on resize to desktop
      window.addEventListener('resize', utils.debounce(() => {
        if (window.innerWidth > 1024 && this.isOpen) {
          this.close();
        }
      }, 250));

      // Trap focus within mobile nav when open
      this.setupFocusTrap();
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      this.isOpen = true;
      this.menuToggle.setAttribute('aria-expanded', 'true');
      this.mobileNav.classList.add('mobile-nav--active');
      if (this.mobileOverlay) {
        this.mobileOverlay.classList.add('mobile-overlay--active');
      }
      document.body.style.overflow = 'hidden';
      
      // Focus first link
      const firstLink = this.mobileNav.querySelector('a');
      if (firstLink) firstLink.focus();
    },

    close() {
      this.isOpen = false;
      this.menuToggle.setAttribute('aria-expanded', 'false');
      this.mobileNav.classList.remove('mobile-nav--active');
      if (this.mobileOverlay) {
        this.mobileOverlay.classList.remove('mobile-overlay--active');
      }
      document.body.style.overflow = '';
    },

    setupFocusTrap() {
      this.mobileNav.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || !this.isOpen) return;

        const focusableElements = this.mobileNav.querySelectorAll(
          'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      });
    }
  };

  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  const HeaderScrollManager = {
    init() {
      this.header = document.querySelector('.header');
      if (!this.header) return;

      this.ticking = false;
      this.lastScrollY = 0;

      // Use passive listener for performance
      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
      
      // Initial check
      this.updateHeader();
    },

    handleScroll() {
      this.lastScrollY = window.scrollY;
      
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.updateHeader();
          this.ticking = false;
        });
        this.ticking = true;
      }
    },

    updateHeader() {
      if (this.lastScrollY > CONFIG.headerScrollThreshold) {
        this.header.classList.add('header--scrolled');
      } else {
        this.header.classList.remove('header--scrolled');
      }
    }
  };

  // ============================================
  // HERO SLIDER
  // ============================================
  const HeroSliderManager = {
    init() {
      this.slider = document.querySelector('.hero-slider');
      if (!this.slider) return;

      this.slides = this.slider.querySelectorAll('.hero-slide');
      this.dots = this.slider.querySelectorAll('.hero-slider__dot');
      this.prevBtn = this.slider.querySelector('.hero-slider__arrow--prev');
      this.nextBtn = this.slider.querySelector('.hero-slider__arrow--next');
      this.progressBar = this.slider.querySelector('.hero-slider__progress-bar');

      if (this.slides.length === 0) return;

      this.currentSlide = 0;
      this.autoAdvanceTimer = null;
      this.isPaused = false;
      this.touchStartX = 0;
      this.touchEndX = 0;

      this.setupEventListeners();
      this.startAutoAdvance();
      this.updateSlideVisibility();
    },

    setupEventListeners() {
      // Navigation buttons
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => {
          this.prevSlide();
          this.resetAutoAdvance();
        });
      }

      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => {
          this.nextSlide();
          this.resetAutoAdvance();
        });
      }

      // Dots
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          this.goToSlide(index);
          this.resetAutoAdvance();
        });
      });

      // Touch/swipe support
      this.slider.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
        this.pauseAutoAdvance();
      }, { passive: true });

      this.slider.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
        this.resumeAutoAdvance();
      }, { passive: true });

      // Pause on hover (desktop)
      this.slider.addEventListener('mouseenter', () => this.pauseAutoAdvance());
      this.slider.addEventListener('mouseleave', () => this.resumeAutoAdvance());

      // Visibility API - pause when tab is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAutoAdvance();
        } else {
          this.resumeAutoAdvance();
        }
      });
    },

    goToSlide(index) {
      // Remove active states
      this.slides[this.currentSlide].classList.remove('hero-slide--active');
      this.slides[this.currentSlide].setAttribute('aria-hidden', 'true');
      
      if (this.dots[this.currentSlide]) {
        this.dots[this.currentSlide].classList.remove('hero-slider__dot--active');
        this.dots[this.currentSlide].setAttribute('aria-selected', 'false');
      }

      // Update index with wrapping
      this.currentSlide = index;
      if (this.currentSlide < 0) this.currentSlide = this.slides.length - 1;
      if (this.currentSlide >= this.slides.length) this.currentSlide = 0;

      // Add active states
      this.updateSlideVisibility();
      this.resetProgressBar();
    },

    updateSlideVisibility() {
      this.slides[this.currentSlide].classList.add('hero-slide--active');
      this.slides[this.currentSlide].setAttribute('aria-hidden', 'false');
      
      if (this.dots[this.currentSlide]) {
        this.dots[this.currentSlide].classList.add('hero-slider__dot--active');
        this.dots[this.currentSlide].setAttribute('aria-selected', 'true');
      }
    },

    nextSlide() {
      this.goToSlide(this.currentSlide + 1);
    },

    prevSlide() {
      this.goToSlide(this.currentSlide - 1);
    },

    resetProgressBar() {
      if (!this.progressBar || CONFIG.reducedMotion) return;
      
      this.progressBar.classList.remove('hero-slider__progress-bar--animating');
      this.progressBar.style.width = '0';
      
      // Force reflow
      void this.progressBar.offsetWidth;
      
      // Restart animation
      setTimeout(() => {
        if (!this.isPaused) {
          this.progressBar.classList.add('hero-slider__progress-bar--animating');
        }
      }, 50);
    },

    startAutoAdvance() {
      if (CONFIG.reducedMotion) return;
      this.resetProgressBar();
      this.autoAdvanceTimer = setInterval(() => this.nextSlide(), CONFIG.slideDuration);
    },

    stopAutoAdvance() {
      if (this.autoAdvanceTimer) {
        clearInterval(this.autoAdvanceTimer);
        this.autoAdvanceTimer = null;
      }
      if (this.progressBar) {
        this.progressBar.classList.remove('hero-slider__progress-bar--animating');
      }
    },

    pauseAutoAdvance() {
      this.isPaused = true;
      if (this.progressBar) {
        this.progressBar.style.animationPlayState = 'paused';
      }
    },

    resumeAutoAdvance() {
      this.isPaused = false;
      if (this.progressBar) {
        this.progressBar.style.animationPlayState = 'running';
      }
    },

    resetAutoAdvance() {
      this.stopAutoAdvance();
      if (!CONFIG.reducedMotion) {
        this.startAutoAdvance();
      }
    },

    handleSwipe() {
      const diff = this.touchStartX - this.touchEndX;
      
      if (Math.abs(diff) > CONFIG.swipeThreshold) {
        if (diff > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
        this.resetAutoAdvance();
      }
    }
  };

  // ============================================
  // HORIZONTAL SCROLL CONTAINERS
  // ============================================
  const ScrollContainerManager = {
    init() {
      this.initTrendingScroll();
      this.initCategoryScroll();
    },

    initTrendingScroll() {
      const container = document.querySelector('.trending-picks .scroll-container');
      if (!container) return;

      const cards = container.querySelectorAll('.card');
      if (cards.length === 0) return;

      let autoScrollInterval = null;
      let isManualScrolling = false;

      const getCardWidth = () => {
        const card = cards[0];
        const style = window.getComputedStyle(card);
        const marginRight = parseInt(style.marginRight) || 0;
        const gap = 16; // From CSS
        return card.offsetWidth + marginRight + gap;
      };

      const scrollNext = () => {
        if (isManualScrolling) return;
        
        const cardWidth = getCardWidth();
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (container.scrollLeft + cardWidth >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      };

      const startAutoScroll = () => {
        if (CONFIG.reducedMotion) return;
        autoScrollInterval = setInterval(scrollNext, CONFIG.autoScrollInterval);
      };

      const stopAutoScroll = () => {
        if (autoScrollInterval) {
          clearInterval(autoScrollInterval);
          autoScrollInterval = null;
        }
      };

      // Manual scroll detection
      let scrollTimeout;
      container.addEventListener('scroll', () => {
        isManualScrolling = true;
        stopAutoScroll();
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isManualScrolling = false;
          startAutoScroll();
        }, CONFIG.autoScrollInterval);
      }, { passive: true });

      // Touch/click stops auto-scroll
      container.addEventListener('touchstart', () => {
        isManualScrolling = true;
        stopAutoScroll();
      }, { passive: true });

      container.addEventListener('mousedown', () => {
        isManualScrolling = true;
        stopAutoScroll();
      });

      startAutoScroll();
    },

    initCategoryScroll() {
      // Look for navigation buttons in category sections
      document.querySelectorAll('.category-section').forEach(section => {
        const container = section.querySelector('.scroll-container');
        const prevBtn = section.querySelector('.category-section__nav-btn--prev, .section-nav-btn--prev');
        const nextBtn = section.querySelector('.category-section__nav-btn--next, .section-nav-btn--next');
        
        if (!container || (!prevBtn && !nextBtn)) return;

        const cards = container.querySelectorAll('.category-card');
        if (cards.length === 0) return;

        const getScrollAmount = () => {
          const card = cards[0];
          const style = window.getComputedStyle(card);
          const marginRight = parseInt(style.marginRight) || 0;
          return card.offsetWidth + marginRight + 16;
        };

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            container.scrollBy({
              left: -getScrollAmount(),
              behavior: 'smooth'
            });
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            container.scrollBy({
              left: getScrollAmount(),
              behavior: 'smooth'
            });
          });
        }
      });
    }
  };

  // ============================================
  // ARTICLE PAGE FEATURES
  // ============================================
  const ArticleManager = {
    init() {
      this.initFullscreenMedia();
      this.initThumbnailStrip();
      this.initShare();
    },

    initFullscreenMedia() {
      document.querySelectorAll('.article__media-fullscreen').forEach(btn => {
        btn.addEventListener('click', () => {
          const mediaContainer = btn.closest('.article__media');
          const media = mediaContainer?.querySelector('img, video');
          
          if (!media) return;

          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
              console.warn('Error exiting fullscreen:', err);
            });
          } else {
            const requestMethod = media.requestFullscreen || 
                                media.webkitRequestFullscreen || 
                                media.msRequestFullscreen;
            
            if (requestMethod) {
              requestMethod.call(media).catch(err => {
                console.warn('Error entering fullscreen:', err);
              });
            }
          }
        });
      });
    },

    initThumbnailStrip() {
      document.querySelectorAll('.article__thumbnails').forEach(strip => {
        const thumbnails = strip.querySelectorAll('.article__thumbnail');
        const mediaContainer = strip.previousElementSibling;
        
        if (!mediaContainer || thumbnails.length === 0) return;

        const mainImg = mediaContainer.querySelector('img');
        if (!mainImg) return;

        thumbnails.forEach(thumb => {
          thumb.addEventListener('click', () => {
            // Update active state
            thumbnails.forEach(t => {
              t.classList.remove('article__thumbnail--active');
              t.setAttribute('aria-selected', 'false');
            });
            thumb.classList.add('article__thumbnail--active');
            thumb.setAttribute('aria-selected', 'true');

            // Update main image with fade effect
            const newSrc = thumb.dataset.mediaSrc;
            if (!newSrc) return;

            mainImg.style.opacity = '0';
            mainImg.style.transition = 'opacity 150ms ease';
            
            setTimeout(() => {
              mainImg.src = newSrc;
              mainImg.onload = () => {
                mainImg.style.opacity = '1';
              };
            }, 150);
          });
        });
      });
    },

    initShare() {
      document.querySelectorAll('.share-button').forEach(btn => {
        btn.addEventListener('click', async () => {
          const url = window.location.href;
          const title = document.title;
          const text = 'Check out this article from Vihiga Times';

          // Try Web Share API first
          if (navigator.share) {
            try {
              await navigator.share({ title, text, url });
              return;
            } catch (err) {
              // User cancelled or failed, continue to fallback
            }
          }

          // Fallback to Clipboard API
          try {
            await navigator.clipboard.writeText(url);
            this.showTooltip(btn, 'Link copied to clipboard!');
          } catch (err) {
            // Final fallback
            this.fallbackCopy(url, btn);
          }
        });
      });
    },

    fallbackCopy(text, button) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        this.showTooltip(button, 'Link copied to clipboard!');
      } catch (err) {
        this.showTooltip(button, 'Failed to copy link', true);
      }
      
      document.body.removeChild(textarea);
    },

    showTooltip(button, message, isError = false) {
      let tooltip = button.nextElementSibling;
      
      if (!tooltip || !tooltip.classList.contains('share-tooltip')) {
        tooltip = document.createElement('span');
        tooltip.className = 'share-tooltip';
        button.parentNode.insertBefore(tooltip, button.nextSibling);
      }

      tooltip.textContent = message;
      tooltip.style.background = isError ? '#d32f2f' : '';
      tooltip.classList.add('share-tooltip--visible');

      setTimeout(() => {
        tooltip.classList.remove('share-tooltip--visible');
      }, 3000);
    }
  };

  // ============================================
  // LAZY LOADING
  // ============================================
  const LazyLoadManager = {
    init() {
      if (!('IntersectionObserver' in window)) {
        this.fallbackLoad();
        return;
      }

      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    },

    loadImage(img) {
      if (!img.dataset.src) return;
      
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
      
      img.onerror = () => {
        img.classList.add('error');
        console.warn('Failed to load image:', img.src);
      };
    },

    fallbackLoad() {
      document.querySelectorAll('img[data-src]').forEach(img => this.loadImage(img));
    }
  };

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  const SmoothScrollManager = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          if (!targetElement) return;

          e.preventDefault();
          
          const header = document.querySelector('.header');
          const headerHeight = header ? header.offsetHeight : 80;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: CONFIG.reducedMotion ? 'auto' : 'smooth'
          });

          // Update focus for accessibility
          targetElement.setAttribute('tabindex', '-1');
          targetElement.focus({ preventScroll: true });
        });
      });
    }
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Core functionality
    NavigationManager.init();
    SearchManager.init();
    MobileNavManager.init();
    HeaderScrollManager.init();
    
    // Sliders and scroll containers
    HeroSliderManager.init();
    ScrollContainerManager.init();
    
    // Article-specific features
    ArticleManager.init();
    
    // Performance features
    LazyLoadManager.init();
    SmoothScrollManager.init();

    console.log('Vihiga Times initialized successfully');
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();