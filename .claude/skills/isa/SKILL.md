---
name: isa
description: "Owns the Ideal State Artifact (ISA): one markdown file that says what done means for a project and how to prove it. Scaffolds a new ISA (Ideal State ladder L3/L2/L1, feature blocks of atomic ISC criteria, a Test Strategy row per criterion), extends one in place, restates the direction back before building, runs the Discuss/Interview alignment loop, checks completeness, rates quality, seeds an ISA from an existing repo, verifies criteria while building, and renders an HTML view. Ships a deterministic checker (tools/isa.py) and a multi-agent workflow (workflows/isa.js) for substantial scaffolds, full verification passes and unanchored ratings. USE WHEN: ISA, ideal state, ideal state criteria, ISC, L1 L2 L3, what does done look like, define done, restate, say it back, are we building the right thing, drift check, discuss, interview me, are we aligned, open questions, rate this ISA, check this ISA, verify the criteria, frontier, seed an ISA from this repo, render the ISA. NOT FOR: reconciling several PRDs (prd-slayer), writing a PRD from a decision worksheet (prd-finalizer), epic/task breakdown (slice-tasks, plan-work)."
---

# ISA — Ideal State Artifact

An ISA moves work from **Current State → Ideal State**. Direction comes first: nothing matters more than being sure we are building the right thing. Every ISA opens with the **ladder**:

- **L3:** one sentence
- **L2:** one sentence + exactly four bullets
- **L1:** the full articulation

All three levels are written **from the summit**: the best realistic version of done, never the floor. The floor (what must not break) goes in criteria and `Anti:` criteria. Below the ladder are **criteria** (`ISC-n`). Each one is atomic, binary and falsifiable, and each has at least one row in the **Test Strategy** table.

The format authority is `references/format.md`. It wins any conflict with this file or an intent.

## Files

| Path | What |
|---|---|
| `references/format.md` | The spec: sections, ladder rules, criteria rules, ID stability, Test Strategy columns, completeness gate |
| `templates/isa-template.md` | Blank ISA to copy |
| `examples/link-shortener.isa.md` | A complete, gate-passing example |
| `intents/*.md` | Step-by-step playbooks (table below) |
| `tools/isa.py` | Deterministic checker and editor (Python 3, stdlib only) |
| `workflows/isa.js` | Multi-agent workflow: `scaffold`, `verify`, `rate` modes |

`TOOL` below means `python3 /home/jhollenbeck/ravelry/.claude/skills/isa/tools/isa.py`.

## Intent routing

Load the intent file before you act. When the verb is ambiguous: no ISA yet → Scaffold; an ISA exists → Check.

| Intent | Trigger | File |
|---|---|---|
| **Scaffold / Extend** | "create / scaffold an ISA", "define done for X", "add feature F<n> to the ISA" | `intents/scaffold.md` |
| **Restate** | before building a new ISA or a changed L3/L2; "say it back", "is this what I want" | `intents/restate.md` |
| **Discuss / Interview / Questionnaire** | `TOOL status` says `DISCUSS`; a restate answer that is more than a clean yes; "discuss", "interview me", "are we aligned", "questions for someone else" | `intents/discuss.md` |
| **Check / Rate** | "is it complete", "audit", "ready to close", "rate / score this ISA", "drift check" | `intents/check-and-rate.md` |
| **Verify** | building against an ISA; "verify the criteria", "what's next" (frontier) | `intents/verify.md` |
| **Seed / Refine / Append / Render** | "draft an ISA from this repo", "open questions", "take your defaults", "log a decision", "HTML view" | `intents/seed-refine-append.md` |

## Tool quick reference

```bash
TOOL check    <isa> [--json]     # completeness gate; exit 1 on HARD failures
TOOL status   <isa>              # DISCUSS | RESTATE | BUILD | DONE, plus progress and frontier
TOOL ladder   <isa>              # print L3 + L2 for Restate
TOOL frontier <isa>              # unchecked criteria whose dependencies all pass: build these next
TOOL next-id  <isa>              # next free ISC number (never renumber)
TOOL criteria <isa>              # live criteria as JSON
TOOL rows     <isa> [--isc ISC-n]  # Test Strategy rows as JSON
TOOL mark     <isa> ISC-n pass|fail --evidence "cmd → result"   # tick box, log Verification, update progress
TOOL fix      <isa>              # repair frontmatter progress/updated
TOOL render   <isa> [--output f.html]   # self-contained HTML view
```

## The workflow (substantial work)

Run it when the work is a new product or surface, has several features, or needs a full verification pass or an independent rating. Expand `~` to the absolute home path, and pass the clock in through `now`, because scripts cannot read it.

**If Workflow refuses the `scriptPath`** ("must be a script path this tool returned, or a file you can already read"), the session cannot read the skill's install directory, which happens when reads outside the working directory are blocked. The workflow's subagents would also be unable to read `references/format.md`. Fix: install the skill into the project (`install.sh --project <repo>`) and use that copy's `workflows/isa.js`, or ask the user to `/add-dir` the skill directory. Pass `skillDir` when the copy is not at the default location.

```js
Workflow({ scriptPath: "/home/jhollenbeck/ravelry/.claude/skills/isa/workflows/isa.js", args: {
  mode: "scaffold",              // or "verify" | "rate"
  request: "<raw request text>", // scaffold only
  projectRoot: "/abs/path/to/project",
  isaPath: "specs/isa/<slug>.isa.md",   // optional for scaffold
  now: "2026-10-30 14:05",
  // seed: true    → derive from the existing codebase
  // lite: true    → one ladder draft instead of a three-way panel
  // recheck: true → verify mode also re-checks criteria already [x]
}})
```

| Mode | Pipeline | Agents |
|---|---|---|
| `scaffold` | Extract (request analyst ∥ codebase surveyor) → Ladder (3 lens drafts → judge synthesizes) → Criteria (one writer per feature; IDs and dependency edges assigned in code) → Assemble (deterministic markdown + gate) → Critique (falsifiability ∥ drift ∥ scope-and-reality) → Revise (apply fixes, loop the gate until no HARD failures) | about 9 + one per feature |
| `verify` | Load → per feature: run every row → a skeptic tries to refute each claimed pass. Returns verdicts and `markCommands`. **It does not edit the ISA.** | 1 + 2 per feature |
| `rate` | 3 independent raters over 7 dimensions; overall = the lowest score → `BUILD` / `REFINE` / `DISCUSS-FIRST` | 3 |

After `scaffold`, the workflow never treats the ISA as confirmed. Read the ladder from the file and run **Restate** with the principal, asking `ladderBlockingQuestions` first. After `verify`, review the results and run the `markCommands` you accept.

## Rules that bite every intent

1. **One ISA per piece of work.** Extend in place. Never write a second one.
2. **IDs never renumber and are never reused.** New criteria take `TOOL next-id`. Retire a criterion with strikethrough, not by deleting it.
3. **Test Strategy keeps all six columns:** `isc | type | check | threshold | tool | anchors_to`. Use an empty cell, never a missing column. Escape `|` as `\|`.
4. **The Articulation Log is append-only, and no line inside it may start with `#`.** Quote pasted headings (`> ## …`). Fold settled answers into the ladder in the same turn you log them.
5. **A changed L3 or L2 goes through Restate before more is built.**
6. **Never mark a pass you did not observe.** Fix the work, not the criterion. Changing a criterion is a direction change: log it in Decisions.
7. Run `TOOL check` after every edit. Do not leave the ISA with HARD failures.

## Examples

```
User: "Define done for the new billing dashboard"
→ Scaffold. Small → inline; multi-feature → workflow mode scaffold
→ specs/isa/billing-dashboard.isa.md passes the gate, then Restate shows L3/L2 before any build
```

```
Restate answer: "sort of — it's really for finance, not engineers"
→ Discuss at quick depth: show the ladder, ≤ 4 questions with recommended answers (one challenge), log, fold, restate again
```

```
User: "Verify everything in the Snip ISA"
→ workflow mode verify → review verdicts → TOOL mark for confirmed passes → TOOL check
```

Concept credit: Daniel Miessler's LifeOS ISA skill (MIT). This is an independent, simplified implementation.
