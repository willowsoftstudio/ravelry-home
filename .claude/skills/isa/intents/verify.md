# Verify — prove criteria pass, and keep the ISA honest while building

## During the build (the loop)
1. `python3 /home/jhollenbeck/ravelry/.claude/skills/isa/tools/isa.py frontier <isa>` — build these first.
2. For each criterion you finish: run its Test Strategy rows (`isa.py rows <isa> --isc ISC-n`).
3. On pass: `isa.py mark <isa> ISC-n pass --evidence "<command> → <short result>"`. This ticks the box, adds a Verification line and updates progress.
4. On fail: fix the work, not the criterion. Change a criterion only when it was wrong about what done means. That is a direction change: log it in Decisions and, if L3/L2 move, Restate.
5. Something surprising happened? Append to Learning: `C: expected · R: really · L: rule`.

## Full verification pass (many criteria, or "verify everything")
Run the workflow in `verify` mode. It runs every row, has a skeptic try to refute each pass, and returns verdicts:
```
Workflow({scriptPath: "/home/jhollenbeck/ravelry/.claude/skills/isa/workflows/isa.js",
          args: {mode: "verify", projectRoot: "<abs path>", isaPath: "specs/isa/<slug>.isa.md", now: "<YYYY-MM-DD>"}})
```
The workflow does **not** edit the ISA. Apply its verdicts yourself with `isa.py mark`.

## Row types
| type | how to run | pass means |
|---|---|---|
| `bash`, `curl`, `test` | run the backticked command from the project root | exit 0, and threshold met |
| `eval` | judge the output against the rubric in `tool` | rubric met, with quoted evidence |
| `screenshot` | capture, then judge | visible and matches threshold |
| `manual` | ask the principal | they confirm |

Never mark a pass you did not observe. "The code looks right" is not evidence.

## Close
Every live criterion `[x]`, `isa.py check` passes, final Verification entries present → set `status: done`.
