import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Colophon } from "@/components/layout/Colophon";
import { Masthead } from "@/components/layout/Masthead";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScrollLayer } from "@/components/motion/SmoothScrollLayer";
import { DevPerformanceReadout } from "@/components/dev/DevPerformanceReadout";
import { IntroStateKeeper } from "@/components/intro/IntroStateKeeper";
import { SITE } from "@/content/portfolio";
import { INTRO_BOOT_SCRIPT } from "@/lib/intro/introLifecycle";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

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
  // The paper texture is only referenced from CSS, so the browser would find it
  // late. Chrome treats textured paper cards as image paints, so a late texture
  // means a late largest paint.
  preload("/textures/paper.webp", { as: "image", fetchPriority: "high" });

  return (
    // The boot script sets data-intro on <html> before hydration, hence suppressHydrationWarning.
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
      </head>
      <body>
        <SkipLink />
        <Masthead />
        <main id="main" tabIndex={-1} className="relative pt-[calc(var(--spacing-masthead)+2rem)] outline-none sm:pt-[calc(var(--spacing-masthead)+3rem)]">
          {children}
        </main>
        <Colophon />
        <SmoothScrollLayer />
        <IntroStateKeeper />
        <DevPerformanceReadout />
      </body>
    </html>
  );
}
