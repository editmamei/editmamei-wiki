# Roadmap

Editmamei is in active development. This page lists what's planned but **not yet shipped**. For what's in each edition today, see [`pro-features.md`](pro-features.md); that's the canonical edition split.

If a tool or capability appears here but not in [`pro-features.md`](pro-features.md), it isn't available in any build yet.

---

## Where things stand

**Community is live.** Install it free from npm (`npm install -g editmamei`), or as a one-click `.mcpb` extension for Claude Desktop. See [installation.md](installation.md). The [CHANGELOG](../CHANGELOG.md) tracks what's landed.

**Pro is coming soon.** The Pro feature set is defined (the reproducible-template system, Sensei-backed selections, and Photoshop Actions plus scripting; see [pro-features.md](pro-features.md)), but it isn't purchasable yet. When it launches you'll buy at [editmamei.com/pricing](https://editmamei.com/pricing) and activate it over your Community install with a license. The [installation.md "Pro"](installation.md#pro), [pro-features.md "Activating Pro"](pro-features.md#activating-pro), and [faq.md](faq.md#how-do-i-activate-a-pro-license) sections get the concrete activation steps at launch.

---

## Planned for Pro

These are scoped and committed for after the initial Pro release. None of them are in a build today.

### Smart Object lifecycle

Create, embed, and edit Smart Objects from the AI side, including contents replacement, the Smart Object to embedded-layer flow, and the linked-versus-embedded distinction. This is the headline expansion. With Smart Objects, Smart Filters (below), and adjustment layers together, Editmamei Pro covers what "non-destructive workflow" actually means.

### Smart Filters

Non-destructive filter application on Smart Objects: blur, sharpen, and noise (and the existing filter surface) as re-editable Smart Filters rather than destructive bakes.

### Channels and alpha-channel storage

Per-channel access, alpha channel save and load, and Channels-palette parity. Pairs naturally with masks and selections, since many advanced selections live in alpha channels.

### Vector paths and vector masks

Path creation, path-to-selection conversion, and vector mask creation and editing. Required for clean compositing and any logo or line-art workflow.

### Complete adjustment-layer catalog

Today's adjustment-layer set covers the basics (Curves, Levels, Hue/Saturation, Brightness/Contrast). Still to come: Color Balance, Vibrance, Photo Filter, Selective Color, Channel Mixer, and Gradient Map.

### Refine selection edge

`photoshop_refine_selection_edge`: edge refinement with smoothing, contrast, and edge shift. Belongs with the Sensei-backed selection set.

### Advanced transforms

Free-transform with skew, perspective, and distort, plus selection-modify primitives (expand, contract, smooth, border). The basic transforms (scale, rotate, move, fit) are already in Community; these are the advanced operations.

### Provenance Mode

A user-level setting controlling whether Editmamei may invoke Photoshop's *native* generative tools (Generative Fill and the like). **Defaults off.** Enabling generative use is an explicit, active decision.

When off (the default): no generative pixels, no AI-generation provenance metadata, and optionally strip stray C2PA/IPTC AI-generation metadata on export so the file is verifiably clean.

Once Provenance Mode ships, public copy that describes Editmamei's non-generative posture gets scoped to the mode ("Provenance Mode guarantees...") rather than stated as a blanket claim. Until then, the shipped build orchestrates only non-generative Photoshop tools by virtue of which tools are registered; there's no toggle to flip.

---

## Watching, not committed

Things being evaluated but not promised. Items here may or may not land; they're listed for transparency, not as commitments.

*(Empty at the moment. Items appear here when discussion starts but before scope is locked.)*

---

For roadmap discussion and Pro-tier priority voting, the Pro community Discord is the venue once it spins up.
