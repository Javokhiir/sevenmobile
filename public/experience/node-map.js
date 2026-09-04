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
        // Scene attributes are applied after the start event, so copy changes
        // belong in postinitialize or the exported values overwrite them.
        app.once('postinitialize', function () {
            // Replace the template's network copy with the phone's chipset and
            // a short quality statement. The decorative body icon stays out.
            var node = app.root.findByName('DiamondV4');
            var label = node && node.script && node.script.diamondLabel;
            if (label) {
                label.titleText = 'MediaTek\\nDimensity 7400';
                label.bodyText = "Puxta yig'ilgan korpus, sifatli materiallar va har bir detalga berilgan e'tibor Connect U7'ni kundalik foydalanishda ishonchli qiladi.";
                label.showIcon = false;
                label.titleGap = 24;
                label.titleIndent = 0;
            }

            // The following map caption introduces the product as a national
            // brand instead of describing Tashkent and mobile coverage.
            var mapScene = app.root.findByName('sceneDiamondMap');
            var mapTextEntity = mapScene && mapScene.findByName('text');
            var mapText = mapTextEntity && mapTextEntity.script && mapTextEntity.script.sceneText;
            if (mapText) {
                mapText.titleText = 'Milliy Brend';
                mapText.bodyText = "O'zbekistonda yaratilgan Connect U7 zamonaviy dizayn, ishonchli sifat va mahalliy yondashuvni birlashtiradi.";
            }
        });

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
