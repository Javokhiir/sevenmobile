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
            p1Pos: [1.3, -1.0, -1.8],   p1Rot: [-60, 40, 25],
            p2Pos: [0.25, 0.05, -2.5],  p2Rot: [8, -28, -6],
            p2PosMobile: [0.1, 0.5, -3.6],
            p3Pos: [0.05, 0, -1.7],     p3Rot: [10, 155, 0],
            p4Pos: [0.8, -0.1, -2.6],   p4Rot: [15, 150, 10],
            // Pose 5 is where it parks and leaves the frame. Centred, because
            // scene 2's filaments start at that point and run down into the
            // processor, so the exit and the node have to share an axis.
            p5Pos: [0, 0.5, -4],        p5Rot: [40, -80, -140],
            p3PosMobile: [0.05, -0.05, -2], p4PosMobile: [0.4, -0.3, -2.6], p5PosMobile: [0, 1.5, -8]
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
        // to stay out of the data-scan's material takeover.
        var chipFace = phone.findByName('chip_face');
        if (chipFace) chipFace.tags.add('no-scan');

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
            window.addEventListener('resize', applyPoses);
            var plexus = sat.findByName('plexus');
            if (plexus && plexus.script && plexus.script.plexus) plexus.script.plexus.fitTarget = phone;
            wireChipReveal();
        });

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
