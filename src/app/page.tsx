import Link from "next/link";
import { siteConfig } from "@/config/site";

// Placeholder home until discovery (F3) is built.
export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <h1 className="text-4xl text-primary">{siteConfig.name}</h1>
      <p className="text-lg text-muted-foreground">{siteConfig.description}</p>
      <p>
        <Link
          href="/design-system"
          className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:no-underline"
        >
          View the design system
        </Link>
      </p>
    </div>
  );
}
