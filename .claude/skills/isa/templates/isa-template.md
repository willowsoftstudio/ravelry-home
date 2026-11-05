---
isa_format: 1.0
title: "{{TITLE}}"
slug: {{SLUG}}
status: draft
principal: "{{PRINCIPAL}}"
created: {{DATE}}
updated: {{DATE}}
progress: 0/0
---

## Ideal State

### L3 · One sentence

{{One sentence, written from the summit: the best realistic version of done.}}

### L2 · Summary

{{One sentence that expands L3.}}

- {{Bullet 1: a major part of the outcome.}}
- {{Bullet 2}}
- {{Bullet 3}}
- {{Bullet 4: often the boundary — what it deliberately stays.}}

### L1 · Full articulation

{{Paragraphs: who it is for, what their day looks like when this is done, what is different from today, and what surprises them in a good way.}}

## Problem

{{Current state. Who hurts, how, and what they do today instead.}}

## Out of Scope

- **No {{thing}}.** {{Reason.}}

## Principles

- {{X beats Y. Trade-off rule the team uses when two goods conflict.}}

## Constraints

- {{Hard limit: stack, budget, performance number, compliance rule.}}

## Features

### F0 · Cross-cutting
Why: {{The outcome that applies to every feature.}}

- [ ] ISC-1: {{Criterion}}
- [ ] ISC-2: Anti: {{Out-of-scope item that must never appear}} (probe: {{how we detect it}})

### F1 · {{FeatureName}}
Why: {{One sentence.}}

- [ ] ISC-3: {{Criterion}} (after: ISC-1)

## Test Strategy

| isc | type | check | threshold | tool | anchors_to |
|-----|------|-------|-----------|------|------------|
| ISC-1 | bash | {{check}} | {{threshold}} | `{{command}}` | L3 |
| ISC-2 | curl | {{check}} | {{threshold}} | `{{command}}` | scope |
| ISC-3 | test | {{check}} | {{threshold}} | `{{command}}` | L2.b1 |

## Open Questions

- [ ] Q1: {{Question only the principal can answer}} — recommended: {{default you would take}}

## Decisions

## Learning

## Verification

## Articulation Log

### {{DATE}} {{TIME}} · scaffold — initial prompt
> {{Raw request text}}
**Settled:** first draft of the ladder and criteria.
