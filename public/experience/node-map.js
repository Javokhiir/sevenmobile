// Puts the real Tashkent under the node in scene 2. The MAP plane the scene
// ships is a displaced grid of somewhere else, so only its mesh and its surface
// are replaced: the entity keeps its transform, its material settings and
// whatever the scene's own scripts do to it.
//
// Both files come from tools/build_tashkent_glb.py. Imagery © Esri, Maxar,
// Earthstar Geographics.
(function () {
    var app = pc.Application.getApplication();
    if (!app) return;

    app.once('start', function () {
        var map = app.root.findByName('MAP');
        var glb = app.assets.find('tashkent.glb', 'container');
        var tex = app.assets.find('tashkent.webp', 'texture');
        if (!map || !map.render || !glb || !glb.resource || !tex || !tex.resource) {
            console.warn('[nodeMap] MAP or the tashkent assets are missing, map left as is');
            return;
        }

        var mi = map.render.meshInstances[0];
        mi.mesh = glb.resource.renders[0].resource.meshes[0];
        mi.material.diffuseMap = tex.resource;
        mi.material.update();
    });
})();
