#!/usr/bin/env python3
"""Fetch recent Portugal/Porto-Braga/world/music/AI news into public/news.json.

Keyless RSS/Atom aggregator (stdlib only). Sources and limits come from
news_sources.json. Topics for the site's topic chips come from topics.json
("news_focus"). Output schema (sorted newest first):

  [{"id", "title", "source", "url", "published" (ISO 8601, Europe/Lisbon),
    "category": "portugal|local|world|music|ai", "topics": [...], "summary"}]
"""
from __future__ import annotations

import email.utils
import hashlib
import html
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen, HTTPRedirectHandler, build_opener
from xml.etree import ElementTree as ET
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent
TZ = ZoneInfo("Europe/Lisbon")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

class _Redirect308(HTTPRedirectHandler):
    """urllib doesn't follow 308 by default (pre-3.11); route it like 302."""
    def http_error_308(self, req, fp, code, msg, headers):
        return self.http_error_302(req, fp, 302, msg, headers)

_opener = build_opener(_Redirect308)

def fetch(url):
    req = Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"})
    with _opener.open(req, timeout=20) as r:
        return r.read().decode(r.headers.get_content_charset() or "utf-8", "replace")

def clean(s, limit=200):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()[:limit]

def localname(tag):
    return tag.rsplit("}", 1)[-1]

def parse_date(value, now):
    if not value: return None
    value = html.unescape(str(value)).strip()
    try:
        dt = email.utils.parsedate_to_datetime(value)
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(TZ)
    except (TypeError, ValueError): pass
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None: dt = dt.replace(tzinfo=TZ)
        return dt.astimezone(TZ)
    except ValueError:
        return None

def feed_entries(body):
    """Yield (title, link, published_dt, summary) from RSS or Atom XML."""
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return []
    out = []
    for item in root.iter():
        name = localname(item.tag)
        if name not in ("item", "entry"): continue
        def field(*names):
            for child in item:
                if localname(child.tag) in names:
                    text = "".join(child.itertext()).strip()
                    if text: return text
            return None
        title = field("title")
        link = field("link")
        if not link or not link.startswith("http"):
            for child in item:
                if localname(child.tag) == "link" and child.get("href", "").startswith("http"):
                    link = child.get("href"); break
        published = field("pubDate", "published", "updated", "date", "dc:date")
        summary = field("description", "summary", "content", "content:encoded")
        if title and link:
            out.append((clean(title, 160), link, parse_date(published, None), clean(summary)))
    return out

def news_id(title, source):
    return hashlib.sha256("|".join((title, source)).casefold().encode()).hexdigest()[:16]

def tag_topics(title, summary, source, news_focus):
    hay = " ".join((title, summary, source)).casefold()
    return [t for t in news_focus if t.casefold() in hay]

def main():
    now = datetime.now(TZ)
    cutoff = now - timedelta(days=4)
    config = json.loads((ROOT / "news_sources.json").read_text())
    topics = json.loads((ROOT / "topics.json").read_text())
    news_focus = [str(t) for t in topics.get("news_focus", [])]
    max_per_source = int(config.get("max_per_source", 8))
    max_total = int(config.get("max_total", 60))

    found = []
    for feed in config.get("feeds", []):
        name = feed.get("name", "?")
        url = feed.get("url", "")
        category = feed.get("category", "world")
        if not url: continue
        try:
            entries = feed_entries(fetch(url))
        except Exception as exc:
            print("FAILED", name, "-", exc, file=sys.stderr)
            continue
        count = 0
        for title, link, dt, summary in entries:
            if not dt or dt < cutoff or dt > now + timedelta(hours=6): continue
            found.append({"id": news_id(title, name), "title": title, "source": name,
                          "url": link, "published": dt.isoformat(), "category": category,
                          "topics": tag_topics(title, summary, name, news_focus),
                          "summary": summary or ""})
            count += 1
            if count >= max_per_source: break
        print("OK", name, url, f"({count} entries)", file=sys.stderr)

    unique = {}
    for entry in found:
        key = entry["title"].casefold()
        if key not in unique or entry["published"] > unique[key]["published"]:
            unique[key] = entry
    # Per-category quotas so low-volume categories (e.g. ai, local) aren't
    # drowned out by high-frequency feeds; the remaining slots then fill with
    # the newest leftovers.
    cat_order = config.get("categories", [])
    if not cat_order:
        cat_order = sorted({e["category"] for e in unique.values()})
    quota = max(1, max_total // len(cat_order))
    by_cat = {cat: [] for cat in cat_order}
    for e in unique.values():
        by_cat.setdefault(e["category"], []).append(e)
    picked, leftovers = [], []
    for cat in cat_order:
        es = sorted(by_cat[cat], key=lambda e: e["published"], reverse=True)
        picked += es[:quota]
        leftovers += es[quota:]
    slots = max_total - len(picked)
    if slots > 0 and leftovers:
        picked += sorted(leftovers, key=lambda e: e["published"], reverse=True)[:slots]
    news = sorted(picked, key=lambda e: e["published"], reverse=True)[:max_total]

    target = ROOT / "public/news.json"
    target.parent.mkdir(exist_ok=True)
    payload = json.dumps(news, ensure_ascii=False, indent=2) + "\n"
    if not target.exists() or target.read_text() != payload:
        target.write_text(payload)
        print("Wrote", target, f"({len(news)} articles)")
    else:
        print("Unchanged", target, f"({len(news)} articles)")

if __name__ == "__main__":
    main()
