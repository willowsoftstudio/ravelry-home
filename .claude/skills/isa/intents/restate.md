# Restate — say the direction back before building

Run before building a new ISA, or after any change to L3 or L2. Do not run it when nothing in L3/L2 changed.

## Steps
1. `python3 /home/jhollenbeck/ravelry/.claude/skills/isa/tools/isa.py ladder <isa>`
2. Show the user, word for word:

   > **Here is what I think done looks like.**
   >
   > **L3:** <L3>
   >
   > **L2:** <L2>
   > - <b1>
   > - <b2>
   > - <b3>
   > - <b4>
   >
   > **Out of scope:** <one line listing the refusals>
   >
   > Is this right? A plain "yes", a wording fix, or tell me what is off.

   Use AskUserQuestion when it is available: options "Yes, build it", "Wording fix", "Direction is off".
3. Route the answer:

| Answer | Action |
|---|---|
| Clean yes | Set `status: aligned`. Log `restate — confirmed`. Continue to build. |
| Wording fix only | Apply it to the ladder. Log it. Set `status: aligned`. |
| Anything more ("sort of", "but…", a new audience, a new goal) | Log the raw answer. Run `intents/discuss.md` at `quick` depth. Restate again after. |

4. Log the exchange in the Articulation Log (`### <date time> · restate — <topic>`, quoted answer, **Settled:** line) and update the ladder in the same turn.
5. `python3 …/isa.py fix <isa>`.
