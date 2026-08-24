import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ExperienceProvider } from "@/lib/experience";

// The same face the SABER wordmark outlines were cut from, so the mark and the
// copy around it share one voice.
const display = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
    <html lang="en">
      <body className={`${display.variable} ${mono.variable}`}>
        <ExperienceProvider>{children}</ExperienceProvider>
      </body>
    </html>
  );
}
