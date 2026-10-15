import { BrassRule } from "@/components/ornaments/BrassRule";
import { Monogram } from "@/components/ornaments/Monogram";
import { PROFILE } from "@/content/portfolio";

export function TitlePage() {
  return (
    <div className="flex h-full flex-col">
      <p className="section-label">The portfolio of</p>
      <h1 className="mt-5 font-display text-[clamp(3.2rem,2rem+4.6vw,6rem)] font-medium leading-[0.92] tracking-[-0.025em] text-ink">
        {PROFILE.fullName}
      </h1>
      <p className="mt-6 font-display text-[1.6rem] italic text-ink-soft sm:text-[1.8rem]">{PROFILE.headline}</p>
      <BrassRule className="my-10 max-w-[9rem]" />
      <p className="lede drop-cap max-w-[34rem]">{PROFILE.summary}</p>
      <p className="eyebrow mt-10 text-ink-soft">Clients in {PROFILE.clientRegions}</p>
      <Monogram className="mt-12 hidden size-16 text-brass lg:mt-auto lg:block" />
    </div>
  );
}
