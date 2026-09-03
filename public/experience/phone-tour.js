// The Connect U7 feature tour in the underground network scene. Until 0.47 the
// phone stands on the floor for the scene's own beats; from there it leaves the
// spot, turns one feature at a time to the camera, and goes back before the
// scene hands over. The figures are the catalogue's, from lib/i18n.tsx.
(function () {
    var app = pc.Application.getApplication();
    if (!app) return;

    var FROM = 0.47, TO = 0.542;
    var GRAB = 0.008;           // progress spent easing onto the rig
    // Longer than the grab, and it finishes before the scene's own hand-over at
    // 0.545: the phone flies all the way back to its stand from a beat that has
    // it a hand's width from the lens, and the next scene's burst has to start
    // on a phone already standing still.
    var LET = 0.016;
    var TAIL = 0.008;           // last beat holds this long before it lets go
    var SCALE = 11;             // node-network.js's phone scale
    var HOLD = 0.5;             // share of each step parked on the feature

    // Phone-local metres, from tools/build_phone_glb.py: +Z is the screen side,
    // +X the button side. The face offsets keep the anchor just clear of the
    // surface so the ring does not sit inside the glass.
    var F = 0.0045, B = -0.0045;
    var BEATS = [
        { t: 'EKRAN', b: '6,67" AMOLED, 120 Gts', at: [0, 0, F], rot: [0, 0, 0], d: 3.4, wide: true },
        { t: 'OLD KAMERA', b: '50 MP', at: [0, 0.0739, F], rot: [0, -10, 0], d: 0.85 },
        { t: 'BARMOQ IZI', b: 'Ekran ostidagi skaner', at: [0, -0.0532, F], rot: [0, 10, 0], d: 0.85 },
        { t: 'ORQA TOMON', b: 'Mat shisha', at: [0, 0, B], rot: [0, 180, 0], d: 3.4, wide: true },
        { t: 'ASOSIY KAMERA', b: '108 MP', at: [0.0217, 0.0493, B - 0.0012], rot: [0, 196, 0], d: 1 },
        { t: 'BATAREYA', b: '5000 mAh', at: [0, -0.02, 0], rot: [0, 180, 0], d: 2, xray: true },
        { t: 'TYPE-C', b: '33 W tez quvvatlash', at: [0, -0.0818, 0], rot: [-86, 10, 0], d: 0.5 }
    ];

    var CSS = [
        '.ptour{position:fixed;left:0;top:0;pointer-events:none;z-index:6;',
        'font-family:"JetBrains Mono",monospace;color:#fff;opacity:0;will-change:transform,opacity}',
        '.ptour-ring{position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;',
        'border:2px solid rgba(255,255,255,.5);border-radius:50%}',
        '.ptour-card{position:absolute;top:-14px;width:230px}',
        '.ptour-card.left{right:56px;text-align:right}',
        '.ptour-card.right{left:56px}',
        '.ptour-card.wide.left{right:230px}',
        '.ptour-card.wide.right{left:230px}',
        '.ptour-t{font-size:20px;font-weight:800;text-transform:uppercase;line-height:1.1}',
        '.ptour-b{margin-top:6px;font-size:14px;opacity:.72}',
        '@media (max-width:768px){',
        '.ptour-ring{width:48px;height:48px;margin:-24px 0 0 -24px}',
        '.ptour-card{width:150px;top:-10px}',
        '.ptour-card.left{right:42px}.ptour-card.right{left:42px}',
        '.ptour-card.wide.left{right:110px}.ptour-card.wide.right{left:110px}',
        '.ptour-t{font-size:15px}.ptour-b{font-size:12px}}'
    ].join('');

    // The scene's own captions sit dead centre over the phone, and the chip
    // pair describes the die the tour has just taken over from. They stand down
    // while it runs and come back with it. Disabling their entities is no good:
    // hudText owns a DOM node and worldText a mesh in its own layer, and both
    // are left exactly as they were when the script stops running.
    var QUIET = ['TitleChip', 'Chiptxt', 'text'];

    function smooth(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); }

    app.once('start', function () {
        var scene = app.root.findByName('sceneDatacenter');
        var phone = scene && scene.findByName('ConnectU7Network');
        var cam = app.root.findByName('Camera');
        if (!phone || !cam || !cam.camera) {
            console.warn('[phoneTour] phone or camera missing, tour left off');
            return;
        }

        // Cloned because instantiateRenderEntity hands every phone in the scene
        // the same materials, and scene 1's must not turn to glass with this one.
        var glass = null;
        var backEnt = phone.findByName('back');
        if (backEnt && backEnt.render) {
            var mi = backEnt.render.meshInstances[0];
            glass = mi.material.clone();
            glass.blendType = pc.BLEND_NORMAL;
            glass.depthWrite = false;
            mi.material = glass;
        }

        // Collected on the first grab, not here: this runs before the scene's
        // own scripts initialise, so the nodes do not exist yet.
        var quiet = null;
        function hush(on) {
            if (!quiet) {
                quiet = [];
                QUIET.forEach(function (n) {
                    var e = scene.findByName(n);
                    if (!e || !e.script) return;
                    e.script.scripts.forEach(function (inst) {
                        if (inst._el) quiet.push(inst._el);
                        if (inst._plane) quiet.push(inst._plane);
                    });
                });
            }
            for (var i = 0; i < quiet.length; i++) {
                var q = quiet[i];
                if (q.style) q.style.visibility = on ? 'hidden' : '';
                else q.enabled = !on;
            }
        }

        // The room is lit for a rack standing in the dark, which leaves the
        // phone a silhouette once it is a hand's width from the lens. The key
        // rides the camera, so every beat is lit from the same side however the
        // phone turns, and it fades in with the rig rather than switching on.
        var key = new pc.Entity('TourKey');
        key.addComponent('light', {
            type: 'directional', color: new pc.Color(1, 0.97, 0.92),
            intensity: 0, castShadows: false
        });
        key.setLocalEulerAngles(22, -28, 0);
        key.enabled = false;
        cam.addChild(key);

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var el = document.createElement('div');
        el.className = 'ptour';
        el.innerHTML = '<div class="ptour-ring"></div><div class="ptour-card">' +
            '<div class="ptour-t"></div><div class="ptour-b"></div></div>';
        document.body.appendChild(el);
        var card = el.querySelector('.ptour-card');
        var elT = el.querySelector('.ptour-t');
        var elB = el.querySelector('.ptour-b');

        // The tour is a slow read, so the scroll it takes is stretched rather
        // than the beats being crammed into the scene's own progress budget.
        // After initialise, not here: script attributes are re-applied from the
        // scene data in between, which drops a band added any earlier.
        app.once('postinitialize', function () {
            var mgr = app.root.findByName('Managers');
            var scroll = mgr && mgr.script && mgr.script.scrollManager;
            if (!scroll) return;
            scroll.stretchBands = (scroll.stretchBands || []).concat(
                [{ name: 'phone tour', start: FROM, end: 0.545, factor: 4 }]);
            scroll._recomputeStretch();
        });

        var progress = 0;
        EventBus.on('scroll:progress', function (p) { progress = p; });

        var homePos = new pc.Vec3(), homeRot = new pc.Quat(), held = false;
        var offA = new pc.Vec3(), offB = new pc.Vec3(), rotA = new pc.Quat(), rotB = new pc.Quat();
        var off = new pc.Vec3(), rot = new pc.Quat(), anchor = new pc.Vec3();
        var pos = new pc.Vec3(), wrot = new pc.Quat(), screen = new pc.Vec3();

        // Camera-space pose that puts a beat's feature point dead centre at its
        // own distance, so the framing follows from the model's own metres
        // rather than from a hand-placed camera.
        function pose(i, outOff, outRot) {
            var k = BEATS[i];
            // The camera's 45° is vertical, so a portrait viewport crops the
            // same distance far tighter sideways. Every beat backs off on the
            // narrow layout by the same amount rather than being posed twice.
            var d = k.d * (window.innerWidth <= 768 ? 1.6 : 1);
            outRot.setFromEulerAngles(k.rot[0], k.rot[1], k.rot[2]);
            outOff.set(k.at[0] * SCALE, k.at[1] * SCALE, k.at[2] * SCALE);
            outRot.transformVector(outOff, outOff);
            outOff.set(-outOff.x, -outOff.y, -d - outOff.z);
        }

        var Rig = pc.createScript('phoneTourRig');
        Rig.prototype.postUpdate = function () {
            var g = smooth((progress - FROM) / GRAB) * smooth((TO - progress) / LET);
            if (g <= 0) {
                // Back to whatever pose it was in when the tour took over,
                // rather than a spot captured at load: the warm-up pass runs
                // the whole timeline before anyone scrolls.
                if (held) {
                    phone.setPosition(homePos);
                    phone.setRotation(homeRot);
                    held = false;
                    el.style.opacity = 0;
                    key.enabled = false;
                    hush(false);
                    if (glass) { glass.opacity = 1; glass.update(); }
                }
                return;
            }
            if (!held) {
                homePos.copy(phone.getPosition());
                homeRot.copy(phone.getRotation());
                held = true;
                key.enabled = true;
            }
            hush(true);
            key.light.intensity = 2.6 * g;

            var span = (TO - LET - TAIL - (FROM + GRAB)) / (BEATS.length - 1);
            var u = (progress - (FROM + GRAB)) / span;
            var i = Math.floor(u);
            if (i < 0) i = 0;
            if (i > BEATS.length - 2) i = BEATS.length - 2;
            var f = u - i;
            f = f < 0 ? 0 : f > 1 ? 1 : f;
            var move = smooth((f - HOLD) / (1 - HOLD));

            pose(i, offA, rotA);
            pose(i + 1, offB, rotB);
            off.lerp(offA, offB, move);
            rot.slerp(rotA, rotB, move);

            var cp = cam.getPosition(), cr = cam.getRotation();
            cr.transformVector(off, pos);
            pos.add(cp);
            wrot.mul2(cr, rot);
            phone.setPosition(homePos.x + (pos.x - homePos.x) * g,
                homePos.y + (pos.y - homePos.y) * g,
                homePos.z + (pos.z - homePos.z) * g);
            phone.setRotation(rot.slerp(homeRot, wrot, g));

            // The back glass opens on the battery beat, since the cells and the
            // board are real geometry the scan already relies on.
            if (glass) {
                var open = BEATS[i].xray ? 1 - move : BEATS[i + 1].xray ? move : 0;
                glass.opacity = 1 - 0.85 * open * g;
                glass.update();
            }

            var shown = move < 0.5 ? i : i + 1;
            var alpha = move <= 0 ? 1 : move < 0.5 ? Math.max(0, 1 - move / 0.35)
                : Math.max(0, (move - 0.65) / 0.35);
            alpha *= g;
            if (alpha <= 0.001) { el.style.opacity = 0; return; }

            var k = BEATS[shown];
            if (elT.textContent !== k.t) { elT.textContent = k.t; elB.textContent = k.b; }

            anchor.set(k.at[0] * SCALE, k.at[1] * SCALE, k.at[2] * SCALE);
            phone.getRotation().transformVector(anchor, anchor);
            anchor.add(phone.getPosition());
            cam.camera.worldToScreen(anchor, screen);
            var canvas = app.graphicsDevice.canvas;
            var s = canvas.clientWidth / canvas.width;
            var x = screen.x * s, y = screen.y * s;
            // A whole-phone beat has no single point to ring, so the card
            // stands clear of the body instead of pointing into it.
            el.firstChild.style.display = k.wide ? 'none' : '';
            card.className = 'ptour-card ' + (k.wide ? 'wide ' : '') +
                (x > canvas.clientWidth * 0.55 ? 'left' : 'right');
            el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            el.style.opacity = alpha;
        };
        phone.addComponent('script');
        phone.script.create('phoneTourRig');
    });
})();
