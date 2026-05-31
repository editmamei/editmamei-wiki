# Installation

Editmamei is distributed as an npm package. The `editmamei install` subcommand detects which MCP clients you have and writes the appropriate config for each — Claude Desktop, Cursor, and Claude Code in one pass. Manual configuration is still documented below as a fallback.

---

## Requirements

- **Node.js** 20 or later — [nodejs.org](https://nodejs.org/)
- **Adobe Photoshop** 2022 or later (2024+ recommended for full feature coverage; some selection tools require 2024+)
- **Operating system:** Windows 10/11 or macOS 12+
- An **MCP-compatible client** — at least one of:
  - [Claude Desktop](https://claude.ai/download)
  - [Cursor](https://cursor.com/)
  - [Claude Code](https://claude.ai/code)

Check your Node.js version:

```bash
node --version
```

If you see `v20.x` or higher, you're good.

---

## Install the package

```bash
npm install -g editmamei
```

This installs the `editmamei` CLI globally.

---

## Register with your MCP client(s)

```bash
editmamei install
```

`editmamei install` runs against every supported client in one pass and prints a per-client result line. The clients today are:

| Client | Detection | Config touched |
|---|---|---|
| **Claude Desktop** | always written (canonical client) | `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) |
| **Cursor** | written if `~/.cursor/` exists or `cursor` is on your PATH | `~/.cursor/mcp.json` |
| **Claude Code** | written if the `claude` binary is on your PATH | uses `claude mcp add --scope user editmamei -- npx -y editmamei` under the hood |

For each detected client, the command:

1. Reads the existing config (refuses to overwrite if the JSON is malformed — fix that first).
2. Backs up the existing file to `<config>.bak` only if no `.bak` is already there. The pre-install state is more valuable than any of our own first-run output, so a second install never clobbers the original backup.
3. Adds an `editmamei` entry to `mcpServers`, or no-ops if the entry already matches. Any env vars you've hand-added to the `editmamei` entry (e.g. `LOG_LEVEL`) are preserved — install only overrides the keys it explicitly sets.

If a client isn't detected, that line is reported as "skipped" — it doesn't abort the run.

Restart your AI client(s) after this completes — config changes only take effect on a fresh boot.

### Options

- `--dev` — register the locally-built binary at the path you're invoking from instead of `npx -y editmamei`. Used for testing local changes.
- `--photoshop-path <path>` — bake an absolute path to your Photoshop binary into the MCP server entry as the `PHOTOSHOP_PATH` env var, across every detected client. Use when Photoshop is installed somewhere the auto-detector can't find (custom drive letter, side-by-side installs, beta tracks, etc.). Example:

  ```bash
  editmamei install --photoshop-path "D:\\Adobe\\Photoshop 2025\\Photoshop.exe"
  ```

  Equivalent to hand-editing `env: { "PHOTOSHOP_PATH": "..." }` into the `editmamei` entry of every config the install touches.

### Check your install state

```bash
editmamei status
```

Reports, per client, whether Editmamei is registered and what command would launch it. Run this when troubleshooting.

---

## Manual configuration

If `editmamei install` couldn't reach one of your clients — for example, because the `claude` binary isn't on your PATH, or you're using a different MCP-compatible client — register Editmamei by hand.

### Claude Desktop

Edit `claude_desktop_config.json`:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add an entry under `mcpServers`:

```json
{
  "mcpServers": {
    "editmamei": {
      "command": "npx",
      "args": ["-y", "editmamei", "serve"]
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json` (create if it doesn't exist):

```json
{
  "mcpServers": {
    "editmamei": {
      "command": "npx",
      "args": ["-y", "editmamei", "serve"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add editmamei -- npx -y editmamei serve
```

---

## Photoshop preferences

Open Photoshop and confirm:

1. **Edit → Preferences → Scripting and Actions** — scripting is enabled
2. Have at least one document open (or be ready to ask the AI to create one)

The AI talks to whatever instance of Photoshop is currently running — Photoshop must be open before you start a session.

### Optional: pin a specific Photoshop install

Editmamei auto-detects Photoshop. If you have multiple versions installed and want to pin a specific one, set the `PHOTOSHOP_PATH` env var in your MCP client config:

```json
{
  "mcpServers": {
    "editmamei": {
      "command": "npx",
      "args": ["-y", "editmamei", "serve"],
      "env": {
        "PHOTOSHOP_PATH": "C:\\Program Files\\Adobe\\Adobe Photoshop 2025\\Photoshop.exe"
      }
    }
  }
}
```

---

## Verify

Restart your MCP client. Editmamei tools should appear in the available-tools list (in Claude Desktop, that's the slider icon at the bottom of the chat input).

Test with the ping:

> "Is Photoshop connected? What version?"

You should see your Photoshop version returned. If not, see [getting-started.md](getting-started.md) for troubleshooting.

---

## Upgrade

```bash
npm update -g editmamei
```

Restart your MCP client to pick up the new version. Your existing templates and session logs at `~/.editmamei/` are preserved across upgrades.

---

## Uninstall

```bash
editmamei uninstall
npm uninstall -g editmamei
```

The `uninstall` subcommand removes Editmamei from your MCP client configs. The `npm uninstall` removes the package itself. Your per-user data at `~/.editmamei/` (templates, session logs) is left in place — delete it manually if you don't want it.

---

## Pro

Pro activation lands with the v1.0 launch — see [pro-features.md](pro-features.md) for what Pro adds and [roadmap.md](roadmap.md) for status.
