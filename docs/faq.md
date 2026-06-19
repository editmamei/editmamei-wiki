# FAQ

---

## About the project

### How is "Editmamei" pronounced?

Like **edamame** (ed-a-MAH-may). Yes, the soybean. If you've ever ordered it at a sushi place, you already know how to say the name.

### Is Editmamei affiliated with Adobe?

No. Editmamei is an independent product. It is not affiliated with, endorsed by, or sponsored by Adobe Inc. "Adobe" and "Photoshop" are registered trademarks of Adobe Inc.

### Does Editmamei generate pixels with AI?

No. Editmamei is an *orchestration* layer, not a *generation* layer. The AI assistant plans the steps (which adjustments, which selections, in what order), and Photoshop carries them out using its own standard non-generative tools (adjustment layers, masks, selections, filters). Your pixels are only ever changed by Photoshop itself; no generative model touches them. "AI orchestration, not generation" is the short version.

### Is Editmamei open source?

The compiled Community Edition binary is freely available on npm, but the source is proprietary. See the [LICENSE on editmamei.com](https://editmamei.com/license) for the full text. Third-party open-source dependencies retain their original licenses; the full list is in the `NOTICES.md` bundled with the npm package.

### Where does the project name come from?

Pronunciation is a near-homophone of "edamame," a deliberate choice for memorability and personality. "Edit" + "mamei" reflects what the tool does (edits) and how it sounds (snack).

---

## Installation & compatibility

### Which MCP clients are supported?

Officially:

- [Claude Desktop](https://claude.ai/download) (Windows, macOS)
- [Cursor](https://cursor.com/)
- [Claude Code](https://claude.ai/code)

Any MCP-compatible client should work; Editmamei is a standard MCP stdio server. `editmamei install` auto-configures Claude Desktop; for Cursor, Claude Code, or other clients, the [manual configuration steps](installation.md#manual-configuration) show what to put in your client's config.

### Which AI client should I use?

All three supported clients work with Editmamei. The right one for you depends on the kind of work you do.

**Claude Desktop** is the easiest to set up and the most familiar if you've used Claude on the web. It's a great fit for everyday edits: a single hero shot to grade, a portrait to retouch, a quick template to apply. Most one-off and short-session work runs comfortably here.

**Claude Code** is a terminal-based client. It takes more setup, but it has a much larger working memory for the conversation, which keeps it fast when a session runs long. Real-estate batches, wedding sets, multi-image template authoring, and any workflow that runs through dozens of edits in a row stay responsive on Code in ways Desktop currently cannot match. If you regularly notice the AI slowing down as you keep editing, switching to Code is the fix.

**Cursor** runs Editmamei the same way Claude Desktop does. Use it if it's already part of your workflow.

If you're not sure: start on Desktop. Move to Code the first time you feel a session getting slow. The [getting-started guide](getting-started.md#when-the-ai-starts-feeling-slow) covers why that happens, and [installation.md](installation.md#claude-code) covers the Code setup.

### Which Photoshop versions are supported?

**Photoshop 2026 (internal version 27.x).** That's the only Photoshop version Editmamei has been verified against; every ActionManager descriptor we emit was captured against PS 27.x on Windows and macOS.

Earlier versions (Photoshop 2025 / 2024 / 2023 / 2022) may work (the DOM-level APIs and most AM events are stable across recent majors), but they're unverified. Adobe is known to rotate event IDs between major versions, and a tool that string-match-tests fine in the source can still silent-no-op against a different PS major. The auto-detector still finds older installs so you can try, but failing tools on unsupported versions are a known unsupported-version risk, not a bug.

### Does Editmamei work on Linux?

No. Editmamei drives Photoshop through Windows COM automation or macOS AppleScript / OSA, both OS-specific. Photoshop itself is not supported on Linux.

### Does it need an internet connection?

Core editing doesn't. Editmamei never requires a network call to drive Photoshop. The one call Editmamei makes on its own is anonymous, content-free usage telemetry (which tools ran, whether they succeeded, version/OS/Photoshop version), sent in the background and best-effort. It carries no images, paths, or personal data, and you can switch it off with `editmamei config set telemetry.usage false`. Every field that's collected is documented in [privacy.md](privacy.md).

Your AI assistant is separate. Editmamei runs as a stdio subprocess of your AI assistant (Claude Desktop, Cursor, etc.), and that assistant is itself a cloud service governed by its own privacy policy. When you ask the AI to look at a visual preview, Editmamei sends a downscaled JPEG to *that AI provider* on your behalf, exactly as if you'd dropped the file into a chat with it. So an internet connection is required for the AI to function, even if Editmamei the server isn't transmitting anything itself.

### Does it need Generative Fill / Adobe cloud features?

No. Editmamei runs against the standard ExtendScript automation surface, which has been in every Photoshop install since the early 2010s. No tool that ships in the current build invokes Generative Fill or any other Adobe generative feature. Editmamei is an orchestration layer, not a generation layer.

### Does Editmamei work with Photoshop Elements?

No. Photoshop Elements does not expose the same scripting interface that full Photoshop does.

---

## Using Editmamei

### Can the AI mess up my files?

The AI works on the open document in Photoshop, the same way you would. Standard Photoshop undo/redo applies; `photoshop_undo` and `photoshop_redo` are exposed as tools, and the AI uses them. You can also revert at any point through Photoshop's File → Revert.

The AI will not save over your original files unless you explicitly ask it to. Save and export tools all take explicit file paths.

That said: when running batch operations across many files, ask the AI to dry-run on one image first and verify the output before unleashing it on a folder.

### Can the AI delete files?

The current Community tool surface does not include a file-deletion tool. The AI can write new files (save / export) but cannot delete existing files outside the document scope.

### How does the AI know what the image looks like?

Through `photoshop_get_preview`, which returns a downscaled JPEG of the current document state. The AI calls this when it needs to verify its own work or judge an aesthetic outcome. It can also call `photoshop_get_histogram` for per-channel pixel distributions and `photoshop_get_metadata` for dimensions, color mode, and embedded profile.

### Does Editmamei collect any data about my edits?

Nothing about the content of your edits goes to us: no images, document data, or file paths. Editmamei does send anonymous, content-free usage data (which tools ran, whether they succeeded, how long they took), which you can switch off; see [privacy.md](privacy.md) for every field. Separately, a richer local session log is written to `~/.editmamei/sessions/<session-id>.ndjson` (used for debugging and by the Templates system) that stays on your disk and is **not** transmitted. (When your AI assistant needs to see an edit, a downscaled preview goes to that assistant, per "Does it need an internet connection?" above; and what your AI client does with content you share in chat is governed by its own [privacy policy](https://editmamei.com/privacy).)

### Can I run Editmamei against multiple Photoshop versions installed side by side?

Yes. Editmamei auto-detects Photoshop, and you can pin a specific install via the `PHOTOSHOP_PATH` env var in your MCP client config. See [installation.md](installation.md#optional-pin-a-specific-photoshop-install).

### Why does the AI take longer between edits as my session gets longer?

AI assistants have a working memory for the conversation, and as it grows, the AI takes longer to reason about each next step. Short sessions stay snappy. A session that runs into the hundreds of edits will see noticeable gaps build up between asking for an edit and seeing the next step happen.

This is a property of the AI client, not of Editmamei or Photoshop. Two things help:

1. **Start a fresh conversation when you switch projects.** Closing a session and starting a new one resets the working memory. If you've been on one image for an hour and want to move to the next, a new chat is faster than continuing the old one.
2. **Use Claude Code for sustained work.** Claude Code has a much larger working memory, which means it stays fast across hundreds of edits in one session. See [Which AI client should I use?](#which-ai-client-should-i-use) for when each client makes sense.

---

## Pro

### What's the difference between Community and Pro?

See the full breakdown in [pro-features.md](pro-features.md). Short version: Community covers the full working-photographer editing surface: documents, layers, layer transforms and straightening, non-destructive adjustment layers, filters, content-aware retouch (Content-Aware Fill, Patch, Content-Aware Move), layer styles, masks, Magic Wand and rectangle/feather selections, per-channel histograms and visual verification, history, text, image placement. Pro adds three things on top: the **whole reproducible-template system** (create, save, apply, verify, recall), the **Sensei-backed** Select Subject and Select Sky, and **Photoshop Actions + ExtendScript scripting**. See the canonical editions table in the [main README](../README.md#editions).

### How do I activate a Pro license?

Pro is coming soon. Community is free and available today; Pro isn't purchasable yet. When it launches you'll buy at [editmamei.com/pricing](https://editmamei.com/pricing) and activate it over your existing Community install, and the exact steps will be documented here. See [pro-features.md](pro-features.md) for what Pro adds.

### Do you offer a free trial?

Trial and refund details will be published at [editmamei.com/pricing](https://editmamei.com/pricing) when Pro launches.

---

## Issues & support

### Where do I file bugs?

[github.com/editmamei/editmamei-wiki/issues](https://github.com/editmamei/editmamei-wiki/issues). Pick the appropriate template (bug report or feature request) and fill it in.

### Where do I ask account or billing questions?

Email [support@editmamei.com](mailto:support@editmamei.com). Do not file billing issues in the public GitHub tracker; your invoice details don't belong there.

### How do I report a security issue?

See [editmamei.com/security](https://editmamei.com/security) for the responsible disclosure process. Do not open security issues in the public tracker.

### Is there a community?

A Discord community is planned for Pro launch. Until then, the issue tracker is the primary public forum.
