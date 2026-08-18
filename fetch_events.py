#!/usr/bin/env python3
"""Fetch near-term Porto and Braga cultural events into public/events.json.

The default sources are public venue/ticketing pages and require no credentials.
Set EVENTS_EBRITE_TOKEN to opt into Eventbrite public browse pages (their public
search API was retired in 2020; the token now just acts as the opt-in switch).
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
from datetime import datetime, timedelta, time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent
TZ = ZoneInfo("Europe/Lisbon")
SOURCES = [
    ("Casa da Música", "porto", "https://casadamusica.com/agenda/"),
    ("Coliseu do Porto", "porto", "https://www.coliseu.pt/agenda/"),
    ("Rivoli", "porto", "https://www.teatromunicipaldoporto.pt/pt/programa/"),
    ("Teatro Nacional São João", "porto", "https://www.tnsj.pt/pt/programacao/"),
    ("Theatro Circo", "braga", "https://theatrocirco.com/en/programme/"),
    ("gnration", "braga", "https://www.gnration.pt/agenda/"),
    ("Forum Braga", "braga", "https://forumbraga.com/agenda/"),
    ("Ticketline", "all", "https://v2.ticketline.pt/calendar?locale=pt"),
    ("BOL", "all", "https://www.bol.pt/Projectos/Entidades/Agenda"),
]
MONTHS = {"janeiro":1,"fevereiro":2,"março":3,"abril":4,"maio":5,"junho":6,"julho":7,"agosto":8,"setembro":9,"outubro":10,"novembro":11,"dezembro":12,
          "january":1,"february":2,"march":3,"april":4,"may":5,"june":6,"july":7,"august":8,"september":9,"october":10,"november":11,"december":12}
DATE_RE = re.compile(r"(?P<d>\d{1,2})\s*(?:[/.-]|\s+de\s+)\s*(?P<m>\d{1,2}|[A-Za-zÀ-ÿ]+)(?:\s*(?:[/.-]|\s+de\s+)\s*(?P<y>20\d{2}))?", re.I)
ISO_RE = re.compile(r"20\d{2}-\d{2}-\d{2}(?:[T ][0-9:]+(?:Z|[+-][0-9:]+)?)?")

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.text=[]; self._href=None; self._buf=[]; self.jsonld=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag == "a" and a.get("href"): self._href=a["href"]; self._buf=[]
        if tag == "script" and a.get("type", "").lower() == "application/ld+json": self._in_json=True; self._buf=[]
    def handle_startendtag(self, tag, attrs): self.handle_starttag(tag, attrs); self.handle_endtag(tag)
    def handle_data(self, data):
        self.text.append(data)
        if self._href is not None or getattr(self, "_in_json", False): self._buf.append(data)
    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            label=" ".join("".join(self._buf).split()); self.links.append((self._href,label)); self._href=None
        if tag == "script" and getattr(self, "_in_json", False): self.jsonld.append("".join(self._buf)); self._in_json=False

def fetch(url):
    req=Request(url, headers={"User-Agent":"nuno-events/1.0 (+https://nuno.immas.org)"})
    with urlopen(req, timeout=20) as r: return r.read().decode(r.headers.get_content_charset() or "utf-8", "replace")

def parse_date(value, now):
    if not value: return None
    value=html.unescape(str(value)).strip()
    m=ISO_RE.search(value)
    if m:
        s=m.group(0).replace("Z", "+00:00")
        try:
            dt=datetime.fromisoformat(s); return (dt.replace(tzinfo=TZ) if dt.tzinfo is None else dt).astimezone(TZ)
        except ValueError: pass
    m=DATE_RE.search(value)
    if not m: return None
    mon=m.group("m"); month=int(mon) if mon.isdigit() else MONTHS.get(mon.lower().rstrip("."))
    if not month: return None
    year=int(m.group("y") or now.year)
    try: return datetime.combine(datetime(year, month, int(m.group("d"))).date(), time(20), TZ)
    except ValueError: return None

def clean(s, limit=500): return re.sub(r"\s+", " ", html.unescape(s or "")).strip()[:limit]
def event_id(title,date,venue): return hashlib.sha256("|".join((title,date,venue)).casefold().encode()).hexdigest()[:16]

def classify(title, desc, topics):
    hay=(title+" "+desc).casefold(); matched=[]
    for category in topics.get("categories", []):
        for word in topics.get("keywords", {}).get(category, []):
            if word.casefold() in hay and word not in matched: matched.append(word)
    category=next((c for c in topics.get("categories", []) if any(w in matched for w in topics.get("keywords",{}).get(c,[]))), "other")
    return category, matched

def from_jsonld(raw, base, venue, city, now, cutoff, topics):
    out=[]
    for blob in raw:
        try: data=json.loads(blob)
        except (ValueError, TypeError): continue
        items=data if isinstance(data,list) else data.get("@graph", [data]) if isinstance(data,dict) else []
        if isinstance(items,dict): items=[items]
        for x in items:
            if not isinstance(x,dict) or str(x.get("@type", "")).lower() not in ("event", "musicEvent".lower(), "theaterEvent".lower(), "festival") and "startDate" not in x: continue
            dt=parse_date(x.get("startDate"),now)
            if not dt or not (now <= dt <= cutoff): continue
            title=clean(x.get("name")); desc=clean(x.get("description"),200)
            if not title: continue
            url=urljoin(base,x.get("url",base)); v=clean((x.get("location") or {}).get("name",venue)) if isinstance(x.get("location"),dict) else venue
            category,matched=classify(title,desc,topics)
            e={"id":event_id(title,dt.isoformat(),v),"title":title,"date":dt.isoformat(),"venue":v or venue,"city":city,"category":category,"topics":matched,"description":desc,"url":url}
            if x.get("offers") and isinstance(x["offers"],dict) and x["offers"].get("price"): e["price"]=str(x["offers"]["price"])
            out.append(e)
    return out

def from_html_events(body, base, venue, city, now, cutoff, topics):
    """Fallback for venue cards whose date is in a sibling <time>, not JSON-LD."""
    out=[]
    for match in re.finditer(r'href=[\"\\\']([^\"\\\']*/(?:event|evento)/[^\"\\\']+)[\"\\\']', body, re.I):
        chunk=body[match.start():match.start()+9000]
        dates=re.findall(r'(?:datetime=[\"\\\']([^\"\\\']+)[\"\\\']|20\\d{2}[-./]\\d{1,2}[-./]\\d{1,2}|\\d{1,2}[-./]\\d{1,2}[-./]20\\d{2})', chunk, re.I)
        dt=None
        for raw in dates:
            dt=parse_date(raw if isinstance(raw,str) else raw[0],now)
            if dt: break
        if not dt or not (now <= dt <= cutoff): continue
        plain=re.sub(r'<[^>]+>', ' ', chunk); plain=re.sub(r'href=["\'][^"\']+["\']', ' ', plain, flags=re.I); plain=clean(plain,9000)
        headings=re.findall(r'<h[1-4][^>]*>(.*?)</h[1-4]>', chunk, re.I|re.S)
        title=clean(re.sub(r'<[^>]+>',' ', headings[0]),160) if headings else clean(plain.split('> ',1)[-1],160)
        title=re.sub(DATE_RE,'',title).strip(' -|')
        if len(title)<3: continue
        desc=clean(plain,200); category,matched=classify(title,desc,topics)
        out.append({'id':event_id(title,dt.isoformat(),venue),'title':title,'date':dt.isoformat(),'venue':venue,'city':city,'category':category,'topics':matched,'description':desc,'url':urljoin(base,match.group(1))})
    return out

def from_links(parser, base, venue, city, now, cutoff, topics):
    out=[]
    for href,label in parser.links:
        if len(label)<4: continue
        dt=parse_date(label,now)
        if not dt:
            # Some sites put date in the text immediately around an event link.
            continue
        title=clean(re.sub(DATE_RE, "", label),160)
        if len(title)<3: continue
        desc=clean(" ".join(parser.text),200)
        if not (now <= dt <= cutoff): continue
        category,matched=classify(title,desc,topics)
        out.append({"id":event_id(title,dt.isoformat(),venue),"title":title,"date":dt.isoformat(),"venue":venue,"city":city,"category":category,"topics":matched,"description":desc,"url":urljoin(base,href)})
    return out

EB_PAGES = {
    "porto": "https://www.eventbrite.com/d/portugal--porto/events/",
    "braga": "https://www.eventbrite.com/d/portugal--braga/events/",
}
EB_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

def _eb_events_from_html(body):
    """Extract Event objects from Eventbrite's __SERVER_DATA__ JSON-LD."""
    i = body.find("window.__SERVER_DATA__")
    if i < 0: return []
    j = body.find("=", i)
    if j < 0: return []
    k = j + 1; depth = 0; instr = False; esc = False
    while k < len(body):
        c = body[k]
        if instr:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == '"': instr = False
        else:
            if c == '"': instr = True
            elif c == "{": depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0: break
        k += 1
    if depth != 0: return []
    try: data = json.loads(body[j + 1:k + 1])
    except ValueError: return []
    items = []
    for block in data.get("jsonld") or []:
        for le in block.get("itemListElement") or []:
            item = le.get("item") or {}
            if item.get("@type") == "Event" and item.get("name"):
                items.append(item)
    return items

def eventbrite(token, city, now, cutoff, topics):
    # Eventbrite's public search API (GET /v3/events/search/) was retired in
    # 2020, so we scrape their public browse pages instead. The token is now
    # just the opt-in switch: without EVENTS_EBRITE_TOKEN this stays silent.
    if not token or city not in EB_PAGES: return []
    req = Request(EB_PAGES[city], headers={"User-Agent": EB_UA, "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"})
    try: body = urlopen(req, timeout=25).read().decode("utf-8", "replace")
    except Exception as exc: print("Eventbrite skipped:", exc, file=sys.stderr); return []
    out = []
    for x in _eb_events_from_html(body):
        dt = parse_date(x.get("startDate"), now)
        name = clean(x.get("name"), 160)
        if not dt or not name or not (now <= dt <= cutoff): continue
        loc = x.get("location") or {}
        venue = clean(loc.get("name") or "Eventbrite")
        desc = clean(x.get("description"), 200)
        cat, matched = classify(name, desc, topics)
        out.append({"id": event_id(name, dt.isoformat(), venue), "title": name, "date": dt.isoformat(), "venue": venue, "city": city, "category": cat, "topics": matched, "description": desc, "url": x.get("url", "")})
    return out

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--days",type=int,default=14); ap.add_argument("--city",choices=("porto","braga","all"),default="all"); ap.add_argument("--force",action="store_true"); ap.add_argument("--source-url",action="append",help=argparse.SUPPRESS); args=ap.parse_args()
    now=datetime.now(TZ).replace(hour=0,minute=0,second=0,microsecond=0); cutoff=now+timedelta(days=args.days); topics=json.loads((ROOT/"topics.json").read_text())
    sources=SOURCES
    override=args.source_url or [x for x in os.getenv("FETCH_EVENTS_SOURCE_URLS","").split(",") if x]
    if override: sources=[("Fixture/source", args.city if args.city!="all" else "porto", x) for x in override]
    found=[]
    for venue, city, url in sources:
        if args.city!="all" and city not in (args.city,"all"): continue
        try:
            p=PageParser(); body=fetch(url); p.feed(body)
            found += from_jsonld(p.jsonld,url,venue,args.city if city=="all" and args.city!="all" else city,now,cutoff,topics)
            found += from_links(p,url,venue,args.city if city=="all" and args.city!="all" else city,now,cutoff,topics)
            found += from_html_events(body,url,venue,args.city if city=="all" and args.city!="all" else city,now,cutoff,topics)
            print("OK", venue, url, file=sys.stderr)
        except Exception as exc: print("FAILED", venue, url, "-", exc, file=sys.stderr)
    if args.city=="all":
        found += eventbrite(os.getenv("EVENTS_EBRITE_TOKEN"),"porto",now,cutoff,topics)+eventbrite(os.getenv("EVENTS_EBRITE_TOKEN"),"braga",now,cutoff,topics)
    unique={}
    for e in found: unique[(e["title"].casefold(),e["date"],e["venue"].casefold())]=e
    events=sorted(unique.values(),key=lambda e:(e["date"],e["title"].casefold()))
    target=ROOT/"public/events.json"; target.parent.mkdir(exist_ok=True)
    payload=json.dumps(events,ensure_ascii=False,indent=2)+"\n"
    if args.force or not target.exists() or target.read_text()!=payload: target.write_text(payload); print("Wrote",target,"(",len(events),"events)")
    else: print("Unchanged",target,"(",len(events),"events)")

if __name__ == "__main__": main()
