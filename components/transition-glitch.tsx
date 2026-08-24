"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Signal-loss flash between scenes: RGB split bars and a short noise burst, the
 * same beat the reference uses whenever the camera cuts to a new environment.
 */
export function TransitionGlitch() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;

    let timer = 0;
    const fire = () => {
      el.classList.remove("glitch--on");
      // Force a reflow so the animation restarts on back-to-back triggers.
      void el.offsetWidth;
      el.classList.add("glitch--on");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => el.classList.remove("glitch--on"), 620);
    };

    const triggers = [...document.querySelectorAll<HTMLElement>(".scene")].map(
      (scene) =>
        ScrollTrigger.create({
          trigger: scene,
          start: "top 60%",
          onEnter: fire,
          onEnterBack: fire,
        }),
    );

    return () => {
      window.clearTimeout(timer);
      triggers.forEach((t) => t.kill());
    };
  }, [mounted]);

  return (
    <div className="glitch" ref={ref} aria-hidden="true">
      <span className="glitch__r" />
      <span className="glitch__c" />
      <span className="glitch__scan" />
    </div>
  );
}
