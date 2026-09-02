"use client";

import Image from "next/image";
import { useState } from "react";
import { fill, useI18n } from "@/lib/i18n";

/**
 * Product figure — the real product photography, trimmed out of the press
 * shots. Every frame of both colourways is mounted and cross-faded so changing
 * colour or view never flashes a gap while the next image decodes.
 *
 * The thumbnail rail previews on hover and pins on click: `pinned` is the
 * committed choice, `peek` the transient hover, and the stage shows whichever
 * is more recent. The two colourways share the same shot order, so the pinned
 * view survives a colour switch.
 */
const VIEWS = [
  { id: "front", key: "front" },
  { id: "back", key: "back" },
  { id: "flat-front", key: "flatFront" },
  { id: "flat-back", key: "flatBack" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const TONES = {
  white: { file: "u7-white" },
  black: { file: "u7-black" },
} as const;

type Tone = keyof typeof TONES;

/** Intrinsic sizes of the trimmed webp exports. */
const SIZE: Record<View, { w: number; h: number }> = {
  front: { w: 475, h: 1400 },
  back: { w: 656, h: 1400 },
  "flat-front": { w: 1400, h: 1307 },
  "flat-back": { w: 1400, h: 1311 },
};

export function PhoneFigure({ tone }: { tone: Tone }) {
  const { t } = useI18n();
  const [pinned, setPinned] = useState<View>("front");
  const [peek, setPeek] = useState<View | null>(null);
  const shown = peek ?? pinned;

  return (
    <div className="figure">
      <div className="figure__rail" role="group" aria-label={t.figure.rail}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`figure__thumb${pinned === v.id ? " is-on" : ""}`}
            aria-pressed={pinned === v.id}
            onMouseEnter={() => setPeek(v.id)}
            onMouseLeave={() => setPeek((p) => (p === v.id ? null : p))}
            onFocus={() => setPeek(v.id)}
            onBlur={() => setPeek((p) => (p === v.id ? null : p))}
            onClick={() => setPinned(v.id)}
          >
            <Image
              src={`/product/${TONES[tone].file}-${v.id}.webp`}
              width={SIZE[v.id].w}
              height={SIZE[v.id].h}
              alt={t.figure.views[v.key]}
              sizes="80px"
            />
          </button>
        ))}
      </div>

      <div className="figure__stage">
        <span className="figure__stage-glow" aria-hidden="true" />
        {(Object.keys(TONES) as Tone[]).map((toneId) =>
          VIEWS.map((v) => {
            const on = toneId === tone && v.id === shown;
            return (
              <Image
                key={`${toneId}-${v.id}`}
                src={`/product/${TONES[toneId].file}-${v.id}.webp`}
                width={SIZE[v.id].w}
                height={SIZE[v.id].h}
                alt={fill(t.figure.alt, {
                  tone: t.shop.colors[toneId].toLowerCase(),
                  view: t.figure.views[v.key].toLowerCase(),
                })}
                priority={toneId === "white" && v.id === "front"}
                sizes="(max-width: 900px) 80vw, 420px"
                className={`figure__shot${on ? " is-on" : ""}`}
                aria-hidden={!on}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
