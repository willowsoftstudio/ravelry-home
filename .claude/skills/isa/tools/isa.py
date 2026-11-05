#!/usr/bin/env python3
"""isa.py — deterministic tooling for Ideal State Artifacts (ISA).

Spec: ../references/format.md

Commands:
  check     <isa> [--json]          completeness gate (exit 1 on hard failures)
  ladder    <isa>                   print L3 and L2 (for Restate)
  status    <isa> [--json]          progress, frontier, and an alignment verdict
  frontier  <isa>                   unchecked criteria whose dependencies all pass
  next-id   <isa>                   next free ISC number
  rows      <isa> [--isc ISC-n]     Test Strategy rows as JSON
  criteria  <isa>                   live criteria as JSON (id, done, feature, deps, text)
  mark      <isa> ISC-n pass|fail --evidence "..." [--date YYYY-MM-DD]
  fix       <isa> [--date YYYY-MM-DD]  repair frontmatter progress/updated
  render    <isa> [--output path]   self-contained HTML view

Python 3.8+, stdlib only.
"""
import argparse
import datetime as dt
import html
import json
import re
import sys
from pathlib import Path

KNOWN_SECTIONS = {"Ideal State", "Problem", "Out of Scope", "Principles", "Constraints", "Features", "Criteria",
                  "Test Strategy", "Open Questions", "Decisions", "Learning", "Verification", "Articulation Log"}
REQUIRED_SECTIONS = ["Ideal State", "Problem", "Out of Scope", "Test Strategy", "Articulation Log"]
CANON_COLUMNS = ["isc", "type", "check", "threshold", "tool", "anchors_to"]
TYPES = {"bash", "test", "curl", "eval", "manual", "screenshot"}
VAGUE = re.compile(r"\b(fast|quick(ly)?|easy|easily|better|nice|user-friendly|robust|intuitive|seamless(ly)?|clean|simple)\b", re.I)
HAS_NUMBER = re.compile(r"\d")
# " and " joining two clauses (", and …") or two actions ("… and sends …"); noun lists like "old and new values" pass
COMPOUND = re.compile(r",\s+and\s+|\band\s+(then\s+)?(also\s+)?(is|are|was|has|have|returns?|creates?|sends?|writes?|stores?|shows?|displays?|updates?|emails?|notifies?|logs?|deletes?|removes?|adds?|calls?|triggers?|redirects?|renders?|saves?|posts?|pushes?|raises?)\b", re.I)
CRIT_RE = re.compile(r"^\s*-\s*\[( |x|X)\]\s*(~~)?\s*(ISC-(\d+))\s*:\s*(.*)$")
AFTER_RE = re.compile(r"\(after:\s*([^)]*)\)", re.I)
LOG_ENTRY_RE = re.compile(r"^###\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+·\s+\S+")
SENTENCE_END = re.compile(r"[.!?](?=\s+[A-Z0-9\"“(])")


# ---------------------------------------------------------------- parsing

def split_cells(line):
    """Split a markdown table row on unescaped pipes."""
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|") and not s.endswith("\\|"):
        s = s[:-1]
    cells, cur, i = [], "", 0
    while i < len(s):
        if s[i] == "\\" and i + 1 < len(s) and s[i + 1] == "|":
            cur += "|"
            i += 2
            continue
        if s[i] == "|":
            cells.append(cur.strip())
            cur = ""
        else:
            cur += s[i]
        i += 1
    cells.append(cur.strip())
    return cells


def parse(path, text=None):
    if text is None:
        text = Path(path).read_text(encoding="utf-8")
    lines = text.splitlines()
    doc = {"path": str(path), "text": text, "lines": lines, "frontmatter": {}, "fm_range": None,
           "sections": {}, "criteria": [], "rows": [], "ts_header": None, "log_lines": []}

    start = 0
    if lines and lines[0].strip() == "---":
        for j in range(1, len(lines)):
            if lines[j].strip() == "---":
                doc["fm_range"] = (0, j)
                for fl in lines[1:j]:
                    m = re.match(r"^([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*(#.*)?$", fl)
                    if m:
                        doc["frontmatter"][m.group(1)] = m.group(2).strip().strip('"')
                start = j + 1
                break

    # H2 sections (ignore headings inside fenced code)
    current, in_fence = None, False
    for idx in range(start, len(lines)):
        ln = lines[idx]
        if ln.strip().startswith("```"):
            in_fence = not in_fence
        if not in_fence and ln.startswith("## "):
            current = ln[3:].strip()
            doc["sections"][current] = {"start": idx, "lines": []}
            continue
        if current:
            doc["sections"][current]["lines"].append((idx, ln))

    # criteria from Features or Criteria
    feature = None
    for name in ("Features", "Criteria"):
        for idx, ln in doc["sections"].get(name, {}).get("lines", []):
            fm = re.match(r"^###\s+(F\d+)\s*·\s*(.*)$", ln)
            if fm:
                feature = f"{fm.group(1)} · {fm.group(2).strip()}"
                continue
            m = CRIT_RE.match(ln)
            if m:
                body = m.group(5)
                retired = bool(m.group(2)) or "(retired" in body.lower()
                deps = []
                am = AFTER_RE.search(body)
                if am:
                    deps = [d.strip().upper() for d in am.group(1).split(",") if d.strip()]
                doc["criteria"].append({
                    "id": m.group(3).upper(), "num": int(m.group(4)), "done": m.group(1).lower() == "x",
                    "text": body.strip(), "anti": body.strip().lower().startswith("anti:"),
                    "retired": retired, "deps": deps, "feature": feature or name, "line": idx,
                })

    # Test Strategy table
    for idx, ln in doc["sections"].get("Test Strategy", {}).get("lines", []):
        if not ln.strip().startswith("|"):
            continue
        cells = split_cells(ln)
        if doc["ts_header"] is None:
            doc["ts_header"] = [c.lower() for c in cells]
            continue
        if all(re.fullmatch(r":?-{2,}:?", c or "--") for c in cells):
            continue
        hdr = doc["ts_header"]
        row = {}
        for k, col in enumerate(CANON_COLUMNS):
            pos = hdr.index(col) if col in hdr else k
            row[col] = cells[pos] if pos < len(cells) else ""
        row["isc"] = row["isc"].upper()
        row["line"] = idx
        row["cell_count"] = len(cells)
        doc["rows"].append(row)

    doc["log_lines"] = doc["sections"].get("Articulation Log", {}).get("lines", [])
    return doc


def section_text(doc, name):
    return "\n".join(ln for _, ln in doc["sections"].get(name, {}).get("lines", []))


def ladder(doc):
    """Return dict L3, L2_sentence, L2_bullets, L1 from the Ideal State section."""
    out = {"L3": "", "L2": "", "L2_bullets": [], "L1": "", "found": set()}
    cur = None
    for _, ln in doc["sections"].get("Ideal State", {}).get("lines", []):
        h = re.match(r"^###\s+(L[123])\b", ln)
        if h:
            cur = h.group(1)
            out["found"].add(cur)
            continue
        if not cur or not ln.strip():
            continue
        if cur == "L2" and re.match(r"^\s*[-*]\s+", ln):
            out["L2_bullets"].append(re.sub(r"^\s*[-*]\s+", "", ln).strip())
        elif cur == "L2":
            out["L2"] = (out["L2"] + " " + ln.strip()).strip()
        else:
            out[cur] = (out[cur] + " " + ln.strip()).strip()
    return out


def sentence_count(s):
    s = s.strip()
    if not s:
        return 0
    s = re.sub(r"\b(e\.g|i\.e|etc|vs|approx|Mr|Ms|Dr|U\.S)\.", "X", s)
    return len(SENTENCE_END.findall(s)) + 1


def live(doc):
    return [c for c in doc["criteria"] if not c["retired"]]


# ---------------------------------------------------------------- gate

def run_check(doc):
    hard, soft = [], []

    def H(code, msg, line=None):
        hard.append({"code": code, "msg": msg, "line": None if line is None else line + 1})

    def S(code, msg, line=None):
        soft.append({"code": code, "msg": msg, "line": None if line is None else line + 1})

    for sec in REQUIRED_SECTIONS:
        if sec not in doc["sections"]:
            H("missing-section", f"missing `## {sec}`")
    if "Features" not in doc["sections"] and "Criteria" not in doc["sections"]:
        H("missing-section", "missing `## Features` (or flat `## Criteria`)")

    lad = ladder(doc)
    for lvl in ("L3", "L2", "L1"):
        if lvl not in lad["found"]:
            H("ladder-shape", f"missing `### {lvl}` under Ideal State")
    if "L3" in lad["found"] and sentence_count(lad["L3"]) != 1:
        H("ladder-shape", f"L3 must be exactly one sentence (found {sentence_count(lad['L3'])})")
    if "L2" in lad["found"]:
        if sentence_count(lad["L2"]) != 1:
            H("ladder-shape", f"L2 must open with exactly one sentence (found {sentence_count(lad['L2'])})")
        if len(lad["L2_bullets"]) != 4:
            H("ladder-shape", f"L2 must have exactly 4 bullets (found {len(lad['L2_bullets'])})")
    words = lambda t: len(re.findall(r"\S+", t))
    if "L3" in lad["found"] and words(lad["L3"]) > 45:
        S("ladder-long", f"L3 is {words(lad['L3'])} words; keep it ≤ 45 so it reads as one idea")
    for b, text in enumerate(lad["L2_bullets"], 1):
        if sentence_count(text) > 1 or words(text) > 35:
            S("ladder-long", f"L2 bullet {b} is {sentence_count(text)} sentences / {words(text)} words; keep one sentence ≤ 35 words")
    if "L1" in lad["found"] and not lad["L1"]:
        H("ladder-shape", "L1 is empty")
    if "{{" in doc["text"]:
        H("ladder-shape", "unfilled template placeholders `{{…}}` remain")

    crits = live(doc)
    if not crits:
        H("no-criteria", "no live ISC criteria found")

    ids = {}
    for c in doc["criteria"]:
        if c["id"] in ids:
            H("duplicate-id", f"{c['id']} appears more than once", c["line"])
        ids[c["id"]] = c

    hdr = doc["ts_header"]
    if hdr is None:
        H("bad-columns", "Test Strategy has no table")
    elif hdr[:6] != CANON_COLUMNS:
        H("bad-columns", f"Test Strategy header must start with {' | '.join(CANON_COLUMNS)}; got {' | '.join(hdr)}")

    rows_by = {}
    for r in doc["rows"]:
        rows_by.setdefault(r["isc"], []).append(r)
        if hdr and r["cell_count"] != len(hdr):
            H("bad-columns", f"row for {r['isc']} has {r['cell_count']} cells, header has {len(hdr)} (unescaped `|`?)", r["line"])
        if r["isc"] not in ids:
            H("orphan-row", f"Test Strategy row names unknown {r['isc']}", r["line"])
        if r["type"].lower() not in TYPES:
            H("bad-type", f"{r['isc']}: type `{r['type']}` not in {sorted(TYPES)}", r["line"])
        if not r["anchors_to"]:
            S("no-anchor", f"{r['isc']}: empty anchors_to", r["line"])
        if r["type"].lower() in {"bash", "test", "curl"} and "`" not in r["tool"]:
            S("no-command", f"{r['isc']}: runnable row has no backticked command in `tool`", r["line"])

    for c in crits:
        if c["id"] not in rows_by:
            H("untested", f"{c['id']} has no Test Strategy row", c["line"])
        for d in c["deps"]:
            if d not in ids:
                H("bad-dependency", f"{c['id']} depends on unknown {d}", c["line"])
        body = AFTER_RE.sub("", c["text"])
        body = re.sub(r"\(probe:[^)]*\)", "", body, flags=re.I)
        if COMPOUND.search(body) and not c["anti"]:
            S("compound", f"{c['id']} joins two checks with `{COMPOUND.search(body).group(0).strip()}` — split it", c["line"])
        if VAGUE.search(body) and not HAS_NUMBER.search(body):
            S("vague", f"{c['id']} uses vague wording without a number: `{VAGUE.search(body).group(0)}`", c["line"])

    # dependency cycles
    graph = {c["id"]: [d for d in c["deps"] if d in ids] for c in doc["criteria"]}
    state = {}

    def visit(n, stack):
        state[n] = 1
        for m in graph.get(n, []):
            if state.get(m) == 1:
                H("bad-dependency", f"dependency cycle: {' → '.join(stack + [n, m])}")
            elif not state.get(m):
                visit(m, stack + [n])
        state[n] = 2

    for n in graph:
        if not state.get(n):
            visit(n, [])

    # anchors coverage
    anchors = " ".join(r["anchors_to"] for r in doc["rows"]).upper()
    for b in range(1, len(lad["L2_bullets"]) + 1):
        if f"L2.B{b}" not in anchors:
            S("ladder-unserved", f"L2 bullet {b} has no Test Strategy row anchored to `L2.b{b}`")

    if len(crits) > 40:
        S("scope-heavy", f"{len(crits)} criteria; above 40, check for implementation detail or split the work into features shipped as extensions")
    n_oos = sum(1 for _, ln in doc["sections"].get("Out of Scope", {}).get("lines", []) if re.match(r"^\s*[-*]\s+", ln))
    n_anti = sum(c["anti"] for c in crits)
    if crits and n_anti > n_oos + 0.15 * len(crits):
        S("anti-heavy", f"{n_anti} Anti: criteria for {n_oos} Out of Scope items and {len(crits)} criteria; keep anti-criteria for scope items and real regressions")
    for r in doc["rows"]:
        if re.search(r"(?<![\w.])/(var|home|Users|tmp|opt|srv)/", r["tool"]):
            S("abs-path", f"{r['isc']}: tool uses an absolute path; write commands relative to the project root", r["line"])
    oos = [ln for _, ln in doc["sections"].get("Out of Scope", {}).get("lines", []) if re.match(r"^\s*[-*]\s+", ln)]
    if oos and not any(c["anti"] for c in crits):
        S("no-anti", f"Out of Scope has {len(oos)} items but no `Anti:` criterion")

    if doc["rows"]:
        manual = sum(1 for r in doc["rows"] if r["type"].lower() == "manual")
        if manual / len(doc["rows"]) > 0.25:
            S("manual-heavy", f"{manual}/{len(doc['rows'])} rows are manual (> 25%)")

    # Articulation Log is last: any later H2 is a pasted heading that split the log
    log = doc["sections"].get("Articulation Log")
    if log:
        for name, sec in doc["sections"].items():
            if sec["start"] > log["start"] and name not in KNOWN_SECTIONS:
                H("log-heading", f"`## {name}` after Articulation Log splits the log — quote it (`> ## …`)", sec["start"])

    in_fence = False
    for idx, ln in doc["log_lines"]:
        if ln.strip().startswith("```"):
            in_fence = not in_fence
        if not in_fence and ln.lstrip().startswith("#") and not LOG_ENTRY_RE.match(ln):
            H("log-heading", "heading inside Articulation Log — quote it (`> ## …`) or bold it", idx)

    done = sum(1 for c in crits if c["done"])
    want = f"{done}/{len(crits)}"
    if doc["frontmatter"].get("progress") != want:
        S("stale-progress", f"frontmatter progress is `{doc['frontmatter'].get('progress')}`, should be `{want}` (run `fix`)")

    return {"path": doc["path"], "status": "pass" if not hard else "fail", "hard": hard, "soft": soft,
            "criteria": len(crits), "passing": done, "rows": len(doc["rows"])}


def frontier(doc):
    by = {c["id"]: c for c in doc["criteria"]}
    out = []
    for c in live(doc):
        if c["done"]:
            continue
        if all(by.get(d, {}).get("done") for d in c["deps"]):
            out.append(c)
    return out


def alignment(doc, gate):
    """DISCUSS when direction is uncertain, RESTATE when unconfirmed, BUILD otherwise."""
    reasons = []
    st = doc["frontmatter"].get("status", "draft")
    oq = [ln for _, ln in doc["sections"].get("Open Questions", {}).get("lines", []) if re.match(r"^\s*-\s*\[ \]", ln)]
    if len(oq) >= 3:
        reasons.append(f"{len(oq)} open questions")
    if any(h["code"] == "ladder-shape" for h in gate["hard"]):
        reasons.append("ladder shape fails")
    unserved = [s for s in gate["soft"] if s["code"] == "ladder-unserved"]
    if len(unserved) >= 2:
        reasons.append(f"{len(unserved)} L2 bullets have no criterion")
    if reasons:
        return "DISCUSS", reasons
    if st == "draft":
        return "RESTATE", ["status is draft — L3/L2 not yet confirmed by the principal"]
    if st in ("done", "abandoned"):
        return st.upper(), []
    return "BUILD", []


# ---------------------------------------------------------------- mutation

def set_frontmatter(lines, doc, key, value):
    if not doc["fm_range"]:
        return lines
    a, b = doc["fm_range"]
    for i in range(a + 1, b):
        if re.match(rf"^{re.escape(key)}\s*:", lines[i]):
            lines[i] = f"{key}: {value}"
            return lines
    lines.insert(b, f"{key}: {value}")
    return lines


def cmd_fix(path, date):
    doc = parse(path)
    crits = live(doc)
    lines = list(doc["lines"])
    lines = set_frontmatter(lines, doc, "progress", f"{sum(c['done'] for c in crits)}/{len(crits)}")
    doc = parse(path, "\n".join(lines))
    lines = set_frontmatter(lines, doc, "updated", date)
    write(path, lines)
    print(f"fixed: progress {sum(c['done'] for c in crits)}/{len(crits)}, updated {date}")


def write(path, lines):
    Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")


def cmd_mark(path, isc, result, evidence, date):
    doc = parse(path)
    isc = isc.upper()
    target = next((c for c in doc["criteria"] if c["id"] == isc), None)
    if not target:
        sys.exit(f"error: {isc} not found")
    lines = list(doc["lines"])
    box = "x" if result == "pass" else " "
    lines[target["line"]] = re.sub(r"\[( |x|X)\]", f"[{box}]", lines[target["line"]], count=1)
    entry = f"- {date} · {isc} · {result} · {evidence}"
    ver = doc["sections"].get("Verification")
    if ver:
        insert_at = ver["start"] + 1
        for idx, ln in ver["lines"]:
            if ln.strip():
                insert_at = idx + 1
        lines.insert(insert_at, entry)
    else:
        log = doc["sections"].get("Articulation Log")
        at = log["start"] if log else len(lines)
        lines[at:at] = ["## Verification", "", entry, ""]
    write(path, lines)
    cmd_fix(path, date)
    print(f"{isc} → {result}")


# ---------------------------------------------------------------- render

def md_inline(s):
    s = html.escape(s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"~~([^~]+)~~", r"<del>\1</del>", s)
    return s


def cmd_render(path, output):
    doc = parse(path)
    gate = run_check(doc)
    lad = ladder(doc)
    crits = live(doc)
    rows_by = {}
    for r in doc["rows"]:
        rows_by.setdefault(r["isc"], []).append(r)
    fr = {c["id"] for c in frontier(doc)}
    title = doc["frontmatter"].get("title", Path(path).stem)
    pct = round(100 * gate["passing"] / gate["criteria"]) if gate["criteria"] else 0

    feats = {}
    for c in crits:
        feats.setdefault(c["feature"], []).append(c)
    feat_html = []
    for f, cs in feats.items():
        items = []
        for c in cs:
            state = "pass" if c["done"] else ("frontier" if c["id"] in fr else "blocked")
            types = ", ".join(sorted({r["type"] for r in rows_by.get(c["id"], [])})) or "untested"
            items.append(f'<li class="{state}"><span class="pill">{state}</span> <b>{c["id"]}</b> '
                         f'{md_inline(c["text"])} <span class="types">{html.escape(types)}</span></li>')
        feat_html.append(f"<section><h3>{html.escape(f)}</h3><ul>{''.join(items)}</ul></section>")

    ts = "".join(
        "<tr>" + "".join(f"<td>{md_inline(r[k])}</td>" for k in CANON_COLUMNS) + "</tr>" for r in doc["rows"])
    issues = "".join(f'<li class="hard">{html.escape(i["code"])}: {md_inline(i["msg"])}</li>' for i in gate["hard"]) + \
        "".join(f'<li class="soft">{html.escape(i["code"])}: {md_inline(i["msg"])}</li>' for i in gate["soft"])

    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title>
<style>
:root{{--bg:#fbfaf7;--fg:#1c1b19;--mut:#6b675f;--line:#e4e0d8;--pass:#1f7a4d;--front:#9a6b00;--block:#8a8580;--hard:#b3261e}}
@media (prefers-color-scheme:dark){{:root{{--bg:#151413;--fg:#ece9e3;--mut:#a29d94;--line:#2c2a27;--pass:#5fc795;--front:#e3b341;--block:#7d7872;--hard:#f2817a}}}}
body{{background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,sans-serif;margin:0;padding:0 16px}}
main{{max-width:880px;margin:40px auto}} h1{{margin:0 0 4px}} .meta{{color:var(--mut)}}
.l3{{font-size:1.35rem;font-weight:600;border-left:4px solid var(--fg);padding-left:14px;margin:28px 0}}
.bar{{height:8px;background:var(--line);border-radius:4px;overflow:hidden}} .bar i{{display:block;height:100%;background:var(--pass);width:{pct}%}}
ul{{padding-left:0;list-style:none}} li{{padding:6px 0;border-bottom:1px solid var(--line)}}
.pill{{font-size:.72rem;text-transform:uppercase;padding:1px 7px;border-radius:9px;border:1px solid currentColor}}
li.pass .pill{{color:var(--pass)}} li.frontier .pill{{color:var(--front)}} li.blocked .pill{{color:var(--block)}}
.types{{color:var(--mut);font-size:.85rem}} li.hard{{color:var(--hard)}} li.soft{{color:var(--front)}}
.tbl{{overflow-x:auto}} table{{border-collapse:collapse;width:100%;font-size:.85rem}} td,th{{border:1px solid var(--line);padding:4px 6px;text-align:left;vertical-align:top}}
code{{font-size:.85em;background:var(--line);padding:0 3px;border-radius:3px;word-break:break-word}}
</style></head><body><main>
<h1>{html.escape(title)}</h1>
<div class="meta">status: <b>{html.escape(doc['frontmatter'].get('status','?'))}</b> · {gate['passing']}/{gate['criteria']} criteria passing · gate: <b>{gate['status']}</b></div>
<div class="bar"><i></i></div>
<p class="l3">{md_inline(lad['L3'])}</p>
<p>{md_inline(lad['L2'])}</p><ul>{''.join(f'<li>{md_inline(b)}</li>' for b in lad['L2_bullets'])}</ul>
<h2>Criteria</h2>{''.join(feat_html)}
<h2>Test Strategy</h2><div class="tbl"><table><tr>{''.join(f'<th>{c}</th>' for c in CANON_COLUMNS)}</tr>{ts}</table></div>
<h2>Gate</h2><ul>{issues or '<li>No issues.</li>'}</ul>
</main></body></html>"""
    out = Path(output) if output else Path(path).with_suffix(".html")
    out.write_text(page, encoding="utf-8")
    print(out)


# ---------------------------------------------------------------- cli

def main():
    ap = argparse.ArgumentParser(description="Ideal State Artifact tooling")
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("check", "ladder", "status", "frontier", "next-id", "rows", "criteria", "mark", "fix", "render"):
        p = sub.add_parser(name)
        p.add_argument("isa")
        if name in ("check", "status"):
            p.add_argument("--json", action="store_true")
        if name == "rows":
            p.add_argument("--isc")
        if name == "mark":
            p.add_argument("isc")
            p.add_argument("result", choices=["pass", "fail"])
            p.add_argument("--evidence", required=True)
        if name in ("mark", "fix"):
            p.add_argument("--date", default=dt.date.today().isoformat())
        if name == "render":
            p.add_argument("--output")
    a = ap.parse_args()
    doc = parse(a.isa)

    if a.cmd == "check":
        g = run_check(doc)
        if a.json:
            print(json.dumps(g, indent=2))
        else:
            print(f"{g['status'].upper()}  {g['path']}  ({g['passing']}/{g['criteria']} passing, {g['rows']} rows)")
            for i in g["hard"]:
                print(f"  HARD  {i['code']:<16} {i['msg']}" + (f"  [line {i['line']}]" if i["line"] else ""))
            for i in g["soft"]:
                print(f"  soft  {i['code']:<16} {i['msg']}" + (f"  [line {i['line']}]" if i["line"] else ""))
        sys.exit(0 if g["status"] == "pass" else 1)
    elif a.cmd == "ladder":
        lad = ladder(doc)
        print(f"L3: {lad['L3']}\n\nL2: {lad['L2']}")
        for b in lad["L2_bullets"]:
            print(f"  - {b}")
    elif a.cmd == "status":
        g = run_check(doc)
        verdict, reasons = alignment(doc, g)
        fr = [c["id"] for c in frontier(doc)]
        res = {"verdict": verdict, "reasons": reasons, "status": doc["frontmatter"].get("status"),
               "progress": f"{g['passing']}/{g['criteria']}", "gate": g["status"], "frontier": fr}
        if a.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"{verdict}" + (f" — {'; '.join(reasons)}" if reasons else ""))
            print(f"status {res['status']} · progress {res['progress']} · gate {res['gate']}")
            print(f"frontier: {', '.join(fr) or '(none)'}")
    elif a.cmd == "frontier":
        for c in frontier(doc):
            print(f"{c['id']}\t{c['feature']}\t{c['text']}")
    elif a.cmd == "next-id":
        print(f"ISC-{max([c['num'] for c in doc['criteria']] or [0]) + 1}")
    elif a.cmd == "rows":
        rows = [r for r in doc["rows"] if not a.isc or r["isc"] == a.isc.upper()]
        print(json.dumps([{k: r[k] for k in CANON_COLUMNS} for r in rows], indent=2))
    elif a.cmd == "criteria":
        keys = ("id", "done", "feature", "deps", "anti", "text")
        print(json.dumps([{k: c[k] for k in keys} for c in live(doc)], indent=2))
    elif a.cmd == "mark":
        cmd_mark(a.isa, a.isc, a.result, a.evidence, a.date)
    elif a.cmd == "fix":
        cmd_fix(a.isa, a.date)
    elif a.cmd == "render":
        cmd_render(a.isa, a.output)


if __name__ == "__main__":
    main()
