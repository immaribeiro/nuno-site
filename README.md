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

## Events pipeline

`fetch_events.py` collects public cultural events in Porto and Braga from venue agenda pages and Portuguese ticketing pages, then writes the static `public/events.json` consumed by the site. The base pipeline is keyless; set `EVENTS_EBRITE_TOKEN` (any value) to also pull Eventbrite's public Porto/Braga browse pages (Eventbrite's public search API was retired in 2020, so the pages are scraped — no API auth is needed).

```bash
python fetch_events.py                 # today through the next 14 days
python fetch_events.py --days 30 --city porto
python fetch_events.py --force          # rewrite even if unchanged
```

Edit [`topics.json`](./topics.json) to change category keywords. Each event is tagged with matching keywords and one category (`music`, `theater`, `arts`, or `other`). Events are normalized to Europe/Lisbon ISO-8601 timestamps, deduplicated, and sorted by date. Failed sources are reported but do not prevent other sources from being written.

For a daily macOS cron job, run from the repository and commit/push the generated file after fetching (use an absolute path to Python):

```cron
15 7 * * * cd /Users/imma/GitHub/nuno-site && /Users/imma/GitHub/nuno-site/.venv/bin/python fetch_events.py && git add public/events.json && git diff --cached --quiet || (git commit -m 'chore: refresh events' && git push)
```
