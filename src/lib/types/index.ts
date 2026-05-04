export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface ChineseWord {
  word: string;
  pinyin: string;
  meaning: string;
  hskLevel: HskLevel;
  strokes?: number;
  examples?: string[];
}

export interface LexiconEntry {
  word: string;
  hskLevel: HskLevel;
  mastery: number; // 0-100
  lastReviewed: number; // timestamp
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  /** Pending words that use chars already mastered but the word itself hasn't been seen */
  pendingWords?: string[];
  /** QC feedback: number of recent consecutive incorrect answers */
  recentErrors?: number;
}

/** Per-character tracking state */
export interface CharEntry {
  char: string;
  mastery: number; // 0-100
  lastReviewed: number;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  /** Interval in days before next review (for spaced repetition) */
  interval: number;
  /** Words that contain this character */
  containedIn: string[];
}

export interface Profile {
  id: string;
  name: string;
  hskLevel: HskLevel;
  interests: string[];
  totalRead: number;
  streakDays: number;
  lastReadDate: string; // YYYY-MM-DD
  points: number;
  createdAt: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  words: ChineseWord[];
  hskLevel: HskLevel;
  interestTags: string[];
  generatedAt: number;
  wordCount: number;
  characterCount: number;
  pinyinAnnotated?: boolean;
}

export type QuizQuestionType = 'weak_word' | 'listening' | 'context_cloze';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  word?: ChineseWord;
  options: string[];
  correctAnswer: string;
  /** For weak_word Q1: the character/word prompt, or sentence context */
  prompt?: string;
  /** For listening Q2: text to speak via TTS */
  audioText?: string;
  /** For listening Q2: question to display (HSK 4+) */
  questionText?: string;
  /** For listening Q2 HSK 1-3: true/false mode */
  isTrueFalse?: boolean;
  /** For context_cloze Q3: full sentence with ____ */
  sentence?: string;
}

export interface DailySession {
  id: string;
  date: string;
  article: Article;
  quiz: QuizQuestion[];
  completed: boolean;
  score: number;
  timeSpent: number;
  wordsLearned: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  requirement: string;
  unlockedAt?: number;
}

export interface AppState {
  profile: Profile | null;
  currentSession: DailySession | null;
  badges: Badge[];
  loading: boolean;
  error: string | null;
}

// Assessment types
export interface AssessmentQuestion {
  id: number;
  emoji: string;
  word: string;
  options: string[];
  correctIndex: number;
  hskLevel: HskLevel;
}

export interface AssessmentResult {
  completed: boolean;
  estimatedHskLevel: HskLevel;
  correctCount: number;
  totalQuestions: number;
  answers: { questionId: number; correct: boolean }[];
}

/** QC feedback data that SRS can use to adjust generation */
export interface QcFeedback {
  /** Words that were answered incorrectly */
  weakWords: string[];
  /** Characters that were answered incorrectly */
  weakChars: string[];
  /** Overall accuracy (0-1) */
  accuracy: number;
  /** Whether the session quality is below threshold */
  qualityIssue: boolean;
}
