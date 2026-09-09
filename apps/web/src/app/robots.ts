import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.SITE_URL ?? "https://scorelineiq.com";

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
