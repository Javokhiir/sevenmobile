// Puts the Connect U7 in place of the Starlink satellite in scene 1. Runs on
// the app's "start" event, which fires before scene scripts initialise, so
// dataScan, plexus, the chip label and the mover treat the phone as if it had
// been authored in the scene.
(function () {
    var app = pc.Application.getApplication();
    if (!app) return;

    var cfg = window.__phone = {
        scale: 20,
        poses: {
            // Pose 1 is off-frame. At 1.8 m the frustum is only ~1.2 wide, and
            // the phone is ~1.8 across at that scale, so it needs to start well
            // past 3 or its corner is already in shot before the fly-in.
            p1Pos: [3.4, -2.6, -1.8],   p1Rot: [-60, 40, 25],
            p2Pos: [0.25, 0.05, -2.5],  p2Rot: [8, -28, -6],
            p2PosMobile: [0.1, 0.5, -3.6],
            p3Pos: [0.05, 0, -1.7],     p3Rot: [10, 155, 0],
            p4Pos: [0.8, -0.1, -2.6],   p4Rot: [15, 150, 10],
            // Pose 5 is where it parks. Centred, because scene 2's filaments
            // start at that point and run down into the processor, so the exit
            // and the node have to share an axis — and the phone is meant to be
            // standing at the point the filaments come together, not above the
            // frame. The heights put it ~0.42 of the frustum's half height over
            // the camera axis at their distance, which is where they meet.
            p5Pos: [0, 0.7, -4],        p5Rot: [40, -80, -140],
            p3PosMobile: [0.05, -0.05, -2], p4PosMobile: [0.4, -0.3, -2.6], p5PosMobile: [0, 1.4, -8]
        },
        // Phone-local metres: the processor spot on the back, where the label
        // circle and the glow anchors sit. Scales are satellite-local, so 20x
        // the phone's own metres.
        chip: [0, 0.030, -0.0048],
        glowScale: 0.62
    };

    app.once('start', function () {
        var sat = app.root.find(function (e) { return e.script && e.script.satelliteMover; })[0];
        var asset = app.assets.find('connect_u7.glb', 'container');
        if (!sat || !asset || !asset.resource) {
            console.warn('[phoneModel] satellite entity or connect_u7.glb missing, satellite left as is');
            return;
        }

        // Drop the Starlink meshes but keep their nodes: the Deploy clip and
        // haloSatellite are bound to them.
        sat.forEach(function (e) {
            if (e !== sat && e.render && e.render.type === 'asset') e.removeComponent('render');
        });

        var phone = asset.resource.instantiateRenderEntity({ castShadows: false, receiveShadows: false });
        phone.name = 'ConnectU7';
        phone.setLocalScale(cfg.scale, cfg.scale, cfg.scale);
        sat.addChild(phone);

        // The processor callout lights itself and owns its own alpha, so it has
        // to stay out of the data-scan's material takeover. The frame and the
        // buttons are out for a different reason: the scan is for the back, and
        // leaving them in lets it open up the sides of the phone as well.
        var chipFace = phone.findByName('chip_face');
        if (chipFace) chipFace.tags.add('no-scan');
        ['frame', 'buttons'].forEach(function (n) {
            var e = phone.findByName(n);
            if (e) e.tags.add('no-scan');
        });

        // Script attributes are re-applied from the scene data during
        // initialise, so the pose and fit overrides go in after that.
        // The mover only has mobile variants for poses 3 to 5, so the
        // arrival pose is picked here by viewport width instead.
        var applyPoses = function () {
            var mover = sat.script.satelliteMover;
            var mobile = window.innerWidth <= mover.mobileBreakpoint;
            Object.keys(cfg.poses).forEach(function (k) {
                var v = cfg.poses[k];
                if (k === 'p2PosMobile') return;
                if (k === 'p2Pos' && mobile) v = cfg.poses.p2PosMobile;
                mover[k] = new pc.Vec3(v[0], v[1], v[2]);
            });
        };
        app.once('postinitialize', function () {
            applyPoses();
            // The scene's 7 s fly-in was timed for the satellite, which started
            // just above the frame. The phone starts much further out, and with
            // an ease-in-out that leaves it off-screen for the first seconds of
            // the scene. Shorter, so it is in view while the opening still reads.
            sat.script.satelliteMover.entryDuration = 4.6;
            // The scan is for the back. Authored for the satellite it ran from
            // the start and faded out at 0.08, which on the phone is the front
            // view, so it X-rayed the board through the screen. It moves to the
            // stretch where the back is turned to the camera instead, and the
            // circle is kept small.
            var scan = sat.script.dataScan;
            if (scan) {
                scan.radius = 0.055;
                scan.speedToSize = 0.5;
                scan.disableProgress = 0.1;
                scan.disableFade = 0.02;
                // Armed only while the back is turned to the camera: before
                // that it is the screen, after it the phone is on its way out.
                var arm = function (p) { scan.enabled = p >= 0.045 && p < 0.12; };
                arm(0);
                EventBus.on('scroll:progress', arm);
            }
            window.addEventListener('resize', applyPoses);
            clearTheCity();
            var plexus = sat.findByName('plexus');
            if (plexus && plexus.script && plexus.script.plexus) plexus.script.plexus.fitTarget = phone;
            wireChipReveal();
        });

        // The phone parks in world at the point the filaments come together, so
        // it is standing there while the light gathers. The city beat that
        // follows takes the camera straight past that spot, and parked at that
        // height it hung over the map as a black sliver for the whole beat. It
        // rises out of frame over the run-up to the map instead, and comes back
        // down if the visitor scrolls up.
        var LIFT_FROM = 0.15, LIFT_TO = 0.175, LIFT = 3.2;
        var clearTheCity = function () {
            var lift = 0, base = null;
            EventBus.on('scroll:progress', function (p) {
                var t = (p - LIFT_FROM) / (LIFT_TO - LIFT_FROM);
                t = t < 0 ? 0 : t > 1 ? 1 : t;
                lift = t * t * (3 - 2 * t) * LIFT;
                if (lift <= 0) base = null;
            });
            // After the mover, which is the one writing the parked transform.
            app.on('postUpdate', function () {
                if (lift <= 0) return;
                if (!base) base = sat.getPosition().clone();
                sat.setPosition(base.x, base.y + lift, base.z);
            });
        };

        // The processor is under the back glass, so it stays dark until the
        // visitor hovers its label instead of glowing through the shell for the
        // whole scene. satelliteLabel emits these two on the label's
        // mouseenter / mouseleave. Runs after initialise so the glow script has
        // built its material.
        var wireChipReveal = function () {
            var parts = [];
            sat.children.forEach(function (c) {
                if (c.name !== 'AICHIP-anchor') return;
                var glow = c.script && c.script.glow;
                if (!glow) {
                    // The satellite's plain gold plate is additive and blows the
                    // processor render out, so it stays off now that the real
                    // die is there. The label still anchors to it either way.
                    c.enabled = false;
                    return;
                }
                c.setLocalScale(cfg.glowScale, 0.03, cfg.glowScale);
                parts.push({ e: c, s: c.getLocalScale().clone(), glow: glow });
            });
            if (chipFace) parts.push({ e: chipFace, mat: chipFace.render.meshInstances[0].material });
            if (!parts.length) return;
            var reveal = { t: 0 };

            var apply = function () {
                var t = reveal.t;
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i];
                    p.e.enabled = t > 0.002;
                    if (p.mat) {
                        // The quad's verts are baked at their spot on the back,
                        // so it fades rather than growing off its node origin.
                        p.mat.opacity = t;
                        p.mat.update();
                    } else {
                        // Thickness is the local Y on the anchors, which lie flat
                        // against the back, so only the in-plane axes grow.
                        p.e.setLocalScale(p.s.x * t, p.s.y, p.s.z * t);
                        if (p.glow && p.glow.material) p.glow.material.setParameter('uOpacity', t);
                    }
                }
            };
            var to = function (t, duration, ease) {
                gsap.killTweensOf(reveal);
                gsap.to(reveal, { t: t, duration: duration, ease: ease, onUpdate: apply });
            };
            apply();

            EventBus.on('audio:satelliteAichip', function () { to(1, 0.35, 'power2.out'); });
            EventBus.on('audio:satelliteAichipStop', function () { to(0, 0.25, 'power2.in'); });

            // Scrolling past the label can hide it without a mouseleave, which
            // would otherwise leave the processor lit for the rest of the scene.
            // satelliteLabel hides the label by display, so follow that rather
            // than its scroll window, which is a single point plus a fade.
            var labelEl = document.querySelector('.slabel');
            EventBus.on('scroll:progress', function () {
                if (reveal.t > 0 && labelEl && labelEl.style.display === 'none') {
                    gsap.killTweensOf(reveal);
                    reveal.t = 0;
                    apply();
                }
            });
        };

        sat.children.forEach(function (c) {
            if (c.name !== 'AICHIP-anchor') return;
            c.setLocalPosition(cfg.chip[0] * cfg.scale, cfg.chip[1] * cfg.scale, cfg.chip[2] * cfg.scale);
        });
    });
})();
