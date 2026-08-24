"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SaberMark } from "./saber-mark";

const NAV = [
  { label: "Telefon", href: "/experience" },
  { label: "Sotib olish", href: "/shop" },
  { label: "Servis", href: "/shop" },
];

const MENU = [
  { label: "CONNECT U7", href: "/experience", note: "Mahsulot tajribasi" },
  { label: "Sotib olish", href: "/shop", note: "Narxlar va buyurtma" },
  { label: "Servis", href: "/shop", note: "Kafolat va ehtiyot qismlar" },
  { label: "Aloqa", href: "/shop", note: "sevenmobile.uz" },
];

const SPECS = [
  { value: "6.67", unit: "AMOLED", label: "Ekran" },
  { value: "120", unit: "Hz", label: "Yangilanish" },
  { value: "108", unit: "MP", label: "Kamera" },
  { value: "5000", unit: "mA", label: "Batareya" },
];

/**
 * The entry screen. It does not scroll: the visitor picks a path — the
 * interactive product experience, or the shop — and everything else lives
 * behind that choice.
 */
export function Gate() {
  const [menuOpen, setMenuOpen] = useState(false);

  // The gate owns the viewport while it is mounted.
  useEffect(() => {
    document.documentElement.classList.add("is-gate");
    return () => document.documentElement.classList.remove("is-gate");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

      {/* Floating island: menu on the left, mark in the middle, links right. */}
      <header className="island">
        <button
          type="button"
          className={`island__burger${menuOpen ? " is-open" : ""}`}
          aria-label="Menyu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <Link href="/" className="island__mark" aria-label="SABER">
          <SaberMark />
        </Link>

        <nav className="island__nav">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="gate__stage">
        <div className="hero">
          <p className="hero__kicker">7TECH · Yangi avlod</p>

          {/* Uppercase only — the brand face is a display cut and falls apart
              at lowercase, so sentences are set in mono instead. */}
          <h1 className="hero__title">
            <span>Connect</span>
            <span>U7</span>
          </h1>

          <p className="hero__lede">
            Kundalik foydalanish uchun tez, ishonchli va chidamli telefon.
            <br />
            Zamonaviy dizayn va kun bo&apos;yi yetadigan quvvat.
          </p>

          <div className="actions">
            <Link href="/shop" className="btn btn--primary">
              Sotib olish
              <i aria-hidden="true">→</i>
            </Link>
            <Link href="/experience" className="btn btn--ghost">
              Telefon haqida
              <i aria-hidden="true">↗</i>
            </Link>
          </div>
        </div>

        <ul className="readout">
          {SPECS.map((s) => (
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
        <span className="gate__foot-hint">7TECH · CONNECT U7</span>
      </footer>

      {/* Menu panel */}
      <div
        className={`sheet${menuOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        <nav>
          {MENU.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{ transitionDelay: `${0.05 + i * 0.06}s` }}
            >
              <span className="sheet__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="sheet__label">{item.label}</span>
              <span className="sheet__note">{item.note}</span>
            </Link>
          ))}
        </nav>
      </div>
      <button
        type="button"
        className={`sheet__scrim${menuOpen ? " is-open" : ""}`}
        aria-label="Menyuni yopish"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />
    </div>
  );
}
