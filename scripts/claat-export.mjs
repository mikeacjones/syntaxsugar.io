#!/usr/bin/env node

/**
 * Exports Google Codelabs using the `claat` tool.
 *
 * Usage:
 *   node scripts/claat-export.mjs <google-doc-id> [<google-doc-id> ...]
 *   node scripts/claat-export.mjs --all
 *
 * The --all flag re-exports all labs already present in public/lab-content/.
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const OUTPUT_DIR = resolve(import.meta.dirname, '..', 'public', 'lab-content');

function findClaat() {
  try {
    return execSync('which claat', { encoding: 'utf-8' }).trim();
  } catch {
    const goBin = join(process.env.HOME, 'go', 'bin', 'claat');
    if (existsSync(goBin)) return goBin;
    console.error(
      'Error: claat not found. Install it with:\n  go install github.com/googlecodelabs/tools/claat@latest'
    );
    process.exit(1);
  }
}

function getExistingDocIds() {
  if (!existsSync(OUTPUT_DIR)) return [];
  return readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const jsonPath = join(OUTPUT_DIR, d.name, 'codelab.json');
      if (!existsSync(jsonPath)) return null;
      const meta = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      return meta.source;
    })
    .filter(Boolean);
}

function exportDoc(claatPath, docId) {
  console.log(`Exporting ${docId}...`);
  try {
    execSync(`${claatPath} export -o ${OUTPUT_DIR} ${docId}`, {
      stdio: 'inherit',
    });
    const dirs = readdirSync(OUTPUT_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const dir of dirs) {
      const indexPath = join(OUTPUT_DIR, dir.name, 'index.html');
      const rawPath = join(OUTPUT_DIR, dir.name, 'raw.html');
      if (existsSync(indexPath)) {
        renameSync(indexPath, rawPath);
      }
    }
    console.log(`  Done.`);
  } catch (err) {
    console.error(`  Failed to export ${docId}:`, err.message);
  }
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node scripts/claat-export.mjs <google-doc-id> [...]');
  console.log('  node scripts/claat-export.mjs --all   (re-export existing labs)');
  process.exit(0);
}

const claatPath = findClaat();
console.log(`Using claat at: ${claatPath}`);
console.log(`Output dir: ${OUTPUT_DIR}\n`);

let docIds;
if (args.includes('--all')) {
  docIds = getExistingDocIds();
  if (docIds.length === 0) {
    console.log('No existing labs found to re-export.');
    process.exit(0);
  }
  console.log(`Re-exporting ${docIds.length} existing lab(s)...\n`);
} else {
  docIds = args;
}

for (const docId of docIds) {
  exportDoc(claatPath, docId);
}

console.log('\nAll done.');
