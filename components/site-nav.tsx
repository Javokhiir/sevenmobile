"use client";

import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { SevenMark } from "@/components/seven-mark";
import { VARIANTS } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

/** The floating island header, shared by the gate and the shop. */
export function SiteNav({ floating = true }: { floating?: boolean }) {
  const { t } = useI18n();

  const nav = [
    { label: t.nav.phone, href: "/experience" },
    { label: t.nav.buy, href: "/shop" },
    // Service lives on the product page, so point at the headline article.
    { label: t.nav.service, href: `/shop/${VARIANTS[0].slug}#servis` },
  ];

  return (
    <header className={`island${floating ? " island--fixed" : ""}`}>
      <LangSwitch />

      <Link href="/" className="island__mark" aria-label="7TECH">
        <SevenMark />
      </Link>

      <nav className="island__nav">
        {nav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
