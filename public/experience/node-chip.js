// Puts the Dimensity 7400 die where the diamond plate used to sit, so the
// object beside the PRIMARY NODE label is the processor the phone actually
// ships with. Runs on "start", before scene scripts initialise, so the mover,
// the label and the light filaments keep treating it as the same entity.
(function () {
    var app = pc.Application.getApplication();
    if (!app) return;

    // Local metres on the diamond entity. The plate it replaces measured ~4
    // across, and the die fills about 90% of the source image's width.
    var WIDTH = 4.4;
    var ASPECT = 601 / 387;
    // The mover shrinks the node from 0.4 to 0.05 as it settles onto the city,
    // and the die has no business shrinking with it: it is a spec callout, and
    // it read as two different objects, one big one small, either side of the
    // descent. The holder cancels the node's scale outright and holds the die
    // at this size for the whole beat — only the camera's own distance changes
    // how big it looks, which is what makes it read as one object coming down.
    var MIN_HOST = 0.32;
    var SETTLE_FROM = 0.175;    // scroll progress over which it lands
    var SETTLE_TO = 0.235;
    // The die lies on the city, barely off it — enough not to cut into the
    // terrain, no more. Held further out it rode the anchor's up vector, and
    // as the map tilted through the landing that swung it sideways, so it
    // never read as coming straight down onto its spot.
    var LIFT = 0.08;            // world units above the map origin

    app.once('start', function () {
        var node = app.root.find(function (e) { return e.script && e.script.diamondLabel; })
            .filter(function (e) { return e.name === 'DiamondV4'; })[0];
        var tex = app.assets.find('protsessor.webp', 'texture');
        if (!node || !tex || !tex.resource) {
            console.warn('[nodeChip] DiamondV4 or protsessor.webp missing, plate left as is');
            return;
        }

        // Drop the plate meshes but keep their entities: the scene's appear and
        // dissolve passes still walk them.
        var layers = null;
        node.forEach(function (e) {
            if (e === node || !e.render) return;
            if (!layers) layers = e.render.layers.slice();
            e.removeComponent('render');
        });

        // Unlit: the die carries its own glow and the scene's key light sits
        // above it, which would otherwise leave the face in shadow.
        var mat = new pc.StandardMaterial();
        mat.useLighting = false;
        mat.diffuse = new pc.Color(0, 0, 0);
        mat.emissive = new pc.Color(1, 1, 1);
        mat.emissiveMap = tex.resource;
        mat.opacityMap = tex.resource;
        mat.opacityMapChannel = 'a';
        // Blended, not alpha-tested: the die's halo fades out over ~40px of
        // soft alpha, and a cutout turns that into a hard yellow edge.
        mat.blendType = pc.BLEND_NORMAL;
        // The die is a flat card in a scene full of volumetric light, so it
        // reads better sorted by blending alone than punching a depth hole.
        mat.depthWrite = false;
        // Drawn over the terrain rather than tested against it. Lying on the
        // city it is level with the relief and the ground buries it; the only
        // way to keep it visible by depth alone is to hold it well clear, and
        // that offset rides the anchor's up vector and swings it sideways as
        // the map tilts. Off the test it sits on the city and stays readable.
        mat.depthTest = false;
        mat.cull = pc.CULLFACE_NONE;
        mat.update();

        // The entity carries a 45° roll to stand the plate on its corner. The
        // die has to read level, so the holder cancels it and the plane inside
        // stands up out of the XZ plane to face the camera.
        var holder = new pc.Entity('NodeChip');
        holder.setLocalEulerAngles(0, 0, -45);
        node.addChild(holder);

        var card = new pc.Entity('NodeChipCard');
        card.addComponent('render', {
            type: 'plane',
            material: mat,
            castShadows: false,
            receiveShadows: false,
        });
        if (layers) card.render.layers = layers;
        // The city itself is a blended material in the same layer, so the two
        // are sorted against each other by distance — and lying on the ground
        // the die is the same distance away as the terrain under it, which had
        // the map painting over it for whole stretches of the beat. Sorted as
        // if it were at the camera, it is always drawn last, and with the depth
        // test off above that means it is never buried by the city.
        card.render.meshInstances.forEach(function (mi) {
            mi.calculateSortDistance = function () { return 0; };
        });
        card.setLocalEulerAngles(90, 0, 0);
        card.setLocalScale(WIDTH, 1, WIDTH * ASPECT);
        holder.addChild(card);

        // Once the node has settled the die is planted on the map instead of
        // on its own entity: that spot ends up under the terrain as the anchor
        // tilts, which would bury it for the rest of the scene. On the map it
        // lies flat on the city and rides the same anchor, so it stays put.
        // The hand-over is eased across a scroll window, or the die jumps
        // sideways the frame it lands.
        var map = app.root.findByName('MAP');
        var cam = app.root.findByName('Camera');
        // Scroll progress, not the host's scale: the mover has already shrunk
        // the node well before the map beat, and until then the die belongs on
        // the node's own spot, where the filaments come together.
        var progress = 0;
        EventBus.on('scroll:progress', function (p) { progress = p; });

        var roll = new pc.Quat().setFromEulerAngles(0, 0, -45);
        var landed = new pc.Vec3();
        var under = new pc.Vec3();
        var flying = new pc.Vec3();
        var rot = new pc.Quat();
        var landedRot = new pc.Quat();
        var scl = new pc.Vec3();

        // World scale the die reads at while it rides the node: the holder
        // cancels the node's own shrink down to MIN_HOST, so what is left is
        // whatever the node's parent contributes.
        function readScale() {
            var par = node.parent;
            if (par) par.getWorldTransform().getScale(scl); else scl.set(1, 1, 1);
            return MIN_HOST * (scl.x || 1);
        }

        app.on('update', function () {
            if (!map || !cam) {
                var s0 = node.getLocalScale().x;
                var k0 = s0 > 1e-4 ? MIN_HOST / s0 : 1;
                holder.setLocalScale(k0, k0, k0);
                return;
            }

            var t = (progress - SETTLE_FROM) / (SETTLE_TO - SETTLE_FROM);
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            t = t * t * (3 - 2 * t);

            // Down and planted: the die comes off the node. The scene puts the
            // node away once the city beat is running — it scales to nothing —
            // and a child of it goes with it, which is what took the die off
            // the map halfway through the beat.
            if (t >= 1) {
                // Parented to the world, not to the map: the map's own scale is
                // uneven (its X is two thirds of its Z), and hanging off it the
                // die came out both stretched and half again bigger than it was
                // on the way down. It rides the map through the position and
                // rotation set below instead, which is all it needs.
                if (holder.parent !== app.root) app.root.addChild(holder);
                var d = readScale();
                holder.setLocalScale(d, d, d);
                landed.copy(map.up).mulScalar(LIFT).add(map.getPosition());
                holder.setPosition(landed);
                // Flat on the terrain, rolled to the camera: the die lies on
                // the city rather than facing it, but the print still has to
                // read.
                holder.lookAt(under.copy(landed).sub(map.up), cam.up);
                return;
            }

            // Still on the way down (or scrolled back up above the window).
            if (holder.parent !== node) node.addChild(holder);
            var s = node.getLocalScale().x;
            var k = s > 1e-4 ? MIN_HOST / s : 1;
            holder.setLocalScale(k, k, k);
            if (t === 0) {
                // Back on the node's own spot, where the filaments meet. The
                // warm-up pass runs the whole timeline before the visitor
                // scrolls, so this has to be restored, not just left alone.
                holder.setLocalPosition(0, 0, 0);
                holder.setLocalEulerAngles(0, 0, -45);
                return;
            }

            landed.copy(map.up).mulScalar(LIFT).add(map.getPosition());
            holder.setPosition(landed);
            holder.lookAt(under.copy(landed).sub(map.up), cam.up);
            landedRot.copy(holder.getRotation());
            flying.copy(node.getPosition());
            holder.setPosition(flying.lerp(flying, landed, t));
            holder.setRotation(rot.slerp(rot.copy(node.getRotation()).mul(roll), landedRot, t));
        });
    });
})();
