// The underground network scene shipped with the template's server racks. The
// phone is what this site is about, so the racks come out and the Connect U7
// stands where the central one did. The floor, the lights and the processor
// that flies in for the next beat are left alone.
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
