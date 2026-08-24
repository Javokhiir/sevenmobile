import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SABER — CONNECT U7",
};

/**
 * The interactive product experience: a PlayCanvas build served from
 * `public/experience`, mounted full-viewport. Reached from the landing screen's
 * "Telefon haqida" path.
 */
export default function Page() {
  return (
    <iframe
      src="/experience/index.html"
      title="SABER CONNECT U7"
      className="experience-frame"
      allow="autoplay; fullscreen; xr-spatial-tracking"
    />
  );
}
