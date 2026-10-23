import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { ArrivalFlagReset } from "@/components/layout/ArrivalFlagReset";
import { Colophon } from "@/components/layout/Colophon";
import { Masthead } from "@/components/layout/Masthead";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScrollLayer } from "@/components/motion/SmoothScrollLayer";
import { DevPerformanceReadout } from "@/components/dev/DevPerformanceReadout";
import { IntroStateKeeper } from "@/components/intro/IntroStateKeeper";
import { ShelfPoster } from "@/components/library/ShelfPoster";
import { ShelfTransitions } from "@/components/library/ShelfTransitions";
import { SoundRuntime } from "@/components/sound/SoundRuntime";
import { SITE } from "@/content/portfolio";
import { INTRO_BOOT_SCRIPT } from "@/lib/intro/introLifecycle";
import { SHELF_BOOT_SCRIPT } from "@/lib/library/shelfAttributes";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";
import "./shelf-backdrop.css";

// The display face never swaps in late. Drop caps, the stack list and every
// heading reflow when Cormorant replaces its fallback, which broke the layout
// shift budget on slow connections. "optional" plus the automatic preload means
// the face is used when it arrives in time (any decent connection, and every
// repeat visit) and the fallback serif is kept otherwise. Body text (Inter)
// still swaps, since its fallback metrics match closely.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "optional",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  // The shared picture itself is app/opengraph-image.jpg (and twitter-image.jpg), made by scripts/render-share-image.mjs.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e130c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script sets data-intro on <html> before hydration, hence suppressHydrationWarning.
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT + SHELF_BOOT_SCRIPT }} />
      </head>
      <body>
        <SkipLink />
        {/* The grand bookcase out of focus, behind every page but the home page. */}
        <div data-shelf-backdrop aria-hidden="true" className="shelf-backdrop">
          <div className="shelf-backdrop-image" />
        </div>
        {/* The library behind the home page, kept between pages: the live WebGL scene where it runs, and the
            poster of the same view, which shows here while a book is put back or taken from another page. */}
        <div data-library-scene aria-hidden="true" className="library-scene">
          <div className="shelf-poster">
            <ShelfPoster />
          </div>
          <div data-scene-canvas className="library-scene-canvas" />
        </div>
        <Masthead />
        <main id="main" tabIndex={-1} className="relative pt-[calc(var(--spacing-masthead)+2rem)] outline-none sm:pt-[calc(var(--spacing-masthead)+3rem)]">
          {children}
        </main>
        <Colophon />
        {/* Holds a book on its way between the shelf and its page; filled and emptied by script. */}
        <div data-transit-root aria-hidden="true" className="transit-root" />
        <ArrivalFlagReset />
        <ShelfTransitions />
        <SmoothScrollLayer />
        <IntroStateKeeper />
        <SoundRuntime />
        <DevPerformanceReadout />
      </body>
    </html>
  );
}
