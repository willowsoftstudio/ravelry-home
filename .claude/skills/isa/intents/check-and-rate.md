# Check and Rate

## Check — "is it complete?", "audit this ISA", "ready to close?"
1. `python3 /home/jhollenbeck/ravelry/.claude/skills/isa/tools/isa.py check <isa> --json`
2. Then the checks the tool cannot do. Read the ISA and judge:
   - **Drift:** do the criteria together deliver L3? List ladder parts no criterion serves, and criteria that serve nothing in the ladder.
   - **Summit:** is L3 written as the best realistic outcome, or as a floor?
   - **Falsifiers:** for each criterion, could a reader write the failing test? Flag ones that cannot.
   - **Scope leaks:** criteria that build something in Out of Scope.
3. Report a gap table: `section | severity (hard/soft) | gap | fix`. Say `status: pass` only with zero hard gaps (tool + judgment).
4. "Ready to close?" also requires every live criterion `[x]` with a Verification entry.

## Rate — "rate / score this ISA"
Score 1–5 on each dimension, with one sentence of evidence each:

| Dimension | 5 looks like |
|---|---|
| Direction | L3 names who it is for and the outcome they feel; nobody could build the wrong thing from it |
| Ladder fidelity | L2 expands L3; L1 expands L2; no contradictions |
| Criteria quality | Atomic, binary, numbered thresholds, explicit falsifiers |
| Coverage | Every L2 bullet and scope item has criteria; no orphans |
| Verifiability | Mostly deterministic rows with exact commands; `eval` rows carry rubrics |
| Scope discipline | Out of Scope is specific, and each item has an anti-criterion |
| Auditability | Articulation Log, Decisions and Verification are current |

Overall = the lowest dimension score (a chain is as strong as its weakest link). Verdict:
- ≥ 4: `BUILD`
- 3: `REFINE` — list the 3 highest-value fixes
- ≤ 2: `DISCUSS-FIRST` — hand off to `intents/discuss.md`

For a second opinion that is not anchored on your own draft, run the workflow in `rate` mode (independent raters per dimension).
