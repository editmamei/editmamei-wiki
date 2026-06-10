# Pro features

Editmamei ships in two editions from a single npm package. The same `editmamei` install gives you Community by default; activating a Pro license unlocks the Pro tool surface on the next AI-client restart.

Both editions follow the same rule: AI orchestration, not generation. Photoshop edits with its own real tools; Pro just gives the AI a deeper toolkit to orchestrate.

This page describes the line between Community and Pro at v1.0. The split may evolve over time — see [editmamei.com/pricing](https://editmamei.com/pricing) for the current state.

---

## Activating Pro

Pro activation ships with the v1.0 launch — the license CLI and purchase flow are part of that release. See [roadmap.md](roadmap.md) for current status. Purchasing and pricing will be at [editmamei.com/pricing](https://editmamei.com/pricing) once Pro is available.

---

## Community Edition — what's included free

The Community edition covers the core editing surface most photographers need day to day:

- **Documents** — create, open, save, export, close, crop, resize
- **Layers** — create, duplicate, delete, rename, reorder, group, merge, flatten
- **Layer properties** — opacity, blend mode, visibility, locking
- **Basic adjustments** — Brightness/Contrast, Hue/Saturation, Auto Levels, Auto Contrast as direct bakes
- **Filters** — Gaussian Blur, Motion Blur, Sharpen, Add Noise
- **Selections** — Rectangle, Select All, Deselect, Invert, Feather
- **Layer masks** — create from selection, apply, delete
- **Layer styles** — drop shadow, stroke, outer glow, inner shadow
- **Selections** — Magic Wand (alongside Rectangle / Select All / Deselect / Invert / Feather)
- **Templates** — list and apply user-saved templates from `~/.editmamei/templates/`. Templates are bundles that pair a markdown recipe with before/after previews and the captured tool-call evidence; CE applies them, Pro creates them.
- **History** — undo, redo, get history states, jump to state
- **Actions** — list, play recorded Photoshop Actions
- **Preview & inspection** — downscaled preview JPEG, document info, layer tree (per-channel histograms are Pro)
- **Text** — create text layers, set font / size / color / alignment
- **Image placement** — place files, fit to document
- **Escape hatch** — `photoshop_execute_script` for arbitrary ExtendScript when no specific tool fits

This is enough to drive a full landscape or product editing workflow in conversation with your AI.

---

## Pro Edition — what's added

Pro extends the surface for professional non-destructive workflows, batch editing, and reproducible aesthetic recipes.

### Templates system — authoring side

A template is a reproducible aesthetic recipe — capture the current edit as a named bundle, then apply it later to new images. The authoring side is Pro; applying templates (your own or the CE built-ins) is Community.

- `photoshop_template_create_evidence` — gathers session evidence (tool calls, history states, metadata snapshot) and renders before/after previews
- `photoshop_template_save` — saves the template bundle to `~/.editmamei/templates/<slug>/`
- `photoshop_template_delete` — removes a saved template

CE users get `photoshop_template_apply` and `photoshop_template_list` (above, under Community); they can apply any template at `~/.editmamei/templates/<slug>/` but cannot create, save, or delete templates. Pro adds the authoring tools so editing decisions become repeatable rather than one-shots — the AI uses its own captured reasoning to drive the existing pipeline tools on a new image, self-judging against the template's exit criteria.

### Sensei-backed selections

- `photoshop_select_subject` — Sensei-backed subject isolation
- `photoshop_select_sky` — Sensei-backed sky selection

Every selection returns a rich feedback bundle — area coverage, edge complexity, partial-vs-full pixel counts — so the AI can verify a selection actually grabbed what was intended before committing. The non-Sensei selection tools (Magic Wand, rectangle, feather) are in Community.

### Per-channel histograms

- `photoshop_get_histogram` — 256-bin distribution for any channel with mean / stdev / median, returned inline so the AI can confirm an operation actually changed pixels.

### Coming in Pro post-v1.0

Roadmap items live in [`roadmap.md`](roadmap.md) (also at [editmamei.com/roadmap](https://editmamei.com/roadmap)). Highlights:

- Smart Objects with editable contents and Smart Object lifecycle tools
- Smart Filters
- Channels and alpha-channel storage
- Vector paths and vector masks
- Complete adjustment-layer type catalog (Color Balance, Vibrance, Photo Filter, Selective Color, Channel Mixer, Gradient Map)
- `photoshop_refine_selection_edge`
- Advanced transforms (skew / perspective / distort, selection-modify primitives)

When this lands, Editmamei Pro becomes a complete AI-driven non-destructive editor.

---

## Pricing

Current tiers at [editmamei.com/pricing](https://editmamei.com/pricing). Pro is available as a subscription or a one-time lifetime license.

Pro subscribers get:

- Priority email support at `support@editmamei.com`
- Early access to new Pro tools as they ship
- A vote in roadmap prioritization through the Pro community Discord (planned)
