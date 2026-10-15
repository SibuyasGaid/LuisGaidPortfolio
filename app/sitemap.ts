import type { MetadataRoute } from "next";
import { BOOKS } from "@/content/portfolio";
import { getBookHref } from "@/lib/books";
import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: siteUrl, priority: 1 },
    ...BOOKS.map((book) => ({ url: `${siteUrl}${getBookHref(book.id)}`, priority: 0.8 })),
  ];
}
