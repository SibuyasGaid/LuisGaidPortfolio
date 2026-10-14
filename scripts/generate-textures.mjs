// Renders the tiled surface textures (paper, wood, leather) from SVG noise
// filters. Kept as a script so the tiles can be regenerated or retuned instead
// of being opaque binary assets. Run with `npm run textures`.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const OUTPUT_DIRECTORY = new URL("../public/textures/", import.meta.url);
const WEBP_QUALITY = 88;

// Each layer maps a noise channel to the alpha of a flat tint, so the noise only
// ever darkens or lightens the base colour instead of adding grey static.
function createNoiseLayer({ id, type, baseFrequency, octaves, seed, tint, alphaScale, alphaOffset }) {
  const [red, green, blue] = tint;
  return {
    filter: `
      <filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="${type}" baseFrequency="${baseFrequency}" numOctaves="${octaves}" seed="${seed}"/>
        <feColorMatrix type="matrix" values="0 0 0 0 ${red}  0 0 0 0 ${green}  0 0 0 0 ${blue}  ${alphaScale} 0 0 0 ${alphaOffset}"/>
      </filter>`,
    rect: `<rect width="100%" height="100%" filter="url(#${id})"/>`,
  };
}

function createTextureSvg({ width, height, baseColor, layers }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>${layers.map((layer) => layer.filter).join("")}</defs>
    <rect width="100%" height="100%" fill="${baseColor}"/>
    ${layers.map((layer) => layer.rect).join("")}
  </svg>`;
}

const TEXTURES = [
  {
    name: "paper",
    width: 320,
    height: 320,
    baseColor: "#EFE6D2",
    layers: [
      createNoiseLayer({ id: "mottle", type: "fractalNoise", baseFrequency: "0.0125", octaves: 3, seed: 7, tint: [0.55, 0.42, 0.24], alphaScale: 0.26, alphaOffset: -0.1 }),
      createNoiseLayer({ id: "fibre", type: "fractalNoise", baseFrequency: "0.06 0.22", octaves: 2, seed: 11, tint: [0.45, 0.34, 0.2], alphaScale: 0.22, alphaOffset: -0.09 }),
      createNoiseLayer({ id: "grain", type: "fractalNoise", baseFrequency: "0.85", octaves: 2, seed: 3, tint: [0.4, 0.3, 0.18], alphaScale: 0.32, alphaOffset: -0.1 }),
    ],
  },
  {
    name: "wood",
    width: 512,
    height: 512,
    baseColor: "#24170F",
    layers: [
      createNoiseLayer({ id: "streak", type: "fractalNoise", baseFrequency: "0.0039 0.0703", octaves: 4, seed: 5, tint: [0.24, 0.16, 0.09], alphaScale: 1.3, alphaOffset: -0.42 }),
      createNoiseLayer({ id: "shadow", type: "fractalNoise", baseFrequency: "0.0078 0.1172", octaves: 3, seed: 13, tint: [0.07, 0.04, 0.02], alphaScale: 1.1, alphaOffset: -0.4 }),
      createNoiseLayer({ id: "pore", type: "fractalNoise", baseFrequency: "0.04 0.9", octaves: 1, seed: 17, tint: [0.05, 0.03, 0.02], alphaScale: 0.6, alphaOffset: -0.22 }),
    ],
  },
  {
    name: "leather",
    width: 256,
    height: 256,
    baseColor: "#5A1524",
    layers: [
      createNoiseLayer({ id: "mottle", type: "fractalNoise", baseFrequency: "0.0234", octaves: 3, seed: 19, tint: [0.18, 0.03, 0.07], alphaScale: 0.9, alphaOffset: -0.3 }),
      createNoiseLayer({ id: "pore", type: "turbulence", baseFrequency: "0.42", octaves: 2, seed: 23, tint: [0.16, 0.02, 0.06], alphaScale: 1.4, alphaOffset: -0.12 }),
      createNoiseLayer({ id: "sheen", type: "fractalNoise", baseFrequency: "0.0469", octaves: 2, seed: 29, tint: [0.62, 0.24, 0.28], alphaScale: 0.45, alphaOffset: -0.22 }),
    ],
  },
];

// feTurbulence's stitchTiles leaves visible seams in librsvg, so the noise is
// rendered at double size and each output pixel cross-fades the four samples
// that wrap onto it. Dividing by the weights' root-sum-square keeps the grain
// contrast even across the tile instead of washing out towards the centre.
function blendIntoSeamlessTile(pixels, width, height, channels) {
  const sourceWidth = width * 2;
  const tile = Buffer.alloc(width * height * channels);
  const channelMeans = Array.from({ length: channels }, (_, channel) => {
    let sum = 0;
    for (let index = channel; index < pixels.length; index += channels) sum += pixels[index];
    return sum / (pixels.length / channels);
  });

  for (let y = 0; y < height; y++) {
    const weightY = y / height;
    for (let x = 0; x < width; x++) {
      const weightX = x / width;
      const samples = [
        { sourceX: x + width, sourceY: y + height, weight: (1 - weightX) * (1 - weightY) },
        { sourceX: x, sourceY: y + height, weight: weightX * (1 - weightY) },
        { sourceX: x + width, sourceY: y, weight: (1 - weightX) * weightY },
        { sourceX: x, sourceY: y, weight: weightX * weightY },
      ];
      const contrastCorrection = Math.sqrt(samples.reduce((sum, sample) => sum + sample.weight ** 2, 0));
      for (let channel = 0; channel < channels; channel++) {
        const blended = samples.reduce(
          (sum, sample) => sum + sample.weight * pixels[(sample.sourceY * sourceWidth + sample.sourceX) * channels + channel],
          0,
        );
        const mean = channelMeans[channel];
        const value = mean + (blended - mean) / contrastCorrection;
        tile[(y * width + x) * channels + channel] = Math.max(0, Math.min(255, Math.round(value)));
      }
    }
  }
  return tile;
}

async function renderTexture(texture) {
  const svg = createTextureSvg({ ...texture, width: texture.width * 2, height: texture.height * 2 });
  const { data, info } = await sharp(Buffer.from(svg)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const tile = blendIntoSeamlessTile(data, texture.width, texture.height, info.channels);
  const outputPath = new URL(`${texture.name}.webp`, OUTPUT_DIRECTORY);
  const output = await sharp(tile, { raw: { width: texture.width, height: texture.height, channels: info.channels } })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(outputPath.pathname);
  console.log(`${texture.name}.webp  ${texture.width}x${texture.height}  ${(output.size / 1024).toFixed(1)} KB`);
}

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await Promise.all(TEXTURES.map(renderTexture));
