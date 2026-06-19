# Security policy

Editmamei is a Model Context Protocol (MCP) server that drives Adobe Photoshop. Like every MCP server, it executes scripts produced by an upstream AI assistant. Editmamei specifically exposes `photoshop_execute_script`, an explicit "escape hatch" tool that runs arbitrary ExtendScript inside Photoshop on the user's machine. **Editmamei's trust boundary is "the MCP client is trusted."** If that assumption is wrong on your setup, security findings against the package matter a great deal.

We take security reports seriously and want to make it easy to send one.

## How to report a vulnerability

**Please do NOT open a public GitHub issue for security-impacting bugs.** The issue tracker is public; the bug report would be too. Instead, choose one of:

- **GitHub Private Security Advisory** (preferred; handles disclosure timing for you): [Open an advisory](https://github.com/editmamei/editmamei-wiki/security/advisories/new). Pick the maturity (draft / collaborate / publish) that fits.
- **Email**: [security@editmamei.com](mailto:security@editmamei.com). PGP key on request.

Please include:

1. **A description of the issue:** what's affected and what an attacker could do.
2. **Reproduction steps:** minimal repro, ideally including the MCP client name and version, the OS, the Photoshop version, and the input that triggers it.
3. **Affected Editmamei version:** the output of `editmamei status` is a one-line summary that captures everything we need.
4. **Your disclosure preference:** happy to coordinate timing, credit you in the advisory, or keep your name out of it; tell us what you'd prefer.

We acknowledge reports within 3 business days, and aim to publish a patched release within 30 days of confirmation for issues at high or critical severity. We'll keep you in the loop throughout.

## Scope

In scope:

- The published `editmamei` npm package, all editions.
- The CLI subcommands (`editmamei install / uninstall / status / help`).
- The MCP tool surface, including `photoshop_execute_script`'s safety boundary.
- The session log + template system at `~/.editmamei/`.

Out of scope (for this package):

- Adobe Photoshop itself. Adobe has its own [security disclosure program](https://helpx.adobe.com/security.html).
- The AI client that hosts Editmamei (Claude Desktop, Cursor, Claude Code, etc.). Each vendor has its own disclosure process.
- Editmamei.com marketing site and infrastructure: separate disclosure path documented at [editmamei.com/security](https://editmamei.com/security).
- Already-disclosed issues already on this repo's [security advisories](https://github.com/editmamei/editmamei-wiki/security/advisories).

## What to expect

- **Acknowledgement** of your report within 3 business days.
- **Triage update** within 7 days: confirmed, not-reproduced, or needs-more-info.
- **Fix timeline** depends on severity; we'll communicate the plan and stick to it.
- **Credit** in the published advisory if you want it (and don't if you don't).

We don't currently run a paid bug bounty, but we're happy to send Editmamei swag (when it exists) and call out your work in the changelog + release notes.

Thank you for helping us keep Editmamei safe to use.
