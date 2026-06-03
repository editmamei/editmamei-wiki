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

// Keep in sync with Editmamei/src/core/tool-tiers.ts dev/none entries.
// Last sync: 2026-06-03 (Editmamei commit b1a6828).
const BLOCKED = [
  'photoshop_apply_color_lookup',
  'photoshop_apply_lens_blur',
  'photoshop_select_color_range',
  'photoshop_create_layer_mask',
  'photoshop_apply_shadows_highlights',
  'photoshop_apply_smart_sharpen',
  'photoshop_apply_reduce_noise',
  'photoshop_apply_high_pass',
  'photoshop_apply_equalize',
];

const SCAN_ROOTS = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', 'docs'];

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
