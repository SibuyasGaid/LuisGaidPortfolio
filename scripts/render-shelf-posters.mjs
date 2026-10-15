// Renders the posters of the home page's view of the grand bookcase: the
// WebGL scene at rest, photographed at each reference frame's exact shape, so
// the poster, the live scene and the links over the titled books line up.
// Run it whenever the library's layout, lighting or books change:
//
//   npm run build && npm run start -- -p 3100
//   node scripts/render-shelf-posters.mjs http://localhost:3100
//
// Needs Playwright with Chromium (npx playwright install chromium). Software
// WebGL is let through for the render only; it is slow, so allow a few minutes.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE_URL = process.argv[2] ?? "http://localhost:3100";
const OUTPUT_DIRECTORY = fileURLToPath(new URL("../assets/library/", import.meta.url));
const POSTERS = [
  { name: "shelf-landscape", width: 2560, height: 1440 },
  { name: "shelf-portrait", width: 1440, height: 2560 },
];
/** Steps of the paused clock: short enough that adaptive resolution never sees a slow frame. */
const FRAME_MS = 16;
const HIDE_PAGE_CSS = `
  [data-masthead], main, [data-colophon], [data-shelf-poster], .library-intro, .library-scene-shade, nextjs-portal { visibility: hidden !important; }
  .library-scene, .library-scene canvas { opacity: 1 !important; transition: none !important; }
`;

async function renderPoster(browser, poster) {
  const context = await browser.newContext({ viewport: { width: poster.width, height: poster.height }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options, ...rest) {
      const isWebGL = /webgl/.test(type);
      return getContext.call(this, type, options && isWebGL ? { ...options, failIfMajorPerformanceCaveat: false } : options, ...rest);
    };
    // The library declines software renderers by name; this render is the one place it should not.
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const getParameter = prototype.getParameter;
      prototype.getParameter = function (name) {
        return name === 0x9246 || name === 0x1f01 ? "Poster renderer" : getParameter.call(this, name);
      };
    }
    localStorage.setItem("library:visited", "1");
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-01-01T09:00:00") });
  await page.clock.pauseAt(new Date("2026-01-01T09:00:01"));
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  for (let step = 0; step < 2000; step++) {
    await page.clock.runFor(FRAME_MS);
    if (await page.evaluate(() => document.documentElement.hasAttribute("data-scene-ready"))) break;
  }
  await page.addStyleTag({ content: HIDE_PAGE_CSS });
  for (let step = 0; step < 4; step++) await page.clock.runFor(FRAME_MS);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).webp({ quality: 90, effort: 6 }).toFile(`${OUTPUT_DIRECTORY}${poster.name}.webp`);
  await context.close();
  console.log(`rendered ${poster.name} (${poster.width}×${poster.height})`);
}

const browser = await chromium.launch();
try {
  for (const poster of POSTERS) await renderPoster(browser, poster);
} finally {
  await browser.close();
}
