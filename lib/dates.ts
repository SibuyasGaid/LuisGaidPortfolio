import type { YearMonth } from "@/content/portfolio";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

// Formatted by hand rather than with Intl so the output never depends on the
// server's locale.
export function formatYearMonth(yearMonth: YearMonth): string {
  const [year, month] = yearMonth.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1];
  return `${monthName} ${year}`;
}
