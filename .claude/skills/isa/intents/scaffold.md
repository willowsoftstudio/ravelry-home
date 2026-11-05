# Scaffold — create an ISA, or extend one in place

## Inputs
- The request (prompt, ticket, PRD, voice note, conversation).
- The project root. Default ISA path: `specs/isa/<slug>.isa.md`.

## Step 0 — Existing ISA?
Search `specs/isa/` (and any path the user names) for an ISA that already covers this work.
- **Found:** go to *Extend* below. Never write a second ISA for the same work.
- **Not found:** continue.

## Step 1 — Choose the path
- **Small** (one clear outcome, ≤ 8 criteria): do it inline, Steps 2–7.
- **Substantial** (new product or surface, several features, unclear direction, or the user asks for "the full workflow"): run the workflow instead:
  ```
  Workflow({scriptPath: "/home/jhollenbeck/ravelry/.claude/skills/isa/workflows/isa.js",
            args: {mode: "scaffold", request: "<the request text>", projectRoot: "<abs path>",
                   isaPath: "specs/isa/<slug>.isa.md", now: "<YYYY-MM-DD HH:MM>"}})
  ```
  Expand `~` to the absolute home path. When it returns, go to Step 7 (Restate).

## Step 2 — Extract
Read the request and the relevant code or docs. Write down:
- Who the work touches, and what their day looks like today (→ Problem).
- What they asked for literally, and what they actually want (→ L3).
- Explicit refusals and implied boundaries (→ Out of Scope).
- Hard limits (→ Constraints).

## Step 3 — Ambiguity check
List anything that would change L3 or L2 if answered differently. For each: is there a safe default?
- Safe default exists → take it, record it under `## Open Questions` with `recommended:`.
- No safe default, and it changes L3 → ask the user now (one message, at most 4 questions, each with a recommended answer). Log the answers.

## Step 4 — Write the ladder
Copy `templates/isa-template.md`. Write L3 first, then L2, then L1, from the summit (format.md §4).

## Step 5 — Write criteria
- Group into `F0 · Cross-cutting` + one `F<n>` per feature.
- Every criterion atomic, binary, falsifiable (format.md §6).
- Every testable Out of Scope item → one `Anti:` criterion in F0.
- Add `(after: …)` where order matters.
- Every criterion → ≥ 1 Test Strategy row with `anchors_to`. Every L2 bullet → at least one anchored row.
- Prefer `test`/`bash`/`curl`. Use `eval` with a written rubric when no deterministic check exists. Keep `manual` under 25%.

## Step 6 — Gate
```
python3 /home/jhollenbeck/ravelry/.claude/skills/isa/tools/isa.py fix   <isa>
python3 /home/jhollenbeck/ravelry/.claude/skills/isa/tools/isa.py check <isa>
```
Fix every HARD failure. Fix soft warnings unless you have a reason (record the reason in Decisions).

## Step 7 — Restate
Run `intents/restate.md`. Status stays `draft` until the principal confirms.

---

## Extend (existing ISA)
1. `python3 …/isa.py next-id <isa>` → first new ID. Never renumber.
2. Add the work as the next `F<n>` block (or new flat criteria if the ISA is flat).
3. Re-derive the ladder so it covers the new work. Compare to the old L3/L2.
4. Log a `extend —` entry in the Articulation Log.
5. Gate (Step 6).
6. If L3 or L2 changed → Restate before building. If not → set `status: building` and continue.
