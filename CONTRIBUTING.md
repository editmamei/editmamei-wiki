# Contributing to Editmamei

Thanks for thinking about contributing. This guide explains what's open to outside contributions and how to file the kind of issue or PR that helps us help you.

## What this repo is

**This repo is the public face of Editmamei.** It hosts:

- The README and brand narrative.
- The user-facing docs at `docs/` (installation, getting started, FAQ, privacy, Pro features, roadmap).
- The CHANGELOG.
- Issue templates for bug reports and feature requests.
- The security disclosure policy.

It is **not** the source for the npm package. The Editmamei MCP server itself (every tool, every ExtendScript snippet, every test) lives in a private source tree. The compiled artifact is published to npm as `editmamei`.

This means contribution paths look a little different from a typical open-source project. Read on.

## How to contribute

### Filing a bug report

Bug reports against the npm package are gold. They're the single best way to improve Editmamei.

1. Search [existing issues](https://github.com/editmamei/editmamei-wiki/issues?q=is%3Aissue) first to avoid duplicates.
2. Pick the **Bug report** template when opening a new issue.
3. Fill in everything the template asks for, especially:
   - The output of `editmamei status` (captures Editmamei version, OS, Node, detected Photoshop install, MCP client config state in one line).
   - The Photoshop version you're running.
   - Which MCP client (Claude Desktop, Cursor, Claude Code).
   - A minimal repro: a one-shot prompt that reliably triggers the issue is best.
   - The relevant slice of your session log at `~/.editmamei/sessions/<session-id>.ndjson`. **Scrub it first:** paths in there can contain your username and folder names you might not want public.

The bug template enforces these one-by-one so you don't have to remember.

**Please do not paste your license key, full file paths from sensitive projects, or screenshots of unfinished client work.** Issues here are public.

### Filing a feature request

Pick the **Feature request** template. Tell us:

- What you're trying to accomplish (the workflow, not just the tool).
- What's blocking you with the current surface.
- Whether you'd consider it Community-tier or Pro-tier (helps us scope).

Feature requests inform the [roadmap](docs/roadmap.md). We can't promise dates, but we read every request.

### Filing a security report

**Do not file security issues in the public tracker.** See [SECURITY.md](SECURITY.md) for the disclosure process: GitHub Private Security Advisory or `security@editmamei.com` (PGP key on request).

## Docs PRs: what is open

The docs in this repo (`README.md`, `CHANGELOG.md`, `docs/*.md`, the issue templates) are open to PRs. Some good targets:

- **Fixing typos, broken links, outdated screenshots:** open a PR directly.
- **Clarifying confusing wording:** open an issue first so we can talk about the right framing.
- **Adding a new doc page** (e.g. an FAQ entry, a new troubleshooting note): open an issue first so we don't both write the same content.

If your PR is more than a one-line typo fix, please:

1. Match the existing voice. We aim for direct, lowercase-y, low-on-marketing-speak; read a couple of existing pages to feel the tone.
2. Don't break the brand frame. The H1 stays "Unlock Photoshop with natural-language photo editing"; the subhead stays "AI orchestration, not generation." If you're proposing changes to either, open an issue first.
3. Don't reintroduce absolute privacy claims (e.g. "no cloud", "no telemetry"). Privacy claims here are scoped to what the npm package itself does, with explicit acknowledgement that the AI client is a cloud service. See [`docs/faq.md`](docs/faq.md) for the current framing.

## What is NOT open to PRs from this repo

- The npm package source. It's not here. PRs against a `src/` directory cannot be merged because that directory doesn't exist in this repo.
- License terms. The proprietary license on the npm package is what it is. Discussions are welcome via issues; PR-changing the license is out of scope.

If you want to contribute code changes, the highest-leverage path is to file a really good bug report or feature request with a clear repro + workflow context. The maintainer team can then land the change in the private source tree and credit you in the next release.

## What you can expect from us

- We acknowledge issues within 7 days, usually faster.
- We tag, prioritize, and respond on triage state visibly.
- For accepted changes, we credit reporters in the CHANGELOG and (where appropriate) the release notes.
- We say no clearly when we mean no; there's nothing worse than a stale "we'll get to it" promise. If a feature is out of scope, we'll say so and explain why.

## Code of conduct

There isn't a formal code-of-conduct document yet. The short version: **be decent**. Disagreements are fine; productive engineering depends on them. Personal attacks, harassment, or bad-faith engagement aren't, and we'll close issues or block contributors who go that route. If you experience or witness conduct you think falls afoul of this, email [support@editmamei.com](mailto:support@editmamei.com).

## Thanks

Editmamei exists in its current shape because users have told us, in detail, what's working and what isn't. We're grateful for every report and feature request; they're the input the project runs on.
