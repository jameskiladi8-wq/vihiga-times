/*!
 * Vihiga Times — Related Articles System
 * Version 1.0.5  (external stylesheet build)
 * Vanilla JavaScript. No dependencies. No build step.
 *
 * Requires two files in this folder:
 *   - related-articles.css   (all styles)
 *   - related-articles.js    (this file)
 *
 * Integration (on each article page):
 *   <div id="related-articles"
 *        data-category="local-news"
 *        data-current-article="your-article-slug"></div>
 *   <script src="/related-articles/related-articles.js" defer></script>
 */
(function () {
    'use strict';

    if (window.VTRelatedArticles) { return; }
    window.VTRelatedArticles = { version: '1.0.5' };

    /* ---------------------------------------------------------------------
     * Configuration
     * ------------------------------------------------------------------ */
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

    var MAX_ARTICLES = 6;
    var JSON_BASE = '/related-articles/';
    var CSS_FILE = 'related-articles.css';
    var CSS_VERSION = '1.0.5';           // bump when you edit the CSS file
    var STYLESHEET_ID = 'vt-related-css';
    var SETTLE_DELAY = 130;

    var FALLBACK_IMAGE =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">' +
            '<rect width="640" height="360" fill="#f2efe9"/>' +
            '<g fill="none" stroke="#b9b2a6" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="248" y="126" width="144" height="112" rx="12"/>' +
            '<circle cx="290" cy="168" r="15"/>' +
            '<path d="M256 228l40-38 30 26 24-20 34 32"/></g>' +
            '<text x="320" y="298" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" ' +
            'font-size="18" fill="#8d8579">Image unavailable</text></svg>'
        );

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
     * Stylesheet loader — inject a <link> and wait for it
     * ------------------------------------------------------------------ */
    function loadStylesheet() {
        return new Promise(function (resolve) {
            if (document.getElementById(STYLESHEET_ID)) {
                resolve();
                return;
            }

            var link = document.createElement('link');
            link.id = STYLESHEET_ID;
            link.rel = 'stylesheet';
            link.href = JSON_BASE + CSS_FILE + '?v=' + encodeURIComponent(CSS_VERSION);

            var done = false;
            function finish(reason) {
                if (done) { return; }
                done = true;
                if (reason === 'error') {
                    log('Stylesheet failed to load: ' + link.href +
                        '. Related articles will render unstyled.');
                }
                resolve();
            }

            link.onload = function () { finish('ok'); };
            link.onerror = function () { finish('error'); };
            setTimeout(function () { finish('timeout'); }, 4000);

            document.head.appendChild(link);
        });
    }

    /* ---------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------ */
    function log(message, detail) {
        if (window.console && typeof window.console.warn === 'function') {
            window.console.warn('[Vihiga Times / Related Articles] ' + message, detail || '');
        }
    }

    function asString(v) { return typeof v === 'string' ? v.trim() : ''; }

    function isSafeUrl(value) {
        var raw = asString(value);
        if (!raw) { return false; }
        if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(raw)) {
            try {
                var u = new URL(raw, window.location.href);
                return u.protocol === 'http:' || u.protocol === 'https:';
            } catch (e) { return false; }
        }
        return raw.charAt(0) === '/' || raw.charAt(0) === '#' ||
            raw.indexOf('./') === 0 || raw.indexOf('../') === 0 ||
            raw.indexOf('?') === 0 || /^[\w\-./]+$/.test(raw);
    }

    function parseDate(v) {
        var raw = asString(v);
        if (!raw) { return 0; }
        var t = Date.parse(raw);
        return isNaN(t) ? 0 : t;
    }

    function prefersReducedMotion() {
        return !!(window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    /* ---------------------------------------------------------------------
     * Data
     * ------------------------------------------------------------------ */
    function fetchCategory(category) {
        var url = JSON_BASE + encodeURIComponent(category) + '.json';
        return fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
            .then(function (r) {
                if (!r.ok) { throw new Error('HTTP ' + r.status + ' for ' + url); }
                return r.json();
            })
            .then(function (data) {
                if (!Array.isArray(data)) { throw new Error('Expected array in ' + url); }
                return data;
            });
    }

    function prepareArticles(records, currentId) {
        var seen = Object.create(null);
        var out = [];
        for (var i = 0; i < records.length; i++) {
            var r = records[i];
            if (!r || typeof r !== 'object') { continue; }
            var id = asString(r.id), title = asString(r.title);
            var link = asString(r.link), status = asString(r.status).toLowerCase();
            if (!id || !title || !link) { continue; }
            if (status !== 'published') { continue; }
            if (currentId && id === currentId) { continue; }
            if (seen[id]) { continue; }
            if (!isSafeUrl(link)) { continue; }
            var image = asString(r.image);
            seen[id] = true;
            out.push({
                id: id, title: title, description: asString(r.description),
                image: (image && isSafeUrl(image)) ? image : FALLBACK_IMAGE,
                imageAlt: asString(r.imageAlt) || title,
                link: link, time: parseDate(r.date)
            });
        }
        out.sort(function (a, b) { return b.time - a.time; });
        return out.slice(0, MAX_ARTICLES);
    }

    /* ---------------------------------------------------------------------
     * Rendering
     * ------------------------------------------------------------------ */
    var instanceCounter = 0;

    function makeControlButton(label, icon, modifier) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'vt-related-btn vt-related-btn-' + modifier;
        button.setAttribute('aria-label', label);
        button.innerHTML = icon;
        return button;
    }

    function buildCard(article) {
        var card = document.createElement('article');
        card.className = 'vt-related-card';

        var thumbLink = document.createElement('a');
        thumbLink.className = 'vt-related-thumb';
        thumbLink.href = article.link;
        thumbLink.tabIndex = -1;
        thumbLink.setAttribute('aria-hidden', 'true');

        var img = document.createElement('img');
        img.className = 'vt-related-thumb-img';
        img.alt = article.imageAlt;
        img.width = 640;
        img.height = 360;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', function h() {
            img.removeEventListener('error', h);
            img.src = FALLBACK_IMAGE;
            img.classList.add('vt-related-thumb-fallback');
        });
        img.src = article.image;
        thumbLink.appendChild(img);

        var body = document.createElement('div');
        body.className = 'vt-related-body';

        var h3 = document.createElement('h3');
        h3.className = 'vt-related-card-title';
        var titleLink = document.createElement('a');
        titleLink.href = article.link;
        titleLink.textContent = article.title;
        h3.appendChild(titleLink);
        body.appendChild(h3);

        if (article.description) {
            var p = document.createElement('p');
            p.className = 'vt-related-card-text';
            p.textContent = article.description;
            body.appendChild(p);
        }

        var more = document.createElement('a');
        more.className = 'vt-related-more';
        more.href = article.link;
        more.appendChild(document.createTextNode('Read More'));
        var sr = document.createElement('span');
        sr.className = 'vt-related-sr-only';
        sr.textContent = ' about ' + article.title;
        more.appendChild(sr);
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
        controls.hidden = true;
        controls.appendChild(makeControlButton('Previous articles', ICON_PREV, 'prev'));
        controls.appendChild(makeControlButton('Next articles', ICON_NEXT, 'next'));

        head.appendChild(headText);
        head.appendChild(controls);

        var slider = document.createElement('div');
        slider.className = 'vt-related-slider';
        slider.setAttribute('role', 'group');
        slider.setAttribute('aria-label', 'Related articles carousel');
        slider.tabIndex = 0;

        var frag = document.createDocumentFragment();
        articles.forEach(function (a) { frag.appendChild(buildCard(a)); });
        slider.appendChild(frag);

        section.appendChild(head);
        section.appendChild(slider);
        return section;
    }

    /* ---------------------------------------------------------------------
     * Slider
     * ------------------------------------------------------------------ */
    function initSlider(section) {
        var slider = section.querySelector('.vt-related-slider');
        var controls = section.querySelector('.vt-related-controls');
        var prevBtn = section.querySelector('.vt-related-btn-prev');
        var nextBtn = section.querySelector('.vt-related-btn-next');
        if (!slider || !controls || !prevBtn || !nextBtn) { return; }

        var cards = [].slice.call(slider.children);
        if (cards.length < 2) { controls.hidden = true; return; }

        var index = 0, pending = null, maxIndex = 0;
        var settleTimer = 0, resizeTimer = 0;

        function maxScroll() { return Math.max(0, slider.scrollWidth - slider.clientWidth); }
        function cardOffset(i) {
            var sr = slider.getBoundingClientRect();
            var cr = cards[i].getBoundingClientRect();
            return (cr.left - sr.left) + slider.scrollLeft;
        }
        function scrollForCard(i) { return Math.min(cardOffset(i), maxScroll()); }

        function recomputeRange() {
            var limit = maxScroll(), last = 0;
            for (var i = 0; i < cards.length; i++) {
                if (cardOffset(i) <= limit + 1) { last = i; }
            }
            maxIndex = last;
            controls.hidden = maxIndex === 0;
            if (index > maxIndex) { index = maxIndex; }
            if (pending !== null && pending > maxIndex) { pending = maxIndex; }
        }

        function nearestIndex() {
            var pos = slider.scrollLeft, best = 0, dist = Infinity;
            for (var i = 0; i <= maxIndex; i++) {
                var d = Math.abs(scrollForCard(i) - pos);
                if (d < dist - 0.5) { dist = d; best = i; }
            }
            return best;
        }

        function goTo(i) {
            var left = scrollForCard(i);
            if (typeof slider.scrollTo === 'function') {
                slider.scrollTo({ left: left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
            } else { slider.scrollLeft = left; }
        }

        function step(dir) {
            if (maxIndex <= 0) { return; }
            var base = pending === null ? index : pending;
            var target = base + dir;
            if (target > maxIndex) { target = 0; }
            if (target < 0) { target = maxIndex; }
            pending = target;
            goTo(target);
        }

        prevBtn.addEventListener('click', function () { step(-1); });
        nextBtn.addEventListener('click', function () { step(1); });
        slider.addEventListener('scroll', function () {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(function () { index = nearestIndex(); pending = null; }, SETTLE_DELAY);
        }, { passive: true });
        slider.addEventListener('keydown', function (e) {
            if (e.target !== slider) { return; }
            if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
        });
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(recomputeRange, 150);
        }, { passive: true });

        requestAnimationFrame(function () { recomputeRange(); index = nearestIndex(); });
    }

    /* ---------------------------------------------------------------------
     * Post-mount safety net (kept from v1.0.4 — unchanged)
     * ------------------------------------------------------------------ */
    function hardClamp(el, label) {
        if (!el || !el.offsetWidth) { return; }
        var vw = document.documentElement.clientWidth || window.innerWidth;
        var current = el.offsetWidth;

        el.style.removeProperty('width');
        el.style.removeProperty('max-width');

        if (current > vw + 1) {
            el.style.setProperty('width', vw + 'px', 'important');
            el.style.setProperty('max-width', vw + 'px', 'important');
            el.style.setProperty('overflow-x', 'hidden', 'important');
            el.style.setProperty('box-sizing', 'border-box', 'important');
            log('Clamped ' + label + ': was ' + current + 'px, viewport ' + vw + 'px.');
        }
    }

    function diagnoseParent(section) {
        var vw = document.documentElement.clientWidth || window.innerWidth;
        var parent = section.parentElement;
        if (parent && parent.offsetWidth > vw + 1) {
            log('Parent element (' + parent.className + ') is ' + parent.offsetWidth +
                'px wide — wider than viewport (' + vw + 'px). ' +
                'Check styles.css for: .article__main { min-width: 0; } ' +
                'and .article-content img { max-width: 100%; height: auto; }');
        }
    }

    function checkViewportMeta() {
        var meta = document.querySelector('meta[name="viewport"]');
        var content = meta && meta.getAttribute('content');
        if (!content || !/width\s*=\s*device-width/i.test(content)) {
            log('Missing <meta name="viewport"> on this page. Mobile browsers will ' +
                'render at ~980px virtual width. Add in <head>: ' +
                '<meta name="viewport" content="width=device-width, initial-scale=1">');
        }
    }

    /* ---------------------------------------------------------------------
     * Mount
     * ------------------------------------------------------------------ */
    function mount(container) {
        if (!container || container.getAttribute('data-vt-ready') === '1') { return; }
        container.setAttribute('data-vt-ready', '1');

        var category = asString(container.getAttribute('data-category'));
        var currentId = asString(container.getAttribute('data-current-article'));

        if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category)) {
            log('Unknown data-category="' + category + '". Expected one of: ' +
                Object.keys(CATEGORY_LABELS).join(', '));
            return;
        }

        fetchCategory(category).then(function (records) {
            var articles = prepareArticles(records, currentId);
            if (!articles.length) { container.textContent = ''; return; }

            var section = buildSection(articles, category);
            container.textContent = '';
            container.appendChild(section);
            initSlider(section);

            requestAnimationFrame(function () {
                hardClamp(container, '#related-articles');
                hardClamp(section, '.vt-related-section');
                diagnoseParent(section);
            });

            window.addEventListener('load', function () {
                hardClamp(container, '#related-articles');
                hardClamp(section, '.vt-related-section');
            }, { once: true });

            var rt = 0;
            window.addEventListener('resize', function () {
                clearTimeout(rt);
                rt = setTimeout(function () {
                    hardClamp(container, '#related-articles');
                    hardClamp(section, '.vt-related-section');
                }, 200);
            }, { passive: true });
        }).catch(function (err) {
            log('Could not load related articles for "' + category + '".', err);
        });
    }

    function boot() {
        checkViewportMeta();
        var containers = document.querySelectorAll('#related-articles');
        if (!containers.length) { return; }

        // Ensure the CSS is loaded BEFORE mounting, so cards appear styled.
        loadStylesheet().then(function () {
            [].forEach.call(containers, mount);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();