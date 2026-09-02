import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ExperienceProvider } from "@/lib/experience";
import { I18nProvider } from "@/lib/i18n";

// The one face the 7TECH storefront sets everything in. Cyrillic is loaded
// alongside Latin because the Russian dictionary needs it.
const sans = Montserrat({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "7MOBILE",
  description:
    "Connectivity orchestrated from low orbit to the last street. An interactive descent through the 7MOBILE network.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `lang` starts at the default and I18nProvider updates it on choice.
    <html lang="uz">
      <body className={sans.variable}>
        <I18nProvider>
          <ExperienceProvider>{children}</ExperienceProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
