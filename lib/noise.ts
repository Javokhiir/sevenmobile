/** Deterministic PRNG so generated terrain looks the same on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value-noise field with bilinear interpolation, sampled in unit space. */
export function valueNoise(seed: number, size = 64) {
  const rand = mulberry32(seed);
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();

  const smooth = (t: number) => t * t * (3 - 2 * t);

  return (x: number, y: number) => {
    const fx = ((x % 1) + 1) % 1;
    const fy = ((y % 1) + 1) % 1;
    const gx = fx * size;
    const gy = fy * size;
    const x0 = Math.floor(gx) % size;
    const y0 = Math.floor(gy) % size;
    const x1 = (x0 + 1) % size;
    const y1 = (y0 + 1) % size;
    const tx = smooth(gx - Math.floor(gx));
    const ty = smooth(gy - Math.floor(gy));

    const a = grid[y0 * size + x0];
    const b = grid[y0 * size + x1];
    const c = grid[y1 * size + x0];
    const d = grid[y1 * size + x1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  };
}

/** Fractal sum of value noise — the usual ridged-terrain workhorse. */
export function fbm(seed: number, octaves = 5) {
  const layers = Array.from({ length: octaves }, (_, i) => valueNoise(seed + i * 977));
  return (x: number, y: number) => {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (const layer of layers) {
      sum += layer(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.05;
    }
    return sum / norm;
  };
}
