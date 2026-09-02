"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { money, VARIANTS, type Variant } from "@/lib/catalog";
import { fill, useI18n } from "@/lib/i18n";

/** Index into `t.catalog.sortOptions`; 0 keeps the catalogue's own order. */
type Sort = 0 | 1 | 2;

/** The shots a card cycles through, in the order the press kit numbers them. */
const VIEWS = ["front", "back", "flat-front", "flat-back"] as const;

/**
 * One listing card. The catalogue flips between a product's photos as the
 * pointer crosses the image — the strip of dots underneath reports which one
 * is showing — so the whole set is browsable without opening the product.
 */
function Card({ v }: { v: Variant }) {
  const { t } = useI18n();
  const [shot, setShot] = useState(0);
  const name = fill(t.catalog.name, { size: v.size, color: v.colorWord });

  return (
    <li className="card">
      <Link href={`/shop/${v.slug}`} className="card__link">
        <div
          className="card__shot"
          onMouseLeave={() => setShot(0)}
          onMouseMove={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            const i = Math.floor(((e.clientX - box.left) / box.width) * VIEWS.length);
            setShot(Math.min(VIEWS.length - 1, Math.max(0, i)));
          }}
        >
          {VIEWS.map((view, i) => (
            <Image
              key={view}
              src={`/product/u7-${v.color}-${view}.webp`}
              alt={i === 0 ? name : ""}
              fill
              sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 240px"
              className={`card__img${i === shot ? " is-on" : ""}`}
              aria-hidden={i !== shot}
            />
          ))}

          <span className="card__badge">{t.catalog.badgeNew}</span>

          <span className="card__dots" aria-hidden="true">
            {VIEWS.map((view, i) => (
              <i key={view} className={i === shot ? "is-on" : undefined} />
            ))}
          </span>
        </div>

        <div className="card__body">
          <div className="card__id">
            <span className="card__sku">{v.sku}</span>
            <h3 className="card__name">{name}</h3>
          </div>

          <div className="card__foot">
            <div>
              <p className="card__price">
                {money(v.price)} {t.shop.currency}
              </p>
              <p className="card__cta">{t.catalog.view}</p>
            </div>
            <span className="card__go" aria-hidden="true">
              →
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function Catalog() {
  const { t } = useI18n();
  const [sort, setSort] = useState<Sort>(0);

  const list = useMemo(() => {
    if (sort === 0) return VARIANTS;
    const by = sort === 1 ? 1 : -1;
    return [...VARIANTS].sort((a, b) => (a.price - b.price) * by);
  }, [sort]);

  return (
    <div className="shop">
      <SiteNav />

      <main>
        <section className="cat">
          {/* The shop sells one phone in four articles, so the listing needs
              no visible category heading — but the page still needs a heading
              for screen readers and search results. */}
          <h1 className="cat__title">{t.catalog.title}</h1>

          {/* The toolbar and the grid share one ruled frame, as on the
              catalogue it is modelled on. */}
          <div className="cat__bar">
            <label className="cat__sort">
              <span>{t.catalog.sortLabel}</span>
              <select
                value={sort}
                onChange={(e) => setSort(Number(e.target.value) as Sort)}
              >
                {t.catalog.sortOptions.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <p className="cat__count">
              {fill(t.catalog.count, { n: VARIANTS.length })}
            </p>
          </div>

          <ul className="cards">
            {list.map((v) => (
              <Card key={v.slug} v={v} />
            ))}
          </ul>
        </section>
      </main>

      <footer className="shop__foot" id="aloqa">
        <span>sevenmobile.uz</span>
      </footer>
    </div>
  );
}
