import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

// ISA ISC-72: a Client Component that imports the Ravelry API client fails the
// production build. The fixture route lives only for the duration of the test,
// and the build goes to a separate distDir so it never touches .next.

const root = join(__dirname, "..", "..");
const fixtureDir = join(root, "src/app/server-only-guard-fixture");
const distDir = ".next-guard";

it(
  "fails the build with a server-only error",
  () => {
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      join(fixtureDir, "page.tsx"),
      [
        '"use client";',
        'import { ravelryGet } from "@/lib/ravelry/client";',
        "export default function Page() {",
        "  return <button onClick={() => void ravelryGet(\"/x.json\", {}, { kind: \"readonly\" })}>x</button>;",
        "}",
        "",
      ].join("\n"),
    );
    try {
      const result = spawnSync("pnpm", ["exec", "next", "build"], {
        cwd: root,
        env: { ...process.env, NEXT_DIST_DIR: distDir, NEXT_TELEMETRY_DISABLED: "1" },
        encoding: "utf8",
        timeout: 280_000,
      });
      const output = `${result.stdout}\n${result.stderr}`;
      expect(result.status, output.slice(-2000)).not.toBe(0);
      expect(output).toMatch(/server-only/);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
      rmSync(join(root, distDir), { recursive: true, force: true });
    }
  },
  300_000,
);
