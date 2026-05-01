export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface Profile {
  id: string;
  name: string;
  childName?: string;
  hskLevel: HskLevel;
  interests: string[];
  totalRead: number;
  streakDays: number;
  lastReadDate: string;
  points: number;
  createdAt: number;
}

export interface AssessmentQuestion {
  id: string;
  type?: 'word_meaning';
  emoji?: string;
  word: string;
  options: string[];
  correctAnswer: string;
  chars: string[];
  correctIndex?: number;
}

export interface AssessmentResult {
  mastered: string[];
  weakChars: string[];
  hskLevel: HskLevel;
  score: number;
}

export interface QuizQuestion {
  id: string;
  type: 'word_meaning' | 'sentence_order' | 'fill_blank';
  word?: { word: string; pinyin: string; meaning: string };
  sentence?: string;
  options?: string[];
  correctAnswer: string | string[];
}

export interface ChineseWord {
  word: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  chars?: string[];
}

export interface Article {
  id?: string;
  title: string;
  content?: string;
  body?: string;
  wordCount: number;
  hskLevel: HskLevel;
  weakChars?: string[];
  newChars?: string[];
  words?: ChineseWord[];
  interestTags?: string[];
  generatedAt?: number;
  targetWords?: ChineseWord[];
}

export interface LearningTask {
  date: string;
  article: Article;
  quiz: QuizQuestion[];
}

export interface LexiconEntry {
  word: string;
  hskLevel: number;
  mastery: number;
  lastReviewed?: number;
  reviewCount?: number;
  correctCount?: number;
  incorrectCount?: number;
}
