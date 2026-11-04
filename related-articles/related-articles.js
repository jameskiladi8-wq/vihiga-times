/*!
 * Vihiga Times — Related Articles System
 * Version 1.0.3  (responsive + containment rebuild)
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

    if (window.VTRelatedArticles) { return; }
    window.VTRelatedArticles = { version: '1.0.3' };

    /* ---------------------------------------------------------------------
     * 1. Configuration
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
    var SETTLE_DELAY = 130;
    var STYLE_ID = 'vt-related-styles';

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
     * 2. CSS
     * ------------------------------------------------------------------ */

    var CSS = [

        /* =========================================================
         * CONTAINER — explicit resets (no all:initial)
         * ======================================================= */
        '#related-articles{',
        'display:block!important;box-sizing:border-box!important;',
        'width:100%!important;max-width:100%!important;min-width:0!important;',
        'height:auto!important;max-height:none!important;',
        'contain:inline-size!important;',
        'margin:0!important;padding:0!important;border:0!important;',
        'background:transparent!important;',
        'position:static!important;float:none!important;clear:none!important;',
        'overflow:visible!important;}',

        /* =========================================================
         * SECTION ROOT — everything critical is !important
         * ======================================================= */
        '.vt-related-section.vt-related-section{',
        '--vt-accent:#0e6b45;--vt-accent-dark:#0a5236;--vt-accent-soft:#e9f4ee;',
        '--vt-ink:#14171c;--vt-muted:#5a6069;--vt-line:#e4dfd5;',
        '--vt-card:#ffffff;--vt-bg:#fffdf9;--vt-radius:14px;--vt-gap:16px;',
        'display:block!important;box-sizing:border-box!important;',
        'width:100%!important;max-width:100%!important;min-width:0!important;',
        'height:auto!important;max-height:none!important;',
        'contain:inline-size layout style!important;',
        'overflow:hidden!important;',
        'margin:40px 0 0!important;',
        'padding:26px 0 4px!important;',
        'border:0!important;border-top:1px solid var(--vt-line)!important;',
        'border-radius:0!important;',
        'background:var(--vt-bg)!important;color:var(--vt-ink)!important;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important;',
        'font-size:16px!important;font-weight:400!important;font-style:normal!important;',
        'line-height:1.5!important;letter-spacing:normal!important;word-spacing:normal!important;',
        'text-align:left!important;text-indent:0!important;text-transform:none!important;',
        'text-decoration:none!important;white-space:normal!important;direction:ltr!important;',
        'position:static!important;float:none!important;clear:none!important;box-shadow:none!important;',
        '-webkit-tap-highlight-color:transparent;}',

        '.vt-related-section.vt-related-section,',
        '.vt-related-section.vt-related-section *,',
        '.vt-related-section.vt-related-section *::before,',
        '.vt-related-section.vt-related-section *::after{box-sizing:border-box!important;}',

        '.vt-related-section.vt-related-section [hidden]{display:none!important;}',

        '.vt-related-section.vt-related-section .vt-related-sr-only{',
        'position:absolute!important;width:1px!important;height:1px!important;',
        'padding:0!important;margin:-1px!important;overflow:hidden!important;',
        'clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;',
        'white-space:nowrap!important;border:0!important;}',

        /* =========================================================
         * ELEMENT RESETS (defensive against article CSS)
         * ======================================================= */
        '.vt-related-section.vt-related-section img{',
        'display:block!important;max-width:none!important;min-width:0!important;',
        'height:auto!important;margin:0!important;padding:0!important;border:0!important;',
        'border-radius:0!important;box-shadow:none!important;background:transparent!important;',
        'vertical-align:middle!important;float:none!important;}',

        '.vt-related-section.vt-related-section a{',
        'color:inherit!important;text-decoration:none!important;background:transparent!important;',
        'border:0!important;padding:0!important;margin:0!important;font:inherit!important;',
        'box-shadow:none!important;}',

        '.vt-related-section.vt-related-section p{',
        'margin:0!important;padding:0!important;font:inherit!important;color:inherit!important;',
        'text-indent:0!important;letter-spacing:inherit!important;}',

        '.vt-related-section.vt-related-section h2,',
        '.vt-related-section.vt-related-section h3{',
        'margin:0!important;padding:0!important;font:inherit!important;color:inherit!important;',
        'text-transform:none!important;letter-spacing:inherit!important;',
        'border:0!important;background:transparent!important;}',

        '.vt-related-section.vt-related-section button{',
        'appearance:none!important;-webkit-appearance:none!important;',
        'margin:0!important;padding:0!important;border:0!important;',
        'background:transparent!important;font:inherit!important;color:inherit!important;',
        'cursor:pointer!important;box-shadow:none!important;',
        'text-transform:none!important;text-decoration:none!important;}',

        /* =========================================================
         * HEADING
         * ======================================================= */
        '.vt-related-section.vt-related-section .vt-related-head{',
        'display:flex!important;align-items:flex-end!important;',
        'justify-content:space-between!important;gap:18px!important;',
        'flex-wrap:wrap!important;margin:0 0 18px!important;}',

        '.vt-related-section.vt-related-section .vt-related-head-text{',
        'flex:1 1 260px!important;min-width:0!important;}',

        '.vt-related-section.vt-related-section .vt-related-eyebrow{',
        'display:inline-block!important;margin:0 0 10px!important;',
        'padding:5px 11px!important;border-radius:999px!important;',
        'background:var(--vt-accent-soft)!important;color:var(--vt-accent-dark)!important;',
        'font-size:11px!important;font-weight:800!important;',
        'letter-spacing:.14em!important;text-transform:uppercase!important;',
        'line-height:1.4!important;}',

        '.vt-related-section.vt-related-section .vt-related-title{',
        'margin:0 0 6px!important;font-size:clamp(18px,2vw,26px)!important;',
        'font-weight:800!important;line-height:1.2!important;',
        'letter-spacing:-.015em!important;color:var(--vt-ink)!important;}',

        '.vt-related-section.vt-related-section .vt-related-subtitle{',
        'margin:0!important;font-size:14px!important;line-height:1.55!important;',
        'color:var(--vt-muted)!important;}',

        /* =========================================================
         * CONTROLS
         * ======================================================= */
        '.vt-related-section.vt-related-section .vt-related-controls{',
        'display:flex!important;gap:8px!important;flex:0 0 auto!important;}',

        '.vt-related-section.vt-related-section .vt-related-btn{',
        'width:42px!important;height:42px!important;border-radius:50%!important;',
        'border:1px solid var(--vt-line)!important;background:#fff!important;',
        'color:var(--vt-ink)!important;display:inline-flex!important;',
        'align-items:center!important;justify-content:center!important;',
        'padding:0!important;cursor:pointer!important;',
        '-webkit-tap-highlight-color:transparent!important;',
        'transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease!important;}',

        '.vt-related-section.vt-related-section .vt-related-btn:hover{',
        'background:var(--vt-accent)!important;border-color:var(--vt-accent)!important;',
        'color:#fff!important;}',

        '.vt-related-section.vt-related-section .vt-related-btn:active{transform:scale(.95)!important;}',
        '.vt-related-section.vt-related-section .vt-related-btn svg{display:block!important;}',

        /* =========================================================
         * SLIDER — the only scroll container
         * ======================================================= */
        '.vt-related-section.vt-related-section .vt-related-slider{',
        'display:flex!important;flex-wrap:nowrap!important;',
        'gap:var(--vt-gap)!important;',
        'width:100%!important;max-width:100%!important;min-width:0!important;',
        'box-sizing:border-box!important;',
        'overflow-x:auto!important;overflow-y:hidden!important;',
        'scroll-snap-type:x mandatory!important;scroll-behavior:smooth!important;',
        '-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;',
        'padding:0 0 10px 0!important;margin:0!important;',
        'scrollbar-width:thin!important;scrollbar-color:#cfc8bc transparent!important;}',

        '.vt-related-section.vt-related-section .vt-related-slider::-webkit-scrollbar{height:6px!important;}',
        '.vt-related-section.vt-related-section .vt-related-slider::-webkit-scrollbar-track{background:transparent!important;}',
        '.vt-related-section.vt-related-section .vt-related-slider::-webkit-scrollbar-thumb{',
        'background:#d8d2c6!important;border-radius:999px!important;}',

        /* =========================================================
         * CARDS — responsive with absolute pixel ceiling
         * ======================================================= */
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex:0 0 82%!important;',
        'max-width:min(82%,400px)!important;',
        'min-width:0!important;',
        'box-sizing:border-box!important;',
        'scroll-snap-align:start!important;',
        'display:flex!important;flex-direction:column!important;',
        'background:var(--vt-card)!important;',
        'border:1px solid var(--vt-line)!important;',
        'border-radius:var(--vt-radius)!important;',
        'overflow:hidden!important;',
        'box-shadow:0 1px 2px rgba(16,24,40,.04)!important;',
        'transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease!important;}',

        '.vt-related-section.vt-related-section .vt-related-card:hover{',
        'box-shadow:0 8px 22px rgba(16,24,40,.10)!important;',
        'border-color:#d6cfc1!important;transform:translateY(-2px)!important;}',

        '.vt-related-section.vt-related-section .vt-related-thumb{',
        'display:block!important;position:relative!important;',
        'aspect-ratio:16/9!important;',
        'background:#f1efe9!important;overflow:hidden!important;',
        'margin:0!important;padding:0!important;border:0!important;',
        'border-radius:0!important;text-decoration:none!important;}',

        '.vt-related-section.vt-related-section .vt-related-thumb-img{',
        'width:100%!important;height:100%!important;',
        'object-fit:cover!important;display:block!important;',
        'margin:0!important;padding:0!important;border:0!important;border-radius:0!important;',
        'max-width:none!important;min-width:0!important;min-height:0!important;max-height:none!important;',
        'box-shadow:none!important;background:transparent!important;',
        'transition:transform .35s ease!important;}',

        '.vt-related-section.vt-related-section .vt-related-card:hover .vt-related-thumb-img{',
        'transform:scale(1.04)!important;}',

        '.vt-related-section.vt-related-section .vt-related-thumb-fallback{',
        'object-fit:contain!important;background:#f2efe9!important;}',

        '.vt-related-section.vt-related-section .vt-related-body{',
        'display:flex!important;flex-direction:column!important;gap:6px!important;',
        'flex:1 1 auto!important;padding:12px 14px 14px!important;margin:0!important;}',

        '.vt-related-section.vt-related-section .vt-related-card-title{',
        'margin:0!important;font-size:15px!important;font-weight:700!important;',
        'line-height:1.35!important;letter-spacing:-.005em!important;',
        'color:var(--vt-ink)!important;}',

        '.vt-related-section.vt-related-section .vt-related-card-title a{',
        'color:var(--vt-ink)!important;text-decoration:none!important;',
        'border:0!important;background:transparent!important;font:inherit!important;}',

        '.vt-related-section.vt-related-section .vt-related-card-title a:hover{',
        'color:var(--vt-accent)!important;}',

        '.vt-related-section.vt-related-section .vt-related-card-text{',
        'margin:0!important;font-size:13px!important;line-height:1.5!important;',
        'color:var(--vt-muted)!important;',
        'display:-webkit-box!important;-webkit-line-clamp:2!important;',
        '-webkit-box-orient:vertical!important;overflow:hidden!important;',
        'text-indent:0!important;letter-spacing:normal!important;}',

        '.vt-related-section.vt-related-section .vt-related-more{',
        'display:inline-flex!important;align-items:center!important;gap:6px!important;',
        'margin-top:auto!important;padding-top:4px!important;',
        'font-size:12.5px!important;font-weight:800!important;letter-spacing:.01em!important;',
        'color:var(--vt-accent)!important;text-decoration:none!important;',
        'border:0!important;background:transparent!important;}',

        '.vt-related-section.vt-related-section .vt-related-more:hover{',
        'color:var(--vt-accent-dark)!important;}',

        '.vt-related-section.vt-related-section .vt-related-more-icon{',
        'display:inline-flex!important;transition:transform .18s ease!important;}',

        '.vt-related-section.vt-related-section .vt-related-more:hover .vt-related-more-icon{',
        'transform:translateX(3px)!important;}',

        /* =========================================================
         * FOCUS
         * ======================================================= */
        '.vt-related-section.vt-related-section a:focus-visible,',
        '.vt-related-section.vt-related-section button:focus-visible,',
        '.vt-related-section.vt-related-section .vt-related-slider:focus-visible{',
        'outline:3px solid #7fb99f!important;outline-offset:2px!important;border-radius:8px!important;}',

        /* =========================================================
         * RESPONSIVE BREAKPOINTS (with pixel ceilings at every step)
         * ======================================================= */
        '@media (min-width:480px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:72%!important;max-width:min(72%,400px)!important;}}',

        '@media (min-width:640px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:56%!important;max-width:min(56%,420px)!important;}}',

        '@media (min-width:768px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:46%!important;max-width:min(46%,440px)!important;}}',

        '@media (min-width:1024px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:32%!important;max-width:min(32%,480px)!important;}}',

        '@media (min-width:1280px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:26%!important;max-width:min(26%,500px)!important;}}',

        '@media (max-width:359px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:88%!important;max-width:88%!important;}}',

        /* =========================================================
         * REDUCED MOTION
         * ======================================================= */
        '@media (prefers-reduced-motion:reduce){',
        '.vt-related-section.vt-related-section .vt-related-slider{scroll-behavior:auto!important;}',
        '.vt-related-section.vt-related-section .vt-related-card,',
        '.vt-related-section.vt-related-section .vt-related-thumb-img,',
        '.vt-related-section.vt-related-section .vt-related-btn,',
        '.vt-related-section.vt-related-section .vt-related-more-icon{transition:none!important;}',
        '.vt-related-section.vt-related-section .vt-related-card:hover{transform:none!important;}',
        '.vt-related-section.vt-related-section .vt-related-card:hover .vt-related-thumb-img{transform:none!important;}}'

    ].join('');

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) { return; }
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* ---------------------------------------------------------------------
     * 3. Helpers
     * ------------------------------------------------------------------ */

    function log(message, detail) {
        if (window.console && typeof window.console.warn === 'function') {
            window.console.warn('[Vihiga Times / Related Articles] ' + message, detail || '');
        }
    }

    function asString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function isSafeUrl(value) {
        var raw = asString(value);
        if (!raw) { return false; }
        if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(raw)) {
            try {
                var parsed = new URL(raw, window.location.href);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
            } catch (err) { return false; }
        }
        return raw.charAt(0) === '/' || raw.charAt(0) === '#' ||
            raw.indexOf('./') === 0 || raw.indexOf('../') === 0 ||
            raw.indexOf('?') === 0 || /^[\w\-./]+$/.test(raw);
    }

    function parseDate(value) {
        var raw = asString(value);
        if (!raw) { return 0; }
        var time = Date.parse(raw);
        return isNaN(time) ? 0 : time;
    }

    function prefersReducedMotion() {
        return !!(window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    /* ---------------------------------------------------------------------
     * 4. Data loading, filtering, sorting
     * ------------------------------------------------------------------ */

    function fetchCategory(category) {
        var url = JSON_BASE + encodeURIComponent(category) + '.json';
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

    function prepareArticles(records, currentId) {
        var seen = Object.create(null);
        var out = [];

        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            if (!record || typeof record !== 'object') { continue; }

            var id = asString(record.id);
            var title = asString(record.title);
            var link = asString(record.link);
            var status = asString(record.status).toLowerCase();

            if (!id || !title || !link) { continue; }
            if (status !== 'published') { continue; }
            if (currentId && id === currentId) { continue; }
            if (seen[id]) { continue; }
            if (!isSafeUrl(link)) { continue; }

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

        out.sort(function (a, b) { return b.time - a.time; });
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

        img.addEventListener('error', function handleImageError() {
            img.removeEventListener('error', handleImageError);
            img.src = FALLBACK_IMAGE;
            img.classList.add('vt-related-thumb-fallback');
        });

        img.src = article.image;
        thumbLink.appendChild(img);

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
     * 6. Slider behaviour
     * ------------------------------------------------------------------ */

    function initSlider(section) {
        var slider = section.querySelector('.vt-related-slider');
        var controls = section.querySelector('.vt-related-controls');
        var prevBtn = section.querySelector('.vt-related-btn-prev');
        var nextBtn = section.querySelector('.vt-related-btn-next');

        if (!slider || !controls || !prevBtn || !nextBtn) { return; }

        var cards = Array.prototype.slice.call(slider.children);
        if (cards.length < 2) { controls.hidden = true; return; }

        var index = 0, pending = null, maxIndex = 0;
        var settleTimer = 0, resizeTimer = 0;

        function maxScroll() {
            return Math.max(0, slider.scrollWidth - slider.clientWidth);
        }

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
                if (cardOffset(i) <= limit + 1) { last = i; }
            }
            maxIndex = last;
            controls.hidden = maxIndex === 0;
            if (index > maxIndex) { index = maxIndex; }
            if (pending !== null && pending > maxIndex) { pending = maxIndex; }
        }

        function nearestIndex() {
            var position = slider.scrollLeft, best = 0, bestDistance = Infinity;
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
            if (maxIndex <= 0) { return; }
            var base = pending === null ? index : pending;
            var target = base + direction;
            if (target > maxIndex) { target = 0; }
            if (target < 0) { target = maxIndex; }
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
            if (event.target !== slider) { return; }
            if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
            else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
        });

        window.addEventListener('resize', onResize, { passive: true });

        window.requestAnimationFrame(function () {
            recomputeRange();
            index = nearestIndex();
        });
    }

    /* ---------------------------------------------------------------------
     * 7. Post-mount safety net
     * ------------------------------------------------------------------ */

    function checkAndFixOverflow(section) {
        if (!section || !section.parentNode) { return; }
        var vw = document.documentElement.clientWidth;
        var parentW = section.parentElement
            ? section.parentElement.clientWidth : vw;
        var target = Math.min(vw, parentW || vw);

        // Reset any prior inline width so measurement is honest
        section.style.removeProperty('width');
        section.style.removeProperty('max-width');

        if (section.offsetWidth > target + 1) {
            section.style.setProperty('width', target + 'px', 'important');
            section.style.setProperty('max-width', target + 'px', 'important');
            section.style.setProperty('overflow-x', 'hidden', 'important');
            log('Section exceeded viewport (' + section.offsetWidth + 'px > ' +
                target + 'px) — applied inline width fix.');
        }
    }

    function checkViewportMeta() {
        var meta = document.querySelector('meta[name="viewport"]');
        var content = meta && meta.getAttribute('content');
        if (!content || !/width\s*=\s*device-width/i.test(content)) {
            log('Missing or incorrect <meta name="viewport">. Mobile browsers ' +
                'may render at ~980px virtual width, making content look oversized. ' +
                'Add: <meta name="viewport" content="width=device-width, initial-scale=1">');
        }
    }

    /* ---------------------------------------------------------------------
     * 8. Mounting
     * ------------------------------------------------------------------ */

    function mount(container) {
        if (!container || container.getAttribute('data-vt-ready') === '1') { return; }
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
                    container.textContent = '';
                    return;
                }

                var section = buildSection(articles, category);
                container.textContent = '';
                container.appendChild(section);
                initSlider(section);

                // Safety net: measure and clamp after the browser has laid out
                setTimeout(function () { checkAndFixOverflow(section); }, 120);

                // Re-check on viewport resize
                var resizeTimer = 0;
                window.addEventListener('resize', function () {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function () {
                        checkAndFixOverflow(section);
                    }, 200);
                }, { passive: true });
            })
            .catch(function (error) {
                log('Could not load related articles for "' + category + '".', error);
            });
    }

    function boot() {
        checkViewportMeta();
        var containers = document.querySelectorAll('#related-articles');
        if (!containers.length) { return; }
        injectStyles();
        Array.prototype.forEach.call(containers, mount);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();