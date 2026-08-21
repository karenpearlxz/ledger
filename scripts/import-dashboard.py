#!/usr/bin/env python3
"""Parse the old static dashboard into JSON that seed-content.js can load.

The old dashboard is one 1.3MB hand-written HTML file. Rather than re-typing
years of writing, this lifts the four content sections out of it verbatim.
Figure bodies keep their markup (they are richly formatted essays); journal,
work log and poem bodies are reduced to text with line breaks preserved.
"""
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/kit/dashboard/index.html")
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "/home/kit/ledger/scripts/dashboard-content.json")

raw = SRC.read_text(encoding="utf-8")

MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def section(dom_id):
    start = re.search(r'<section[^>]*id="%s"[^>]*>' % re.escape(dom_id), raw)
    if not start:
        return ""
    i = start.end()
    depth = 1
    for m in re.finditer(r"</?section\b", raw[i:]):
        depth += 1 if m.group(0) == "<section" else -1
        if depth == 0:
            return raw[i:i + m.start()]
    return raw[i:]


def block(source, dom_id):
    start = re.search(r'<div[^>]*id="%s"[^>]*>' % re.escape(dom_id), source)
    if not start:
        return ""
    i = start.end()
    depth = 1
    for m in re.finditer(r"</?div\b", source[i:]):
        depth += 1 if m.group(0) == "<div" else -1
        if depth == 0:
            return source[i:i + m.start()]
    return source[i:]


def strip_tags(fragment):
    t = re.sub(r"(?is)<(script|style).*?</\1>", "", fragment)
    t = re.sub(r"(?i)<br\s*/?>", "\n", t)
    t = re.sub(r"(?i)</(p|div|blockquote|h[1-6]|li)>", "\n\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t).replace("\u00a0", " ")
    t = re.sub(r"[ \t]+\n", "\n", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def clean_html(fragment):
    """Keep the markup, drop anything executable.

    These essays are rendered as HTML, so handlers, scripts and javascript:
    URLs come out here rather than being trusted because it is her own file.
    """
    t = re.sub(r"(?is)<(script|style|iframe|object|embed|form)\b.*?</\1>", "", fragment)
    t = re.sub(r"(?is)<(script|iframe|object|embed|form|input|link|meta)\b[^>]*/?>", "", t)
    t = re.sub(r'(?is)\son[a-z]+\s*=\s*"[^"]*"', "", t)
    t = re.sub(r"(?is)\son[a-z]+\s*=\s*'[^']*'", "", t)
    t = re.sub(r"(?is)\son[a-z]+\s*=\s*[^\s>]+", "", t)
    t = re.sub(r'(?is)(href|src)\s*=\s*"\s*javascript:[^"]*"', 'href="#"', t)
    return t.strip()


def parse_date(label):
    s = html.unescape(label).split("\u00b7")[0].strip()
    m = re.search(r"([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})\s*(?:-\s*\d{1,2})?,?\s*(\d{4})", s)
    if m and m.group(1)[:3].lower() in MONTHS:
        return "%04d-%02d-%02d" % (int(m.group(3)), MONTHS[m.group(1)[:3].lower()], int(m.group(2)))
    m = re.search(r"([A-Za-z]{3})[a-z]*\.?\s+(\d{4})", s)
    if m and m.group(1)[:3].lower() in MONTHS:
        return "%04d-%02d-15" % (int(m.group(2)), MONTHS[m.group(1)[:3].lower()])
    m = re.search(r"\d{4}-\d{2}-\d{2}", s)
    if m:
        return m.group(0)
    m = re.search(r"(\d{4})", s)
    return "%s-01-01" % m.group(1) if m else None


# ------------------------------------------------------------------- figures
figures = []
figures_html = block(section("figures"), "figures-list")
ordinal_by_id = {}
for m in re.finditer(r"<!--\s*FIGURE\s+(\d+)\s*:", figures_html):
    fid = re.search(r'id="figure-([a-z0-9-]+)"', figures_html[m.end():m.end() + 400])
    if fid:
        ordinal_by_id[fid.group(1)] = int(m.group(1))

marks = [(m.start(), m.group(1)) for m in
         re.finditer(r'<div class="collapsible(?: open)?" id="figure-([a-z0-9-]+)">', figures_html)]
for idx, (pos, slug) in enumerate(marks):
    end = marks[idx + 1][0] if idx + 1 < len(marks) else len(figures_html)
    chunk = figures_html[pos:end]

    name = re.search(r"<h3[^>]*>(.*?)</h3>", chunk, re.S)
    epithet = re.search(r"<h3[^>]*>.*?</h3>\s*<p[^>]*>(.*?)</p>", chunk, re.S)
    chip = re.search(r'<span class="chip[^"]*">(.*?)</span>', chunk, re.S)
    body = re.search(r'<div class="collapsible-body">(.*)', chunk, re.S)
    quote = re.search(r"<blockquote[^>]*>(.*?)</blockquote>", chunk, re.S)

    body_html = re.sub(r"(?:\s*</div>\s*){1,3}$", "", body.group(1) if body else "")
    epi = strip_tags(epithet.group(1)) if epithet else ""

    # The file is written newest-first, so DOM position is the authority.
    # The FIGURE n comments have duplicates and gaps and cannot be trusted.
    figures.append({
        "ordinal": len(marks) - idx,
        "sourceNumber": ordinal_by_id.get(slug),
        "slug": slug,
        "name": strip_tags(name.group(1)) if name else slug,
        "epithet": epi,
        "lifespan": "",
        "chipDate": strip_tags(chip.group(1)) if chip else "",
        "summary": epi[:400],
        "body": clean_html(body_html),
        "quote": strip_tags(quote.group(1))[:600] if quote else "",
        "quoteSource": "",
    })


# ------------------------------------------------------ journal and work log
def dated_entries(section_id, list_id, entry_class):
    out = []
    src = block(section(section_id), list_id)
    spots = [m.start() for m in re.finditer(r'<div class="%s">' % entry_class, src)]
    for i, pos in enumerate(spots):
        chunk = src[pos:spots[i + 1] if i + 1 < len(spots) else len(src)]
        d = re.search(r'<div class="date">(.*?)</div>', chunk, re.S)
        b = re.search(r'<div class="body">(.*?)</div>', chunk, re.S)
        if not b:
            continue
        iso = parse_date(strip_tags(d.group(1)) if d else "")
        if not iso:
            continue
        out.append({"entryDate": iso, "title": "", "body": strip_tags(b.group(1))})
    return out


journal = dated_entries("journal", "journal-list", "entry")
work = dated_entries("work", "work-list", "work-entry")

# --------------------------------------------------------------------- poems
poems = []
poems_html = block(section("poems"), "poems-list")
spots = [m.start() for m in re.finditer(r'<div class="entry"', poems_html)]
for i, pos in enumerate(spots):
    chunk = poems_html[pos:spots[i + 1] if i + 1 < len(spots) else len(poems_html)]
    title = re.search(r"<h2[^>]*>(.*?)</h2>", chunk, re.S)
    meta = re.search(r'<span class="date"[^>]*>(.*?)</span>', chunk, re.S)
    body = re.search(r'<div class="body"[^>]*>(.*?)</div>', chunk, re.S)
    if not (title and body):
        continue
    poems.append({
        "title": strip_tags(title.group(1)),
        "writtenOn": strip_tags(meta.group(1)) if meta else "",
        "note": "",
        "body": strip_tags(body.group(1)),
        "sortOrder": i + 1,
    })

OUT.write_text(json.dumps({
    "generatedAt": date.today().isoformat(),
    "source": str(SRC),
    "figures": figures,
    "journal": journal,
    "work": work,
    "poems": poems,
}, ensure_ascii=False, indent=1), encoding="utf-8")

print("figures %d  journal %d  work %d  poems %d" % (len(figures), len(journal), len(work), len(poems)))
print("-> %s (%d KB)" % (OUT, OUT.stat().st_size // 1024))
