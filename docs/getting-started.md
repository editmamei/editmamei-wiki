# Getting started

This guide walks you through your first Editmamei session — from confirming Photoshop is connected to making your first real edit. It assumes you've already done the [installation](installation.md).

The pattern throughout is the same: **you describe what you want in plain words; the AI plans it; your Photoshop carries it out.** You're not learning a new app — you're learning to ask for what you already know how to do.

---

## Step 1: ping Photoshop

With Photoshop open and your MCP client (Claude Desktop, Cursor, or Claude Code) restarted, start a new conversation and ask:

> "Is Photoshop connected? What version is running?"

The AI should call `photoshop_ping` and `photoshop_get_version`, and you'll see something like:

> Yes — Photoshop is connected. You're running Photoshop 2025 (version 26.0.0) on Windows.

If you instead see "tool not found" or a connection error, jump to [Troubleshooting](#troubleshooting) at the bottom of this page.

---

## Step 2: open a document

> "Open `C:\Users\me\Pictures\test.jpg` in Photoshop and tell me the dimensions and color profile."

The AI calls `photoshop_open_image` and `photoshop_get_document_info`. You'll see the document appear in Photoshop and the AI report back with the file's dimensions, color mode, and embedded ICC profile.

Use any path that points to an image file you have. JPEG, PNG, TIFF, PSD, DNG, and most raw formats are supported.

---

## Step 3: make a non-destructive edit

> "Add a Curves adjustment layer named 'tone' that gently lifts the shadows."

The AI calls `photoshop_add_adjustment_layer` with `type: "curves"` and appropriate curve points. You should see the new adjustment layer appear in the Photoshop Layers panel, and the document should visibly brighten in the shadows.

Editmamei always prefers non-destructive operations — adjustment layers, masks, and Smart Objects — over destructive bakes, so you can iterate without losing data.

---

## Step 4: ask the AI to verify

> "Show me what the image looks like now."

The AI calls `photoshop_get_preview`, which returns a downscaled JPEG of the current document state inline. This is how the AI sees its own work. You can ask it to compare against the original, evaluate exposure, or check if a particular edit landed.

---

## Step 5: export

> "Save the layered PSD next to the original and export a 2400px JPEG to the same folder."

The AI calls `photoshop_save_document` for the PSD and `photoshop_export_image` for the JPEG. Both files appear in your filesystem at the specified paths.

---

## What's next

Once the basics work, try one of these:

**A landscape grade:**

> "Build a non-destructive editing stack on this photo: a Levels layer, a Curves layer with an S-curve, and a Hue/Saturation layer with +15 blue saturation. Group them as 'grade'."

**A portrait retouching setup:**

> "Use Select Subject to isolate the person in this photo, feather the selection 2 pixels, then add a Curves adjustment layer clipped to that selection that gently warms the skin tones."

**Reproduce an aesthetic later (Pro):**

> "Save this current edit as a template called 'warm coastal'. Then later, apply 'warm coastal' to every image in `C:\Photos\new-shoot\`."

Full workflow examples and editing patterns at [editmamei.com/docs](https://editmamei.com/docs).

---

## Per-user data

Editmamei writes per-user data to `~/.editmamei/`:

- `~/.editmamei/sessions/<session-id>.ndjson` — one line per tool call, used for debugging and by the Templates system
- `~/.editmamei/templates/<slug>/` — saved editing recipes (Pro only)

These survive uninstall and upgrade. Delete them manually with `rm -rf ~/.editmamei/` if you want a clean slate.

---

## Troubleshooting

### "Tool not found" — the AI doesn't see Photoshop tools

Your MCP client didn't pick up the Editmamei registration. Check:

1. Did you restart the client *fully* after installing? (Not just a new conversation — fully quit and reopen.)
2. Run `editmamei install` again — it'll re-register and report any config errors.
3. Check the client config file by hand (see [installation.md](installation.md)) — verify the `editmamei` entry is present and the JSON is valid.

### `photoshop_ping` hangs or times out

Photoshop isn't responding to the automation request. Common causes:

- **Photoshop isn't open.** Open it first, then retry.
- **Different user accounts.** On Windows, Photoshop and the MCP client must run as the same user — COM automation respects user boundaries.
- **Photoshop is busy.** If a modal dialog is open (e.g. an unsaved-changes prompt, an Adobe sign-in modal), dismiss it and retry.
- **macOS automation permissions.** First time only: macOS will prompt you to allow the MCP client to control Photoshop. Approve it in System Settings → Privacy & Security → Automation.

### "Parameters not valid" on `photoshop_select_subject` / `photoshop_select_sky` / `photoshop_remove_background`

These tools depend on Adobe's Sensei (cloud) AI features. The error usually means the Device-side model isn't downloaded.

In Photoshop: **Preferences → Image Processing → Cloud → Process Locally (Device)**, then close and reopen Photoshop.

### Something else

Open an issue at [github.com/editmamei/editmamei-ce/issues](https://github.com/editmamei/editmamei-ce/issues) — the bug report template will guide you through what to include. **Do not paste your license key in a public issue.**
