# Changelog

All notable changes to Editmamei are documented here. This file mirrors the changelog from the private source repo, scoped to user-facing changes (internal process notes are stripped).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

(Empty — next commit appends here.)

---

## [0.5.0] — 2026-06-06

MINOR bump for a performance-focused batch driven by the 2026-06-06 full-tool demo. That session ran 108 tool calls in 71.8 minutes wall clock — but only 1.5 minutes of that was actual tool work. The LLM was spending 45× more time thinking than the tools spent running, with context bloat as the dominant cause. This release attacks the four biggest contributors. It also promotes a previously-hidden tool whose absence was costing the LLM 5 wasted escape-hatch attempts per session, and ships a runtime error rewrite that converts a dead-end failure into a recoverable one.

### Added

- **Layer-mask creation is now a first-class tool.** Previously hidden behind the dev-tier gate (and so excluded from CE + Pro bundles), the tool is now visible to the LLM by default. Without it, sessions trying to add a layer mask burned multiple `photoshop_execute_script` attempts writing the underlying ActionManager descriptor by hand — none of which succeeded.
  - Tool now available in CE + Pro: `photoshop_create_layer_mask`
  - Promotion is backed by the 2026-06-04 audit verifying the snippet against `src/spec/ps27/masks/create-reveal-all.ts` and `create-reveal-selection.ts` (Group D verdict OK)
  - Auto-selects Reveal Selection vs Reveal All based on whether there's an active selection
  - Handles adjustment layers (which already own a mask slot) via a distinct fill-existing-mask branch

### Changed

- **Property-setter and filter tools no longer flood every response with a full context block.** Tools that change a *property* of the already-active layer (rather than changing *what* is active) now return a slim 3-field context (`{ document_name, activeLayer_name, hasDocument }`) instead of the full 8-field shape (which carried bounds, opacity, blend mode, layer kind, lock state, isBackground, document dimensions, color mode, layer count, and selection state on every call). The full payload was repeating on every call and bloating the conversation by ~300 tokens × number of calls.
  - Tools affected (14 total): `photoshop_set_layer_opacity`, `set_layer_blend_mode`, `set_layer_visibility`, `set_layer_locked`, `rename_layer` (5 property setters); `photoshop_apply_gaussian_blur`, `apply_sharpen`, `apply_noise`, `apply_motion_blur`, `apply_lens_blur`, `apply_smart_sharpen`, `apply_reduce_noise`, `apply_high_pass`, `apply_shadows_highlights` (9 filters)
  - Tools that change WHAT is active (create/delete/select/open/save/get_*) continue to return the full context — the LLM needs kind/bounds/blend-mode of newly-active things
  - The `context` field is still present on every trimmed tool's result; it's just shaped differently
- **Preview defaults dropped to halve the base64 payload per call.** Verification-grade reads (tone, clipping, composition, mean shift) work fine at smaller dimensions and lower JPEG quality; the bigger defaults were paying token cost for detail the LLM wasn't using.
  - Tool affected: `photoshop_get_preview`
  - `max_dimension` default: 1500 → 1024
  - `quality` default: 8 → 6
  - The tool's input-schema description now names both new defaults and the "bump higher only when reading fine detail" case for opt-in
- **Font-not-found errors now list installed font families** so the LLM can pick a near-miss instead of giving up on text styling.
  - Tool affected: `photoshop_set_text_font`
  - On failure the error now includes (in priority order): up to 20 family names containing the requested substring (e.g. "Helvetica" finds "HelveticaLTStd-Roman"), then if there's no fuzzy match, a 30-name alphabetical sample with a "(N more)" suffix
  - Previously the error only said "Font not found" and named one example PostScript name — the LLM had no signal which fonts were actually installed and went silent on subsequent text-styling steps

---

## [0.4.3] — 2026-06-05

PATCH bump for two histogram-tool bugs found in the same 2026-06-04 IMG_1022 session NDJSON that surfaced v0.4.1 + v0.4.2. The schema advertised features that hadn't been implemented; the snippet now actually delivers them.

### Fixed

- **Luminosity histograms now work.** The schema's `channel: 'luminosity'` enum value was advertised but every call failed with "Channel not found: luminosity" because the snippet did a name lookup in `doc.channels` (which on RGB documents only contains Red/Green/Blue).
  - Tool fixed: `photoshop_get_histogram`
  - Dispatched per document mode: Lab → Lightness channel (exact), Grayscale → Gray channel (exact), RGB → synthesized from R+G+B via Rec.709 weighted bin sums (0.2126·R + 0.7152·G + 0.0722·B)
  - For RGB the mean is exact (linearity of expectation); stdev and median are approximations because per-pixel R/G/B values are correlated in real images
  - The result's `channel` field annotates which path landed, e.g. `'luminosity (Lab Lightness)'`, `'luminosity (Grayscale)'`, `'luminosity (Rec.709 approximation from RGB)'`
  - Terminal error when no fallback channels exist (Indexed, Multichannel without RGB primitives) names the actual channels present so the LLM can pick a real one
- **Composite histograms no longer fail after an adjustment layer is added.** `doc.histogram` returns "The requested property does not exist" in PS 27.x whenever the active layer is an adjustment, fill, or shape layer — meaning every composite read after `add_adjustment_layer` failed.
  - Tool fixed: `photoshop_get_histogram` with default `channel: 'composite'`
  - Fallback chain: (1) try `doc.histogram`, (2) save active layer → switch to a pixel layer (Background preferred, else first NORMAL layer in tree) → retry → restore active, (3) synthesize composite from Lab Lightness / Gray channel / RGB channel-average
  - The result's `channel` field encodes which path landed (e.g. `'composite (doc-histogram-after-active-switch)'`, `'composite (rgb-channel-average)'`) so the caller can tell the synthesis was used
  - Active layer is restored unconditionally before any fallback path runs — no caller-observable state change

### Changed

- **Histogram tool description now matches reality.** Spells out the per-mode luminosity dispatch, the Rec.709 approximation on RGB, and the adjustment-layer composite-recovery so the LLM can pick the right channel without guessing.
  - Tool affected: `photoshop_get_histogram`
  - `channel` input field description rewritten from a one-line summary to a per-enum-value breakdown

---

## [0.4.2] — 2026-06-05

PATCH bump for a latent template-literal-in-comment bug in `photoshop_move_layer_to_group` that had been broken at runtime on every call since the comment was added. Found by reading the session NDJSON for the IMG_1022 grade — the tool's `error` field captured the exact PS-side syntax error.

### Fixed

- **Layer-to-group moves no longer fail with a syntax error.** Every move-into-group call had been failing with a Photoshop parse error; the fix lets em-dash normalization work as originally intended.
  - Tool affected: `photoshop_move_layer_to_group`
  - Root cause: `${normNameHelper}` interpolation lived inside a `//` comment in the TypeScript-side snippet body
  - Template literals evaluate `${}` regardless of comment context — the helper's multi-line body got injected, its leading newline terminated the `//`, and the trailing comment text parsed as code
  - Fix: comment rewritten as plain prose; snippet renders cleanly
  - Found by reading the session NDJSON for the IMG_1022 grade — the tool's `error` field captured the exact PS-side syntax error

---

## [0.4.1] — 2026-06-05

PATCH bump for one snippet-level silent-no-op bug in `photoshop_create_group`. The 2026-06-04 IMG_1022 session called `create_group(layers=["Warm — 81", "Curves — S-pop", "Vibrance", "Levels — contrast"])` and got back `moved_count: 1` — only `"Vibrance"` (the one name without an em-dash) matched. The other three landed in `not_found` silently because the snippet's `findLayerByName` used strict ASCII `===` instead of the `normNameHelper` dash-tolerant comparison the rest of the group/layer-lookup tools already use.

### Fixed

- **Group memberships handle Unicode dash variants.** Creating a group from a list of layer names now matches em-dash, en-dash, and ASCII hyphen-minus the same way move and select tools already did.
  - Tool fixed: `photoshop_create_group` when called with a `layers` list
  - U+2014 (em-dash), U+2013 (en-dash), and ASCII hyphen-minus all fold to one canonical form
  - Case + whitespace-run normalization applied consistently across `photoshop_create_group`, `photoshop_move_layer_to_group`, `photoshop_select_layer`
  - Names that previously fell into `not_found` silently now move into the group correctly
  - Same class of bug as the original Bug I in `move_layer_to_group` (fixed 2026-05-29); the fix hadn't propagated

---

## [0.4.0] — 2026-06-04

MINOR bump for the 2026-06-03 AM Descriptor Audit remediation pass: six HIGH-severity silent-no-op bug fixes in `src/api/extendscript.ts`, two new clipping-mask tools at `'dev'` tier, schema-completeness additions to several existing tools, and seven new snippet-vs-spec tests pinning the fixes against the V1 AM Event Library specs.

This is the "stop shipping fictional descriptors" release. Every fix is verified against PS 27.7.0 Windows ScriptListener ground truth captured 2026-06-03 and codified in the typed specs under `src/spec/ps27/`. The same test framework that proves these fixes will fail at PR-time if any future refactor silently reverts them.

### Added

- **Place Image gets non-uniform scale.** Optional width and height percent parameters let you stretch a placed Smart Object instead of being locked to its native size.
  - New `width_percent` and `height_percent` parameters on `photoshop_place_image`
  - Omit to keep native size (matches PS UI default)

#### New tools landing as 'dev' tier (excluded from CE + Pro shipped bundles)

- **`photoshop_create_clipping_mask` and `photoshop_release_clipping_mask`** — standalone primitives for clipping the active layer to the layer below (or releasing the clip). The clipping behavior previously lived only inline inside `photoshop_add_adjustment_layer`'s `clip_to_below` flag; standalone tools now cover the case where you want to clip any layer, not just an adjustment-layer being created. Dispatches the verified `groupEvent` / `ungroupEvent` stringIDs (aliased to `GrpL` / `Ungr` charIDs). Distinct from `photoshop_ungroup` which dissolves a LayerSet via the unrelated `ungroupLayersEvent`.
- **`photoshop_apply_shadows_highlights`** gains `black_clip` and `white_clip` parameters (PS dialog default `0.01` for both). Previously hardcoded; advanced users can now bias toward more contrast at the cost of detail in the extreme tones.

### Fixed

- **Levels adjustment honors black/white/gamma on PS 27.x.** Three silent-no-op drifts in the post-create descriptor were dropping user-set tonal values; the fix means setting input black / white / gamma actually takes effect.
  - Tool fixed: `photoshop_add_adjustment_layer` with `type=levels`
  - Pre-audit emission used `putEnumerated` for the `Chnl` reference (PS wants `putReference` to the composite)
  - Used separate `Inpt`+`Wht ` keys (PS wants ONE `Inpt` key holding a 2-int list `[black, white]`)
  - Used `putInteger(gamma * 100)` for gamma (PS wants `putDouble(gamma)`)
  - Same class of silent-no-op as the Bundle Q hotfix 5 bugs; verified against `src/spec/ps27/adjustments/levels.ts`
- **Invert adjustment layer uses the captured PS UI form.** Mk path now uses `putClass(Type, Invr)` with no inner descriptor; previously coerced PS into an unexpected creation path with `putObject` + `presetKindDefault`.
  - Tool fixed: `photoshop_add_adjustment_layer` with `type=invert`
- **Outer Glow range slider type fix.** The Range slider on Outer Glow layer styles was sending a putInteger where PS wants a unitDouble percentUnit, silently default-falling back to the wrong behavior.
  - Tool fixed: `photoshop_add_layer_style` with `style=outer_glow`
  - `Inpr` is `putUnitDouble` percentUnit, NOT `putInteger`
  - `ShdN` (shading noise) added as a required descriptor key alongside the existing `Inpr` slot
  - Same type-drift class as the simultaneously-fixed Smart Sharpen `Amnt`

#### Fixes to dev-tier tools (excluded from CE + Pro shipped bundles)

- **`photoshop_apply_smart_sharpen`** — five simultaneous fixes against the 2026-06-03 capture: (1) sub-object class is `adaptCorrectTones` (no "ive" infix; the typo silently dropped both Shadows and Highlights tab params); (2) root `Amnt` and `noiseReduction` are `putUnitDouble` percentUnit (not `putInteger`); (3) sub-object outer keys are charID `sdwM`/`hglM` (not stringIDs `shadowMode`/`highlightMode`); (4) inner `Amnt`/`Wdth` are `putUnitDouble` percentUnit, inner `Rds ` stays `putInteger`; (5) `blur` key + `GsnB`/`LnsB`/`MtnB` enum values are charIDs. The shadows/highlights typo had been shipping completely broken since Bundle P.
- **`photoshop_apply_lens_blur`** — full rewrite from forum-lore stringIDs to the captured `Bokh` (Bokeh) charID event with the `Bk*`/`Bt*`/`Be*` family. Iris shape strings (`hexagon` etc.) map to numeric-suffixed `BeS3`-`BeS8`; noise distribution to `BeNu`/`BeNg`; radius and specular brightness use `putDouble`. The pre-audit snippet was complete CS6-era fiction — every stringID (`lensBlur`, `radius`, `irisShape`, `noiseDistribution`, `depthMap`, etc.) was wrong against PS 27.x. Verified against `src/spec/ps27/filters/lens-blur.ts`.
- **`photoshop_select_color_range`** — input sRGB now converted to CIE Lab via the standard sRGB D65 → Bradford → D50 → Lab pipeline before emission, and the descriptor uses `LbCl` (Lab Color) with `Lmnc`/`A   `/`B   ` doubles plus the previously-omitted `colorModel: 0` integer (selects the "sampled colors Lab" algorithm). Pre-audit snippet sent `RGBC` with `Rd  `/`Grn `/`Bl  ` doubles and no `colorModel` — possible silent no-op or coerced fallback to a less-precise matching algorithm. Tool stays at dev tier pending live verification per the dev-default-then-promote gate.
- **`photoshop_apply_layer_mask`** — migrated from the legacy top-level `Aply` event to the modern captured form `Dlt Chnl + Aply: true` boolean. Both forms reach the same end state on PS 27.x; the captured form locks in the modern dispatch and inoculates against a future PS deprecating the standalone `Aply` event.

### Changed

- **Layer styles emit the full UI-captured descriptor.** Optional fields the PS UI exposes are now included at PS defaults so the emitted layer style matches what PS would write from the menu.
  - Tool affected: `photoshop_add_layer_style` (drop_shadow, stroke, outer_glow variants)
  - Adds `present`, `showInDialog`, `layerConceals`, `overprint` at PS-default values
  - Public input schema is unchanged — pure descriptor completeness

#### Dev-tier refinements (excluded from CE + Pro shipped bundles)

- **`photoshop_apply_lens_blur` tool description** is now honest about the depth-map limitation: the `depth_source` / `focal_distance` / `invert_depth` parameters echo to the result payload but do not vary the emitted Photoshop descriptor. Depth-map-driven blur is pending a second ScriptListener capture before promotion; until then, the captured `BeIt` / `BeCm` defaults always emit and the filter runs against the layer's full alpha.
- **`photoshop_apply_lens_blur` iris_shape parameter** is now strict — unknown values throw a clear error instead of silently falling back to `hexagon`.

---

## [0.3.1] — 2026-06-03

PATCH bump for cross-repo changelog sync infrastructure. No user-visible
behavior changes; the public CE changelog and the landing-page changelog
cards are now auto-generated from this file.

---

## [0.3.0] — 2026-06-03

**Structured versioning starts here.** This release rolls up ~45 commits
of accumulated work since the v0.2.0 placeholder into a single coherent
baseline. Going forward, every commit that changes user-visible behavior
(or fixes a user-visible bug) bumps version + appends to this file.

The npm `editmamei` package still publishes the `0.0.0-placeholder` stub
reserving the name. The first user-installable release lands at v1.0.0
(no public `0.3.0` tarball — this is a private-source-repo milestone).

### Added

#### New tools

- `photoshop_overview` — orientation brief returning workflow contract,
  capabilities map, verification primitives, escape-hatch policy, known
  gaps. CE tier, read-only, no Photoshop call. Reference from
  `photoshop_ping` description hits at session boot.
- `photoshop_get_layer_bounds_diff` — verification primitive returning
  a one-word verdict ("aligned" / "shifted right" / "layer too small")
  plus numeric deltas for placement-accuracy checks.
- `photoshop_compare_regions` — per-channel histogram stats for two
  rectangles. Single-pixel sampling via 1×1 rect.
- `photoshop_get_histogram` (Pro) — full-image or per-channel histogram
  with bin counts + mean + stdev + median.

#### New tools landing as `'dev'` tier (excluded from CE + Pro shipped bundles)

- `photoshop_apply_shadows_highlights` — destructive S/H wrapped in the
  auto-duplicate-first pattern.
- `photoshop_apply_lens_blur` — realistic depth-of-field blur with iris
  shape + specular + noise + depth-source control.
- `photoshop_apply_smart_sharpen` — modern detail-aware sharpening with
  three blur-removal modes + per-tonal-region fade.
- `photoshop_apply_reduce_noise` — luminance + color noise + sharpen +
  JPEG-artifact removal with optional per-channel control.
- `photoshop_apply_high_pass` — edge-detail extraction for advanced
  sharpening + dodge-and-burn masking.
- `photoshop_apply_color_lookup` — destructive bake form of Color Lookup
  adjustment (non-destructive AdjL form known blocked at the PS
  scripting layer; see [docs/20260603-color-lookup-limitation.md](docs/20260603-color-lookup-limitation.md)).
- `photoshop_apply_equalize` — Image > Adjustments > Equalize.

#### New `add_adjustment_layer` types

- Black & White, Color Balance, Photo Filter, Vibrance, Channel Mixer,
  Selective Color, Gradient Map.
- Exposure, Color Lookup (3DLUT), Invert.
- Posterize, Threshold.

### Changed

- **Auto-duplicate-first pattern for destructive filters.** Every
  filter runs on a copy of the active layer by default. Original is
  preserved; result payload carries `target_was_copy` /
  `target_layer_name` / `original_layer_name`. Pass
  `apply_to_active_layer: true` to bake into the original.
- **Background-layer auto-promote** on `photoshop_move_layer`,
  `photoshop_rotate_layer`, `photoshop_scale_layer`. Returns
  `background_promoted: true` so callers see the side effect; no more
  duplicate-then-transform dance.
- **`photoshop_move_layer` three positioning modes** — relative
  `delta_*` (original), absolute `absolute_*` (target bounds top-left),
  or `center_on_*` (target bounds center). Exactly one pair per call;
  mixing modes returns a validation error.
- **`photoshop_get_preview` annotations.** Optional `annotations` array
  overlays rectangles (by explicit bounds OR by layer name), guides,
  points, or selection markers on the preview. 90s timeout when
  annotations are present. Defensive cleanup of stale `__mcp_preview__`
  duplicate documents on each call.
- **`photoshop_list_actions` text content** now enumerates every set
  name and action name verbatim, quoted, so the LLM can copy strings
  directly into `photoshop_play_action` (pre-fix the response was just
  a count summary; names lived only in `structuredContent`).
- **`photoshop_ping` discovery signals** — now returns `version`
  (absorbs the removed `photoshop_get_version`), `custom_action_sets`,
  `user_templates`, and `open_documents` for session-start orientation.
  Description nudges the LLM to call `photoshop_overview` on
  open-ended tasks.
- **`photoshop_execute_script` moved CE → Pro.** Escape hatch is now
  Pro-tier only.
- **Tool descriptions tightened** for `photoshop_create_layer_mask`
  (leads with the frame-opening use case + tells the LLM not to write
  `Mk Chnl` AM scripts), `photoshop_compare_regions` (three "Reach for
  this when" scenarios), `photoshop_get_histogram` (clipping detection +
  exposure verification + neutral-gray + op-confirmation scenarios).
- **Tier system extended.** `'dev'` and `'none'` tiers added alongside
  `'community'` / `'pro'`. New tools default to `'dev'` until live-PS
  verification; promoted in the same commit as the verification
  record. See [docs/20260603-tool-tier-process.md](docs/20260603-tool-tier-process.md).
- **9 tools demoted to `'dev'`** —
  `photoshop_apply_color_lookup`, `_apply_lens_blur`,
  `_select_color_range`, `_create_layer_mask`,
  `_apply_shadows_highlights`, `_apply_smart_sharpen`,
  `_apply_reduce_noise`, `_apply_high_pass`, `_apply_equalize`. None
  has a confirmed working live invocation post-rewrite; promotion path
  requires a captured session-log success.

### Fixed

- **`photoshop_get_preview` with annotations failed on PS 27.x** —
  `selection.stroke()` raised "no tool called stroke"; fill on empty
  overlay layers raised "command 'fill' not available." Replaced
  stroke with 4-edge filled rectangles. Flatten the duplicate before
  drawing so fills land on pixel content.
- **`sTID is not a function` runtime error in 5 filter snippets** —
  `applyShadowsHighlights`, `applyLensBlur`, `applySmartSharpen`,
  `applyReduceNoise`, `applyHighPass` used the `sTID(...)` helper
  without ever interpolating `${helperFunctions}`. A guard test now
  fails the build if any snippet calls `sTID` / `cTID` without bringing
  the helpers into scope.
- **`photoshop_add_adjustment_layer` type=color_lookup on PS 27.x** —
  legacy `lookupType` enum + `name` string + `dither` enum descriptor
  returned "General Photoshop error." Rewrote 3DLUT path to use
  `LUT3DFileName` + boolean `dither`. Abstract / device_link branches
  preserve legacy emission (unverified). Subsequent Bundle S iterations
  (S.1 / S.2 / S.3 / S.4) eventually documented the AdjL form as
  unsupportable in current PS scripting and introduced an experimental
  BAKE form behind the `'dev'` tier.
- **`photoshop_list_actions` returned empty names on PS 27.x** —
  `charIDToTypeID('Nm  ')` no longer dispatches to the descriptor's
  name field. New fallback chain: `stringIDToTypeID('name')` →
  `charIDToTypeID('Nm  ')` → key-scan for any STRINGTYPE matching
  `/name/i`. Unresolved names surface as `(unnamed *)`.
- **Shadows/Highlights + Reduce Noise event IDs were forum-lore-wrong on
  PS 27.x.** ScriptListener capture on macOS PS v27.7.0 confirmed event
  IDs changed (`shadowHighlight` → `adaptCorrect`, `reduceNoise` →
  `denoise`), descriptor structures restructured (flat keys → nested
  sub-descriptors), types corrected (integer → unitDouble percentUnit
  for amount/width), key names corrected (`midtoneContrast` → `center`,
  `sharpenDetails` → `sharpen`, `jpegArtifact` → `removeJPEGArtifact`).
  The "preserve Adobe's typo `Raduis`" comment in the codebase was
  load-bearing fiction — the actual key is `radius`. Removed.
- **Four AM-descriptor corrections from ScriptListener audit** — fixes
  to `selective_color`, `channel_mixer`, shadows/highlights root-key
  shape, and one other path that had drifted from current PS dispatch.
- **PS 27.x cross-platform regressions** — `levels` and `curves`
  `Mk-with-values` rejected with generic "program error" → rewrote as
  bare `Mk` + post-`Mk` `setd T=Lvls` / `T=Crv ` with verified
  descriptor shapes. `Hst2` (not legacy `Hsrt`) for master Hue/Sat
  entries. em-dash normalization in group-name lookup. macOS top-level
  `return` mangling in custom scripts.
- **Layer-mask descriptor** + `EACCES` fallback for `TempDir` after
  prior `sudo` sessions leaked `TMPDIR`.
- **Platform resilience hardening** — timeout cleanup; modal-state
  detection; richer "PS modal dialog open" diagnostic on the kill-on-
  overflow path.
- **Three ExtendScript P1s from the 2026-05-30 launch-readiness
  review.**

### Security

- **NDJSON session telemetry hardened** — string args >2048 chars
  truncated with `…[truncated:N→M]` marker (configurable via
  `SessionLog.maxArgStringLen`, default 2048, 0 disables); schema_version
  field; structured warning surfacing on degraded states. `LOG_SCRIPT_ON_ERROR=1`
  prints a one-shot WARN so the env oddity is visible.

---

## [0.2.0] — 2026-05

Placeholder release reserving the `editmamei` (unscoped) and
`@editmamei/placeholder` npm package names. Ships a "Coming Soon" stub
only. Not installable for end-user editing.

The full editing surface, Templates system, CE/Pro build pipeline, and
license activation flow land in v1.0.0.

---

[Unreleased]: https://github.com/editmamei/editmamei-ce/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.0
[0.4.3]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.3
[0.4.2]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.2
[0.4.1]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.1
[0.4.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.0
[0.3.1]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.3.1
[0.3.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.3.0
[0.2.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.2.0
