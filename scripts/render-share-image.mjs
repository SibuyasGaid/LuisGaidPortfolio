// Renders the picture shown with a link to the site when it is shared (on
// Facebook, LinkedIn, X, in messages): the grand bookcase's poster, darkened,
// with the name and one line on what I build, set in the site's own fonts.
// Writes app/opengraph-image.jpg and app/twitter-image.jpg, 1200 by 630. Run
// it after changing the poster, the name or the line:
//
//   npm run build && npm run start -- -p 3100
//   node scripts/render-share-image.mjs http://localhost:3100
//
// Needs Playwright with Chromium (npx playwright install chromium).
import { copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const BASE_URL = process.argv[2] ?? "http://localhost:3100";
const OPEN_GRAPH_IMAGE = fileURLToPath(new URL("../app/opengraph-image.jpg", import.meta.url));
const TWITTER_IMAGE = fileURLToPath(new URL("../app/twitter-image.jpg", import.meta.url));
const WIDTH = 1200;
const HEIGHT = 630;
const NAME = "Charles Luis Gaid";
const LINE = "Custom software and AI, built around how your business works";

/** The built stylesheets (which carry the fonts) and the bookcase poster, as the running site serves them. */
async function findSiteAssets() {
  const html = await (await fetch(BASE_URL)).text();
  const stylesheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map((match) => match[1]);
  // The poster appears in the page only inside image-optimizer URLs, with its slashes encoded.
  const poster = html.replaceAll("%2F", "/").match(/\/_next\/static\/media\/shelf-landscape\.[\w-]+\.webp/)?.[0];
  if (!stylesheets.length || !poster) throw new Error(`Couldn't find the site's stylesheets or poster at ${BASE_URL}. Is it running?`);
  return { stylesheets, poster };
}

function renderCard({ stylesheets, poster }) {
  return `<!doctype html><html><head>
${stylesheets.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}
<style>
  html, body { margin: 0; background: #0b0705; }
  .card { position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; display: grid; place-items: center; }
  .shelf { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 58%; }
  .shade { position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 52% 58% at 50% 50%, rgb(11 7 5 / 0.78), rgb(11 7 5 / 0.5) 62%, rgb(11 7 5 / 0.72)),
      linear-gradient(to bottom, rgb(11 7 5 / 0.35), transparent 30%, transparent 70%, rgb(11 7 5 / 0.55)); }
  .frame { position: absolute; inset: 22px; border: 1px solid rgb(212 178 106 / 0.35); border-radius: 14px; }
  .text { position: relative; display: grid; justify-items: center; text-align: center; padding: 0 90px; }
  .mark { width: 74px; height: 74px; border-radius: 50%; border: 2px solid #d4b26a; box-shadow: inset 0 0 0 6px rgb(212 178 106 / 0.55);
    display: grid; place-items: center; font-family: "Cormorant Garamond"; font-weight: 500; font-size: 27px; letter-spacing: 0.04em; color: #d4b26a; }
  .eyebrow { margin-top: 28px; font-family: Inter; font-weight: 600; font-size: 17px; letter-spacing: 0.24em; text-transform: uppercase; color: #d4b26a; }
  .name { margin-top: 14px; font-family: "Cormorant Garamond"; font-weight: 500; font-size: 104px; line-height: 0.95; letter-spacing: -0.02em;
    color: #f8f3e8; text-shadow: 0 4px 30px rgb(0 0 0 / 0.7); }
  .rule { margin-top: 26px; display: flex; align-items: center; gap: 12px; }
  .rule span { width: 70px; height: 1px; background: rgb(212 178 106 / 0.7); }
  .rule i { width: 7px; height: 7px; background: #d4b26a; transform: rotate(45deg); }
  .line { margin-top: 22px; font-family: "Cormorant Garamond"; font-style: italic; font-weight: 500; font-size: 38px; line-height: 1.2;
    color: #efe6d2; text-shadow: 0 2px 18px rgb(0 0 0 / 0.8); }
</style></head><body>
<div class="card">
  <img class="shelf" src="${poster}" alt="">
  <div class="shade"></div>
  <div class="frame"></div>
  <div class="text">
    <div class="mark">CLG</div>
    <div class="eyebrow">The library of</div>
    <div class="name">${NAME}</div>
    <div class="rule"><span></span><i></i><span></span></div>
    <div class="line">${LINE}</div>
  </div>
</div></body></html>`;
}

async function main() {
  const html = renderCard(await findSiteAssets());
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    // On the site's own origin, so its stylesheets, fonts and poster load.
    await page.goto(new URL("/robots.txt", BASE_URL).href);
    // The site's fonts are font-display: optional, so the first pass only fetches them; the second draws with them.
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() =>
      Promise.all(['500 104px "Cormorant Garamond"', 'italic 500 38px "Cormorant Garamond"', "600 17px Inter"].map((font) => document.fonts.load(font))),
    );
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OPEN_GRAPH_IMAGE, type: "jpeg", quality: 90 });
  } finally {
    await browser.close();
  }
  await copyFile(OPEN_GRAPH_IMAGE, TWITTER_IMAGE);
  console.log(`Wrote ${OPEN_GRAPH_IMAGE} and ${TWITTER_IMAGE}`);
}

await main();
