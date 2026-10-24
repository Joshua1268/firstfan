import type { Metadata } from "next";
import { Archivo, Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { PRODUCT_NAME } from "@/lib/brand";
import "./globals.css";

// `subsets` ne choisit que les fichiers préchargés : le CSS déclare tous les sous-ensembles (latin-ext compris), chargés
// à la demande via unicode-range. Le texte de la page est en latin seul : précharger latin-ext ralentissait le LCP.
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
  title: PRODUCT_NAME,
  description: `${PRODUCT_NAME} : fais tester ton application par des professionnels vérifiés.`,
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
