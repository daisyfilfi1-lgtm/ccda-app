import { LexiconEntry, HskLevel, CharEntry } from './types';
import { getCharToWordIndex, extractChars } from './hsk';

// In-memory lexicon store (in production, this would be Supabase)
let inMemoryLexicon: Map<string, LexiconEntry> = new Map();
let inMemoryCharLexicon: Map<string, CharEntry> = new Map();

// QC feedback state
let lastQcFeedback: { weakWords: string[]; weakChars: string[]; accuracy: number } | null = null;

export function initLexicon(entries: LexiconEntry[] = []): void {
  inMemoryLexicon = new Map();
  entries.forEach(entry => {
    inMemoryLexicon.set(entry.word, entry);
  });
  inMemoryCharLexicon = new Map();
  lastQcFeedback = null;
}

export function getLexicon(): Map<string, LexiconEntry> {
  return inMemoryLexicon;
}

export function getCharLexicon(): Map<string, CharEntry> {
  return inMemoryCharLexicon;
}

export function getEntry(word: string): LexiconEntry | undefined {
  return inMemoryLexicon.get(word);
}

export function getOrCreateEntry(word: string, hskLevel: HskLevel): LexiconEntry {
  let entry = inMemoryLexicon.get(word);
  if (!entry) {
    entry = {
      word,
      hskLevel,
      mastery: 0,
      lastReviewed: Date.now(),
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      pendingWords: [],
      recentErrors: 0,
    };
    inMemoryLexicon.set(word, entry);
  }
  return entry;
}

/** Get or create a CharEntry for a single character */
export function getOrCreateCharEntry(char: string): CharEntry {
  let entry = inMemoryCharLexicon.get(char);
  if (!entry) {
    // Find which words contain this character
    const idx = getCharToWordIndex();
    const containedIn = idx.get(char) || [];
    entry = {
      char,
      mastery: 0,
      lastReviewed: Date.now(),
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      interval: 1,
      containedIn,
    };
    inMemoryCharLexicon.set(char, entry);
  }
  return entry;
}

// --- Interval-based spaced repetition ---

const MASTERY_THRESHOLD_MASTERED = 80;
const INTERVAL_MULTIPLIER = 2.0; // Each review doubles the interval
const MAX_INTERVAL = 90; // Cap at 90 days

function computeNextInterval(currentInterval: number, correct: boolean, mastery: number): number {
  if (!correct) {
    // Reset interval on wrong answer
    return 1;
  }
  if (mastery >= MASTERY_THRESHOLD_MASTERED) {
    // Double the interval as mastery increases
    return Math.min(MAX_INTERVAL, Math.max(1, Math.round(currentInterval * INTERVAL_MULTIPLIER)));
  }
  // Still learning, grow interval more gradually
  return Math.min(7, Math.max(1, Math.round(currentInterval * 1.5)));
}

function isReviewDue(entry: { lastReviewed: number; mastery: number; reviewCount: number; interval?: number }): boolean {
  if (entry.reviewCount === 0) return true;
  const interval = (entry as any).interval || 1;
  const dueTime = entry.lastReviewed + interval * 86400000;
  return Date.now() >= dueTime;
}

// --- Mastery update with interval-based decay ---

export function updateMasteryAfterQuiz(word: string, correct: boolean): void {
  const entry = inMemoryLexicon.get(word);
  if (!entry) return;

  entry.reviewCount++;
  if (correct) {
    entry.correctCount++;
    // Interval-based increase: larger gains when interval is well-spaced
    const interval = (entry as any).interval || 1;
    const gain = Math.min(20, 10 + Math.floor(interval * 2));
    entry.mastery = Math.min(100, entry.mastery + gain);
    entry.recentErrors = 0;
  } else {
    entry.incorrectCount++;
    entry.mastery = Math.max(0, entry.mastery - 15);
    entry.recentErrors = (entry.recentErrors || 0) + 1;
  }
  entry.lastReviewed = Date.now();
}

/** Update character mastery after a quiz */
export function updateCharMasteryAfterQuiz(char: string, correct: boolean): void {
  const entry = getOrCreateCharEntry(char);
  entry.reviewCount++;
  if (correct) {
    entry.correctCount++;
    const gain = Math.min(20, 10 + Math.floor(entry.interval * 2));
    entry.mastery = Math.min(100, entry.mastery + gain);
    entry.interval = computeNextInterval(entry.interval, true, entry.mastery);
  } else {
    entry.incorrectCount++;
    entry.mastery = Math.max(0, entry.mastery - 15);
    entry.interval = computeNextInterval(entry.interval, false, entry.mastery);
  }
  entry.lastReviewed = Date.now();
}

// --- PendingWords mechanism ---

/**
 * When a word's constituent chars reach mastery but the word hasn't been seen,
 * the word is added to the "pending" list and auto-activated for review.
 */
export function updatePendingWords(): void {
  const charIndex = getCharToWordIndex();
  
  // For each char that is mastered, find words that use it
  inMemoryCharLexicon.forEach((charEntry, ch) => {
    if (charEntry.mastery < MASTERY_THRESHOLD_MASTERED) return;
    
    const words = charIndex.get(ch) || [];
    for (const w of words) {
      const wordEntry = inMemoryLexicon.get(w);
      if (!wordEntry) continue;
      // If word is already mastered or seen enough, skip
      if (wordEntry.mastery >= MASTERY_THRESHOLD_MASTERED) continue;
      if (wordEntry.reviewCount <= 1) {
        // This word hasn't been actively reviewed yet — mark as pending
        if (!wordEntry.pendingWords) wordEntry.pendingWords = [];
        if (!wordEntry.pendingWords.includes(ch)) {
          wordEntry.pendingWords.push(ch);
        }
      }
    }
  });
}

/** Get pending words (chars mastered but word unseen) that should be activated */
export function getPendingWords(): LexiconEntry[] {
  updatePendingWords();
  const result: LexiconEntry[] = [];
  inMemoryLexicon.forEach((entry) => {
    if (entry.pendingWords && entry.pendingWords.length > 0 && entry.mastery < MASTERY_THRESHOLD_MASTERED) {
      result.push(entry);
    }
  });
  return result;
}

/** Activate pending words — give them a boost so they appear in review sooner */
export function activatePendingWords(): void {
  const pending = getPendingWords();
  for (const entry of pending) {
    // Boost mastery slightly so it appears in reviews
    const boostPerChar = Math.min(20, (entry.pendingWords?.length || 0) * 5);
    entry.mastery = Math.min(100, Math.max(5, entry.mastery + boostPerChar));
    entry.pendingWords = [];
  }
}

// --- Review selection with interval awareness ---

export function getReviewWords(dueCount: number = 5): LexiconEntry[] {
  const now = Date.now();
  const entries = Array.from(inMemoryLexicon.values());
  
  // Activate pending words first
  activatePendingWords();
  
  // Filter: words that are due for review or never reviewed
  const dueEntries = entries.filter(e => isReviewDue(e));
  
  // Sort by: unreviewed first, then lowest mastery, then oldest review
  dueEntries.sort((a, b) => {
    if (a.reviewCount === 0 && b.reviewCount > 0) return -1;
    if (b.reviewCount === 0 && a.reviewCount > 0) return 1;
    if (a.mastery !== b.mastery) return a.mastery - b.mastery;
    return a.lastReviewed - b.lastReviewed;
  });

  // If not enough due words, include some from the non-due pool (low mastery ones)
  if (dueEntries.length < dueCount) {
    const nonDue = entries
      .filter(e => !isReviewDue(e))
      .sort((a, b) => a.mastery - b.mastery);
    return [...dueEntries, ...nonDue].slice(0, dueCount);
  }

  return dueEntries.slice(0, dueCount);
}

// --- QC feedback integration ---

export function setQcFeedback(feedback: { weakWords: string[]; weakChars: string[]; accuracy: number } | null): void {
  lastQcFeedback = feedback;
}

export function getQcFeedback(): { weakWords: string[]; weakChars: string[]; accuracy: number } | null {
  return lastQcFeedback;
}

/**
 * Get SRS adaptation parameters based on QC feedback.
 * Returns factors to adjust new word density and weak char repetition.
 */
export function getQcAdaptation(): { newWordDensity: number; weakCharBoost: number } {
  if (!lastQcFeedback || lastQcFeedback.accuracy >= 0.7) {
    return { newWordDensity: 1.0, weakCharBoost: 0 };
  }
  // Quality issue: reduce new words, increase weak char repetition
  const severity = Math.max(0, Math.min(1, (0.7 - lastQcFeedback.accuracy) / 0.5));
  const newWordDensity = Math.max(0.3, 1.0 - severity * 0.7);
  const weakCharBoost = Math.round(severity * 3); // 0-3 extra weak char repetitions
  return { newWordDensity, weakCharBoost };
}

/** Get weak chars that need extra review based on QC feedback */
export function getWeakChars(): string[] {
  if (!lastQcFeedback) return [];
  return lastQcFeedback.weakChars.filter(ch => {
    const entry = inMemoryCharLexicon.get(ch);
    return !entry || entry.mastery < MASTERY_THRESHOLD_MASTERED;
  });
}

// --- Stats ---

export function getMasteryStats(): { mastered: number; learning: number; new: number } {
  const entries = Array.from(inMemoryLexicon.values());
  return {
    mastered: entries.filter(e => e.mastery >= 80).length,
    learning: entries.filter(e => e.mastery > 0 && e.mastery < 80).length,
    new: entries.filter(e => e.mastery === 0).length,
  };
}

export function getCharMasteryStats(): { mastered: number; learning: number; new: number } {
  const entries = Array.from(inMemoryCharLexicon.values());
  return {
    mastered: entries.filter(e => e.mastery >= 80).length,
    learning: entries.filter(e => e.mastery > 0 && e.mastery < 80).length,
    new: entries.filter(e => e.mastery === 0).length,
  };
}

export function getWordCloud(): { word: string; mastery: number }[] {
  return Array.from(inMemoryLexicon.values()).map(e => ({
    word: e.word,
    mastery: e.mastery,
  }));
}

export function getCharCloud(): { char: string; mastery: number }[] {
  return Array.from(inMemoryCharLexicon.values()).map(e => ({
    char: e.char,
    mastery: e.mastery,
  }));
}
