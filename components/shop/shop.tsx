"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import {
  COLORS,
  type ColorId,
  money,
  SERIES,
  STORAGE,
  type StorageId,
} from "@/lib/catalog";
import { fill, useI18n } from "@/lib/i18n";
import { PhoneFigure } from "./phone-figure";

/** The official listing prints five rows and folds the rest behind a button. */
const SPEC_FOLD = 5;

/** Which article the visitor arrived on, from the catalogue link's slug. */
export function Shop({
  initialColor,
  initialStorage,
}: {
  initialColor: ColorId;
  initialStorage: StorageId;
}) {
  const { t } = useI18n();
  const [color, setColor] = useState<ColorId>(initialColor);
  const [storageId, setStorageId] = useState<StorageId>(initialStorage);
  const [qty, setQty] = useState(1);
  const [sent, setSent] = useState(false);
  const [allSpecs, setAllSpecs] = useState(false);

  const storage = useMemo(
    () => STORAGE.find((s) => s.id === storageId) ?? STORAGE[0],
    [storageId],
  );
  const total = storage.price * qty;
  const colorLabel = t.shop.colors[color];

  return (
    <div className="shop">
      <SiteNav />

      <main>
        {/* ---------- product ---------- */}
        <section className="shop__hero">
          <div className="shop__figure">
            <PhoneFigure tone={color} />
          </div>

          <div className="shop__buy">
            <p className="shop__kicker">{t.shop.kicker}</p>
            <h1 className="shop__title">Connect U7</h1>
            <dl className="shop__meta">
              <div>
                <dt>{t.shop.seriesLabel}</dt>
                <dd>{SERIES}</dd>
              </div>
              <div>
                <dt>{t.shop.modelLabel}</dt>
                <dd>{storage.sku[color]}</dd>
              </div>
            </dl>
            <p className="shop__lede">{t.shop.lede}</p>

            <p className="shop__price">
              {money(storage.price)} <em>{t.shop.currency}</em>
            </p>

            {/* colour */}
            <div className="opt">
              <span className="opt__label">
                {t.shop.colorLabel} <b>{colorLabel}</b>
              </span>
              <div className="opt__row">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`swatch${color === c.id ? " is-on" : ""}`}
                    style={{ background: c.swatch }}
                    aria-label={t.shop.colors[c.id]}
                    aria-pressed={color === c.id}
                    onClick={() => setColor(c.id)}
                  />
                ))}
              </div>
            </div>

            {/* storage */}
            <div className="opt">
              <span className="opt__label">{t.shop.storageLabel}</span>
              <div className="opt__row">
                {STORAGE.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip${storageId === s.id ? " is-on" : ""}`}
                    aria-pressed={storageId === s.id}
                    onClick={() => setStorageId(s.id)}
                  >
                    <b>
                      {s.ram} / {s.rom}
                    </b>
                    <em>
                      {money(s.price)} {t.shop.currency}
                    </em>
                  </button>
                ))}
              </div>
            </div>

            {/* quantity + total */}
            <div className="opt opt--row">
              <span className="opt__label">{t.shop.qtyLabel}</span>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label={t.shop.decrease}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  aria-label={t.shop.increase}
                >
                  +
                </button>
              </div>
              <span className="total">
                {t.shop.total}{" "}
                <b>
                  {money(total)} {t.shop.currency}
                </b>
              </span>
            </div>

            <div className="actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setSent(true)}
              >
                {t.shop.order}
                <i aria-hidden="true">→</i>
              </button>
              <Link href="/experience" className="btn btn--ghost">
                {t.shop.about}
                <i aria-hidden="true">↗</i>
              </Link>
            </div>

            {sent && (
              <p className="shop__sent" role="status">
                {fill(t.shop.sent, {
                  color: colorLabel,
                  ram: storage.ram,
                  rom: storage.rom,
                  qty,
                })}
              </p>
            )}

            <ul className="assure">
              {t.shop.assurances.map(([title, note]) => (
                <li key={title}>
                  <b>{title}</b>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- specs ---------- */}
        <section className="shop__specs" id="xususiyatlar">
          <h2 className="shop__h2">{t.shop.specsTitle}</h2>

          <dl className="specs">
            {(allSpecs ? t.shop.specs : t.shop.specs.slice(0, SPEC_FOLD)).map(
              ([label, value]) => (
                <div key={label} className="specs__row">
                  <dt>{label}</dt>
                  <dd>{fill(value, { rom: storage.rom, color: colorLabel })}</dd>
                </div>
              ),
            )}
          </dl>

          <button
            type="button"
            className="btn btn--ghost"
            aria-expanded={allSpecs}
            onClick={() => setAllSpecs((v) => !v)}
          >
            {allSpecs ? t.shop.specsLess : t.shop.specsMore}
            <i aria-hidden="true">{allSpecs ? "\u2191" : "\u2193"}</i>
          </button>
        </section>

        {/* ---------- service ---------- */}
        <section className="shop__service" id="servis">
          <h2 className="shop__h2">{t.shop.serviceTitle}</h2>
          <div className="service__grid">
            {t.shop.service.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>
      </main>

      <footer className="shop__foot" id="aloqa">
        <span>sevenmobile.uz</span>
      </footer>
    </div>
  );
}
