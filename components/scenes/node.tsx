"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ScrambleText } from "@/components/scramble-text";
import { fbm } from "@/lib/noise";

/**
 * Procedural terrain: an fBm heightfield shaded from its own gradient, so the
 * ground below the node is generated rather than photographed.
 */
function Terrain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 360;
    const H = 220;
    canvas.width = W;
    canvas.height = H;

    const height = fbm(20260824, 6);
    const img = ctx.createImageData(W, H);
    const sample = (x: number, y: number) => {
      const h = height(x / W / 1.6, y / H / 1.6);
      // Push the middle down so a basin forms where the node will sit.
      const dx = (x / W - 0.5) * 2;
      const dy = (y / H - 0.5) * 2;
      const basin = Math.min(1, Math.hypot(dx, dy) * 1.15);
      return h * 0.72 + basin * 0.28;
    };

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const h = sample(x, y);
        // Slope from central differences drives the light.
        const gx = sample(x + 1, y) - sample(x - 1, y);
        const gy = sample(x, y + 1) - sample(x, y - 1);
        const light = Math.max(0, 0.55 - gx * 5.5 - gy * 3.2);

        const shade = 0.1 + light * 1.15;
        const warm = 0.34 + h * 0.62;
        const i = (y * W + x) * 4;
        img.data[i] = Math.min(255, 232 * shade * warm + 26);
        img.data[i + 1] = Math.min(255, 186 * shade * warm + 22);
        img.data[i + 2] = Math.min(255, 132 * shade * warm + 20);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  return (
    <div className="node__terrain" aria-hidden="true">
      <canvas
        ref={ref}
        style={{ width: "100%", height: "100%", filter: "blur(0.4px) contrast(1.05)" }}
      />
    </div>
  );
}

/** 04 — the regional edge node, seen from just above the cloud base. */
export function SceneNode() {
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
        ".node__terrain",
        { scale: 1.5, yPercent: -6, opacity: 0.35 },
        { scale: 1.06, yPercent: 4, opacity: 1, ease: "none", scrollTrigger: base },
      );

      gsap.fromTo(
        ".node",
        { scale: 0.42, yPercent: -20, opacity: 0 },
        {
          scale: 1,
          yPercent: 0,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: { ...base, end: "55% top" },
        },
      );
      gsap.to(".node", {
        scale: 2.4,
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...base, start: "72% top" },
      });

      gsap.fromTo(
        ".node__beams span",
        { scaleY: 0, opacity: 0 },
        {
          scaleY: (i) => [0.72, 0.9, 1, 0.86, 0.66][i],
          opacity: 1,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { ...base, start: "14% top", end: "50% top" },
        },
      );

      gsap.fromTo(
        ".node__type",
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          ease: "power2.out",
          scrollTrigger: { ...base, start: "20% top", end: "42% top" },
        },
      );
      gsap.to(".node__type", {
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...base, start: "76% top", end: "92% top" },
      });
    },
    { scope: root },
  );

  return (
    <section className="scene scene--node" ref={root} data-name="PRIMARY NODE">
      <div className="stage">
        <Terrain />
        <div className="node__haze" aria-hidden="true" />

        <div className="node">
          <div className="node__beams" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <span className="node__flare" aria-hidden="true" />
          <svg className="node__badge" viewBox="0 0 200 200" aria-label="Primary node">
            <rect
              x="34"
              y="34"
              width="132"
              height="132"
              rx="14"
              transform="rotate(45 100 100)"
              fill="#e9eaec"
              stroke="#b6bac2"
              strokeWidth="2"
            />
            {/* circuit traces */}
            <g stroke="#0d0f13" strokeWidth="3" fill="none" opacity=".35">
              <path d="M56 84h20v-16M144 84h-20v-16M56 116h20v16M144 116h-20v16" />
            </g>
            {/* the mark itself */}
            <g stroke="#0d0f13" strokeWidth="13" fill="none" strokeLinecap="square">
              <path d="M74 72h52l-26 60" />
            </g>
            <circle cx="100" cy="146" r="8" fill="#0d0f13" />
          </svg>
        </div>

        <div className="node__type">
          <ScrambleText
            as="h2"
            className="heavy heavy--ink"
            text={"Primary\nnode"}
            trigger={root}
            start="18% top"
            duration={1}
          />
          <ScrambleText
            as="p"
            className="note note--ink"
            text={
              "+ Regional edge that absorbs traffic, holds latency\n" +
              "   under five milliseconds and keeps sessions alive\n" +
              "   when the backbone blinks."
            }
            trigger={root}
            start="20% top"
            duration={1.5}
          />
        </div>
      </div>
    </section>
  );
}
