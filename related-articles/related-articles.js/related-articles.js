/*!
 * Vihiga Times — Related Articles System
 * Version 1.0.0
 * Vanilla JavaScript. No dependencies. No build step.
 *
 * Integration (on each article page, near the bottom of the article):
 *
 *   <div id="related-articles"
 *        data-category="local-news"
 *        data-current-article="your-article-slug"></div>
 *
 *   <script src="/related-articles/related-articles.js" defer></script>
 *
 * The script reads only the JSON file for the category on the page.
 */
(function () {
    'use strict';

    /* ---------------------------------------------------------------------
     * 0. Guard: never initialise twice on the same page.
     * ------------------------------------------------------------------ */
    if (window.VTRelatedArticles) {
        return;
    }
    window.VTRelatedArticles = { version: '1.0.0' };

    /* ---------------------------------------------------------------------
     * 1. Configuration
     * ------------------------------------------------------------------ */

    // Whitelist. A category not listed here will never be fetched.
    var CATEGORY_LABELS = {
        'local-news': 'Local News',
        'national-news': 'National News',
        'education': 'Education',
        'entertainment-culture': 'Entertainment and Culture',
        'hustle-business': 'Hustle and Business',
        'crime-safety': 'Crime and Safety',
        'sports': 'Sports',
        'vihiga-politics': 'Vihiga Politics'
    };

    var MAX_ARTICLES = 6;                 // cards shown per slider
    var JSON_BASE = '/related-articles/'; // root-relative, works from any depth
    var SETTLE_DELAY = 130;               // ms after scrolling stops
    var STYLE_ID = 'vt-related-styles';

    // Inline SVG fallback image (no extra network request).
    var FALLBACK_IMAGE =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400">' +
            '<rect width="640" height="400" fill="#f2efe9"/>' +
            '<g fill="none" stroke="#b9b2a6" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="248" y="146" width="144" height="112" rx="12"/>' +
            '<circle cx="290" cy="188" r="15"/>' +
            '<path d="M256 248l40-38 30 26 24-20 34 32"/>' +
            '</g>' +
            '<text x="320" y="318" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" ' +
            'font-size="18" fill="#8d8579">Image unavailable</text>' +
            '</svg>'
        );

    // Trusted icon markup (never built from JSON data).
    var ICON_PREV =
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M15 18l-6-6 6-6"/></svg>';

    var ICON_NEXT =
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M9 18l6-6-6-6"/></svg>';

    var ICON_ARROW =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M5 12h13"/><path d="M12 5l7 7-7 7"/></svg>';

    /* ---------------------------------------------------------------------
     * 2. Styles (injected once)
     * ------------------------------------------------------------------ */

    var CSS = [
        '.vt-related-section{',
        '--vt-accent:#0e6b45;--vt-accent-dark:#0a5236;--vt-accent-soft:#e9f4ee;',
        '--vt-ink:#14171c;--vt-muted:#5a6069;--vt-line:#e4dfd5;',
        '--vt-card:#ffffff;--vt-bg:#fffdf9;--vt-radius:14px;--vt-gap:16px;',
        'box-sizing:border-box;width:100%;max-width:100%;margin:44px 0 0;padding:26px 0 4px;',
        'border-top:1px solid var(--vt-line);background:var(--vt-bg);color:var(--vt-ink);',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;',
        'font-size:16px;line-height:1.5;text-align:left;}',

        '.vt-related-section *,.vt-related-section *::before,.vt-related-section *::after{box-sizing:border-box;}',
        '.vt-related-section [hidden]{display:none !important;}',

        '.vt-related-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;',
        'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;}',

        /* ---- heading ---- */
        '.vt-related-head{display:flex;align-items:flex-end;justify-content:space-between;',
        'gap:18px;flex-wrap:wrap;margin:0 0 18px;}',
        '.vt-related-head-text{flex:1 1 260px;min-width:0;}',
        '.vt-related-eyebrow{display:inline-block;margin:0 0 10px;padding:5px 11px;border-radius:999px;',
        'background:var(--vt-accent-soft);color:var(--vt-accent-dark);font-size:11px;font-weight:800;',
        'letter-spacing:.14em;text-transform:uppercase;line-height:1.4;}',
        '.vt-related-title{margin:0 0 6px;font-size:clamp(20px,2.2vw,27px);font-weight:800;',
        'line-height:1.2;letter-spacing:-.015em;color:var(--vt-ink);}',
        '.vt-related-subtitle{margin:0;font-size:14px;line-height:1.55;color:var(--vt-muted);}',

        /* ---- controls ---- */
        '.vt-related-controls{display:flex;gap:10px;flex:0 0 auto;}',
        '.vt-related-btn{width:44px;height:44px;border-radius:50%;border:1px solid var(--vt-line);',
        'background:#fff;color:var(--vt-ink);display:inline-flex;align-items:center;justify-content:center;',
        'padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;',
        'transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease;}',
        '.vt-related-btn:hover{background:var(--vt-accent);border-color:var(--vt-accent);color:#fff;}',
        '.vt-related-btn:active{transform:scale(.95);}',
        '.vt-related-btn svg{display:block;}',

        /* ---- slider ---- */
        '.vt-related-slider{position:relative;display:flex;gap:var(--vt-gap);width:100%;',
        'overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-behavior:smooth;',
        '-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;',
        'padding-bottom:10px;scrollbar-width:thin;scrollbar-color:#cfc8bc transparent;}',
        '.vt-related-slider::-webkit-scrollbar{height:8px;}',
        '.vt-related-slider::-webkit-scrollbar-track{background:transparent;}',
        '.vt-related-slider::-webkit-scrollbar-thumb{background:#d8d2c6;border-radius:999px;}',
        '.vt-related-slider::-webkit-scrollbar-thumb:hover{background:#c3bcae;}',

        /* ---- cards ---- */
        '.vt-related-card{flex:0 0 82%;scroll-snap-align:start;display:flex;flex-direction:column;',
        'background:var(--vt-card);border:1px solid var(--vt-line);border-radius:var(--vt-radius);',
        'overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04);',
        'transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease;}',
        '.vt-related-card:hover{box-shadow:0 8px 22px rgba(16,24,40,.10);',
        'border-color:#d6cfc1;transform:translateY(-2px);}',

        '.vt-related-thumb{display:block;position:relative;aspect-ratio:16/10;',
        'background:#f1efe9;overflow:hidden;}',
        '.vt-related-thumb-img{width:100%;height:100%;object-fit:cover;display:block;',
        'transition:transform .35s ease;}',
        '.vt-related-card:hover .vt-related-thumb-img{transform:scale(1.04);}',
        '.vt-related-thumb-fallback{object-fit:contain;background:#f2efe9;}',

        '.vt-related-body{display:flex;flex-direction:column;gap:8px;flex:1 1 auto;padding:15px 16px 17px;}',
        '.vt-related-card-title{margin:0;font-size:16px;font-weight:700;line-height:1.36;letter-spacing:-.005em;}',
        '.vt-related-card-title a{color:var(--vt-ink);text-decoration:none;}',
        '.vt-related-card-title a:hover{color:var(--vt-accent);}',
        '.vt-related-card-text{margin:0;font-size:13.5px;line-height:1.55;color:var(--vt-muted);',
        'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
        '.vt-related-more{display:inline-flex;align-items:center;gap:6px;margin-top:auto;padding-top:6px;',
        'font-size:13px;font-weight:800;letter-spacing:.01em;color:var(--vt-accent);text-decoration:none;}',
        '.vt-related-more:hover{color:var(--vt-accent-dark);}',
        '.vt-related-more-icon{display:inline-flex;transition:transform .18s ease;}',
        '.vt-related-more:hover .vt-related-more-icon{transform:translateX(3px);}',

        /* ---- focus ---- */
        '.vt-related-section a:focus-visible,.vt-related-section button:focus-visible,',
        '.vt-related-slider:focus-visible{outline:3px solid #7fb99f;outline-offset:2px;border-radius:8px;}',

        /* ---- responsive card widths ---- */
        '@media (min-width:480px){.vt-related-card{flex-basis:70%;}}',
        '@media (min-width:720px){.vt-related-card{flex-basis:46%;}}',
        '@media (min-width:1024px){.vt-related-card{flex-basis:32%;}}',

        /* ---- reduced motion ---- */
        '@media (prefers-reduced-motion:reduce){',
        '.vt-related-slider{scroll-behavior:auto;}',
        '.vt-related-card,.vt-related-thumb-img,.vt-related-btn,.vt-related-more-icon{transition:none;}',
        '.vt-related-card:hover{transform:none;}',
        '.vt-related-card:hover .vt-related-thumb-img{transform:none;}',
        '}'
    ].join('');

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* ---------------------------------------------------------------------
     * 3. Small helpers
     * ------------------------------------------------------------------ */

    function log(message, detail) {
        if (window.console && typeof window.console.warn === 'function') {
            window.console.warn('[Vihiga Times / Related Articles] ' + message, detail || '');
        }
    }

    function asString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    /**
     * Accepts only http(s) URLs, protocol-relative URLs and relative paths.
     * Rejects javascript:, data:, vbscript:, and anything unparsable.
     */
    function isSafeUrl(value) {
        var raw = asString(value);
        if (!raw) {
            return false;
        }
        // Explicit scheme present?
        if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(raw)) {
            try {
                var parsed = new URL(raw, window.location.href);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
            } catch (err) {
                return false;
            }
        }
        // No scheme: relative path, protocol-relative path, or fragment.
        return raw.charAt(0) === '/' || raw.charAt(0) === '#' || raw.indexOf('./') === 0 ||
            raw.indexOf('../') === 0 || raw.indexOf('?') === 0 || /^[\w\-./]+$/.test(raw);
    }

    /** Returns a sortable timestamp; invalid dates sort last. */
    function parseDate(value) {
        var raw = asString(value);
        if (!raw) {
            return 0;
        }
        var time = Date.parse(raw);
        return isNaN(time) ? 0 : time;
    }

    function prefersReducedMotion() {
        return !!(window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    /* ---------------------------------------------------------------------
     * 4. Data loading, filtering and sorting
     * ------------------------------------------------------------------ */

    function fetchCategory(category) {
        var url = JSON_BASE + encodeURIComponent(category) + '.json';

        // "no-cache" revalidates with the server on every page load.
        // Unchanged files return 304 (cheap); changed files return fresh data.
        return fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ' for ' + url);
                }
                return response.json();
            })
            .then(function (data) {
                if (!Array.isArray(data)) {
                    throw new Error('Expected a JSON array in ' + url);
                }
                return data;
            });
    }

    /**
     * Validates, de-duplicates, excludes the current article,
     * sorts newest-first and caps the result at MAX_ARTICLES.
     */
    function prepareArticles(records, currentId) {
        var seen = Object.create(null);
        var out = [];

        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            if (!record || typeof record !== 'object') {
                continue;
            }

            var id = asString(record.id);
            var title = asString(record.title);
            var link = asString(record.link);
            var status = asString(record.status).toLowerCase();

            if (!id || !title || !link) {
                continue;                       // required fields missing
            }
            if (status !== 'published') {
                continue;                       // drafts never appear
            }
            if (currentId && id === currentId) {
                continue;                       // never recommend itself
            }
            if (seen[id]) {
                continue;                       // duplicate id
            }
            if (!isSafeUrl(link)) {
                continue;                       // unsafe / malformed link
            }

            var image = asString(record.image);
            seen[id] = true;

            out.push({
                id: id,
                title: title,
                description: asString(record.description),
                image: (image && isSafeUrl(image)) ? image : FALLBACK_IMAGE,
                imageAlt: asString(record.imageAlt) || title,
                link: link,
                time: parseDate(record.date)
            });
        }

        out.sort(function (a, b) {
            return b.time - a.time;
        });

        return out.slice(0, MAX_ARTICLES);
    }

    /* ---------------------------------------------------------------------
     * 5. Rendering
     * ------------------------------------------------------------------ */

    var instanceCounter = 0;

    function makeControlButton(label, icon, modifier) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'vt-related-btn vt-related-btn-' + modifier;
        button.setAttribute('aria-label', label);
        button.innerHTML = icon; // trusted constant, never user data
        return button;
    }

    function buildCard(article) {
        var card = document.createElement('article');
        card.className = 'vt-related-card';

        /* Thumbnail (decorative duplicate link: not in tab order) */
        var thumbLink = document.createElement('a');
        thumbLink.className = 'vt-related-thumb';
        thumbLink.href = article.link;
        thumbLink.tabIndex = -1;
        thumbLink.setAttribute('aria-hidden', 'true');

        var img = document.createElement('img');
        img.className = 'vt-related-thumb-img';
        img.alt = article.imageAlt;
        img.width = 640;
        img.height = 400;
        img.loading = 'lazy';
        img.decoding = 'async';

        img.addEventListener('error', function handleImageError() {
            img.removeEventListener('error', handleImageError);
            img.src = FALLBACK_IMAGE;
            img.classList.add('vt-related-thumb-fallback');
        });

        img.src = article.image;
        thumbLink.appendChild(img);

        /* Text block */
        var body = document.createElement('div');
        body.className = 'vt-related-body';

        var heading = document.createElement('h3');
        heading.className = 'vt-related-card-title';

        var titleLink = document.createElement('a');
        titleLink.href = article.link;
        titleLink.textContent = article.title;
        heading.appendChild(titleLink);
        body.appendChild(heading);

        if (article.description) {
            var text = document.createElement('p');
            text.className = 'vt-related-card-text';
            text.textContent = article.description;
            body.appendChild(text);
        }

        var more = document.createElement('a');
        more.className = 'vt-related-more';
        more.href = article.link;
        more.appendChild(document.createTextNode('Read More'));

        var srText = document.createElement('span');
        srText.className = 'vt-related-sr-only';
        srText.textContent = ' about ' + article.title;
        more.appendChild(srText);

        var arrow = document.createElement('span');
        arrow.className = 'vt-related-more-icon';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.innerHTML = ICON_ARROW;
        more.appendChild(arrow);

        body.appendChild(more);

        card.appendChild(thumbLink);
        card.appendChild(body);
        return card;
    }

    function buildSection(articles, category) {
        instanceCounter += 1;

        var section = document.createElement('section');
        section.className = 'vt-related-section';

        /* ---- heading ---- */
        var head = document.createElement('div');
        head.className = 'vt-related-head';

        var headText = document.createElement('div');
        headText.className = 'vt-related-head-text';

        var eyebrow = document.createElement('span');
        eyebrow.className = 'vt-related-eyebrow';
        eyebrow.textContent = 'Keep Reading';

        var title = document.createElement('h2');
        title.className = 'vt-related-title';
        title.id = 'vt-related-title-' + instanceCounter;
        title.textContent = 'Related Articles';

        var subtitle = document.createElement('p');
        subtitle.className = 'vt-related-subtitle';
        subtitle.textContent = 'More stories from ' + CATEGORY_LABELS[category] + '.';

        headText.appendChild(eyebrow);
        headText.appendChild(title);
        headText.appendChild(subtitle);

        section.setAttribute('aria-labelledby', title.id);

        var controls = document.createElement('div');
        controls.className = 'vt-related-controls';
        controls.hidden = true; // revealed by the slider once layout is measured

        var prevBtn = makeControlButton('Previous articles', ICON_PREV, 'prev');
        var nextBtn = makeControlButton('Next articles', ICON_NEXT, 'next');
        controls.appendChild(prevBtn);
        controls.appendChild(nextBtn);

        head.appendChild(headText);
        head.appendChild(controls);

        /* ---- slider ---- */
        var slider = document.createElement('div');
        slider.className = 'vt-related-slider';
        slider.setAttribute('role', 'group');
        slider.setAttribute('aria-label', 'Related articles carousel');
        slider.tabIndex = 0;

        var fragment = document.createDocumentFragment();
        articles.forEach(function (article) {
            fragment.appendChild(buildCard(article));
        });
        slider.appendChild(fragment);

        section.appendChild(head);
        section.appendChild(slider);

        return section;
    }

    /* ---------------------------------------------------------------------
     * 6. Slider behaviour (infinite circular navigation)
     * ------------------------------------------------------------------ */

    function initSlider(section) {
        var slider = section.querySelector('.vt-related-slider');
        var controls = section.querySelector('.vt-related-controls');
        var prevBtn = section.querySelector('.vt-related-btn-prev');
        var nextBtn = section.querySelector('.vt-related-btn-next');

        if (!slider || !controls || !prevBtn || !nextBtn) {
            return;
        }

        var cards = Array.prototype.slice.call(slider.children);
        if (cards.length < 2) {
            controls.hidden = true;
            return;
        }

        var index = 0;        // card currently aligned to the left edge
        var pending = null;   // target of a click that is still animating
        var maxIndex = 0;     // last index that can actually be aligned
        var settleTimer = 0;
        var resizeTimer = 0;

        function maxScroll() {
            return Math.max(0, slider.scrollWidth - slider.clientWidth);
        }

        /** Layout offset of a card, independent of offsetParent. */
        function cardOffset(i) {
            var sliderRect = slider.getBoundingClientRect();
            var cardRect = cards[i].getBoundingClientRect();
            return (cardRect.left - sliderRect.left) + slider.scrollLeft;
        }

        function scrollForCard(i) {
            return Math.min(cardOffset(i), maxScroll());
        }

        function recomputeRange() {
            var limit = maxScroll();
            var last = 0;

            for (var i = 0; i < cards.length; i++) {
                if (cardOffset(i) <= limit + 1) {
                    last = i;
                }
            }

            maxIndex = last;
            controls.hidden = maxIndex === 0;

            if (index > maxIndex) { index = maxIndex; }
            if (pending !== null && pending > maxIndex) { pending = maxIndex; }
        }

        function nearestIndex() {
            var position = slider.scrollLeft;
            var best = 0;
            var bestDistance = Infinity;

            for (var i = 0; i <= maxIndex; i++) {
                var distance = Math.abs(scrollForCard(i) - position);
                if (distance < bestDistance - 0.5) {
                    bestDistance = distance;
                    best = i;
                }
            }
            return best;
        }

        function goTo(i) {
            var left = scrollForCard(i);
            if (typeof slider.scrollTo === 'function') {
                slider.scrollTo({
                    left: left,
                    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                });
            } else {
                slider.scrollLeft = left;
            }
        }

        function step(direction) {
            if (maxIndex <= 0) {
                return;
            }
            var base = pending === null ? index : pending;
            var target = base + direction;

            if (target > maxIndex) { target = 0; }        // wrap forward
            if (target < 0) { target = maxIndex; }        // wrap backward

            pending = target;
            goTo(target);
        }

        function onScroll() {
            window.clearTimeout(settleTimer);
            settleTimer = window.setTimeout(function () {
                index = nearestIndex();
                pending = null;
            }, SETTLE_DELAY);
        }

        function onResize() {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(recomputeRange, 150);
        }

        prevBtn.addEventListener('click', function () { step(-1); });
        nextBtn.addEventListener('click', function () { step(1); });
        slider.addEventListener('scroll', onScroll, { passive: true });

        slider.addEventListener('keydown', function (event) {
            if (event.target !== slider) {
                return; // don't hijack arrows while a card link has focus
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                step(1);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                step(-1);
            }
        });

        window.addEventListener('resize', onResize, { passive: true });

        // First measurement, after the browser has laid the section out.
        window.requestAnimationFrame(function () {
            recomputeRange();
            index = nearestIndex();
        });
    }

    /* ---------------------------------------------------------------------
     * 7. Mounting
     * ------------------------------------------------------------------ */

    function mount(container) {
        if (!container || container.getAttribute('data-vt-ready') === '1') {
            return;
        }
        container.setAttribute('data-vt-ready', '1');

        var category = asString(container.getAttribute('data-category'));
        var currentId = asString(container.getAttribute('data-current-article'));

        if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category)) {
            log('Missing or unknown data-category. Expected one of: ' +
                Object.keys(CATEGORY_LABELS).join(', '));
            return;
        }

        fetchCategory(category)
            .then(function (records) {
                var articles = prepareArticles(records, currentId);

                if (!articles.length) {
                    container.textContent = ''; // nothing to show: stay empty
                    return;
                }

                var section = buildSection(articles, category);
                container.textContent = '';
                container.appendChild(section);
                initSlider(section);
            })
            .catch(function (error) {
                // Never break the article page because of this component.
                log('Could not load related articles for "' + category + '".', error);
            });
    }

    function boot() {
        var containers = document.querySelectorAll('#related-articles');
        if (!containers.length) {
            return;
        }
        injectStyles();
        Array.prototype.forEach.call(containers, mount);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();