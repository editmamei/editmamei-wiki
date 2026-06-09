# Changelog

All notable changes to Editmamei are documented here. This file mirrors the changelog from the private source repo, scoped to user-facing changes (internal process notes are stripped).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

(Empty — next commit appends here.)

---

## [0.5.7] — 2026-06-08

PATCH bump for the real `photoshop_create_layer_mask` fix on macOS. v0.5.4 rolled back the channel-state optimization on the assumption that channel pollution was the cause; v0.5.6 cleaned up surrounding workflow guidance. A 2026-06-08 Mac session NDJSON proved both were red herrings — the mask call still failed three times in a row, including once with NO active selection (which rules out anything channel-related). Root cause was a real descriptor-shape bug that Windows tolerated and macOS rejected.

### Fixed

- **Mask creation works on macOS.** The mask-creation snippet was sending the AM descriptor's `At` slot as a bare enumerated value (`putEnumerated` directly on the descriptor) when the captured spec for Layer > Layer Mask requires it to be an `ActionReference` containing the enumerated chain. Windows Photoshop accepted the bare-enumerated form leniently, so the bug shipped through every audit pass; macOS Photoshop strictly enforces the spec and rejected with the generic "command Make not currently available" error. The snippet now builds a proper ActionReference for the `At` slot, matching the captured ground truth exactly.
  - Tool fixed: `photoshop_create_layer_mask`
  - The 2026-06-08 Mac session reproduced this three times in a row — failing once after a feathered selection / blur chain, again after `select_layer` re-anchored the target, and a *third* time after `deselect` (which proved the bug wasn't selection or channel state)
  - Companion spec at `src/spec/ps27/masks/create-reveal-all.ts` already declared `At` as `kind: 'reference'`; the snippet just didn't match
  - Regression guards added at `tests/tools/selection-tools.test.ts`: a `.not.toMatch` against the bare-`putEnumerated` form, plus positive assertions on the new `ActionReference` shape (`atRef.putEnumerated(cTID('Chnl'), cTID('Chnl'), cTID('Msk '))` and `desc.putReference(cTID('At  '), atRef)`)

---

## [0.5.6] — 2026-06-08

PATCH bump closing a leak where the orientation skill and the overview tool referenced features the user couldn't actually invoke. CE sessions could read prose telling the LLM about Pro-only tools (Sensei selections, action playback, layer transforms, template authoring, the escape hatch) or dev-tier filters that don't ship in CE OR Pro — making the product feel limited and inviting the LLM to try tools that aren't there. Same change pulls the discovery chain (ping → overview → `tools/list`) into both surfaces so the LLM has a repeatable session-start orientation it can rely on every time.

### Fixed

- **Workflow guidance no longer references features the user can't reach.** The orientation skill and the overview tool are now tier-agnostic — they describe the workflow and the inventory comes from `tools/list`. CE sessions stop reading prose about Pro-only tools they don't have; the product feels complete instead of limited.
  - Surfaces affected: the Editmamei skill (`skills/editmamei/SKILL.md`, uploaded by users to claude.ai) and the overview tool's static markdown body (returned by `photoshop_overview`).
  - Skill body: stripped the entire "Tier awareness" section and "(Pro-tier workflow)" qualifier on Templates; reframed the escape-hatch section as "When typed tools aren't enough" without naming a specific tool; rewrote Templates discussion to defer specific tool names to `tools/list`.
  - Overview markdown: removed `(Pro)` markers from `subject` / `sky` / `get_histogram` / `execute_script` / Templates / Actions; deleted the "Actions" capability section and the "AM event verification status" maintainer note (the latter referenced dev-tier filter names that don't ship in CE or Pro); narrowed the Filters capability list to community-tier filters only; rewrote the escape-hatch section as "When typed tools aren't enough."
  - Discovery chain made explicit in both surfaces: `photoshop_ping` (liveness) → `photoshop_overview` (workflow) → `tools/list` (inventory). New section in the skill walks the LLM through it; the overview's intro paragraph anchors it. This addresses a separate failure mode where sessions didn't consistently invoke the discovery primitives at start and worked from partial mental models.
  - Companion fix: `photoshop_get_histogram` is community tier per `src/core/tool-tiers.ts`, but both the skill body and the overview labelled it as Pro. Wording corrected in both places.
- **The orientation overview no longer leaks dev-tier filter names that aren't in any shipped bundle.** Five filter operations sit at `'dev'` tier (excluded from CE AND Pro shipped bundles per the dev-default-then-promote gate) but the overview's capability map and "AM event verification status" section listed them by name as if they were available. The LLM driving a real session would never see those tools in `tools/list`, so the prose was at best confusing and at worst invited failed tool calls.

---

## [0.5.5] — 2026-06-08

PATCH bump for a macOS-specific get_preview failure surfaced in the same 2026-06-08 session that drove v0.5.4. Photoshop's saveAs to `/tmp` paths on macOS sometimes returns success without actually writing the file (sandbox / symlink quirk), producing a confusing `ENOENT: no such file or directory` error on the handler side that looks like an Editmamei bug but is actually a PS-side silent failure.

### Fixed

- **Previews are reliable on macOS again.** Two preview calls in the same Mac session failed with an ENOENT error on the temp file under `/tmp`, while other previews in the same session worked. The script claimed success but no file was written — Photoshop's saveAs to paths under `/tmp` on macOS sometimes silently no-ops (the path is subject to sandbox redirection / symlink resolution). The preview handler now uses a user-owned cache directory (`~/Library/Caches/editmamei/tmp`) instead of the OS temp root on macOS. Windows and Linux are unchanged.
  - Tool fixed: `photoshop_get_preview`
  - Mac handler path now resolves through the existing `userOwnedTempRoot()` helper instead of `tmpdir()`
  - The snippet also gained a defensive `outFile.exists` check immediately after the saveAs call — if Photoshop reports success but the file isn't actually there, the tool now throws an explicit, diagnosable error naming the exact path PS claimed to write to (instead of a cryptic ENOENT surfacing on the Node side)

---

## [0.5.4] — 2026-06-08

PATCH bump rolling back the v0.5.3 cosmetic optimization in `restoreCompositeChannel` after a macOS PS 27.7 session reproduced the exact bug class v0.5.2 was supposed to close. The optimization saved one undo-history entry per selection-tool call and reintroduced the bug it was protecting against. Trade was wrong.

### Fixed

- **Mask creation no longer fails after a chain of selection tools on macOS Photoshop 27.7.** A fresh-install v0.5.3 Mac session reproduced the original v0.5.2 bug class: the first mask creation in a session worked, but a second attempt after multiple selection tool calls failed with the "command Make not currently available" error. v0.5.3 had added a length-equality short-circuit to skip the channel-restore AM event when the active set was supposedly already on composite — but on macOS the check false-positived after the temp-channel cleanup, so the restore never fired and pollution compounded across the chain. v0.5.4 fires the channel-restore AM event unconditionally, matching v0.5.2 behaviour. The trade-off — one cosmetic "Select RGB Channel" undo entry per selection-tool call — is a small cost; the regression was not.
  - Tool fixed: `photoshop_create_layer_mask`
  - Tools that now correctly restore channel state on cleanup: every selection tool (`photoshop_select_subject`, `photoshop_select_sky`, `photoshop_select_color_range`, `photoshop_magic_wand`, `photoshop_select_rectangle`, `photoshop_invert_selection`, `photoshop_feather_selection`, `photoshop_select_all`, `photoshop_deselect`, `photoshop_get_selection_info`), `photoshop_get_selection_preview`, and the adjustment-layer branch of `photoshop_create_layer_mask` — they all run through the shared `restoreCompositeChannel(doc)` helper
  - Verified by NDJSON: the failing session's tool sequence shows the first `create_layer_mask` succeeding (one selection-tool ahead) and the second failing (four selection-tools chained ahead) — a textbook compounding-pollution signature
  - The previously-tracked file path `/tmp/editmamei-preview-XXX/preview.jpg` failures from the same session are a separate issue (the preview snippet's saveAs-then-readFile sequence) and tracked as a follow-up; they are unrelated to channel state

---

## [0.5.3] — 2026-06-07

PATCH bump bundling three changes. Two close out the v0.5.2 channel-pollution audit: the bug class also leaks on the early-exit throw paths of every smart-selection tool, AND the helper that fixes it adds a redundant undo entry on the common case. One adds a long-missing tool the LLM kept burning escape-hatch attempts trying to write by hand.

### Fixed

- **Smart selection tools no longer leave the document on a non-composite channel when they fail.** v0.5.2 fixed the normal-return path; an audit follow-up found the same bug class on every smart-selection tool's *failure* path. When Select Subject fails because the Sensei model is unavailable, or Select Sky completes but finds no sky, or Magic Wand throws on a degenerate sample point, the snippet would throw without restoring composite — and the next `photoshop_create_layer_mask` call would inherit the broken state. Every early-exit throw path in the four affected tools now restores composite before throwing.
  - Tools fixed: `photoshop_select_subject`, `photoshop_select_sky`, `photoshop_select_color_range`, `photoshop_magic_wand`
  - Six early-exit sites patched in total (two each in subject + sky, one each in color range + wand)
  - The shared `selectionTypeHelpers` JSDoc now documents the contract so future selection tools using the helper block get the rule

### Added

- **Stamp Visible — the Ctrl+Alt+Shift+E shortcut as a first-class tool.** Merges all currently-visible layers into a NEW layer placed above the active layer, leaving the originals untouched. The canonical "final tweak step" at the end of a grade: apply output sharpening, grain, contrast, or any filter to the stamped layer without touching the underlying adjustment stack. The user can A/B by toggling the stamp visible/hidden. The 2026-06-06 full-tool demo session burned multiple escape-hatch attempts trying to write this descriptor by hand; the canonical recipe now ships as a single tool call.
  - New tool: `photoshop_stamp_visible`
  - Lands at the `'dev'` tier per the dev-default-then-promote policy. The AM dispatch (`MrgV` event with `Dplc: true`) is the standard PS scripting recipe, but not yet pinned against a fresh ScriptListener capture against PS 27.x. Promote to `'community'` after a successful live invocation is logged.
  - Distinct from `photoshop_merge_visible_layers` which is the destructive variant — prefer `stamp_visible` when the goal is to build on top of the current composite rather than collapse it

### Changed

- **`restoreCompositeChannel` no longer adds a redundant "Select RGB Channel" undo entry on the common case.** A QA finding on v0.5.2 noted that the channel-restore helper was firing the `slct` AM event unconditionally — adding a cosmetic history entry every time a selection tool finished, even when Photoshop had already fallen back to composite on its own. The helper now checks whether the active channels already match the document's composite (length equality on `doc.activeChannels` vs `doc.componentChannels`) and short-circuits when restoration isn't needed. The AM event still fires when composite is genuinely not active, so the original bug fix remains in place.
  - Helper changed: `restoreCompositeChannel(doc)` in `src/api/extendscript.ts`

---

## [0.5.2] — 2026-06-07

PATCH bump for a runtime regression in `photoshop_create_layer_mask`. The 2026-06-07 live A/B session caught it failing with `"command 'Make' is not currently available"` after a canonical subject-isolation flow (`duplicate_layer` → `select_subject` → `get_selection_preview` → `feather_selection` → `create_layer_mask`). Spec-library audit had verified the descriptor in isolation; this surfaced the *interaction* with state polluted by prior tools in the flow.

### Fixed

- **Mask creation now works after smart-selection and selection-preview steps.** A canonical "isolate the subject" flow (smart selection → review the selection → feather it → make a mask) was failing on the final step with a generic Photoshop error. The cause: every selection-info read and preview render created a temporary alpha channel for measurement, removed it on the way out, but never reset the active channel back to the document composite. Subsequent operations that require the composite channel (most notably mask creation) then failed for what looked like an unrelated reason. Composite is now restored automatically by every tool that stashes a temporary channel.
  - Tool fixed: `photoshop_create_layer_mask`
  - Root cause was in `getSelectionInfo` (inlined at the end of every selection-tool return — `select_subject`, `select_sky`, `select_rectangle`, `magic_wand`, `color_range`, `feather_selection`, `invert_selection`, `select_all`, `deselect`, `get_selection_info`, `get_selection_preview`) and in `get_selection_preview`'s own preview render. Both call `doc.channels.add()` to stash the selection for measurement
  - PS makes the new alpha channel the active channel; removing the channel later does not reliably restore composite, leaving the document on an indeterminate channel
  - The `Mk Chnl At=Msk` AM event (what `create_layer_mask` dispatches) requires composite as the active channel, so it then rejected with `"command 'Make' is not currently available"`
  - The descriptor itself was verified against ScriptListener ground truth in the 2026-06-04 Group D audit — the audit caught descriptor shape but did not exercise interactions with state-polluting predecessors, which is what this fix closes

---

## [0.5.1] — 2026-06-07

PATCH bump from the 2026-06-07 deep code audit. The LLM-facing tool surface (names, schemas, descriptions) is unchanged; every change is runtime hardening, observability, or a defensive guard inside `src/`. Eighteen audit findings are addressed in this release — eleven runtime fixes plus seven new test files closing coverage gaps on security-critical helpers (validator, JSX escapes, Pro-tier tool factories, the AM spec registry).

### Fixed

- **Server reports the actual package version over MCP.** The MCP server identified itself as `0.2.0` during `initialize` regardless of which release was running; clients logged the stale value in support bundles. The version is now sourced from a single constant pinned against `package.json` by a startup-time test, so a future release bump that misses one of the two files fails the test suite before it ships.
  - Source of truth: `src/version.ts`; drift guard: `tests/integration/version.test.ts`
  - Replaces the hardcoded `'0.2.0'` in `src/core/server.ts`
- **MCP-config writes are now atomic.** `editmamei install` writes `claude_desktop_config.json` and `~/.cursor/mcp.json` via a tmpfile + rename so a crash mid-write can no longer leave a zero-byte or partial config. A second install run finds no `.bak` to restore from because `backupConfigIfFirstRun` only fires once, so a half-written file was previously unrecoverable.
  - `writeJsonMcpConfig` in `src/cli/clients/json-config.ts` now mirrors the tmp+rename pattern used by the Pro→CE stub swap in `scripts/lib/build-common.ts`
- **`LOG_LEVEL` accepts symbolic names instead of silently swallowing every log.** The previous parser called `parseInt(env, 10)` raw — `LOG_LEVEL=debug` returned `NaN`, every log dropped, and users assumed Editmamei was frozen. The new parser accepts both numeric (`0`..`3`) and symbolic (`DEBUG`/`INFO`/`WARN`/`WARNING`/`ERROR`, case-insensitive); unrecognized values fall back to the constructor default with no silent drop.
  - `parseLogLevel` exported from `src/utils/logger.ts`
- **`editmamei install` no longer fails on Linux before the router runs.** Constructing a `Session` eagerly built a `PhotoshopConnection`, whose constructor throws on unsupported platforms. CLI subcommands that don't need a live Photoshop (`install`, `uninstall`, `status`) now reach the router before the platform check fires. Tool calls still throw the same actionable error if Photoshop isn't available at first use.
  - `Session.connection` is now lazy-constructed via `ensureConnection()` in `src/core/session.ts`
- **Ping now reports which discovery signals degraded.** The session-start liveness check previously mixed defaulted-zero values (action sets, open documents) with real reads, so a transient Photoshop hiccup mid-snippet produced an authoritative-looking "0 action sets" response with no signal to the caller. A new `degraded` array on the structured response names the signals that fell back, and the human-readable text carries the same in parens.
  - `photoshop_ping` in `src/core/server.ts` `pingPhotoshop` now collects and surfaces a degraded list (`'pingState'` / `'templates'`)
  - Output schema gains a `degraded` array (additive — no breaking change for existing callers)
- **Document creation fails loudly when the colorMode map and schema enum drift apart.** The handler previously fell back to RGB silently when the input-schema enum and the internal mapping disagreed; a future enum extension that forgot the map entry would produce RGB documents for, say, `Lab`. The handler now throws an explicit drift error so the gap surfaces at first call instead of producing wrong output.
  - `photoshop_create_document` in `src/tools/document-tools.ts`
- **Windows CLSID detector strips surrounding quotes correctly.** The legacy regex required a closing `"` inside a substring that the greedy `.+\.exe` capture had already truncated; the strip silently no-op'd, leaving a leading `"` in the captured path. `checkPath` covered for it by re-stripping defensively, but the primary parser is now correct. A test pinned the buggy behavior as "known limitation" — that test is now updated to assert correct behavior, and two additional shape variants (quoted-no-args, unquoted-with-args) are pinned alongside.
  - `extractPathFromCLSID` in `src/platform/windows-detector.ts`
  - `tests/platform/windows-detector.test.ts`

### Security

- **Prototype-pollution guard on every tool input.** `validateArgs` previously passed every non-schema key through to its output object unchanged. An arguments bag with a `__proto__` (or `constructor` / `prototype`) key would set the output's prototype rather than landing as an own property; downstream code that spread, iterated, or property-checked the args could pick up the polluted prototype as an inherited property. The MCP client is trusted, but the trust boundary should not be the only thing standing between a polluted bag and a handler. These three keys are now dropped unconditionally on both the top-level pass-through and the nested-object validation path.
  - `src/utils/validate.ts` — new `POLLUTION_KEYS` set, filtered at both pass-through points
  - Adversarial-input coverage: `tests/unit/validate.test.ts` (top-level and nested-object pollution attempts)
- **macOS executor app-name deny-list now covers all AppleScript string-literal breakers.** `\r` (classic-Mac line ending) and `\t` (statement separator in some AppleScript contexts) are now rejected alongside the prior `"` / `\` / `\n` set so the interpolation site is closed for every breaker even though the value is server-controlled today.
  - `setAppName` in `src/platform/macos-executor.ts`
- **EXIF reader caps per-tag `count` at 64K entries before allocating.** The existing bounds check kept `count * typeSize <= buf.length` (256 KB) implicitly, but a 1-byte type with a 256 K count could still allocate a 256 K-entry array from a hostile or corrupted file. An explicit `MAX_TAG_COUNT` flat cap keeps the worst-case allocation predictable regardless of future buffer-size widening.
  - `src/utils/exif-reader.ts`

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

[Unreleased]: https://github.com/editmamei/editmamei-ce/compare/v0.5.7...HEAD
[0.5.7]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.7
[0.5.6]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.6
[0.5.5]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.5
[0.5.4]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.4
[0.5.3]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.3
[0.5.2]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.2
[0.5.1]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.1
[0.5.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.5.0
[0.4.3]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.3
[0.4.2]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.2
[0.4.1]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.1
[0.4.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.4.0
[0.3.1]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.3.1
[0.3.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.3.0
[0.2.0]: https://github.com/editmamei/editmamei-ce/releases/tag/v0.2.0
