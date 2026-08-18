---
version: alpha
name: Nuno — Manly and Lovely
project: nuno.immas.org
description: Dark cinematic photo-gallery love site with a confident editorial voice and quiet tenderness.
colors:
  primary: "#151311"
  ink: "#151311"
  charcoal: "#211E1A"
  charcoalRaised: "#2B2721"
  charcoalSoft: "#383229"
  amber: "#C58B4A"
  amberBright: "#E0AA62"
  cream: "#F2EBDD"
  creamMuted: "#C8BDAA"
  creamDim: "#958A7A"
  black: "#0C0B0A"
  white: "#FFFDF8"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "10rem"
    fontWeight: 600
    lineHeight: "0.88"
    letterSpacing: "-0.035em"
  heading:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "5rem"
    fontWeight: 600
    lineHeight: "0.94"
    letterSpacing: "-0.025em"
  quote:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "4.25rem"
    fontWeight: 400
    lineHeight: "1.04"
    letterSpacing: "-0.018em"
  body:
    fontFamily: "DM Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.55"
    letterSpacing: "0em"
  label:
    fontFamily: "DM Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: "1.2"
    letterSpacing: "0.16em"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
  10: "2.5rem"
  12: "3rem"
  16: "4rem"
  20: "5rem"
  24: "6rem"
  32: "8rem"
  40: "10rem"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  pill: "9999px"
components:
  page:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
  primary-action:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.black}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
  primary-action-hover:
    backgroundColor: "{colors.amberBright}"
  lightbox-surface:
    backgroundColor: "rgba(12, 11, 10, 0.96)"
    textColor: "{colors.cream}"
  quote-interstitial:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.cream}"
  raised-surface:
    backgroundColor: "{colors.charcoalRaised}"
    textColor: "{colors.creamMuted}"
  soft-divider:
    backgroundColor: "{colors.charcoalSoft}"
    textColor: "{colors.creamMuted}"
  light-text:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
  dim-metadata:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.creamDim}"
---

# Nuno — DESIGN SPEC

## Overview

**Site:** `nuno.immas.org`  
**Purpose:** A private-feeling, public URL photo gallery for Imma and Nuno. It should feel like a small photographic book, not a scrapbook or Valentine's landing page. The emotional register is confident, intimate, warm, and understated.

**Creative north star:** luxury men's editorial meets a noir film-photography book: charcoal fields, warm amber metadata, cream typography, honest images, and enough negative space for a memory to land. “Manly” means compositional confidence, condensed type, dark tonal range, and no decorative fuss. “Lovely” means warmth, personal sequencing, and language that sounds spoken by a real adult. Never use pink hearts, sparkles, emojis, cartoon motifs, confetti, novelty fonts, or obvious Valentine's iconography.

**Technical boundary:** Vite + React + Tailwind CSS v3 static site. Photos are optimized WebP files in `/photos/`. Quotes live in a small JSON manifest. Deploy as a static nginx image; no backend logic, API, CMS, authentication, analytics requirement, or runtime data fetching.

### Experience principles

1. **Image first.** Photography occupies the visual authority; UI exists to frame it.
2. **Quiet confidence.** Use contrast, scale, and rhythm rather than ornament.
3. **Warmth through material.** Amber, cream, grain, and image sequencing provide emotion.
4. **Motion is a breath, not a performance.** No looping parallax, bouncing controls, or excessive reveal effects.
5. **Respect the photograph.** Do not crop faces or key subjects aggressively; never place text over a busy focal point without a scrim.

## Colors

Use these exact values in `tailwind.config.js` under `theme.extend.colors`; do not invent additional brand colors.

| Token | Hex | Tailwind intent |
|---|---|---|
| `ink` | `#151311` | Default page background; brown-black, not pure black |
| `charcoal` | `#211E1A` | Quote panels and alternating section background |
| `charcoal-raised` | `#2B2721` | Cards, controls, lightbox chrome |
| `charcoal-soft` | `#383229` | Dividers, disabled surfaces, subtle borders |
| `amber` | `#C58B4A` | Primary accent, active index, rules, focus ring |
| `amber-bright` | `#E0AA62` | Hover/focus accent only |
| `cream` | `#F2EBDD` | Primary text and headings |
| `cream-muted` | `#C8BDAA` | Supporting copy and captions |
| `cream-dim` | `#958A7A` | Low-priority metadata; never use for essential text below 14px |
| `black` | `#0C0B0A` | Amber button text and lightbox scrim base |
| `white` | `#FFFDF8` | Rare high-contrast image-overlay text |

**Opacity rules:** borders use `border-cream/15` or `border-amber/45`; image scrims use `bg-black/35` to `bg-black/70`; grain uses `opacity-[0.07]`. Do not use gradients as decoration. A gradient scrim is permitted only over an image to preserve text contrast.

**Contrast:** body text on `ink` or `charcoal` must be `cream` or `cream-muted`. Amber is an accent, not body text. Any text over photography requires a contrast scrim and must remain readable in grayscale.

## Typography

Load these fonts from the chosen font provider or self-host them; retain the listed fallbacks exactly:

- **Display/headings:** `Barlow Condensed, Arial Narrow, sans-serif`; use `font-semibold` (600), uppercase sparingly, and tight leading.
- **Quotes:** `Cormorant Garamond, Georgia, serif`; italic is allowed for the quote itself, never for UI labels.
- **Body/UI:** `DM Sans, Helvetica Neue, Arial, sans-serif`.

Tailwind type tokens/classes:

| Role | Tailwind class | Use |
|---|---|---|
| Hero title | `font-display text-[clamp(3.5rem,12vw,10rem)] font-semibold leading-[.88] tracking-[-.035em]` | One title only, 1–2 lines |
| Section title | `font-display text-[clamp(2.25rem,6vw,5rem)] font-semibold leading-[.94] tracking-[-.025em]` | Section headings |
| Quote | `font-quote text-[clamp(2rem,4.2vw,4.25rem)] leading-[1.04] tracking-[-.018em] italic` | Interstitial quote |
| Body | `font-body text-base leading-[1.55]` | Intro/supporting prose |
| Label | `font-body text-[11px] font-semibold uppercase leading-[1.2] tracking-[.16em]` | Navigation, index, metadata |
| Caption | `font-body text-xs leading-[1.35] text-cream-muted` | Photo caption/date |

Do not center long body copy. Maximum reading width is `max-w-[38rem]`; quote width is `max-w-[58rem]`.

## Layout & Spacing

Use a 4px base rhythm. The named spacing tokens above map to Tailwind's standard spacing scale (`1=4px` through `40=160px`). Default page padding is `px-5 sm:px-8 lg:px-12`; maximum content width is `max-w-[1440px] mx-auto`.

- **Header height:** 72px desktop (`h-[72px]`), 60px mobile (`h-[60px]`).
- **Section vertical padding:** `py-24 lg:py-40`; compact interstitial: `py-24 sm:py-32`.
- **Grid gap:** `gap-2 sm:gap-3 lg:gap-4` (8/12/16px).
- **Text-to-image gap:** minimum `gap-8`, preferred `gap-12 lg:gap-20`.
- **Hard edges:** default `rounded-none`; photo tiles use `rounded-sm` only when the image has breathing room. Never use large rounded cards.
- **Rule:** 1px `bg-amber/45` or `bg-cream/15`, never a heavy border.

### Responsive breakpoints

- `<640px`: single-column flow; no hover-dependent information; 20px page gutters; 8px grid gap; controls at least 44×44px.
- `640–767px`: 2-column photo grid; 32px page gutters.
- `768–1023px`: 2-column grid with occasional full-width feature; header remains compact.
- `>=1024px`: 12-column editorial grid; 48px page gutters; 16px grid gap; hero content can span 7 columns, photo feature 8–10 columns.
- `>=1280px`: content remains capped at 1440px; increase negative space, not font size beyond the clamp.
- `>=1536px`: maintain 1440px cap; no oversized empty black margin beyond the cap's intentional gutters.

## Page Structure & Components

### 1. Site header

Fixed or sticky header is **not** required; use `relative z-20 h-[60px] sm:h-[72px]` so the gallery remains immersive. Left: small wordmark `NUNO / IMMA` in label style. Right: `THE ARCHIVE` or current photo count. Use `text-cream` with amber slash/rule. Header background is transparent over ink; never add a white nav bar.

On mobile, hide secondary archive text and retain only wordmark plus a 44px menu/info button if needed. If there is only one page, do not create a fake hamburger menu.

### 2. Hero / opening frame

Full viewport opening frame: `min-h-[calc(100svh-60px)] sm:min-h-[calc(100svh-72px)]`, with a selected portrait or landscape WebP as a background/absolute `<img>` using `object-cover`. Add a `bg-gradient-to-t from-black/70 via-black/20 to-black/10` scrim and a fixed grain layer.

Place content bottom-left at `p-5 pb-10 sm:p-8 sm:pb-16 lg:p-12 lg:pb-20`; max width 8 columns. Eyebrow: `01 / NUNO + IMMA`. Title: `NUNO` or the approved title, never a sentimental slogan. Supporting line is optional and max two short lines. Bottom-right: small `SCROLL TO ENTER` label with a 1px amber vertical rule; hide this label below 640px if it crowds the image.

Hero image receives a single subtle Ken Burns animation: `transform: scale(1)` to `scale(1.04)` over `16000ms`, `linear`, once per page load; `prefers-reduced-motion` disables it. Do not zoom faces beyond the initial crop.

### 3. Intro / archive marker

A short transition after the hero: 12-column layout at desktop, with a large amber index `02` and a 1–2 sentence line such as “A record of the ordinary days that became ours.” Keep copy editable. Use `py-24 lg:py-40`, no illustration.

### 4. Photo grid

Render from a manifest such as:

```json
{ "id":"01", "src":"/photos/01.webp", "alt":"...", "caption":"...", "date":"2024" , "orientation":"landscape", "featured":true }
```

Required grid behavior:

- Desktop: CSS Grid with `grid-cols-12 gap-4`; default tile span 4 columns, feature spans 8 columns, occasional portrait spans 4 columns and `row-span-2` only when its intrinsic ratio supports it.
- Tablet: `grid-cols-2 gap-3`; feature spans 2 columns.
- Mobile: `grid-cols-2 gap-2`; feature spans 2 columns; portrait tiles may span 1 column but must never become narrower than 0.45× viewport.
- Keep all image tiles in normal document flow for accessibility and deep-link stability. Use aspect ratios `aspect-[4/5]`, `aspect-[4/3]`, or `aspect-[16/10]` from the manifest; do not distort.
- `<img>` must have meaningful `alt`; decorative duplicates use `alt=""`. Use `loading="lazy"` except hero and first row, `decoding="async"`, and `width`/`height` attributes.
- Tile wrapper: `group relative overflow-hidden bg-charcoal-raised`; image: `h-full w-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.025]`.
- Hover metadata is optional on desktop and must not be the only caption. Use `opacity-0 group-hover:opacity-100` over `bg-gradient-to-t from-black/70 to-transparent`; tap/focus/mobile shows metadata below or in lightbox.
- Focus state: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ink`.

Sequence photos as a visual essay: establish place, show shared activity, include imperfect/quiet frames, then close with the most emotionally resonant image. Avoid sorting solely by date.

### 5. Quote interstitial

Insert one quote after every 6–8 photos, with at least two interstitials on a 12+ photo set. Interstitial is a full-width `section` with `bg-charcoal`, `border-y border-cream/10`, `min-h-[55svh] sm:min-h-[65svh]`, and centered content. Use an amber 48px rule above the quote, quote text in `font-quote ... italic`, and optional attribution/date below in label style.

Desktop quote block is `max-w-[58rem] px-5 sm:px-8 text-center`; mobile is left-aligned (`text-left`) to feel less performative. One quote only; no quote marks unless the chosen font has a deliberate typographic opening mark. Use a low-opacity crop of a photograph as an optional background at `opacity-[0.12] grayscale`, with `bg-black/60`; never reduce legibility. Reveal quote with `opacity` and `translateY(12px)` only.

### 6. Lightbox

Clicking or pressing Enter on any tile opens a modal lightbox; URL hash may be `#photo-01` for deep-linking but is optional. Implement a real dialog with `role="dialog"`, `aria-modal="true"`, and an accessible label from the photo caption.

- Backdrop: `fixed inset-0 z-50 bg-black/95`; no page scroll behind it.
- Content: image centered inside `max-h-[84svh] max-w-[92vw] object-contain`; preserve original aspect ratio and never crop.
- Chrome: top-right close button 48×48px, bottom-left `01 / 18` plus caption, bottom-right previous/next buttons 48×48px. Buttons use `bg-charcoal-raised/80`, `text-cream`, `hover:bg-amber hover:text-black`.
- Keyboard: `Escape` closes, `ArrowLeft`/`ArrowRight` navigates, `Tab` is trapped in the dialog. Restore focus to the tile on close.
- Touch: horizontal swipe threshold 48px navigates; tap outside image closes; controls remain reachable above the safe-area inset.
- Transition: backdrop `150ms ease-out`; image crossfade/scale `220ms ease-out`; no slide carousel motion.
- Preload adjacent image; do not preload the entire gallery.

### 7. Closing section / footer

End with a final image or quiet charcoal block, then a simple footer: `NUNO + IMMA`, year, and `A SMALL ARCHIVE OF US` in label style. No social links, newsletter field, or generic marketing CTA. Footer uses `py-12 px-5 sm:px-8 lg:px-12`, `border-t border-cream/15`.

## Film Grain & Image Treatment

Place one `pointer-events-none fixed inset-0 z-40` grain overlay above page content but below the lightbox, using a tiny locally served noise texture or CSS SVG data URI. Set `mix-blend-mode: soft-light; opacity: .07`. It must not intercept clicks and must be disabled for `prefers-reduced-transparency` if supported. Do not use animated grain; a static texture is more refined and cheaper.

Images should be color-corrected consistently before export: warm highlights, controlled blacks, moderate saturation, no orange skin tones. Use `filter: saturate(.92) contrast(1.03)` only if the source set needs a global treatment; prefer editing the WebP assets. Avoid duotone filters and heavy vignette.

## Motion & Interaction Tokens

Define these exact durations in Tailwind config or CSS variables:

```css
:root {
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-reveal: 500ms;
  --duration-image-hover: 700ms;
  --duration-hero: 16000ms;
  --ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);
}
```

- Scroll reveal: initial `opacity:0; transform:translateY(12px)` → visible; `500ms var(--ease-editorial)`, once only, stagger siblings by `80ms`, maximum stagger 400ms.
- Hover image: `700ms ease-out`, scale max `1.025`.
- Button/link color: `150ms ease-out`.
- Modal: backdrop 150ms; image 220ms.
- Hero Ken Burns: 16000ms linear once.
- Never animate layout dimensions, font size, grain, or quote text. Do not use autoplay video.
- Include a global `@media (prefers-reduced-motion: reduce)` override: all durations `1ms !important`, transitions/animations none, transforms reset, smooth scrolling disabled.

## Accessibility & Content Rules

- Meet WCAG AA for UI and essential text; all controls have visible focus rings and accessible names.
- Respect `prefers-reduced-motion`, `prefers-contrast: more`, and safe-area insets.
- Alt text describes the meaningful scene, not the emotion (“Nuno and Imma walking beside the sea at dusk,” not “true love”).
- Use semantic landmarks: `header`, `main`, `section`, `footer`; headings in order.
- No UI emojis, hearts, sparkle symbols, fake loading screens, or autoplay audio. The site is silent by default.
- Keep quotes short, specific, and conversational. Avoid “forever,” “soulmate,” “you complete me,” “one true love,” and greeting-card abstractions unless deliberately approved.

## Do's and Don'ts

**Do:** use strong crops, generous negative space, amber rules, condensed uppercase labels, imperfect candid frames, quiet humor, and words that could plausibly be said aloud by Imma.  
**Don't:** use pink, gradients as decoration, glassmorphism, rounded app-card UI, cursive script, sparkle particles, heart icons, emoji, excessive uppercase paragraphs, or forced romantic copy.

## Implementation Contract

The frontend agent must implement this spec with:

- Tailwind v3 tokens matching the YAML values above, including all three font families.
- A static JSON photo/quote manifest; no hard-coded gallery markup per image.
- Responsive behavior at exactly `640px`, `768px`, `1024px`, `1280px`, and `1536px`.
- WebP images in `/photos/`, lazy loading, stable dimensions, and accessible alt text.
- Functional keyboard- and touch-accessible lightbox with focus management.
- Static nginx-compatible output from `vite build`; no server routes or runtime API dependency.

## Appendix A — Draft Quotes

Use these as starting points only; select 2–4 after Imma reviews them. Portuguese options are comments for editorial reference, not additional UI copy.

1. **“I like the life we make out of ordinary days.”**  
   <!-- PT: “Gosto da vida que fazemos dos dias comuns.” -->
2. **“You make anywhere feel like a place I know.”**  
   <!-- PT: “Fazes qualquer lugar parecer um sítio que conheço.” -->
3. **“The best part is still telling you about it afterwards.”**  
   <!-- PT: “A melhor parte continua a ser contar-te tudo depois.” -->
4. **“No grand gesture. Just you, beside me, again.”**  
   <!-- PT: “Sem grandes gestos. Só tu, ao meu lado, outra vez.” -->
5. **“I would choose this version of us on a quiet Tuesday.”**  
   <!-- PT: “Escolheria esta versão de nós numa terça-feira tranquila.” -->
6. **“You are my favourite person to do nothing with.”**  
   <!-- PT: “És a minha pessoa preferida para não fazer nada.” -->
7. **“Somehow, the days got better without making a fuss.”**  
   <!-- PT: “De alguma forma, os dias ficaram melhores sem fazer alarde.” -->
8. **“I remember the places. I remember you more.”**  
   <!-- PT: “Lembro-me dos lugares. Lembro-me mais de ti.” -->
9. **“Still us. Still my favourite place to be.”**  
   <!-- PT: “Ainda nós. Ainda o meu lugar preferido.” -->
10. **“You make the future feel practical, and that is romantic.”**  
    <!-- PT: “Fazes o futuro parecer possível — e isso é romântico.” -->

## Appendix B — Acceptance Checklist

- [ ] Page reads as cinematic editorial, not a Valentine's template.
- [ ] No pink, hearts, sparkles, emojis, or novelty/cursive fonts appear in the UI.
- [ ] All colors, fonts, breakpoints, spacing, and durations match this document.
- [ ] Hero, grid, quote interstitial, lightbox, and footer are present and responsive.
- [ ] Lightbox works with mouse, touch, keyboard, focus return, and Escape.
- [ ] Reduced-motion behavior is implemented and tested.
- [ ] Every photo has useful alt text and stable dimensions.
- [ ] `vite build` produces static output suitable for nginx.
---
