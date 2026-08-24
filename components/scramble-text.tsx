"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { scrambleTo, type ScrambleOptions } from "@/lib/scramble";

type Props = ScrambleOptions & {
  /** Source text. Newlines are honoured — the element keeps `pre-line`. */
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Element the reveal is timed against; defaults to this node. */
  trigger?: React.RefObject<HTMLElement | null>;
  start?: string;
};

/**
 * Renders text that decodes itself from noise when it scrolls into range, and
 * re-decodes whenever the visitor passes it again.
 */
export function ScrambleText({
  text,
  className,
  as: Tag = "span",
  trigger,
  start = "top 82%",
  ...options
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let stop: (() => void) | undefined;
    const run = () => {
      stop?.();
      stop = scrambleTo(el, text, options);
    };

    const st = ScrollTrigger.create({
      trigger: trigger?.current ?? el,
      start,
      onEnter: run,
      onEnterBack: run,
    });

    return () => {
      stop?.();
      st.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, start]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      style={{ whiteSpace: "pre-wrap" }}
    >
      {text}
    </Tag>
  );
}
