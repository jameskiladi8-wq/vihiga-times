/*!
 * Vihiga Times — Related Articles System
 * Version 1.0.4  (viewport-based sizing + JS clamp)
 * Vanilla JavaScript. No dependencies. No build step.
 *
 * Integration (on each article page, near the bottom of the article):
 *
 *   <div id="related-articles"
 *        data-category="local-news"
 *        data-current-article="your-article-slug"></div>
 *
 *   <script src="/related-articles/related-articles.js" defer></script>
 */
(function () {
    'use strict';

    if (window.VTRelatedArticles) { return; }
    window.VTRelatedArticles = { version: '1.0.4' };

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
     * CSS
     *
     * KEY FIXES IN THIS VERSION:
     *  1. Card widths use `calc(100vw - Npx)` caps, not percentages.
     *     Percentages resolve to `auto` during flex intrinsic sizing,
     *     making `min(82%, 400px)` invalid and the cap ignored.
     *     `calc(100vw - 32px)` is always definite, so the cap always applies.
     *  2. Section carries `contain: inline-size` (primary) PLUS an explicit
     *     `max-width: min(100%, 100vw)` so even unsupported browsers cannot
     *     grow it beyond the viewport.
     *  3. JS post-mount `hardClamp()` measures and applies an inline width
     *     as a final safety net.
     * ------------------------------------------------------------------ */

    var CSS = [

        /* ---------- container ---------- */
        '#related-articles{',
        'display:block!important;box-sizing:border-box!important;',
        'width:100%!important;max-width:min(100%,100vw)!important;min-width:0!important;',
        'height:auto!important;',
        'contain:inline-size!important;',
        'margin:0!important;padding:0!important;border:0!important;',
        'background:transparent!important;',
        'position:static!important;float:none!important;clear:none!important;',
        'overflow:visible!important;}',

        /* ---------- section root ---------- */
        '.vt-related-section.vt-related-section{',
        '--vt-accent:#0e6b45;--vt-accent-dark:#0a5236;--vt-accent-soft:#e9f4ee;',
        '--vt-ink:#14171c;--vt-muted:#5a6069;--vt-line:#e4dfd5;',
        '--vt-card:#ffffff;--vt-bg:#fffdf9;--vt-radius:14px;--vt-gap:14px;',
        'display:block!important;box-sizing:border-box!important;',
        'width:100%!important;',
        'max-width:min(100%,100vw)!important;',
        'min-width:0!important;height:auto!important;',
        'contain:inline-size!important;',
        'overflow:hidden!important;',
        'margin:40px 0 0!important;padding:22px 0 4px!important;',
        'border:0!important;border-top:1px solid var(--vt-line)!important;',
        'border-radius:0!important;',
        'background:var(--vt-bg)!important;color:var(--vt-ink)!important;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important;',
        'font-size:16px!important;font-weight:400!important;line-height:1.5!important;',
        'letter-spacing:normal!important;text-align:left!important;text-indent:0!important;',
        'text-transform:none!important;text-decoration:none!important;white-space:normal!important;',
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

        /* ---------- element resets ---------- */
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
        'text-indent:0!important;}',

        '.vt-related-section.vt-related-section h2,',
        '.vt-related-section.vt-related-section h3{',
        'margin:0!important;padding:0!important;font:inherit!important;color:inherit!important;',
        'text-transform:none!important;letter-spacing:inherit!important;',
        'border:0!important;background:transparent!important;}',

        '.vt-related-section.vt-related-section button{',
        'appearance:none!important;-webkit-appearance:none!important;',
        'margin:0!important;padding:0!important;border:0!important;',
        'background:transparent!important;font:inherit!important;color:inherit!important;',
        'cursor:pointer!important;box-shadow:none!important;}',

        /* ---------- heading ---------- */
        '.vt-related-section.vt-related-section .vt-related-head{',
        'display:flex!important;align-items:flex-end!important;',
        'justify-content:space-between!important;gap:14px!important;',
        'flex-wrap:wrap!important;margin:0 0 14px!important;}',

        '.vt-related-section.vt-related-section .vt-related-head-text{',
        'flex:1 1 220px!important;min-width:0!important;}',

        '.vt-related-section.vt-related-section .vt-related-eyebrow{',
        'display:inline-block!important;margin:0 0 8px!important;',
        'padding:5px 11px!important;border-radius:999px!important;',
        'background:var(--vt-accent-soft)!important;color:var(--vt-accent-dark)!important;',
        'font-size:11px!important;font-weight:800!important;',
        'letter-spacing:.14em!important;text-transform:uppercase!important;line-height:1.4!important;}',

        '.vt-related-section.vt-related-section .vt-related-title{',
        'margin:0 0 6px!important;',
        'font-size:clamp(18px,2vw,26px)!important;font-weight:800!important;',
        'line-height:1.2!important;letter-spacing:-.015em!important;color:var(--vt-ink)!important;}',

        '.vt-related-section.vt-related-section .vt-related-subtitle{',
        'margin:0!important;font-size:14px!important;line-height:1.55!important;',
        'color:var(--vt-muted)!important;}',

        /* ---------- controls ---------- */
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
        'background:var(--vt-accent)!important;border-color:var(--vt-accent)!important;color:#fff!important;}',
        '.vt-related-section.vt-related-section .vt-related-btn:active{transform:scale(.95)!important;}',
        '.vt-related-section.vt-related-section .vt-related-btn svg{display:block!important;}',

        /* ---------- slider ---------- */
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

        /* ---------- cards ----------
         * flex-basis sets the target width relative to slider,
         * max-width caps it with a DEFINITE viewport-based length.
         * Result: card always fits the viewport even if slider is broken.
         */
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex:0 0 82%!important;',
        'max-width:min(400px, calc(100vw - 32px))!important;',
        'min-width:0!important;',
        'box-sizing:border-box!important;',
        'scroll-snap-align:start!important;',
        'display:flex!important;flex-direction:column!important;',
        'background:var(--vt-card)!important;',
        'border:1px solid var(--vt-line)!important;',
        'border-radius:var(--vt-radius)!important;overflow:hidden!important;',
        'box-shadow:0 1px 2px rgba(16,24,40,.04)!important;',
        'transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease!important;}',

        '.vt-related-section.vt-related-section .vt-related-card:hover{',
        'box-shadow:0 8px 22px rgba(16,24,40,.10)!important;',
        'border-color:#d6cfc1!important;transform:translateY(-2px)!important;}',

        '.vt-related-section.vt-related-section .vt-related-thumb{',
        'display:block!important;position:relative!important;',
        'aspect-ratio:16/9!important;',
        'background:#f1efe9!important;overflow:hidden!important;',
        'margin:0!important;padding:0!important;border:0!important;border-radius:0!important;}',

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
        'line-height:1.35!important;letter-spacing:-.005em!important;color:var(--vt-ink)!important;}',

        '.vt-related-section.vt-related-section .vt-related-card-title a{',
        'color:var(--vt-ink)!important;text-decoration:none!important;font:inherit!important;}',
        '.vt-related-section.vt-related-section .vt-related-card-title a:hover{',
        'color:var(--vt-accent)!important;}',

        '.vt-related-section.vt-related-section .vt-related-card-text{',
        'margin:0!important;font-size:13px!important;line-height:1.5!important;',
        'color:var(--vt-muted)!important;',
        'display:-webkit-box!important;-webkit-line-clamp:2!important;',
        '-webkit-box-orient:vertical!important;overflow:hidden!important;',
        'text-indent:0!important;}',

        '.vt-related-section.vt-related-section .vt-related-more{',
        'display:inline-flex!important;align-items:center!important;gap:6px!important;',
        'margin-top:auto!important;padding-top:4px!important;',
        'font-size:12.5px!important;font-weight:800!important;letter-spacing:.01em!important;',
        'color:var(--vt-accent)!important;text-decoration:none!important;}',
        '.vt-related-section.vt-related-section .vt-related-more:hover{',
        'color:var(--vt-accent-dark)!important;}',

        '.vt-related-section.vt-related-section .vt-related-more-icon{',
        'display:inline-flex!important;transition:transform .18s ease!important;}',
        '.vt-related-section.vt-related-section .vt-related-more:hover .vt-related-more-icon{',
        'transform:translateX(3px)!important;}',

        /* ---------- focus ---------- */
        '.vt-related-section.vt-related-section a:focus-visible,',
        '.vt-related-section.vt-related-section button:focus-visible,',
        '.vt-related-section.vt-related-section .vt-related-slider:focus-visible{',
        'outline:3px solid #7fb99f!important;outline-offset:2px!important;border-radius:8px!important;}',

        /* ---------- responsive breakpoints (with viewport caps at each) ---------- */
        '@media (min-width:480px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:72%!important;',
        'max-width:min(440px, calc(100vw - 48px))!important;}}',

        '@media (min-width:640px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:56%!important;',
        'max-width:min(460px, calc(100vw - 64px))!important;}}',

        '@media (min-width:768px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:46%!important;',
        'max-width:min(480px, calc(100vw - 80px))!important;}}',

        '@media (min-width:1024px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:32%!important;',
        'max-width:min(520px, calc(100vw - 100px))!important;}}',

        '@media (min-width:1280px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:26%!important;',
        'max-width:min(560px, calc(100vw - 120px))!important;}}',

        '@media (max-width:359px){',
        '.vt-related-section.vt-related-section .vt-related-card{',
        'flex-basis:88%!important;',
        'max-width:calc(100vw - 24px)!important;}}',

        /* ---------- reduced motion ---------- */
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
     * Post-mount safety net
     * ------------------------------------------------------------------ */
    function hardClamp(el, label) {
        if (!el || !el.offsetWidth) { return; }
        var vw = document.documentElement.clientWidth || window.innerWidth;
        var current = el.offsetWidth;

        // Reset inline width so the CSS value is authoritative
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
                'The article layout CSS may be missing min-width:0 on a flex/grid item, ' +
                'or an image without max-width:100% is forcing the column wider. ' +
                'Fix in styles.css: .article__main { min-width:0; } and ' +
                '.article-content img { max-width:100%; height:auto; }');
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

            // Clamp synchronously after layout is computed
            requestAnimationFrame(function () {
                hardClamp(container, '#related-articles');
                hardClamp(section, '.vt-related-section');
                diagnoseParent(section);
            });

            // Also clamp after images load (they can change width)
            window.addEventListener('load', function () {
                hardClamp(container, '#related-articles');
                hardClamp(section, '.vt-related-section');
            }, { once: true });

            // Clamp on resize
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
        var containers = document.querySelectorAll('#related-articles');
        if (!containers.length) { return; }
        injectStyles();
        [].forEach.call(containers, mount);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();