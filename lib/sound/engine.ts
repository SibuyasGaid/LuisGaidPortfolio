import type { CueOptions, SoundCue } from "@/lib/sound/soundCues";

// The library's sounds, made as they play rather than downloaded: Web Audio
// oscillators and filtered noise shaped like paper, book cloth, boards, wood
// and felt-hammered strings, all in one room's echo. There is nothing to
// fetch, and the music is written as it goes, so it never loops.

export interface SoundEngine {
  /** Plays a cue now, or after options.delay. */
  play(cue: SoundCue, options?: CueOptions): void;
  /** Fades everything in or out; the music plays only while it is on. */
  setOn(isOn: boolean): void;
}

export interface SoundEngineOptions {
  /** How far ahead the music is written, in seconds: a moment for live play, the whole length for an offline render. */
  readonly scheduleAheadSeconds?: number;
}

/** A value over a sound's life: [seconds from its start, value], ramped between. */
type Breakpoints = readonly (readonly [number, number])[];

interface CueSettings {
  readonly gain: number;
  readonly pan: number;
  readonly duration: number | undefined;
}

type CuePlayer = (at: number, settings: CueSettings) => void;

interface NoiseVoice {
  /** White noise unless given. */
  readonly source?: AudioBuffer;
  readonly rate?: Breakpoints;
  readonly filter: BiquadFilterType;
  readonly frequency: Breakpoints;
  readonly q?: number;
  readonly loudness: Breakpoints;
  readonly pan?: number | Breakpoints;
}

interface ToneVoice {
  readonly wave: OscillatorType;
  readonly frequency: Breakpoints;
  readonly loudness: Breakpoints;
  readonly pan?: number | Breakpoints;
}

interface MusicSession {
  /** The music's own fade, before the room's echo and after it. */
  readonly dry: GainNode;
  readonly echo: GainNode;
  readonly roomTone: AudioBufferSourceNode;
  nextChordAt: number;
  chordIndex: number;
  nextNoteAt: number;
  melodyIndex: number;
  notesLeft: number;
  timer: number;
}

// ─── Levels ──────────────────────────────────────────────────────────────────

const MASTER_LEVEL = 0.9;
/** Under the music, so the effects stay in front of it. */
const MUSIC_LEVEL = 0.32;
/** How much of the effects reaches the room's echo. */
const EFFECTS_ECHO = 0.16;
const CHIME_ECHO = 0.35;
const SWITCH_FADE_SECONDS = 0.45;
/** Cues are set this far ahead of now, so none loses its first instant. */
const CUE_LEAD_SECONDS = 0.012;
/** Each cue's loudness against the others, balanced by ear and by measurement; 1 where not listed. */
const CUE_LEVELS: Partial<Record<SoundCue, number>> = {
  chime: 0.6,
  paperOpen: 0.8,
  bookTurn: 1.4,
  coverOpen: 1.6,
  coverClose: 1.4,
  zoomIn: 2,
  zoomOut: 2,
  doorOpen: 2,
  footstep: 0.65,
  rewind: 1.8,
};

// ─── The room ────────────────────────────────────────────────────────────────

const NOISE_SECONDS = 2;
const REVERB_SECONDS = 3.2;
const REVERB_PREDELAY_SECONDS = 0.018;
const CRINKLES_PER_SECOND = 1400;

// ─── The music ───────────────────────────────────────────────────────────────

const LIVE_SCHEDULE_AHEAD_SECONDS = 1.6;
const MUSIC_TICK_MS = 400;
const MUSIC_FADE_IN_SECONDS = 6;
const MUSIC_FADE_OUT_SECONDS = 1.2;
const CHORD_SECONDS = 11;
/** Each chord rings on this long into the next, so they melt into each other. */
const CHORD_OVERLAP_SECONDS = 5;
const PAD_ATTACK_SECONDS = 4;
const PAD_RELEASE_SECONDS = 5;
const PAD_NOTE_LEVEL = 0.05;
const PAD_ECHO = 0.5;
const BASS_LEVEL = 0.035;
const BELL_LEVEL = 0.16;
const MELODY_ECHO = 0.8;
const ROOM_TONE_LEVEL = 0.018;

/** Dmaj9, Bm11, Gmaj9♯11 and A7sus4, each voiced close over its root (MIDI note numbers). */
const CHORDS = [
  { root: 38, voicing: [50, 57, 61, 64, 66] },
  { root: 35, voicing: [54, 57, 59, 62, 64] },
  { root: 31, voicing: [50, 54, 57, 59, 61] },
  { root: 33, voicing: [52, 55, 57, 59, 62] },
] as const;
/** D major pentatonic, which sits sweetly over every one of the chords. */
const MELODY_SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81] as const;
const MELODY_STEPS = [-2, -1, -1, 1, 1, 2] as const;
const MELODY_GAPS = [0.6, 0.9, 0.9, 1.2, 1.8] as const;

/** A felt-hammered string: its overtones (to the fundamental) and how fast each dies away, in seconds. */
const BELL_PARTIALS = [
  { ratio: 1, level: 1, decay: 1.5 },
  { ratio: 2.003, level: 0.3, decay: 0.75 },
  { ratio: 3.006, level: 0.1, decay: 0.4 },
  { ratio: 4.18, level: 0.035, decay: 0.22 },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function midiToHertz(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

function randomBetween(low: number, high: number): number {
  return low + Math.random() * (high - low);
}

function pickRandom<T>(items: readonly [T, ...T[]]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

/** A random factor near 1, so no two plays of a cue are quite the same. */
function vary(spread: number): number {
  return 1 + (Math.random() * 2 - 1) * spread;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** A struck sound: up to peak in attack seconds, then dying away over length, roughly exponentially. */
function strike(peak: number, attack: number, length: number): Breakpoints {
  return [
    [0, 0],
    [attack, peak],
    [attack + length * 0.25, peak * 0.4],
    [attack + length * 0.55, peak * 0.12],
    [attack + length, 0],
  ];
}

function scaleLoudness(points: Breakpoints, factor: number): Breakpoints {
  return points.map(([time, value]) => [time, value * factor] as const);
}

function findEnd(points: Breakpoints): number {
  return points[points.length - 1]?.[0] ?? 0;
}

function rampThrough(param: AudioParam, at: number, points: Breakpoints, isExponential: boolean): void {
  points.forEach(([time, value], index) => {
    if (index === 0) param.setValueAtTime(value, at + time);
    else if (isExponential) param.exponentialRampToValueAtTime(Math.max(value, 0.0001), at + time);
    else param.linearRampToValueAtTime(value, at + time);
  });
}

function createFilledBuffer(
  context: BaseAudioContext,
  seconds: number,
  channels: number,
  fill: (data: Float32Array, rate: number) => void,
): AudioBuffer {
  const buffer = context.createBuffer(channels, Math.floor(seconds * context.sampleRate), context.sampleRate);
  for (let channel = 0; channel < channels; channel += 1) fill(buffer.getChannelData(channel), context.sampleRate);
  return buffer;
}

function fillWhiteNoise(data: Float32Array): void {
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
}

/** Paper: sharp crackles, bunched together and then sparse. */
function fillCrinkle(data: Float32Array, rate: number): void {
  let crackle = 0;
  for (let index = 0; index < data.length; index += 1) {
    const time = index / rate;
    const bunching = 0.35 + 0.65 * Math.abs(Math.sin(time * 7.3) * Math.sin(time * 2.9));
    if (Math.random() < (CRINKLES_PER_SECOND / rate) * bunching) crackle = (Math.random() * 2 - 1) * randomBetween(0.3, 1);
    data[index] = crackle + (Math.random() * 2 - 1) * 0.03;
    crackle *= 0.8;
  }
}

/** Cloth and board dragged past each other: they catch and slip in quick, uneven pulses. */
function fillScrape(data: Float32Array, rate: number): void {
  let phase = 0;
  let slip = 0;
  for (let index = 0; index < data.length; index += 1) {
    const time = index / rate;
    const pulsesPerSecond = 120 + 50 * Math.sin(time * 5.1) + 25 * Math.sin(time * 13.7);
    phase += (pulsesPerSecond / rate) * randomBetween(0.8, 1.2);
    if (phase >= 1) {
      phase -= 1;
      slip = randomBetween(0.4, 1);
    }
    data[index] = (Math.random() * 2 - 1) * (slip + 0.12);
    slip *= 0.94;
  }
}

/** The room's echo: noise dying away to silence over REVERB_SECONDS, darkening as it goes. */
function fillReverb(data: Float32Array, rate: number): void {
  const timeConstant = REVERB_SECONDS / 6.9;
  let smoothed = 0;
  for (let index = 0; index < data.length; index += 1) {
    const time = index / rate - REVERB_PREDELAY_SECONDS;
    if (time < 0) {
      data[index] = 0;
      continue;
    }
    const damping = Math.min(0.9, 0.15 + time * 0.3);
    smoothed = smoothed * damping + (Math.random() * 2 - 1) * (1 - damping);
    data[index] = smoothed * Math.exp(-time / timeConstant);
  }
}

// ─── The engine ──────────────────────────────────────────────────────────────

export function createSoundEngine(context: BaseAudioContext, options: SoundEngineOptions = {}): SoundEngine {
  const scheduleAhead = options.scheduleAheadSeconds ?? LIVE_SCHEDULE_AHEAD_SECONDS;
  const noise = {
    white: createFilledBuffer(context, NOISE_SECONDS, 1, fillWhiteNoise),
    crinkle: createFilledBuffer(context, NOISE_SECONDS, 1, fillCrinkle),
    scrape: createFilledBuffer(context, NOISE_SECONDS, 1, fillScrape),
  };
  // A soft, slightly reedy tone for the chords: a sine with a few quiet overtones.
  const padWave = context.createPeriodicWave(new Float32Array(6), new Float32Array([0, 1, 0.42, 0.18, 0.08, 0.035]));

  const master = context.createGain();
  master.gain.value = 0;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.2;
  master.connect(limiter).connect(context.destination);

  const reverb = context.createConvolver();
  reverb.buffer = createFilledBuffer(context, REVERB_SECONDS, 2, fillReverb);
  reverb.connect(master);

  const effects = context.createGain();
  effects.connect(master);
  const effectsEcho = context.createGain();
  effectsEcho.gain.value = EFFECTS_ECHO;
  effects.connect(effectsEcho).connect(reverb);

  const music = context.createGain();
  music.gain.value = MUSIC_LEVEL;
  music.connect(master);
  const musicEcho = context.createGain();
  musicEcho.gain.value = MUSIC_LEVEL;
  musicEcho.connect(reverb);

  let session: MusicSession | null = null;

  function routeEffect(node: AudioNode, at: number, pan: number | Breakpoints | undefined): void {
    if (pan === undefined || pan === 0) {
      node.connect(effects);
      return;
    }
    const panner = context.createStereoPanner();
    if (typeof pan === "number") panner.pan.setValueAtTime(clamp(pan, -1, 1), at);
    else rampThrough(panner.pan, at, pan, false);
    node.connect(panner).connect(effects);
  }

  function playNoise(at: number, voice: NoiseVoice, gain: number, output?: AudioNode): void {
    const buffer = voice.source ?? noise.white;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    if (voice.rate) rampThrough(source.playbackRate, at, voice.rate, true);
    const filter = context.createBiquadFilter();
    filter.type = voice.filter;
    if (voice.q !== undefined) filter.Q.value = voice.q;
    rampThrough(filter.frequency, at, voice.frequency, true);
    const envelope = context.createGain();
    rampThrough(envelope.gain, at, scaleLoudness(voice.loudness, gain), false);
    source.connect(filter).connect(envelope);
    if (output) envelope.connect(output);
    else routeEffect(envelope, at, voice.pan);
    // Each play starts somewhere new in the noise, so repeats never sound stamped out.
    source.start(at, Math.random() * buffer.duration);
    source.stop(at + findEnd(voice.loudness) + 0.05);
  }

  function playTone(at: number, voice: ToneVoice, gain: number): void {
    const oscillator = context.createOscillator();
    oscillator.type = voice.wave;
    rampThrough(oscillator.frequency, at, voice.frequency, true);
    const envelope = context.createGain();
    rampThrough(envelope.gain, at, scaleLoudness(voice.loudness, gain), false);
    oscillator.connect(envelope);
    routeEffect(envelope, at, voice.pan);
    oscillator.start(at);
    oscillator.stop(at + findEnd(voice.loudness) + 0.05);
  }

  /** A note on a felt-hammered string, dry into one bus and partly into the room's echo. */
  function playBell(frequency: number, at: number, velocity: number, dry: AudioNode, echo: AudioNode, echoLevel: number): void {
    const voice = context.createGain();
    voice.gain.value = velocity * BELL_LEVEL;
    const felt = context.createBiquadFilter();
    felt.type = "lowpass";
    felt.frequency.value = 2600;
    felt.connect(voice).connect(dry);
    const send = context.createGain();
    send.gain.value = echoLevel;
    voice.connect(send).connect(echo);
    for (const partial of BELL_PARTIALS) {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = frequency * partial.ratio;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(partial.level, at + 0.006);
      envelope.gain.setTargetAtTime(0, at + 0.006, partial.decay);
      oscillator.connect(envelope).connect(felt);
      oscillator.start(at);
      oscillator.stop(at + 0.006 + partial.decay * 7);
    }
    // The soft knock of the hammer itself.
    playNoise(at, { filter: "lowpass", frequency: [[0, 1400]], loudness: strike(0.5, 0.001, 0.025) }, 1, felt);
  }

  /** A leaf turning from right to left (or back): it peels off the page, swishes as it moves fastest, crackles, and settles. */
  function playLeaf(at: number, { gain, duration = 0.95 }: CueSettings, direction: 1 | -1): void {
    const pan: Breakpoints = [
      [0, 0.35 * direction],
      [duration, -0.35 * direction],
    ];
    playNoise(at, { source: noise.crinkle, filter: "bandpass", frequency: [[0, 3200]], q: 0.7, loudness: [[0, 0], [0.06, 0.2], [0.22, 0.04], [0.3, 0]], pan }, gain);
    playNoise(
      at,
      {
        filter: "bandpass",
        frequency: [[0, 600], [duration * 0.5, 2300], [duration * 0.85, 1100]],
        q: 0.75,
        loudness: [[0, 0], [duration * 0.25, 0.05], [duration * 0.5, 0.26], [duration * 0.75, 0.08], [duration * 0.95, 0]],
        pan,
      },
      gain,
    );
    playNoise(at, { source: noise.crinkle, filter: "highpass", frequency: [[0, 2600]], loudness: [[0, 0], [duration * 0.5, 0.12], [duration * 0.9, 0]], pan }, gain);
    playNoise(at + duration * 0.9, { filter: "lowpass", frequency: [[0, 550]], loudness: strike(0.15, 0.005, 0.08), pan: -0.3 * direction }, gain);
  }

  const cuePlayers: Record<SoundCue, CuePlayer> = {
    tap(at, { gain }) {
      const pitch = vary(0.08);
      playNoise(at, { filter: "bandpass", frequency: [[0, 2400 * pitch]], q: 5, loudness: strike(0.3, 0.001, 0.035) }, gain);
      playTone(at, { wave: "sine", frequency: [[0, 560 * pitch], [0.06, 400 * pitch]], loudness: strike(0.1, 0.002, 0.07) }, gain);
    },
    chime(at, { gain }) {
      playBell(midiToHertz(74), at, 0.8 * gain, effects, reverb, CHIME_ECHO);
      playBell(midiToHertz(81), at + 0.14, 0.65 * gain, effects, reverb, CHIME_ECHO);
    },
    paperOpen(at, { gain }) {
      playNoise(at, { filter: "bandpass", frequency: [[0, 700], [0.28, 3000]], q: 0.8, loudness: [[0, 0], [0.07, 0.2], [0.2, 0.1], [0.34, 0]] }, gain);
      playNoise(at, { source: noise.crinkle, filter: "highpass", frequency: [[0, 2500]], loudness: [[0, 0], [0.05, 0.22], [0.25, 0.05], [0.32, 0]] }, gain);
    },
    paperClose(at, { gain }) {
      playNoise(at, { filter: "bandpass", frequency: [[0, 2600], [0.2, 900]], q: 0.8, loudness: [[0, 0], [0.04, 0.15], [0.22, 0]] }, gain);
      playNoise(at + 0.17, { filter: "lowpass", frequency: [[0, 500]], loudness: strike(0.24, 0.004, 0.08) }, gain);
    },
    bookPreview(at, { gain }) {
      playNoise(
        at,
        { source: noise.scrape, filter: "bandpass", frequency: [[0, 1100 * vary(0.1)]], q: 1.2, loudness: [[0, 0], [0.03, 0.08], [0.16, 0.05], [0.24, 0]] },
        gain,
      );
    },
    bookSlide(at, { gain, duration = 0.45 }) {
      // A fingertip tips the book out by its top edge, and it drags past its neighbours.
      playTone(at, { wave: "sine", frequency: [[0, 190], [0.05, 150]], loudness: strike(0.12, 0.002, 0.05) }, gain);
      playNoise(
        at + 0.02,
        { source: noise.scrape, filter: "bandpass", frequency: [[0, 600], [duration, 820]], q: 0.9, loudness: [[0, 0], [0.05, 0.3], [duration * 0.7, 0.22], [duration + 0.06, 0]] },
        gain,
      );
      playNoise(at + 0.02, { source: noise.scrape, filter: "highpass", frequency: [[0, 2200]], loudness: [[0, 0], [0.05, 0.06], [duration, 0]] }, gain);
    },
    bookTurn(at, { gain, duration = 0.9 }) {
      playNoise(
        at,
        {
          filter: "lowpass",
          frequency: [[0, 260], [duration * 0.55, 1300], [duration, 420]],
          loudness: [[0, 0], [duration * 0.5, 0.11], [duration, 0]],
          pan: [[0, 0.25], [duration, 0]],
        },
        gain,
      );
    },
    coverOpen(at, { gain, duration = 0.78 }) {
      // The spine gives a little as the cover lifts...
      playNoise(
        at,
        { source: noise.scrape, rate: [[0, 0.45], [0.3, 0.6]], filter: "bandpass", frequency: [[0, 520]], q: 5, loudness: [[0, 0], [0.05, 0.18], [0.22, 0.1], [0.34, 0]] },
        gain,
      );
      playNoise(at, { source: noise.scrape, rate: [[0, 0.5]], filter: "bandpass", frequency: [[0, 1250]], q: 6, loudness: [[0, 0], [0.06, 0.07], [0.3, 0]] }, gain);
      // ...the board moves the air as it swings over...
      playNoise(
        at + 0.1,
        { filter: "lowpass", frequency: [[0, 300], [duration * 0.5, 1500], [duration * 0.9, 500]], loudness: [[0, 0], [duration * 0.45, 0.1], [duration * 0.9, 0]] },
        gain,
      );
      // ...the first pages riffle after it...
      playNoise(at + duration * 0.4, { source: noise.crinkle, filter: "bandpass", frequency: [[0, 3500]], q: 0.8, loudness: [[0, 0], [0.05, 0.12], [0.3, 0]] }, gain);
      // ...and it comes to rest.
      playNoise(at + duration * 0.92, { filter: "lowpass", frequency: [[0, 380]], loudness: strike(0.18, 0.006, 0.09) }, gain);
    },
    coverClose(at, { gain, duration = 0.68 }) {
      const shut = duration * 0.9;
      playNoise(at, { filter: "lowpass", frequency: [[0, 400], [shut, 1600]], loudness: [[0, 0], [shut * 0.85, 0.12], [shut, 0]] }, gain);
      playTone(at + shut, { wave: "sine", frequency: [[0, 85], [0.16, 48]], loudness: strike(0.4, 0.004, 0.18) }, gain);
      playNoise(at + shut, { filter: "lowpass", frequency: [[0, 900], [0.1, 250]], loudness: strike(0.32, 0.002, 0.12) }, gain);
      playNoise(at + shut, { filter: "bandpass", frequency: [[0, 1900]], q: 2, loudness: strike(0.1, 0.001, 0.03) }, gain);
    },
    bookHome(at, { gain, duration = 0.45 }) {
      playNoise(
        at,
        { source: noise.scrape, filter: "bandpass", frequency: [[0, 800], [duration, 600]], q: 0.9, loudness: [[0, 0], [0.04, 0.24], [duration * 0.8, 0.18], [duration, 0]] },
        gain,
      );
      // It knocks home against the back of the shelf.
      playTone(at + duration, { wave: "sine", frequency: [[0, 170], [0.08, 130]], loudness: strike(0.18, 0.002, 0.09) }, gain);
      playNoise(at + duration, { filter: "bandpass", frequency: [[0, 950]], q: 2.5, loudness: strike(0.14, 0.001, 0.05) }, gain);
    },
    zoomIn(at, { gain, duration = 0.9 }) {
      playNoise(at, { filter: "lowpass", frequency: [[0, 180], [duration, 900]], loudness: [[0, 0], [duration * 0.7, 0.07], [duration, 0]] }, gain);
    },
    zoomOut(at, { gain, duration = 0.9 }) {
      playNoise(at, { filter: "lowpass", frequency: [[0, 900], [duration, 180]], loudness: [[0, 0], [duration * 0.3, 0.06], [duration, 0]] }, gain);
    },
    pageTurn(at, settings) {
      playLeaf(at, settings, 1);
    },
    pageReturn(at, settings) {
      playLeaf(at, settings, -1);
    },
    doorOpen(at, { gain }) {
      // The latch: two clicks of metal...
      for (const [delay, peak] of [
        [0, 0.18],
        [0.11, 0.11],
      ] as const) {
        playNoise(at + delay, { filter: "bandpass", frequency: [[0, 3400]], q: 7, loudness: strike(peak, 0.001, 0.025) }, gain);
        playTone(at + delay, { wave: "triangle", frequency: [[0, 2350]], loudness: strike(peak * 0.15, 0.001, 0.09) }, gain);
      }
      // ...the heavy door groans on its hinges...
      playNoise(
        at + 0.25,
        {
          source: noise.scrape,
          rate: [[0, 0.22], [1.2, 0.34]],
          filter: "bandpass",
          frequency: [[0, 340], [1.2, 420]],
          q: 4,
          loudness: [[0, 0], [0.3, 0.1], [0.9, 0.05], [1.3, 0]],
        },
        gain,
      );
      playNoise(
        at + 0.25,
        { source: noise.scrape, rate: [[0, 0.25], [1.2, 0.3]], filter: "bandpass", frequency: [[0, 780]], q: 5, loudness: [[0, 0], [0.4, 0.045], [1.2, 0]] },
        gain,
      );
      // ...and the library's air comes through.
      playNoise(at + 0.3, { filter: "lowpass", frequency: [[0, 200], [1.2, 700], [2, 300]], loudness: [[0, 0], [1, 0.07], [2, 0]] }, gain);
    },
    footstep(at, { gain, pan }) {
      // The heel on a boarded floor, then the sole rolling off it.
      const pitch = vary(0.1);
      playNoise(at, { filter: "lowpass", frequency: [[0, 340 * pitch]], loudness: strike(0.36, 0.004, 0.07), pan }, gain);
      playTone(at, { wave: "sine", frequency: [[0, 68 * pitch], [0.09, 52 * pitch]], loudness: strike(0.26, 0.004, 0.1), pan }, gain);
      playNoise(at + 0.035, { filter: "bandpass", frequency: [[0, 1500 * pitch]], q: 0.9, loudness: [[0, 0], [0.015, 0.05], [0.09, 0]], pan }, gain);
    },
    rewind(at, { gain, duration = 1.9 }) {
      playNoise(
        at,
        { filter: "lowpass", frequency: [[0, 1300], [duration, 250]], loudness: [[0, 0], [duration * 0.35, 0.1], [duration, 0]], pan: [[0, -0.2], [duration, 0.2]] },
        gain,
      );
    },
    letterSent(at, settings) {
      playCueAt("paperClose", at, settings);
      playCueAt("chime", at + 0.25, settings);
    },
  };

  function playCueAt(cue: SoundCue, at: number, settings: CueSettings): void {
    cuePlayers[cue](at, { ...settings, gain: settings.gain * (CUE_LEVELS[cue] ?? 1) });
  }

  // ─── The music ─────────────────────────────────────────────────────────────

  function playPadNote(note: number, at: number, length: number, current: MusicSession): void {
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(PAD_NOTE_LEVEL, at + PAD_ATTACK_SECONDS);
    envelope.gain.setValueAtTime(PAD_NOTE_LEVEL, at + length - PAD_RELEASE_SECONDS);
    envelope.gain.linearRampToValueAtTime(0, at + length);
    const warmth = context.createBiquadFilter();
    warmth.type = "lowpass";
    warmth.frequency.value = 950;
    warmth.Q.value = 0;
    const panner = context.createStereoPanner();
    panner.pan.value = randomBetween(-0.45, 0.45);
    warmth.connect(envelope).connect(panner).connect(current.dry);
    const send = context.createGain();
    send.gain.value = PAD_ECHO;
    panner.connect(send).connect(current.echo);
    // Two voices a few cents apart, beating slowly against each other.
    for (const detune of [-6, 6]) {
      const oscillator = context.createOscillator();
      oscillator.setPeriodicWave(padWave);
      oscillator.frequency.value = midiToHertz(note);
      oscillator.detune.value = detune + randomBetween(-2, 2);
      const half = context.createGain();
      half.gain.value = 0.5;
      oscillator.connect(half).connect(warmth);
      oscillator.start(at);
      oscillator.stop(at + length + 0.05);
    }
  }

  function playBass(note: number, at: number, length: number, current: MusicSession): void {
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(BASS_LEVEL, at + PAD_ATTACK_SECONDS * 0.75);
    envelope.gain.setValueAtTime(BASS_LEVEL, at + length - PAD_RELEASE_SECONDS);
    envelope.gain.linearRampToValueAtTime(0, at + length);
    envelope.connect(current.dry);
    // An octave's overtone, so the root still comes through small speakers.
    for (const [multiple, level] of [
      [1, 1],
      [2, 0.5],
    ] as const) {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = midiToHertz(note) * multiple;
      const partial = context.createGain();
      partial.gain.value = level;
      oscillator.connect(partial).connect(envelope);
      oscillator.start(at);
      oscillator.stop(at + length + 0.05);
    }
  }

  function playChord(index: number, at: number, current: MusicSession): void {
    const chord = CHORDS[index % CHORDS.length] ?? CHORDS[0];
    const length = CHORD_SECONDS + CHORD_OVERLAP_SECONDS;
    playBass(chord.root, at, length, current);
    // Spread a little, the way hands never quite land together.
    for (const note of chord.voicing) playPadNote(note, at + randomBetween(0, 0.6), length, current);
  }

  /** Plays the melody's next note (or starts a rest between phrases) and says when the one after it falls. */
  function playMelodyStep(current: MusicSession, at: number): number {
    if (current.notesLeft <= 0) {
      current.notesLeft = Math.floor(randomBetween(3, 7));
      return at + randomBetween(4, 9);
    }
    current.notesLeft -= 1;
    current.melodyIndex = clamp(current.melodyIndex + pickRandom(MELODY_STEPS), 0, MELODY_SCALE.length - 1);
    const note = MELODY_SCALE[current.melodyIndex] ?? MELODY_SCALE[0];
    const velocity = randomBetween(0.45, 0.8) * (current.notesLeft === 0 ? 0.75 : 1);
    playBell(midiToHertz(note), at, velocity, current.dry, current.echo, MELODY_ECHO);
    // Now and then a softer note a third below.
    const harmony = MELODY_SCALE[current.melodyIndex - 2];
    if (harmony !== undefined && Math.random() < 0.2) {
      playBell(midiToHertz(harmony), at + 0.02, velocity * 0.55, current.dry, current.echo, MELODY_ECHO);
    }
    return at + pickRandom(MELODY_GAPS);
  }

  function scheduleMusic(current: MusicSession): void {
    const horizon = context.currentTime + scheduleAhead;
    while (current.nextChordAt < horizon) {
      playChord(current.chordIndex, current.nextChordAt, current);
      current.chordIndex += 1;
      current.nextChordAt += CHORD_SECONDS;
    }
    while (current.nextNoteAt < horizon) current.nextNoteAt = playMelodyStep(current, current.nextNoteAt);
  }

  function startMusic(): void {
    if (session) return;
    const now = context.currentTime;
    const dry = context.createGain();
    const echo = context.createGain();
    for (const fade of [dry, echo]) {
      fade.gain.setValueAtTime(0, now);
      fade.gain.linearRampToValueAtTime(1, now + MUSIC_FADE_IN_SECONDS);
    }
    dry.connect(music);
    echo.connect(musicEcho);
    // The room itself: a low hush of air under everything.
    const roomTone = context.createBufferSource();
    roomTone.buffer = noise.white;
    roomTone.loop = true;
    const hush = context.createBiquadFilter();
    hush.type = "lowpass";
    hush.frequency.value = 300;
    const roomLevel = context.createGain();
    roomLevel.gain.value = ROOM_TONE_LEVEL;
    roomTone.connect(hush).connect(roomLevel).connect(dry);
    roomTone.start(now);
    const current: MusicSession = {
      dry,
      echo,
      roomTone,
      nextChordAt: now + 0.05,
      chordIndex: 0,
      nextNoteAt: now + 3.5,
      melodyIndex: 4,
      notesLeft: 4,
      timer: 0,
    };
    session = current;
    scheduleMusic(current);
    current.timer = window.setInterval(() => scheduleMusic(current), MUSIC_TICK_MS);
  }

  function stopMusic(): void {
    const current = session;
    if (!current) return;
    session = null;
    window.clearInterval(current.timer);
    const now = context.currentTime;
    for (const fade of [current.dry, current.echo]) {
      fade.gain.cancelScheduledValues(now);
      fade.gain.setValueAtTime(fade.gain.value, now);
      fade.gain.linearRampToValueAtTime(0, now + MUSIC_FADE_OUT_SECONDS);
    }
    current.roomTone.stop(now + MUSIC_FADE_OUT_SECONDS);
    // Notes already written play on into nothing and are let go.
    window.setTimeout(
      () => {
        current.dry.disconnect();
        current.echo.disconnect();
      },
      (MUSIC_FADE_OUT_SECONDS + 0.2) * 1000,
    );
  }

  return {
    play(cue, cueOptions = {}) {
      const at = context.currentTime + CUE_LEAD_SECONDS + Math.max(0, cueOptions.delay ?? 0);
      playCueAt(cue, at, { gain: clamp(cueOptions.gain ?? 1, 0, 1), pan: cueOptions.pan ?? 0, duration: cueOptions.duration });
    },
    setOn(isOn) {
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(isOn ? MASTER_LEVEL : 0, now + SWITCH_FADE_SECONDS);
      if (isOn) startMusic();
      else stopMusic();
    },
  };
}
