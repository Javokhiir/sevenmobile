// The underground network scene shipped with the template's server racks. The
// phone is what this site is about, so the racks come out and the Connect U7
// stands where the central one did. The floor and the lights are left alone.
(function () {
    var app = pc.Application.getApplication();
    if (!app) return;

    var STRIP = ['column', 'ComputeTrayJOINED', 'shadowPOD'];
    var SCALE = 11;
    var LIFT = 1.0;             // half the phone's height, so it stands on the floor

    app.once('start', function () {
        var scene = app.root.findByName('sceneDatacenter');
        var asset = app.assets.find('connect_u7.glb', 'container');
        var rack = scene && scene.findByName('GDX-JOIN2 - FIXtop2');
        if (!scene || !rack || !asset || !asset.resource) {
            console.warn('[nodeNetwork] sceneDatacenter or connect_u7.glb missing, racks left as is');
            return;
        }

        scene.children.forEach(function (c) {
            if (STRIP.indexOf(c.name) !== -1) c.enabled = false;
        });
        // The template's generic die flew in here and rose again in the chip
        // scene. The phone now carries that beat itself, and two anonymous
        // chips in front of it read as leftovers. Their captions stay: they are
        // the Dimensity's, and they sit over the phone instead.
        var processor = scene.findByName('processor');
        if (processor) processor.enabled = false;
        var chipcard = app.root.findByName('Chipcard');
        if (chipcard) chipcard.enabled = false;
        // The 5G beat is out too. Disabled here rather than mid-scene: neither
        // worldText nor hudText cleans up when its script stops, so the only
        // way they never show is for their scripts never to start.
        ['TitleRack', 'Racktxt'].forEach(function (n) {
            var e = scene.findByName(n);
            if (e) e.enabled = false;
        });
        // The rack entity stays: objectFade drives it with the rest of the
        // scene. Only its meshes go.
        rack.forEach(function (e) {
            if (e.render) e.removeComponent('render');
        });

        var floor = scene.findByName('floor');
        var phone = asset.resource.instantiateRenderEntity({ castShadows: false, receiveShadows: false });
        phone.name = 'ConnectU7Network';
        phone.setLocalScale(SCALE, SCALE, SCALE);
        scene.addChild(phone);
        phone.setPosition(rack.getPosition().x, (floor ? floor.getPosition().y : rack.getPosition().y) + LIFT,
            rack.getPosition().z);
    });
})();
