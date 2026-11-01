/*!
 * ============================================================================
 * Vihiga Times - Related Articles System
 * Version: 1.0.0 | Date: 2026-11-01
 * ----------------------------------------------------------------------------
 * A self-contained, dependency-free related-articles slider.
 *
 *   - Reads article records from /related-articles/<category>.json
 *   - Excludes the article currently being read (via data-current-article)
 *   - Shows up to 6 published articles, newest first
 *   - Infinite-loop horizontal slider (swipe, buttons, keyboard)
 *
 * Usage (once per article page, before </body>):
 *
 *   <div id="related-articles"
 *        data-category="local-news"
 *        data-current-article="community-project-in-luanda"></div>
 *   <script src="/related-articles/related-articles.js" defer></script>
 *
 * NOTE: fetch() requires the site to be served over HTTP(S). Opening article
 * pages directly from the file system (file://) will not work - use a local
 * server or your live hosting for testing.
 * ============================================================================
 */
(function () {
  'use strict';

  /* ============================ CONFIGURATION ============================ */

  var CONFIG = {
    containerId: 'related-articles',
    jsonBasePath: '/related-articles/',
    maxArticles: 6,

    // Must match the JSON file names (without ".json").
    // NOTE: the national category uses "national-news" here because the JSON
    // file is national-news.json - even though the article folder is /national/.
    validCategories: [
      'local-news',
      'national-news',
      'education',
      'entertainment-culture',
      'hustle-business',
      'crime-safety',
      'sports',
      'vihiga-politics'
    ],

    // Normally leave this null. After publishing an important JSON update you
    // may temporarily set a new value (e.g. '2026-11-01b') to force visitors'
    // browsers to re-download the JSON files once, then set it back to null.
    cacheVersion: null
  };

  var CATEGORY_LABELS = {
    'local-news': 'Local News',
    'national-news': 'National News',
    'education': 'Education',
    'entertainment-culture': 'Entertainment & Culture',
    'hustle-business': 'Hustle & Business',
    'crime-safety': 'Crime & Safety',
    'sports': 'Sports',
    'vihiga-politics': 'Vihiga Politics'
  };

  // Lightweight inline SVG used when an article image fails to load.
  var FALLBACK_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>" +
      "<rect width='100%' height='100%' fill='#eef2ec'/>" +
      "<g fill='none' stroke='#c3cfc4' stroke-width='3'>" +
        "<rect x='250' y='118' width='140' height='100' rx='8'/>" +
        "<circle cx='285' cy='150' r='10'/>" +
        "<path d='M258 208l32-28 22 18 28-24 40 34'/>" +
      "</g>" +
      "<text x='50%' y='252' text-anchor='middle' font-family='Arial, sans-serif' font-size='14' fill='#8ba08d'>Vihiga Times</text>" +
    "</svg>"
  );

  var ICON_PREV = 'M15 5l-7 7 7 7';
  var ICON_NEXT = 'M9 5l7 7-7 7';
  var ICON_ARROW = 'M5 12h14M13 6l6 6-6 6';

  /* ================================ STYLES ================================ */
  /* All class names use the "vt-related-" prefix to avoid conflicts with     */
  /* existing Vihiga Times stylesheets. Injected once per page.               */

  var STYLES = [
    '.vt-related-section{max-width:1100px;margin:2.5rem auto 0;padding:1.5rem 1rem 1.75rem;box-sizing:border-box;background:#fbfaf7;border:1px solid #e8e6df;border-radius:14px;color:#1f2933;font-family:inherit;-webkit-font-smoothing:antialiased}',
    '@media(min-width:768px){.vt-related-section{padding:2rem 1.5rem 2.25rem}}',
    '.vt-related-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem}',
    '.vt-related-eyebrow{display:inline-block;margin-bottom:.35rem;font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0e7a3d}',
    '.vt-related-heading h2{margin:0;font-size:clamp(1.25rem,2.4vw,1.6rem);line-height:1.25;color:#16211b}',
    '.vt-related-subtitle{margin:.25rem 0 0;font-size:.95rem;line-height:1.5;color:#5b6b60}',
    '.vt-related-controls{display:flex;gap:.5rem;flex-shrink:0}',
    '.vt-related-controls[hidden]{display:none}',
    '.vt-related-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:1px solid #d8d5cc;border-radius:50%;background:#ffffff;color:#374151;cursor:pointer;transition:background-color .2s ease,border-color .2s ease,color .2s ease}',
    '.vt-related-btn:hover{background:#0e7a3d;border-color:#0e7a3d;color:#ffffff}',
    '.vt-related-btn:focus-visible{outline:2px solid #0e7a3d;outline-offset:2px}',
    '.vt-related-slider{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 12px;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#c9cec7 transparent}',
    '.vt-related-slider::-webkit-scrollbar{height:6px}',
    '.vt-related-slider::-webkit-scrollbar-track{background:transparent}',
    '.vt-related-slider::-webkit-scrollbar-thumb{background:#cfd4cd;border-radius:3px}',
    '.vt-related-slider:focus-visible{outline:2px solid #0e7a3d;outline-offset:2px;border-radius:8px}',
    '.vt-related-card{flex:0 0 auto;width:82%;scroll-snap-align:start;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:#ffffff;border:1px solid #e8e6df;border-radius:12px;box-shadow:0 1px 2px rgba(16,24,40,.05);transition:transform .2s ease,box-shadow .2s ease}',
    '@media(min-width:480px){.vt-related-card{width:70%}}',
    '@media(min-width:768px){.vt-related-card{width:46%}}',
    '@media(min-width:1024px){.vt-related-card{width:32%}}',
    '@media(hover:hover){.vt-related-card:hover{transform:translateY(-3px);box-shadow:0 10px 22px rgba(16,24,40,.1)}}',
    '.vt-related-image-link{display:block;aspect-ratio:16/9;overflow:hidden;background:#eef1ec}',
    '.vt-related-image-link img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .35s ease}',
    '@media(hover:hover){.vt-related-image-link:hover img{transform:scale(1.04)}}',
    '.vt-related-content{display:flex;flex-direction:column;gap:.45rem;flex:1;padding:.9rem 1rem 1.1rem}',
    '.vt-related-date{font-size:.72rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6b7280}',
    '.vt-related-content h3{margin:0;font-size:1rem;line-height:1.35}',
    '@media(min-width:768px){.vt-related-content h3{font-size:1.05rem}}',
    '.vt-related-content h3 a{color:#16211b;text-decoration:none}',
    '.vt-related-content h3 a:hover{color:#0e7a3d;text-decoration:underline}',
    '.vt-related-description{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;margin:0;font-size:.875rem;line-height:1.55;color:#55635a}',
    '.vt-related-read-more{display:inline-flex;align-items:center;gap:.35rem;margin-top:auto;padding-top:.35rem;font-size:.9rem;font-weight:600;color:#0e7a3d;text-decoration:none}',
    '.vt-related-read-more svg{transition:transform .2s ease}',
    '.vt-related-read-more:hover{text-decoration:underline}',
    '.vt-related-read-more:hover svg{transform:translateX(2px)}',
    '.vt-related-section a:focus-visible{outline:2px solid #0e7a3d;outline-offset:2px;border-radius:4px}',
    '@media(prefers-reduced-motion:reduce){.vt-related-card,.vt-related-image-link img,.vt-related-read-more svg{transition:none}.vt-related-card:hover,.vt-related-image-link:hover img{transform:none}}'
  ].join('\n');

  var stylesInjected = false;

  function injectStyles() {
    if (stylesInjected || document.getElementById('vt-related-styles')) return;
    var style = document.createElement('style');
    style.id = 'vt-related-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
    stylesInjected = true;
  }

  /* ============================== UTILITIES ============================== */

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function reducedMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  function warn(message, detail) {
    // Diagnostics only - a single warning per failure, never a flood.
    if (window.console && console.warn) {
      console.warn('[Vihiga Times - Related Articles] ' + message, detail || '');
    }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function svgIcon(pathData) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  // Block dangerous URL schemes. Relative paths, root-relative paths,
  // https:// and http:// are all accepted.
  function isSafeUrl(value) {
    if (typeof value !== 'string') return false;
    var url = value.trim();
    if (!url) return false;
    return !/^(javascript|vbscript|data)\s*:/i.test(url);
  }

  /* ====================== ARTICLE VALIDATION & SORTING ===================== */

  function normalizeArticle(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var id = typeof raw.id === 'string' ? raw.id.trim() : '';
    var title = typeof raw.title === 'string' ? raw.title.trim() : '';
    var link = typeof raw.link === 'string' ? raw.link.trim() : '';
    var status = typeof raw.status === 'string' ? raw.status.trim().toLowerCase() : '';

    if (!id || !title || !link) return null;          // missing essential fields
    if (status !== 'published') return null;           // excludes drafts & unknown statuses
    if (!isSafeUrl(link)) return null;                 // blocks javascript: etc.

    var image = (typeof raw.image === 'string' && isSafeUrl(raw.image)) ? raw.image.trim() : '';
    if (!image) image = FALLBACK_IMAGE;                // reliable fallback, card stays functional

    var description = typeof raw.description === 'string' ? raw.description.trim() : '';
    var imageAlt = (typeof raw.imageAlt === 'string' && raw.imageAlt.trim()) ? raw.imageAlt.trim() : title;

    var timestamp = Date.parse(raw.date);
    if (isNaN(timestamp)) timestamp = 0;               // invalid dates sort oldest; never crash

    var dateLabel = '';
    if (timestamp > 0) {
      try {
        dateLabel = new Date(timestamp).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (ignore) { dateLabel = ''; }
    }

    return {
      id: id, title: title, description: description,
      image: image, imageAlt: imageAlt, link: link,
      timestamp: timestamp, dateLabel: dateLabel
    };
  }

  function processArticles(records, currentId) {
    if (!Array.isArray(records)) return [];

    var seen = {};
    var out = [];

    for (var i = 0; i < records.length; i++) {
      var article = normalizeArticle(records[i]);
      if (!article) continue;                          // invalid / draft / unsafe
      if (seen[article.id]) continue;                  // duplicate IDs removed
      seen[article.id] = true;
      if (currentId && article.id === currentId) continue; // current article excluded
      out.push(article);
    }

    // Newest first. Articles with invalid dates sink to the bottom.
    out.sort(function (a, b) { return b.timestamp - a.timestamp; });

    return out.slice(0, CONFIG.maxArticles);
  }

  /* ============================== CARD BUILDER ============================= */

  function buildCard(article) {
    var card = el('article', 'vt-related-card');

    var imageLink = el('a', 'vt-related-image-link');
    imageLink.href = article.link;
    imageLink.setAttribute('aria-label', article.title);

    var img = document.createElement('img');
    img.src = article.image;
    img.alt = article.imageAlt;
    img.width = 640;
    img.height = 360;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', function () {
      if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
    }, { once: true });
    imageLink.appendChild(img);

    var content = el('div', 'vt-related-content');
    if (article.dateLabel) content.appendChild(el('span', 'vt-related-date', article.dateLabel));

    var heading = el('h3');
    var titleLink = el('a', null, article.title);
    titleLink.href = article.link;
    heading.appendChild(titleLink);
    content.appendChild(heading);

    if (article.description) content.appendChild(el('p', 'vt-related-description', article.description));

    var readMore = el('a', 'vt-related-read-more');
    readMore.href = article.link;
    readMore.appendChild(document.createTextNode('Read More'));
    readMore.appendChild(svgIcon(ICON_ARROW));
    content.appendChild(readMore);

    card.appendChild(imageLink);
    card.appendChild(content);
    return card;
  }

  // Clone a set of cards for the infinite loop. Clones are visible to mouse
  // users but hidden from assistive technology and keyboard tab order.
  function cloneSet(cards) {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < cards.length; i++) {
      var clone = cards[i].cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      var links = clone.querySelectorAll('a');
      for (var j = 0; j < links.length; j++) links[j].setAttribute('tabindex', '-1');
      fragment.appendChild(clone);
    }
    return fragment;
  }

  /* ============================ SLIDER / SECTION =========================== */

  function renderSection(container, articles, category) {
    var n = articles.length;

    if (n === 0) {                                     // Case 3: hide cleanly
      container.style.display = 'none';
      return;
    }

    var label = CATEGORY_LABELS[category] || 'Vihiga Times';

    var section = el('section', 'vt-related-section');
    section.setAttribute('aria-labelledby', 'vt-related-heading-title');

    /* ---- Heading ---- */
    var headingWrap = el('div', 'vt-related-heading');
    var headingText = el('div');
    headingText.appendChild(el('span', 'vt-related-eyebrow', 'Keep Reading'));
    var h2 = el('h2', null, 'Related Articles');
    h2.id = 'vt-related-heading-title';
    headingText.appendChild(h2);
    headingText.appendChild(el('p', 'vt-related-subtitle', 'More ' + label + ' stories you may have missed.'));
    headingWrap.appendChild(headingText);

    var controls = el('div', 'vt-related-controls');

    var prevBtn = el('button', 'vt-related-btn vt-related-btn--prev');
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Show previous articles');
    prevBtn.appendChild(svgIcon(ICON_PREV));

    var nextBtn = el('button', 'vt-related-btn vt-related-btn--next');
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Show next articles');
    nextBtn.appendChild(svgIcon(ICON_NEXT));

    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    headingWrap.appendChild(controls);

    /* ---- Slider ---- */
    var slider = el('div', 'vt-related-slider');
    slider.tabIndex = 0;
    slider.setAttribute('role', 'region');
    slider.setAttribute('aria-label', 'Related articles from ' + label);

    var cards = [];
    for (var i = 0; i < n; i++) cards.push(buildCard(articles[i]));

    // DOM: [clone set] [real set] [clone set] -> seamless infinite loop.
    // Clones are only created when looping is possible (2+ cards) and are
    // bounded: at most 3 x 6 = 18 cards, never infinite DOM growth.
    if (n > 1) slider.appendChild(cloneSet(cards));
    for (var k = 0; k < n; k++) slider.appendChild(cards[k]);
    if (n > 1) slider.appendChild(cloneSet(cards));

    section.appendChild(headingWrap);
    section.appendChild(slider);
    container.appendChild(section);

    if (n === 1) {                                     // Case 10: no looping needed
      controls.hidden = true;
      return;
    }

    /* ---- Infinite-loop navigation state ---- */
    var activeIndex = 0;
    var cardStep = 0;   // width of one card + gap
    var setWidth = 0;   // width of one full set of cards

    function measure() {
      cardStep = cards[0].offsetWidth + 16; // gap is fixed at 16px in CSS
      setWidth = cardStep * n;
    }

    function normalizeScroll() {
      var left = slider.scrollLeft;
      if (left < setWidth - 2) {                       // swiped into left clone set
        slider.scrollLeft = left + setWidth;           // silent wrap (instant)
        return;
      }
      if (left >= 2 * setWidth - 2) {                  // swiped into right clone set
        slider.scrollLeft = left - setWidth;           // silent wrap (instant)
        return;
      }
      var index = Math.round((left - setWidth) / cardStep);
      activeIndex = ((index % n) + n) % n;             // keeps buttons synced with swipes
    }

    var scrollScheduled = false;
    function onScroll() {
      if (scrollScheduled) return;
      scrollScheduled = true;
      window.requestAnimationFrame(function () {
        scrollScheduled = false;
        normalizeScroll();
      });
    }

    function goTo(index) {
      var target = ((index % n) + n) % n;
      activeIndex = target;
      slider.scrollTo({
        left: setWidth + target * cardStep,
        behavior: reducedMotion() ? 'auto' : 'smooth'
      });
    }

    prevBtn.addEventListener('click', function () { goTo(activeIndex - 1); });
    nextBtn.addEventListener('click', function () { goTo(activeIndex + 1); });

    slider.addEventListener('scroll', onScroll, { passive: true });

    slider.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1); }
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        measure();
        slider.scrollLeft = setWidth + activeIndex * cardStep; // silent re-position
      }, 150);
    });

    // Start on the first real card (silent, instant).
    window.requestAnimationFrame(function () {
      measure();
      slider.scrollLeft = setWidth;
    });
  }

  /* ================================= INIT ================================== */

  function init() {
    injectStyles();

    var container = document.getElementById(CONFIG.containerId);
    if (!container) return;                            // nothing to do on this page

    // Prevent double-initialisation if the script is ever included twice.
    if (container.getAttribute('data-vt-related-init') === 'true') return;
    container.setAttribute('data-vt-related-init', 'true');

    var category = (container.getAttribute('data-category') || '').trim().toLowerCase();
    if (CONFIG.validCategories.indexOf(category) === -1) {
      warn('Unknown or missing data-category "' + category + '". Expected one of: ' + CONFIG.validCategories.join(', '));
      container.style.display = 'none';
      return;
    }

    var currentId = (container.getAttribute('data-current-article') || '').trim();

    var jsonPath = CONFIG.jsonBasePath + category + '.json' +
      (CONFIG.cacheVersion ? '?v=' + encodeURIComponent(CONFIG.cacheVersion) : '');

    // cache: 'no-cache' revalidates against the server instead of blindly
    // re-downloading, so updated JSON records appear after deployment while
    // unchanged files are served cheaply from the browser cache.
    fetch(jsonPath, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + jsonPath);
        return response.json();
      })
      .then(function (records) {
        var articles = processArticles(records, currentId);
        renderSection(container, articles, category);
      })
      .catch(function (error) {
        // Case 8 / Case 9: missing file or malformed JSON - fail silently
        // for visitors, warn once for the developer.
        container.style.display = 'none';
        warn('Could not load related articles from ' + jsonPath, error);
      });
  }

  // Run automatically. defer (recommended in the script tag) plus
  // readyState checks make this safe regardless of script placement.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
