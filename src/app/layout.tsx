import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Providers } from "./providers";

// Niddy brand type (Niddy_Brand_Guide.md, 2026-11-13): Fraunces for display headings
// and the wordmark, Nunito Sans for interface and body text. Both are self-hosted by
// next/font at build time instead of a render-blocking @import.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});
const sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
