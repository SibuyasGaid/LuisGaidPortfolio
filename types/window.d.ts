export {};

declare global {
  interface Window {
    /** Written by the intro boot script; read back to re-apply it after React's dev remount. */
    __libraryIntroState?: string;
  }
}
