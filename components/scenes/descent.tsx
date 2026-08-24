"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ScrambleText } from "@/components/scramble-text";

const WORDS = ["From", "orbit", "to", "pocket"];

/** 03 — falling through the cloud deck. */
export function SceneDescent() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const base = {
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.7,
      } satisfies ScrollTrigger.Vars;

      gsap.fromTo(
        ".descent__sky",
        { yPercent: -14 },
        { yPercent: 6, ease: "none", scrollTrigger: base },
      );

      // Each cloud bank passes at its own rate, so the fall reads as depth.
      gsap.utils.toArray<HTMLElement>(".cloud").forEach((cloud, i) => {
        gsap.fromTo(
          cloud,
          { yPercent: 60 + i * 18, scale: 1 + i * 0.05 },
          {
            yPercent: -120 - i * 46,
            scale: 1.5 + i * 0.16,
            ease: "none",
            scrollTrigger: base,
          },
        );
      });

      gsap.fromTo(
        ".descent__flare",
        { opacity: 0.15, scale: 0.7 },
        { opacity: 0.85, scale: 1.5, ease: "none", scrollTrigger: base },
      );

      gsap.fromTo(
        ".kinetic span",
        { opacity: 0, yPercent: 110, rotateX: -60 },
        {
          opacity: 1,
          yPercent: 0,
          rotateX: 0,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { ...base, start: "8% top", end: "46% top" },
        },
      );
      gsap.to(".descent__type", {
        opacity: 0,
        yPercent: -24,
        ease: "none",
        scrollTrigger: { ...base, start: "76% top", end: "96% top" },
      });
    },
    { scope: root },
  );

  return (
    <section className="scene scene--descent" ref={root} data-name="DESCENT">
      <div className="stage">
        <div className="descent__sky" aria-hidden="true" />
        <div className="clouds" aria-hidden="true">
          <span className="cloud" />
          <span className="cloud" />
          <span className="cloud" />
          <span className="cloud" />
          <span className="cloud" />
        </div>
        <div className="descent__flare" aria-hidden="true" />

        <div className="descent__type">
          <h2 className="kinetic">
            {WORDS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </h2>
          <ScrambleText
            as="p"
            className="lede lede--ink"
            text={"Four hundred kilometres of vacuum, one handshake.\nThe link never notices the fall."}
            trigger={root}
            start="14% top"
            duration={1.2}
          />
        </div>
      </div>
    </section>
  );
}
