# Pro features

Editmamei ships in two editions under the same package name. Community installs free from the public npm registry. Pro is the same `editmamei` package delivered as its own build with your purchase: install it over Community, restart your AI client, and the Pro tools appear. Same CLI, same install flow, same MCP server name.

Both editions follow the same rule: AI orchestration, not generation. Photoshop edits with its own real tools; Pro just gives the AI a deeper toolkit to orchestrate.

This page describes the line between Community and Pro as it stands today. The split may evolve; see [editmamei.com/pricing](https://editmamei.com/pricing) for the current state.

---

## Activating Pro

Pro is coming soon. Community is free and available today; Pro isn't purchasable yet. When it launches you'll buy at [editmamei.com/pricing](https://editmamei.com/pricing) and activate it over your existing Community install with a license, and this section gets the concrete steps. See [roadmap.md](roadmap.md) for status.

---

## Community: what's included free

The Community edition covers the core editing surface most photographers need day to day:

- **Documents:** create, open, save layered PSDs, export JPEG/PNG, close, crop, resize
- **Layers:** create, duplicate, delete, rename, reorder, group, merge, flatten, stamp visible
- **Layer properties:** opacity, blend mode, visibility, locking, rasterize
- **Non-destructive adjustments:** Curves, Levels, Hue/Saturation, Brightness/Contrast as adjustment layers (an active selection becomes the new layer's mask automatically)
- **Filters and tonal tools:** Gaussian Blur, Motion Blur, Sharpen, Smart Sharpen, Reduce Noise, High Pass, Add Noise, Shadows/Highlights, Equalize. Destructive ops run on an auto-duplicated layer by default, so the original is preserved
- **Selections:** Magic Wand, Rectangle, Select All, Deselect, Invert, Feather. Every selection returns rich feedback (area, edge complexity, pixel counts) plus a selection preview
- **Layer masks:** create from selection, apply, delete
- **Layer styles:** drop shadow, stroke, outer glow
- **Layer transforms and straightening:** move, scale, rotate, and fit-to-document on the active layer; background layers auto-promote instead of erroring, so you can straighten a tilted phone shot in one step
- **Content-aware retouch:** Content-Aware Fill, Patch, and Content-Aware Move, each driven against a selection the AI can verify first. Erase a distraction or repair a blemish without leaving the conversation
- **History:** undo, redo, inspect history states
- **Visual verification:** downscaled preview JPEGs returned inline, layer-bounds diffs, region comparison, and 256-bin per-channel histograms with mean, stdev, and median
- **Document insight:** camera metadata (make, model, lens, ISO, focal length, GPS), ACR develop settings, full layer tree as JSON, capability overview
- **Text:** create text layers, set font, size, color, and alignment, update content
- **Image placement:** place image files into the document

This is enough to drive a full landscape or product editing workflow in conversation with your AI.

---

## Pro: what's added

Pro extends the surface for professional non-destructive workflows, batch editing, Sensei-backed selections, and reproducible aesthetic recipes.

### Templates: the whole reproducible-recipe system

A template is a reproducible aesthetic recipe: capture a finished edit as a named bundle, then apply it later to new images. The **entire template surface is Pro**, authoring and use alike.

- `photoshop_template_create_evidence`: gathers session evidence (tool calls, history states, metadata snapshot) and renders before/after previews
- `photoshop_template_save`: saves the template bundle to `~/.editmamei/templates/<slug>/`, optionally with a machine-checkable style signature
- `photoshop_template_delete`: removes a saved template
- `photoshop_template_list`: lists saved templates
- `photoshop_template_apply`: applies a saved template to the current image; the AI re-derives each value for the new photo and self-judges against the template's exit criteria
- `photoshop_template_verify`: measures the current document against a template's machine-checkable style signature, with a corrective steer per miss
- `photoshop_template_recall`: re-surfaces one section of a template (exit criteria, tune dials, signature) as text, cheaply, late in a long session

Templates turn one-shot edits into repeatable looks. Bundling the whole surface as one paid feature matches how it's used: authoring and applying are two halves of the same workflow.

### Sensei-backed selections

- `photoshop_select_subject`: Sensei-backed subject isolation
- `photoshop_select_sky`: Sensei-backed sky selection

Each returns the same rich feedback bundle as the Community selections (area coverage, edge complexity, partial-versus-full pixel counts), so the AI can verify a selection actually grabbed what was intended before committing. The non-Sensei selection tools (Magic Wand, rectangle, feather) are in Community.

### Actions and scripting

- `photoshop_list_actions` and `photoshop_play_action`: enumerate and play your recorded Photoshop Actions
- `photoshop_execute_script`: the escape hatch, arbitrary ExtendScript for when no specific tool fits

### Coming later in Pro

Roadmap items live in [`roadmap.md`](roadmap.md). Highlights: Smart Objects with editable contents, Smart Filters, channels and alpha-channel storage, vector paths and vector masks, the complete adjustment-layer catalog, `photoshop_refine_selection_edge`, and advanced transforms (skew, perspective, distort, plus selection-modify primitives).

---

## Pricing

Pricing and purchase options will be published at [editmamei.com/pricing](https://editmamei.com/pricing) when Pro launches.
