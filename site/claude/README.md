# Claude Follow-Up Mini-App

Tammy-facing self-serve walkthrough of Claude — built as a chapter-based mini-app, not a static brief.

## Files

- `index.html` — app shell + 7 chapter sections (welcome, basics, surfaces, scenarios, fit, questions, start)
- `style.css` — design system (Fraunces serif + Inter + JetBrains Mono; warm parchment palette with forest/clay/amber accents)
- `app.js` ? chapter routing, brief comparator, surface guide, Tammy-world examples, FAQ accordion, prompt copy-to-clipboard
- `images/` — frames captured from the Anthropic Claude 101 course, used inside scenario stages

## Shape

This route renders as a single-page app with persistent navigation and chapter-style progression:

- **Top bar** — brand, 7-step progress dots, self-serve meta pill
- **Left rail** — chapter nav with current / done states
- **Viewport** — one chapter visible at a time, fade-in on switch
- **Bottom bar** — previous / current / next controls + keyboard arrows

State sync: URL hash mirrors the active chapter (`#welcome`, `#basics`, etc.) so refresh and direct links land in the right place.

## Chapter spine

| # | Chapter | Centerpiece |
|-|-|-|
| 01 | Welcome | Hero + chat-device preview + 7-chapter overview |
| 02 | The basics | Interactive **brief comparator** (thin vs better brief, side-by-side outputs) |
| 03 | Where Claude lives | Interactive guide to Claude's main surfaces and how each one fits different work |
| 04 | In Tammy's world | Three Tammy-world examples that show what Claude prepares, what people still review, and how it fits realtor, brokerage, and office work |
| 05 | Fit & limits | Strong-fit vs needs-you split + full-size anchor statement |
| 06 | Common questions | Accordion FAQ (5 questions, short answer + footnote framing) |
| 07 | Your first move | Numbered next steps + copy-able **starter brief template** |

## Interactive moments (all bounded / pre-computed)

- **Brief comparator** (Ch. 02) — two static prompt/reply pairs, swap with a switch pill
- **Surface guide** (Ch. 03) - 10 tiles, click to load plain-language detail; no live network
- **Tammy-world examples** (Ch. 04) - three grounded examples, tab-switched
- **FAQ accordion** (Ch. 06) — local state, no network
- **Prompt copy** (Ch. 07) — clipboard API with `execCommand` fallback for `file://` runs

Per the post-roundtable intent, nothing in this route makes a live Claude call.

## Canon boundary

- Private lesson provenance and extraction notes stay in `C:\VFC\.ops\context\claude-roundtable-pack`
- This route is the derived presentation surface, not the source of truth for lesson provenance
- If the page drifts back into presenter-script mode or workflow-demo-first framing, reset against `post-roundtable-intent-2026-05-22.md`

## Running locally

Open `index.html` in a browser. Works directly via `file://` (no build step, no server required). For best font rendering serve from any static server (e.g. `python -m http.server` from this directory).
