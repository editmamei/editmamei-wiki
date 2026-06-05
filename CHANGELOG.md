# Changelog

All notable changes to Editmamei are documented here. This file mirrors the changelog from the private source repo, scoped to user-facing changes (internal process notes are stripped).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

(Empty — next commit appends here.)

---

## [0.4.1] — 2026-06-05

PATCH bump for one snippet-level silent-no-op bug in `photoshop_create_group`. The 2026-06-04 IMG_1022 session called `create_group(layers=["Warm — 81", "Curves — S-pop", "Vibrance", "Levels — contrast"])` and got back `moved_count: 1` — only `"Vibrance"` (the one name without an em-dash) matched. The other three landed in `not_found` silently because the snippet's `findLayerByName` used strict ASCII `===` instead of the `normNameHelper` dash-tolerant comparison the rest of the group/layer-lookup tools already use. Same class of bug as the original Bug I in `move_layer_to_group` (fixed 2026-05-29); the fix didn't propagate.

### Fixed

- **`photoshop_create_group` with a `layers` list** now matches layer names containing em-dash (U+2014), en-dash (U+2013), or other Unicode dash variants when the caller passes ASCII hyphen-minus (or vice versa), and folds case + collapses whitespace runs the same way `photoshop_move_layer_to_group` and `photoshop_select_layer` do. Names that previously fell into `not_found` silently now move into the group correctly.

---

## [0.4.0] — 2026-06-04

MINOR bump for the 2026-06-03 AM Descriptor Audit remediation pass: six HIGH-severity silent-no-op bug fixes in `src/api/extendscript.ts`, two new clipping-mask tools at `'dev'` tier, schema-completeness additions to several existing tools, and seven new snippet-vs-spec tests pinning the fixes against the V1 AM Event Library specs.

This is the "stop shipping fictional descriptors" release. Every fix is verified against PS 27.7.0 Windows ScriptListener ground truth captured 2026-06-03 and codified in the typed specs under `src/spec/ps27/`. The same test framework that proves these fixes will fail at PR-time if any future refactor silently reverts them.

### Added

- **`photoshop_create_clipping_mask`** and **`photoshop_release_clipping_mask`** (`'dev'` tier) — standalone primitives for clipping the active layer to the layer below (or releasing the clip). The clipping behavior previously lived only inline inside `photoshop_add_adjustment_layer`'s `clip_to_below` flag; standalone tools now cover the case where you want to clip any layer, not just an adjustment-layer being created. Dispatches the verified `groupEvent` / `ungroupEvent` stringIDs (aliased to `GrpL` / `Ungr` charIDs). Distinct from `photoshop_ungroup` which dissolves a LayerSet via the unrelated `ungroupLayersEvent`.
- **`photoshop_place_image`** gains optional `width_percent` and `height_percent` for non-uniform scale of the placed Smart Object. Omit to keep native size (matches PS UI default).
- **`photoshop_apply_shadows_highlights`** gains `black_clip` and `white_clip` parameters (PS dialog default `0.01` for both). Previously hardcoded; advanced users can now bias toward more contrast at the cost of detail in the extreme tones.

### Fixed

- **`photoshop_add_adjustment_layer` `type=levels`** — three silent-no-op drifts in the PS 27.x post-Mk `setd` workaround. Pre-audit emission used `putEnumerated` for the `Chnl` reference (PS wants `putReference` to the composite), separate `Inpt`+`Wht ` keys (PS wants ONE `Inpt` key holding a 2-int list `[black, white]`), and `putInteger(gamma * 100)` for the gamma value (PS wants `putDouble(gamma)`). User-set black/white/gamma values were silently dropped or coerced wrong. Same class of silent-no-op as the Bundle Q hotfix 5 bugs. Verified against `src/spec/ps27/adjustments/levels.ts`.
- **`photoshop_add_adjustment_layer` `type=invert`** — Mk path now uses `using.putClass(Type, Invr)` with no inner type descriptor, matching the captured PS UI form. Pre-audit emission used `putObject` with a `presetKindDefault` inner descriptor — silently coerced PS into an unexpected creation path.
- **`photoshop_apply_smart_sharpen`** — five simultaneous fixes against the 2026-06-03 capture: (1) sub-object class is `adaptCorrectTones` (no "ive" infix; the typo silently dropped both Shadows and Highlights tab params); (2) root `Amnt` and `noiseReduction` are `putUnitDouble` percentUnit (not `putInteger`); (3) sub-object outer keys are charID `sdwM`/`hglM` (not stringIDs `shadowMode`/`highlightMode`); (4) inner `Amnt`/`Wdth` are `putUnitDouble` percentUnit, inner `Rds ` stays `putInteger`; (5) `blur` key + `GsnB`/`LnsB`/`MtnB` enum values are charIDs. The shadows/highlights typo had been shipping completely broken since Bundle P.
- **`photoshop_apply_lens_blur`** — full rewrite from forum-lore stringIDs to the captured `Bokh` (Bokeh) charID event with the `Bk*`/`Bt*`/`Be*` family. Iris shape strings (`hexagon` etc.) map to numeric-suffixed `BeS3`-`BeS8`; noise distribution to `BeNu`/`BeNg`; radius and specular brightness use `putDouble`. The pre-audit snippet was complete CS6-era fiction — every stringID (`lensBlur`, `radius`, `irisShape`, `noiseDistribution`, `depthMap`, etc.) was wrong against PS 27.x. Verified against `src/spec/ps27/filters/lens-blur.ts`.
- **`photoshop_select_color_range`** (`'dev'` tier) — input sRGB now converted to CIE Lab via the standard sRGB D65 → Bradford → D50 → Lab pipeline before emission, and the descriptor uses `LbCl` (Lab Color) with `Lmnc`/`A   `/`B   ` doubles plus the previously-omitted `colorModel: 0` integer (selects the "sampled colors Lab" algorithm). Pre-audit snippet sent `RGBC` with `Rd  `/`Grn `/`Bl  ` doubles and no `colorModel` — possible silent no-op or coerced fallback to a less-precise matching algorithm. Tool stays at `'dev'` tier pending live verification per the dev-default-then-promote gate.
- **`photoshop_apply_layer_mask`** — migrated from the legacy top-level `Aply` event to the modern captured form `Dlt Chnl + Aply: true` boolean. Both forms reach the same end state on PS 27.x; the captured form locks in the modern dispatch and inoculates against a future PS deprecating the standalone `Aply` event.
- **`photoshop_add_layer_style` (`outer_glow`)** — `Inpr` (Range slider) is `putUnitDouble` percentUnit, NOT `putInteger`. Same type-drift class as the just-fixed Smart Sharpen `Amnt` — would have silently default-fallen back. Plus `ShdN` (shading noise) added as a required descriptor key alongside the existing `Inpr` slot.

### Changed

- **`photoshop_apply_lens_blur` tool description** is now honest about the depth-map limitation: the `depth_source` / `focal_distance` / `invert_depth` parameters echo to the result payload but do not vary the emitted Photoshop descriptor. Depth-map-driven blur is pending a second ScriptListener capture before promotion; until then, the captured `BeIt` / `BeCm` defaults always emit and the filter runs against the layer's full alpha.
- **`photoshop_apply_lens_blur` iris_shape parameter** is now strict — unknown values throw a clear error instead of silently falling back to `hexagon`.
- **`photoshop_add_layer_style`** (drop_shadow, stroke, outer_glow) emits the optional descriptor fields PS exposes in the UI capture (`present`, `showInDialog`, `layerConceals`, `overprint`) at PS defaults. The tool's public input schema is unchanged; the changes are descriptor completeness so the emitted layer-style matches what PS would write from the menu.

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

[Unreleased]: https://github.com/editmamei/editmamei-ce/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.1
[0.4.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.0
[0.3.1]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.3.1
[0.3.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.3.0
[0.2.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.2.0
