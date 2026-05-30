# FAQ

---

## About the project

### How is "Editmamei" pronounced?

Like **edamame** (ed-a-MAH-may) — yes, the soybean. If you've ever ordered it at a sushi place, you already know how to say the name.

### Is Editmamei affiliated with Adobe?

No. Editmamei is an independent product. It is not affiliated with, endorsed by, or sponsored by Adobe Inc. "Adobe" and "Photoshop" are registered trademarks of Adobe Inc.

### Is Editmamei open source?

The compiled Community Edition binary is freely available on npm, but the source is proprietary. See the [LICENSE on editmamei.com](https://editmamei.com/license) for the full text. Third-party open-source dependencies retain their original licenses — full list in the `NOTICES.md` bundled with the npm package.

There is an **abandonment clause** in the license: if Editmamei is unmaintained for 24 consecutive months, the codebase is automatically relicensed under MIT.

### Where does the project name come from?

Pronunciation is a near-homophone of "edamame" — a deliberate choice for memorability and personality. "Edit" + "mamei" reflects what the tool does (edits) and how it sounds (snack).

---

## Installation & compatibility

### Which MCP clients are supported?

Officially:

- [Claude Desktop](https://claude.ai/download) (Windows, macOS)
- [Cursor](https://cursor.com/)
- [Claude Code](https://claude.ai/code)

Any MCP-compatible client should work — Editmamei is a standard MCP stdio server. If you use a different client, the [manual configuration steps](installation.md#manual-configuration-if-editmamei-install-cant-reach-your-client) show what to put in your client's config.

### Which Photoshop versions are supported?

Photoshop 2022 or later. Photoshop 2024+ is recommended because some tools (Select Subject, Select Sky, Remove Background) depend on Adobe Sensei features that are most reliable in recent versions.

### Does Editmamei work on Linux?

No. Editmamei drives Photoshop through Windows COM automation or macOS AppleScript / OSA — both are OS-specific. Photoshop itself is not supported on Linux.

### Does it need an internet connection?

The Editmamei server itself makes no outbound network connections of its own in the Community Edition. The Pro Edition adds one Editmamei-side call: license validation against the license server, roughly once per 7 days, which sends `{license key, version, OS}` and no document or image data.

Your AI client is separate. Editmamei runs as a stdio subprocess of your AI assistant (Claude Desktop, Cursor, etc.), and that assistant is itself a cloud service governed by its own privacy policy. When you ask the AI to look at a visual preview, Editmamei sends a downscaled JPEG to *that AI provider* on your behalf — exactly as if you'd dropped the file into a chat with it. So an internet connection is required for the AI to function, even if Editmamei the server isn't transmitting anything itself.

### Does it need Generative Fill / Adobe cloud features?

No. Editmamei runs against the standard ExtendScript automation surface, which has been in every Photoshop install since the early 2010s. Generative Fill is optional and only used by tools that explicitly call it.

### Does Editmamei work with Photoshop Elements?

No. Photoshop Elements does not expose the same scripting interface that full Photoshop does.

---

## Using Editmamei

### Can the AI mess up my files?

The AI works on the open document in Photoshop, the same way you would. Standard Photoshop undo/redo applies — `photoshop_undo` and `photoshop_redo` are exposed as tools, and the AI uses them. You can also revert at any point through Photoshop's File → Revert.

The AI will not save over your original files unless you explicitly ask it to. Save and export tools all take explicit file paths.

That said: when running batch operations across many files, ask the AI to dry-run on one image first and verify the output before unleashing it on a folder.

### Can the AI delete files?

The current Community tool surface does not include a file-deletion tool. The AI can write new files (save / export) but cannot delete existing files outside the document scope.

### How does the AI know what the image looks like?

Through `photoshop_get_preview`, which returns a downscaled JPEG of the current document state. The AI calls this when it needs to verify its own work or judge an aesthetic outcome. It can also call `photoshop_get_histogram` for per-channel pixel distributions and `photoshop_get_document_info` for dimensions, color mode, and embedded profile.

### Does Editmamei collect any data about my edits?

No — not by Editmamei itself. Editmamei writes a local session log to `~/.editmamei/sessions/<session-id>.ndjson` (used for debugging and by the Templates system) that stays on your disk; Editmamei doesn't read it or transmit it. (What your AI client does with content you share in chat is a separate question — see the [privacy policy](https://editmamei.com/privacy).)

### Can I run Editmamei against multiple Photoshop versions installed side by side?

Yes. Editmamei auto-detects Photoshop, and you can pin a specific install via the `PHOTOSHOP_PATH` env var in your MCP client config. See [installation.md](installation.md#optional-pin-a-specific-photoshop-install).

---

## Pro

### What's the difference between Community and Pro?

See the full breakdown in [pro-features.md](pro-features.md). Short version: Community covers the core editing surface (documents, layers, basic adjustments, filters, simple selections). Pro adds the Templates system, the full non-destructive workflow surface, the smart selection tools (Select Subject / Sky / Color Range), layer styles, and advanced transforms.

### How do I activate a Pro license?

```bash
editmamei license activate <your-license-key>
```

Then restart your MCP client. Full details in [installation.md](installation.md#activate-pro).

### Can I move my Pro license to a different machine?

Yes:

```bash
editmamei license deactivate    # on the old machine
editmamei license activate <key>  # on the new machine
```

### What happens to my Pro tools if I let my subscription lapse?

Pro tools become unavailable on the next license check (within 7 days of the lapse). Your saved templates and session logs at `~/.editmamei/` are preserved — they don't disappear, they just can't be used until the subscription is reactivated.

### Do you offer a free trial?

See [editmamei.com/pricing](https://editmamei.com/pricing) for current trial / refund policy.

---

## Issues & support

### Where do I file bugs?

[github.com/editmamei/editmamei-ce/issues](https://github.com/editmamei/editmamei-ce/issues). Pick the appropriate template (bug report or feature request) and fill it in.

### Where do I ask account or billing questions?

Email [support@editmamei.com](mailto:support@editmamei.com). Do not file billing issues in the public GitHub tracker — your invoice details don't belong there.

### How do I report a security issue?

See [editmamei.com/security](https://editmamei.com/security) for the responsible disclosure process. Do not open security issues in the public tracker.

### Is there a community?

A Discord community is planned for Pro launch. Until then, the issue tracker is the primary public forum.
