# Roadmap

Editmamei is in active development. This page lists what's coming after v1.0 — features that have been scoped and committed to, but are not in any shipped edition today.

Anything described here is **not shipped**. If a tool name appears on this page but not in [`pro-features.md`](pro-features.md)'s edition listings, it is not yet available in any build.

For the canonical edition split (what's in CE today, what's in Pro today), see [`pro-features.md`](pro-features.md).

---

## Coming in Pro post-v1.0

### Smart Object lifecycle

Create, embed, and edit Smart Objects from the AI side — including Smart Object contents replacement, Smart Object → embedded layer flow, and the linked-vs-embedded distinction. This is the headline post-v1.0 expansion.

When Smart Objects ship, Editmamei Pro becomes a complete AI-driven non-destructive editor — adjustment layers, Smart Filters (below), and Smart Objects together cover the editing surface that "non-destructive workflow" actually means.

### Smart Filters

Non-destructive filter application on Smart Objects: blur / sharpen / noise (and the existing filter surface) as re-editable Smart Filters rather than destructive bakes.

### Channels and alpha-channel storage

Per-channel access, alpha channel save/load, and Channels-palette parity. Pairs naturally with masks and selections — many advanced selections live in alpha channels.

### Vector paths and vector masks

Path creation, path-to-selection conversion, vector mask creation and editing. Required for clean compositing and any logo / line-art workflow.

### Complete adjustment-layer type catalog

Today's Pro adjustment-layer set is the basics. Post-v1.0 fills in:

- Color Balance
- Vibrance
- Photo Filter
- Selective Color
- Channel Mixer
- Gradient Map

### Refine selection edge

`photoshop_refine_selection_edge` — edge refinement with smoothing, contrast, and edge shift. Belongs with the Sensei-backed selection set already in Pro.

### Advanced transforms

Free-transform with skew, perspective, and distort. Selection-modify primitives (expand, contract, smooth, border). The basic transforms (scale / rotate / move / fit) are already in CE; these are the advanced operations that aren't.

---

## Watching, not committed

This section is for things being evaluated but not yet promised. Items here may or may not land — they're listed for transparency, not as roadmap commitments.

*(Empty at the moment. Items appear here when discussion starts but before scope is locked.)*

---

For roadmap discussions and Pro-tier vote-on-priorities, the Pro community Discord is the venue once it spins up.
