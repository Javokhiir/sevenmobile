"""Builds public/experience/files/custom/connect_u7.glb for the PlayCanvas experience.

The phone is a rounded slab whose back face is textured with the product render
in public/product, so the lens rings, flash and 7TECH wordmark are the real ones.
The screen is not a render: it is black with the 7TECH wordmark, rasterised from
the same outlines the splash and header use. Lens rings, side buttons and the
internals (battery, board, chip) are real geometry, since the scene's data-scan
effect reveals the inside. Units are metres, +Z is the screen side, +X the
button side.

Run from the repo root: python3 tools/build_phone_glb.py
"""
import hashlib
import io
import json
import math
import os
import re
import struct

from PIL import Image, ImageDraw, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCT = os.path.join(ROOT, "public", "product")
OUT = os.path.join(ROOT, "public", "experience", "files", "custom", "connect_u7.glb")

W, H, T = 0.0755, 0.1635, 0.0085
RC = 0.0066          # body corner radius
RF = 0.0022          # edge fillet on front and back
TEX_W, TEX_H = 1024, 2048

# The screen: black, with the wordmark read out of the one file that holds it.
# The punch-hole and the in-display print reader are drawn a few values off the
# black so they read as hardware on an unlit screen rather than as UI.
LOGO_SRC = os.path.join(ROOT, "public", "experience", "brand-logo.js")
SCREEN_RGB = (6, 6, 8)
LOGO_WIDTH = 0.56          # of the screen width
CAMERA = (0.5, 0.026, 0.062)     # centre x, centre y, diameter, of the screen
CAMERA_RGB, CAMERA_RIM_RGB = (16, 16, 20), (44, 44, 50)
PRINT = (0.5, 0.845, 0.15)       # same, width of the fingerprint mark
PRINT_RGB = (74, 74, 82)

BEZEL_SIDE, BEZEL_TOP, BEZEL_BOTTOM, SCREEN_RADIUS = 0.0021, 0.0038, 0.0046, 0.005

# The USB-C opening, half width and half height. Real connector, 8.4 x 2.6 mm.
PORT_HOLE = (0.00420, 0.00130)

# Body silhouette in u7-black-back.webp (the buttons poke out past x=5).
BACK_SRC = "u7-black-back.webp"
BACK_BODY = (5, 0, 656, 1400)
# Lens ring centres as fractions of the body crop, image-left is phone +X.
LENSES = [(0.2120, 0.0979), (0.2120, 0.1986), (0.2120, 0.3007)]
LENS_RO, LENS_RI, LENS_H, LENS_GLASS_DROP = 0.0069, 0.0044, 0.0012, 0.0006

FRAME_RGB = (0.012, 0.012, 0.014)

# The processor callout. The source render is square with its own warm glow;
# CHIP_CROP squares it up around the die, so the quad below needs no padding.
CHIP_SRC = "protsessor.webp"
CHIP_CROP = (0, 110, 384, 494)
CHIP_TEX = 512
CHIP_SIZE = 0.024                    # quad side, giving a ~19 mm die
CHIP_POS = (0.0, 0.030, -0.0052)     # on the back, just clear of the glow anchors


# ---------- geometry helpers ----------

class Mesh:
    def __init__(self, name, material):
        self.name, self.material = name, material
        self.pos, self.nrm, self.uv, self.idx = [], [], [], []

    def vert(self, p, n, uv):
        self.pos.append(p); self.nrm.append(n); self.uv.append(uv)
        return len(self.pos) - 1

    def tri(self, a, b, c):
        self.idx.extend((a, b, c))


def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / l for c in v)


def rounded_rect(hw, hh, r, per_corner=20):
    """CCW outline (viewed from +Z) as (point, outward normal) pairs."""
    pts = []
    corners = [((hw - r, -(hh - r)), -90), ((hw - r, hh - r), 0),
               ((-(hw - r), hh - r), 90), ((-(hw - r), -(hh - r)), 180)]
    for (cx, cy), a0 in corners:
        for k in range(per_corner + 1):
            a = math.radians(a0 + 90.0 * k / per_corner)
            n = (math.cos(a), math.sin(a))
            pts.append(((cx + r * n[0], cy + r * n[1]), n))
    return pts


def uv_front(x, y):
    return ((x + W / 2) / W, 1 - (y + H / 2) / H)


def uv_back(x, y):
    return (1 - (x + W / 2) / W, 1 - (y + H / 2) / H)


def build_body(meshes):
    outline = rounded_rect(W / 2 - RF, H / 2 - RF, RC - RF)
    n_out = len(outline)

    # Fillet + flat side profile, front to back.
    profile = []
    steps = 6
    for k in range(steps + 1):
        phi = math.radians(90 - 90.0 * k / steps)
        profile.append((RF * math.cos(phi), T / 2 - RF + RF * math.sin(phi), math.cos(phi), math.sin(phi)))
    profile.append((RF, T / 2 - RF, 1.0, 0.0))
    profile.append((RF, -T / 2 + RF, 1.0, 0.0))
    for k in range(steps + 1):
        phi = math.radians(90.0 * k / steps)
        profile.append((RF * math.cos(phi), -T / 2 + RF - RF * math.sin(phi), math.cos(phi), -math.sin(phi)))
    m_prof = len(profile)

    band = Mesh("frame", "frame")
    for i, ((ox, oy), (nx, ny)) in enumerate(outline):
        for j, (off, z, nr, nz) in enumerate(profile):
            band.vert((ox + nx * off, oy + ny * off, z), norm((nx * nr, ny * nr, nz)),
                      (i / n_out, j / (m_prof - 1)))
    for i in range(n_out):
        i2 = (i + 1) % n_out
        for j in range(m_prof - 1):
            a, b = i * m_prof + j, i2 * m_prof + j
            band.tri(a, b + 1, b)
            band.tri(a, a + 1, b + 1)
    meshes.append(band)

    front = Mesh("front", "front")
    c = front.vert((0, 0, T / 2), (0, 0, 1), uv_front(0, 0))
    ring = [front.vert((x, y, T / 2), (0, 0, 1), uv_front(x, y)) for (x, y), _ in outline]
    for i in range(n_out):
        front.tri(c, ring[i], ring[(i + 1) % n_out])
    meshes.append(front)

    back = Mesh("back", "back")
    c = back.vert((0, 0, -T / 2), (0, 0, -1), uv_back(0, 0))
    ring = [back.vert((x, y, -T / 2), (0, 0, -1), uv_back(x, y)) for (x, y), _ in outline]
    for i in range(n_out):
        back.tri(c, ring[(i + 1) % n_out], ring[i])
    meshes.append(back)


def build_lenses(meshes):
    rings = Mesh("lens_rings", "lens_ring")
    glass = Mesh("lens_glass", "lens_glass")
    K = 48
    z0, z1 = -T / 2, -T / 2 - LENS_H
    z2 = z1 + LENS_GLASS_DROP
    for fx, fy in LENSES:
        cx, cy = W / 2 - fx * W, H / 2 - fy * H
        dirs = [(math.cos(2 * math.pi * k / K), math.sin(2 * math.pi * k / K)) for k in range(K)]

        def p(r, d):
            return (cx + r * d[0], cy + r * d[1])

        o0 = [rings.vert(p(LENS_RO, d) + (z0,), (d[0], d[1], 0), uv_back(*p(LENS_RO, d))) for d in dirs]
        o1 = [rings.vert(p(LENS_RO, d) + (z1,), (d[0], d[1], 0), uv_back(*p(LENS_RO, d))) for d in dirs]
        t_o = [rings.vert(p(LENS_RO, d) + (z1,), (0, 0, -1), uv_back(*p(LENS_RO, d))) for d in dirs]
        t_i = [rings.vert(p(LENS_RI, d) + (z1,), (0, 0, -1), uv_back(*p(LENS_RI, d))) for d in dirs]
        i1 = [rings.vert(p(LENS_RI, d) + (z1,), (-d[0], -d[1], 0), uv_back(*p(LENS_RI, d))) for d in dirs]
        i2 = [rings.vert(p(LENS_RI, d) + (z2,), (-d[0], -d[1], 0), uv_back(*p(LENS_RI, d))) for d in dirs]
        for k in range(K):
            k2 = (k + 1) % K
            rings.tri(o0[k], o1[k2], o0[k2]); rings.tri(o0[k], o1[k], o1[k2])
            rings.tri(t_o[k], t_i[k], t_o[k2]); rings.tri(t_i[k], t_i[k2], t_o[k2])
            rings.tri(i1[k], i1[k2], i2[k2]); rings.tri(i1[k], i2[k2], i2[k])
        gc = glass.vert((cx, cy, z2), (0, 0, -1), uv_back(cx, cy))
        g = [glass.vert(p(LENS_RI, d) + (z2,), (0, 0, -1), uv_back(*p(LENS_RI, d))) for d in dirs]
        for k in range(K):
            glass.tri(gc, g[(k + 1) % K], g[k])
    meshes.append(rings)
    meshes.append(glass)


def add_box(mesh, center, size, uv_fn=None):
    cx, cy, cz = center
    hx, hy, hz = size[0] / 2, size[1] / 2, size[2] / 2
    faces = [((1, 0, 0), [(1, -1, -1), (1, 1, -1), (1, 1, 1), (1, -1, 1)]),
             ((-1, 0, 0), [(-1, -1, 1), (-1, 1, 1), (-1, 1, -1), (-1, -1, -1)]),
             ((0, 1, 0), [(-1, 1, 1), (1, 1, 1), (1, 1, -1), (-1, 1, -1)]),
             ((0, -1, 0), [(-1, -1, -1), (1, -1, -1), (1, -1, 1), (-1, -1, 1)]),
             ((0, 0, 1), [(-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]),
             ((0, 0, -1), [(-1, 1, -1), (1, 1, -1), (1, -1, -1), (-1, -1, -1)])]
    for n, corners in faces:
        ids = []
        for sx, sy, sz in corners:
            p = (cx + sx * hx, cy + sy * hy, cz + sz * hz)
            uv = uv_fn(p[0], p[1]) if uv_fn else (0.0, 0.0)
            ids.append(mesh.vert(p, n, uv))
        mesh.tri(ids[0], ids[1], ids[2]); mesh.tri(ids[0], ids[2], ids[3])


def build_buttons(meshes):
    m = Mesh("buttons", "frame")
    x = W / 2 + 0.0004
    add_box(m, (x, 0.0319, 0), (0.0012, 0.0196, 0.0026))
    add_box(m, (x, 0.0082, 0), (0.0012, 0.0147, 0.0026))
    meshes.append(m)


def build_port(meshes):
    """USB-C on the bottom edge. The body is a closed shell and cutting it would
    mean rebuilding the frame band, so the port is laid on the surface: a black
    floor at the connector's real size inside a bevel whose walls turn away from
    the key. Depth beyond a fraction of a millimetre would be hidden by the
    shell anyway, and what reads as an opening is the tone, not the parallax."""
    m = Mesh("usb_port", "port_hole")
    hw, hh = PORT_HOLE
    y = -H / 2 - 0.00005
    lip = rounded_rect(hw, hh, hh, 12)
    k = 0.72
    wall, floor = [], []
    for (x, z), (nx, nz) in lip:
        wall.append(m.vert((x, y, z), norm((-nx * 0.92, -0.4, -nz * 0.92)), (0, 0)))
        floor.append(m.vert((x * k, y - 0.00002, z * k), (0, -1, 0), (0, 1)))
    for i in range(len(wall)):
        j = (i + 1) % len(wall)
        m.tri(wall[i], floor[i], floor[j])
        m.tri(wall[i], floor[j], wall[j])
    c = m.vert((0, y - 0.00002, 0), (0, -1, 0), (0.5, 0.5))
    base = [m.vert((x * k, y - 0.00002, z * k), (0, -1, 0), (0, 0)) for (x, z), _ in lip]
    for i in range(len(base)):
        m.tri(c, base[i], base[(i + 1) % len(base)])
    meshes.append(m)


def build_internals(meshes):
    battery = Mesh("battery", "battery")
    # Topped out below the board at 0.014: it used to run to 0.028, which put it
    # up between the die and the bottom lens once the back opens.
    add_box(battery, (0, -0.030, 0), (0.060, 0.076, 0.0040))
    board = Mesh("mainboard", "pcb")
    add_box(board, (0, 0.036, 0.0004), (0.064, 0.044, 0.0010))
    # The die carries the processor render, so the scan reveals a processor
    # rather than a gold block. Mirrored in u like the back face, since that is
    # the side it is read from.
    chip = Mesh("chip", "chip_die")
    # Behind the board, not on top of it: the back is the side the scan opens,
    # and the board would otherwise sit in front of the die.
    cw, cy = 0.017, 0.030
    add_box(chip, (0, cy, -0.0009), (cw, cw, 0.0014),
            lambda x, y: (0.5 - x / cw, 0.5 - (y - cy) / cw))
    shield = Mesh("shields", "shield")
    add_box(shield, (0.021, 0.038, 0.0016), (0.017, 0.022, 0.0012))
    add_box(shield, (-0.021, 0.030, 0.0016), (0.014, 0.012, 0.0012))
    add_box(shield, (0, -0.073, 0.0006), (0.040, 0.008, 0.0016))
    meshes.extend([battery, board, chip, shield])


def build_chip_face(meshes):
    """The processor render, on a quad facing out of the back. Wound and
    UV-mirrored like the back face so the labelling reads the right way round."""
    m = Mesh("chip_face", "chip_face")
    cx, cy, z = CHIP_POS
    h = CHIP_SIZE / 2
    corners = [(-h, h), (h, h), (h, -h), (-h, -h)]
    ids = []
    for dx, dy in corners:
        u = 1 - (dx + h) / CHIP_SIZE
        v = 1 - (dy + h) / CHIP_SIZE
        ids.append(m.vert((cx + dx, cy + dy, z), (0, 0, -1), (u, v)))
    m.tri(ids[0], ids[1], ids[2])
    m.tri(ids[0], ids[2], ids[3])
    meshes.append(m)


# ---------- textures ----------

def logo_mask(width):
    """The 7TECH wordmark from brand-logo.js as an alpha mask `width` px wide."""
    js = open(LOGO_SRC, encoding="utf-8").read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', js).group(1).split()]
    ss = 4                                    # supersample, then downscale
    scale = width * ss / vb[2]
    img = Image.new("L", (width * ss, int(round(vb[3] * scale))), 0)
    draw = ImageDraw.Draw(img)
    for d in re.findall(r'\sd="([^"]+)"', js):
        for poly in path_polygons(d):
            draw.polygon([(x * scale, y * scale) for x, y in poly], fill=255)
    return img.resize((width, img.height // ss), Image.LANCZOS)


def path_polygons(d, steps=16):
    """Absolute M/L/H/V/C/Z path data as closed polylines. The wordmark has no
    holes, so a plain polygon fill per subpath is enough."""
    toks = re.findall(r"[A-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?", d)
    polys, pts, cmd, x, y, i = [], [], None, 0.0, 0.0, 0
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]
            i += 1
            if cmd == "Z":
                if len(pts) > 2:
                    polys.append(pts)
                pts = []
                continue
        n = lambda k: float(toks[i + k])
        if cmd in ("M", "L"):
            x, y = n(0), n(1); i += 2
            pts = [(x, y)] if cmd == "M" else pts + [(x, y)]
        elif cmd == "H":
            x = n(0); i += 1; pts.append((x, y))
        elif cmd == "V":
            y = n(0); i += 1; pts.append((x, y))
        elif cmd == "C":
            x1, y1, x2, y2, x3, y3 = (n(k) for k in range(6)); i += 6
            for s in range(1, steps + 1):
                t, u = s / steps, 1 - s / steps
                pts.append((u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
                            u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3))
            x, y = x3, y3
        else:
            raise ValueError("unsupported path command %r" % cmd)
    if len(pts) > 2:
        polys.append(pts)
    return polys


def hardware_mask(sw, sh, draw_fn):
    """Screen-sized alpha mask, drawn at 4x because PIL's arcs have no AA."""
    ss = 4
    img = Image.new("L", (sw * ss, sh * ss), 0)
    draw_fn(ImageDraw.Draw(img), sw * ss, sh * ss, ss)
    return img.resize((sw, sh), Image.LANCZOS)


def camera_hole(draw, w, h, ss):
    cx, cy, r = CAMERA[0] * w, CAMERA[1] * h, CAMERA[2] * w / 2
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)


def camera_marks(draw, w, h, ss):
    cx, cy, r = CAMERA[0] * w, CAMERA[1] * h, CAMERA[2] * w / 2 + 1.2 * ss
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)


def print_marks(draw, w, h, ss):
    """The print reader: nested ridges, open at the bottom like the render's."""
    cx, cy, r = PRINT[0] * w, PRINT[1] * h, PRINT[2] * w / 2
    line = max(1, int(round(1.4 * ss)))
    for k in (1.0, 0.78, 0.56, 0.34, 0.14):
        rr = r * k
        draw.arc((cx - rr, cy - rr, cx + rr, cy + rr), 180, 360, fill=255, width=line)
        tail = r * 0.85 * k
        for sx in (-1, 1):
            draw.line((cx + sx * rr, cy, cx + sx * rr, cy + tail), fill=255, width=line)


def make_front_texture():
    px_mm = TEX_W / (W * 1000)
    full_h = int(round(H * 1000 * px_mm))
    img = Image.new("RGB", (TEX_W, full_h), (3, 3, 4))

    sx0 = int(round(BEZEL_SIDE * 1000 * px_mm)); sx1 = TEX_W - sx0
    sy0 = int(round(BEZEL_TOP * 1000 * px_mm)); sy1 = full_h - int(round(BEZEL_BOTTOM * 1000 * px_mm))
    sw, sh = sx1 - sx0, sy1 - sy0

    screen = Image.new("RGB", (sw, sh), SCREEN_RGB)
    logo = logo_mask(int(round(sw * LOGO_WIDTH)))
    screen.paste((255, 255, 255), ((sw - logo.width) // 2, (sh - logo.height) // 2), logo)
    screen.paste(CAMERA_RIM_RGB, (0, 0), hardware_mask(sw, sh, camera_marks))
    screen.paste(CAMERA_RGB, (0, 0), hardware_mask(sw, sh, camera_hole))
    screen.paste(PRINT_RGB, (0, 0), hardware_mask(sw, sh, print_marks))

    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw - 1, sh - 1), radius=int(SCREEN_RADIUS * 1000 * px_mm), fill=255)
    img.paste(screen, (sx0, sy0), mask)
    return img.resize((TEX_W, TEX_H), Image.LANCZOS)


def make_back_texture():
    src = Image.open(os.path.join(PRODUCT, BACK_SRC)).convert("RGBA").crop(BACK_BODY)
    base = Image.new("RGBA", src.size, tuple(int(c * 255) for c in FRAME_RGB) + (255,))
    base.alpha_composite(src)
    return base.convert("RGB").resize((TEX_W, TEX_H), Image.LANCZOS)


def make_chip_texture():
    src = Image.open(os.path.join(ROOT, "public", CHIP_SRC)).convert("RGBA")
    return src.crop(CHIP_CROP).resize((CHIP_TEX, CHIP_TEX), Image.LANCZOS)


def make_die_texture():
    """The same render on black. The callout's glow is transparent, and the
    internal die is opaque geometry, so it gets flattened out. Lifted well off
    the black too: it is read through the scan, under a half-faded shell, where
    the render's own near-black package would disappear."""
    base = Image.new("RGBA", (CHIP_TEX, CHIP_TEX), (18, 18, 22, 255))
    base.alpha_composite(make_chip_texture())
    return ImageEnhance.Brightness(base.convert("RGB")).enhance(1.9)


def jpeg_bytes(img, quality=92):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


# ---------- glb writer ----------

def write_glb(meshes, images, materials):
    blob = bytearray()
    views, accessors = [], []

    def add_view(data, target=None):
        while len(blob) % 4:
            blob.append(0)
        view = {"buffer": 0, "byteOffset": len(blob), "byteLength": len(data)}
        if target:
            view["target"] = target
        blob.extend(data)
        views.append(view)
        return len(views) - 1

    def add_accessor(values, comp, ctype, count, minmax=False, target=34962):
        flat = [c for v in values for c in v] if comp > 1 else list(values)
        fmt = "<%d%s" % (len(flat), "f" if ctype == 5126 else "I")
        acc = {"bufferView": add_view(struct.pack(fmt, *flat), target), "componentType": ctype,
               "count": count, "type": {1: "SCALAR", 2: "VEC2", 3: "VEC3"}[comp]}
        if minmax:
            acc["min"] = [min(v[i] for v in values) for i in range(comp)]
            acc["max"] = [max(v[i] for v in values) for i in range(comp)]
        accessors.append(acc)
        return len(accessors) - 1

    mat_index = {m["name"]: i for i, m in enumerate(materials)}
    gl_meshes, nodes = [], []
    for m in meshes:
        prim = {"attributes": {"POSITION": add_accessor(m.pos, 3, 5126, len(m.pos), True),
                               "NORMAL": add_accessor(m.nrm, 3, 5126, len(m.nrm)),
                               "TEXCOORD_0": add_accessor(m.uv, 2, 5126, len(m.uv))},
                "indices": add_accessor(m.idx, 1, 5125, len(m.idx), target=34963),
                "material": mat_index[m.material]}
        gl_meshes.append({"name": m.name, "primitives": [prim]})
        nodes.append({"name": m.name, "mesh": len(gl_meshes) - 1})

    gl_images = [{"mimeType": mime, "bufferView": add_view(data), "name": name} for name, data, mime in images]

    gltf = {
        "asset": {"version": "2.0", "generator": "tools/build_phone_glb.py"},
        "extensionsUsed": ["KHR_materials_clearcoat"],
        "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes, "meshes": gl_meshes, "materials": materials,
        "images": gl_images,
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "textures": [{"source": i, "sampler": 0} for i in range(len(gl_images))],
        "accessors": accessors, "bufferViews": views,
        "buffers": [{"byteLength": len(blob)}],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    while len(js) % 4:
        js += b" "
    while len(blob) % 4:
        blob.append(0)
    out = bytearray(b"glTF") + struct.pack("<II", 2, 12 + 8 + len(js) + 8 + len(blob))
    out += struct.pack("<I", len(js)) + b"JSON" + js
    out += struct.pack("<I", len(blob)) + b"BIN\x00" + blob
    return bytes(out)


def main():
    meshes = []
    build_body(meshes)
    build_lenses(meshes)
    build_buttons(meshes)
    build_port(meshes)
    build_internals(meshes)
    build_chip_face(meshes)

    materials = [
        {"name": "frame", "pbrMetallicRoughness": {"baseColorFactor": list(FRAME_RGB) + [1], "metallicFactor": 1.0, "roughnessFactor": 0.38}},
        {"name": "front", "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "baseColorFactor": [0.4, 0.4, 0.4, 1], "metallicFactor": 0.0, "roughnessFactor": 0.1},
         "emissiveTexture": {"index": 0}, "emissiveFactor": [0.75, 0.75, 0.75]},
        {"name": "back", "pbrMetallicRoughness": {"baseColorTexture": {"index": 1}, "baseColorFactor": [0.22, 0.22, 0.22, 1], "metallicFactor": 0.05, "roughnessFactor": 0.45},
         "extensions": {"KHR_materials_clearcoat": {"clearcoatFactor": 0.32, "clearcoatRoughnessFactor": 0.15}}},
        {"name": "lens_ring", "pbrMetallicRoughness": {"baseColorTexture": {"index": 1}, "baseColorFactor": [0.22, 0.22, 0.22, 1], "metallicFactor": 0.9, "roughnessFactor": 0.4}},
        {"name": "lens_glass", "pbrMetallicRoughness": {"baseColorTexture": {"index": 1}, "baseColorFactor": [0.22, 0.22, 0.22, 1], "metallicFactor": 0.2, "roughnessFactor": 0.05},
         "extensions": {"KHR_materials_clearcoat": {"clearcoatFactor": 1.0, "clearcoatRoughnessFactor": 0.05}}},
        {"name": "battery", "pbrMetallicRoughness": {"baseColorFactor": [0.16, 0.17, 0.19, 1], "metallicFactor": 0.3, "roughnessFactor": 0.55}},
        {"name": "pcb", "pbrMetallicRoughness": {"baseColorFactor": [0.06, 0.14, 0.10, 1], "metallicFactor": 0.2, "roughnessFactor": 0.6}},
        {"name": "chip_die", "pbrMetallicRoughness": {"baseColorTexture": {"index": 3}, "metallicFactor": 0.15, "roughnessFactor": 0.5},
         "emissiveTexture": {"index": 3}, "emissiveFactor": [0.85, 0.85, 0.85]},
        {"name": "port_hole", "doubleSided": True, "pbrMetallicRoughness": {"baseColorFactor": [0.004, 0.004, 0.005, 1], "metallicFactor": 0.0, "roughnessFactor": 0.95}},
        {"name": "shield", "pbrMetallicRoughness": {"baseColorFactor": [0.70, 0.72, 0.75, 1], "metallicFactor": 1.0, "roughnessFactor": 0.4}},
        # Unlit on purpose: the callout has to read the same wherever the phone
        # is in the scene, so the render is carried by emissive alone.
        {"name": "chip_face", "alphaMode": "BLEND",
         "pbrMetallicRoughness": {"baseColorTexture": {"index": 2}, "baseColorFactor": [0, 0, 0, 1], "metallicFactor": 0.0, "roughnessFactor": 1.0},
         "emissiveTexture": {"index": 2}, "emissiveFactor": [1, 1, 1]},
    ]
    images = [("front", jpeg_bytes(make_front_texture()), "image/jpeg"),
              ("back", jpeg_bytes(make_back_texture()), "image/jpeg"),
              ("chip", png_bytes(make_chip_texture()), "image/png"),
              ("die", jpeg_bytes(make_die_texture()), "image/jpeg")]
    data = write_glb(meshes, images, materials)
    with open(OUT, "wb") as f:
        f.write(data)
    print("%s: %d bytes, md5 %s, %d meshes, %d verts" % (
        os.path.relpath(OUT, ROOT), len(data), hashlib.md5(data).hexdigest(), len(meshes), sum(len(m.pos) for m in meshes)))


if __name__ == "__main__":
    main()
