// The cards are the last section. The drive-away scene after them belonged to
// the template and has nothing to do with the phone, so the car comes out of the
// run — but not the whole scene: the monitor the card deck is projected onto is
// one of that scene's children, so switching the scene off takes the cards with
// it. Everything except that monitor is switched off instead, and the scene
// manager's entry loses its script, which is what would otherwise still fire the
// scene's own enter() (and its bloom) over the black.
//
// What follows the cards is the outro the template already had — two black
// bands closing from the top and the bottom, then the closing lines and shop
// control. The template's final studio promo ("Now imagine your own") is
// removed. The outro used to start at 0.83, a long way past the cards; the scene
// data now starts it at 0.71, so the bands close the moment the deck is done.
//
// The lines it closes on are ours, in the language the site is set to: the same
// localStorage key lib/i18n.tsx writes, read from inside the frame. The name is
// set as the wordmark rather than typed out — the same outlines the splash and
// the header use, out of brand-logo.js — so the sign-off is the logo.
(function () {
    var app = pc.Application.getApplication();
    if (!app) return;

    // Per line: what follows the wordmark in the regular weight, then the bold
    // half. The wordmark itself is prepended to both.
    var LINES = {
        uz: [['—', 'Kelajak. Bugun.'],
             ['Connect U7 —', 'yangilikka ulan.']],
        ru: [['—', 'Будущее. Сегодня.'],
             ['Connect U7 —', 'подключись к новому.']],
        en: [['—', 'The future. Today.'],
             ['Connect U7 —', 'connect to what is new.']]
    };

    // Cap height rather than font size, and nudged onto the baseline: the
    // wordmark has to sit in the line like a word, not like an image.
    // The outro draws its own mark on with a per-path reveal; ours is a solid
    // wordmark and has to ignore that, hence the overrides.
    var MARK_CSS = '.ec-mark{display:inline-block;vertical-align:-0.045em}' +
        '.ec-mark svg{display:block;height:0.72em;width:auto}' +
        '.ec-mark svg path{opacity:1!important;fill:#fff!important}' +
        '#ec-final .ec-logo svg{display:block;width:100%;height:auto;opacity:1!important}' +
        '#ec-final .ec-logo svg path{opacity:1!important;fill:#fff!important;' +
        'stroke:none!important;stroke-dashoffset:0!important}';
    var STORE_KEY = 'sevenmobile.lang';   // lib/i18n.tsx

    function lang() {
        try {
            var l = window.localStorage.getItem(STORE_KEY);
            if (LINES[l]) return l;
        } catch { /* private mode: fall through to the default */ }
        return 'uz';
    }

    // What the card deck is drawn on. Everything else under sceneCar is the car.
    var KEEP = ['MonitorScreen', 'MonitorBezel'];

    app.once('start', function () {
        var car = app.root.findByName('sceneCar');
        var strip = function () {
            if (!car) return;
            car.children.forEach(function (c) {
                if (KEEP.indexOf(c.name) === -1 && c.enabled) c.enabled = false;
            });
        };
        strip();
        app.once('postinitialize', strip);
        // The car scene's own pieces switch themselves back on when their scroll
        // window opens — the deployment lettering comes up inside the closing
        // bands that way. So the strip is the last word every frame; it is
        // eighteen comparisons and costs nothing.
        app.on('prerender', strip);

        // After the scene manager has built its list, so the entry exists.
        app.once('postinitialize', function () {
            var mgr = null;
            app.root.findComponents('script').forEach(function (s) {
                if (s.sceneManager) mgr = s.sceneManager;
            });
            if (!mgr || !mgr._scenes) {
                console.warn('[ending] sceneManager not found, the car scene is only hidden');
                return;
            }
            mgr._scenes.forEach(function (s) {
                if (s.name === 'sceneCar') s.script = null;
            });
        });

        if (!car) console.warn('[ending] sceneCar missing, nothing to take out');

        // endingCredits builds this template promo during initialisation. Keep
        // the closing copy and final control, but remove the entire promo node
        // (logo, tagline and studio e-mail) on the first frame it exists. Turn
        // the old replay control into a link to the site's shop at the same time.
        var promoRemoved = false;
        var shopControlReady = false;
        app.on('prerender', function () {
            if (!promoRemoved) {
                var promo = document.getElementById('ec-final');
                if (promo) {
                    promo.remove();
                    promoRemoved = true;
                }
            }

            if (!shopControlReady) {
                var control = document.getElementById('ec-replay');
                if (!control) return;

                app.root.findComponents('script').forEach(function (script) {
                    if (script.endingCredits) {
                        script.endingCredits._replayLabel = "DO'KONGA";
                    }
                });

                control.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    window.top.location.href = '/shop';
                }, true);
                shopControlReady = true;
            }
        });

        // The credits build their DOM on initialise, so the lines are swapped
        // on the first frame they exist rather than here.
        var swapped = false;
        var pair = LINES[lang()];
        app.on('prerender', function () {
            if (swapped) return;
            var el = document.getElementById('ending-credits');
            if (!el) return;
            var lines = el.querySelectorAll('.ec-line');
            if (lines.length < 2) return;
            var mark = window.__SEVEN_TECH_LOGO_SVG__;
            if (mark && !document.getElementById('ec-mark-style')) {
                var st = document.createElement('style');
                st.id = 'ec-mark-style';
                st.textContent = MARK_CSS;
                document.head.appendChild(st);
            }
            var name = mark ? '<span class="ec-mark">' + mark + '</span>' : '7TECH';
            for (var i = 0; i < 2; i++) {
                lines[i].innerHTML = name +
                    ' <span class="reg">' + pair[i][0] + '</span> ' +
                    '<span class="bold">' + pair[i][1] + '</span>';
            }
            swapped = true;
        });

        // The sign-off carried the studio's mark; the site's own goes there
        // instead, and it is what the black is left holding at the end. Checked
        // every frame rather than once: the outro rebuilds this block when the
        // visitor replays, and it is one attribute lookup.
        app.on('prerender', function () {
            var mark = window.__SEVEN_TECH_LOGO_SVG__;
            if (!mark) return;
            var logo = document.querySelector('#ec-final .ec-logo');
            if (!logo || logo.dataset.sevenMark === '1') return;
            logo.innerHTML = mark;
            logo.dataset.sevenMark = '1';
        });
    });
})();
