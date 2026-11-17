import type { Metadata } from "next";
import { Archivo, Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { PRODUCT_NAME } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// latin-ext slowed LCP; Archivo is preloaded so the H1 does not shift.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: "500",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PRODUCT_NAME,
  description: `${PRODUCT_NAME} met en relation les développeurs qui ont une application à faire tester avec des professionnels vérifiés du métier visé, rémunérés pour chaque test validé.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${geist.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
