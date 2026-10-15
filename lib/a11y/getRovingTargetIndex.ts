/**
 * Where a roving tab stop moves for a key press: the arrows step through the
 * items and wrap at either end, Home and End jump to the ends. Null means the
 * key is not one the group handles.
 */
export function getRovingTargetIndex(key: string, currentIndex: number, count: number): number | null {
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1) % count;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
