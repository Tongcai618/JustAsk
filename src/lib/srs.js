/**
 * Simplified SM-2 spaced repetition scheduler.
 *
 * Progress entry per word:
 *   { interval, easeFactor, reviewCount, nextReview, lastRating, lastReviewed }
 *
 * Rating: 'hard' | 'okay' | 'easy'
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

  if (rating === 'easy') {
    if (reviewCount === 0) {
      interval = 7; // first time: 7 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
    easeFactor = Math.max(MIN_EASE, easeFactor + 0.15);
  } else if (rating === 'okay') {
    if (reviewCount === 0) {
      interval = 2;
    } else {
      interval = Math.max(2, Math.round(interval * 1.2));
    }
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.05);
  } else {
    // hard
    interval = 0; // review same day (4 hours from now)
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  }

  // Cap interval at 365 days
  interval = Math.min(interval, 365);

  const nextDate = new Date();
  if (rating === 'hard') {
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
  };
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
      ratings: { hard: 0, okay: 0, easy: 0 },
    },
  };
}

/**
 * Update stats after a rating.
 */
export function updateStats(progress, rating) {
  const stats = { ...progress.stats };
  const today = new Date().toISOString().split('T')[0];

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
