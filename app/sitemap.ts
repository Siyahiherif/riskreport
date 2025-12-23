import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cyberfacex.com";
  const paths = ["/", "/pricing", "/refund", "/privacy", "/terms"];
  const now = new Date();
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));
}
