"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ScrambleText } from "@/components/scramble-text";

/** World units for the hall. */
const FOCAL = 900;
const AISLE = 430; // half-width of the walkway
const RACK_D = 430; // depth of one cabinet
const RACK_H = 640;
const FLOOR_Y = 330;
const ROWS = 14;
/** Near clip: closer than this a panel fills the frame and stops reading as a
    cabinet, so the aisle is cut off well before the camera plane. */
const NEAR = 950;
/** Gap left between cabinets so each one keeps a visible vertical seam. */
const GAP = 45;
const END_Z = 400 + ROWS * RACK_D;

/**
 * The compute hall is drawn with explicit one-point perspective rather than CSS
 * 3D: every cabinet, floor line and light shaft is projected by hand, so the
 * aisle is guaranteed to line up at any viewport size.
 */
function Corridor({ progress }: { progress: { current: number } }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      const camZ = -900 + progress.current * (END_Z + 500);
      const vpX = w / 2;
      const vpY = h * 0.46;
      // Scale world units so the aisle roughly fills the viewport.
      const unit = Math.min(w, h * 1.7) / 1000;

      const project = (X: number, Y: number, Z: number) => {
        const depth = Z - camZ;
        const s = (FOCAL / depth) * unit;
        return { x: vpX + X * s, y: vpY + Y * s, s, depth };
      };

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // --- floor grid -------------------------------------------------
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= ROWS + 2; i++) {
        const z = 400 + i * RACK_D;
        if (z - camZ < NEAR) continue;
        const a = project(-AISLE * 2.4, FLOOR_Y, z);
        const b = project(AISLE * 2.4, FLOOR_Y, z);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const X of [-AISLE, -AISLE * 0.4, AISLE * 0.4, AISLE]) {
        const near = project(X, FLOOR_Y, Math.max(camZ + NEAR, 400));
        const far = project(X, FLOOR_Y, END_Z);
        ctx.beginPath();
        ctx.moveTo(near.x, near.y);
        ctx.lineTo(far.x, far.y);
        ctx.stroke();
      }

      // --- light shaft at the end of the aisle -------------------------
      const apex = project(0, -RACK_H * 0.9, END_Z);
      const baseL = project(-AISLE * 0.92, FLOOR_Y, END_Z);
      const baseR = project(AISLE * 0.92, FLOOR_Y, END_Z);
      const cone = ctx.createLinearGradient(0, apex.y, 0, baseL.y);
      cone.addColorStop(0, "rgba(246,224,168,0.85)");
      cone.addColorStop(1, "rgba(246,224,168,0.03)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(baseR.x, baseR.y);
      ctx.lineTo(baseL.x, baseL.y);
      ctx.closePath();
      ctx.fill();

      // the monolith standing inside the shaft
      const mTop = project(-60, -RACK_H * 0.42, END_Z);
      const mBot = project(60, FLOOR_Y, END_Z);
      const monolith = ctx.createLinearGradient(0, mTop.y, 0, mBot.y);
      monolith.addColorStop(0, "#2b2b31");
      monolith.addColorStop(0.16, "#101014");
      monolith.addColorStop(0.22, "#dcbf7c");
      monolith.addColorStop(0.8, "#c8a962");
      monolith.addColorStop(1, "#17171c");
      ctx.fillStyle = monolith;
      ctx.fillRect(mTop.x, mTop.y, mBot.x - mTop.x, mBot.y - mTop.y);

      // --- cabinets, far to near so nearer ones occlude --------------
      for (let i = ROWS - 1; i >= 0; i--) {
        const zNear = 400 + i * RACK_D;
        const zFar = zNear + RACK_D;
        if (zNear - camZ < NEAR) continue;

        for (const side of [-1, 1]) {
          const X = AISLE * side;
          const zA = zNear + GAP;
          const zB = zFar - GAP;
          const tn = project(X, -RACK_H / 2, zA);
          const bn = project(X, FLOOR_Y, zA);
          const tf = project(X, -RACK_H / 2, zB);
          const bf = project(X, FLOOR_Y, zB);

          const fade = Math.max(0, Math.min(1, 1 - (zNear - camZ) / (END_Z * 1.1)));
          ctx.fillStyle = `rgba(${14 + fade * 10},${14 + fade * 10},${18 + fade * 12},1)`;
          ctx.beginPath();
          ctx.moveTo(tn.x, tn.y);
          ctx.lineTo(tf.x, tf.y);
          ctx.lineTo(bf.x, bf.y);
          ctx.lineTo(bn.x, bn.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.stroke();

          // Bright seam down the leading edge of each cabinet.
          ctx.strokeStyle = `rgba(226,196,140,${0.35 * fade})`;
          ctx.beginPath();
          ctx.moveTo(tn.x, tn.y);
          ctx.lineTo(bn.x, bn.y);
          ctx.stroke();

          // LED banks: rows of warm slits confined to the middle of the face.
          const rows = 7;
          for (let r = 0; r < rows; r++) {
            const k = 0.26 + ((r + 0.5) / rows) * 0.56;
            const yTopN = tn.y + (bn.y - tn.y) * k;
            const yTopF = tf.y + (bf.y - tf.y) * k;
            const thickN = ((bn.y - tn.y) / rows) * 0.2;
            const thickF = ((bf.y - tf.y) / rows) * 0.2;
            const pulse =
              0.35 + 0.35 * Math.sin(t * 0.0015 + i * 1.7 + r * 0.9 + side);
            ctx.fillStyle = `rgba(232,190,110,${pulse * fade * 0.9})`;
            ctx.beginPath();
            ctx.moveTo(tn.x, yTopN);
            ctx.lineTo(tf.x, yTopF);
            ctx.lineTo(tf.x, yTopF + thickF);
            ctx.lineTo(tn.x, yTopN + thickN);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // --- dust motes drifting in the shaft ---------------------------
      ctx.fillStyle = "rgba(255,232,180,0.7)";
      for (let i = 0; i < 60; i++) {
        const z = 500 + ((i * 613) % (END_Z - 500));
        if (z - camZ < NEAR) continue;
        const X = ((i * 271) % (AISLE * 1.6)) - AISLE * 0.8;
        const Y =
          ((i * 397) % (RACK_H + FLOOR_Y)) -
          RACK_H / 2 +
          Math.sin(t * 0.0004 + i) * 26;
        const p = project(X, Y, z);
        ctx.globalAlpha = Math.min(1, p.s * 4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, p.s * 2.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [progress]);

  return <canvas ref={ref} className="core__canvas" aria-hidden="true" />;
}

/** 06 — the compute hall the whole network eventually resolves to. */
export function SceneCore() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useGSAP(
    () => {
      const base = {
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.9,
      } satisfies ScrollTrigger.Vars;

      ScrollTrigger.create({
        ...base,
        scrub: false,
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });

      gsap.fromTo(
        ".core__type",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: { ...base, start: "12% top", end: "34% top" },
        },
      );
      gsap.to(".core__type", {
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...base, start: "86% top", end: "99% top" },
      });
    },
    { scope: root },
  );

  return (
    <section className="scene scene--core" ref={root} data-name="COMPUTE CORE">
      <div className="stage">
        <Corridor progress={progress} />

        <div className="core__type">
          <h2 className="heavy">
            <ScrambleText text="// compute_core" trigger={root} start="10% top" duration={1} />
            <span className="caret">_</span>
          </h2>
          <p className="note">
            <ScrambleText
              text={"+ Massive compute turning raw throughput into\n   scalable, predictable network intelligence"}
              trigger={root}
              start="12% top"
              duration={1.6}
            />
            <span className="caret">_</span>
          </p>
        </div>
      </div>
    </section>
  );
}
