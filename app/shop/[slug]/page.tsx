import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shop } from "@/components/shop/shop";
import { findVariant, money, VARIANTS } from "@/lib/catalog";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return VARIANTS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const v = findVariant((await params).slug);
  if (!v) return { title: "7TECH" };
  const name = `CONNECT U7 smartfoni, ${v.size}, ${v.colorWord}`;
  return {
    title: `7TECH — ${name}`,
    description: `${name} — ${money(v.price)} so'm. To'liq xususiyatlar, kafolat va Toshkent bo'ylab bepul yetkazib berish.`,
  };
}

export default async function Page({ params }: Params) {
  const v = findVariant((await params).slug);
  if (!v) notFound();
  return <Shop initialColor={v.color} initialStorage={v.storageId} />;
}
