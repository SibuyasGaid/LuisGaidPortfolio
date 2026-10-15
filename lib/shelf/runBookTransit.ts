import { escapeHtml } from "@/lib/escapeHtml";
import {
  BOOK_ARRIVAL_ATTRIBUTE,
  BOOK_COVER_ASPECT,
  BOOK_NEIGHBOUR_REST_DEGREES,
  BOOK_NEIGHBOUR_ROCK_DEGREES,
  BOOK_TRANSIT_EASES,
  BOOK_TRANSIT_HEIGHT_SHARE,
  BOOK_TRANSIT_OPEN_DEGREES,
  BOOK_TRANSIT_PULL_PX,
  BOOK_TRANSIT_ROUTE_TIMEOUT_MS,
  BOOK_TRANSIT_SPREAD_WIDTH_SHARE,
  BOOK_TRANSIT_TIMINGS,
  BOOK_TRANSIT_TIP_DEGREES,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";

// Takes a titled book off the shelf as a solid object: a CSS 3D box with a
// spine, covers, page edges and a hinged front cover. It slides out tipped by
// its top edge, turns to show its cover while it comes to the middle of the
// screen, opens on its title page, and fades into the book's own page.
// Everything it moves is a transform or an opacity.

interface BookTransitOptions {
  readonly link: HTMLAnchorElement;
  readonly navigate: () => void;
}

interface BookDetails {
  readonly bookId: string;
  readonly numeral: string;
  readonly title: string;
  readonly spineTitle: string;
  readonly subtitle: string;
  readonly volumeLabel: string;
}

interface TransitGeometry {
  readonly height: number;
  readonly width: number;
  readonly thickness: number;
  readonly left: number;
  readonly top: number;
  readonly startScale: number;
  readonly travelX: number;
  readonly travelY: number;
  readonly isSpreadCentred: boolean;
}

interface TransitParts {
  readonly book: HTMLElement;
  /** Every face but the spine: hidden while the book is still in its slot. */
  readonly hiddenFaces: readonly HTMLElement[];
  readonly backdrop: HTMLElement;
  readonly cover: HTMLElement;
  readonly spineShade: HTMLElement;
  readonly coverShade: HTMLElement;
  readonly insideShade: HTMLElement;
  readonly sheen: HTMLElement;
}

const MONOGRAM_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true" class="transit-monogram"><circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" stroke-width="0.75"/><circle cx="20" cy="20" r="16.5" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.6"/><text x="20" y="24.5" text-anchor="middle" fill="currentColor" style="font-family:var(--font-display);font-weight:600;font-size:12.5px;letter-spacing:0.04em">CLG</text></svg>`;

function readBookDetails(link: HTMLAnchorElement): BookDetails {
  return {
    bookId: link.dataset.book ?? "",
    numeral: link.querySelector(".shelf-spine-numeral")?.textContent ?? "",
    title: link.dataset.title ?? "",
    spineTitle: link.querySelector(".shelf-spine-title")?.textContent ?? "",
    subtitle: link.dataset.subtitle ?? "",
    volumeLabel: link.dataset.volume ?? "",
  };
}

// The box is built at the size it will have in the middle of the screen and
// scaled down onto the spine, so it is sharp where it matters: open, up close.
function measureGeometry(spineRect: DOMRect): TransitGeometry {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const heightByViewport = viewportHeight * BOOK_TRANSIT_HEIGHT_SHARE;
  const isSpreadCentred = heightByViewport * BOOK_COVER_ASPECT * 2 <= viewportWidth * BOOK_TRANSIT_SPREAD_WIDTH_SHARE;
  // On narrow screens the title page is centred and the cover swings off to the left.
  const height = isSpreadCentred
    ? heightByViewport
    : Math.min(heightByViewport, (viewportWidth * BOOK_TRANSIT_SPREAD_WIDTH_SHARE) / BOOK_COVER_ASPECT);
  const thickness = height * (spineRect.width / spineRect.height);
  const spineCentreX = spineRect.left + spineRect.width / 2;
  const spineCentreY = spineRect.top + spineRect.height / 2;
  return {
    height,
    width: height * BOOK_COVER_ASPECT,
    thickness,
    left: spineCentreX - thickness / 2,
    top: spineCentreY - height / 2,
    startScale: spineRect.height / height,
    travelX: viewportWidth / 2 - spineCentreX,
    travelY: viewportHeight / 2 - spineCentreY,
    isSpreadCentred,
  };
}

function renderBookMarkup(details: BookDetails): string {
  const numeral = escapeHtml(details.numeral);
  const title = escapeHtml(details.title);
  const volumeLabel = escapeHtml(details.volumeLabel);
  return `
    <div class="transit-backdrop"></div>
    <div class="transit-book" data-book="${escapeHtml(details.bookId)}">
      <div class="transit-face transit-edge"></div>
      <div class="transit-face transit-back-cover"></div>
      <div class="transit-face transit-top"></div>
      <div class="transit-face transit-bottom"></div>
      <div class="transit-face transit-page">
        <span class="transit-page-label">${volumeLabel}</span>
        <span class="transit-page-title">${title}</span>
        <span class="transit-page-subtitle">${escapeHtml(details.subtitle)}</span>
        <span class="transit-page-rule"></span>
      </div>
      <div class="transit-face transit-spine">
        <span class="transit-spine-numeral">${numeral}</span>
        <span class="transit-spine-title">${escapeHtml(details.spineTitle)}</span>
        <i class="transit-shade" data-transit-spine-shade></i>
      </div>
      <div class="transit-cover" data-transit-cover>
        <div class="transit-cover-front">
          ${MONOGRAM_SVG}
          <span class="transit-cover-title">${title}</span>
          <span class="transit-cover-kind">${volumeLabel}</span>
          <i class="transit-sheen" data-transit-sheen></i>
          <i class="transit-shade" data-transit-cover-shade></i>
        </div>
        <div class="transit-cover-inside"><i class="transit-shade" data-transit-inside-shade></i></div>
      </div>
    </div>`;
}

function queryPart(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Book transit is missing ${selector}`);
  return element;
}

function buildBook(root: HTMLElement, details: BookDetails, geometry: TransitGeometry): TransitParts {
  root.innerHTML = renderBookMarkup(details);
  const book = queryPart(root, ".transit-book");
  book.style.setProperty("--h", `${geometry.height}px`);
  book.style.setProperty("--w", `${geometry.width}px`);
  book.style.setProperty("--d", `${geometry.thickness}px`);
  book.style.left = `${geometry.left}px`;
  book.style.top = `${geometry.top}px`;
  return {
    book,
    hiddenFaces: Array.from(
      root.querySelectorAll<HTMLElement>(".transit-face:not(.transit-spine), .transit-cover-front, .transit-cover-inside"),
    ),
    backdrop: queryPart(root, ".transit-backdrop"),
    cover: queryPart(root, "[data-transit-cover]"),
    spineShade: queryPart(root, "[data-transit-spine-shade]"),
    coverShade: queryPart(root, "[data-transit-cover-shade]"),
    insideShade: queryPart(root, "[data-transit-inside-shade]"),
    sheen: queryPart(root, "[data-transit-sheen]"),
  };
}

function findShelfItem(start: Element | null, direction: "previous" | "next"): HTMLElement | null {
  let candidate = start;
  while (candidate && candidate.classList.contains("shelf-caption")) {
    candidate = direction === "previous" ? candidate.previousElementSibling : candidate.nextElementSibling;
  }
  return candidate instanceof HTMLElement ? candidate : null;
}

// Only books on the same row as the gap can fall into it.
function findNeighbours(link: HTMLAnchorElement): { left: HTMLElement | null; right: HTMLElement | null } {
  const rowBottom = link.getBoundingClientRect().bottom;
  const isOnSameRow = (element: HTMLElement | null) =>
    element !== null && Math.abs(element.getBoundingClientRect().bottom - rowBottom) < 2 ? element : null;
  return {
    left: isOnSameRow(findShelfItem(link.previousElementSibling, "previous")),
    right: isOnSameRow(findShelfItem(link.nextElementSibling, "next")),
  };
}

function waitForPage(pathname: string): Promise<void> {
  const startedAt = performance.now();
  return new Promise((resolve) => {
    function check(): void {
      if (window.location.pathname === pathname || performance.now() - startedAt > BOOK_TRANSIT_ROUTE_TIMEOUT_MS) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    }
    check();
  });
}

export function runBookTransit({ link, navigate }: BookTransitOptions): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-transit-root]");
  const spine = link.querySelector<HTMLElement>(".shelf-book-body");
  if (!root || !spine) {
    navigate();
    return Promise.resolve();
  }

  const geometry = measureGeometry(spine.getBoundingClientRect());
  const parts = buildBook(root, readBookDetails(link), geometry);
  const neighbours = findNeighbours(link);
  const leaningNeighbours = [neighbours.left, neighbours.right].filter((element) => element !== null);
  const timings = BOOK_TRANSIT_TIMINGS;
  let hasNavigated = false;

  function goToPage(): void {
    if (hasNavigated) return;
    hasNavigated = true;
    document.documentElement.setAttribute(BOOK_ARRIVAL_ATTRIBUTE, link.pathname);
    navigate();
  }

  // The box starts exactly over the spine: scaled down, and nudged forward so
  // the spine face (not the box's middle) sits where the real spine was.
  gsap.set(parts.book, {
    transformOrigin: `50% 50% ${-geometry.width / 2}px`,
    scale: geometry.startScale,
    z: (geometry.width / 2) * (1 - geometry.startScale),
  });
  gsap.set(parts.cover, { transformOrigin: "0% 50%", rotationY: 90 });
  // Inside the case only the spine shows; the shelves hide the rest of the
  // book, and in this flat overlay they cannot, so the other faces wait.
  gsap.set(parts.hiddenFaces, { opacity: 0 });
  gsap.set(spine, { autoAlpha: 0 });
  if (neighbours.left) gsap.set(neighbours.left, { transformOrigin: "100% 100%" });
  if (neighbours.right) gsap.set(neighbours.right, { transformOrigin: "0% 100%" });
  root.setAttribute("data-active", "");

  const timeline = gsap.timeline();
  timeline
    .addLabel("pull")
    .to(
      parts.book,
      {
        z: `+=${BOOK_TRANSIT_PULL_PX}`,
        y: -geometry.height * geometry.startScale * 0.05,
        rotationX: BOOK_TRANSIT_TIP_DEGREES,
        duration: timings.pull,
        ease: BOOK_TRANSIT_EASES.pull,
      },
      "pull",
    )
    .addLabel("rock", `pull+=${timings.pull * 0.6}`);

  if (neighbours.left) {
    timeline
      .to(neighbours.left, { rotation: BOOK_NEIGHBOUR_ROCK_DEGREES, duration: 0.22, ease: "power2.in" }, "rock")
      .to(neighbours.left, { rotation: BOOK_NEIGHBOUR_REST_DEGREES, duration: 0.5, ease: "sine.inOut" }, "rock+=0.22");
  }
  if (neighbours.right) {
    timeline
      .to(neighbours.right, { rotation: -BOOK_NEIGHBOUR_ROCK_DEGREES, duration: 0.24, ease: "power2.in" }, "rock+=0.03")
      .to(neighbours.right, { rotation: -BOOK_NEIGHBOUR_REST_DEGREES, duration: 0.5, ease: "sine.inOut" }, "rock+=0.27");
  }

  // Turning away from the lamp darkens the spine; the cover comes out of the
  // shelf's shadow into the light, catching a glint as it passes the lamp.
  timeline
    .addLabel("turn", `pull+=${timings.pull - 0.05}`)
    .to(
      parts.book,
      {
        x: geometry.travelX,
        y: geometry.travelY,
        z: (geometry.width - geometry.thickness) / 2,
        scale: 1,
        rotationX: 0,
        rotationY: -90,
        duration: timings.turn,
        ease: BOOK_TRANSIT_EASES.turn,
      },
      "turn",
    )
    .to(parts.hiddenFaces, { opacity: 1, duration: timings.turn * 0.3, ease: "power1.out" }, `turn+=${timings.turn * 0.3}`)
    .fromTo(parts.backdrop, { opacity: 0 }, { opacity: 1, duration: timings.turn * 0.8, ease: "power1.inOut" }, "pull")
    .fromTo(parts.spineShade, { opacity: 0 }, { opacity: 0.6, duration: timings.turn, ease: "power1.in" }, "turn")
    .fromTo(parts.coverShade, { opacity: 0.55 }, { opacity: 0, duration: timings.turn, ease: "power1.out" }, "turn")
    .fromTo(parts.sheen, { opacity: 0 }, { opacity: 0.45, duration: timings.turn * 0.5, ease: "sine.in" }, "turn+=0.15")
    .to(parts.sheen, { opacity: 0, duration: timings.turn * 0.45, ease: "sine.out" }, `turn+=${0.15 + timings.turn * 0.5}`)
    .addLabel("open", `turn+=${timings.turn - 0.08}`)
    .to(parts.cover, { rotationY: BOOK_TRANSIT_OPEN_DEGREES, duration: timings.open, ease: BOOK_TRANSIT_EASES.open }, "open")
    .fromTo(parts.insideShade, { opacity: 0.45 }, { opacity: 0.08, duration: timings.open, ease: "power1.out" }, "open")
    .call(goToPage, [], `open+=${timings.open * 0.35}`);
  if (geometry.isSpreadCentred) {
    timeline.to(
      parts.book,
      { x: geometry.travelX + geometry.width / 2, duration: timings.open, ease: BOOK_TRANSIT_EASES.open },
      "open",
    );
  }

  return new Promise((resolve) => {
    let isFinishing = false;

    function cleanUp(): void {
      root?.removeEventListener("click", skip);
      document.removeEventListener("keydown", skipOnEscape);
      root?.replaceChildren();
      root?.removeAttribute("data-active");
      gsap.set(root, { clearProps: "opacity" });
      gsap.set([spine, ...leaningNeighbours], { clearProps: "transform,opacity,visibility,transformOrigin" });
      // The link that started this is now on a hidden page; reading resumes at the book.
      if (!document.activeElement || document.activeElement === document.body || link.contains(document.activeElement)) {
        document.getElementById("main")?.focus({ preventScroll: true });
      }
      resolve();
    }

    // Once the page is there, the book comes on toward the reader as it fades into it.
    async function revealPage(revealDuration: number): Promise<void> {
      if (isFinishing) return;
      isFinishing = true;
      goToPage();
      await waitForPage(link.pathname);
      gsap
        .timeline({ onComplete: cleanUp })
        .to(parts.book, { z: `+=${geometry.height * 0.35}`, duration: revealDuration, ease: BOOK_TRANSIT_EASES.reveal }, 0)
        .to(root, { opacity: 0, duration: revealDuration, ease: "power1.in" }, 0);
    }

    function skip(): void {
      timeline.kill();
      void revealPage(timings.reveal / 2);
    }

    function skipOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") skip();
    }

    root.addEventListener("click", skip);
    document.addEventListener("keydown", skipOnEscape);
    timeline.eventCallback("onComplete", () => void revealPage(timings.reveal));
  });
}
