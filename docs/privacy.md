# Privacy & data handling

This page describes exactly what the Editmamei software does with your data: what stays on
your machine, what you control, how to control it, and the precise shape of everything that
leaves. It's about the npm package you install (the `editmamei` MCP server), not about the
[editmamei.com](https://editmamei.com) website, which has its own
[privacy policy](https://editmamei.com/privacy).

The short version: your photos aren't uploaded to us. The only thing Editmamei sends to its own
servers is anonymous, content-free usage data; it's documented field-for-field below, and you can
switch it off with one command. (When your AI assistant needs to see an edit, a downscaled preview
goes to that assistant; covered under "Your AI assistant is a cloud service" below.)

---

## What Editmamei never sends to us

There is one line Editmamei does not cross, on any setting or edition:

- **Your image and document content.** No photos, previews, thumbnails, layer renders, or
  Photoshop document data are ever sent to Editmamei.
- **Your file paths.** Full paths stay local. Where a path is unavoidable in an opt-in
  diagnostic message, it's reduced to a bare filename first (see [Sanitization](#sanitization)).
- **Your metadata.** Camera info, GPS, and author fields are never part of what Editmamei
  transmits.

The previews your AI assistant looks at are a separate matter: that's your AI client talking
to its own cloud, not Editmamei. See [Your AI assistant is a cloud service](#your-ai-assistant-is-a-cloud-service).

---

## What you control

Every setting lives in a single plain-text file, `~/.editmamei/settings.json`, created on first
run. These are the keys:

| Key | Type | Default | What it does |
|---|---|---|---|
| `telemetry.usage` | boolean | `true` (on) | Anonymous, content-free usage and reliability data. The opt-out tier. |
| `telemetry.diagnostics` | boolean | `false` (off) | Extra sanitized error detail for bug-hunting. The opt-in tier. |
| `telemetry.install_id` | string | random | Anonymous random ID, minted once, so installs can be counted without identifying you. **Read-only**: you can see it, but it isn't something you set. |
| `privacy.send_previews_to_llm` | boolean | `true` | Reserved for an upcoming per-feature control over sending visual previews to your AI assistant. |
| `photoshop_path` | string \| null | `null` | Pin a specific Photoshop binary. `null` = auto-detect (the `PHOTOSHOP_PATH` env var still wins if set). |

`install_id` is a random value; it is **not** derived from your username, machine name, email,
or any other identifier.

---

## How to control it

Three equivalent ways, all writing the same `~/.editmamei/settings.json`:

**Edit the file directly.** It's plain JSON and yours to inspect at any time:

```json
{
  "telemetry": {
    "usage": true,
    "diagnostics": false,
    "install_id": "…"
  },
  "privacy": {
    "send_previews_to_llm": true
  },
  "photoshop_path": null
}
```

**Use the CLI.** The `editmamei config` command reads and writes the same file:

```bash
editmamei config list                          # print all current settings as JSON
editmamei config get telemetry.usage           # read one setting
editmamei config set telemetry.usage false     # turn usage telemetry off
editmamei config set telemetry.diagnostics true  # opt in to diagnostic detail
```

Boolean values accept `true`/`false`, `on`/`off`, `yes`/`no`, or `1`/`0`.

**In Claude Desktop.** The one-click extension has no terminal, so the same two switches appear in
the extension's own settings (Settings → Extensions → Editmamei): **Share anonymous usage stats**
(opt-out) and **Share error diagnostics** (opt-in). Toggling them there controls telemetry for
Claude Desktop without editing any file.

**First-run notice.** The first time Editmamei creates the settings file, it prints this to its
log so the default is never a surprise:

> First run: Editmamei collects anonymous, content-free usage telemetry (tool name, success,
> duration, version/edition/OS/PS-version) to find what breaks. It never sends image content,
> file paths, or personal data. Opt out anytime: `editmamei config set telemetry.usage false`
> (or edit `~/.editmamei/settings.json`). Opt in to sanitized diagnostics:
> `editmamei config set telemetry.diagnostics true`.

> **Note:** Editmamei reads the settings file once at startup. After changing a setting, restart
> your AI client so the server picks it up.

---

## Exactly what data leaves

When `telemetry.usage` is on, Editmamei sends a small, content-free subset of the local session
log. Each event is one JSON object. Below is every field that can ever be sent; there are no
hidden fields.

### Usage event: one per tool call (on by default)

```json
{
  "v": 2,
  "type": "usage",
  "install_id": "9f3c…",
  "ts_bucket": "2026-06-15",
  "editmamei_version": "0.16.2",
  "edition": "community",
  "platform": "win32",
  "ps_version": "2026",
  "tool": "photoshop_add_adjustment_layer",
  "success": true,
  "error_class": null,
  "duration_ms": 612
}
```

| Field | Meaning |
|---|---|
| `v` | Schema version (currently `2`). |
| `type` | `"usage"`. |
| `install_id` | Your anonymous random install ID. |
| `ts_bucket` | The **day** only (`YYYY-MM-DD`), never a precise timestamp. |
| `editmamei_version` | Which Editmamei version you're on. |
| `edition` | `community` or `pro`. |
| `platform` | Operating system only (`win32`, `darwin`, `linux`). |
| `ps_version` | Your Photoshop version (e.g. `2026`), or `unknown`. |
| `tool` | The tool name that ran (e.g. `photoshop_add_adjustment_layer`). |
| `success` | Whether the call succeeded. |
| `error_class` | On failure, a short error **category** (e.g. `missing_pixel_layer`), never a message or free text. `null` on success. |
| `duration_ms` | How long the call took, in milliseconds. |

### Session start: once when Editmamei launches (on by default)

```json
{
  "v": 2,
  "type": "session_start",
  "install_id": "9f3c…",
  "ts_bucket": "2026-06-15",
  "editmamei_version": "0.16.2",
  "edition": "community",
  "platform": "win32",
  "ps_version": "unknown"
}
```

Sent once when Editmamei starts, so an install can be counted even before you run anything. Same
content-free fields as above, with **no tool name, no counts, no free text**. `ps_version` is usually
`unknown` because Photoshop hasn't been queried yet at startup.

### Session summary: one per session (on by default)

```json
{
  "v": 2,
  "type": "session_summary",
  "install_id": "9f3c…",
  "ts_bucket": "2026-06-15",
  "editmamei_version": "0.16.2",
  "edition": "community",
  "platform": "win32",
  "ps_version": "2026",
  "tool_call_count": 47,
  "distinct_tools": 11,
  "any_failures": true
}
```

Counts only: how many tool calls in the session, how many distinct tools, and whether anything
failed. No per-call detail.

### Diagnostic event: only if you opt in

Sent **only** when you set `telemetry.diagnostics true`, and only when something fails:

```json
{
  "v": 2,
  "type": "diagnostic",
  "install_id": "9f3c…",
  "ts_bucket": "2026-06-15",
  "editmamei_version": "0.16.2",
  "platform": "win32",
  "ps_version": "2026",
  "tool": "photoshop_apply_shadows_highlights",
  "error_class": "am_descriptor_no_op",
  "error_message": "…sanitized; paths reduced to filenames…",
  "snippet": "applyShadowsHighlights",
  "stderr_tail": "…last lines of error output, sanitized…"
}
```

This adds a sanitized error message, the name of the failing step (`snippet`), and a trimmed
tail of error output, enough to trace a bug without you mailing a log by hand. Still no image
content.

### What is deliberately never in any event

- The arguments you passed a tool (no prompts, no values, no text).
- Any image, preview, thumbnail, or document content.
- Full file paths.
- A precise timestamp (day-granularity only).
- A session ID or anything that links events back to a specific editing session beyond the
  anonymous install ID.

---

## Sanitization

Before any diagnostic string leaves, it runs through a fixed cleanup pass:

1. Home directory redacted (`C:\Users\you\…` → `~\…`).
2. Absolute paths collapsed to their final filename (`C:\photos\client\shot.psd` → `shot.psd`).
3. Backslashes normalized to forward slashes; leading separators stripped.
4. Length capped (error message 2000 chars, step name 128, error-output tail 4000).

As a final backstop, any event that still looks like it contains an absolute path is **dropped
entirely** rather than sent.

---

## Where it goes

Usage and diagnostic events are sent to Editmamei's **own** telemetry endpoint (not a
third-party analytics company), where they're aggregated by day. Sending is batched and
best-effort: it happens in the background, times out quickly, and never retries or blocks your
editing. If you're offline, events are simply dropped, never queued indefinitely.

---

## Local session logs

Separately from telemetry, Editmamei keeps a richer local log of each session at
`~/.editmamei/sessions/<session-id>.ndjson`. This is used for debugging and by the Templates
system to reconstruct an edit. It **stays on your disk**; it is not transmitted, and telemetry
is only the small content-free subset described above, never this file. There's no automatic
cleanup; delete the files whenever you like.

---

## Your AI assistant is a cloud service

The AI assistant you drive Editmamei with (Claude Desktop, Cursor, and the like) is a cloud
service governed by its own privacy policy. When you ask it to look at an image (for example,
the visual-verification preview), Editmamei hands a downscaled JPEG to **that AI provider** on
your behalf, exactly as if you'd dropped the file into a chat with it. That's a property of
using a cloud AI, and a function of which assistant you choose, not a hop Editmamei adds.

---

## Pro

Pro is not yet released. When it is, validating a Pro license will involve a content-free check
(no document, image, or path data), and this page will be updated to describe it precisely
before it ships.

---

## Questions & disclosures

- Full website privacy policy: [editmamei.com/privacy](https://editmamei.com/privacy)
- Security disclosures: [editmamei.com/security](https://editmamei.com/security)
- Anything else: [open an issue](https://github.com/editmamei/editmamei-wiki/issues) or
  [get in touch](https://editmamei.com/contact).
