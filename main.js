/**
 * VIHIGA TIMES - MAIN JAVASCRIPT
 * All interactive functionality for the news platform
 */

(function() {
  'use strict';

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  const searchMappings = {
    'local': 'local-news',
    'local news': 'local-news',
    'national': 'national',
    'crime': 'crime-safety',
    'safety': 'crime-safety',
    'crime and safety': 'crime-safety',
    'business': 'hustle-business',
    'hustle': 'hustle-business',
    'hustle and business': 'hustle-business',
    'entertainment': 'entertainment-culture',
    'culture': 'entertainment-culture',
    'fashion': 'fashion-style',
    
    'trending': 'trending-picks-section',
    'latest': 'latest-stories',
    'stories': 'latest-stories',
    'hero': 'homepage-hero'
  };

  function initSearch() {
    const searchForms = document.querySelectorAll('.search-form');
    
    searchForms.forEach(form => {
      const input = form.querySelector('.search-input');
      const errorEl = form.querySelector('.search-error');
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = input.value.toLowerCase().trim();
        
        if (!query) return;
        
        // Check for exact match first
        if (searchMappings[query]) {
          scrollToSection(searchMappings[query]);
          hideSearchError(errorEl);
          input.value = '';
          return;
        }
        
        // Check for partial match
        for (const [key, sectionId] of Object.entries(searchMappings)) {
          if (query.includes(key) || key.includes(query)) {
            scrollToSection(sectionId);
            hideSearchError(errorEl);
            input.value = '';
            return;
          }
        }
        
        // No match found
        showSearchError(errorEl);
      });
    });
  }

  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerHeight = document.querySelector('.header').offsetHeight;
      const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
      
      window.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      });
    }
  }

  function showSearchError(errorEl) {
    if (errorEl) {
      errorEl.classList.add('search-error--visible');
      setTimeout(() => hideSearchError(errorEl), 3000);
    }
  }

  function hideSearchError(errorEl) {
    if (errorEl) {
      errorEl.classList.remove('search-error--visible');
    }
  }

  // ============================================
  // MOBILE SEARCH TOGGLE
  // ============================================
  function initMobileSearch() {
    const searchToggle = document.querySelector('.header__search-toggle');
    const searchContainer = document.querySelector('.header__search');
    
    if (searchToggle && searchContainer) {
      searchToggle.addEventListener('click', () => {
        searchContainer.classList.toggle('header__search--active');
        if (searchContainer.classList.contains('header__search--active')) {
          const input = searchContainer.querySelector('.search-input');
          if (input) input.focus();
        }
      });
    }
  }

  // ============================================
  // MOBILE NAVIGATION
  // ============================================
  function initMobileNav() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    
    if (!menuToggle || !mobileNav || !mobileOverlay) return;
    
    function openMenu() {
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('mobile-nav--active');
      mobileOverlay.classList.add('mobile-overlay--active');
      document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('mobile-nav--active');
      mobileOverlay.classList.remove('mobile-overlay--active');
      document.body.style.overflow = '';
    }
    
    menuToggle.addEventListener('click', () => {
      if (menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      } else {
        openMenu();
      }
    });
    
    mobileOverlay.addEventListener('click', closeMenu);
    
    // Close menu when clicking a link
    const mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    let ticking = false;
    
    function updateHeader() {
      if (window.scrollY > 80) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
      ticking = false;
    }
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // HERO SLIDER
  // ============================================
  function initHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.hero-slide');
    const dots = slider.querySelectorAll('.hero-slider__dot');
    const prevBtn = slider.querySelector('.hero-slider__arrow--prev');
    const nextBtn = slider.querySelector('.hero-slider__arrow--next');
    const progressBar = slider.querySelector('.hero-slider__progress-bar');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    let autoAdvanceTimer = null;
    let progressTimer = null;
    const slideDuration = 4000; // 4 seconds
    
    function goToSlide(index) {
      // Remove active class from current slide
      slides[currentSlide].classList.remove('hero-slide--active');
      dots[currentSlide].classList.remove('hero-slider__dot--active');
      
      // Update current slide index
      currentSlide = index;
      
      // Handle wrapping
      if (currentSlide < 0) currentSlide = slides.length - 1;
      if (currentSlide >= slides.length) currentSlide = 0;
      
      // Add active class to new slide
      slides[currentSlide].classList.add('hero-slide--active');
      dots[currentSlide].classList.add('hero-slider__dot--active');
      
      // Reset progress bar
      resetProgressBar();
    }
    
    function nextSlide() {
      goToSlide(currentSlide + 1);
    }
    
    function prevSlide() {
      goToSlide(currentSlide - 1);
    }
    
    function resetProgressBar() {
      if (!progressBar) return;
      
      progressBar.classList.remove('hero-slider__progress-bar--animating');
      progressBar.style.width = '0';
      
      // Force reflow
      void progressBar.offsetWidth;
      
      progressBar.classList.add('hero-slider__progress-bar--animating');
    }
    
    function startAutoAdvance() {
      resetProgressBar();
      autoAdvanceTimer = setInterval(nextSlide, slideDuration);
    }
    
    function stopAutoAdvance() {
      if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
      if (progressBar) {
        progressBar.classList.remove('hero-slider__progress-bar--animating');
      }
    }
    
    function resetAutoAdvance() {
      stopAutoAdvance();
      startAutoAdvance();
    }
    
    // Event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoAdvance();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoAdvance();
      });
    }
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
        resetAutoAdvance();
      });
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        resetAutoAdvance();
      }
    }
    
    // Start auto-advance
    startAutoAdvance();
  }

  // ============================================
  // TRENDING PICKS AUTO-SCROLL
  // ============================================
  function initTrendingScroll() {
    const container = document.querySelector('.trending-picks .scroll-container');
    if (!container) return;
    
    const cards = container.querySelectorAll('.card');
    if (cards.length === 0) return;
    
    let autoScrollInterval = null;
    let resumeTimeout = null;
    const scrollInterval = 5000; // 5 seconds
    let isManualScrolling = false;
    
    function getCardWidth() {
      const card = cards[0];
      const style = window.getComputedStyle(card);
      const marginRight = parseInt(style.marginRight) || 0;
      return card.offsetWidth + marginRight + 16; // 16 is gap
    }
    
    function scrollNext() {
      const cardWidth = getCardWidth();
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (container.scrollLeft + cardWidth >= maxScroll) {
        // Scroll back to start
        container.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        container.scrollBy({
          left: cardWidth,
          behavior: 'smooth'
        });
      }
    }
    
    function startAutoScroll() {
      if (autoScrollInterval) return;
      autoScrollInterval = setInterval(scrollNext, scrollInterval);
    }
    
    function stopAutoScroll() {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    }
    
    function handleManualScroll() {
      isManualScrolling = true;
      stopAutoScroll();
      
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }
      
      resumeTimeout = setTimeout(() => {
        isManualScrolling = false;
        startAutoScroll();
      }, scrollInterval);
    }
    
    // Listen for manual scroll events
    container.addEventListener('scroll', handleManualScroll, { passive: true });
    container.addEventListener('touchstart', handleManualScroll, { passive: true });
    container.addEventListener('mousedown', handleManualScroll);
    
    // Start auto-scroll
    startAutoScroll();
  }

  // ============================================
  // CATEGORY SECTION SCROLL BUTTONS
  // ============================================
  function initCategoryScroll() {
    const sections = document.querySelectorAll('.category-section');
    
    sections.forEach(section => {
      const container = section.querySelector('.scroll-container');
      const prevBtn = section.querySelector('.category-section__nav-btn--prev');
      const nextBtn = section.querySelector('.category-section__nav-btn--next');
      
      if (!container || !prevBtn || !nextBtn) return;
      
      const cards = container.querySelectorAll('.category-card');
      if (cards.length === 0) return;
      
      function getScrollAmount() {
        const card = cards[0];
        const style = window.getComputedStyle(card);
        const marginRight = parseInt(style.marginRight) || 0;
        return card.offsetWidth + marginRight + 16;
      }
      
      prevBtn.addEventListener('click', () => {
        container.scrollBy({
          left: -getScrollAmount(),
          behavior: 'smooth'
        });
      });
      
      nextBtn.addEventListener('click', () => {
        container.scrollBy({
          left: getScrollAmount(),
          behavior: 'smooth'
        });
      });
    });
  }

  // ============================================
  // ARTICLE MEDIA FULLSCREEN
  // ============================================
  function initFullscreenMedia() {
    const fullscreenBtns = document.querySelectorAll('.article__media-fullscreen');
    
    fullscreenBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mediaContainer = btn.closest('.article__media');
        const media = mediaContainer.querySelector('img, video');
        
        if (!media) return;
        
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          if (media.requestFullscreen) {
            media.requestFullscreen();
          } else if (media.webkitRequestFullscreen) {
            media.webkitRequestFullscreen();
          } else if (media.msRequestFullscreen) {
            media.msRequestFullscreen();
          }
        }
      });
    });
  }

  // ============================================
  // ARTICLE THUMBNAIL STRIP
  // ============================================
  function initThumbnailStrip() {
    const thumbnailStrips = document.querySelectorAll('.article__thumbnails');
    
    thumbnailStrips.forEach(strip => {
      const thumbnails = strip.querySelectorAll('.article__thumbnail');
      const mediaContainer = strip.previousElementSibling;
      
      if (!mediaContainer || thumbnails.length === 0) return;
      
      thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
          // Update active state
          thumbnails.forEach(t => t.classList.remove('article__thumbnail--active'));
          thumb.classList.add('article__thumbnail--active');
          
          // Update main media
          const mediaType = thumb.dataset.mediaType;
          const mediaSrc = thumb.dataset.mediaSrc;
          
          if (mediaType === 'image') {
            const img = mediaContainer.querySelector('img');
            if (img) {
              img.style.opacity = '0';
              setTimeout(() => {
                img.src = mediaSrc;
                img.style.opacity = '1';
              }, 150);
            }
          }
        });
      });
    });
  }

  // ============================================
  // SHARE FUNCTIONALITY
  // ============================================
  function initShare() {
    const shareButtons = document.querySelectorAll('.share-button');
    
    shareButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = window.location.href;
        const title = document.title;
        const text = 'Check out this article from Vihiga Times';
        
        // Try Web Share API first
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              text: text,
              url: url
            });
            return;
          } catch (err) {
            // User cancelled or share failed, fall through to clipboard
          }
        }
        
        // Fallback to Clipboard API
        try {
          await navigator.clipboard.writeText(url);
          showShareTooltip(btn);
        } catch (err) {
          // Legacy fallback
          const textarea = document.createElement('textarea');
          textarea.value = url;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showShareTooltip(btn);
        }
      });
    });
  }

  function showShareTooltip(button) {
    let tooltip = button.nextElementSibling;
    
    if (!tooltip || !tooltip.classList.contains('share-tooltip')) {
      tooltip = document.createElement('span');
      tooltip.className = 'share-tooltip';
      tooltip.textContent = 'Link copied to clipboard';
      button.parentNode.insertBefore(tooltip, button.nextSibling);
    }
    
    tooltip.classList.add('share-tooltip--visible');
    
    setTimeout(() => {
      tooltip.classList.remove('share-tooltip--visible');
    }, 3000);
  }

  // ============================================
  // LAZY LOADING IMAGES
  // ============================================
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
            }
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // ============================================
  // INITIALIZE ALL FUNCTIONS
  // ============================================
  function init() {
    initSearch();
    initMobileSearch();
    initMobileNav();
    initHeaderScroll();
    initHeroSlider();
    initTrendingScroll();
    initCategoryScroll();
    initFullscreenMedia();
    initThumbnailStrip();
    initShare();
    initLazyLoading();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



