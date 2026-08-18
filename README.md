# Nuno + Imma — The Archive

A static Vite + React + Tailwind CSS v3 photo gallery for `nuno.immas.org`. The visual direction is documented in [`DESIGN.md`](./DESIGN.md): dark charcoal, warm amber, cinematic image treatment, and quiet editorial typography.

## Run locally

```bash
npm install
npm run dev
```

Build and preview the static output:

```bash
npm run build
npm run preview
```

`vite.config.js` uses `base: './'`, so the generated `dist/` is compatible with nginx or static hosting behind a tunnel.

## Content structure

- `public/manifest.json` — the ordered gallery manifest. Replace the `src` values with WebP files under `public/photos/`; each entry supports `id`, `alt`, `caption`, `date`, `orientation`, and `featured`.
- `public/quotes.json` — quote interstitial content (`text` and optional `author`).
- `public/photos/` — tasteful SVG placeholders included for the shell. Replace them with real optimized WebP images without changing the React code.
- `src/main.jsx` — manifest-driven gallery, scroll reveals, and accessible lightbox with keyboard/touch navigation.
- `src/styles.css` — Tailwind layers plus the motion, grain, and image treatment tokens.

No backend, API, authentication, or runtime service is required.

## Chat with Hermes

The site's **Hermes** page is a direct line to Imma's personal assistant (the same agent that maintains this site). Requests POST to `/api/chat` on the site's nginx, which proxies to the host's `nuno-chat-bridge` (launchd, port 8643) — a thin authenticated, rate-limited relay to the Hermes API server (OpenAI-compatible, inside the Hermes gateway on 127.0.0.1:8642). Conversations use a named session (`nuno-site`) so they appear in the Hermes dashboard like any other chat.

- The Hermes API key never leaves the hub; the site only embeds a weak client-side token (`SITE_TOKEN` in `src/config.js`).
- Bridge code + docs: `~/GitHub/homelab/nuno-chat-bridge/` (secrets in `~/.hermes/env/nuno-chat-bridge.env`, chmod 600).
- nginx.conf maps `/api/` to an `upstream hermes_bridge` with dual-IP failover (Lima gateway `192.168.5.2` / LAN `192.168.8.161`).

## Events pipeline

`fetch_events.py` collects public cultural events in Porto and Braga from venue agenda pages, Portuguese ticketing pages, and Eventbrite's public pages, then writes the static `public/events.json` consumed by the site. Eventbrite is always-on and keyless: its public search API was retired in 2020, so the Porto/Braga browse pages are scraped directly without API authentication.

```bash
python fetch_events.py                 # today through the next 14 days
python fetch_events.py --days 30 --city porto
python fetch_events.py --force         # rewrite even if unchanged
```

### Prices

`fetch_events.py` enriches events with a `price` field when possible: Eventbrite detail pages expose JSON-LD `AggregateOffer` (`lowPrice`/`highPrice`) and venue detail pages are scanned for € amounts (e.g. `€14–19.5`). The field is omitted when nothing reliable is found.

## News pipeline

`fetch_news.py` is a keyless RSS/Atom aggregator (stdlib only) that writes `public/news.json` — the site's News page. Sources and per-category limits live in `news_sources.json`; categories are `portugal`, `local` (Porto & Braga), `world`, `music`, `ai`, each guaranteed a quota so fast feeds (Observador, BBC) don't drown out slower ones. `topics.json` → `news_focus` is the shared topic list for the News page's chips.

```bash
python fetch_news.py          # → public/news.json (60 articles, newest first)
```

Both fetchers run daily at 06:00 via `events-fetch.sh` (cron `e603916439e3`): if `events.json` or `news.json` changed, a commit+push triggers CI → k3s rollout; otherwise the run is silent.

Edit [`topics.json`](./topics.json) to change category keywords and the `focus` list. Each focus topic (currently `jazz` and `fado`) also triggers an Eventbrite topic-page scrape for each city, and every event gets a `focus` array containing focus topics found case-insensitively in its title, description, or venue. Each event is also tagged with matching keywords and one category (`music`, `theater`, `arts`, or `other`). Events are normalized to Europe/Lisbon ISO-8601 timestamps, deduplicated, and sorted by date. Failed sources are reported but do not prevent other sources from being written. The UI's event chips and star pins read `topics.json` and `pinned.json`.

For a daily macOS cron job, run from the repository and commit/push the generated file after fetching (use an absolute path to Python):

```cron
15 7 * * * cd /Users/imma/GitHub/nuno-site && /Users/imma/GitHub/nuno-site/.venv/bin/python fetch_events.py && git add public/events.json && git diff --cached --quiet || (git commit -m 'chore: refresh events' && git push)
```
