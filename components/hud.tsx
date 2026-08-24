"use client";

import { useEffect, useRef } from "react";
import { useExperience } from "@/lib/experience";
import { corrupt } from "@/lib/scramble";

const SCENES = 7;

/**
 * Persistent chrome: wordmark, audio toggle and live telemetry that reads the
 * page's scroll position as an altitude readout.
 */
export function Hud() {
  const { audio, toggleAudio, started } = useExperience();
  const mark = useRef<HTMLSpanElement>(null);
  const alt = useRef<HTMLSpanElement>(null);
  const sig = useRef<HTMLSpanElement>(null);
  const idx = useRef<HTMLSpanElement>(null);

  // The wordmark drops a character now and then, like a feed losing sync.
  useEffect(() => {
    let timer = 0;
    let clear: (() => void) | undefined;
    const tick = () => {
      if (mark.current) clear = corrupt(mark.current, "7MOBILE", 70 + Math.random() * 90);
      timer = window.setTimeout(tick, 3200 + Math.random() * 6000);
    };
    timer = window.setTimeout(tick, 2600);
    return () => {
      window.clearTimeout(timer);
      clear?.();
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? window.scrollY / max : 0;

      // 420 km at the top of the page down to ground level at the end.
      const km = 420 * (1 - p);
      if (alt.current) {
        alt.current.textContent = `ALT ${km.toFixed(km < 10 ? 2 : 1).padStart(6, "0")} KM`;
      }
      if (sig.current) {
        const bars = 1 + Math.round(p * 4);
        sig.current.textContent = `SIG ${"▮".repeat(bars)}${"▯".repeat(5 - bars)}`;
      }
      if (idx.current) {
        const n = Math.min(SCENES, Math.floor(p * SCENES) + 1);
        idx.current.textContent = `${String(n).padStart(2, "0")} / ${String(SCENES).padStart(2, "0")}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <header className="hud" style={{ opacity: started ? 1 : 0, transition: "opacity 1.2s ease 0.4s" }}>
        <a className="wordmark" href="#top">
          <span ref={mark}>7MOBILE</span>
        </a>
        <button
          type="button"
          className="audio"
          data-on={audio}
          aria-pressed={audio}
          onClick={toggleAudio}
        >
          <span className="eq" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <span>AUDIO</span>
        </button>
      </header>

      <div className="telemetry telemetry--bl" style={{ opacity: started ? 1 : 0, transition: "opacity 1.2s ease 0.6s" }}>
        <span ref={alt}>ALT 420.0 KM</span>
        <span ref={sig}>SIG ▮▯▯▯▯</span>
      </div>
      <div className="telemetry telemetry--br" style={{ opacity: started ? 1 : 0, transition: "opacity 1.2s ease 0.6s" }}>
        <span ref={idx}>01 / 07</span>
      </div>
    </>
  );
}
