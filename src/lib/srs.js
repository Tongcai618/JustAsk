/**
 * Simplified SM-2 spaced repetition scheduler.
 *
 * Progress entry per word:
 *   { interval, easeFactor, reviewCount, nextReview, lastRating, lastReviewed, dismissed }
 *
 * Rating: 'again' | 'later' | 'dismiss'
 */

const MIN_EASE = 1.3;
const INITIAL_EASE = 2.5;

/**
 * Calculate the next review schedule after a rating.
 * Returns an updated progress entry.
 */
export function scheduleReview(entry, rating) {
  const now = new Date().toISOString();
  const prev = entry || {
    interval: 0,
    easeFactor: INITIAL_EASE,
    reviewCount: 0,
  };

  let { interval, easeFactor, reviewCount } = prev;

  if (rating === 'again') {
    // Review in 4 hours — still learning
    interval = 0;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  } else if (rating === 'later') {
    // Medium interval — seen before, not sure yet
    if (reviewCount === 0) {
      interval = 2;
    } else {
      interval = Math.max(2, Math.round(interval * 1.2));
    }
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.05);
  } else {
    // dismiss — don't show for 180 days
    interval = 180;
    easeFactor = Math.max(MIN_EASE, easeFactor + 0.1);
  }

  // Cap interval at 365 days
  interval = Math.min(interval, 365);

  const nextDate = new Date();
  if (rating === 'again') {
    nextDate.setHours(nextDate.getHours() + 4);
  } else {
    nextDate.setDate(nextDate.getDate() + interval);
  }

  return {
    interval,
    easeFactor,
    reviewCount: reviewCount + 1,
    nextReview: nextDate.toISOString(),
    lastRating: rating,
    lastReviewed: now,
    dismissed: rating === 'dismiss',
  };
}

/**
 * Get the selection weight for a word based on how soon it's due.
 * Returns 0–1. Overdue = 1.0, never studied = 0.5, dismissed = 0.
 */
export function getWordWeight(entry) {
  if (!entry) return 0.5; // never studied — neutral weight
  if (entry.dismissed) return 0;

  const now = new Date();
  const nextReview = new Date(entry.nextReview);
  const daysUntilDue = (nextReview - now) / (1000 * 60 * 60 * 24);

  if (daysUntilDue <= 0) return 1.0; // overdue
  if (daysUntilDue >= 90) return 0;  // very far out — treat as dismissed

  return Math.exp(-0.1 * daysUntilDue); // smooth decay
}

/**
 * Check if a word is due for review.
 */
export function isDueForReview(entry) {
  if (!entry || !entry.nextReview) return false;
  return new Date() >= new Date(entry.nextReview);
}

/**
 * Get all words due for review from a progress object.
 * Returns an array of word strings.
 */
export function getDueWords(progress) {
  if (!progress || !progress.words) return [];
  return Object.keys(progress.words).filter((word) =>
    isDueForReview(progress.words[word]),
  );
}

/**
 * Create a fresh progress object.
 */
export function createEmptyProgress() {
  return {
    words: {},
    stats: {
      totalLearned: 0,
      streak: 0,
      lastStudyDate: null,
      ratings: { again: 0, later: 0, dismiss: 0 },
    },
  };
}

/**
 * Update stats after a rating.
 */
export function updateStats(progress, rating) {
  const stats = { ...progress.stats };
  const today = new Date().toISOString().split('T')[0];

  stats.ratings = { ...stats.ratings };
  stats.ratings[rating] = (stats.ratings[rating] || 0) + 1;

  if (stats.lastStudyDate === today) {
    // Same day, streak stays
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.lastStudyDate === yesterdayStr) {
      stats.streak = (stats.streak || 0) + 1;
    } else if (stats.lastStudyDate !== today) {
      stats.streak = 1;
    }
  }

  stats.lastStudyDate = today;
  return stats;
}
