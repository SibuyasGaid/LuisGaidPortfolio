import { CanvasTexture, SRGBColorSpace } from "three";
import { BOOKS, type BookId } from "@/content/portfolio";
import { getTitledBookSize } from "@/lib/library/shelfFraming";

// The six titled books' spines, covers and title pages, painted on canvases
// in the site's own typefaces and in each book's own cloth and ink, which are
// read from the page's CSS so the shelf and the open books always agree.

export interface TitledBookArt {
  readonly bookId: BookId;
  readonly numeral: string;
  readonly spineTitle: string;
  readonly title: string;
  readonly subtitle: string;
  readonly volumeLabel: string;
  readonly cloth: string;
  readonly ink: string;
  /** The title page's paper, as on the book's own page. */
  readonly paper: string;
  /** Metres. */
  readonly thickness: number;
  readonly height: number;
}

interface CanvasFonts {
  readonly display: string;
  readonly sans: string;
}

/** One column per titled book, in the order of BOOKS. */
export const TITLED_SPINE_ATLAS = { width: 1024, height: 1024 } as const;
const FACE_SIZE = { width: 704, height: 1024 } as const;
const PAPER_INK = "#2a1f1a";
const BRASS_INK = "#7a5a1c";
const FALLBACK_COLOURS = { cloth: "#4a3220", ink: "#efe3c4", paper: "#efe6d2" } as const;

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  return { canvas, context };
}

function toColourTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Each book's cloth, ink and paper, as the CSS themes set them for [data-book]. */
function readBookColours(bookId: BookId): { cloth: string; ink: string; paper: string } {
  const probe = document.createElement("span");
  probe.dataset.book = bookId;
  probe.hidden = true;
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const cloth = style.getPropertyValue("--book-cover").trim();
  const ink = style.getPropertyValue("--book-cover-ink").trim();
  const paper = style.getPropertyValue("--book-paper").trim();
  probe.remove();
  return cloth && ink && paper ? { cloth, ink, paper } : FALLBACK_COLOURS;
}

export function describeTitledBooks(): TitledBookArt[] {
  return BOOKS.map((book) => ({
    bookId: book.id,
    numeral: book.numeral,
    spineTitle: book.navLabel.toUpperCase(),
    title: book.title,
    subtitle: book.subtitle,
    volumeLabel: `Volume ${book.numeral} · ${book.kind}`.toUpperCase(),
    ...readBookColours(book.id),
    ...getTitledBookSize(book.id),
  }));
}

/** The page's display and text faces, loaded so the canvases can draw with them. */
export async function loadCanvasFonts(): Promise<CanvasFonts> {
  const style = getComputedStyle(document.documentElement);
  const fonts = {
    display: style.getPropertyValue("--font-cormorant").trim() || "Georgia, serif",
    sans: style.getPropertyValue("--font-inter").trim() || "system-ui, sans-serif",
  };
  try {
    await Promise.all([
      document.fonts.load(`600 64px ${fonts.display}`),
      document.fonts.load(`italic 600 40px ${fonts.display}`),
      document.fonts.load(`600 24px ${fonts.sans}`),
    ]);
  } catch {
    // The fallback faces still draw legibly.
  }
  return fonts;
}

// Light from the left rounding into shadow at both edges, as on the filler spines.
function shadeSpine(context: CanvasRenderingContext2D, x: number, width: number, height: number): void {
  const rounding = context.createLinearGradient(x, 0, x + width, 0);
  rounding.addColorStop(0, "rgb(0 0 0 / 0.5)");
  rounding.addColorStop(0.16, "rgb(255 255 255 / 0.12)");
  rounding.addColorStop(0.42, "rgb(0 0 0 / 0)");
  rounding.addColorStop(0.8, "rgb(0 0 0 / 0.14)");
  rounding.addColorStop(1, "rgb(0 0 0 / 0.5)");
  context.fillStyle = rounding;
  context.fillRect(x, 0, width, height);
}

function drawSpine(context: CanvasRenderingContext2D, art: TitledBookArt, column: number, fonts: CanvasFonts): void {
  const width = TITLED_SPINE_ATLAS.width / BOOKS.length;
  const height = TITLED_SPINE_ATLAS.height;
  const x = column * width;
  // The column is stretched over the spine, so drawing is squeezed across to
  // come out in true proportion on a spine of this book's shape.
  const squeeze = (width / art.thickness) / (height / art.height);
  context.save();
  context.beginPath();
  context.rect(x, 0, width, height);
  context.clip();

  context.fillStyle = art.cloth;
  context.fillRect(x, 0, width, height);
  context.fillStyle = art.ink;
  for (const y of [0.075, 0.095, 0.905, 0.925]) context.fillRect(x, height * y, width, 3);

  // The numeral on a brass plate.
  const centreX = x + width / 2;
  const plateHeight = height * 0.075;
  const plateWidth = Math.min(width * 0.72, plateHeight * 1.5 * squeeze);
  const plate = context.createLinearGradient(0, height * 0.13, 0, height * 0.13 + plateHeight);
  plate.addColorStop(0, "#ecd7a2");
  plate.addColorStop(1, "#b8913a");
  context.fillStyle = plate;
  context.fillRect(centreX - plateWidth / 2, height * 0.13, plateWidth, plateHeight);
  context.save();
  context.translate(centreX, height * 0.13 + plateHeight / 2);
  context.scale(squeeze, 1);
  context.fillStyle = PAPER_INK;
  context.font = `600 ${plateHeight * 0.62}px ${fonts.display}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(art.numeral, 0, plateHeight * 0.04);
  context.restore();

  // The title runs down the spine, as large as the spine's width allows.
  const titleTop = height * 0.25;
  const titleLength = height * 0.6;
  context.save();
  context.translate(centreX, titleTop + titleLength / 2);
  context.rotate(Math.PI / 2);
  context.scale(1, squeeze);
  const across = (width / squeeze) * 0.62;
  let fontSize = across;
  context.font = `600 ${fontSize}px ${fonts.display}`;
  const letterSpacing = 0.08;
  const measure = () => context.measureText(art.spineTitle).width * (1 + letterSpacing);
  if (measure() > titleLength) {
    fontSize *= titleLength / measure();
    context.font = `600 ${fontSize}px ${fonts.display}`;
  }
  context.letterSpacing = `${fontSize * letterSpacing}px`;
  context.fillStyle = art.ink;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(art.spineTitle, 0, fontSize * 0.04);
  context.restore();

  shadeSpine(context, x, width, height);
  context.restore();
}

/** The six titled spines side by side, in the order of BOOKS. */
export function createTitledSpineAtlas(books: readonly TitledBookArt[], fonts: CanvasFonts): CanvasTexture {
  const { canvas, context } = createCanvas(TITLED_SPINE_ATLAS.width, TITLED_SPINE_ATLAS.height);
  books.forEach((art, column) => drawSpine(context, art, column, fonts));
  return toColourTexture(canvas);
}

function drawCentredText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, font: (size: number) => string, size: number): void {
  let fontSize = size;
  context.font = font(fontSize);
  const width = context.measureText(text).width;
  if (width > maxWidth) {
    fontSize *= maxWidth / width;
    context.font = font(fontSize);
  }
  context.fillText(text, x, y);
}

function drawMonogram(context: CanvasRenderingContext2D, x: number, y: number, radius: number, fonts: CanvasFonts): void {
  context.lineWidth = radius * 0.04;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 0.6;
  context.lineWidth = radius * 0.02;
  context.beginPath();
  context.arc(x, y, radius * 0.86, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
  context.font = `600 ${radius * 0.62}px ${fonts.display}`;
  context.fillText("CLG", x, y + radius * 0.04);
}

function drawCover(context: CanvasRenderingContext2D, art: TitledBookArt, fonts: CanvasFonts): void {
  const { width, height } = FACE_SIZE;
  context.fillStyle = art.cloth;
  context.fillRect(0, 0, width, height);
  // Fine weave, then light falling across from the spine.
  context.fillStyle = "rgb(0 0 0 / 0.04)";
  for (let line = 0; line < height; line += 3) context.fillRect(0, line, width, 1);
  const light = context.createLinearGradient(0, 0, width, height);
  light.addColorStop(0, "rgb(255 255 255 / 0.1)");
  light.addColorStop(0.5, "rgb(255 255 255 / 0)");
  light.addColorStop(1, "rgb(0 0 0 / 0.18)");
  context.fillStyle = light;
  context.fillRect(0, 0, width, height);
  // The hinge groove beside the spine.
  context.fillStyle = "rgb(0 0 0 / 0.22)";
  context.fillRect(width * 0.06, 0, 6, height);

  context.strokeStyle = art.ink;
  context.fillStyle = art.ink;
  context.lineWidth = 3;
  context.strokeRect(width * 0.12, height * 0.05, width * 0.82, height * 0.9);
  context.lineWidth = 1.5;
  context.strokeRect(width * 0.14, height * 0.065, width * 0.78, height * 0.87);

  const centreX = width * 0.53;
  context.textAlign = "center";
  context.textBaseline = "middle";
  drawMonogram(context, centreX, height * 0.27, width * 0.12, fonts);
  drawCentredText(context, art.title, centreX, height * 0.52, width * 0.66, (size) => `600 ${size}px ${fonts.display}`, 64);
  context.fillRect(centreX - width * 0.08, height * 0.585, width * 0.16, 2);
  context.letterSpacing = "4px";
  drawCentredText(context, art.volumeLabel, centreX, height * 0.85, width * 0.66, (size) => `600 ${size}px ${fonts.sans}`, 17);
  context.letterSpacing = "0px";
}

function drawTitlePage(context: CanvasRenderingContext2D, art: TitledBookArt, fonts: CanvasFonts): void {
  const { width, height } = FACE_SIZE;
  context.save();
  context.translate(FACE_SIZE.width, 0);
  context.fillStyle = art.paper;
  context.fillRect(0, 0, width, height);
  const gutter = context.createLinearGradient(0, 0, width * 0.22, 0);
  gutter.addColorStop(0, "rgb(60 40 20 / 0.28)");
  gutter.addColorStop(1, "rgb(60 40 20 / 0)");
  context.fillStyle = gutter;
  context.fillRect(0, 0, width * 0.22, height);

  // Set heavier and larger than on the page itself: the title page is only
  // ever seen a few hundred pixels tall, where hairline serifs would fade.
  const centreX = width * 0.54;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = BRASS_INK;
  context.letterSpacing = "5px";
  drawCentredText(context, art.volumeLabel, centreX, height * 0.29, width * 0.72, (size) => `600 ${size}px ${fonts.sans}`, 24);
  context.letterSpacing = "0px";
  context.fillStyle = PAPER_INK;
  drawCentredText(context, art.title, centreX, height * 0.42, width * 0.76, (size) => `600 ${size}px ${fonts.display}`, 104);
  context.fillStyle = "#4a3b31";
  drawCentredText(context, art.subtitle, centreX, height * 0.515, width * 0.76, (size) => `italic 600 ${size}px ${fonts.display}`, 50);
  context.fillStyle = "#b8913a";
  context.fillRect(centreX - width * 0.1, height * 0.585, width * 0.2, 4);
  context.restore();
}

/** The front cover (left half) and title page (right half) of one book, painted when it is first wanted. */
export function createTitledFaceTexture(art: TitledBookArt, fonts: CanvasFonts): CanvasTexture {
  const { canvas, context } = createCanvas(FACE_SIZE.width * 2, FACE_SIZE.height);
  drawCover(context, art, fonts);
  drawTitlePage(context, art, fonts);
  return toColourTexture(canvas);
}
