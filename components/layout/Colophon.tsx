import { cacheLife } from "next/cache";
import { Fleuron } from "@/components/ornaments/Fleuron";
import { SITE } from "@/content/portfolio";

// Cached so the year is fixed when the page is prerendered; every deploy refreshes it.
async function getCopyrightYear(): Promise<number> {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}

export async function Colophon() {
  const copyrightYear = await getCopyrightYear();
  return (
    <footer data-colophon data-inert-during-intro className="relative z-[3] mx-auto mt-16 max-w-[86rem] px-6 pb-14 text-center sm:mt-20">
      <Fleuron className="mx-auto mb-5 h-4 w-24 text-brass/60" />
      <p className="eyebrow text-smoke">
        © {copyrightYear} {SITE.name}. {SITE.colophon}
      </p>
    </footer>
  );
}
