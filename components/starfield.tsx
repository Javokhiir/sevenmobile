"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number; r: number; tw: number };

/**
 * Fixed starfield behind every scene. Stars drift, twinkle and parallax with
 * scroll, then fade out once the descent reaches the atmosphere.
 */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = w < 700 ? 9000 : 5200;
      const count = Math.floor((w * h) / density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 1.6 - h * 0.3,
        z: Math.random() * 0.85 + 0.15,
        r: Math.random() * 1.15 + 0.25,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t: number) => {
      // The field belongs to space — dissolve it as we drop into the clouds.
      const doc = document.documentElement;
      const progress =
        doc.scrollHeight > doc.clientHeight
          ? window.scrollY / (doc.scrollHeight - doc.clientHeight)
          : 0;
      const visibility = 1 - Math.min(1, Math.max(0, (progress - 0.24) / 0.14));

      ctx.clearRect(0, 0, w, h);
      if (visibility > 0.001) {
        for (const s of stars) {
          const y = ((s.y - window.scrollY * 0.035 * s.z) % (h * 1.6) + h * 1.6) % (h * 1.6) - h * 0.3;
          const twinkle = 0.55 + Math.sin(t * 0.0011 + s.tw) * 0.45;
          ctx.globalAlpha = twinkle * s.z * visibility;
          ctx.fillStyle = "#dfe9ff";
          ctx.beginPath();
          ctx.arc(s.x, y, s.r * s.z, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };

    build();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", build);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
    };
  }, []);

  return <canvas ref={ref} className="stars" aria-hidden="true" />;
}
