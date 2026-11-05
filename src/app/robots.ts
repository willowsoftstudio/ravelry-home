import type { MetadataRoute } from "next";

// Private beta: block all crawlers (ISA ISC-8).
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
