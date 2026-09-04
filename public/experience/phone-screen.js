// The hand-over out of the network scene. The feature tour ends, the phone goes
// back on its stand, and instead of cutting away the camera goes into the glass:
// it accelerates at the screen until the dark display is the whole frame, holds
// there while the next scene's burst starts up behind it, and is carried back
// out on that burst once it fills the view. Nothing is drawn on the screen — the
// display stays as black as the model makes it. The move is the transition.
//
// The scene it hands over to used to switch on with its panel already at full
// size, which read as a cut. The panel now arrives instead: it comes in from far
// down the view and settles into place, so the two scenes are joined by movement
// rather than by a fade to black.
(function () {
    var app = pc.Application.getApplication();
    if (!app) return;

    // phone-tour.js is still on its last feature at 0.531 and has the phone back
    // on its stand, square to the camera, by 0.542; the burst that opens the
    // next scene is already radiating through the phone by 0.566. So the dive
    // runs over the fly-back and then holds.
    //
    // It is never eased back out: the network scene is not faded, it is switched
    // off in one frame at 0.570, and easing the camera back before that walks
    // the phone into view again, edges, room and all. The way home is that same
    // switch — the whole frame changes there anyway, so the camera changes with
    // it and nobody sees it move.
    var IN_FROM = 0.5335, IN_TO = 0.549, CUT = 0.570;

    // The panel of the scene on the other side of CUT, arriving. It grows in
    // from a speck rather than being dollied in: it sits half a unit in front of
    // that scene's wallpaper, so anything that actually moves it back is behind
    // the wallpaper and gone. On a flat panel square to its camera the two read
    // the same anyway. Eased out hard, so it covers the distance fast and
    // settles, the way something coming a long way does.
    var CARD_TO = 0.5835, CARD_MIN = 0.05;

    // Where it stops, in world metres. The standoff is bounded by the near clip
    // (0.1) on one side and by the frame having to be all glass on the other: at
    // this distance the view covers ~0.55 m of a 0.78 m wide screen. The drop
    // puts that patch below the wordmark printed on the display, so what fills
    // the frame is black glass and not a giant 7TECH.
    var STANDOFF = 0.345;
    var DROP = 0.25;
    // Body thickness in the phone's own metres, and node-network.js's scale.
    var T = 0.0085, SCALE = 11;

    app.once('start', function () {
        var scene = app.root.findByName('sceneDatacenter');
        var phone = scene && scene.findByName('ConnectU7Network');
        var cam = app.root.findByName('Camera');
        var card = app.root.findByName('sceneUI');
        card = card && card.findByName('card0');
        if (!phone || !cam) {
            console.warn('[phoneScreen] network phone or camera missing, the dive is off');
            return;
        }
        if (!card) console.warn('[phoneScreen] card0 missing, the next scene still cuts in');

        var progress = 0;
        EventBus.on('scroll:progress', function (p) { progress = p; });

        // Captured on the first frame of the dive and put back on the way out.
        // The camera is parked for this whole stretch and nothing else writes to
        // it, so reading it every frame would only read back our own move.
        var base = null;
        var target = new pc.Vec3();
        var out = new pc.Vec3();
        var tmp = new pc.Vec3();
        var here = new pc.Vec3();
        // The panel's own size is not ours to know: that scene fits it to the
        // viewport, on its own schedule and again on resize. So every frame the
        // scale is not the one we last wrote, it is somebody else's and becomes
        // the size to arrive at — including when the fit lands mid-flight.
        var fitted = card ? card.getLocalScale().clone() : null;
        var written = null;

        // After every script's postUpdate, so this is the last word on the
        // camera for the frame ('prerender' is the only such hook the engine
        // fires on the app itself).
        app.on('prerender', function () {
            if (fitted) {
                if (progress >= CUT && progress < CARD_TO) {
                    var cur = card.getLocalScale();
                    if (written === null || Math.abs(cur.x - written) > 1e-4) fitted.copy(cur);
                    var ct = (progress - CUT) / (CARD_TO - CUT);
                    var cs = CARD_MIN + (1 - CARD_MIN) * (1 - Math.pow(1 - ct, 3));
                    card.setLocalScale(fitted.x * cs, fitted.y, fitted.z * cs);
                    written = fitted.x * cs;
                } else if (written !== null) {
                    // Handed back whole, so whatever that scene does with its
                    // cards from here on is none of our business.
                    card.setLocalScale(fitted);
                    written = null;
                }
            }

            var k = 0;
            if (progress > IN_FROM && progress < IN_TO) {
                var t = (progress - IN_FROM) / (IN_TO - IN_FROM);
                k = t * t;                      // accelerating: it falls into the glass
            } else if (progress >= IN_TO && progress < CUT) {
                k = 1;
            }

            if (k <= 0) {
                if (base) { cam.setPosition(base); base = null; }
                return;
            }
            if (!base) base = cam.getPosition().clone();

            // The screen faces the phone's +Z, which is its backward vector.
            out.copy(phone.forward).mulScalar(-(T / 2 * SCALE + STANDOFF));
            target.copy(phone.getPosition()).add(out)
                .sub(tmp.copy(phone.up).mulScalar(DROP));
            cam.setPosition(here.lerp(base, target, k));
        });
    });
})();
