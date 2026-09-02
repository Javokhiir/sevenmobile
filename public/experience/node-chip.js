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
    });
})();
