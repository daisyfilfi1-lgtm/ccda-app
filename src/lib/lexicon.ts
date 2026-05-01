import { LexiconEntry, HskLevel } from './types';

// In-memory lexicon store (in production, this would be Supabase)
let inMemoryLexicon: Map<string, LexiconEntry> = new Map();

export function initLexicon(entries: LexiconEntry[] = []): void {
  inMemoryLexicon = new Map();
  entries.forEach(entry => {
    inMemoryLexicon.set(entry.word, entry);
  });
}

export function getLexicon(): Map<string, LexiconEntry> {
  return inMemoryLexicon;
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
    };
    inMemoryLexicon.set(word, entry);
  }
  return entry;
}

export function updateMasteryAfterQuiz(word: string, correct: boolean): void {
  const entry = inMemoryLexicon.get(word);
  if (!entry) return;

  entry.reviewCount = (entry.reviewCount || 0) + 1;
  if (correct) {
    entry.correctCount = (entry.correctCount || 0) + 1;
    entry.mastery = Math.min(100, entry.mastery + 10);
  } else {
    entry.incorrectCount = (entry.incorrectCount || 0) + 1;
    entry.mastery = Math.max(0, entry.mastery - 5);
  }
  entry.lastReviewed = Date.now();
}

export function getReviewWords(dueCount: number = 5): LexiconEntry[] {
  const now = Date.now();
  const entries = Array.from(inMemoryLexicon.values());
  
  // Sort by: lowest mastery first, then oldest review
  entries.sort((a, b) => {
    // Unreviewed words first
    if ((a.reviewCount || 0) === 0 && (b.reviewCount || 0) > 0) return -1;
    if ((b.reviewCount || 0) === 0 && (a.reviewCount || 0) > 0) return 1;
    // Then by mastery (lowest first)
    if (a.mastery !== b.mastery) return a.mastery - b.mastery;
    // Then by oldest review
    return (a.lastReviewed || 0) - (b.lastReviewed || 0);
  });

  return entries.slice(0, dueCount);
}

export function getMasteryStats(): { mastered: number; learning: number; new: number } {
  const entries = Array.from(inMemoryLexicon.values());
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
