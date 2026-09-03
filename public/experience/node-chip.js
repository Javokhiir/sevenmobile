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
    // The mover shrinks the node to 0.05 as it settles onto the city, which
    // leaves the die 60-odd pixels over a busy satellite image. Below this the
    // holder scales back up, so the die stops shrinking and stays legible for
    // the rest of the scene. It still hangs off the same entity, so it lands
    // where it was going to land and rides the map's anchor from there.
    var MIN_HOST = 0.32;
    var SETTLE_FROM = 0.185;    // scroll progress over which it lands
    var SETTLE_TO = 0.225;
    var LIFT = 0.45;            // world units above the map origin

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

        app.on('update', function () {
            var s = node.getLocalScale().x;
            var k = s > 1e-4 && s < MIN_HOST ? MIN_HOST / s : 1;
            holder.setLocalScale(k, k, k);
            if (!map || !cam) return;

            var t = (progress - SETTLE_FROM) / (SETTLE_TO - SETTLE_FROM);
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            t = t * t * (3 - 2 * t);
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
            // Flat on the terrain, rolled to the camera: the die lies on the
            // city rather than facing it, but the print still has to read.
            holder.lookAt(under.copy(landed).sub(map.up), cam.up);
            if (t >= 1) return;

            landedRot.copy(holder.getRotation());
            flying.copy(node.getPosition());
            holder.setPosition(flying.lerp(flying, landed, t));
            holder.setRotation(rot.slerp(rot.copy(node.getRotation()).mul(roll), landedRot, t));
        });
    });
})();
