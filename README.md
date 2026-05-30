# Editmamei

**Unlock Photoshop with natural-language photo editing**

*(Pronounced like* edamame*. Yes, the snack.)*

[![npm version](https://img.shields.io/npm/v/editmamei.svg)](https://www.npmjs.com/package/editmamei)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](https://editmamei.com/license)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-lightgrey.svg)]()

Editmamei is a Model Context Protocol (MCP) server that lets your AI assistant — Claude Desktop, Cursor, Claude Code, and any other MCP-compatible client — drive Adobe Photoshop directly. Open documents, build non-destructive layer stacks, apply adjustments, run smart selections, save reusable editing recipes, and export final deliverables, all through natural-language conversation with your AI.

Unlike cloud-based AI photo tools, Editmamei drives the actual Photoshop application installed on your computer — the full program, with the speed of AI directing it. That lowers the barrier for anyone who finds Photoshop's menus intimidating, and gives editors who've known those menus for years a faster, more flexible way to work.

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

Then restart your MCP client (Claude Desktop, Cursor, Claude Code) and ask it to ping Photoshop:

> "Is Photoshop connected?"

The AI calls `photoshop_ping` and you'll see your Photoshop version returned. Full setup walkthrough in [docs/getting-started.md](docs/getting-started.md).

---

## Requirements

- **Node.js** 20 or later
- **Adobe Photoshop** 2022 or later (2024+ recommended)
- **Operating system:** Windows 10/11 or macOS 12+
- An **MCP-compatible AI client** — Claude Desktop, Cursor, Claude Code, or any other MCP host

---

## What it does

Editmamei exposes ~80 Photoshop operations as MCP tools — each with structured input/output, schema validation, and context awareness. Your AI calls them as building blocks in service of whatever you actually want to do. The result is Photoshop that responds to *"make the sky more dramatic but keep the foreground natural"* instead of *Layer → New Adjustment Layer → Curves → drag the curve up at the highlight end.*

- **Documents** — open, save, export, close; full format coverage (PSD, JPEG, PNG, TIFF, DNG, HEIC, raw)
- **Layers** — create, duplicate, delete, rename, reorder, group, merge, flatten; opacity, blend mode, visibility, locking
- **Smart selections** — Color Range, Magic Wand, plus rectangle/feather; rich selection feedback. Pro adds Sensei-backed Select Subject and Select Sky.
- **Non-destructive adjustments** — Curves, Levels, Hue/Saturation, Brightness/Contrast as adjustment layers
- **Filters** — Gaussian Blur, Motion Blur, Sharpen, Add Noise; layer styles (drop shadow, stroke, outer glow)
- **Templates** — apply built-in recipes to new images; create your own with Pro
- **Visual verification** — downscaled preview JPEGs returned inline. Pro adds per-channel histograms with mean/stdev/median.
- **History & Actions** — undo, redo, jump to state; play recorded Photoshop Actions

You stay in command: co-edit with your AI in real time, then save the result as a reusable recipe and batch it across a shoot — a recipe *you* designed, not a fixed pipeline.

Full feature breakdown at [editmamei.com](https://editmamei.com).

---

## Editions

| | Community | Pro |
|---|---|---|
| Core editing surface (documents, layers, basic adjustments, filters, selections, masks) | ✅ | ✅ |
| Apply built-in templates | ✅ | ✅ |
| Create / save / delete custom templates | | ✅ |
| Sensei-backed selections (Select Subject, Select Sky) | | ✅ |
| Per-channel histograms | | ✅ |
| Expanded adjustment-layer types | | ✅ |
| Channels, paths, vector masks | | ✅ |
| Priority support | | ✅ |

The Pro tool list lives in [docs/pro-features.md](docs/pro-features.md); the roadmap for what's coming after v1.0 is in [docs/roadmap.md](docs/roadmap.md). Detailed comparison and pricing at [editmamei.com/pricing](https://editmamei.com/pricing).

---

## Privacy & trust

Editmamei is a local MCP server that drives the real Adobe Photoshop you already have installed. Your documents, templates, and project files stay on your machine — Editmamei itself doesn't ship analytics, crash reports, or telemetry.

Worth being clear about: your AI assistant is a cloud service. When you ask it to analyze an image — for example, the visual-verification preview — a downscaled JPEG is sent to *that AI provider*, exactly as if you'd dropped the file into a chat with it. That's a property of using a cloud AI and a function of which assistant you choose — not a hop Editmamei adds.

The only data Editmamei itself transmits is Pro license validation: a license key + version + OS, sent about once every 7 days. No document, image, file path, or template data.

**Verifiable, not just promised.** Editmamei is closed-source, so what we can verify, we do:

- **npm provenance** — every published build is cryptographically linked to the source commit and CI run that produced it.
- **SBOM** — a full software bill of materials lists every dependency in each release.
- **Abandonment → MIT** — if Editmamei goes unmaintained for 24 months, the license converts to MIT automatically. You're never stranded on a tool you can't keep alive.

Full details in the [privacy policy](https://editmamei.com/privacy). Security disclosures at [editmamei.com/security](https://editmamei.com/security).

---

## Issues & support

**Bug reports and feature requests** belong in [this repo's issue tracker](https://github.com/editmamei/editmamei-ce/issues). Before opening one, please read the templates — they tell you what to include for a fast triage.

**Important:** issues are public. **Do not paste your license key, full file paths from sensitive projects, or screenshots of unfinished client work.** The bug report template tells you what's safe to share.

For account, billing, or license issues, email [support@editmamei.com](mailto:support@editmamei.com) (Pro subscribers) — those don't belong in a public issue.

For security disclosures, see [editmamei.com/security](https://editmamei.com/security).

---

## Documentation

- [Installation](docs/installation.md) — setup for Windows and macOS, all supported MCP clients
- [Getting started](docs/getting-started.md) — first session, ping test, first real edit
- [Pro features](docs/pro-features.md) — what's in Pro that's not in CE, with pricing link
- [FAQ](docs/faq.md) — common questions

Full reference docs live at [editmamei.com/docs](https://editmamei.com/docs).

---

*Pairs well with: a layered PSD, a willing AI, and a small bowl of edamame.*
