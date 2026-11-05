import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// Colors are left out on purpose: color literals live only in globals.css (ISA ISC-12).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
