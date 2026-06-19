# Editmamei

**Unlock Photoshop with natural-language photo editing.** AI orchestration, not generation.

*(Pronounced like* edamame*. Yes, the snack.)*

[![npm version](https://img.shields.io/npm/v/editmamei.svg)](https://www.npmjs.com/package/editmamei)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](https://editmamei.com/license)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-lightgrey.svg)]()

You describe the edit. Your AI assistant plans the steps. Your own copy of Photoshop carries them out with its standard adjustment layers, masks, selections, and filters. The AI directs; Photoshop edits. No generative model touches your pixels.

This repository is the public home for the documentation and the issue tracker. The npm package source is private; what you install is the compiled artifact these docs describe.

**[editmamei.com](https://editmamei.com)** · [Install](docs/installation.md) · [Getting started](docs/getting-started.md) · [Pro features](docs/pro-features.md) · [Report a bug](https://github.com/editmamei/editmamei-wiki/issues/new/choose)

---

## Install

**Claude Desktop, one click.** Download the latest [`editmamei.mcpb`](https://github.com/editmamei/editmamei-wiki/releases/latest) and add it under Settings → Extensions. Claude Desktop ships its own Node runtime, so there's nothing else to install.

**Everything else, from npm:**

```bash
npm install -g editmamei
editmamei install
```

`editmamei install` detects your MCP clients (Claude Desktop, Cursor, Claude Code) and writes each one's config in a single pass. Restart your client, then ask it:

> "Is Photoshop connected?"

You'll get your Photoshop version back. Full walkthrough in [Getting started](docs/getting-started.md). Run `editmamei status` to check your install state any time.

---

## Requirements

- **Adobe Photoshop 2026** (internal version 27.x). Earlier versions are unverified ([why](docs/faq.md#which-photoshop-versions-are-supported)).
- **Windows** 10/11 or **macOS** 12+.
- **Node.js 20+** for the npm path. The `.mcpb` path doesn't need it (Claude Desktop bundles its own runtime).
- An **MCP-compatible AI client**: Claude Desktop, Cursor, Claude Code, or similar.

---

## What it does

Editmamei gives your AI assistant a working photographer's toolkit inside Photoshop: open and save documents, build layer stacks, make selections, add non-destructive adjustments, run filters, mask, retouch, and check the result with inline previews and histograms. Your AI calls these as building blocks, so you can say *"make the sky more dramatic but keep the foreground natural"* instead of clicking through *Layer → New Adjustment Layer → Curves*.

The full capability surface, with live examples, is at [editmamei.com](https://editmamei.com). The Community and Pro split is below.

---

## Community and Pro

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
| Layer transforms + straightening (move, scale, rotate, fit to document) | ✅ | ✅ |
| Content-aware retouch (Content-Aware Fill, Patch, Content-Aware Move) | ✅ | ✅ |
| Templates (create, save, apply, verify, recall reproducible recipes) | | ✅ |
| Sensei-backed selections (Select Subject, Select Sky) | | ✅ |
| Photoshop Actions + scripting (play recorded Actions, ExtendScript escape hatch) | | ✅ |

Community covers the everyday working-photographer surface, including straightening, layer transforms, and content-aware retouch. Pro adds the production toolkit: the reproducible-template system, Sensei-backed Select Subject and Select Sky, and Photoshop Actions plus scripting.

What's planned for Pro after v1.0 is in the [roadmap](docs/roadmap.md). Full comparison and pricing at [editmamei.com/pricing](https://editmamei.com/pricing).

---

## Privacy

Editmamei runs on your computer, and the editing happens in your own Photoshop. No image content, document data, or file paths are sent to Editmamei's servers. It does report anonymous, content-free usage telemetry (which tools run, whether they succeed, your version and OS) so a small team can see what's breaking. It's on by default and turns off with `editmamei config set telemetry.usage false`.

When your AI assistant needs to see a result, Editmamei sends it a downscaled preview, the same as dropping a photo into a chat with that assistant. That's a property of using a cloud AI, not a hop Editmamei adds. Exactly what's collected, field by field, is in [privacy.md](docs/privacy.md).

---

## Issues and support

Bug reports and feature requests go in the [issue tracker](https://github.com/editmamei/editmamei-wiki/issues). Please skim [CONTRIBUTING.md](CONTRIBUTING.md) and the templates first. **Issues are public: don't paste your license key, sensitive file paths, or unreleased client work.**

Account, billing, or license questions go to [support@editmamei.com](mailto:support@editmamei.com). For security disclosures, see [SECURITY.md](SECURITY.md) and use a private advisory rather than a public issue.

---

## Documentation

- [Installation](docs/installation.md): Windows and macOS setup for every supported client
- [Getting started](docs/getting-started.md): first session, ping test, first real edit
- [Pro features](docs/pro-features.md): what Pro adds, with a pricing link
- [FAQ](docs/faq.md): common questions
- [Roadmap](docs/roadmap.md): what's planned after v1.0
- [Privacy](docs/privacy.md): every telemetry field, and how to switch it off

---

*Pairs well with: a layered PSD, a willing AI, and a small bowl of edamame.*
