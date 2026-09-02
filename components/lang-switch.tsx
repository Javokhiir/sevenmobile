"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, useI18n } from "@/lib/i18n";

/**
 * Sits where the burger used to: a globe that opens a short list of the three
 * languages. The popover closes on Escape, on an outside click and on choice.
 */
export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const current = LANGS.find((l) => l.id === lang) ?? LANGS[0];

  return (
    <div className="lang" ref={root}>
      <button
        type="button"
        className={`lang__btn${open ? " is-open" : ""}`}
        aria-label={t.langSwitch}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
        </svg>
        <span className="lang__short">{current.short}</span>
      </button>

      <div className={`lang__menu${open ? " is-open" : ""}`} role="menu">
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="menuitemradio"
            aria-checked={l.id === lang}
            className={`lang__item${l.id === lang ? " is-on" : ""}`}
            onClick={() => {
              setLang(l.id);
              setOpen(false);
            }}
          >
            <span className="lang__code">{l.short}</span>
            <span className="lang__name">{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
