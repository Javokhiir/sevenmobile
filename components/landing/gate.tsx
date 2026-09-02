"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { useI18n } from "@/lib/i18n";

/**
 * The entry screen. It does not scroll: the visitor picks a path — the
 * interactive product experience, or the shop — and everything else lives
 * behind that choice.
 */
export function Gate() {
  const { t } = useI18n();

  // The gate owns the viewport while it is mounted.
  useEffect(() => {
    document.documentElement.classList.add("is-gate");
    return () => document.documentElement.classList.remove("is-gate");
  }, []);

  const specs = [
    { value: "6.67", unit: "AMOLED", label: t.gate.specs.screen },
    { value: "120", unit: "Hz", label: t.gate.specs.refresh },
    { value: "108", unit: "MP", label: t.gate.specs.camera },
    { value: "5000", unit: "mA", label: t.gate.specs.battery },
  ];

  return (
    <div className="gate">
      <video
        className="gate__video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        src="/bg.mp4"
      />
      <div className="gate__scrim" aria-hidden="true" />

      {/* Floating island: language on the left, mark in the middle, links right. */}
      <SiteNav floating={false} />

      <main className="gate__stage">
        <div className="hero">
          {/* Uppercase only — the brand face is a display cut and falls apart
              at lowercase, so sentences are set in the text face instead. */}
          <h1 className="hero__title">
            <span>Connect</span>
            <span>U7</span>
          </h1>

          <p className="hero__lede">
            {t.gate.lede[0]}
            <br />
            {t.gate.lede[1]}
          </p>

          <div className="actions">
            <Link href="/shop" className="btn btn--primary">
              {t.gate.buy}
              <i aria-hidden="true">→</i>
            </Link>
            <Link href="/experience" className="btn btn--ghost">
              {t.gate.about}
              <i aria-hidden="true">↗</i>
            </Link>
          </div>
        </div>

        <ul className="readout">
          {specs.map((s) => (
            <li key={s.label}>
              <b>
                {s.value}
                <em>{s.unit}</em>
              </b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </main>

      <footer className="gate__foot">
        <span>sevenmobile.uz</span>
      </footer>
    </div>
  );
}
