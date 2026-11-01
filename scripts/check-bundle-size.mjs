#!/usr/bin/env node
/**
 * Bundle-size budget check. Run after `npm run build`.
 * Fails (exit 1) when the gzip size of the JS in dist/assets exceeds a budget.
 *
 * Override with BUNDLE_BUDGET_TOTAL_KB / BUNDLE_BUDGET_ENTRY_KB.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ASSETS_DIR = 'dist/assets';
const TOTAL_BUDGET_KB = Number(process.env.BUNDLE_BUDGET_TOTAL_KB ?? 180);
const ENTRY_BUDGET_KB = Number(process.env.BUNDLE_BUDGET_ENTRY_KB ?? 125);

function gzipKb(file) {
  return gzipSync(readFileSync(file), { level: 9 }).length / 1024;
}

let files;
try {
  files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.js'));
} catch {
  console.error(`No ${ASSETS_DIR} directory found. Run "npm run build" first.`);
  process.exit(1);
}
if (files.length === 0 || files.every((f) => !statSync(join(ASSETS_DIR, f)).isFile())) {
  console.error(`No JavaScript bundles found in ${ASSETS_DIR}.`);
  process.exit(1);
}

const sizes = files
  .map((name) => ({ name, kb: gzipKb(join(ASSETS_DIR, name)) }))
  .sort((a, b) => b.kb - a.kb);
const total = sizes.reduce((sum, s) => sum + s.kb, 0);
const entry = sizes.find((s) => s.name.startsWith('index-')) ?? sizes[0];

for (const s of sizes) console.log(`${s.kb.toFixed(1).padStart(7)} kB gzip  ${s.name}`);
console.log(`\nTotal JS: ${total.toFixed(1)} kB gzip (budget ${TOTAL_BUDGET_KB} kB)`);
console.log(`Entry chunk: ${entry.kb.toFixed(1)} kB gzip (budget ${ENTRY_BUDGET_KB} kB)`);

const failures = [];
if (total > TOTAL_BUDGET_KB) failures.push(`total JS exceeds ${TOTAL_BUDGET_KB} kB`);
if (entry.kb > ENTRY_BUDGET_KB) failures.push(`entry chunk exceeds ${ENTRY_BUDGET_KB} kB`);
if (failures.length > 0) {
  console.error(`\nBundle budget exceeded: ${failures.join('; ')}.`);
  process.exit(1);
}
console.log('\nBundle size within budget.');
