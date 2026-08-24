"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ScrambleText } from "@/components/scramble-text";
import { mulberry32 } from "@/lib/noise";

/** Drifting crosshair constellation drawn behind the satellite. */
function Mesh() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rand = mulberry32(4242);
    let raf = 0;
    let w = 0;
    let h = 0;
    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = Array.from({ length: w < 700 ? 14 : 26 }, () => ({
        x: rand() * w,
        y: rand() * h,
        vx: (rand() - 0.5) * 0.12,
        vy: (rand() - 0.5) * 0.12,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // Link near neighbours — the crosslink lattice.
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          const reach = Math.min(w, h) * 0.42;
          if (dist < reach) {
            ctx.strokeStyle = `rgba(210,228,255,${0.22 * (1 - dist / reach)})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Node markers as small plus signs.
      ctx.strokeStyle = "rgba(226,238,255,0.55)";
      ctx.lineWidth = 1;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.moveTo(n.x - 4, n.y);
        ctx.lineTo(n.x + 4, n.y);
        ctx.moveTo(n.x, n.y - 4);
        ctx.lineTo(n.x, n.y + 4);
        ctx.stroke();
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

  return (
    <div className="orbital__mesh" aria-hidden="true">
      <canvas ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

/**
 * Callouts live in screen space, not on the satellite: the relay rotates and
 * scales under them while the labels stay upright and legible. For `left`
 * entries `x` is measured from the right edge so the block grows outwards.
 */
const HOTSPOTS = [
  { x: "52%", y: "24%", title: "Laser mesh", sub: "Inter-satellite crosslink" },
  { x: "54%", y: "42%", title: "Signal core", sub: "Autonomous routing unit" },
  { x: "54%", y: "63%", title: "Phased array", sub: "Beamforming to 4096 cells", left: true },
  { x: "72%", y: "50%", title: "Solar wing", sub: "14.2 kW continuous", left: true },
];

/** 02 — the relay itself: approach, inspection, fly-past. */
export function SceneOrbital() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const base = {
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.9,
      } satisfies ScrollTrigger.Vars;

      // The satellite tumbles slowly towards the camera and past it.
      gsap
        .timeline({ scrollTrigger: base })
        .fromTo(
          ".sat",
          { scale: 0.34, rotate: -16, xPercent: 6, yPercent: 8 },
          { scale: 1.05, rotate: -4, xPercent: 0, yPercent: 0, ease: "none", duration: 1 },
        )
        .to(".sat", { scale: 1.9, rotate: 6, xPercent: -14, ease: "none", duration: 1 })
        .to(".sat", { scale: 3.4, rotate: 14, xPercent: -34, opacity: 0.15, ease: "none", duration: 0.8 });

      gsap.fromTo(
        ".orbital__mesh",
        { opacity: 0 },
        { opacity: 0.8, ease: "none", scrollTrigger: { ...base, end: "20% top" } },
      );

      // Callouts light up one at a time through the inspection pass.
      gsap.fromTo(
        ".hot",
        { opacity: 0, x: (i) => (HOTSPOTS[i]?.left ? 24 : -24) },
        {
          opacity: 1,
          x: 0,
          stagger: 0.16,
          ease: "power2.out",
          scrollTrigger: { ...base, start: "34% top", end: "62% top" },
        },
      );
      gsap.to(".hot", {
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...base, start: "78% top", end: "92% top" },
      });

      gsap.fromTo(
        ".orbital__type",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: { ...base, start: "4% top", end: "18% top" },
        },
      );
      gsap.to(".orbital__type", {
        opacity: 0,
        y: -30,
        ease: "none",
        scrollTrigger: { ...base, start: "70% top", end: "88% top" },
      });

      gsap.to(".begin-cue", {
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...base, end: "12% top" },
      });
    },
    { scope: root },
  );

  return (
    <section className="scene scene--orbital" ref={root} data-name="ORBITAL LAYER">
      <div className="stage">
        <Mesh />

        <div className="sat">
          <span className="sat__glint" aria-hidden="true" />
          <svg viewBox="0 0 900 420" aria-label="7MOBILE orbital relay">
            <defs>
              <linearGradient id="sm-panel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0b1b3a" />
                <stop offset=".5" stopColor="#1a3a70" />
                <stop offset="1" stopColor="#050b18" />
              </linearGradient>
              <linearGradient id="sm-metal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f4f6fa" />
                <stop offset=".42" stopColor="#98a1b0" />
                <stop offset=".56" stopColor="#d3d9e2" />
                <stop offset="1" stopColor="#575f6d" />
              </linearGradient>
              <linearGradient id="sm-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#efd095" />
                <stop offset="1" stopColor="#7b5f2b" />
              </linearGradient>
            </defs>

            {/* solar wings */}
            <g>
              <rect x="26" y="150" width="304" height="112" fill="url(#sm-panel)" stroke="#7d8aa5" />
              <g stroke="#5f7099" strokeWidth=".7" opacity=".9">
                <path d="M78 150v112M128 150v112M178 150v112M228 150v112M278 150v112M26 187h304M26 224h304" />
              </g>
            </g>
            <g>
              <rect x="570" y="150" width="304" height="112" fill="url(#sm-panel)" stroke="#7d8aa5" />
              <g stroke="#5f7099" strokeWidth=".7" opacity=".9">
                <path d="M622 150v112M672 150v112M722 150v112M772 150v112M822 150v112M570 187h304M570 224h304" />
              </g>
            </g>
            <path d="M330 206h50M520 206h50" stroke="#aab3c2" strokeWidth="3" />

            {/* bus */}
            <rect x="380" y="118" width="140" height="184" rx="6" fill="url(#sm-metal)" stroke="#e7ebf2" />
            <rect x="392" y="134" width="52" height="46" rx="3" fill="url(#sm-gold)" opacity=".92" />
            <rect x="392" y="190" width="52" height="46" rx="3" fill="url(#sm-gold)" opacity=".62" />
            <rect x="392" y="246" width="52" height="40" rx="3" fill="#2b3140" opacity=".85" />
            <circle cx="482" cy="166" r="26" fill="none" stroke="#f4f7fb" strokeWidth="1.4" opacity=".9" />
            <circle cx="482" cy="166" r="6" fill="#e3eaf4" />
            <rect x="462" y="212" width="42" height="74" rx="3" fill="#39404f" stroke="#98a2b3" strokeWidth=".8" />

            {/* dish + thrusters */}
            <ellipse cx="450" cy="92" rx="44" ry="16" fill="none" stroke="#e3e9f2" strokeWidth="1.6" />
            <path d="M450 92V64" stroke="#e3e9f2" strokeWidth="1.6" />
            <circle cx="450" cy="62" r="4" fill="#fff" />
            <circle cx="382" cy="302" r="9" fill="none" stroke="#c3cbd8" strokeWidth="1.4" />
            <circle cx="518" cy="302" r="9" fill="none" stroke="#c3cbd8" strokeWidth="1.4" />
          </svg>

        </div>

        {HOTSPOTS.map((h) => (
          <div
            key={h.title}
            className={`hot${h.left ? " hot--left" : ""}`}
            style={{ ["--x" as string]: h.x, ["--y" as string]: h.y }}
          >
            <i className="hot__dot" />
            <span className="hot__line" />
            <span className="hot__txt">
              <b>{h.title}</b>
              <em>{h.sub}</em>
            </span>
          </div>
        ))}

        <div className="orbital__type">
          <ScrambleText
            as="h2"
            className="heavy"
            text={"Orbital\nlayer"}
            trigger={root}
            start="4% top"
            duration={1}
          />
          <ScrambleText
            as="p"
            className="note"
            text={"+ A constellation of relays keeps every device\n   inside one continuous signal envelope."}
            trigger={root}
            start="6% top"
            duration={1.4}
          />
        </div>

        <span className="begin-cue" style={{ bottom: "8vh" }}>
          Scroll to inspect ↓
        </span>
      </div>
    </section>
  );
}
