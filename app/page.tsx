import type { Metadata } from "next";
import { Gate } from "@/components/landing/gate";

export const metadata: Metadata = {
  title: "SABER — 7TECH CONNECT U7",
  description:
    "7TECH CONNECT U7 — 6.67 dyuymli AMOLED, 120 Hz, 108 MP kamera va MediaTek Dimensity 7400.",
};

export default function Page() {
  return <Gate />;
}
