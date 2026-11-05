import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalDemo } from "./modal-demo";

export const metadata: Metadata = { title: "Design system" };

// Catalog of every component listed under "Component Specs" in
// design-system/ravelry-companion-site/MASTER.md, in both themes (ISA ISC-14).
// Each section carries data-component="<MASTER heading>" so the e2e test can
// match it against MASTER.md.

const swatches = [
  ["Primary", "bg-primary text-primary-foreground"],
  ["Secondary", "bg-secondary text-secondary-foreground"],
  ["CTA", "bg-cta text-cta-foreground"],
  ["Muted", "bg-muted text-muted-foreground"],
  ["Card", "bg-card text-card-foreground border border-border"],
  ["Destructive", "bg-destructive text-destructive-foreground"],
] as const;

function Catalog({ theme }: { theme: "light" | "dark" }) {
  const id = (name: string) => `${theme}-${name}`;
  return (
    <section
      className={`${theme} flex flex-col gap-10 rounded-2xl bg-background p-4 text-foreground sm:p-8`}
      aria-labelledby={id("heading")}
      data-theme-panel={theme}
    >
      <h2 id={id("heading")} className="text-3xl">
        {theme === "light" ? "Light theme" : "Dark theme"}
      </h2>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl">Colors</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {swatches.map(([name, cls]) => (
            <li key={name} className={`${cls} rounded-lg px-4 py-6 font-semibold`}>
              {name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4" data-component="Buttons">
        <h3 className="text-xl">Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4" data-component="Cards">
        <h3 className="text-xl">Cards</h3>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Sunday Morning Shawl</CardTitle>
            <CardDescription>Fingering weight · 400 yards</CardDescription>
          </CardHeader>
          <CardContent>
            <p>A pattern card. Photos lead on discovery pages; this shows the text styles.</p>
          </CardContent>
          <CardFooter className="gap-3">
            <Button size="sm">Add to queue</Button>
            <Button size="sm" variant="ghost">
              Details
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="flex max-w-sm flex-col gap-4" data-component="Inputs">
        <h3 className="text-xl">Inputs</h3>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("search")}>Search patterns</Label>
          <Input id={id("search")} type="search" placeholder="e.g. cowl, shawl" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("yardage")}>Yardage</Label>
          <Input id={id("yardage")} type="number" inputMode="numeric" defaultValue={400} />
        </div>
      </div>

      <div className="flex flex-col gap-4" data-component="Modals">
        <h3 className="text-xl">Modals</h3>
        <div className="max-w-[500px] rounded-2xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 sm:p-8">
          <p className="font-heading text-lg">Add to your queue?</p>
          <p className="mt-2 text-muted-foreground">
            Static preview of the modal surface. The button below opens the real dialog.
          </p>
        </div>
        <div>
          <ModalDemo />
        </div>
      </div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl text-primary">Design system</h1>
        <p className="text-muted-foreground">
          Generated with ui-ux-pro-max. Source: design-system/ravelry-companion-site/MASTER.md.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Catalog theme="light" />
        <Catalog theme="dark" />
      </div>
    </div>
  );
}
