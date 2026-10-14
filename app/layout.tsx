import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cormorant_SC, Inter } from "next/font/google";
import { Colophon } from "@/components/layout/Colophon";
import { Masthead } from "@/components/layout/Masthead";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScrollLayer } from "@/components/motion/SmoothScrollLayer";
import { DevPerformanceReadout } from "@/components/dev/DevPerformanceReadout";
import { SITE } from "@/content/portfolio";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Only chapter labels and first lines use true small caps, so this face is not
// preloaded and never competes with the fonts behind the largest paint.
const cormorantSmallCaps = Cormorant_SC({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-cormorant-sc",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  ...(SITE.url ? { metadataBase: new URL(SITE.url) } : {}),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e130c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${cormorantSmallCaps.variable} ${inter.variable}`}
    >
      <body>
        <SkipLink />
        <Masthead />
        <main id="main" tabIndex={-1} className="relative z-[1] pt-[calc(var(--spacing-masthead)+2rem)] outline-none sm:pt-[calc(var(--spacing-masthead)+3rem)]">
          {children}
        </main>
        <Colophon />
        <SmoothScrollLayer />
        <DevPerformanceReadout />
      </body>
    </html>
  );
}
