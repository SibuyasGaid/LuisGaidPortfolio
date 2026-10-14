import { BrassRule } from "@/components/ornaments/BrassRule";
import { Monogram } from "@/components/ornaments/Monogram";
import { PROFILE } from "@/content/portfolio";

export function TitlePage() {
  return (
    <div className="flex h-full flex-col">
      <p className="small-caps-label">The portfolio of</p>
      <h1 className="mt-4 font-display text-[clamp(3.1rem,2rem+4.4vw,5.75rem)] font-semibold leading-[0.94] tracking-[-0.015em] text-ink">
        {PROFILE.fullName}
      </h1>
      <p className="mt-5 font-display text-2xl italic text-ink-soft sm:text-[1.7rem]">{PROFILE.headline}</p>
      <BrassRule className="my-9 max-w-[14rem]" />
      <p className="lede drop-cap max-w-[34rem]">{PROFILE.summary}</p>
      <p className="mt-10 small-caps text-[0.72rem] tracking-[0.16em] text-ink-soft">
        Clients in {PROFILE.clientRegions}
      </p>
      <Monogram className="mt-12 hidden size-20 text-brass lg:mt-auto lg:block" />
    </div>
  );
}
