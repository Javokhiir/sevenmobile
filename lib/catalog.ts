/**
 * The sellable range, mirroring the 7TECH catalogue: one Connect U7 in two
 * colours and two storage tiers, so four articles in all. The catalogue page
 * lists one card per entry and the product page loads one entry by its slug —
 * both read from here so a price only ever has to be corrected in one place.
 */

export type ColorId = "white" | "black";
export type StorageId = "8-128" | "8-256";

/** Printed on the box and listed above the price on the official page. */
export const SERIES = "SILVER";

export const COLORS = [
  { id: "white", swatch: "#e9ebee" },
  { id: "black", swatch: "#16181c" },
] as const;

export const STORAGE: {
  id: StorageId;
  ram: string;
  rom: string;
  price: number;
  sku: Record<ColorId, string>;
}[] = [
  {
    id: "8-128",
    ram: "8 GB",
    rom: "128 GB",
    price: 3_388_000,
    sku: { black: "7TCMPU76G8512BS1", white: "7TCMPU76G8512WS1" },
  },
  {
    id: "8-256",
    ram: "8 GB",
    rom: "256 GB",
    price: 3_600_000,
    sku: { black: "7TCMPU76G8256BS1", white: "7TCMPU76G8256WS1" },
  },
];

export type Variant = {
  slug: string;
  sku: string;
  storageId: StorageId;
  color: ColorId;
  /** "8/256 GB" — the size as the listing writes it, both parts together. */
  size: string;
  /** "Black" / "White": the catalogue keeps these English in every language. */
  colorWord: string;
  price: number;
};

const byId = (id: StorageId) => STORAGE.find((s) => s.id === id)!;

const variant = (storageId: StorageId, color: ColorId): Variant => {
  const s = byId(storageId);
  const size = `${s.ram.replace(" GB", "")}/${s.rom.replace(" ", "")}`;
  const colorWord = color === "black" ? "Black" : "White";
  return {
    slug: `smartfon-connect-u7-${size.replace("/", "")
      .replace("GB", "")}-gb-${color}-${s.sku[color].toLowerCase()}`,
    sku: s.sku[color],
    storageId,
    color,
    size: `${size.replace("GB", " GB")}`,
    colorWord,
    price: s.price,
  };
};

/** Card order as the category page lists them. */
export const VARIANTS: Variant[] = [
  variant("8-256", "black"),
  variant("8-128", "black"),
  variant("8-128", "white"),
  variant("8-256", "white"),
];

export const findVariant = (slug: string) =>
  VARIANTS.find((v) => v.slug === slug);

/**
 * Grouped by hand rather than through toLocaleString: Node and the browser pick
 * different group separators for uz-UZ, which desynchronises the server HTML
 * from the client render and trips a hydration mismatch.
 */
export const money = (n: number) =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
