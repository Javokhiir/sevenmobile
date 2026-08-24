/**
 * Character-scramble reveal: text resolves left to right out of a churn of
 * technical glyphs. Used for every heading and caption in the experience.
 */
const GLYPHS = "#$%&/\\|<>_-+*=[]{}!?^~0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export type ScrambleOptions = {
  /** Seconds for the whole string to settle. */
  duration?: number;
  /** Seconds a single character churns before locking. */
  churn?: number;
  /** Seconds before the first character starts resolving. */
  delay?: number;
};

/**
 * Animates `el` to `text`. Returns a stop function; calling it leaves the
 * final text in place so an interrupted reveal never strands garbage on screen.
 */
export function scrambleTo(
  el: HTMLElement,
  text: string,
  { duration = 1.1, churn = 0.32, delay = 0 }: ScrambleOptions = {},
) {
  const chars = [...text];
  // Whitespace never churns, so line breaks and spacing stay stable.
  const settleAt = chars.map((c, i) =>
    /\s/.test(c) ? 0 : delay + (i / Math.max(1, chars.length - 1)) * duration,
  );

  const started = performance.now();
  let raf = 0;
  let stopped = false;

  const frame = () => {
    if (stopped) return;
    const t = (performance.now() - started) / 1000;
    let done = true;
    let out = "";

    for (let i = 0; i < chars.length; i++) {
      const settle = settleAt[i];
      if (t >= settle) {
        out += chars[i];
      } else if (t >= settle - churn) {
        out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        done = false;
      } else {
        out += " ";
        done = false;
      }
    }

    el.textContent = out;
    if (done) return;
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    el.textContent = text;
  };
}

/**
 * Brief corruption pass over already-settled text — one or two characters flip
 * to a glyph and back. Drives the wordmark's periodic glitch.
 */
export function corrupt(el: HTMLElement, text: string, ms = 90) {
  const chars = [...text];
  const hits = 1 + ((Math.random() * 2) | 0);
  for (let i = 0; i < hits; i++) {
    const at = (Math.random() * chars.length) | 0;
    if (!/\s/.test(chars[at])) {
      chars[at] = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
  }
  el.textContent = chars.join("");
  const timer = window.setTimeout(() => {
    el.textContent = text;
  }, ms);
  return () => window.clearTimeout(timer);
}
