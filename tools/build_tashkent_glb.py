"""Builds the ground the processor lands on in scene 2: Tashkent, for real.

Elevation comes from the open terrarium tiles on AWS, the surface from Esri
World Imagery. Both are fetched here and baked into the two files below, so the
experience itself makes no tile requests at runtime. The imagery is
© Esri, Maxar, Earthstar Geographics — keep that credit wherever this ships.

Writes files/custom/tashkent.glb (geometry) and files/custom/tashkent.webp (the
surface). node-map.js swaps them onto the MAP entity the scene already has, so
the plane keeps its transform, its material settings and its scripts.

Run from the repo root: python3 tools/build_tashkent_glb.py
"""
import concurrent.futures
import hashlib
import io
import math
import os
import sys
import tempfile
import urllib.request

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_phone_glb import Mesh, norm, write_glb  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUSTOM = os.path.join(ROOT, "public", "experience", "files", "custom")
OUT_GLB = os.path.join(CUSTOM, "tashkent.glb")
OUT_TEX = os.path.join(CUSTOM, "tashkent.webp")

# The city centre, about 15 km across: close enough that the blocks, the canals
# and Amir Temur square read as Tashkent rather than as a generic city. The
# processor lands on the middle of the plane, so the centre has to sit there.
CENTRE = (41.311, 69.279)
SPAN_LON, SPAN_LAT = 0.18, 0.13

IMG_ZOOM, DEM_ZOOM = 15, 13
TEX = 2048
GRID = 102              # the plane it replaces is 102 x 102
# Mesh-local, matching the plane's own ±1 extent and its authored relief. The
# city sits on a plain, so the real range over this span is a couple of hundred
# metres: it is stretched to fill this, which reads as the slope it is.
AMP = 0.05

IMG_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
DEM_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
CACHE = os.path.join(tempfile.gettempdir(), "sevenmobile-tiles")


def deg2num(lat, lon, z):
    """Fractional web-mercator tile coordinates."""
    n = 2.0 ** z
    r = math.radians(lat)
    return ((lon + 180.0) / 360.0 * n,
            (1.0 - math.asinh(math.tan(r)) / math.pi) / 2.0 * n)


def tile(url, z, x, y):
    path = os.path.join(CACHE, hashlib.md5(("%s/%d/%d/%d" % (url, z, x, y)).encode()).hexdigest())
    if not os.path.exists(path):
        req = urllib.request.Request(url.format(z=z, x=x, y=y), headers={"User-Agent": "sevenmobile-build/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        os.makedirs(CACHE, exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
    else:
        data = open(path, "rb").read()
    return Image.open(io.BytesIO(data))


def mosaic(url, z, bbox):
    """Tiles covering the lon/lat bbox, stitched and cropped back to it."""
    west, south, east, north = bbox
    x0, y0 = deg2num(north, west, z)
    x1, y1 = deg2num(south, east, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(math.ceil(x1)), int(math.ceil(y1))

    out = Image.new("RGB", ((tx1 - tx0) * 256, (ty1 - ty0) * 256))
    jobs = [(x, y) for y in range(ty0, ty1) for x in range(tx0, tx1)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for (x, y), img in zip(jobs, pool.map(lambda j: tile(url, z, j[0], j[1]), jobs)):
            out.paste(img.convert("RGB"), ((x - tx0) * 256, (y - ty0) * 256))
    print("  z%d: %d tiles" % (z, len(jobs)))
    return out.crop((int(round((x0 - tx0) * 256)), int(round((y0 - ty0) * 256)),
                     int(round((x1 - tx0) * 256)), int(round((y1 - ty0) * 256))))


def heights(bbox):
    """Metres above sea level on the GRID x GRID lattice, north-up."""
    dem = mosaic(DEM_URL, DEM_ZOOM, bbox).resize((GRID, GRID), Image.LANCZOS)
    px = dem.load()
    return [[px[i, j][0] * 256 + px[i, j][1] + px[i, j][2] / 256.0 - 32768.0
             for i in range(GRID)] for j in range(GRID)]


def build(h):
    lo = min(min(r) for r in h)
    hi = max(max(r) for r in h)
    span = (hi - lo) or 1.0
    y = [[(h[j][i] - lo) / span * AMP for i in range(GRID)] for j in range(GRID)]

    # Slope in mesh units: one cell is 2 / (GRID - 1) across.
    step = 2.0 / (GRID - 1)
    m = Mesh("terrain", "terrain")
    for j in range(GRID):
        for i in range(GRID):
            dx = (y[j][min(i + 1, GRID - 1)] - y[j][max(i - 1, 0)]) / (2 * step)
            dz = (y[min(j + 1, GRID - 1)][i] - y[max(j - 1, 0)][i]) / (2 * step)
            m.vert((-1 + i * step, y[j][i], -1 + j * step), norm((-dx, 1.0, -dz)),
                   (i / (GRID - 1.0), j / (GRID - 1.0)))
    for j in range(GRID - 1):
        for i in range(GRID - 1):
            a = j * GRID + i
            m.tri(a, a + GRID, a + GRID + 1)
            m.tri(a, a + GRID + 1, a + 1)
    return m, lo, hi


def main():
    lat, lon = CENTRE
    bbox = (lon - SPAN_LON / 2, lat - SPAN_LAT / 2, lon + SPAN_LON / 2, lat + SPAN_LAT / 2)
    print("Tashkent %.3f,%.3f  %.2f x %.2f deg" % (lat, lon, SPAN_LON, SPAN_LAT))

    mosaic(IMG_URL, IMG_ZOOM, bbox).resize((TEX, TEX), Image.LANCZOS).save(
        OUT_TEX, "WEBP", quality=88, method=6)

    mesh, lo, hi = build(heights(bbox))
    materials = [{"name": "terrain",
                  "pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0.0, "roughnessFactor": 0.95}}]
    data = write_glb([mesh], [], materials)
    with open(OUT_GLB, "wb") as f:
        f.write(data)

    for p in (OUT_GLB, OUT_TEX):
        print("%s: %d bytes, md5 %s" % (os.path.relpath(p, ROOT), os.path.getsize(p),
                                        hashlib.md5(open(p, "rb").read()).hexdigest()))
    print("elevation %.0f - %.0f m over %d verts" % (lo, hi, len(mesh.pos)))


if __name__ == "__main__":
    main()
