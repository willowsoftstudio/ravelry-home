# Seed, Refine, Append

## Seed — "draft an ISA from this repo / existing code"
1. Read README, docs, routes, tests and recent commits. Do not ask what you can read.
2. Reconstruct the current state as the Problem's "today", and infer the ideal state from intent visible in the code (TODOs, issues, docs).
3. Existing passing tests become `[x]` criteria with `test` rows (run them first; mark only what passes).
4. Everything inferred goes under Open Questions with `recommended:` defaults.
5. Log `seed —` in the Articulation Log. Gate. Restate. Large repos: run the workflow in `scaffold` mode with `seed: true`.

## Refine — "open questions", "ask me the questions", "take your defaults"
1. Read `## Open Questions`.
2. "Ask me": ask them (AskUserQuestion, ≤ 4 per message, recommended answer first). "Take your defaults": accept each `recommended:`.
3. Tick each answered question `[x]`, append ` → answered: …`, fold the answer into the sections, log it (source `refine`).
4. If answers move L3/L2 → Restate. If the questions are tangled or keep multiplying → Discuss.

## Append — decisions, learning, verification
Use the exact line shapes in `references/format.md` §9. Append only; never rewrite older lines. Link the affected `ISC-n` IDs. Verification lines should go through `isa.py mark` so the checkbox and progress stay in sync.

## Render — "HTML view", "open in browser"
`python3 /home/jhollenbeck/ravelry/.claude/skills/isa/tools/isa.py render <isa> [--output path]` writes a self-contained page with status pills (pass / frontier / blocked), the Test Strategy table and gate results. Do not hand-roll a renderer.
