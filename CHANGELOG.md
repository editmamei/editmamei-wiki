# Changelog

All notable changes to Editmamei are documented here. This file mirrors the changelog from the private source repo, scoped to user-facing changes (internal process notes are stripped).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

(No user-facing changes pending — next commit appends here.)

---

## [0.18.0] — 2026-06-21

### Changed

- **The tool surface is now organized around what you want to do, not one tool per Photoshop command.** Twelve families of near-identical tools collapsed into single, mode-selected tools, so the assistant sees a much smaller, clearer menu (roughly 90 community tools down to ~50) — it picks the right tool more reliably, and one "always allow" approval now covers a whole family instead of each variant. Every capability and parameter is preserved; only the tool names changed.
  - Phase 1 of the tool-surface consolidation ([`docs/20260620-tool-surface-reorg-plan.md`](docs/20260620-tool-surface-reorg-plan.md)). The 12 new discriminated tools: `photoshop_apply_filter(type)` (was 13 separate `apply_*` blur/sharpen/noise/stylize filters), `photoshop_select(mode)` (rectangle / color_range / luminance_range / magic_wand / all / deselect / invert), `photoshop_set_layer(property)` (opacity / blend_mode / visibility / locked / rename), `photoshop_transform_layer(op)` (fit / scale / move / rotate / flip), `photoshop_set_text(property)` (font / color / alignment / content), `photoshop_apply_adjustment(type)` (shadows_highlights / equalize / color_lookup), `photoshop_retouch(method)` (content-aware fill / patch / move), `photoshop_merge(mode)` (merge-visible / stamp / flatten), `photoshop_layer_mask(op)` (create / delete / apply), `photoshop_modify_selection(op)` (feather / refine_edge), `photoshop_selection_channel(op)` (save / load), and `photoshop_export(format)` (jpeg / png).
  - Internals are unchanged: each consolidated tool validates against the same per-variant schema and dispatches to the same handler + ExtendScript snippet as before, so behavior, defaults, value ranges, auto-duplicate-first, background-auto-promote, and structured outputs are identical to the pre-consolidation tools.
  - Unchanged: `photoshop_add_adjustment_layer` (the non-destructive adjustment entry point), the read-only inspection tools, and the whole Pro surface (AI selection, templates, actions/scripting). The inspection-reader consolidation (`photoshop_inspect`) is a planned follow-up.

---

## [0.17.5] — 2026-06-20

### Fixed

- **Pro now unlocks on the one-click Claude Desktop install.** Pasting a Pro license key into the Claude Desktop extension settings now downloads and installs the Pro tools automatically — previously it activated the license but never fetched the module, so the paid tools never appeared on that install path (only the terminal activation route worked).
  - `maybeActivateFromEnv` now provisions the entitled module after activating, gated on entitled-and-not-installed so steady-state boots make no network call; non-fatal — a fetch failure leaves a valid license and the free surface and never blocks boot.

---

## [0.17.4] — 2026-06-19

(No user-facing changes pending — next commit appends here.)

---

## [0.17.3] — 2026-06-18

### Added

- **Telemetry controls in the Claude Desktop extension.** Claude Desktop users can now turn anonymous usage telemetry off — or sanitized diagnostics on — right from the extension settings, with no terminal needed.
  - New `.mcpb` `user_config` boolean toggles ("Share anonymous usage stats" opt-out / "Share error diagnostics" opt-in) injected as `EDITMAMEI_TELEMETRY_USAGE` / `_DIAGNOSTICS`; `applyTelemetryEnvOverrides` applies them at boot over `settings.json`. The `editmamei config` CLI / settings file stays the source of truth on the npm path.

### Changed

- **The license now grants free use.** The LICENSE was rewritten as a proper free-to-use proprietary license — it explicitly permits installing and using Editmamei at no charge for personal or commercial work, while reserving redistribution, modification, and reverse engineering, and keeping Pro behind a paid license.
  - Removed the unbacked "24-month → MIT" abandonment clause from the website license page; the LICENSE now ships inside the `.mcpb` bundle too, alongside the npm tarball.
- **Installs are now visible in telemetry.** Editmamei sends a one-time, content-free boot ping when it starts, so a fresh install is counted even before any edit runs.
  - New `session_start` event — the same content-free dimensions as the usage event (no tool name, no counts, no free text); the server folds it into the distinct-install rollup only. Follows the same usage opt-out as every Category A event.

---

## [0.17.2] — 2026-06-18

(No user-facing changes pending — next commit appends here.)

---

## [0.17.1] — 2026-06-18

(No user-facing changes pending — next commit appends here.)

---

## [0.17.0] — 2026-06-16

### Changed

- **Straightening and content-aware retouch are now free.** The layer-transform and content-aware retouch tools moved from Pro into the Community Edition — correcting a tilted phone photo and erasing a distraction are foundational fixes that belong in the free tier.
  - Promoted Pro → community: `photoshop_fit_layer_to_document`, `photoshop_scale_layer`, `photoshop_move_layer`, `photoshop_rotate_layer`, `photoshop_apply_content_aware_fill`, `photoshop_apply_patch`, `photoshop_apply_content_aware_move`.
  - CE users get rotation/straightening for the first time; previously the entire layer-transform family (and the `execute_script` fallback) was Pro, so CE had no way to straighten an image.
- **Templates are now a single Pro feature.** The whole reproducible-recipe surface — saving a look, listing, applying, verifying, and recalling templates — is Pro-tier; previously listing/applying/verifying/recalling were free while only authoring was paid.
  - Demoted community → pro: `photoshop_template_list`, `photoshop_template_apply`, `photoshop_template_verify`, `photoshop_template_recall` (joining the already-Pro `create_evidence` / `save` / `delete`).
  - Templates are the learning-loop / repeatability layer; bundling the whole surface as one paid feature matches how it's used.

---

## [0.16.4] — 2026-06-16

### Fixed

- **End-of-session telemetry now survives the app being closed or killed.** The v0.16.3 fix wasn't enough — live data confirmed the per-session summary still never arrived from macOS, because an in-process network upload simply can't finish in the moment the host tears the process down. Telemetry no longer relies on delivering at exit.
  - New durable outbox: anything not already delivered by the in-session periodic flush is written to `~/.editmamei/telemetry-outbox.ndjson` with a **synchronous** write (which completes even as the process dies), and the **next** server startup uploads it. The running session totals are also persisted incrementally, so the session summary is reconstructed on next startup even if the process is hard-killed (`SIGKILL`) before any shutdown handler runs.
  - Trade-off: the final batch + summary now arrive at the *start of the next session* rather than the end of the current one — for usage analytics that latency is irrelevant; reliable delivery is the point. A clean shutdown clears the session marker so a recovered summary and a clean one can never both be sent. Backlog respects current consent (dropped unsent if usage telemetry was turned off) and is bounded on disk. Still content-free.

---

## [0.16.3] — 2026-06-15

### Fixed

- **End-of-session telemetry now actually reaches the server when the app closes.** When a client (notably Claude Desktop on macOS) ends a session by closing the connection rather than sending a termination signal, the final batch and the per-session summary were being dropped — the process exited before the in-flight upload finished. Sessions now flush completely on close.
  - Root cause: the shutdown flush is triggered from two paths (transport close and the SIGINT/SIGTERM handler). A plain idempotency guard made the second path resolve instantly, so `process.exit(0)` ran while the first path's POST was still in flight. `TelemetryClient.shutdown()` now memoizes and returns the same in-flight promise, so every caller awaits the real flush; the in-flight request (with its 4 s timeout) keeps the event loop alive until the upload lands. Verified by a gated-transport regression test.
  - Symptom this fixes: `session_daily` rows never appearing (and the tail of `usage_daily`) for macOS installs, even though mid-session periodic batches arrived.

---

## [0.16.2] — 2026-06-15

### Changed

- **Telemetry endpoint updated to the renamed Worker hostname.** The telemetry Worker's `workers.dev` subdomain was rebranded, so the client's default destination is updated to match; 0.16.1's URL no longer resolves. (Still opt-out, content-free, `EDITMAMEI_TELEMETRY_URL` overrides.)
  - `DEFAULT_TELEMETRY_ENDPOINT` → `https://editmamei-telemetry-server.editmamei.workers.dev/v1/telemetry`.

---

## [0.16.1] — 2026-06-15

### Changed

- **Telemetry now points at the live endpoint.** The telemetry server is deployed, so the client's default destination is set to the running ingest Worker; anonymous content-free telemetry (still opt-out, unchanged) now actually reaches it.
  - `DEFAULT_TELEMETRY_ENDPOINT` set to the deployed Worker's `workers.dev` hostname (`EDITMAMEI_TELEMETRY_URL` still overrides). The cleaner `telemetry.editmamei.com` custom domain awaits moving `editmamei.com`'s DNS to Cloudflare (the site is on GitHub Pages today); it's a one-line switch when that happens.

---

## [0.16.0] — 2026-06-15

### Added

- **Anonymous, content-free usage telemetry — on by default, easy to turn off.** Editmamei now reports which tools you use, whether they succeed, and how long they take, so a solo maintainer can see what's breaking in the field instead of guessing. It never sends image content, file paths, or personal data — only counts and outcomes.
  - New `src/telemetry/` client: batches content-free `usage` + `session_summary` events (Category A, opt-out) and, when you opt in, sanitized `diagnostic` detail (Category B). Sent fire-and-forget to the telemetry Worker; a failure never blocks or breaks a tool call.
  - Privacy is enforced structurally: events carry only declared dimensions (tool, success, duration, version/edition/OS/PS-version) and every diagnostic message is sanitized (paths → basenames, home dir redacted) before send. The client mirrors the server's path guard and drops anything still path-shaped.
  - Inert in local dev and under the test runner — only CE/Pro builds send.
- **`editmamei config` CLI.** Get/set/list settings in `~/.editmamei/settings.json` (the single source of truth). `editmamei config set telemetry.usage false` opts out; `telemetry.diagnostics true` opts in to diagnostic detail.
- **First-run disclosure.** On the run that creates `settings.json`, Editmamei plainly states what telemetry collects, the content-never guarantee, and how to opt out.

### Changed

- **Graceful shutdown.** The server now flushes a final telemetry batch + session summary on transport close and on SIGINT/SIGTERM, instead of relying on abrupt process termination.

---

## [0.15.0] — 2026-06-15

### Added

- **LUT-based color grading is now available.** Apply any 3DLUT preset (the film-stock looks Photoshop ships, or your own `.cube`/`.3dl`/`.look` file) as a baked color grade, live-verified against Photoshop 2026.
  - `photoshop_apply_color_lookup` promoted dev → community after live verification (session `2026-06-15T01-59-38Z-2f18`, Windows PS 27.2.0). Runs on a duplicate by default so the original is preserved. The non-destructive adjustment-layer form still can't load a LUT via scripting, so this bake is the only working LUT path.

### Fixed

- **Color grading presets with spaces or parentheses in their names now resolve.** Bundled looks like "Kodak 5205 Fuji 3510 (by Adobe).cube" previously reported "LUT not found" even though the file was installed.
  - Root cause: ExtendScript's `Folder.getFiles()` returns URI-encoded names (spaces → `%20`, `(` → `%28`), so the literal leaf name never matched. Fixed with `decodeURI` before comparison.

#### Fixes to dev-tier tools (excluded from CE + Pro shipped bundles)

- **Brush strokes no longer fail when setting brush size.** `photoshop_apply_brush_stroke` threw "command Set is not currently available" because no brush-family tool was the active tool when the size descriptor ran. The snippet now activates `paintbrushTool` (the brush tip is a shared resource) before sizing and restores the prior tool afterward. Live-verified for basic brush, dodge-with-dynamics, and clone-stamp-with-source. The tool stays at dev pending its move to the Pro edition.

---

## [0.14.0] — 2026-06-15

### Added

- **Four new editing tools graduate to the shipped surface.** Color-range selection, photographic lens blur, clipping masks, and Smart Object conversion are now available in both Community and Pro after live verification against Photoshop 2026.
  - `photoshop_select_color_range` — selects all pixels matching a target RGB color within a fuzziness threshold (Select > Color Range). The prior failure ("`selectColorRange` is not a function") was fixed by an ActionManager rewrite (`ClrR` with Lab-converted color objects); verified live in session `2026-06-15T00-57-50Z-b245` (Windows, PS 27.2.0).
  - `photoshop_apply_lens_blur` — realistic depth-of-field with iris-shape, specular-bokeh, and noise controls; runs on a duplicate by default. The v0.7.0 hang that held it back did not reproduce on a clean run.
  - `photoshop_create_clipping_mask` — clips the active layer to the layer below as a non-destructive alpha source (Layer > Create Clipping Mask).
  - `photoshop_convert_to_smart_object` — wraps the active layer so subsequent filters become editable Smart Filters; inverse of rasterize.

---

## [0.13.1] — 2026-06-14

### Fixed

- **Slow operations on large images no longer time out prematurely.** Selection channel save/load, Select Subject, and Select Sky now use a 120-second per-tool timeout instead of the blanket 30-second default, so working on high-resolution files (12MP+ cameras) no longer produces "Script execution timeout" errors.
  - `photoshop_save_selection_to_channel` — 120 s (was 30 s); `selection.store()` on a 45MP RAW can exceed 60 s
  - `photoshop_load_selection_from_channel` — 120 s (was 30 s)
  - `photoshop_select_subject` — 120 s (was 30 s); AI inference time scales with layer count and image size
  - `photoshop_select_sky` — 120 s (was 30 s); same Sensei inference path

---

## [0.13.0] — 2026-06-14

### Added

- **Save and load selections to named alpha channels.** Two new tools let Claude checkpoint any selection — even an expensive Sensei/AI-generated one — and restore it by name later, including combination modes (add, subtract, intersect).
  - `photoshop_save_selection_to_channel` — stores the active selection into a named alpha channel (creates or overwrites); returns selection stats and whether the channel already existed.
  - `photoshop_load_selection_from_channel` — loads a saved channel back as an active selection with a configurable combine operation (replace / add / subtract / intersect), enabling multi-channel mask composition.

---

## [0.12.2] — 2026-06-14

### Changed

- **Skill guidance enriched with professional Photoshop layer stack discipline.** The bundled Claude skill now teaches the canonical 7-tier layer ordering and the non-destructive 50% gray Dodge & Burn method, baking in patterns that professionals follow reflexively.
  - New "Canonical layer stack" section: numbered stack order (Background → Retouching → Dodge & Burn → Global Tone → Color → Effects → Sharpening), explains the causal reasons for each position, recommends layer color label conventions for handoff
  - New "Dodge & Burn — the 50% gray method" section: three-call workflow (`create_layer` → `fill_layer` with `#808080` → `set_layer_blend_mode` to `soft light` or `overlay`), soft-light vs overlay trade-off, Overlay saturation-boost caveat and fix
  - Non-destructive principles: "Group by category" bullet updated to reference the canonical stack order; new "Never erase, always mask" rule; new "Sharpen last, blend Luminosity" rule

---

## [0.12.1] — 2026-06-14

### Fixed

- **Routine edits no longer stall on Photoshop's missing-font or color-profile prompts.** Those script-command dialogs are now suppressed for the duration of every operation, so they can't silently block the connection waiting for a click; your interactive Photoshop session is unchanged afterward.
  - The wrapper preamble forces `app.displayDialogs = DialogModes.NO` (captured and restored in `finally`, alongside the existing ruler/type-unit isolation), at the single `ExtendScriptPhotoshopAPI.executeScript` chokepoint so every tool inherits it
  - Layer A of the transport-resilience design (docs/20260614-resilience-error-handling-design.md). App/OS-level modals (linked-asset, "disk changed", license, GPU, rasterize) are out of scope here — they need the planned out-of-process modal watcher (Layer B)

---

## [0.12.0] — 2026-06-14

Three fixes from a 72-hour session-log review — each removes a wasted
round-trip or blind-iteration trap, not a crash.

### Changed

- **JPEG export quality now uses the familiar 0-100 scale.** The export-quality control accepts the same 0-100 values as Photoshop's "Save As" / JPEG dialog instead of the obscure 0-12 scripting scale, so a request for "quality 90" no longer fails.
  - `photoshop_export_jpeg` `quality` is now `0-100` (default 90), normalized internally to Photoshop's 0-12 `JPEGSaveOptions` scale (90→11, 100→12, 50→6, 0→0)
  - The result echoes the 0-100 value you passed and adds `quality_ps_scale` for the 0-12 value actually used
- **Saving a style template now reports every signature problem at once.** A single save lists all validation problems so they can be fixed in one edit, instead of surfacing one error per attempt.
  - `photoshop_template_save` signature validation collects all errors, with a cascade guard so one bad predicate `type` no longer sprays spurious "unknown key" noise
  - The `signature_content` description self-documents each predicate type's allowed keys, built from the validator's source-of-truth maps so it cannot drift

### Fixed

- **Empty Photoshop errors now carry an actionable message.** When Photoshop fails with no message (often after a prior modal or timeout left it stuck), tools no longer surface a blank trailer like "Error selecting layer: " — a synthetic explanation with a recovery hint is substituted for every tool.
  - The substitution lives at the single `ExtendScriptPhotoshopAPI.executeScript` chokepoint (covers Windows + macOS + all current/future tools); `preview-tools`' local-only guard was removed in favor of it

---

## [0.11.6] — 2026-06-14

### Changed

- **Skill guidance improved: layer audit, tune-before-add, selection persistence, and co-working patterns.** The bundled Claude skill now includes four new workflow sections that codify lessons learned from real editing sessions.
  - Iterate step now requires a `photoshop_get_layer_tree` read before every refinement cycle to find existing layers that can be tuned rather than duplicated
  - New "Tune before add" section: explicit rule to increase opacity on an existing layer before spawning a new one targeting the same zone; add only when no existing layer can express the correction
  - New "Selection persistence" section: build the selection once and add all layers that share that mask while the selection is active; note parameters for later rebuild; script-execution escape hatch can save to a named channel for masks reused more than twice
  - New "Co-working" section: three patterns for when the user has touched the document — re-assess with `photoshop_get_layer_tree` + `photoshop_get_preview` before responding to any reported manual change, propose tuning before new layers on mid-edit feedback, integrate manual adjustments rather than overriding them
  - Group mandate strengthened from "4+ layers triggers grouping" to "group by category proactively, never exceed 3 ungrouped per category"

---

## [0.11.5] — 2026-06-13

Go sidecar **seal**: the ExtendScript snippet catalog + AM spec library no
longer ship as plaintext JavaScript. The hard-won descriptor IP now lives
ONLY in the encrypted `editmamei-core` binary.

### Security

- **Snippet descriptor IP is no longer shipped in readable JavaScript.** The `src/api/extendscript/*` snippet catalog and the `src/spec/*` AM Event Library (event IDs, descriptor keys, types) are excluded from the published bundle; the descriptor logic ships only inside the sealed, encrypted Go core. Verified: zero descriptor tokens (e.g. the content-aware-fill / hue-saturation / patch keys) appear anywhere in the shipped CE or Pro `dist/` JavaScript. CE bundle unpacked size dropped ~8.0 → 7.4 MB.

### Changed

- **Subject/sky-region template verification is now a Pro capability.** `photoshop_template_verify` (free) still checks global/tonal predicates; predicates scoped to the subject/sky/background regions need Sensei selection, which is Pro-gated in the Community core, so in CE they degrade cleanly to *skipped* with a "requires the Pro edition" reason (never failed).
  - The last in-process snippet callers were flipped to the core binary: the server's `pingState` liveness read and `template_verify`'s region-measurement reads (`getHistogram`/`deselect`/`invertSelection`/`selectSubject`/`selectSky`).

---

## [0.11.4] — 2026-06-13

Go sidecar Phase 3 **complete**: the last two Pro factories (action + retouch)
move onto the sealed core, so **all five** Pro factories now build through the
binary. Every Pro snippet's IP is excluded from the Community binary.

### Changed

- **Content-aware fill / patch / move now run through the sealed core binary on Pro.** Behavior unchanged (golden-verified byte-equivalent); the AM descriptors are produced by the compiled core instead of in-process JavaScript.
  - `photoshop_apply_content_aware_fill` / `photoshop_apply_patch` / `photoshop_apply_content_aware_move` handlers flipped to `snippetClient.build()`; `retouch-tools-pro` factory takes the `SnippetClient`.
- **List-actions and play-action now run through the sealed core binary on Pro.** The action-set enumeration and `doAction` dispatch are now produced by the compiled core.
  - `photoshop_list_actions` / `photoshop_play_action` handlers flipped to `snippetClient.build()`; `action-tools-pro` factory takes the `SnippetClient`.

---

## [0.11.3] — 2026-06-13

Go sidecar Phase 3 (cont.): the layer-transform Pro tools (move / rotate /
scale / fit) move onto the sealed core binary, with their snippet IP gated
behind the `pro` edition tag.

### Changed

- **Move, rotate, scale, and fit-to-canvas now run through the sealed core binary on Pro.** Behavior is unchanged — same positioning modes, same background auto-promote — but the ExtendScript is now produced by the compiled core (golden-verified byte-equivalent) rather than in-process JavaScript.
  - `photoshop_move_layer` / `photoshop_rotate_layer` / `photoshop_scale_layer` / `photoshop_fit_layer_to_document` handlers flipped to `snippetClient.build()`; the `layer-transform-tools-pro` factory takes the `SnippetClient`. Mode resolution + mutual-exclusivity validation stay in the handler; the bounds math, auto-promote, and fit/fill branch are in the snippet body.

---

## [0.11.2] — 2026-06-13

Go sidecar Phase 3 (cont.): the template-authoring Pro tools move onto the
sealed core binary. No snippet porting was needed — their snippets were
already in the binary — so this is a pure handler flip.

### Changed

- **Template authoring (create-evidence / save) now produces its Photoshop reads through the sealed core binary on Pro.** Behavior is unchanged; the history-state preview, history-states, and metadata reads are now built by the compiled core instead of in-process JavaScript.
  - `photoshop_template_create_evidence` / `photoshop_template_save` route `renderHistoryStatePreview`, `getHistoryStates`, and `getMetadata` through `snippetClient.build()`; the `template-tools-pro` factory takes the `SnippetClient`. The metadata read explicitly requests `dom_exif: false` to preserve the prior behavior exactly.

---

## [0.11.1] — 2026-06-13

Go sidecar Phase 3 (vertical slice): the edition-split mechanism that keeps
Pro snippet IP out of the Community binary, proven end-to-end on the Sensei
selection tools.

### Changed

- **Select Subject and Select Sky now run through the sealed core binary on Pro.** Behavior is unchanged — the underlying ExtendScript is byte-for-byte equivalent (golden-verified) — but it is now produced by the compiled core instead of in-process JavaScript, the first Pro tools to move onto the new path.
  - `photoshop_select_subject` / `photoshop_select_sky` handlers flipped to `snippetClient.build()`; `selection-tools-pro` factory takes the `SnippetClient`

---

## [0.11.0] — 2026-06-12

Templates roadmap Phase 3 (recall) + Go sidecar migration Phase 0 (vertical
slice — mechanism proven; handlers not yet flipped, runtime behavior
unchanged).

### Added

- **Template sections can be re-read cheaply late in a session.** When the template text is tens of thousands of tokens back in a long edit, one call re-surfaces just the binding tier — the exit criteria by default — as text only, with no images and no full recipe reload.
  - `photoshop_template_recall(name, section?)` — `'community'` per the roadmap's ride-along clause: pure filesystem read (no ExtendScript), fully unit-covered, live evidence in the release-run transcript
  - Sections: `exit_criteria` (default), `tune`, `fixed`, `intent`, `signature` (returns signature.json)
  - Apply guidance + the Claude skill now point at recall for late-session re-reads; `extractSection`/`readTemplateMd` added to template storage

---

## [0.10.0] — 2026-06-12

### Added

- **Template verification now ships in every edition.** After applying a template, the document can be measured against the template's saved style signature — per-assertion pass/fail with a corrective steer for each miss — so "matches the look" is checked objectively before declaring done.
  - `photoshop_template_verify` promoted `'dev'` → `'community'` after live verification (Windows, PS 2026): exemplar after-state passed both predicates (R−B = 100 ≥ 20; luminosity median 120 in 100–160 band), a cool regrade failed exactly the look predicate with the correct steer, transcript at `~/.editmamei/live-smoke/2026-06-12T08-48-14Z-31a3/`
  - `photoshop_template_apply` guidance now names the verify tool directly (previously gated phrasing, pre-promotion)
  - README gains the `photoshop_template_verify` section; sibling leak-guard blocklists re-synced (name removed)

---

## [0.9.0] — 2026-06-11

Templates roadmap Phase 2 (signatures + verification). Built in parallel
with the Go sidecar migration under its freeze rules: zero new ExtendScript
snippets (verification composes existing selection + histogram snippets);
the evaluator in `src/templates/signature.ts` is a pure function with no
tool-layer imports so it can lift into the compiled sidecar later.

### Added

- **Templates can now carry a machine-checkable style signature.** When saving a template, the author can attach a compact set of relative style assertions — channel orderings, clipping ceilings, tonal points, subject-vs-background relations — that future edits can be measured against, turning "matches the look" into a measurement instead of a vibe.
  - `photoshop_template_save` gains an optional `signature_content` arg (strictly validated — an invalid signature REJECTS the save, unlike the warn-only markdown lint) and a `signature_saved` output field; the bundle gains `signature.json`
  - Predicate vocabulary v1: `channel_mean_relation`, `clipping_max`, `tonal_point`, `median_band`, `region_luminance_relation`, `region_contrast_relation`, `region_saturation_relation` (saturation parses but reports `skipped` until post-sidecar snippet support; same for `center`/`edges` regions)
  - Authoring doctrine gains a "Signature — make the exit criteria machine-checkable" section returned via `photoshop_template_create_evidence`
  - `src/templates/signature.ts` (strict schema + pure evaluator with per-failure corrective steers) + `src/templates/histogram-stats.ts` (percentile/clipping bin math)

#### New tools landing as 'dev' tier (excluded from CE + Pro shipped bundles)

- `photoshop_template_verify(name)` — evaluates the active document against a template's signature: per-predicate `pass | fail | skipped` with measured-vs-target detail and a one-line steer per failure. Regions resolve relationally (Select Subject/Sky + invert; Photoshop histograms are natively selection-scoped); Sensei-gated regions degrade to `skipped`, never `failed`; an empty inverse selection marks `background` unavailable instead of mislabeling full-document stats. Promotion intent: `'community'` after live verification per the roadmap's Phase 2 completion criteria (exemplar passes, unedited source fails, live-smoke transcript).

---

## [0.8.5] — 2026-06-11

PATCH bump: Templates roadmap Phase 1 — the template system shifts from "replay
script" to "goal-oriented recipe." Authoring states the doctrine up front, apply
leads with assess-first/re-derive guidance, and saves are linted. No new tools
and no input-schema changes; the save tool gains a non-blocking `warnings`
output field.

### Added

- **Saving a template now flags issues against the authoring doctrine.** A template save is checked for missing structure and copied-in scripting or fixed geometry, and any problems come back as warnings — the save still succeeds, so you can fix and re-save in the same session.
  - `photoshop_template_save` gains a `warnings: string[]` output field (also in `structuredContent` + the human-readable text); warn-don't-block by design
  - `src/templates/template-lint.ts` `lintTemplateMarkdown(md)` checks required frontmatter keys, required sections, and red-flag content (raw `executeAction` / `charIDToTypeID` / `stringIDToTypeID`, `execute_script`, environment-bug workarounds, absolute pixel rectangles)

### Changed

- **Templates are now authored and applied as goal-oriented recipes, not replay scripts.** A template captures the *approach* to a look and adapts it to each new photo, instead of replaying one photo's exact numbers — so the same template produces a consistent result across different images.
  - `photoshop_template_create_evidence` returns the authoring doctrine verbatim (`AUTHORING_DOCTRINE` in `src/templates/authoring-doctrine.ts`): the north star, the three-tier Binding/Reference/Free authority model, objective-first steps, the bans, and the checkable-exit-criteria rules
  - `photoshop_template_apply` leads its response with assess-first / re-derive-per-photo guidance before the recipe body (`APPLY_GUIDANCE` in `src/tools/template-tools.ts`)
  - `photoshop_overview`'s Templates bullet and the editmamei skill's Templates section carry the same "binds outcomes, not steps" frame; all kept tier-agnostic (a future template-verify tool is referenced only conditionally)

---

## [0.8.4] — 2026-06-10

### Security

- **Captured tool results in the session log are now sanitized before writing.** The opt-in full-result capture now applies the same privacy discipline as arguments: inline image payloads become size markers, home-directory paths are redacted, and long strings are truncated.
  - `EDITMAMEI_LOG_RESULTS=1` capture routes through `elideImagePayloads` + the args sanitizer in `src/utils/session-log.ts`
  - A single `photoshop_get_preview` no longer writes hundreds of KB of base64 per captured line
  - `result_bytes` still measures the raw pre-elision result, so size analysis is unaffected

---

## [0.8.3] — 2026-06-10

PATCH bump: session-log schema v2 enrichment (Phase 2a). Adds structured meta lines, per-call sequence numbers, retry detection, result-size accounting, context-scalar hoisting, and error classification to the NDJSON telemetry. No LLM-facing tool surface change.

---

## [0.8.2] — 2026-06-10

PATCH bump: clearing the remaining post-release debt from the 2026-06-10 v0.7.2 pre-release audit. Five items addressed (M1, M2, M3, LOW cluster, D2). No LLM-facing surface change. Also catches a `src/version.ts` drift that slipped into v0.8.1 (the version-coupling test passed in v0.8.1 by accident; this release re-pins it).

### Security

- **Cleaner argument handling in the macOS Photoshop-installation detector.** The detector previously assembled shell-command strings with interpolated filesystem-derived paths (mdfind output, app names, plist paths). Switched all four `child_process` calls to `execFile` with explicit argument arrays so the shell is never involved. Local-actor-only threat model (someone able to plant a Spotlight-indexed bundle already has code execution as the user), but it matches the args-array discipline the script executors already use.
  - `src/platform/macos-detector.ts`: `extractVersionFromApp`, `checkIfRunning`, `getAppBundleId`, and `detectUsingSpotlight` all rewritten to use `execFileAsync`. The `exec` import is gone; only `execFile` remains.
  - Audit M2 fix.

### Fixed

- **Subject-selection error message no longer recommends a tool the registry can't reach.** When the Sensei-backed subject and sky selectors fail or find nothing, the fallback recommendation in the error string now points at a community-tier alternative instead of a dev-tier tool that registers in no shipped edition.
  - `src/api/extendscript/selections.ts`: two error-string paths updated. `photoshop_select_subject`'s "no subject found" branch and `photoshop_select_sky`'s "no sky region" branch both used to recommend `photoshop_select_color_range`, which has been `'dev'` tier since 2026-06-03 (DOM method doesn't exist; awaits AM-descriptor rewrite). Both now recommend `photoshop_magic_wand`.
  - New regression guard at `tests/integration/readme-leak-guard.test.ts` ("ExtendScript snippet error-string leak guard") scans every `src/api/extendscript/*.ts` source for `'dev'`/`'none'`-tier `photoshop_*` names and fails the build if any reappear in runtime error strings or anywhere else in the snippet sources.
  - Audit M1 fix.

---

## [0.8.1] — 2026-06-10

PATCH bump: internal Pro-tool isolation refactor. No LLM-facing surface change — same tool names, same descriptions, same Pro/CE split. The shipped CE tarball no longer carries the Pro implementations for the action / layer-transform / retouch surfaces, restoring the build-time exclusion the `tool-tiers.ts` header had been documenting incorrectly. Addresses 2026-06-10 v0.7.2 pre-release audit findings H2/Q1 + M4.

---

## [0.8.0] — 2026-06-10

MINOR bump for a preview-tool surface contraction: `photoshop_get_preview` no longer accepts a `format` argument. The previously-supported PNG variant always failed for any non-tiny document — PNG payloads at the default 1024px max-dim run 1.5-3 MB on a typical photo, which exceeds the MCP transport's per-response cap of ~1 MB. JPEG at the default quality 6 is visibly clean for tone / color / spatial verification and stays under the cap. Removing the option drops a footgun that confused the LLM into retrying with smaller `max_dimension` values whenever PNG failed.

### Changed

- **Preview rendering always uses JPEG; the `format` argument is gone.** Was an enum `'jpeg' | 'png'` defaulting to `'jpeg'`. The PNG variant was a footgun — preview of any non-tiny doc rendered into a payload PNG large enough to blow past the MCP per-response cap, so the call always failed with a transport-layer error that the LLM read as a tool bug. JPEG at the new default quality 6 is preserved verbatim and is the only output now.
  - Tool affected: `photoshop_get_preview` — `inputSchema.format` removed
  - Output is now unconditionally `image/jpeg` (the response also always reports `format: "jpeg"` and `mime_type: "image/jpeg"` in `structuredContent` so downstream consumers don't have to branch)
  - Callers passing `format: 'jpeg'` are unaffected — the field is silently ignored by the schema validator. Callers passing `format: 'png'` now get JPEG instead of the previous broken-with-error behaviour. No-op for the documented use case
  - The `quality` parameter's description was tightened — it no longer says "Ignored for PNG" since PNG is gone

---

## [0.7.2] — 2026-06-09

PATCH bump fixing three structured-response bugs that surfaced during the v0.7.1 Mac CE full-surface validation, plus a MINOR-shaped surface change (histogram added to CE) and a cross-cutting fix for Pro-tier tool names leaking into CE descriptions. The first two bugs presented identically — Photoshop completed the work, the session log recorded `success:true`, but Claude Desktop showed a red "Failed to call tool" toast because the structured response contained `{}` where a number was expected. Root cause: ExtendScript host objects (UnitValue, BitsPerChannelType enum) serialize as empty objects through the JSON encoder.

### Fixed

- **Setting a text font no longer surfaces as a UI failure even when it succeeds.** The structured response from this tool was sending an empty object where a font-size number was expected; Claude Desktop validated the response against the declared schema, the empty object failed validation, and the call surfaced as a red "Failed to call tool" toast in the UI — even though Photoshop had applied the font correctly and the session log recorded success. The snippet now coerces the size value to a plain point number before returning, so the response shape matches the schema and the UI no longer reports a phantom failure.
  - Tool fixed: `photoshop_set_text_font`
  - Confirmed across Arial / Helvetica / Times New Roman in the 2026-06-09 Mac CE validation session
  - Same root-cause pattern as the bits-per-channel fix below — ExtendScript `UnitValue` is a host object; the JSON encoder walks own properties via `for...in` + `hasOwnProperty` and gets nothing, so it serializes as `{}`
  - Snippet now uses `layer.textItem.size.as('pt')` which returns a plain Number (the wrapper preamble has already pinned `TypeUnits.POINTS`)
- **Opening a document no longer surfaces as a UI failure even when it succeeds.** Same shape of bug as the font fix above, different host object: the bits-per-channel field was a `BitsPerChannelType` enumeration host object (ONE / EIGHT / SIXTEEN / THIRTYTWO), not a plain integer. Empty-object serialization, schema validation failure, red toast on a successful operation. The pipeline now maps the enum to its integer value (1 / 8 / 16 / 32) before returning.
  - Tool fixed: `photoshop_open_document`
  - Same fix applied defensively to `photoshop_get_metadata`'s document section — the permissive `object` schema was hiding the corrupted field rather than failing it, so the bug was silent there but the data was still wrong on the wire
  - New `bitsPerChannelHelper` constant in `src/api/extendscript/_helpers.ts` shared by both call sites

### Added

- **The verification-grade histogram primitive now ships in CE.** It was always classified `'community'` in the tier table but registered in the Pro-only `preview-tools-pro.ts` file, which gets build-stubbed for CE. Net effect: CE users got an invisible-but-classified-community tool. The handler, schema, and registration are now in `preview-tools.ts` where the classification has always pointed. Pro builds are unchanged (Pro factories register a superset of community, so moving a tool from Pro file to CE file changes the bundle composition without changing the Pro surface). The histogram description also drops the "**Pro tier.**" preamble and the "CE callers without Pro:" workaround paragraph, since it's no longer Pro.
  - Concrete user-visible change: CE users now get the verification-grade histogram primitive that the audit doc has been recommending for clipping detection / exposure verification / neutral-gray checks since Bundle Q

### Changed

- **Tool descriptions read by CE users no longer name Pro-tier tools or include tier markers.** Three concrete leaks fixed this release, plus a new build-fail test guarding against any future drift. The 2026-06-09 Mac CE session caught the pattern: `photoshop_ping`'s description told the LLM that "photoshop_list_actions / play_action are worth exploring" when the user has Action Sets loaded — both Pro tools, invisible in CE, so the LLM dutifully searched the inventory, came up empty, and reported them as broken. Same shape of leak in `photoshop_template_list` ("Create one with `photoshop_template_create_evidence` + `photoshop_template_save`", both Pro) and `photoshop_invert_selection` ("`photoshop_select_subject` (Pro) → invert"). All three rewritten to be tier-agnostic: the LLM now learns about the workflow without being told to call tools it can't reach.
  - Tools whose descriptions changed: `photoshop_ping`, `photoshop_template_list`, `photoshop_template_apply`, `photoshop_invert_selection`
  - New invariant: CE-visible tool descriptions must be tier-agnostic. Pro / dev / none-tier tool names belong in the corresponding tier's tool's OWN description, never referenced from elsewhere

---

## [0.7.1] — 2026-06-09

PATCH bump for a pure source refactor: the 6500-line `src/api/extendscript.ts` monolith is now 12 per-category files under `src/api/extendscript/` plus a 70-line assembler. Tool surface (names, schemas, descriptions) is unchanged; runtime behaviour is byte-identical (same `ExtendScriptSnippets` shape, same 81 snippets, same bodies). The `packages/{ce,pro}/dist/api/` layout gains an `extendscript/` subdirectory — the dist-diff that drives this PATCH bump.

---

## [0.7.0] — 2026-06-09

MINOR bump promoting nine dev-tier tools to the shipped surface after live verification across two recent workloads. Six land in `'community'` (the CE workhorse pipeline gains shadow/highlight recovery, smart sharpening, noise reduction, high-pass clarity, equalize, and stamp-visible) and three land in `'pro'` (the Bundle V content-aware retouch trio). Promotion follows the dev-default-then-promote gate from [`docs/20260603-tool-tier-process.md`](docs/20260603-tool-tier-process.md); verification evidence is tracked in [`docs/20260608-tool-usage-tracker.md`](docs/20260608-tool-usage-tracker.md).

### Added

- **Nine dev-tier tools promoted to the shipped surface after live verification.** Six land in the CE workhorse pipeline (a complete tone-recovery → sharpen → noise → stamp finishing chain) and three land in Pro (the Bundle V content-aware retouch trio). Verification evidence tracked in [`docs/20260608-tool-usage-tracker.md`](docs/20260608-tool-usage-tracker.md) and the underlying NDJSON session logs in `~/.editmamei/sessions/`.
  - **Community (CE) — six promotions, all with strong cinematic-grading-batch evidence:**
  - `photoshop_apply_smart_sharpen` — 23/23 in the 2026-06-07 batch (session `2026-06-07T12-43-37Z-fc6b.ndjson`); strongest evidence in the cohort
  - `photoshop_apply_shadows_highlights` — 11/12 effective in the same session; the single "failure" was a correct refusal when the active layer was an adjustment layer (the LLM recovered on the next call)
  - `photoshop_apply_high_pass` — 11/12 effective, same recovery pattern
  - `photoshop_apply_reduce_noise` — 1/1 in the cinematic batch (underexposed-room rescue)
  - `photoshop_stamp_visible` — 2/2 in the 2026-06-09 dev-tier sweep (session `2026-06-09T08-39-42Z-e382.ndjson`); replaces the hand-rolled `execute_script` MrgV+Dplc dispatch pattern that drove ~5 escape-hatch failures in the 2026-06-06 demo session
  - `photoshop_apply_equalize` — 1/1 in the 2026-06-09 sweep
  - **Pro — Bundle V content-aware retouch trio** (placed in Pro alongside Sensei-backed `select_subject` / `select_sky` because they're the LLM-facing analogs of Adobe's premium retouching features). All three logged successful first invocations in the 2026-06-09 sweep:
  - `photoshop_apply_content_aware_fill` — 1/1
  - `photoshop_apply_patch` — 1/1
  - `photoshop_apply_content_aware_move` — 1/1
  - **Held back at dev tier (five tools)** — each is dev-tier pending further evidence, a known PS-side limit, or a snippet-level bug that needs a code change before promotion is safe:
  - `photoshop_apply_color_lookup` — known PS-side scripting-layer limitation per [`docs/20260603-color-lookup-limitation.md`](docs/20260603-color-lookup-limitation.md)
  - `photoshop_apply_lens_blur` — 1 success + 1 PS-hanging 30s timeout in the 2026-06-09 sweep that took the session down; root cause not yet established
  - `photoshop_create_clipping_mask` — 1/1 success but held with its paired `release_clipping_mask`; shipping one half of a create/release pair would leave users in a stuck state
  - `photoshop_release_clipping_mask` — 0/1, failed with `"The command '<unknown>' is not currently available"` (companion snippet to the working `create_clipping_mask`, so the bug is in the release path specifically)
  - `photoshop_select_color_range` — snippet still needs the AM-descriptor rewrite per the existing tier-comment note (DOM `selectColorRange` method doesn't exist in modern PS)

---

## [0.6.0] — 2026-06-09

MINOR bump adding compositional and coordinate overlays to the preview tool. Eight new annotation kinds let the LLM translate visual judgments ("subject is in the lower-left third") into precise pixel coordinates for downstream tool calls, and evaluate composition against canonical photographic frameworks (rule of thirds, golden ratio, golden spiral, diagonals, triangles).

### Added

- **Preview overlays gain compositional and coordinate guides.** Eight new annotation kinds make it easy for the LLM to translate visual judgments into precise pixel coordinates and to evaluate composition against canonical photographic frameworks like the rule of thirds and the golden spiral.
  - The `photoshop_get_preview` `annotations` array now accepts `type: "grid"` with four styles — `every` (regular spacing with `spacing_px`), `thirds` (rule-of-thirds 3x3), `quarters` (center crosshair), `phi` (golden-ratio analog of thirds at 0.382 / 0.618).
  - Plus `type: "composition"` with four styles — `diagonals` (corner-to-corner X), `triangles` (golden triangles composition), `fibonacci_grid` (nested golden-ratio rectangles), `golden_spiral` (fibonacci_grid plus the iconic spiral curve). Each composition style supports `orientation_corner` ∈ {`tl`,`tr`,`bl`,`br`} to flip the origin.
  - Dispatcher defensively validates the style + corner enums per-annotation and clamps `spacing_px` to the 10-4000 range — the underlying `validateArgs` helper doesn't recurse into array items today, so out-of-range values would otherwise reach the ExtendScript and a `spacing_px = 0` would produce an infinite loop. The per-type validation + clamp is the workaround until validateArgs gets array-recursion support.
  - 14 new tests pin the dispatcher translation, the defaults (`drawGrid("thirds", 50)` and `drawComposition("golden_spiral", "tl")`), every style emission, the mismatched-style fallbacks (passing a grid style to a composition annotation falls back to `golden_spiral` and vice versa), the spacing clamp at zero/negative input, and the new ExtendScript drawing primitives (`drawLine`, `drawGrid`, `drawArc`, `drawComposition`, `drawFibonacciOverlay`).
  - **Known limit on non-golden aspect ratios**: the spiral algorithm uses fixed cyclic subdivision (`tl → tr → br → bl`) which produces a perfectly-continuous spiral on a true golden rectangle (1.618:1). On arbitrary canvases (4:3, 16:9, 1:1) the squares still place correctly but consecutive arcs can show small discontinuities at iteration boundaries — inherent to the fixed-cycle rotation, not a bug. Documented in the inline ExtendScript comment.

---

## [0.5.8] — 2026-06-08

PATCH bump for the *actual* `photoshop_create_layer_mask` fix on macOS. v0.5.7 fixed the `At` slot of the Make-mask descriptor but kept the wrong class-declaration slot (`desc.putReference(cTID('null'), ref<class=Chnl>)`) — the 2026-06-08 v0.5.7 Mac session still rejected with the same "command Make not currently available" error. The user captured the menu-action via ScriptListener and the captured descriptor uses a *different* shape entirely: `desc.putClass(sTID('new'), sTID('channel'))` directly on the descriptor under a `new` key, with stringIDs throughout. v0.5.8 ships the captured form verbatim and adds regression guards against every previous-wrong-shape we've shipped (Nw-ref, bare At enumerated, null-ref class slot, charID Mk).

### Fixed

- **Mask creation actually works on macOS now.** The previous fix (v0.5.7) corrected one of two structurally wrong slots in the AM descriptor; the other slot — the class-of-thing-to-create declaration — was still in the legacy `null` reference-to-class shape that macOS PS 27.7 strict-mode rejects. The user captured the live menu dispatch via ScriptListener and the captured descriptor uses `desc.putClass(sTID('new'), sTID('channel'))` directly on the outer descriptor, with every key + value as a stringID. The snippet now matches the capture verbatim. The 2026-06-04 spec-audit claim that the `null` / `Nw` class-slot variants were equivalent was a Windows-only observation; macOS is strict.
  - Tool fixed: `photoshop_create_layer_mask`
  - Class slot was `desc.putReference(cTID('null'), ref)` where `ref` wrapped `putClass(Chnl)`. New form is `desc.putClass(sTID('new'), sTID('channel'))` — no inner ActionReference, no `null` key
  - Whole descriptor switched from charIDs to stringIDs (matches the capture). The PS-internal dispatch table for `make` does NOT treat them as fully equivalent on macOS even where it does on Windows
  - Companion spec files (`src/spec/ps27/masks/create-reveal-all.ts` + `create-reveal-selection.ts`) rewritten to drop the "two equivalent forms" claim and pin the captured shape as canonical
  - Regression guards in `tests/tools/selection-tools.test.ts` extended: now pins `.not.toContain` against every wrong shape we've shipped — pre-2026-05-30 `Nw`-ref form, pre-v0.5.7 bare `At` enumerated, pre-v0.5.8 `null`-ref class slot AND charID-based `At` reference — plus positive assertions on every captured stringID

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

[Unreleased]: https://github.com/editmamei/editmamei-wiki/compare/v0.18.0...HEAD
[0.18.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.18.0
[0.17.5]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.17.5
[0.17.4]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.17.4
[0.17.3]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.17.3
[0.17.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.17.2
[0.17.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.17.1
[0.17.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.17.0
[0.16.4]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.16.4
[0.16.3]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.16.3
[0.16.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.16.2
[0.16.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.16.1
[0.16.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.16.0
[0.15.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.15.0
[0.14.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.14.0
[0.13.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.13.1
[0.13.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.13.0
[0.12.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.12.2
[0.12.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.12.1
[0.12.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.12.0
[0.11.6]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.11.6
[0.11.5]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.11.5
[0.11.4]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.11.4
[0.11.3]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.11.3
[0.11.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.11.2
[0.11.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.11.1
[0.11.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.11.0
[0.10.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.10.0
[0.9.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.9.0
[0.8.5]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.8.5
[0.8.4]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.8.4
[0.8.3]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.8.3
[0.8.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.8.2
[0.8.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.8.1
[0.8.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.8.0
[0.7.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.7.2
[0.7.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.7.1
[0.7.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.7.0
[0.6.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.6.0
[0.5.8]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.8
[0.5.7]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.7
[0.5.6]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.6
[0.5.5]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.5
[0.5.4]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.4
[0.5.3]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.3
[0.5.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.2
[0.5.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.1
[0.5.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.5.0
[0.4.3]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.4.3
[0.4.2]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.4.2
[0.4.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.4.1
[0.4.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.4.0
[0.3.1]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.3.1
[0.3.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.3.0
[0.2.0]: https://github.com/editmamei/editmamei-wiki/releases/tag/v0.2.0
