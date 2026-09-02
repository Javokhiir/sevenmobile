"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const LANGS = [
  { id: "uz", label: "O'zbekcha", short: "UZ" },
  { id: "ru", label: "Русский", short: "RU" },
  { id: "en", label: "English", short: "EN" },
] as const;

export type Lang = (typeof LANGS)[number]["id"];

const STORE_KEY = "sevenmobile.lang";

/** Every string the site renders, in one shape per language. */
export type Dict = {
  nav: { phone: string; buy: string; service: string; contact: string };
  catalog: {
    title: string;
    /** {n} is substituted with the number of articles listed. */
    count: string;
    sortLabel: string;
    /** Catalogue order, then cheapest first, then dearest first. */
    sortOptions: [string, string, string];
    badgeNew: string;
    view: string;
    /** {size} and {color} are substituted per card. */
    name: string;
  };
  gate: {
    lede: [string, string];
    buy: string;
    about: string;
    specs: { screen: string; refresh: string; camera: string; battery: string };
  };
  shop: {
    kicker: string;
    lede: string;
    currency: string;
    colorLabel: string;
    colors: { white: string; black: string };
    seriesLabel: string;
    modelLabel: string;
    storageLabel: string;
    qtyLabel: string;
    decrease: string;
    increase: string;
    total: string;
    order: string;
    about: string;
    /** {color}, {ram}, {rom} and {qty} are substituted at render time. */
    sent: string;
    assurances: [string, string][];
    specsTitle: string;
    /** Flat label/value rows, in the order the official listing prints them.
     *  {rom} and {color} are substituted from the current selection. */
    specs: [string, string][];
    specsMore: string;
    specsLess: string;
    serviceTitle: string;
    service: [string, string, string];
  };
  figure: {
    rail: string;
    views: { front: string; back: string; flatFront: string; flatBack: string };
    /** {tone} and {view} are substituted at render time. */
    alt: string;
  };
  langSwitch: string;
};

const uz: Dict = {
  nav: { phone: "Telefon", buy: "Sotib olish", service: "Servis", contact: "Aloqa" },
  catalog: {
    title: "Smartfonlar",
    count: "{n} ta mahsulot",
    sortLabel: "Saralash",
    sortOptions: ["Tartiblashsiz", "Avval arzoni", "Avval qimmati"],
    badgeNew: "Yangi",
    view: "Batafsil",
    name: "CONNECT U7 smartfoni, {size}, {color}",
  },
  gate: {
    lede: [
      "Kundalik foydalanish uchun tez, ishonchli va chidamli telefon.",
      "Zamonaviy dizayn va kun bo'yi yetadigan quvvat.",
    ],
    buy: "Sotib olish",
    about: "Telefon haqida",
    specs: {
      screen: "Ekran",
      refresh: "Yangilanish",
      camera: "Kamera",
      battery: "Batareya",
    },
  },
  shop: {
    kicker: "7TECH \u00b7 Rasmiy sotuvchi",
    lede: "Kundalik foydalanish uchun tez, ishonchli va chidamli telefon.",
    currency: "so'm",
    colorLabel: "Rang",
    colors: { white: "Oq", black: "Qora" },
    seriesLabel: "Seriya",
    modelLabel: "Model",
    storageLabel: "Xotira",
    qtyLabel: "Soni",
    decrease: "Kamaytirish",
    increase: "Ko'paytirish",
    total: "Jami",
    order: "Savatga qo'shish",
    about: "Telefon haqida",
    sent:
      "Buyurtma qabul qilindi: {color}, {ram}/{rom}, {qty} dona. Operator siz bilan bog'lanadi.",
    assurances: [
      ["Yetkazib berish", "Toshkent bo'ylab bepul yetkazib berish"],
      ["Kafolat", "Rasmiy kafolat shartlari asosida"],
      ["To'lov", "Naqd, karta yoki muddatli to'lov"],
    ],
    specsTitle: "Xususiyatlar",
    specs: [
      ["Protsessor", "MediaTek Dimensity 7400"],
      ["Operativ xotira", "8GB (+8GB RAM kengaytirish)"],
      ["Ichki xotira", "{rom}"],
      [
        "Displey",
        "6,67\u2033 / In-Cell / AMOLED / FHD+ / markaziy kamera tirqishi / egiluvchan displey / 120 Gts yangilanish chastotasi",
      ],
      ["Old kamera", "50MP"],
      ["Asosiy kamera", "108MP"],
      ["Qo\u2018shimcha kamera 1", "2MP"],
      ["Qo\u2018shimcha kamera 2", "2MP"],
      ["Akkumulyator", "5000mAh"],
      ["Quvvat olish tezligi", "33W"],
      ["Tarmoq", "2G/3G/4G/LTE/5G"],
      ["SIM-karta sloti", "Ikki nano-sim"],
      ["Xotira kartasi uchun slot", "MicroSD Flesh karta"],
      ["Simsiz ulanishlar", "Wi-Fi, Bluetooth"],
      ["Rangi", "{color}"],
      ["Quvvat kabeli", "Matoli Type-C/Type-C"],
      ["Himoya g\u2018ilofi", "Silikonli"],
      ["Himoya oynasi", "To'plamda"],
      ["SIM-kartani chiqarish vositasi", "To'plamda"],
      ["Quvvatlash porti", "Type-C"],
    ],
    specsMore: "Barcha xususiyatlar",
    specsLess: "Kamroq ko'rsatish",
    serviceTitle: "Servis",
    service: [
      "7TECH Connect U7 uchun servis xizmatimiz faol ishlaydi. Telefon bilan bog'liq har qanday muammo imkon qadar tezkorlik bilan hal qilinadi.",
      "Telefonning yoqilishida muammo yuzaga kelsa, belgilangan shartlar asosida yangisiga almashtirib beriladi.",
      "Servisimizda displey va boshqa barcha kerakli ehtiyot qismlar mavjud.",
    ],
  },
  figure: {
    rail: "Rasm ko'rinishi",
    views: { front: "Old", back: "Orqa", flatFront: "Ekran", flatBack: "Korpus" },
    alt: "CONNECT U7 — {tone}, {view} ko'rinish",
  },
  langSwitch: "Tilni tanlash",
};

const ru: Dict = {
  nav: { phone: "Телефон", buy: "Купить", service: "Сервис", contact: "Контакты" },
  catalog: {
    title: "\u0421\u043c\u0430\u0440\u0442\u0444\u043e\u043d\u044b",
    count: "{n} \u0442\u043e\u0432\u0430\u0440\u0430",
    sortLabel: "\u0421\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0430",
    sortOptions: [
      "\u0411\u0435\u0437 \u0441\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0438",
      "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0434\u0435\u0448\u0451\u0432\u044b\u0435",
      "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0434\u043e\u0440\u043e\u0433\u0438\u0435",
    ],
    badgeNew: "\u041d\u043e\u0432\u0438\u043d\u043a\u0430",
    view: "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435",
    name: "\u0421\u043c\u0430\u0440\u0442\u0444\u043e\u043d CONNECT U7, {size}, {color}",
  },
  gate: {
    lede: [
      "Быстрый, надёжный и прочный смартфон на каждый день.",
      "Современный дизайн и заряд на весь день.",
    ],
    buy: "Купить",
    about: "О телефоне",
    specs: {
      screen: "Экран",
      refresh: "Частота",
      camera: "Камера",
      battery: "Батарея",
    },
  },
  shop: {
    kicker: "7TECH \u00b7 \u041e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u0440\u043e\u0434\u0430\u0432\u0435\u0446",
    lede: "\u0411\u044b\u0441\u0442\u0440\u044b\u0439, \u043d\u0430\u0434\u0451\u0436\u043d\u044b\u0439 \u0438 \u043f\u0440\u043e\u0447\u043d\u044b\u0439 \u0441\u043c\u0430\u0440\u0442\u0444\u043e\u043d \u043d\u0430 \u043a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c.",
    currency: "\u0441\u0443\u043c",
    colorLabel: "\u0426\u0432\u0435\u0442",
    colors: { white: "\u0411\u0435\u043b\u044b\u0439", black: "\u0427\u0451\u0440\u043d\u044b\u0439" },
    seriesLabel: "\u0421\u0435\u0440\u0438\u044f",
    modelLabel: "\u041c\u043e\u0434\u0435\u043b\u044c",
    storageLabel: "\u041f\u0430\u043c\u044f\u0442\u044c",
    qtyLabel: "\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e",
    decrease: "\u0423\u043c\u0435\u043d\u044c\u0448\u0438\u0442\u044c",
    increase: "\u0423\u0432\u0435\u043b\u0438\u0447\u0438\u0442\u044c",
    total: "\u0418\u0442\u043e\u0433\u043e",
    order: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u043a\u043e\u0440\u0437\u0438\u043d\u0443",
    about: "\u041e \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0435",
    sent:
      "\u0417\u0430\u043a\u0430\u0437 \u043f\u0440\u0438\u043d\u044f\u0442: {color}, {ram}/{rom}, {qty} \u0448\u0442. \u041e\u043f\u0435\u0440\u0430\u0442\u043e\u0440 \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0441 \u0432\u0430\u043c\u0438.",
    assurances: [
      ["\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430", "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u043f\u043e \u0422\u0430\u0448\u043a\u0435\u043d\u0442\u0443"],
      ["\u0413\u0430\u0440\u0430\u043d\u0442\u0438\u044f", "\u041d\u0430 \u0443\u0441\u043b\u043e\u0432\u0438\u044f\u0445 \u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0439 \u0433\u0430\u0440\u0430\u043d\u0442\u0438\u0438"],
      ["\u041e\u043f\u043b\u0430\u0442\u0430", "\u041d\u0430\u043b\u0438\u0447\u043d\u044b\u0435, \u043a\u0430\u0440\u0442\u0430 \u0438\u043b\u0438 \u0440\u0430\u0441\u0441\u0440\u043e\u0447\u043a\u0430"],
    ],
    specsTitle: "\u0425\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438",
    specs: [
      ["\u041f\u0440\u043e\u0446\u0435\u0441\u0441\u043e\u0440", "MediaTek Dimensity 7400"],
      ["\u041e\u043f\u0435\u0440\u0430\u0442\u0438\u0432\u043d\u0430\u044f \u043f\u0430\u043c\u044f\u0442\u044c", "8GB (+8GB RAM \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u0435)"],
      ["\u0412\u0441\u0442\u0440\u043e\u0435\u043d\u043d\u0430\u044f \u043f\u0430\u043c\u044f\u0442\u044c", "{rom}"],
      [
        "\u0414\u0438\u0441\u043f\u043b\u0435\u0439",
        "6,67\u2033 / In-Cell / AMOLED / FHD+ / \u0446\u0435\u043d\u0442\u0440\u0430\u043b\u044c\u043d\u044b\u0439 \u0432\u044b\u0440\u0435\u0437 \u043a\u0430\u043c\u0435\u0440\u044b / \u0433\u0438\u0431\u043a\u0438\u0439 \u0434\u0438\u0441\u043f\u043b\u0435\u0439 / \u0447\u0430\u0441\u0442\u043e\u0442\u0430 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f 120 \u0413\u0446",
      ],
      ["\u0424\u0440\u043e\u043d\u0442\u0430\u043b\u044c\u043d\u0430\u044f \u043a\u0430\u043c\u0435\u0440\u0430", "50MP"],
      ["\u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u043a\u0430\u043c\u0435\u0440\u0430", "108MP"],
      ["\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u043a\u0430\u043c\u0435\u0440\u0430 1", "2MP"],
      ["\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u043a\u0430\u043c\u0435\u0440\u0430 2", "2MP"],
      ["\u0410\u043a\u043a\u0443\u043c\u0443\u043b\u044f\u0442\u043e\u0440", "5000mAh"],
      ["\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c \u0437\u0430\u0440\u044f\u0434\u043a\u0438", "33W"],
      ["\u0421\u0435\u0442\u044c", "2G/3G/4G/LTE/5G"],
      ["\u0421\u043b\u043e\u0442 SIM-\u043a\u0430\u0440\u0442\u044b", "\u0414\u0432\u0435 nano-sim"],
      ["\u0421\u043b\u043e\u0442 \u0434\u043b\u044f \u043a\u0430\u0440\u0442\u044b \u043f\u0430\u043c\u044f\u0442\u0438", "MicroSD"],
      ["\u0411\u0435\u0441\u043f\u0440\u043e\u0432\u043e\u0434\u043d\u044b\u0435 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f", "Wi-Fi, Bluetooth"],
      ["\u0426\u0432\u0435\u0442", "{color}"],
      ["\u041a\u0430\u0431\u0435\u043b\u044c \u043f\u0438\u0442\u0430\u043d\u0438\u044f", "\u0422\u043a\u0430\u043d\u0435\u0432\u044b\u0439 Type-C/Type-C"],
      ["\u0417\u0430\u0449\u0438\u0442\u043d\u044b\u0439 \u0447\u0435\u0445\u043e\u043b", "\u0421\u0438\u043b\u0438\u043a\u043e\u043d\u043e\u0432\u044b\u0439"],
      ["\u0417\u0430\u0449\u0438\u0442\u043d\u043e\u0435 \u0441\u0442\u0435\u043a\u043b\u043e", "\u0412 \u043a\u043e\u043c\u043f\u043b\u0435\u043a\u0442\u0435"],
      ["\u0421\u043a\u0440\u0435\u043f\u043a\u0430 \u0434\u043b\u044f SIM-\u043a\u0430\u0440\u0442\u044b", "\u0412 \u043a\u043e\u043c\u043f\u043b\u0435\u043a\u0442\u0435"],
      ["\u041f\u043e\u0440\u0442 \u0437\u0430\u0440\u044f\u0434\u043a\u0438", "Type-C"],
    ],
    specsMore: "\u0412\u0441\u0435 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438",
    specsLess: "\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043c\u0435\u043d\u044c\u0448\u0435",
    serviceTitle: "\u0421\u0435\u0440\u0432\u0438\u0441",
    service: [
      "Сервисная служба для 7TECH Connect U7 работает постоянно. Любая проблема с телефоном решается в кратчайшие сроки.",
      "Если телефон не включается, он заменяется на новый на оговорённых условиях.",
      "В нашем сервисе есть дисплеи и все необходимые запасные части.",
    ],
  },
  figure: {
    rail: "Вид изображения",
    views: { front: "Спереди", back: "Сзади", flatFront: "Экран", flatBack: "Корпус" },
    alt: "CONNECT U7 — {tone}, вид {view}",
  },
  langSwitch: "Выбор языка",
};

const en: Dict = {
  nav: { phone: "Phone", buy: "Buy", service: "Service", contact: "Contact" },
  catalog: {
    title: "Smartphones",
    count: "{n} products",
    sortLabel: "Sort",
    sortOptions: ["Unsorted", "Cheapest first", "Dearest first"],
    badgeNew: "New",
    view: "View",
    name: "CONNECT U7 smartphone, {size}, {color}",
  },
  gate: {
    lede: [
      "A fast, reliable and durable phone for every day.",
      "Modern design and power that lasts all day.",
    ],
    buy: "Buy now",
    about: "About the phone",
    specs: {
      screen: "Display",
      refresh: "Refresh rate",
      camera: "Camera",
      battery: "Battery",
    },
  },
  shop: {
    kicker: "7TECH \u00b7 Official reseller",
    lede: "A fast, reliable and durable phone for every day.",
    currency: "UZS",
    colorLabel: "Colour",
    colors: { white: "White", black: "Black" },
    seriesLabel: "Series",
    modelLabel: "Model",
    storageLabel: "Storage",
    qtyLabel: "Quantity",
    decrease: "Decrease",
    increase: "Increase",
    total: "Total",
    order: "Add to cart",
    about: "About the phone",
    sent:
      "Order received: {color}, {ram}/{rom}, {qty} pcs. An operator will contact you.",
    assurances: [
      ["Delivery", "Free delivery across Tashkent"],
      ["Warranty", "Under the official warranty terms"],
      ["Payment", "Cash, card or instalments"],
    ],
    specsTitle: "Specifications",
    specs: [
      ["Processor", "MediaTek Dimensity 7400"],
      ["RAM", "8GB (+8GB RAM expansion)"],
      ["Internal storage", "{rom}"],
      [
        "Display",
        "6.67\u2033 / In-Cell / AMOLED / FHD+ / centred camera cutout / flexible display / 120 Hz refresh rate",
      ],
      ["Front camera", "50MP"],
      ["Main camera", "108MP"],
      ["Additional camera 1", "2MP"],
      ["Additional camera 2", "2MP"],
      ["Battery", "5000mAh"],
      ["Charging speed", "33W"],
      ["Network", "2G/3G/4G/LTE/5G"],
      ["SIM slot", "Dual nano-sim"],
      ["Memory card slot", "MicroSD"],
      ["Wireless", "Wi-Fi, Bluetooth"],
      ["Colour", "{color}"],
      ["Charging cable", "Braided Type-C/Type-C"],
      ["Protective case", "Silicone"],
      ["Screen protector", "Included"],
      ["SIM ejector tool", "Included"],
      ["Charging port", "Type-C"],
    ],
    specsMore: "All specifications",
    specsLess: "Show less",
    serviceTitle: "Service",
    service: [
      "Our service centre for the 7TECH Connect U7 is fully operational. Any issue with the phone is resolved as quickly as possible.",
      "If the phone fails to power on, it is replaced with a new one under the stated terms.",
      "Displays and all other necessary spare parts are kept in stock.",
    ],
  },
  figure: {
    rail: "Image view",
    views: { front: "Front", back: "Back", flatFront: "Screen", flatBack: "Body" },
    alt: "CONNECT U7 — {tone}, {view} view",
  },
  langSwitch: "Choose language",
};

const DICTS: Record<Lang, Dict> = { uz, ru, en };

/** Fills {placeholders} in a dictionary string. */
export function fill(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));
}

type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: Dict };

const I18nContext = createContext<I18nValue | null>(null);

const isLang = (v: string | null): v is Lang =>
  LANGS.some((l) => l.id === v);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // The server has no way to know the visitor's choice, so the first render is
  // always Uzbek and the stored preference is applied after hydration.
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORE_KEY);
      if (isLang(saved)) setLangState(saved);
    } catch {
      /* storage blocked — stay on the default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORE_KEY, l);
    } catch {
      /* storage blocked — the choice lasts for this visit only */
    }
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: DICTS[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
