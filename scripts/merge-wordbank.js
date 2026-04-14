#!/usr/bin/env node
/**
 * Merge per-level word bank JSON files into a single wordbank.json
 * Supports split files (e.g. words-b1-part1.json, words-b1-part2.json)
 * Usage: node scripts/merge-wordbank.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const OUT_FILE = path.join(__dirname, '..', 'public', 'data', 'wordbank.json');

// Find all word files (words-*.json)
const files = fs.readdirSync(DATA_DIR)
  .filter(f => f.startsWith('words-') && f.endsWith('.json'))
  .sort();

let all = [];
for (const file of files) {
  const filepath = path.join(DATA_DIR, file);
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    console.log(`  ${file}: ${data.length} words`);
    all = all.concat(data);
  } catch (err) {
    console.log(`  ${file}: error reading (${err.message})`);
  }
}

// Deduplicate by word (keep first occurrence)
const seen = new Set();
const deduped = [];
for (const entry of all) {
  const key = entry.word.toLowerCase();
  if (!seen.has(key)) {
    seen.add(key);
    deduped.push(entry);
  }
}

// Stats by level
const byLevel = {};
for (const entry of deduped) {
  byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
}

console.log(`\nTotal: ${all.length} → ${deduped.length} after dedup`);
console.log('By level:', byLevel);

fs.writeFileSync(OUT_FILE, JSON.stringify(deduped), 'utf-8');
console.log(`Written to ${OUT_FILE}`);
