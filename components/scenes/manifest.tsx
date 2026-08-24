"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const METRICS = [
  { value: 99.99, decimals: 2, suffix: "%", label: "Uptime across the mesh" },
  { value: 412, decimals: 0, suffix: "", label: "Active orbital relays" },
  { value: 4.7, decimals: 1, suffix: " ms", label: "Median edge latency" },
  { value: 182, decimals: 0, suffix: " PB", label: "Carried daily" },
];

/** 07 — closing statement, live numbers and footer. */
export function SceneManifest() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".manifest span",
        { opacity: 0, y: 40, filter: "blur(12px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: 0.14,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".manifest", start: "top 78%" },
        },
      );

      // Counters roll up once the row is on screen.
      gsap.utils.toArray<HTMLElement>(".metrics b").forEach((el, i) => {
        const { value, decimals, suffix } = METRICS[i];
        const obj = { v: 0 };
        gsap.to(obj, {
          v: value,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: ".metrics", start: "top 82%" },
          onUpdate: () => {
            el.textContent = obj.v.toFixed(decimals) + suffix;
          },
        });
      });

      gsap.fromTo(
        ".cta, .foot",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".cta", start: "top 88%" },
        },
      );
    },
    { scope: root },
  );

  return (
    <section className="scene scene--manifest" ref={root} data-name="MANIFEST">
      <div className="stage stage--flow">
        <p className="manifest">
          <span>From orbital relay</span>
          <span>to the device in your hand,</span>
          <span>
            <b>7MOBILE</b> closes the loop between reach, latency and intent.
          </span>
        </p>

        <ul className="metrics">
          {METRICS.map((m) => (
            <li key={m.label}>
              <b>0</b>
              <em>{m.label}</em>
            </li>
          ))}
        </ul>

        <div className="cta">
          <h3>Request network access</h3>
          <a className="initiate" href="mailto:hello@7mobile.example">
            <span className="ticks" aria-hidden="true">
              <span /><span /><span /><span />
            </span>
            Open channel
          </a>
        </div>

        <footer className="foot">
          <div className="foot__row">
            <span>7MOBILE</span>
            <nav>
              <a href="#top">Top</a>
              <a href="#top">Coverage</a>
              <a href="#top">Network</a>
              <a href="#top">Careers</a>
            </nav>
            <span>Ground station · 41.31 N / 69.24 E</span>
          </div>
          <p className="foot__fine">
            © 2026 7MOBILE — concept build. Every visual on this page is
            generated in the browser.
          </p>
        </footer>
      </div>
    </section>
  );
}
