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
//
// It also writes the soft, out-of-focus copies the book pages stand on
// (app/shelf-backdrop.css). To remake only those from the posters already
// rendered: node scripts/render-shelf-posters.mjs --soft-only
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);

const IS_SOFT_ONLY = process.argv.includes("--soft-only");
const BASE_URL = process.argv.slice(2).find((argument) => !argument.startsWith("--")) ?? "http://localhost:3100";
const OUTPUT_DIRECTORY = fileURLToPath(new URL("../assets/library/", import.meta.url));
const BACKDROP_CSS = fileURLToPath(new URL("../app/shelf-backdrop.css", import.meta.url));
/**
 * The soft copies are tiny and blurred, then stretched over the screen: a
 * couple of kilobytes each, inlined so they paint with the page, and light
 * enough per pixel that the browser never takes one for the page's main content.
 */
const SOFT_COPIES = [
  { poster: "shelf-landscape", property: "--shelf-soft-landscape", width: 192, height: 108 },
  { poster: "shelf-portrait", property: "--shelf-soft-portrait", width: 108, height: 192 },
];
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

async function writeSoftBackdrops() {
  const lines = [];
  for (const copy of SOFT_COPIES) {
    const webp = await sharp(`${OUTPUT_DIRECTORY}${copy.poster}.webp`)
      .resize(copy.width, copy.height)
      .blur(1.6)
      .webp({ quality: 80, effort: 6, smartSubsample: true })
      .toBuffer();
    lines.push(`  ${copy.property}: url("data:image/webp;base64,${webp.toString("base64")}");`);
    console.log(`softened ${copy.poster} (${webp.length} bytes)`);
  }
  const css = `/* The shelf out of focus, behind every book. Written by scripts/render-shelf-posters.mjs; do not edit. */\n:root {\n${lines.join("\n")}\n}\n`;
  await writeFile(BACKDROP_CSS, css);
}

if (!IS_SOFT_ONLY) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  try {
    for (const poster of POSTERS) await renderPoster(browser, poster);
  } finally {
    await browser.close();
  }
}
await writeSoftBackdrops();
