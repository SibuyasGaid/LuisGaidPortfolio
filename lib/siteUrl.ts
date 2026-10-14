import { SITE } from "@/content/portfolio";

// Until a custom domain is set in the content file, fall back to the URL Vercel
// assigns to production deployments.
export function getSiteUrl(): string {
  if (SITE.url) return SITE.url;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercelHost ? `https://${vercelHost}` : "http://localhost:3000";
}
