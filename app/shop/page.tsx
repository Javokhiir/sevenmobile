import type { Metadata } from "next";
import { Catalog } from "@/components/shop/catalog";

export const metadata: Metadata = {
  title: "7TECH — Smartfonlar",
  description:
    "CONNECT U7 smartfoni: 8/128 GB va 8/256 GB, qora va oq ranglar. Toshkent bo'ylab bepul yetkazib berish.",
};

export default function Page() {
  return <Catalog />;
}
