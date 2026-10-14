import type { MetadataRoute } from "next";
import { CHAPTERS } from "@/content/portfolio";
import { getChapterHref } from "@/lib/chapters";
import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: siteUrl, priority: 1 },
    ...CHAPTERS.map((chapter) => ({ url: `${siteUrl}${getChapterHref(chapter.id)}`, priority: 0.8 })),
  ];
}
