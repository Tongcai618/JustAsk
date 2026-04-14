/**
 * Word Bank utility — load, filter, search, and pick random words.
 *
 * Each entry in the word bank has:
 *   word, pos, level, difficulty, translation, pronunciation, frequency, tags
 */

let words = [];

/** Load the word bank JSON (call once at startup) */
export async function loadWordBank() {
  if (words.length > 0) return words;
  const res = await fetch('data/wordbank.json');
  words = await res.json();
  return words;
}

/** Get all loaded words */
export function getWords() {
  return words;
}

/** Filter by CEFR level (A1, A2, B1, B2, C1) or 'All' */
export function filterByLevel(level) {
  if (!level || level === 'All') return words;
  return words.filter((w) => w.level === level);
}

/** Filter by difficulty (Simple, Medium, Hard) */
export function filterByDifficulty(difficulty) {
  return words.filter((w) => w.difficulty === difficulty);
}

/** Filter by tag */
export function filterByTag(tag) {
  return words.filter((w) => w.tags && w.tags.includes(tag));
}

/** Search by word (prefix match) */
export function searchWords(query) {
  const q = query.toLowerCase();
  return words.filter((w) => w.word.toLowerCase().startsWith(q));
}

/** Pick a random word, optionally filtered by level */
export function pickRandom(level) {
  const pool = filterByLevel(level);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Pick N random words without duplicates, optionally filtered by level */
export function pickRandomN(n, level) {
  const pool = filterByLevel(level);
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/** Get a word by exact match */
export function getWord(word) {
  return words.find((w) => w.word.toLowerCase() === word.toLowerCase());
}

/** Get stats about the word bank */
export function getStats() {
  const levels = {};
  for (const w of words) {
    levels[w.level] = (levels[w.level] || 0) + 1;
  }
  return { total: words.length, byLevel: levels };
}
