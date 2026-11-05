export const meta = {
  name: 'isa',
  description: 'Ideal State Artifact: scaffold (extract, ladder panel, criteria, critique, gate), verify (run + refute every criterion), or rate',
  whenToUse: 'Substantial ISA work: a new product or multi-feature ISA, a full verification pass, or an unanchored second-opinion rating',
  phases: [
    { title: 'Extract', detail: 'request analyst + codebase surveyor' },
    { title: 'Ladder', detail: 'three independent ladder drafts, then a judge synthesizes' },
    { title: 'Criteria', detail: 'one writer per feature, IDs assigned in code' },
    { title: 'Assemble', detail: 'write the ISA file and run the gate' },
    { title: 'Critique', detail: 'three critics with distinct lenses' },
    { title: 'Revise', detail: 'apply fixes until the gate passes' },
    { title: 'Verify', detail: 'run each feature\'s rows, then a skeptic tries to refute each pass' },
    { title: 'Rate', detail: 'independent raters per dimension group' },
  ],
}

// ---------------------------------------------------------------- args
// mode:        'scaffold' | 'verify' | 'rate'            (default 'scaffold')
// request:     the raw ask (scaffold)
// projectRoot: absolute path of the project
// isaPath:     ISA path, relative to projectRoot (default specs/isa/<slug>.isa.md)
// now:         'YYYY-MM-DD HH:MM' (scripts cannot read the clock)
// skillDir:    defaults to ~/.claude/skills/isa
// seed:        true → derive from the existing codebase (scaffold)
// lite:        true → one ladder draft instead of three (scaffold)
// recheck:     true → also re-verify criteria already marked [x] (verify)
const A = args || {}
const MODE = A.mode || 'scaffold'
const ROOT = A.projectRoot || '.'
const NOW = A.now || 'YYYY-MM-DD 00:00'
const TODAY = NOW.slice(0, 10)
const SKILL = A.skillDir || '/home/jhollenbeck/ravelry/.claude/skills/isa'
const TOOL = `python3 ${SKILL}/tools/isa.py`
const FORMAT = `${SKILL}/references/format.md`

const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'isa'

// ---------------------------------------------------------------- schemas
const ANALYSIS = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    principal: { type: 'string', description: 'who decides what done means' },
    audience: { type: 'array', items: { type: 'string' } },
    problem: { type: 'string', description: 'current state and who it hurts, 2-5 sentences' },
    literalAsk: { type: 'string' },
    realWant: { type: 'string', description: 'what they actually want, beneath the literal ask' },
    outOfScope: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, reason: { type: 'string' } }, required: ['item', 'reason'] } },
    principles: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' } },
    features: { type: 'array', items: { type: 'object', properties: { name: { type: 'string', description: 'PascalCase' }, why: { type: 'string' }, reach: { type: 'string' }, notes: { type: 'string' } }, required: ['name', 'why'] } },
    openQuestions: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, recommended: { type: 'string' }, changesLadder: { type: 'boolean' } }, required: ['question', 'recommended', 'changesLadder'] } },
  },
  required: ['title', 'problem', 'literalAsk', 'realWant', 'outOfScope', 'constraints', 'features', 'openQuestions'],
}

const SURVEY = {
  type: 'object',
  properties: {
    existingIsaFound: { type: 'boolean', description: 'true ONLY if an ISA file for this same work already exists' },
    existingIsaPath: { type: 'string', description: 'its path when existingIsaFound is true; otherwise empty string' },
    stack: { type: 'array', items: { type: 'string' } },
    testCommands: { type: 'array', items: { type: 'string' }, description: 'exact commands that run tests, lint, build' },
    relevantPaths: { type: 'array', items: { type: 'string' } },
    existingBehaviour: { type: 'array', items: { type: 'string' }, description: 'facts about what already works today' },
    constraints: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['existingIsaFound', 'existingIsaPath', 'stack', 'testCommands', 'relevantPaths', 'existingBehaviour'],
}

const LADDER = {
  type: 'object',
  properties: {
    L3: { type: 'string', description: 'exactly one sentence' },
    L2: { type: 'string', description: 'exactly one sentence' },
    L2bullets: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
    L1: { type: 'string', description: 'paragraphs, no headings' },
    rationale: { type: 'string' },
  },
  required: ['L3', 'L2', 'L2bullets', 'L1'],
}

const SYNTH = {
  type: 'object',
  properties: {
    ...LADDER.properties,
    winner: { type: 'integer' },
    scores: { type: 'array', items: { type: 'object', properties: { draft: { type: 'integer' }, direction: { type: 'integer' }, summit: { type: 'integer' }, fidelity: { type: 'integer' }, note: { type: 'string' } }, required: ['draft', 'direction', 'summit', 'fidelity'] } },
    grafted: { type: 'array', items: { type: 'string' } },
  },
  required: ['L3', 'L2', 'L2bullets', 'L1', 'winner', 'scores'],
}

const CRITERIA = {
  type: 'object',
  properties: {
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'local key like F1.a, unique within this feature' },
          text: { type: 'string', description: 'atomic, binary, falsifiable; prefix "Anti: " for anti-criteria; may end with (probe: …)' },
          after: { type: 'array', items: { type: 'string' }, description: 'keys of prerequisite criteria (any feature, e.g. F0.a)' },
          done: { type: 'boolean', description: 'true ONLY if you ran the check and it passed (seed mode)' },
          rows: {
            type: 'array', minItems: 1,
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['bash', 'test', 'curl', 'eval', 'manual', 'screenshot'] },
                check: { type: 'string' }, threshold: { type: 'string' },
                tool: { type: 'string', description: 'exact command for bash/test/curl; rubric for eval; reviewer for manual' },
                anchors_to: { type: 'string', description: 'L3 | L2 | L2.b1..L2.b4 | L1 | scope' },
              },
              required: ['type', 'check', 'threshold', 'tool', 'anchors_to'],
            },
          },
        },
        required: ['key', 'text', 'rows'],
      },
    },
  },
  required: ['criteria'],
}

const GATE = {
  type: 'object',
  properties: {
    written: { type: 'boolean' },
    path: { type: 'string' },
    gateStatus: { type: 'string', enum: ['pass', 'fail'] },
    hard: { type: 'array', items: { type: 'string' } },
    soft: { type: 'array', items: { type: 'string' } },
  },
  required: ['written', 'gateStatus', 'hard', 'soft'],
}

const ISSUES = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'ISC-n, L3, L2.b2, Out of Scope, …' },
          severity: { type: 'string', enum: ['hard', 'soft'] },
          problem: { type: 'string' },
          fix: { type: 'string', description: 'the concrete replacement text or edit' },
        },
        required: ['target', 'severity', 'problem', 'fix'],
      },
    },
  },
  required: ['issues'],
}

const REVISED = {
  type: 'object',
  properties: {
    gateStatus: { type: 'string', enum: ['pass', 'fail'] },
    applied: { type: 'array', items: { type: 'string' } },
    rejected: { type: 'array', items: { type: 'object', properties: { issue: { type: 'string' }, reason: { type: 'string' } }, required: ['issue', 'reason'] } },
    remainingHard: { type: 'array', items: { type: 'string' } },
    ladderChanged: { type: 'boolean' },
  },
  required: ['gateStatus', 'applied', 'rejected', 'remainingHard', 'ladderChanged'],
}

const RUN = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          isc: { type: 'string' },
          verdict: { type: 'string', enum: ['pass', 'fail', 'blocked', 'manual'] },
          evidence: { type: 'string', description: 'command run + the observed output that proves the verdict' },
          note: { type: 'string' },
        },
        required: ['isc', 'verdict', 'evidence'],
      },
    },
  },
  required: ['results'],
}

const REFUTE = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: { isc: { type: 'string' }, refuted: { type: 'boolean' }, reason: { type: 'string' } },
        required: ['isc', 'refuted', 'reason'],
      },
    },
  },
  required: ['results'],
}

const RATING = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: { dimension: { type: 'string' }, score: { type: 'integer', minimum: 1, maximum: 5 }, evidence: { type: 'string' }, topFix: { type: 'string' } },
        required: ['dimension', 'score', 'evidence', 'topFix'],
      },
    },
  },
  required: ['scores'],
}

// ---------------------------------------------------------------- markdown assembly (deterministic)
function assemble(an, lad, feats, nowStamp, request) {
  const L = []
  const live = feats.flatMap(f => f.criteria)
  const done = live.filter(c => c.done).length
  L.push('---', 'isa_format: 1.0', `title: "${esc(an.title).replace(/"/g, "'")}"`, `slug: ${an.slug}`, 'status: draft',
    `principal: "${esc(an.principal || 'the requester').replace(/"/g, "'")}"`, `created: ${TODAY}`, `updated: ${TODAY}`,
    `progress: ${done}/${live.length}`, '---', '')
  L.push('## Ideal State', '', '### L3 · One sentence', '', lad.L3, '', '### L2 · Summary', '', lad.L2, '')
  lad.L2bullets.forEach(b => L.push(`- ${b}`))
  L.push('', '### L1 · Full articulation', '', String(lad.L1).replace(/^#+\s*/gm, ''), '')
  L.push('## Problem', '', an.problem, '')
  L.push('## Out of Scope', '')
  ;(an.outOfScope.length ? an.outOfScope : [{ item: 'None stated yet', reason: 'see Open Questions' }])
    .forEach(o => L.push(`- **${o.item.replace(/\.$/, '')}.** ${o.reason}`))
  L.push('')
  if (an.principles && an.principles.length) { L.push('## Principles', ''); an.principles.forEach(p => L.push(`- ${p}`)); L.push('') }
  if (an.constraints && an.constraints.length) { L.push('## Constraints', ''); an.constraints.forEach(c => L.push(`- ${c}`)); L.push('') }
  L.push('## Features', '')
  feats.forEach(f => {
    L.push(`### ${f.fid} · ${f.name}`, `Why: ${f.why}`)
    if (f.reach) L.push(`Reach: ${f.reach}`)
    L.push('')
    f.criteria.forEach(c => {
      const deps = c.afterIds.length ? ` (after: ${c.afterIds.join(', ')})` : ''
      L.push(`- [${c.done ? 'x' : ' '}] ${c.id}: ${String(c.text).replace(/\s*\(after:[^)]*\)/i, '')}${deps}`)
    })
    L.push('')
  })
  L.push('## Test Strategy', '', '| isc | type | check | threshold | tool | anchors_to |', '|-----|------|-------|-----------|------|------------|')
  live.forEach(c => c.rows.forEach(r => {
    const tool = ['bash', 'test', 'curl'].includes(r.type) && !/`/.test(r.tool) ? '`' + r.tool + '`' : r.tool
    L.push(`| ${c.id} | ${r.type} | ${esc(r.check)} | ${esc(r.threshold)} | ${esc(tool)} | ${esc(r.anchors_to)} |`)
  }))
  L.push('')
  L.push('## Open Questions', '')
  ;(an.openQuestions || []).forEach((q, i) => L.push(`- [ ] Q${i + 1}: ${q.question} — recommended: ${q.recommended}`))
  L.push('', '## Decisions', '', '## Learning', '', '## Verification', '')
  live.filter(c => c.done).forEach(c => L.push(`- ${TODAY} · ${c.id} · pass · seeded from existing passing check`))
  L.push('', '## Articulation Log', '', `### ${nowStamp} · ${A.seed ? 'seed' : 'scaffold'} — initial request`)
  String(request || '').split('\n').forEach(l => L.push(`> ${l}`))
  L.push('**Settled:** first draft of the ladder and criteria by the isa workflow; awaiting Restate.', '')
  return L.join('\n')
}

// ---------------------------------------------------------------- scaffold
async function scaffold() {
  if (!A.request && !A.seed) throw new Error('scaffold needs args.request (or seed: true)')
  const ctx = `Project root: ${ROOT}\nISA format spec (read it first): ${FORMAT}\n\nRequest:\n"""\n${A.request || '(seed mode: derive the ideal state from the existing codebase)'}\n"""`

  phase('Extract')
  const [an, sv] = await parallel([
    () => agent(`${ctx}\n\nYou are the request analyst for an Ideal State Artifact. Separate the literal ask from what the requester actually wants. Identify the audience, the current-state problem, explicit and implied refusals (Out of Scope), hard constraints, and a feature breakdown (2-7 features, PascalCase names, each with a one-sentence Why; add Reach for user-facing entry points). List ambiguities as open questions, each with a safe recommended default; set changesLadder=true only if a different answer would change the one-sentence goal. Do not invent requirements the request does not support; put guesses in openQuestions.`, { label: 'request-analyst', phase: 'Extract', schema: ANALYSIS }),
    () => agent(`${ctx}\n\nYou are the codebase surveyor. In the project root, find: any existing ISA under specs/isa/ that already covers this work; the stack; the exact commands that run tests, lint, typecheck and build (read package.json / Makefile / CI config); files relevant to the request; facts about what already works today; constraints the code imposes; risks. Read; do not modify anything.${A.seed ? ' SEED MODE: also run the existing test suite once and report which behaviours pass today.' : ''}`, { label: 'codebase-surveyor', phase: 'Extract', schema: SURVEY }),
  ])
  if (!an) throw new Error('request analyst failed')
  const survey = sv || { existingIsaFound: false, existingIsaPath: '', stack: [], testCommands: [], relevantPaths: [], existingBehaviour: [] }
  // Explicit boolean: a prose "none found" in a path field must not read as truthy
  if (survey.existingIsaFound === true && survey.existingIsaPath) {
    log(`Existing ISA found at ${survey.existingIsaPath} — stopping. Extend it in place instead (intents/scaffold.md § Extend).`)
    return { mode: 'scaffold', stopped: 'existing-isa', existingIsa: survey.existingIsaPath, analysis: an }
  }
  an.slug = slugify(an.slug || an.title)
  an.constraints = [...new Set([...(an.constraints || []), ...(survey.constraints || [])])]
  const isaPath = A.isaPath || `specs/isa/${an.slug}.isa.md`
  const facts = `Analysis:\n${JSON.stringify(an, null, 2)}\n\nCodebase survey:\n${JSON.stringify(survey, null, 2)}`

  phase('Ladder')
  const LENSES = A.lite ? [['user-delight', 'Write from the people the work touches: what their day looks like when this is done, and what surprises them in a good way.']] : [
    ['user-delight', 'Write from the people the work touches: what their day looks like when this is done, and what surprises them in a good way.'],
    ['trust-and-risk', 'Write from what must be guaranteed for this to be trusted: what the system enforces so nobody has to rely on good behaviour.'],
    ['sharp-scope', 'Write the narrowest ladder that still fully delivers the real want; make the fourth L2 bullet the boundary of what it deliberately stays.'],
  ]
  const drafts = (await parallel(LENSES.map(([name, lens]) => () =>
    agent(`${ctx}\n\n${facts}\n\nWrite an Ideal State ladder (format spec §4) through the "${name}" lens. ${lens}\nRules: L3 exactly one sentence, at most 45 words. L2 exactly one sentence plus exactly four bullets, each bullet ONE sentence of at most 35 words. L1 paragraphs, no headings. Write from the summit (the best realistic version of done), never the floor. Each level expands the one above and contradicts nothing.`,
      { label: `ladder:${name}`, phase: 'Ladder', schema: LADDER })))).filter(Boolean)
  if (!drafts.length) throw new Error('all ladder drafts failed')
  let lad = drafts[0]
  if (drafts.length > 1) {
    const synth = await agent(`${facts}\n\nThree independent Ideal State ladder drafts follow (0-indexed):\n${JSON.stringify(drafts, null, 2)}\n\nScore each 1-5 on direction (would building this deliver the real want: "${an.realWant}"?), summit (best realistic outcome, not a floor) and fidelity (L2 expands L3, L1 expands L2). Pick the winner, then produce the final ladder from the winner, grafting the strongest specific ideas from the others. Keep the shape rules: L3 one sentence ≤ 45 words; L2 one sentence + exactly 4 bullets, each one sentence ≤ 35 words; L1 paragraphs.`,
      { label: 'ladder-judge', phase: 'Ladder', schema: SYNTH })
    if (synth) lad = synth
  }

  phase('Criteria')
  const features = [
    { fid: 'F0', name: 'Cross-cutting', why: 'The work ships correct, safe and inside its boundaries.', reach: '', cross: true },
    ...an.features.map((f, i) => ({ fid: `F${i + 1}`, ...f })),
  ]
  const ladderTxt = `L3: ${lad.L3}\nL2: ${lad.L2}\n${lad.L2bullets.map((b, i) => `L2.b${i + 1}: ${b}`).join('\n')}`
  const written = await pipeline(features, f => agent(
    `${ctx}\n\nLadder:\n${ladderTxt}\n\n${facts}\n\nAll features: ${features.map(x => `${x.fid} ${x.name}`).join(', ')}\n\nWrite the Ideal State Criteria for ${f.fid} · ${f.name} only (Why: ${f.why}). Format spec §6-§7.\n` +
    (f.cross ? 'This is the cross-cutting block: build/typecheck/deploy health, security and privacy guarantees, and one "Anti: " criterion for every testable Out of Scope item (anchors_to: scope). ' : '') +
    `Each criterion: atomic (one check, no "and"), binary, falsifiable, with numbers instead of vague words. State observable outcomes, not design: do not name internal classes, repositories, clients or call counts unless the request requires them. Use "Anti: " only for Out of Scope items and real regressions, not to restate a positive criterion in reverse. Write every command relative to the project root (no absolute paths). Give each a local key "${f.fid}.a", "${f.fid}.b", … and list prerequisite keys in "after" (keys may point at other features, e.g. "F0.a", "F1.b"). Each needs ≥1 Test Strategy row; prefer test/bash/curl using the project's real commands (${(survey.testCommands || []).join('; ') || 'none found — write the command the test will use'}); use eval only with a written rubric in tool; keep manual rare. Every row anchors_to the ladder part it serves. Aim for 2-7 criteria.` +
    (A.seed ? ' SEED MODE: set done=true only for criteria whose check you actually ran and saw pass.' : ' Set done=false.'),
    { label: `criteria:${f.fid}`, phase: 'Criteria', schema: CRITERIA }))

  // Deterministic ID allocation: global, sequential, in feature order. Keys → IDs for dependencies.
  let n = 0
  const keyToId = {}
  const feats = features.map((f, i) => {
    const crits = ((written[i] && written[i].criteria) || []).map(c => ({ ...c, id: `ISC-${++n}` }))
    crits.forEach(c => { keyToId[c.key] = c.id })
    return { ...f, criteria: crits }
  })
  const dropped = features.filter((f, i) => !written[i]).map(f => f.fid)
  if (dropped.length) log(`Criteria writers failed for ${dropped.join(', ')} — those blocks are empty; the critique will flag them.`)
  feats.forEach(f => f.criteria.forEach(c => {
    c.afterIds = (c.after || []).map(k => keyToId[k]).filter(Boolean).filter(id => id !== c.id)
    c.done = !!(A.seed && c.done)
  }))

  phase('Assemble')
  const md = assemble(an, lad, feats, NOW, A.request || 'seed from existing codebase')
  const gate = await agent(
    `Write the file ${ROOT}/${isaPath} (create parent directories) with EXACTLY the content between the markers, byte for byte, no edits:\n<<<ISA\n${md}\n>>>ISA\n\nThen run: ${TOOL} check ${ROOT}/${isaPath} --json\nReturn written, path, gateStatus, and the hard/soft messages as "code: msg" strings. Do not fix anything.`,
    { label: 'assemble', phase: 'Assemble', schema: GATE, effort: 'low' })
  if (!gate || !gate.written) throw new Error('failed to write the ISA file')

  phase('Critique')
  const CRITICS = [
    ['falsifiability', 'For every criterion: is it atomic, binary and falsifiable? Could a reader write the failing test? Does its Test Strategy row really prove it (right command, threshold matches the text)? Propose exact replacement text.'],
    ['drift', 'Do the criteria together deliver L3? Find ladder parts (L3, each L2 bullet) no criterion serves, criteria that serve nothing in the ladder, and contradictions between L1/L2/L3. Is L3 written from the summit, not a floor? Propose exact additions or cuts.'],
    ['scope-and-reality', 'Check the ISA against the codebase and the request: criteria that leak into Out of Scope, missing anti-criteria, commands that do not exist in this repo, thresholds that are impossible or untestable here, missing dependency edges, and requirements the request never asked for.'],
  ]
  const critiques = await parallel(CRITICS.map(([name, lens]) => () => agent(
    `Critique the Ideal State Artifact at ${ROOT}/${isaPath} (format spec: ${FORMAT}). Project root: ${ROOT}. Original request:\n"""\n${A.request || 'seed'}\n"""\nGate output so far: ${JSON.stringify({ hard: gate.hard, soft: gate.soft })}\n\nYour lens: ${name}. ${lens}\nBe skeptical, but report only real problems, each with a concrete fix. Do not edit the file.`,
    { label: `critic:${name}`, phase: 'Critique', schema: ISSUES })))
  const issues = critiques.filter(Boolean).flatMap((c, i) => c.issues.map(x => ({ lens: CRITICS[i][0], ...x })))
  log(`${issues.length} critique issues (${issues.filter(i => i.severity === 'hard').length} hard)`)

  phase('Revise')
  const rev = await agent(
    `Revise the ISA at ${ROOT}/${isaPath} (format spec: ${FORMAT}).\n\nCritique issues:\n${JSON.stringify(issues, null, 2)}\n\nGate hard failures: ${JSON.stringify(gate.hard)}\n\nApply every hard issue and every soft issue you agree with; reject an issue only with a stated reason. Keep scope tight: prefer rewording or merging over adding criteria, add a new criterion only for a hard coverage gap, and keep net criteria growth under 20%. Fix every ladder-long, abs-path and anti-heavy soft warning from the gate. Rules: never renumber ISC IDs; new criteria take the next ID from \`${TOOL} next-id <isa>\`; every criterion keeps ≥1 Test Strategy row in the six canonical columns; escape | in cells as \\|; no line inside the Articulation Log may start with #. Append ONE Articulation Log entry at the end: "### ${NOW} · scaffold — workflow critique" with a **Settled:** line summarizing what changed. Then loop: \`${TOOL} fix <isa> --date ${TODAY}\` and \`${TOOL} check <isa>\` until there are no HARD failures (at most 4 rounds). Report ladderChanged=true if you changed L3, L2 or any L2 bullet.`,
    { label: 'revise', phase: 'Revise', schema: REVISED })

  return {
    mode: 'scaffold',
    isaPath: `${ROOT}/${isaPath}`,
    gate: rev ? rev.gateStatus : gate.gateStatus,
    remainingHard: rev ? rev.remainingHard : gate.hard,
    ladder: { L3: lad.L3, L2: lad.L2, L2bullets: lad.L2bullets },
    ladderChangedInRevise: rev ? rev.ladderChanged : false,
    ladderScores: lad.scores || null,
    criteria: n,
    openQuestions: an.openQuestions,
    ladderBlockingQuestions: (an.openQuestions || []).filter(q => q.changesLadder),
    critique: { total: issues.length, applied: rev ? rev.applied.length : 0, rejected: rev ? rev.rejected : [] },
    next: 'Re-read L3/L2 from the file (`isa.py ladder`), then run intents/restate.md with the principal. Ask ladderBlockingQuestions first.',
  }
}

// ---------------------------------------------------------------- verify
async function verify() {
  const isa = `${ROOT}/${A.isaPath}`
  if (!A.isaPath) throw new Error('verify needs args.isaPath')
  phase('Verify')
  const load = await agent(`Run \`${TOOL} criteria ${isa}\` and \`${TOOL} rows ${isa}\` and return both JSON outputs verbatim as {criteria, rows}.`,
    { label: 'load', phase: 'Verify', effort: 'low', schema: { type: 'object', properties: { criteria: { type: 'array', items: { type: 'object' } }, rows: { type: 'array', items: { type: 'object' } } }, required: ['criteria', 'rows'] } })
  if (!load) throw new Error('could not load the ISA')
  const targets = load.criteria.filter(c => A.recheck || !c.done)
  const skipped = load.criteria.length - targets.length
  if (skipped) log(`Skipping ${skipped} criteria already marked [x] (pass recheck: true to include them)`)
  const groups = {}
  targets.forEach(c => { (groups[c.feature] = groups[c.feature] || []).push({ ...c, rows: load.rows.filter(r => String(r.isc).toUpperCase() === c.id) }) })
  const featureList = Object.entries(groups)

  const results = await pipeline(featureList,
    ([feature, crits]) => agent(
      `Project root: ${ROOT}. Verify these Ideal State criteria from ${isa} (feature ${feature}) by RUNNING their Test Strategy rows:\n${JSON.stringify(crits, null, 2)}\n\nFor bash/test/curl rows: run the command from the project root, and judge pass only if it exits 0 AND the threshold is met. For eval rows: produce the artifact and judge it against the rubric, quoting evidence. For screenshot rows: capture if tooling exists, else verdict blocked. For manual rows: verdict manual. If a prerequisite (server, credential, fixture) is missing, verdict blocked and say what is missing. Never start long-lived processes without stopping them. Never mark a pass you did not observe. Do not edit the ISA or the code.`,
      { label: `run:${feature}`, phase: 'Verify', schema: RUN }),
    (run, [feature, crits]) => {
      if (!run) return null
      const passes = run.results.filter(r => r.verdict === 'pass')
      if (!passes.length) return { feature, results: run.results }
      return agent(
        `Project root: ${ROOT}. A verifier claims these criteria from ${isa} PASS:\n${JSON.stringify(passes.map(p => ({ ...p, criterion: crits.find(c => c.id === p.isc) })), null, 2)}\n\nTry to REFUTE each claim. Does the evidence really show the criterion text is true, not just that a command exited 0? Does the test actually exercise the behaviour, or is it a stub, a skipped test, or a check of something else? Re-run anything you doubt. Default to refuted=true when the evidence does not clearly prove the criterion.`,
        { label: `refute:${feature}`, phase: 'Verify', schema: REFUTE })
        .then(ref => {
          const byIsc = {}
          ;((ref && ref.results) || []).forEach(r => { byIsc[r.isc] = r })
          return {
            feature,
            results: run.results.map(r => r.verdict === 'pass' && (!byIsc[r.isc] || byIsc[r.isc].refuted)
              ? { ...r, verdict: 'disputed', note: (byIsc[r.isc] && byIsc[r.isc].reason) || 'skeptic did not confirm' }
              : r),
          }
        })
    })

  const all = results.filter(Boolean).flatMap(r => r.results)
  const pass = all.filter(r => r.verdict === 'pass')
  return {
    mode: 'verify',
    isaPath: isa,
    counts: ['pass', 'fail', 'disputed', 'blocked', 'manual'].reduce((o, v) => ({ ...o, [v]: all.filter(r => r.verdict === v).length }), {}),
    skippedAlreadyPassing: skipped,
    results: all,
    markCommands: pass.map(r => `${TOOL} mark ${isa} ${r.isc} pass --evidence ${JSON.stringify(String(r.evidence).slice(0, 200))} --date ${TODAY}`),
    next: 'Run markCommands to record confirmed passes. Investigate fail/disputed. Ask the principal about manual rows.',
  }
}

// ---------------------------------------------------------------- rate
async function rate() {
  const isa = `${ROOT}/${A.isaPath}`
  if (!A.isaPath) throw new Error('rate needs args.isaPath')
  phase('Rate')
  const GROUPS = [
    ['Direction', 'Ladder fidelity'],
    ['Criteria quality', 'Coverage', 'Verifiability'],
    ['Scope discipline', 'Auditability'],
  ]
  const rubric = `Rubric (5 = best): Direction — L3 names who it is for and the outcome they feel; nobody could build the wrong thing from it. Ladder fidelity — L2 expands L3, L1 expands L2, no contradictions. Criteria quality — atomic, binary, numbered thresholds, explicit falsifiers. Coverage — every L2 bullet and scope item has criteria, no orphans. Verifiability — mostly deterministic rows with exact commands; eval rows carry rubrics. Scope discipline — specific Out of Scope, each with an anti-criterion. Auditability — Articulation Log, Decisions, Verification current.`
  const rated = await parallel(GROUPS.map((dims, i) => () => agent(
    `Rate the Ideal State Artifact at ${isa} (format: ${FORMAT}). First run \`${TOOL} check ${isa}\` for the mechanical gate. ${rubric}\nScore ONLY these dimensions: ${dims.join(', ')}. Be strict and independent; quote the ISA as evidence. Give one top fix per dimension.`,
    { label: `rate:${dims[0].toLowerCase().replace(/\s+/g, '-')}`, phase: 'Rate', schema: RATING })))
  const scores = rated.filter(Boolean).flatMap(r => r.scores)
  const overall = scores.length ? Math.min(...scores.map(s => s.score)) : 0
  return {
    mode: 'rate',
    isaPath: isa,
    overall,
    verdict: overall >= 4 ? 'BUILD' : overall === 3 ? 'REFINE' : 'DISCUSS-FIRST',
    scores,
    missingDimensions: GROUPS.flat().filter(d => !scores.some(s => s.dimension.toLowerCase() === d.toLowerCase())),
  }
}

if (MODE === 'scaffold') return await scaffold()
if (MODE === 'verify') return await verify()
if (MODE === 'rate') return await rate()
throw new Error(`unknown mode "${MODE}" (scaffold | verify | rate)`)
