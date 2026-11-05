# ISA Format Specification (v1.0)

An **Ideal State Artifact (ISA)** is one markdown file that says what "done" means for a piece of work and how we prove it. It moves a project from **Current State → Ideal State**. The format is checked by `tools/isa.py check`. If this document and any intent file disagree, this document wins.

Concept credit: Daniel Miessler's LifeOS ISA skill (MIT). This is an independent, simplified implementation.

---

## 1. File location and name

- Default path: `specs/isa/<slug>.isa.md` in the project the work belongs to.
- `<slug>` is lowercase-kebab, for example `billing-dashboard`.
- One ISA per project or initiative. **Extend an existing ISA. Never create a second ISA for the same work.**

## 2. Frontmatter

```yaml
---
isa_format: 1.0
title: "Billing dashboard v1"
slug: billing-dashboard
status: draft          # draft | aligned | building | verifying | done | abandoned
principal: "<who decides what done means>"
created: 2026-10-30
updated: 2026-10-30
progress: 0/12         # passing criteria / total criteria (tool keeps this current)
---
```

`status` meanings:

| status | meaning |
|---|---|
| `draft` | Written, not yet confirmed by the principal |
| `aligned` | Principal confirmed L3 and L2 through Restate |
| `building` | Work is in progress against the criteria |
| `verifying` | Build complete, criteria being proven |
| `done` | Every criterion passes and the completeness gate is green |
| `abandoned` | Stopped; keep the file as history |

## 3. Section order

Required sections are marked **R**. Write them in this order.

| # | Section | R | Purpose |
|---|---|---|---|
| 1 | `## Ideal State` | R | The ladder: L3, L2, L1 |
| 2 | `## Problem` | R | Current state and why it hurts |
| 3 | `## Out of Scope` | R | Explicit refusals (each one becomes an anti-criterion when it is testable) |
| 4 | `## Principles` |  | Trade-off rules ("X beats Y") |
| 5 | `## Constraints` |  | Hard limits: stack, budget, performance, compliance |
| 6 | `## Features` | R | Feature blocks with criteria |
| 7 | `## Test Strategy` | R | One or more rows per criterion |
| 8 | `## Open Questions` |  | Asks only the principal can settle |
| 9 | `## Decisions` |  | Dated decision log |
| 10 | `## Learning` |  | Dated lessons |
| 11 | `## Verification` |  | Dated evidence of passing criteria |
| 12 | `## Articulation Log` | R | Append-only raw record of every interview, discussion and restate |

## 4. The Ideal State ladder

```markdown
## Ideal State

### L3 · One sentence

<exactly one sentence>

### L2 · Summary

<exactly one sentence>

- <bullet 1>
- <bullet 2>
- <bullet 3>
- <bullet 4>

### L1 · Full articulation

<one or more paragraphs>
```

Rules:

1. **L3** is exactly one sentence (aim for ≤ 45 words). **L2** is one sentence plus **exactly four** bullets, each one sentence of ≤ 35 words. **L1** is free prose and has no length limit.
2. **Write from the summit.** Describe the best realistic version of done: what delights the people the work touches. Do not describe the floor ("does not crash"). Floors belong in criteria and anti-criteria.
3. Each level must agree with the one above it. L2 expands L3. L1 expands L2. Nothing in L1 can contradict L3.
4. **Drift rule:** the criteria together must deliver L3. If a criterion serves nothing in the ladder, cut it or change the ladder. If part of the ladder has no criterion, add one.
5. When L3 or L2 changes, the change goes to the principal through **Restate** before more work is built.

## 5. Feature blocks

```markdown
## Features

### F0 · Cross-cutting
Why: <one sentence: the outcome this block protects>

- [ ] ISC-1: <criterion>
- [ ] ISC-2: Anti: <thing that must never happen> (probe: <how we detect it>)

### F1 · <PascalCaseName>
Why: <one sentence>
Reach: <route or entry point> → <UI element or command>   (optional, for user-facing features)

- [ ] ISC-3: <criterion> (after: ISC-1)
```

- `F0 · Cross-cutting` holds criteria that apply to everything (build, deploy, security, anti-criteria for Out of Scope).
- Feature numbers are sequential. A new feature takes the next `F<n>`.
- A small ISA (≤ 8 criteria) may use one flat `## Criteria` section instead of `## Features`. The checker accepts both.

## 6. Criteria (ISC: Ideal State Criteria)

Line shape: `- [ ] ISC-<n>: <text>` or `- [x] ISC-<n>: <text>` (`[x]` = verified passing).

Each criterion must be:

| Property | Test |
|---|---|
| **Atomic** | It checks one thing. If you need "and" to describe it, split it. |
| **Falsifiable** | It names an observable result, or carries `(probe: …)`. A reader knows what a failure looks like. |
| **Binary** | Pass or fail. No "improved", "better", "fast" without a number. |
| **Anchored** | It serves a part of the ladder. |
| **Outcome, not design** | It states observable behaviour. It does not name internal classes, repositories or call counts unless the PRD requires them. |
| **Tested** | It has at least one row in `## Test Strategy`. |

Prefixes:

- `Anti:` marks an **anti-criterion**: a thing that must never be true. Each testable Out of Scope item gets one. Use `Anti: regression —` for behaviour that must not break.
- `(after: ISC-a, ISC-b)` declares dependencies. The **frontier** is every unchecked criterion whose dependencies all pass. Build the frontier first.

### ID stability rule

- IDs are global across the file: `ISC-1`, `ISC-2`, … with no repeats.
- **Never renumber.** New criteria take `max(ID) + 1`, even if they sit in an early feature block.
- **Never reuse** an ID. To retire a criterion, strike it through and keep the ID: `- [ ] ~~ISC-7: …~~ (retired 2026-11-02: reason)`. Retired criteria do not count toward progress.

## 7. Test Strategy

One markdown table. These six columns, in this order, always present (use an empty cell when a value does not apply; never delete a column):

```markdown
| isc | type | check | threshold | tool | anchors_to |
|-----|------|-------|-----------|------|------------|
| ISC-3 | curl | home page serves HTML | 200 + text/html | `curl -sfI https://x \| grep -qi text/html` | L2.b1 |
```

| column | content |
|---|---|
| `isc` | `ISC-<n>`. One criterion can have several rows. |
| `type` | One of: `bash`, `test`, `curl`, `eval`, `manual`, `screenshot` |
| `check` | Short description of what is checked |
| `threshold` | The pass bar, with a number or exact value when possible |
| `tool` | The exact command (in backticks) for runnable types; the rubric or reviewer for `eval` and `manual` |
| `anchors_to` | The ladder part it serves: `L3`, `L2`, `L2.b1`…`L2.b4`, `L1`, or `scope` for anti-criteria |

Type meanings:

- `bash`, `test`, `curl`: run deterministically. Exit code 0 = pass.
- `eval`: a model judges the result against a written rubric in `tool`. Use only when no deterministic check exists.
- `screenshot`: capture visual evidence, then judge.
- `manual`: a person must check. Allowed, but always visible. Keep these few.

Escape a literal `|` inside a cell as `\|`.

## 8. Articulation Log

```markdown
## Articulation Log

### 2026-10-30 14:00 · scaffold — initial prompt
> raw text of what the principal said
**Settled:** what changed in the ladder or sections because of it
```

- Append-only. Newest entry at the bottom. Never edit old entries.
- Entry header shape: `### YYYY-MM-DD HH:MM · <source> — <topic>`. `<source>` is one of `scaffold`, `restate`, `discuss`, `interview`, `refine`, `seed`, `extend`, `verify`.
- **No other line inside the log may start with `#`.** Quote pasted headings (`> ## Original`) or make them bold. A stray heading breaks parsing.
- Settled answers reach the ladder and the sections in the **same turn** they are logged.

## 9. Decisions, Learning, Verification

```markdown
## Decisions
- 2026-10-30 · <decision> — because <reason> (affects: ISC-4, ISC-9)

## Learning
- 2026-10-30 · C: <what we expected> · R: <what really happened> · L: <rule for next time>

## Verification
- 2026-10-30 · ISC-3 · pass · `curl -sfI …` → 200 text/html
```

## 10. Completeness gate

`tools/isa.py check` reports **hard** failures (block `done`) and **soft** warnings.

Hard:

| code | condition |
|---|---|
| `missing-section` | A required section is missing |
| `ladder-shape` | L3 not one sentence, L2 not one sentence + 4 bullets, or L1 empty |
| `no-criteria` | Zero criteria |
| `duplicate-id` | An ISC ID appears twice |
| `untested` | A live criterion has no Test Strategy row |
| `orphan-row` | A Test Strategy row names an ID that does not exist |
| `bad-columns` | Test Strategy header is not the six canonical columns |
| `bad-type` | A row uses a type outside the vocabulary |
| `log-heading` | A line inside the Articulation Log starts with `#` but is not an entry header |
| `bad-dependency` | `(after: …)` names an ID that does not exist, or the dependencies form a cycle |

Soft:

| code | condition |
|---|---|
| `compound` | Criterion joins two clauses or two actions with "and" (may not be atomic) |
| `vague` | Criterion uses vague words (fast, easy, better, nice, user-friendly, robust, intuitive, seamless) with no number |
| `no-anchor` | A row has an empty `anchors_to` |
| `ladder-unserved` | An L2 bullet has no row anchored to it |
| `no-anti` | Out of Scope has items but there is no `Anti:` criterion |
| `manual-heavy` | More than 25% of rows are `manual` |
| `ladder-long` | L3 over 45 words, or an L2 bullet over one sentence or 35 words |
| `scope-heavy` | More than 40 live criteria |
| `anti-heavy` | More `Anti:` criteria than Out of Scope items plus 15% of all criteria |
| `abs-path` | A Test Strategy `tool` uses an absolute filesystem path |
| `stale-progress` | Frontmatter `progress` does not match the checkboxes (`fix` repairs it) |

An ISA can move to `done` only when there are zero hard failures and every live criterion is `[x]`.
