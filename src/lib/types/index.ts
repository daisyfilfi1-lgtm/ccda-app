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

/**
 * GradeConfig — 三级九等: controls sentence complexity, vocab density, plot depth, abstraction.
 * tier: 1-3  (初等/中等/高等 within the band)
 */
export interface GradeConfig {
  tier: 1 | 2 | 3;
  maxNewWords: number;
  avgSentenceLength: number;  // target average characters per sentence
  plotDepth: 1 | 2 | 3;       // 1=单线 2=两段 3=三段+
  useSubplot: boolean;
  abstractionLevel: 1 | 2 | 3; // 1=具体事物 2=感受道理 3=抽象概念
  weakCharTarget: number;      // weak chars to reinforce in this article
}

/**
 * Generate GradeConfig from HSK level.
 * HSK 1-3 → 初级 (tier maps: 1→1, 2→2, 3→3)
 * HSK 4-6 → 中级 (tier maps: 4→1, 5→2, 6→3)
 * HSK 7-9 → 高级 (tier maps: 7→1, 8→2, 9→3)
 */
export function getGradeConfig(hskLevel: HskLevel): GradeConfig {
  if (hskLevel <= 3) {
    const tier = hskLevel as 1 | 2 | 3;
    return {
      tier,
      maxNewWords: tier === 1 ? 3 : tier === 2 ? 4 : 5,
      avgSentenceLength: tier === 1 ? 8 : tier === 2 ? 11 : 14,
      plotDepth: tier === 1 ? 1 : tier === 2 ? 2 : 2,
      useSubplot: false,
      abstractionLevel: 1,
      weakCharTarget: tier === 1 ? 1 : tier === 2 ? 2 : 3,
    };
  } else if (hskLevel <= 6) {
    const innerTier = (hskLevel - 3) as 1 | 2 | 3;
    return {
      tier: innerTier,
      maxNewWords: innerTier === 1 ? 5 : innerTier === 2 ? 6 : 8,
      avgSentenceLength: innerTier === 1 ? 14 : innerTier === 2 ? 18 : 22,
      plotDepth: innerTier === 1 ? 2 : innerTier === 2 ? 3 : 3,
      useSubplot: innerTier !== 1,
      abstractionLevel: innerTier === 1 ? 1 : innerTier === 2 ? 2 : 2,
      weakCharTarget: innerTier === 1 ? 3 : innerTier === 2 ? 4 : 5,
    };
  } else {
    const innerTier = (hskLevel - 6) as 1 | 2 | 3;
    return {
      tier: innerTier,
      maxNewWords: innerTier === 1 ? 8 : innerTier === 2 ? 10 : 12,
      avgSentenceLength: innerTier === 1 ? 24 : innerTier === 2 ? 32 : 40,
      plotDepth: 3,
      useSubplot: true,
      abstractionLevel: innerTier as 1 | 2 | 3,
      weakCharTarget: innerTier === 1 ? 5 : innerTier === 2 ? 7 : 10,
    };
  }
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
