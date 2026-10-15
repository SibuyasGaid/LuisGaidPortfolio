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
  Scene,
  SRGBColorSpace,
  Sprite,
  type Texture,
  WebGLRenderer,
} from "three";
import { buildBooks } from "@/lib/intro/webgl/buildBooks";
import { buildLibraryRoom, getShelfRuns } from "@/lib/intro/webgl/buildLibraryRoom";
import { createLibraryTextures, type LibraryTextures } from "@/lib/intro/webgl/createLibraryTextures";
import { CAMERA_PATH, getLampPositions } from "@/lib/intro/webgl/libraryLayout";
import { poseCamera, type WalkState } from "@/lib/intro/webgl/walkCamera";
import { createSeededRandom } from "@/lib/random/seededRandom";

// The intro's library in WebGL. It is built in stages that each yield to the
// browser, so the page stays responsive while the welcome screen shows
// progress, and its shaders compile in parallel where the browser allows.

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
  render(state: WalkState): void;
  dispose(): void;
}

const SCENE_SEED = 7;
const AMBIENCE = "#0b0705";
const LAMP_LIGHT = {
  colour: "#ffcf9c",
  intensity: 8,
  roomStrength: 3.6,
  /** How far ahead of the camera, and behind it, a lamp still casts light, in metres. */
  reachAhead: 13,
  reachBehind: 4,
} as const;
const ADAPTIVE_RESOLUTION = { slowFrameMs: 28, patienceFrames: 12, step: 0.25 } as const;
const EXPOSURE = 1.25;

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Wider on tall portrait screens, so a phone still sees down the aisle.
function chooseFieldOfView(aspectRatio: number): number {
  const { landscape, portrait } = CAMERA_PATH.fieldOfView;
  const share = Math.min(1, Math.max(0, (1.3 - aspectRatio) / (1.3 - 0.5)));
  return landscape + (portrait - landscape) * share;
}

// A cool, dim fill: shadows lean blue against the lamps' warmth, which keeps
// the bookcloth's own colours readable instead of everything turning amber.
function addAmbientLight(scene: Scene): void {
  scene.add(new HemisphereLight("#323646", "#0a0705", 0.85));
}

/**
 * Every lamp glows, but only the few nearest the walker cast real light: a
 * small fixed set of lights follows the camera from lamp to lamp. Each fades
 * with distance, so a lamp's light swells as it comes into range rather than
 * switching on, and lamps far down the aisle are lost in the fog anyway.
 */
function createLampLightRig(scene: Scene, count: number): (cameraZ: number) => void {
  const lamps = getLampPositions().map((lamp, index, all) => ({
    ...lamp,
    strength: index === all.length - 1 ? LAMP_LIGHT.roomStrength : 1,
  }));
  const lights = Array.from({ length: count }, () => {
    const light = new PointLight(LAMP_LIGHT.colour, 0, 0, 2);
    scene.add(light);
    return light;
  });
  return (cameraZ) => {
    const ranked = lamps
      .map((lamp) => {
        const ahead = cameraZ - lamp.z;
        const fadeIn = 1 - smoothstep((ahead - LAMP_LIGHT.reachAhead * 0.6) / (LAMP_LIGHT.reachAhead * 0.4));
        const fadeOut = smoothstep((ahead + LAMP_LIGHT.reachBehind) / LAMP_LIGHT.reachBehind);
        return { lamp, weight: fadeIn * fadeOut };
      })
      .sort((first, second) => second.weight - first.weight);
    lights.forEach((light, index) => {
      const entry = ranked[index];
      if (!entry || entry.weight <= 0) {
        light.intensity = 0;
        return;
      }
      light.position.set(entry.lamp.x, entry.lamp.y - 0.17, entry.lamp.z);
      light.intensity = LAMP_LIGHT.intensity * entry.lamp.strength * entry.weight;
    });
  };
}

function smoothstep(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Lowers the resolution while frames run slow, so a weaker device keeps a
 * smooth walk at a softer image rather than a sharp, stuttering one.
 */
function createResolutionGovernor(renderer: WebGLRenderer, quality: RenderQuality): () => void {
  let pixelRatio = renderer.getPixelRatio();
  let lastFrame = 0;
  let slowFrames = 0;
  return () => {
    const now = performance.now();
    const frameMs = lastFrame ? now - lastFrame : 0;
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
  onProgress(0.1);
  await yieldToBrowser();

  const textures = createLibraryTextures();
  onProgress(0.3);
  await yieldToBrowser();

  const random = createSeededRandom(SCENE_SEED);
  const scene = new Scene();
  scene.background = new Color(AMBIENCE);
  scene.fog = new FogExp2(AMBIENCE, 0.052);
  const room = buildLibraryRoom(textures, {
    anisotropy: renderer.capabilities.getMaxAnisotropy(),
    dustCount: quality.dustCount,
    random,
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
  for (const books of buildBooks(getShelfRuns(), bookMaterial, random)) scene.add(books);
  onProgress(0.7);
  await yieldToBrowser();

  const camera = new PerspectiveCamera(chooseFieldOfView(window.innerWidth / window.innerHeight), window.innerWidth / window.innerHeight, 0.05, 60);
  poseCamera(camera, { progress: 0, stride: 0, elapsed: 0 });
  lightLamps(camera.position.z);
  await renderer.compileAsync(scene, camera);
  onProgress(0.9);
  await yieldToBrowser();

  // One frame now uploads every texture and buffer, so the walk starts smoothly.
  renderer.render(scene, camera);
  onProgress(1);

  function resize(): void {
    const aspectRatio = window.innerWidth / window.innerHeight;
    camera.aspect = aspectRatio;
    camera.fov = chooseFieldOfView(aspectRatio);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", resize);
  const governResolution = createResolutionGovernor(renderer, quality);

  return {
    canvas: renderer.domElement,
    render(state) {
      governResolution();
      poseCamera(camera, state);
      lightLamps(camera.position.z);
      room.dust.position.y = Math.sin(state.elapsed * 0.25) * 0.04;
      room.dust.rotation.y = state.elapsed * 0.002;
      renderer.render(scene, camera);
    },
    dispose() {
      window.removeEventListener("resize", resize);
      scene.traverse(disposeObject);
      disposeTextures(textures);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
