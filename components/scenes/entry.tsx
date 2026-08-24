"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ScrambleText } from "@/components/scramble-text";

/** 01 — the planet limb, seen from the top of the descent. */
export function SceneEntry() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scrub = {
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
      } satisfies ScrollTrigger.Vars;

      gsap.to(".planet", {
        yPercent: -22,
        scale: 1.22,
        ease: "none",
        scrollTrigger: scrub,
      });

      gsap.to(".entry__type", {
        yPercent: -60,
        opacity: 0,
        filter: "blur(14px)",
        ease: "none",
        scrollTrigger: { ...scrub, end: "60% top" },
      });

      gsap.to(".scroll-cue", {
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...scrub, end: "25% top" },
      });
    },
    { scope: root },
  );

  return (
    <section className="scene scene--entry" ref={root} data-name="ORBIT ENTRY">
      <div className="stage">
        <div className="planet" aria-hidden="true">
          <div className="planet__body" />
          <div className="planet__clouds" />
          <div className="planet__atmo" />
          <div className="planet__rim" />
        </div>

        <div className="entry__type">
          <ScrambleText
            as="p"
            className="kicker"
            text="// uplink established"
            trigger={root}
            start="top 90%"
            duration={0.7}
          />
          <ScrambleText
            as="h2"
            className="display"
            text={"Orbit\nentry"}
            trigger={root}
            start="top 88%"
            duration={1.1}
          />
          <ScrambleText
            as="p"
            className="lede"
            text={"Signal acquired at the edge of the atmosphere.\nEvery relay in the constellation reports nominal."}
            trigger={root}
            start="top 84%"
            duration={1.3}
          />
        </div>

        <div className="scroll-cue">
          <span>Scroll to begin</span>
          <i aria-hidden="true">↓</i>
        </div>
      </div>
    </section>
  );
}
