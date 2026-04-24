---
title: coframe — Coframe-styled interactive resume
date: 2026-04-23
status: approved
---

# Coframe-styled interactive resume — design spec

## Goal
A resume microsite at `https://prajje.github.io/coframe/` that adopts Coframe's visual language (dark mode, grid backgrounds, green optimization accent, Inter + JetBrains Mono typography, question-style headline) while preserving every factual claim from the `hello-adobe` microsite verbatim. Targeted at Coframe's "Agent Engineer" role.

## Approach
**Hybrid C** — Adobe spine, Coframe language. Keep the section structure that works for a resume (Hero → Metrics → Timeline → Signature Work → Skills+Pubs → Letter → Closing), but rewrite every section's styling, narrative glue, and the letter in Coframe's vocabulary.

## Non-goals
- Not rebuilding in a framework (stays vanilla HTML/CSS/JS).
- Not paraphrasing project descriptions, metrics, or bullets — those stay verbatim.
- Not copying Coframe's logo or brand assets — evoke the aesthetic, don't appropriate the mark.

## Architecture
- **Files:** `index.html`, `css/styles.css`, `js/main.js`, `assets/Prajwal_Prakash_Resume.pdf`, `README.md`.
- **No build step.** Static files served by GitHub Pages.
- **CDN deps:** GSAP + ScrollTrigger (scroll reveals, assemble animation). No vanilla-tilt (doesn't fit the flat Coframe aesthetic).
- **Fonts:** Inter + JetBrains Mono via Google Fonts.

## Visual language
- **Palette:** bg `#0A0A0A`, panel `#111`, text `#FAFAFA`, muted `#B5B5B5`, accent `#4AE387` (Coframe-style optimization green).
- **Background motif:** full-page faint grid (56px) with radial fade mask; subtle green radial glow behind hero.
- **Hero motif:** canvas-rendered "variation grid" — micro-tiles pulse green in/out every ~140ms, evoking A/B variants being tested.
- **Cards:** flat dark panels, 1px border, monospace corner tag (`AGENT`, `EVAL`, `EDGE`, etc.), soft green glow on hover. No gradient app badges.
- **Animations:** ink-trail scroll progress (green), typed→dropped in favor of fade-rise for the long headline, count-up metrics, timeline reveals, GSAP fades on section titles/cards/pubs, assemble animation on closing headline.

## Content rules (hard)
- Project descriptions, metric values/labels, timeline bullets, skill chips, and publication entries are **verbatim from `hello-adobe`**.
- Only the following is new/retoned:
  - Hero headline: "What if your next agent engineer had already shipped production ML?"
  - Rotating tagline items (Agent Builder / ML Engineer / GenAI Engineer).
  - Section title for closing: "Optimize the future." / "Together."
  - Card corner tags (styling only, not factual claims).
  - "Dear Coframe" letter (mirrors the JD's own phrasing).

## Section-by-section

### 1. Hero
- Eyebrow: `● Prajwal Prakash · Built for Coframe`.
- Headline: the question above.
- Rotating tagline (mono, green): Agent Builder / ML Engineer / GenAI Engineer.
- Sub (verbatim): "Senior MLE at Cogniac. Columbia MS. Four years shipping production computer-vision and GenAI systems to the edge and the cloud."
- CTAs: `View Resume` (green primary) · `Download ↓` (ghost).

### 2. Metric band
All five metrics and labels verbatim from `hello-adobe`. Mono numerals, subtle green uptick glyph.

### 3. Timeline
All jobs and bullets verbatim. Dark restyle only, green node dots, mono dates, thin connector.

### 4. Signature Work
All six cards with verbatim descriptions and chips. Corner tags added: `CV · EDGE`, `PROD · LLM`, `EVAL · CV`, `AGENT · HITL`, `CV · SCALE`, `CV · CLOUD`. Order unchanged.

### 5. Skills + Publications
All chips, skill groups, and publications verbatim. Restyled with Inter + JetBrains Mono, green accents, border-based chip styling.

### 6. Dear Coframe
Letter mirrors `hello-adobe`'s letter structure (salutation → quote block from target's own words → "reading that felt like…" → technique-to-mission mapping with bolded JD phrases → collaboration paragraph → closing line → signature). All factual claims verbatim. Only narrative glue retoned to JD language ("generate, test, monitor interfaces at scale", "non-deterministic systems", "turn manual workflows into scalable agents").

### 7. Closing
- Section label: `The ask`.
- Headline (assemble animation): "Optimize the future."
- Sub: "Together."
- Resume iframe (PDF preview).
- Contact grid: Email / LinkedIn / Phone / Resume (download) — contact values verbatim.
- Footer: `Built for Coframe · San Francisco · April 2026`.

## Deployment
- Commit everything to `main` on `Prajje/coframe`.
- Enable GitHub Pages via `gh api -X POST repos/Prajje/coframe/pages -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"`.
- Private repos require GitHub Pro for Pages hosting. If hosting fails on private, switch repo to public (resume site is meant to be shared publicly anyway, like `hello-adobe`).

## Accessibility / motion
- `prefers-reduced-motion` disables canvas animation, rotator, scroll reveals, assemble animation.
- All interactive targets ≥ 14px text with sufficient contrast against `#0A0A0A`.

## Out-of-scope / future
- SEO meta tags (og:image etc.) — only basic `description` + `title` for now.
- Analytics — not wired up.
- Contact form — external links only (mailto, tel, linkedin).
