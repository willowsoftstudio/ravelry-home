# Discuss — the alignment loop (also: Interview, Questionnaire)

Run when direction is uncertain:
- `isa.py status <isa>` returns `DISCUSS`, or
- a Restate answer was more than a clean yes, or
- the user says "discuss", "interview me", "are we aligned", "figure out the shape", or
- doubt appears mid-build about what done means.

## Depth

| Depth | When | Rounds | Questions / round |
|---|---|---|---|
| `quick` | One point is off | 1 | ≤ 4 |
| `full` | Several sections are uncertain | until stop | ≤ 4 |
| `deep` | New product, or L3 itself is in doubt | until stop, plus a coverage map | ≤ 4 |

## A round
1. **Show the ladder as it stands** (L3 + L2) so the user corrects a concrete thing, not an abstraction.
2. **Pick the frontier:** the questions whose answers would change the ladder most. Do not ask what the code or docs can answer — look it up.
3. **Ask** (AskUserQuestion when available). Every question:
   - Names its section (L3, L2.b2, Out of Scope, F3…).
   - Gives a **recommended answer** as option 1.
   - One question per round is a **challenge question**: "What would make this a failure even if every criterion passes?" or "Who is this NOT for?"
4. **Checkpoint immediately:** append the raw Q&A to the Articulation Log (`### <date time> · discuss — <topic>`). No line inside may start with `#`.
5. **Fold** the answers into the ladder, sections and criteria in the same turn. New criteria take `next-id`.
6. **Stop** when: a round changes nothing in L3/L2, or the user says stop, or `deep` coverage map has no gaps.
7. **Say back**: run `intents/restate.md`.

## Coverage map (deep only)
Keep a table in your reply (not in the ISA) of: audience · problem · L3 · each L2 bullet · scope · constraints · each feature → `settled` / `assumed` / `open`. Next round targets `open`, then `assumed`.

## Interview variant
"Interview me / fill in the ISA / deepen": same loop at `full` depth, targeting empty or thin sections first.

## Questionnaire variant
For someone who is not in the conversation. Write `specs/isa/<slug>.questions.md`: each question with its section, why it matters, the recommended answer and a blank. When answers come back, log them (source `interview`) and fold.
