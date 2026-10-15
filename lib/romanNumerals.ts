const NUMERAL_VALUES = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
] as const;

/** Covers the small counts the book needs (plates, chapters), up to 39. */
export function toRomanNumeral(value: number): string {
  let remaining = value;
  let numeral = "";
  for (const [amount, symbol] of NUMERAL_VALUES) {
    while (remaining >= amount) {
      numeral += symbol;
      remaining -= amount;
    }
  }
  return numeral;
}
