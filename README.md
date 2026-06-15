# Editmamei

**Unlock Photoshop with natural-language photo editing.**

*AI orchestration, not generation.*

*(Pronounced like* edamame*. Yes, the snack.)*

[![npm version](https://img.shields.io/npm/v/editmamei.svg)](https://www.npmjs.com/package/editmamei)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](https://editmamei.com/license)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-lightgrey.svg)]()

You describe the edit. The AI plans the steps. Your own copy of Photoshop carries them out, using its standard adjustment layers, masks, selections, and filters. The AI directs; Photoshop edits. No generative model touches your pixels.

This repository is the **public face** of Editmamei. It hosts the user-facing documentation, the issue tracker, and the changelog. The source for the npm package itself is private; what you install from npm is the same compiled artifact described in these docs.

- **Website:** [editmamei.com](https://editmamei.com)
- **Install:** see [docs/installation.md](docs/installation.md)
- **Pro features:** see [docs/pro-features.md](docs/pro-features.md)
- **Report a bug:** [open an issue](https://github.com/editmamei/editmamei-ce/issues/new/choose)

---

## Quick install

```bash
npm install -g editmamei
editmamei install
```

`editmamei install` detects which MCP clients you have (Claude Desktop, Cursor, Claude Code) and writes the appropriate config for each — in one pass. Each client gets its own per-client result line so you can see what was touched. Then restart your AI client(s) and ask one of them to ping Photoshop:

> "Is Photoshop connected?"

You'll see your Photoshop version returned. Full setup walkthrough in [docs/getting-started.md](docs/getting-started.md). To check your install state any time, run `editmamei status`.

---

## How It Works

**You talk. Photoshop works.**

For years, getting the look in your head meant nudging sliders and hunting for a tutorial that matched your exact shot. Editmamei plugs your AI chat assistant straight into the desktop Photoshop you already have. You describe what you want, the way you'd tell a friend, and it builds the layers, makes the adjustments, and hands back the finished photo.

Here's what's actually happening:

1. **You describe the edit** ("warm up the golden hour, lift the shadows, clean up the horizon").
2. **The AI plans the steps:** which adjustments, which selections, in what order.
3. **Your Photoshop does the editing** on your machine, using its own standard tools.
4. **You get a finished photo** that's fully layered, maskable, and editable. Nothing baked in.

The AI looks at the result and refines it; Photoshop performs every actual change.

### Edited, not generated

Most "AI photo" tools are *generative*. They invent new pixels: skies, objects, even faces that were never in your shot. **Editmamei doesn't do that.** It works only with the pixels you captured, using the same non-generative Photoshop tools professionals have used for years: adjustment layers, masks, selections, filters. The AI is the director, not the artist. Your photo is yours, just finished faster.

### Your files, your machine

Editmamei runs on your own computer, and the editing happens inside your own Photoshop. There's no Editmamei cloud your photo library gets uploaded to — no image content, no document data, and no file paths are sent to Editmamei's servers.

Editmamei does report anonymous, content-free usage telemetry (which tools you run, whether they succeed, how long they take, and your version/OS/Photoshop version) so a small team can see what's breaking and what's used. It carries no images, no paths, and no personal data. It's on by default and easy to turn off: `editmamei config set telemetry.usage false` (or edit `~/.editmamei/settings.json`). Optional diagnostic detail for bug-hunting is off until you opt in with `editmamei config set telemetry.diagnostics true`. Exactly what's collected, and every field that's sent, is documented in [docs/privacy.md](docs/privacy.md).

When your AI assistant needs to see the result — to verify an edit, say — Editmamei sends it a downscaled preview: to *that AI provider*, the cloud assistant you chose, the same as dropping a photo into a chat with it. That's how the AI judges its own work; it's a property of using a cloud AI, not a hop Editmamei adds.

---

## Requirements

- **Node.js** 20 or later
- **Adobe Photoshop 2026** (internal version 27.x) &mdash; earlier versions unverified ([why](docs/faq.md#which-photoshop-versions-are-supported))
- **Operating system:** Windows 10/11 or macOS 12+
- An **AI assistant** that speaks MCP, such as Claude Desktop, Cursor, Claude Code, or any other MCP-compatible client

---

## What it does

Editmamei gives your AI assistant a working photographer's toolkit inside Photoshop. Your AI calls these as building blocks in service of whatever you actually want, so Photoshop responds to *"make the sky more dramatic but keep the foreground natural"* instead of *Layer → New Adjustment Layer → Curves → drag the curve up at the highlight end.*

- **Documents** — open PSD, JPEG, PNG, TIFF, DNG, HEIC, and the standard raw formats; save layered PSDs; export JPEG and PNG
- **Layers** — create, duplicate, delete, rename, reorder, group, merge, flatten; opacity, blend mode, visibility, locking. Pro adds free layer transforms (move, scale, rotate, fit).
- **Smart selections** — Magic Wand, plus rectangle/feather; rich selection feedback. Pro adds Sensei-backed Select Subject and Select Sky.
- **Non-destructive adjustments** — Curves, Levels, Hue/Saturation, Brightness/Contrast as adjustment layers
- **Filters** — Gaussian Blur, Motion Blur, Sharpen, Smart Sharpen, Reduce Noise, High Pass, Add Noise; layer styles (drop shadow, stroke, outer glow)
- **Templates** — apply, verify, and recall saved recipes (markdown + before/after previews + tool-call evidence); create your own with Pro
- **Visual verification** — downscaled preview JPEGs returned inline, plus 256-bin per-channel histograms with mean/stdev/median
- **History** — undo, redo, inspect history states. Pro adds Photoshop Actions playback and ExtendScript scripting.

Real tools. Real layers. Your pixels.

Full feature breakdown at [editmamei.com](https://editmamei.com).

---

## Editions

| | Community | Pro |
|---|---|---|
| Documents (open PSD, JPEG, PNG, TIFF, DNG, HEIC, raw; save PSD; export JPEG/PNG) | ✅ | ✅ |
| Layers (create, duplicate, group, merge, reorder, properties) | ✅ | ✅ |
| Non-destructive adjustments (Curves, Levels, Hue/Saturation, Brightness/Contrast) | ✅ | ✅ |
| Filters (Gaussian Blur, Motion Blur, Sharpen, Smart Sharpen, Reduce Noise, High Pass) | ✅ | ✅ |
| Smart selections (Magic Wand, rectangle, feather, with rich feedback) | ✅ | ✅ |
| Masks (create from selection, apply, delete) | ✅ | ✅ |
| Layer styles + text (drop shadow, stroke, glow; font, color, alignment) | ✅ | ✅ |
| History (undo, redo, inspect history states) | ✅ | ✅ |
| Visual verification (inline previews + per-channel histograms) | ✅ | ✅ |
| Apply, verify, and recall saved templates | ✅ | ✅ |
| Create / save / delete custom templates | | ✅ |
| Sensei-backed selections (Select Subject, Select Sky) | | ✅ |
| Content-aware retouch (Content-Aware Fill, Patch, Content-Aware Move) | | ✅ |
| Layer transforms (move, scale, rotate, fit to document) | | ✅ |
| Photoshop Actions + scripting (play recorded Actions, ExtendScript escape hatch) | | ✅ |

Community covers the everyday working-photographer editing surface. Pro adds the production toolkit: authoring your own templates, the Sensei selection models for Subject and Sky, the content-aware retouch trio, free layer transforms, and Photoshop Actions + scripting.

What's *coming* in Pro after v1.0 (Smart Objects, Smart Filters, channels and vector masks, the rest of the adjustment-layer catalog, refined selection edges, advanced transforms) lives in [docs/roadmap.md](docs/roadmap.md), not on this table. The Pro tool list as it ships today is in [docs/pro-features.md](docs/pro-features.md). Detailed comparison and pricing at [editmamei.com/pricing](https://editmamei.com/pricing).

---

## Verifiable, not just promised

Editmamei is closed-source, so what we can verify, we do:

- **npm provenance** — every published build is cryptographically linked to the source commit and CI run that produced it.
- **SBOM** — a full software bill of materials lists every dependency in each release.
- **Abandonment → MIT** — if Editmamei goes unmaintained for 24 months, the license converts to MIT automatically. You're never stranded on a tool you can't keep alive.

The only thing Editmamei sends to us is content-free: anonymous usage you can audit and switch off, never your documents, images, or file paths. Every field that's collected is documented in [docs/privacy.md](docs/privacy.md); the website [privacy policy](https://editmamei.com/privacy) covers it too. Security disclosures at [editmamei.com/security](https://editmamei.com/security).

---

## Issues & support

**Bug reports and feature requests** belong in [this repo's issue tracker](https://github.com/editmamei/editmamei-ce/issues). Before opening one, please read the templates and [CONTRIBUTING.md](CONTRIBUTING.md) — they tell you what to include for a fast triage and which kinds of changes are open to PRs.

**Important:** issues are public. **Do not paste your license key, full file paths from sensitive projects, or screenshots of unfinished client work.** The bug report template tells you what's safe to share.

For account, billing, or license issues, email [support@editmamei.com](mailto:support@editmamei.com) (Pro subscribers) — those don't belong in a public issue.

For **security disclosures**, see [SECURITY.md](SECURITY.md) — please use GitHub Private Security Advisories or `security@editmamei.com` rather than the public issue tracker.

---

## Documentation

- [Installation](docs/installation.md) — setup for Windows and macOS, all supported MCP clients
- [Getting started](docs/getting-started.md) — first session, ping test, first real edit
- [Pro features](docs/pro-features.md) — what's in Pro that's not in CE, with pricing link
- [FAQ](docs/faq.md) — common questions

Full reference docs live at [editmamei.com/docs](https://editmamei.com/docs).

---

*Pairs well with: a layered PSD, a willing AI, and a small bowl of edamame.*
