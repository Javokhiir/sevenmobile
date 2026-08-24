"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ScrambleText } from "@/components/scramble-text";
import { fbm, mulberry32 } from "@/lib/noise";

/**
 * The city plate: procedural desert basin with an illuminated street grid
 * fading out towards the edges of the built-up area.
 */
function CityPlate() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // --- ground ---
      const ground = fbm(77123, 6);
      const cell = 4;
      for (let y = 0; y < h; y += cell) {
        for (let x = 0; x < w; x += cell) {
          const n = ground(x / w / 1.4, y / h / 1.4);
          const shade = 0.42 + n * 0.6;
          ctx.fillStyle = `rgb(${Math.round(96 * shade + 26)},${Math.round(
            80 * shade + 22,
          )},${Math.round(64 * shade + 20)})`;
          ctx.fillRect(x, y, cell, cell);
        }
      }

      // --- street grid, brightest at the centre of the basin ---
      const rand = mulberry32(9090);
      const cx = w * 0.5;
      const cy = h * 0.52;
      const rx = w * 0.34;
      const ry = h * 0.36;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = "rgba(255, 214, 150, 0.9)";

      const lines = 26;
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        const jitter = (rand() - 0.5) * (w / lines) * 0.5;
        const x = cx - rx + t * rx * 2 + jitter;
        const falloff = 1 - Math.abs(t - 0.5) * 2;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = `rgba(255, 208, 140, ${0.16 + falloff * 0.42})`;
        ctx.lineWidth = rand() > 0.82 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, cy - ry * falloff);
        ctx.lineTo(x, cy + ry * falloff);
        ctx.stroke();
      }
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        const jitter = (rand() - 0.5) * (h / lines) * 0.5;
        const y = cy - ry + t * ry * 2 + jitter;
        const falloff = 1 - Math.abs(t - 0.5) * 2;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = `rgba(255, 208, 140, ${0.16 + falloff * 0.42})`;
        ctx.lineWidth = rand() > 0.86 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx - rx * falloff, y);
        ctx.lineTo(cx + rx * falloff, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return (
    <div className="urban__plate" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}

/** 05 — the city mesh, framed through an optical viewfinder. */
export function SceneUrban() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const base = {
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
      } satisfies ScrollTrigger.Vars;

      gsap.fromTo(
        ".urban__plate",
        { scale: 1.45, yPercent: -5 },
        { scale: 1.02, yPercent: 3, ease: "none", scrollTrigger: base },
      );

      // The frame snaps in with a short chromatic stutter, then holds.
      gsap
        .timeline({ scrollTrigger: { ...base, start: "8% top", end: "34% top" } })
        .fromTo(
          ".viewfinder",
          { opacity: 0, scale: 1.14, filter: "blur(12px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", ease: "power2.out" },
        )
        .fromTo(
          ".vf-bracket, .vf-tick",
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, stagger: 0.05, ease: "power2.out" },
          "<0.2",
        );

      gsap.fromTo(
        ".urban__title",
        { opacity: 0, x: -50, letterSpacing: "0.2em" },
        {
          opacity: 1,
          x: 0,
          letterSpacing: "-0.03em",
          ease: "power3.out",
          scrollTrigger: { ...base, start: "18% top", end: "44% top" },
        },
      );
      gsap.fromTo(
        ".urban__cap",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: { ...base, start: "24% top", end: "48% top" },
        },
      );

      gsap.to(".viewfinder, .urban__title, .urban__cap", {
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...base, start: "82% top", end: "97% top" },
      });
    },
    { scope: root },
  );

  return (
    <section className="scene scene--urban" ref={root} data-name="URBAN GRID">
      <div className="stage">
        <CityPlate />
        <div className="urban__vignette" aria-hidden="true" />

        <div className="viewfinder">
          <span className="viewfinder__glass" />
          <span className="vf-status">LIVE / GRID SYNC 100%</span>
          <span className="vf-bracket l" />
          <span className="vf-bracket r" />
          <span className="vf-tick tl" />
          <span className="vf-tick tr" />
          <span className="vf-tick bl" />
          <span className="vf-tick br" />
          <span className="vf-reticle" />
        </div>

        <h2 className="urban__title">
          <span className="plus">+</span>
          <ScrambleText text="Urban grid" trigger={root} start="16% top" duration={0.9} />
        </h2>
        <ScrambleText
          as="p"
          className="urban__cap"
          text={"The city-side mesh that carries real-time service,\ndense-cell coordination and autonomous failover."}
          trigger={root}
          start="22% top"
          duration={1.4}
        />
      </div>
    </section>
  );
}
