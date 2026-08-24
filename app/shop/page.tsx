import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SABER — Sotib olish",
};

/** Placeholder for the commerce flow, built out separately. */
export default function Page() {
  return (
    <div className="soon">
      <p className="soon__kicker">7TECH · CONNECT U7</p>
      <h1>Do&apos;kon tayyorlanmoqda</h1>
      <p className="soon__note">
        Narxlar, ranglar va buyurtma sahifasi shu yerda bo&apos;ladi.
      </p>
      <Link href="/" className="soon__back">
        ← Bosh sahifa
      </Link>
    </div>
  );
}
