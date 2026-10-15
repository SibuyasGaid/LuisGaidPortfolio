import {
  ACESFilmicToneMapping,
  Color,
  FogExp2,
  HemisphereLight,
  type Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Points,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Sprite,
  type Texture,
  Vector2,
  WebGLRenderer,
} from "three";
import type { BookId } from "@/content/portfolio";
import { buildBooks } from "@/lib/library/webgl/buildBooks";
import { buildLibraryRoom, getShelfRuns } from "@/lib/library/webgl/buildLibraryRoom";
import { buildTitledBooks, dressTitledBook, reserveTitledSlots, type TitledBook } from "@/lib/library/webgl/buildTitledBooks";
import { createLibraryTextures, type LibraryTextures } from "@/lib/library/webgl/createLibraryTextures";
import { createTitledFaceTexture, createTitledSpineAtlas, describeTitledBooks, loadCanvasFonts } from "@/lib/library/webgl/createTitledBookArt";
import { chooseShelfReference, getCoverFieldOfView } from "@/lib/library/shelfFraming";
import { getLampPositions, type ShelfPose } from "@/lib/library/webgl/libraryLayout";
import { poseCamera, type WalkState } from "@/lib/library/webgl/walkCamera";
import { createSeededRandom } from "@/lib/random/seededRandom";

// The library in WebGL, shared by the intro's walk and the home page. It is
// built in stages that each yield to the browser, so the page stays
// responsive while the welcome screen shows progress, and its shaders compile
// in parallel where the browser allows.

/** How much detail the device gets: pixel density, antialiasing, lamps that cast light, dust. */
export interface RenderQuality {
  readonly maxPixelRatio: number;
  /** The floor that adaptive resolution may drop to on a struggling device. */
  readonly minPixelRatio: number;
  readonly antialias: boolean;
  /** How many of the lamps nearest the camera cast real light at once; the rest only glow. */
  readonly castingLamps: number;
  readonly dustCount: number;
}

export interface LibraryScene {
  readonly canvas: HTMLCanvasElement;
  readonly camera: PerspectiveCamera;
  readonly titledBooks: readonly TitledBook[];
  /** Where the camera stands to show the grand bookcase on the screen as it is now. */
  getShelfPose(): ShelfPose;
  /** Draws the walk at one moment. */
  renderWalk(state: WalkState): void;
  /**
   * Draws from wherever the camera has been put. Pass isEveryFrame when
   * drawing on every animation frame, so slow frames can lower the resolution.
   */
  render(elapsed: number, isEveryFrame: boolean): void;
  /** Paints a book's cover and title page, ready for it to leave the shelf. */
  dressBook(bookId: BookId): void;
  /** The titled book under a point on the screen, if any. */
  pickBook(clientX: number, clientY: number): TitledBook | null;
  /** Called after the canvas follows a change in the window's size. */
  onResize(listener: () => void): () => void;
  dispose(): void;
}

const SCENE_SEED = 7;
const AMBIENCE = "#0b0705";
const LAMP_LIGHT = {
  colour: "#ffcf9c",
  intensity: 8,
  /** How far ahead of the camera, and behind it, a lamp still casts light, in metres. */
  reachAhead: 13,
  reachBehind: 4,
} as const;
const ADAPTIVE_RESOLUTION = { slowFrameMs: 28, patienceFrames: 12, step: 0.25 } as const;
const EXPOSURE = 1.25;

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// A cool, dim fill: shadows lean blue against the lamps' warmth, which keeps
// the bookcloth's own colours readable instead of everything turning amber.
function addAmbientLight(scene: Scene): void {
  scene.add(new HemisphereLight("#323646", "#0a0705", 0.85));
}

function smoothstep(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Every lamp glows, but only the few nearest the camera cast real light: a
 * small fixed set of lights follows the camera from lamp to lamp. Each fades
 * with distance, so a lamp's light swells as it comes into range rather than
 * switching on, and lamps far down the aisle are lost in the fog anyway.
 * Picture lights fall off more gently, washing down the bookcase.
 */
function createLampLightRig(scene: Scene, count: number): (cameraX: number, cameraZ: number) => void {
  const lamps = getLampPositions();
  const lights = Array.from({ length: count }, () => {
    const light = new PointLight(LAMP_LIGHT.colour, 0, 0, 2);
    scene.add(light);
    return light;
  });
  return (cameraX, cameraZ) => {
    const ranked = lamps
      .map((lamp) => {
        const ahead = cameraZ - lamp.z;
        const fadeIn = 1 - smoothstep((ahead - LAMP_LIGHT.reachAhead * 0.6) / (LAMP_LIGHT.reachAhead * 0.4));
        const fadeOut = smoothstep((ahead + LAMP_LIGHT.reachBehind) / LAMP_LIGHT.reachBehind);
        const weight = fadeIn * fadeOut;
        return { lamp, weight, score: (weight * lamp.strength) / (1 + 0.3 * Math.abs(lamp.x - cameraX)) };
      })
      .sort((first, second) => second.score - first.score);
    lights.forEach((light, index) => {
      const entry = ranked[index];
      if (!entry || entry.weight <= 0) {
        light.intensity = 0;
        return;
      }
      const isPendant = entry.lamp.kind === "pendant";
      light.position.set(entry.lamp.x, entry.lamp.y - (isPendant ? 0.17 : 0), entry.lamp.z);
      light.decay = isPendant ? 2 : 1;
      light.intensity = LAMP_LIGHT.intensity * entry.lamp.strength * entry.weight;
    });
  };
}

/**
 * Lowers the resolution while frames run slow, so a weaker device keeps a
 * smooth walk at a softer image rather than a sharp, stuttering one.
 */
function createResolutionGovernor(renderer: WebGLRenderer, quality: RenderQuality): (isEveryFrame: boolean) => void {
  let pixelRatio = renderer.getPixelRatio();
  let lastFrame = 0;
  let slowFrames = 0;
  return (isEveryFrame) => {
    const now = performance.now();
    const frameMs = lastFrame && isEveryFrame ? now - lastFrame : 0;
    lastFrame = now;
    slowFrames = frameMs > ADAPTIVE_RESOLUTION.slowFrameMs ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames < ADAPTIVE_RESOLUTION.patienceFrames || pixelRatio <= quality.minPixelRatio) return;
    pixelRatio = Math.max(quality.minPixelRatio, pixelRatio - ADAPTIVE_RESOLUTION.step);
    renderer.setPixelRatio(pixelRatio);
    slowFrames = 0;
  };
}

function disposeObject(object: Object3D): void {
  if (object instanceof Mesh || object instanceof Points || object instanceof Sprite) {
    object.geometry.dispose();
    const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  }
}

function disposeTextures(textures: LibraryTextures): void {
  for (const texture of Object.values(textures) as Texture[]) texture.dispose();
}

export async function createLibraryScene(
  host: HTMLElement,
  quality: RenderQuality,
  onProgress: (share: number) => void,
): Promise<LibraryScene> {
  const renderer = new WebGLRenderer({ antialias: quality.antialias, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.setClearColor(AMBIENCE);
  host.prepend(renderer.domElement);
  try {
    return await buildScene(renderer, quality, onProgress);
  } catch (error) {
    // A half-built library gives its context back rather than holding the GPU.
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    throw error;
  }
}

async function buildScene(renderer: WebGLRenderer, quality: RenderQuality, onProgress: (share: number) => void): Promise<LibraryScene> {
  onProgress(0.1);
  await yieldToBrowser();

  const [textures, fonts] = await Promise.all([Promise.resolve(createLibraryTextures()), loadCanvasFonts()]);
  const titledArt = describeTitledBooks();
  const spineAtlas = createTitledSpineAtlas(titledArt, fonts);
  onProgress(0.3);
  await yieldToBrowser();

  const random = createSeededRandom(SCENE_SEED);
  const runs = getShelfRuns(reserveTitledSlots(titledArt));
  const scene = new Scene();
  scene.background = new Color(AMBIENCE);
  scene.fog = new FogExp2(AMBIENCE, 0.052);
  const room = buildLibraryRoom(textures, {
    anisotropy: renderer.capabilities.getMaxAnisotropy(),
    dustCount: quality.dustCount,
    random,
    runs,
  });
  scene.add(room.group);
  addAmbientLight(scene);
  const lightLamps = createLampLightRig(scene, quality.castingLamps);
  onProgress(0.45);
  await yieldToBrowser();

  // Bookcloth: the atlas shades each spine, the gilt map tools it in gold.
  const bookMaterial = new MeshStandardMaterial({
    map: textures.spineBase,
    emissiveMap: textures.spineGilt,
    emissive: "#c9a24e",
    emissiveIntensity: 0.32,
    roughness: 0.8,
    metalness: 0,
  });
  for (const books of buildBooks(runs, bookMaterial, random)) scene.add(books);
  const grandBookcase = runs[runs.length - 1];
  const titledBooks = grandBookcase ? buildTitledBooks(grandBookcase, titledArt, spineAtlas) : [];
  for (const book of titledBooks) scene.add(book.group);
  onProgress(0.7);
  await yieldToBrowser();

  const aspectRatio = () => window.innerWidth / window.innerHeight;
  // Framed exactly as the poster of this view is cropped, so the two line up.
  const reference = () => chooseShelfReference(aspectRatio());
  const camera = new PerspectiveCamera(getCoverFieldOfView(reference(), aspectRatio()), aspectRatio(), 0.05, 60);
  let shelfPose = reference().pose;
  poseCamera(camera, { progress: 0, stride: 0, elapsed: 0 }, shelfPose);
  lightLamps(camera.position.x, camera.position.z);
  await renderer.compileAsync(scene, camera);
  onProgress(0.9);
  await yieldToBrowser();

  // One frame now uploads every texture and buffer, so the walk starts smoothly.
  renderer.render(scene, camera);
  onProgress(1);

  const resizeListeners = new Set<() => void>();
  function resize(): void {
    camera.aspect = aspectRatio();
    camera.fov = getCoverFieldOfView(reference(), camera.aspect);
    camera.updateProjectionMatrix();
    shelfPose = reference().pose;
    renderer.setSize(window.innerWidth, window.innerHeight);
    for (const listener of resizeListeners) listener();
  }
  window.addEventListener("resize", resize);
  const governResolution = createResolutionGovernor(renderer, quality);

  function draw(elapsed: number, isEveryFrame: boolean): void {
    governResolution(isEveryFrame);
    lightLamps(camera.position.x, camera.position.z);
    room.dust.position.y = Math.sin(elapsed * 0.25) * 0.04;
    room.dust.rotation.y = elapsed * 0.002;
    renderer.render(scene, camera);
  }

  const faceTextures = new Map<BookId, Texture>();
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  return {
    canvas: renderer.domElement,
    camera,
    titledBooks,
    getShelfPose: () => shelfPose,
    renderWalk(state) {
      poseCamera(camera, state, shelfPose);
      draw(state.elapsed, true);
    },
    render: draw,
    dressBook(bookId) {
      const book = titledBooks.find((candidate) => candidate.bookId === bookId);
      if (!book || faceTextures.has(bookId)) return;
      const texture = createTitledFaceTexture(book.art, fonts);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      faceTextures.set(bookId, texture);
      dressTitledBook(book, texture);
      renderer.initTexture(texture);
    },
    pickBook(clientX, clientY) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((clientX - bounds.left) / bounds.width) * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(
        titledBooks.map((book) => book.group),
        true,
      );
      return hit ? (titledBooks.find((book) => book.group === hit.object.parent || book.group === hit.object.parent?.parent) ?? null) : null;
    },
    onResize(listener) {
      resizeListeners.add(listener);
      return () => resizeListeners.delete(listener);
    },
    dispose() {
      window.removeEventListener("resize", resize);
      resizeListeners.clear();
      scene.traverse(disposeObject);
      disposeTextures(textures);
      spineAtlas.dispose();
      for (const texture of faceTextures.values()) texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
