"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LangSwitch } from "@/components/lang-switch";
import { SevenMark } from "@/components/seven-mark";
import { VARIANTS } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

/** The floating island header, shared by the gate and the shop. */
export function SiteNav({ floating = true }: { floating?: boolean }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    // Matches the breakpoint globals.css collapses the row at, so the sheet
    // is never left open behind a nav that has gone back to being inline.
    const desktop = window.matchMedia("(min-width: 901px)");
    const onViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onViewportChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onViewportChange);
    };
  }, [menuOpen]);

  // `tile` picks the picture each link carries when the row opens as tiles on
  // a phone; on the desktop row it does nothing.
  const nav = [
    { label: t.nav.phone, href: "/experience", tile: "phone" },
    { label: t.nav.buy, href: "/shop", tile: "buy" },
    // Service lives on the product page, so point at the headline article.
    { label: t.nav.service, href: `/shop/${VARIANTS[0].slug}#servis`, tile: "service" },
  ];

  return (
    <header
      ref={root}
      className={`island${floating ? " island--fixed" : ""}${menuOpen ? " island--open" : ""}`}
    >
      <LangSwitch />

      <Link href="/" className="island__mark" aria-label="7TECH">
        <SevenMark />
      </Link>

      <button
        type="button"
        className="island__menu"
        aria-label="Menu"
        aria-controls="site-navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>

      <nav
        id="site-navigation"
        className={`island__nav${menuOpen ? " is-open" : ""}`}
        aria-label="Primary"
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`island__tile island__tile--${item.tile}`}
            onClick={() => setMenuOpen(false)}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
