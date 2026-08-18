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
