import { Box3, Matrix4, Quaternion, Vector3, type Mesh } from "three";
import type { BookId } from "@/content/portfolio";
import { TITLED_SPINE_GLOW, type TitledBook } from "@/lib/library/webgl/buildTitledBooks";
import type { LibraryScene } from "@/lib/library/webgl/createLibraryScene";
import { TITLED_BOOK } from "@/lib/library/webgl/libraryLayout";
import {
  MOVE_HURRY_TIME_SCALE,
  SHELF_IDLE_AFTER_MS,
  SHELF_PARALLAX,
  SHELF_REST_AFTER_MS,
  SHELF_PREVIEW,
  SHELF_TAKE,
  SHELF_TAKE_TIMINGS,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";
import type { OpenSpread, ScreenBox } from "@/lib/shelf/openSpread";
import { playCue } from "@/lib/sound/sound";

// The view of the grand bookcase. The camera rests where the walk ended and
// drifts a little with the pointer; a book named in the navbar slides forward
// and lights up; a book chosen is taken off the shelf, turned to show its
// cover, brought up to the reader and opened, all in the scene, where the
// page turn takes over from it; a book left is handed back open, closed,
// turned and slid back into its slot. It draws only while it is shown and
// the page is visible, and only as often as it needs to.

export interface ShelfView {
  /**
   * Starts drawing the shelf, and keeps drawing while anything moves. With
   * glide, a camera left elsewhere (a walk cut short) travels to the bookcase.
   */
  start(options?: { readonly glide?: boolean }): void;
  stop(): void;
  /** Slides a book forward to show where it is, or puts every book back with null. */
  preview(bookId: BookId | null): void;
  /**
   * Takes a book off the shelf and opens it. onOpen is called as the cover
   * opens, when its page should load; the promise settles once it lies open.
   */
  take(bookId: BookId, onOpen: () => void): Promise<void>;
  /** Shows a book lying open before the reader, as a take leaves it: where putting it back starts. */
  showOpen(bookId: BookId): void;
  /** Where the open book's two pages lie on screen, or null with no book out. */
  measureOpen(): OpenSpread | null;
  /** Hides the open book while the page turn's copy of it stands in, or shows it again; drawn at once. */
  setOpenBookShown(isShown: boolean): void;
  /** Closes the open book and slides it back into its slot as the camera steps back. */
  putBack(): Promise<void>;
  /** Hurries a book being taken to the moment its page loads, or one being put back into its slot. */
  hurry(): void;
  /** Puts every book back and the camera at rest, at once (while out of sight). */
  reset(): void;
  dispose(): void;
}

interface BookMotion {
  preview: number;
}

interface TakeMotion {
  readonly book: TitledBook;
  /** Out: coming off the shelf; back: returning to it. */
  direction: "out" | "back";
  timeline: gsap.core.Timeline | null;
  readonly state: { pull: number; turn: number; open: number; camera: number };
  readonly cameraPosition: Vector3;
  readonly cameraTarget: Vector3;
  readonly readingPoint: Vector3;
  readonly facing: Quaternion;
  /** Along the camera's right, how far the book moves as it opens, so the spread is centred. */
  readonly openShift: Vector3;
}

interface Glide {
  readonly from: Vector3;
  readonly fromTarget: Vector3;
  readonly state: { progress: number };
}

const UP = new Vector3(0, 1, 0);
const LOCAL_X = new Vector3(1, 0, 0);
/** Further than this from where it rests (the walk was skipped), the camera glides there rather than cutting. */
const GLIDE_FROM_METRES = 0.5;
/** Below this, the parallax counts as settled. */
const SETTLED = 0.0004;

const corner = new Vector3();

/** The box on screen (the canvas fills the window, shown or not) around one face of a box-shaped mesh: the face at the given end of its local x. */
function projectFace(mesh: Mesh, camera: LibraryScene["camera"], side: "min" | "max"): ScreenBox {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox ?? new Box3();
  const x = side === "min" ? bounds.min.x : bounds.max.x;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const y of [bounds.min.y, bounds.max.y]) {
    for (const z of [bounds.min.z, bounds.max.z]) {
      corner.set(x, y, z).applyMatrix4(mesh.matrixWorld).project(camera);
      const screenX = ((corner.x + 1) / 2) * window.innerWidth;
      const screenY = ((1 - corner.y) / 2) * window.innerHeight;
      left = Math.min(left, screenX);
      right = Math.max(right, screenX);
      top = Math.min(top, screenY);
      bottom = Math.max(bottom, screenY);
    }
  }
  return { left, top, width: right - left, height: bottom - top };
}

/** How far in front of the camera the book comes, and whether its open spread fits centred there. */
function measureReading(camera: { fov: number; aspect: number }, book: TitledBook): { distance: number; isSpreadCentred: boolean } {
  const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
  const heightFit = book.art.height / (SHELF_TAKE.heightShare * 2 * tanHalf);
  const across = SHELF_TAKE.spreadWidthShare * 2 * tanHalf * camera.aspect;
  const spreadFit = (TITLED_BOOK.depth * 2) / across;
  const isSpreadCentred = spreadFit <= heightFit;
  return { distance: Math.max(heightFit, isSpreadCentred ? spreadFit : TITLED_BOOK.depth / across), isSpreadCentred };
}

export function createShelfView(scene: LibraryScene, options: { readonly isMotionAllowed: boolean }): ShelfView {
  const { camera } = scene;
  const rest = { position: new Vector3(), target: new Vector3() };
  const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const motions = new Map<BookId, BookMotion>(scene.titledBooks.map((book) => [book.bookId, { preview: 0 }]));
  const startedAt = performance.now();
  let take: TakeMotion | null = null;
  let glide: Glide | null = null;
  let frame = 0;
  let tick = 0;
  let lastActivity = startedAt;
  let needsDraw = true;
  let isRunning = false;

  function readRest(): void {
    const pose = scene.getShelfPose();
    rest.position.set(pose.position.x, pose.position.y, pose.position.z);
    rest.target.set(pose.target.x, pose.target.y, pose.target.z);
    needsDraw = true;
  }
  readRest();
  const stopFollowingResize = scene.onResize(readRest);

  const position = new Vector3();
  const target = new Vector3();
  function poseCamera(): void {
    position.set(rest.position.x + parallax.x, rest.position.y + parallax.y, rest.position.z);
    target.copy(rest.target);
    if (take) {
      position.lerp(take.cameraPosition, take.state.camera);
      target.lerp(take.cameraTarget, take.state.camera);
    }
    if (glide) {
      position.lerpVectors(glide.from, position, glide.state.progress);
      target.lerpVectors(glide.fromTarget, target, glide.state.progress);
    }
    camera.position.copy(position);
    camera.lookAt(target);
  }

  const tipped = new Quaternion();
  const tip = new Quaternion();
  const pulled = new Vector3();
  function placeBooks(): void {
    for (const book of scene.titledBooks) {
      const motion = motions.get(book.bookId);
      if (!motion) continue;
      book.spineMaterial.emissiveIntensity = TITLED_SPINE_GLOW + (SHELF_PREVIEW.glow - TITLED_SPINE_GLOW) * motion.preview;
      if (take?.book === book) continue;
      book.group.position.copy(book.restPosition).addScaledVector(book.out, SHELF_PREVIEW.distance * motion.preview);
      tip.setFromAxisAngle(LOCAL_X, SHELF_PREVIEW.tipRadians * motion.preview);
      book.group.quaternion.copy(book.restQuaternion).multiply(tip);
    }
    if (!take) return;
    const { book, state } = take;
    const preview = motions.get(book.bookId)?.preview ?? 0;
    const startOut = SHELF_PREVIEW.distance * preview;
    pulled.copy(book.restPosition).addScaledVector(book.out, startOut + (SHELF_TAKE.pullDistance - startOut) * state.pull);
    book.group.position.copy(pulled).lerp(take.readingPoint, state.turn).addScaledVector(take.openShift, state.open);
    const startTip = SHELF_PREVIEW.tipRadians * preview;
    tip.setFromAxisAngle(LOCAL_X, (startTip + (SHELF_TAKE.tipRadians - startTip) * state.pull) * (1 - state.turn));
    tipped.copy(book.restQuaternion).multiply(tip);
    book.group.quaternion.copy(tipped).slerp(take.facing, state.turn);
    book.coverHinge.rotation.y = SHELF_TAKE.openRadians * state.open;
  }

  function followParallax(): boolean {
    const deltaX = parallax.targetX - parallax.x;
    const deltaY = parallax.targetY - parallax.y;
    if (Math.abs(deltaX) < SETTLED && Math.abs(deltaY) < SETTLED) return false;
    parallax.x += deltaX * SHELF_PARALLAX.follow;
    parallax.y += deltaY * SHELF_PARALLAX.follow;
    return true;
  }

  function isAnimating(): boolean {
    if (take?.timeline?.isActive() || glide) return true;
    for (const motion of motions.values()) if (gsap.isTweening(motion)) return true;
    return false;
  }

  // Every frame while something moves; otherwise the dust drifts on at half
  // the frame rate for a while, then the scene holds still, drawing nothing
  // (and costing nothing) until something moves again. With reduced motion
  // nothing is drawn until needed.
  function drawFrame(): void {
    frame = requestAnimationFrame(drawFrame);
    const now = performance.now();
    const isParallaxMoving = options.isMotionAllowed && followParallax();
    const isMoving = isAnimating() || isParallaxMoving;
    if (isMoving) lastActivity = now;
    const isAtRest = !options.isMotionAllowed || now - lastActivity > SHELF_REST_AFTER_MS;
    if (isAtRest && !isMoving && !needsDraw) return;
    const isIdle = now - lastActivity > SHELF_IDLE_AFTER_MS;
    tick += 1;
    if (isIdle && tick % 2 === 1 && !needsDraw) return;
    poseCamera();
    placeBooks();
    scene.render(options.isMotionAllowed ? (now - startedAt) / 1000 : 0, !isIdle);
    needsDraw = false;
  }

  function followPointer(event: PointerEvent): void {
    if (event.pointerType !== "mouse" || take) return;
    lastActivity = performance.now();
    parallax.targetX = ((event.clientX / window.innerWidth) * 2 - 1) * SHELF_PARALLAX.x;
    parallax.targetY = -((event.clientY / window.innerHeight) * 2 - 1) * SHELF_PARALLAX.y;
  }

  function pauseWhileHidden(): void {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (isRunning && !frame) {
      needsDraw = true;
      frame = requestAnimationFrame(drawFrame);
    }
  }

  // Where the camera steps to, where the book comes to before the reader, and
  // how it faces them, worked out from where the camera rests.
  function planTake(book: TitledBook): TakeMotion {
    const front = book.restPosition.clone().addScaledVector(book.out, 1.1).addScaledVector(UP, 0.08);
    const cameraPosition = rest.position.clone().lerp(front, SHELF_TAKE.approachShare);
    const cameraTarget = book.restPosition.clone();
    const forward = cameraTarget.clone().sub(cameraPosition).normalize();
    const right = forward.clone().cross(UP).normalize();
    const reading = measureReading(camera, book);
    const readingPoint = cameraPosition.clone().addScaledVector(forward, reading.distance);
    // Cover toward the reader, head up, spine to the left.
    const coverNormal = forward.clone().negate();
    const up = UP.clone().addScaledVector(coverNormal, -UP.dot(coverNormal)).normalize();
    const facing = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(coverNormal, up, coverNormal.clone().cross(up)));
    const openShift = reading.isSpreadCentred ? right.multiplyScalar(TITLED_BOOK.depth / 2) : new Vector3();

    const state = { pull: 0, turn: 0, open: 0, camera: 0 };
    return { book, direction: "out", timeline: null, state, cameraPosition, cameraTarget, readingPoint, facing, openShift };
  }

  function playOut(motion: TakeMotion, onOpen: () => void, done: () => void): void {
    const { state } = motion;
    const timings = SHELF_TAKE_TIMINGS;
    motion.direction = "out";
    motion.timeline = gsap
      .timeline({ onComplete: done })
      .call(playCue, ["bookSlide", { duration: timings.pull }], 0)
      .call(playCue, ["bookTurn", { duration: timings.turn }], timings.turnAt)
      .call(playCue, ["coverOpen", { duration: timings.open }], timings.openAt)
      .to(state, { pull: 1, duration: timings.pull, ease: "power2.out" }, 0)
      .to(state, { camera: 1, duration: timings.approach, ease: "power2.inOut" }, 0)
      .to(state, { turn: 1, duration: timings.turn, ease: "power3.inOut" }, timings.turnAt)
      .to(state, { open: 1, duration: timings.open, ease: "power2.inOut" }, timings.openAt)
      .call(onOpen, [], timings.openAt + timings.open * timings.navigateShare);
  }

  // The take in reverse: the cover closes, the book turns its spine to the
  // shelf on its way back, slides home, and the camera steps back to rest.
  function playBack(motion: TakeMotion, done: () => void): void {
    const { state } = motion;
    const timings = SHELF_TAKE_TIMINGS;
    const turnAt = timings.open * 0.8;
    const pushAt = turnAt + timings.turn - 0.1;
    motion.direction = "back";
    motion.timeline = gsap
      .timeline({ onComplete: done })
      .call(playCue, ["coverClose", { duration: timings.open }], 0)
      .call(playCue, ["bookTurn", { duration: timings.turn }], turnAt)
      .call(playCue, ["bookHome", { duration: timings.pull }], pushAt)
      .to(state, { open: 0, duration: timings.open, ease: "power2.inOut" }, 0)
      .to(state, { turn: 0, duration: timings.turn, ease: "power3.inOut" }, turnAt)
      .to(state, { pull: 0, duration: timings.pull, ease: "power2.inOut" }, pushAt)
      .to(state, { camera: 0, duration: pushAt + timings.pull, ease: "power2.inOut" }, 0);
  }

  function resetBooks(): void {
    for (const book of scene.titledBooks) {
      book.group.visible = true;
      book.group.position.copy(book.restPosition);
      book.group.quaternion.copy(book.restQuaternion);
      book.coverHinge.rotation.y = 0;
    }
    for (const motion of motions.values()) {
      gsap.killTweensOf(motion);
      motion.preview = 0;
    }
  }

  function stop(): void {
    isRunning = false;
    cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("pointermove", followPointer);
    document.removeEventListener("visibilitychange", pauseWhileHidden);
  }

  // Wherever the camera was left (part way down the aisle, if the walk was
  // skipped), it travels on to the grand bookcase instead of jumping there.
  function glideToRest(): void {
    const distance = camera.position.distanceTo(rest.position);
    if (distance < GLIDE_FROM_METRES || !options.isMotionAllowed) return;
    const from = camera.position.clone();
    const fromTarget = from.clone().add(camera.getWorldDirection(new Vector3()).multiplyScalar(6));
    const state = { progress: 0 };
    glide = { from, fromTarget, state };
    gsap.to(state, {
      progress: 1,
      duration: Math.min(1.8, Math.max(0.9, distance / 12)),
      ease: "power2.inOut",
      onComplete: () => {
        glide = null;
      },
    });
  }

  return {
    start(startOptions) {
      if (isRunning) return;
      isRunning = true;
      needsDraw = true;
      if (startOptions?.glide) glideToRest();
      window.addEventListener("pointermove", followPointer, { passive: true });
      document.addEventListener("visibilitychange", pauseWhileHidden);
      if (!document.hidden) frame = requestAnimationFrame(drawFrame);
    },
    stop,
    preview(bookId) {
      if (take) return;
      if (bookId) scene.dressBook(bookId);
      for (const [id, motion] of motions) {
        gsap.to(motion, {
          preview: id === bookId ? 1 : 0,
          duration: options.isMotionAllowed ? SHELF_PREVIEW.seconds : 0,
          ease: "power2.out",
          overwrite: true,
        });
      }
      needsDraw = true;
    },
    take(bookId, onOpen) {
      const book = scene.titledBooks.find((candidate) => candidate.bookId === bookId);
      if (!book || take) {
        onOpen();
        return Promise.resolve();
      }
      scene.dressBook(bookId);
      parallax.targetX = parallax.x;
      parallax.targetY = parallax.y;
      const motion = planTake(book);
      take = motion;
      return new Promise((resolve) => playOut(motion, onOpen, resolve));
    },
    showOpen(bookId) {
      const book = scene.titledBooks.find((candidate) => candidate.bookId === bookId);
      if (!book) return;
      take?.timeline?.kill();
      resetBooks();
      scene.dressBook(bookId);
      parallax.x = parallax.targetX = 0;
      parallax.y = parallax.targetY = 0;
      const motion = planTake(book);
      Object.assign(motion.state, { pull: 1, turn: 1, open: 1, camera: 1 });
      take = motion;
      needsDraw = true;
    },
    measureOpen() {
      if (!take) return null;
      const cover = take.book.coverHinge.children[0];
      if (!cover || !("geometry" in cover)) return null;
      poseCamera();
      placeBooks();
      camera.updateMatrixWorld();
      take.book.group.updateMatrixWorld(true);
      return {
        // The cover's inside faces its local -x; the title page is the page block's +x face.
        left: projectFace(cover as Mesh, camera, "min"),
        right: projectFace(take.book.block, camera, "max"),
      };
    },
    setOpenBookShown(isShown) {
      if (!take) return;
      take.book.group.visible = isShown;
      poseCamera();
      placeBooks();
      scene.render(options.isMotionAllowed ? (performance.now() - startedAt) / 1000 : 0, true);
      needsDraw = false;
    },
    putBack() {
      const motion = take;
      if (!motion) return Promise.resolve();
      motion.timeline?.kill();
      return new Promise((resolve) =>
        playBack(motion, () => {
          if (take === motion) take = null;
          needsDraw = true;
          resolve();
        }),
      );
    },
    hurry() {
      take?.timeline?.timeScale(MOVE_HURRY_TIME_SCALE);
    },
    reset() {
      take?.timeline?.kill();
      take = null;
      resetBooks();
      parallax.x = parallax.targetX = 0;
      parallax.y = parallax.targetY = 0;
      needsDraw = true;
    },
    dispose() {
      stop();
      take?.timeline?.kill();
      take = null;
      if (glide) gsap.killTweensOf(glide.state);
      glide = null;
      for (const motion of motions.values()) gsap.killTweensOf(motion);
      stopFollowingResize();
    },
  };
}
