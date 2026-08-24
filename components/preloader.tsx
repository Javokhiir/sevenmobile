"use client";

import { useEffect, useRef, useState } from "react";
import { useExperience } from "@/lib/experience";

/** One digit column that rolls to its target value. */
function Roll({ value }: { value: number }) {
  return (
    <span className="roll">
      <span
        className="roll__strip"
        style={{ transform: `translateY(${-value * 1.25}em)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </span>
    </span>
  );
}

export function Preloader() {
  const { start } = useExperience();
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const exitTimer = useRef<number | null>(null);

  // Boot sequence: an eased count to 100 that fakes an asset load. Driven off
  // absolute timestamps so a backgrounded tab resumes at the right value
  // instead of freezing mid-count.
  useEffect(() => {
    const startedAt = performance.now();
    const DURATION = 3100;
    let raf = 0;

    const step = () => {
      const t = Math.min(1, (performance.now() - startedAt) / DURATION);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      setPct(Math.round(eased * 100));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setReady(true);
      }
    };

    raf = requestAnimationFrame(step);
    const resync = () => {
      if (document.visibilityState === "visible") {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", resync);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", resync);
    };
  }, []);

  useEffect(
    () => () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    },
    [],
  );

  // The gate has to open no matter what, so the exit is a plain CSS transition
  // with a timer behind it rather than an animation callback.
  const handleStart = () => {
    start();
    setLeaving(true);
    exitTimer.current = window.setTimeout(() => setGone(true), 1200);
  };

  if (gone) return null;

  const digits = String(pct).padStart(3, "0").split("").map(Number);

  return (
    <div className={`loader${leaving ? " is-leaving" : ""}`}>
      <div className="loader__inner">
        <div className={`counter${ready ? " is-done" : ""}`} aria-hidden="true">
          <span className="counter__digits">
            {digits.map((d, i) => (
              <Roll key={i} value={d} />
            ))}
          </span>
          <span className="counter__pct">%</span>
        </div>

        <div className={`loader__intro${ready ? " is-ready" : ""}`}>
          <h1 className="loader__brand">7MOBILE</h1>
          <p className="display" style={{ margin: 0 }}>
            Networks beyond
            <br />
            the horizon
          </p>
          <p className="lede loader__sub">
            Connectivity orchestrated from low orbit to the last street.
          </p>
          <button
            type="button"
            className="initiate"
            onClick={handleStart}
            disabled={!ready}
          >
            <span className="ticks" aria-hidden="true">
              <span /><span /><span /><span />
            </span>
            Initiate system
          </button>
          <div className="headphones">
            <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
              <path
                d="M8 28v-6a16 16 0 0 1 32 0v6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <rect x="3" y="27" width="9" height="14" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <rect x="36" y="27" width="9" height="14" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>Experience with headphones</span>
          </div>
        </div>
      </div>
    </div>
  );
}
