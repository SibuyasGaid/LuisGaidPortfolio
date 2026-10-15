import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import type { LibraryTextures } from "@/lib/intro/webgl/createLibraryTextures";
import type { ShelfRun } from "@/lib/intro/webgl/buildBooks";
import {
  AISLE,
  CAMERA_PATH,
  END_BOOKCASE,
  getLampPositions,
  ROOM,
  ROOM_CEILING_HEIGHT,
  SHELVING,
} from "@/lib/intro/webgl/libraryLayout";
import { pickBetween, type Random } from "@/lib/random/seededRandom";

// The library's architecture: shelving carcasses, floor and runner, beamed
// ceiling, panelled walls, the reading room's windows, the brass lamps and the
// dust in their light. Books are added separately (see buildBooks).

const UP = new Vector3(0, 1, 0);
const WOOD_SHADE = { carcass: "#4a3020", back: "#1c120c", beam: "#2e1d13", panel: "#2a1a10" } as const;

/** The three runs of shelving: down each side of the aisle, and across the reading room's back wall. */
export function getShelfRuns(): ShelfRun[] {
  return [
    {
      origin: new Vector3(-AISLE.halfWidth, 0, 0),
      along: new Vector3(0, 0, -1),
      out: new Vector3(1, 0, 0),
      length: AISLE.length,
      rowCount: SHELVING.rowCount,
    },
    {
      origin: new Vector3(AISLE.halfWidth, 0, -AISLE.length),
      along: new Vector3(0, 0, 1),
      out: new Vector3(-1, 0, 0),
      length: AISLE.length,
      rowCount: SHELVING.rowCount,
    },
    {
      origin: new Vector3(-END_BOOKCASE.width / 2, 0, ROOM.backWallZ + SHELVING.depth),
      along: new Vector3(1, 0, 0),
      out: new Vector3(0, 0, 1),
      length: END_BOOKCASE.width,
      rowCount: END_BOOKCASE.rowCount,
    },
  ];
}

interface CarcassPart {
  readonly centre: Vector3;
  readonly size: Vector3;
  readonly rotation: Quaternion;
  readonly shade: string;
}

// The case around the books: plinth, boards, uprights, cornice and back,
// expressed along the run so one routine builds all three runs.
function describeCarcass(run: ShelfRun): CarcassPart[] {
  const rotation = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(run.along, UP, run.out));
  const height = SHELVING.plinthHeight + SHELVING.rowHeight * run.rowCount + SHELVING.corniceHeight;
  const part = (along: number, up: number, out: number, width: number, tall: number, deep: number, shade: string): CarcassPart => ({
    centre: run.origin.clone().addScaledVector(run.along, along).addScaledVector(UP, up).addScaledVector(run.out, out),
    size: new Vector3(width, tall, deep),
    rotation,
    shade,
  });
  const middle = run.length / 2;
  const parts: CarcassPart[] = [
    part(middle, SHELVING.plinthHeight / 2, -SHELVING.depth / 2 + 0.02, run.length, SHELVING.plinthHeight, SHELVING.depth, WOOD_SHADE.carcass),
    part(middle, height / 2, -SHELVING.depth, run.length, height, 0.03, WOOD_SHADE.back),
    part(middle, height - SHELVING.corniceHeight / 2, -SHELVING.depth / 2 + 0.03, run.length + 0.06, SHELVING.corniceHeight, SHELVING.depth + 0.06, WOOD_SHADE.carcass),
  ];
  for (let row = 0; row <= run.rowCount; row++) {
    const boardY = SHELVING.plinthHeight + row * SHELVING.rowHeight + SHELVING.boardThickness / 2;
    parts.push(part(middle, boardY, -SHELVING.depth / 2, run.length, SHELVING.boardThickness, SHELVING.depth, WOOD_SHADE.carcass));
  }
  const bayCount = Math.round(run.length / SHELVING.bayWidth);
  for (let bay = 0; bay <= bayCount; bay++) {
    const along = (run.length / bayCount) * bay;
    parts.push(part(along, height / 2, -SHELVING.depth / 2 + 0.01, SHELVING.uprightThickness, height, SHELVING.depth + 0.02, WOOD_SHADE.carcass));
  }
  return parts;
}

function buildCarcasses(runs: readonly ShelfRun[], textures: LibraryTextures): InstancedMesh {
  const parts = runs.flatMap(describeCarcass);
  const material = new MeshStandardMaterial({ map: textures.wood, roughness: 0.72, metalness: 0 });
  const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), material, parts.length);
  const matrix = new Matrix4();
  parts.forEach((part, index) => {
    mesh.setMatrixAt(index, matrix.compose(part.centre, part.rotation, part.size));
    mesh.setColorAt(index, new Color(part.shade));
  });
  mesh.computeBoundingSphere();
  return mesh;
}

function buildFloor(textures: LibraryTextures, anisotropy: number): Group {
  const group = new Group();
  const length = CAMERA_PATH.startZ + 3 - ROOM.backWallZ;
  const centreZ = CAMERA_PATH.startZ + 3 - length / 2;
  textures.floor.repeat.set(ROOM.width / 2.4, length / 2.4);
  textures.floor.anisotropy = anisotropy;
  const floor = new Mesh(
    new PlaneGeometry(ROOM.width, length),
    new MeshStandardMaterial({ map: textures.floor, color: "#7a5a40", roughness: 0.5, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, centreZ);
  group.add(floor);

  // The runner stops short of the end bookcase.
  const rugLength = length - 3.4;
  textures.rug.repeat.set(1, rugLength / 1.4);
  textures.rug.anisotropy = anisotropy;
  const rug = new Mesh(new PlaneGeometry(1.3, rugLength), new MeshStandardMaterial({ map: textures.rug, roughness: 0.95 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.004, CAMERA_PATH.startZ + 3 - rugLength / 2);
  group.add(rug);
  return group;
}

// Panelled walls above and behind the shelving, the reading room's walls and
// ceiling, and beams across the aisle.
function buildShell(textures: LibraryTextures): Group {
  const group = new Group();
  const panel = new MeshStandardMaterial({ map: textures.wood, color: WOOD_SHADE.panel, roughness: 0.85 });
  const wall = (width: number, height: number, position: Vector3, rotationY: number) => {
    const mesh = new Mesh(new PlaneGeometry(width, height), panel);
    mesh.position.copy(position);
    mesh.rotation.y = rotationY;
    group.add(mesh);
  };
  const behindShelves = AISLE.halfWidth + SHELVING.depth + 0.02;
  wall(AISLE.length + 6, AISLE.ceilingHeight, new Vector3(-behindShelves, AISLE.ceilingHeight / 2, -AISLE.length / 2), Math.PI / 2);
  wall(AISLE.length + 6, AISLE.ceilingHeight, new Vector3(behindShelves, AISLE.ceilingHeight / 2, -AISLE.length / 2), -Math.PI / 2);
  wall(ROOM.width, ROOM_CEILING_HEIGHT, new Vector3(0, ROOM_CEILING_HEIGHT / 2, ROOM.backWallZ), 0);
  wall(ROOM.depth, ROOM_CEILING_HEIGHT, new Vector3(-ROOM.width / 2, ROOM_CEILING_HEIGHT / 2, ROOM.backWallZ + ROOM.depth / 2), Math.PI / 2);
  wall(ROOM.depth, ROOM_CEILING_HEIGHT, new Vector3(ROOM.width / 2, ROOM_CEILING_HEIGHT / 2, ROOM.backWallZ + ROOM.depth / 2), -Math.PI / 2);
  // The room's front wall, either side of where the aisle opens into it.
  const frontWidth = ROOM.width / 2 - behindShelves;
  wall(frontWidth, ROOM_CEILING_HEIGHT, new Vector3(-(behindShelves + frontWidth / 2), ROOM_CEILING_HEIGHT / 2, -AISLE.length), Math.PI);
  wall(frontWidth, ROOM_CEILING_HEIGHT, new Vector3(behindShelves + frontWidth / 2, ROOM_CEILING_HEIGHT / 2, -AISLE.length), Math.PI);

  const ceilingMaterial = new MeshStandardMaterial({ color: "#120b07", roughness: 1 });
  const aisleCeilingLength = CAMERA_PATH.startZ + 3 + AISLE.length;
  const aisleCeiling = new Mesh(new PlaneGeometry(behindShelves * 2, aisleCeilingLength), ceilingMaterial);
  aisleCeiling.rotation.x = Math.PI / 2;
  aisleCeiling.position.set(0, AISLE.ceilingHeight, CAMERA_PATH.startZ + 3 - aisleCeilingLength / 2);
  group.add(aisleCeiling);
  const roomCeiling = new Mesh(new PlaneGeometry(ROOM.width, ROOM.depth), ceilingMaterial);
  roomCeiling.rotation.x = Math.PI / 2;
  roomCeiling.position.set(0, ROOM_CEILING_HEIGHT, ROOM.backWallZ + ROOM.depth / 2);
  group.add(roomCeiling);

  const beamCount = Math.floor(AISLE.length / 1.8) + 1;
  const beams = new InstancedMesh(
    new BoxGeometry(behindShelves * 2, 0.22, 0.16),
    new MeshStandardMaterial({ map: textures.wood, color: WOOD_SHADE.beam, roughness: 0.8 }),
    beamCount,
  );
  const matrix = new Matrix4();
  for (let beam = 0; beam < beamCount; beam++) {
    beams.setMatrixAt(beam, matrix.makeTranslation(0, AISLE.ceilingHeight - 0.11, -beam * 1.8));
  }
  beams.computeBoundingSphere();
  group.add(beams);
  return group;
}

function buildWindows(textures: LibraryTextures): Group {
  const group = new Group();
  const material = new MeshBasicMaterial({ map: textures.window, transparent: true, color: "#b9c8e6" });
  for (const x of [-4.7, 4.7]) {
    const window = new Mesh(new PlaneGeometry(1.5, 3), material);
    window.position.set(x, 2.1, ROOM.backWallZ + 0.02);
    group.add(window);
  }
  return group;
}

/** A brass pendant with its bulb, glow and the shaft of light it throws. */
function buildLamp(textures: LibraryTextures, position: { x: number; y: number; z: number }, ceilingHeight: number): Group {
  const lamp = new Group();
  lamp.position.set(position.x, position.y, position.z);
  const brass = new MeshStandardMaterial({ color: "#b8913a", metalness: 0.85, roughness: 0.32, side: DoubleSide });

  const cordLength = ceilingHeight - position.y;
  const cord = new Mesh(new CylinderGeometry(0.006, 0.006, cordLength, 6), brass);
  cord.position.y = cordLength / 2;
  lamp.add(cord);

  const shade = new Mesh(new CylinderGeometry(0.05, 0.21, 0.19, 28, 1, true), brass);
  shade.position.y = -0.095;
  lamp.add(shade);

  const opening = new Mesh(new CircleGeometry(0.205, 28), new MeshBasicMaterial({ color: "#ffd9a0" }));
  opening.rotation.x = Math.PI / 2;
  opening.position.y = -0.188;
  lamp.add(opening);

  const bulb = new Mesh(new SphereGeometry(0.045, 16, 12), new MeshBasicMaterial({ color: "#fff3dc" }));
  bulb.position.y = -0.15;
  lamp.add(bulb);

  const glow = new Sprite(
    new SpriteMaterial({ map: textures.glow, color: "#ffc27a", transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false }),
  );
  glow.scale.set(1.1, 1.1, 1);
  glow.position.y = -0.17;
  lamp.add(glow);

  const shaftHeight = position.y - 0.2;
  const shaft = new Mesh(
    new CylinderGeometry(0.2, 1.15, shaftHeight, 32, 1, true),
    new MeshBasicMaterial({
      map: textures.lightCone,
      color: "#ffd9ab",
      transparent: true,
      opacity: 0.035,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  shaft.position.y = -0.19 - shaftHeight / 2;
  lamp.add(shaft);
  return lamp;
}

/** Specks of dust hanging in the air down the aisle, catching the lamplight. */
function buildDust(textures: LibraryTextures, count: number, random: Random): Points {
  const positions: number[] = [];
  for (let index = 0; index < count; index++) {
    positions.push(
      pickBetween(random, -AISLE.halfWidth, AISLE.halfWidth),
      pickBetween(random, 0.3, 3.2),
      pickBetween(random, ROOM.backWallZ + 3, CAMERA_PATH.startZ),
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({
      map: textures.glow,
      color: "#ffdcae",
      size: 0.016,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
}

export interface LibraryRoom {
  readonly group: Group;
  readonly dust: Points;
}

export function buildLibraryRoom(textures: LibraryTextures, options: { anisotropy: number; dustCount: number; random: Random }): LibraryRoom {
  const group = new Group();
  group.add(buildCarcasses(getShelfRuns(), textures));
  group.add(buildFloor(textures, options.anisotropy));
  group.add(buildShell(textures));
  group.add(buildWindows(textures));
  const lamps = getLampPositions();
  lamps.forEach((position) => {
    const ceiling = position.z < -AISLE.length ? ROOM_CEILING_HEIGHT : AISLE.ceilingHeight;
    group.add(buildLamp(textures, position, ceiling));
  });
  const dust = buildDust(textures, options.dustCount, options.random);
  group.add(dust);
  return { group, dust };
}
