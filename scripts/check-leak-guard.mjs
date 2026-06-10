#!/usr/bin/env node
/**
 * Leak guard for editmamei-ce (public docs + issue tracker).
 *
 * Fails if any 'dev' or 'none'-tier tool name from Editmamei (the
 * private source repo's src/core/tool-tiers.ts) appears in the
 * publicly-published documentation here. Catches the install-guide
 * / API-reference / code-example leak class — i.e. tipping a tool
 * that's not actually shipping in the CE / Pro bundles yet.
 *
 * The BLOCKED list below is HAND-MAINTAINED and must be kept in
 * sync with Editmamei/src/core/tool-tiers.ts (entries marked 'dev'
 * or 'none'). When you flip a tier in Editmamei, also update the
 * blocklists in:
 *   - editmamei-ce/scripts/check-leak-guard.mjs   (this file)
 *   - editmamei-web/scripts/check-leak-guard.mjs
 *
 * Run locally: `node scripts/check-leak-guard.mjs`
 * Runs in CI via .github/workflows/leak-guard.yml on every push / PR.
 *
 * Narrow-scope check by design: only matches the literal `photoshop_*`
 * tool identifiers, NOT human-facing feature names like "Color Range"
 * or "High Pass" (those overlap with legitimate marketing copy + PS UI
 * concepts the docs can reasonably discuss without claiming the tool
 * is shipping). Marketing-copy leakage is gated by manual review at
 * tier-flip time per docs/20260603-tool-tier-process.md in Editmamei.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SELF_PATH = fileURLToPath(import.meta.url);

// === BEGIN AUTO-GENERATED BLOCKED (sync-leak-guard.ts) ===
// Auto-generated from Editmamei/src/core/tool-tiers.ts (entries
// classified 'dev' or 'none'). Do NOT hand-edit — re-run
// `npm run sync:leak-guard` from Editmamei to refresh.
// Source: 6 dev/none tier names at sync time.
const BLOCKED = [
  'photoshop_apply_brush_stroke',
  'photoshop_apply_color_lookup',
  'photoshop_apply_lens_blur',
  'photoshop_create_clipping_mask',
  'photoshop_release_clipping_mask',
  'photoshop_select_color_range',
];
// === END AUTO-GENERATED BLOCKED ===

// NOTE on CHANGELOG.md scope (2026-06-05): CHANGELOG.md is intentionally
// excluded from this scan. It's auto-generated from the private-source
// CHANGELOG via Editmamei/scripts/sync-changelogs.ts, which has its OWN
// leak guard at the boundary that matters (the editmamei-web landing-page
// cards). The CE changelog is honest release-history disclosure — bullets
// under H4 subsections labeled "...dev tier..." or "Fixes to dev-tier
// tools..." mention tool names in context as "these were added/fixed but
// stayed at dev tier." That's the OPPOSITE of marketing tipping; the
// reader knows the tools aren't in the shipped surface. Re-adding
// CHANGELOG.md to this scan would require the sync script to strip every
// such bullet from CE, which loses the disclosure value.
const SCAN_ROOTS = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'docs'];

const EXCLUDED_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.pdf',
  '.zip',
  '.lock',
]);

function* walk(start) {
  const fullStart = resolve(REPO_ROOT, start);
  let s;
  try {
    s = statSync(fullStart);
  } catch {
    return;
  }
  if (s.isFile()) {
    yield fullStart;
    return;
  }
  if (!s.isDirectory()) return;
  for (const entry of readdirSync(fullStart)) {
    yield* walk(join(fullStart, entry));
  }
}

const leaks = [];
for (const root of SCAN_ROOTS) {
  for (const file of walk(root)) {
    if (file === SELF_PATH) continue;
    if (EXCLUDED_EXTS.has(extname(file).toLowerCase())) continue;
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const blocked of BLOCKED) {
        if (lines[i].includes(blocked)) {
          leaks.push({ file: relative(REPO_ROOT, file), line: i + 1, tool: blocked });
        }
      }
    }
  }
}

if (leaks.length > 0) {
  console.error(`\nLEAK GUARD FAILED — ${leaks.length} reference(s) to dev/none-tier tools:\n`);
  for (const l of leaks) {
    console.error(`  ${l.file}:${l.line}  →  ${l.tool}`);
  }
  console.error(
    `\nThese tool names are at tier 'dev' or 'none' in ` +
      `Editmamei/src/core/tool-tiers.ts and must NOT appear in the public ` +
      `docs surface. Either:\n` +
      `  (a) promote the tool to 'community' / 'pro' in Editmamei (with ` +
      `live-verification evidence per docs/20260603-tool-tier-process.md), or\n` +
      `  (b) strip the mention from this repo until the tool is promoted.\n`
  );
  process.exit(1);
}

console.log(`Leak guard OK — none of ${BLOCKED.length} blocked names found in public docs.`);
