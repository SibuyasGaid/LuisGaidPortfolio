/** Every sound the library makes, each played at the moment its motion starts. */
export type SoundCue =
  /** A button or link pressed. */
  | "tap"
  /** Sound turned on. */
  | "chime"
  /** A project's details sliding open over the page, and away again. */
  | "paperOpen"
  | "paperClose"
  /** A book named in the navbar edging out of the shelf. */
  | "bookPreview"
  /** Taking a book: it slides out of its slot, turns to the reader, and its cover opens. */
  | "bookSlide"
  | "bookTurn"
  | "coverOpen"
  /** Putting it back: the cover closes, and it slides home. */
  | "coverClose"
  | "bookHome"
  /** Leaning in to the open book, and stepping back from it. */
  | "zoomIn"
  | "zoomOut"
  /** The title page turning over onto the book's page, and back. */
  | "pageTurn"
  | "pageReturn"
  /** The intro: the library's door, the footsteps down the aisle, and the flight back to the door. */
  | "doorOpen"
  | "footstep"
  | "rewind"
  /** A note sent from the contact form. */
  | "letterSent";

export interface CueOptions {
  /** How long the motion lasts, in seconds, so the sound can end with it. */
  readonly duration?: number;
  /** 0 to 1: how loud, against the cue's own level. */
  readonly gain?: number;
  /** -1 (left) to 1 (right). */
  readonly pan?: number;
  /** Seconds from now to play it. */
  readonly delay?: number;
}
