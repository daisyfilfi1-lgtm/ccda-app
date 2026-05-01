// ============================================================
// CCDA — 语境识字引擎 :: 核心类型定义
// 二层字词画像模型：字为基础层，词为应用层
// ============================================================

// ---- 核心枚举 ----

/** HSK 等级（P0 只覆盖 1-3） */
export type HskLevel = 1 | 2 | 3;

/** 字词掌握状态 */
export type MasteryStatus = 'unseen' | 'learning' | 'consolidating' | 'mastered';

/** 学习任务类型 */
export type LearningTaskType = 'char_review' | 'word_activation' | 'consolidation';

// ---- 字级画像 ----

export interface CharEntry {
  /** 汉字 */
  glyph: string;
  /** 拼音（含声调） */
  pinyin: string;
  /** HSK 等级 */
  hskLevel: HskLevel;
  /** 掌握度 0-1 */
  mastery: number;
  /** 上次出现日期 YYYY-MM-DD */
  lastSeen: string;
  /** 累计出现次数 */
  exposureCount: number;
  /** 下次复习日期 YYYY-MM-DD */
  nextReview: string;
  /** 这个字在哪些词中被激活过 */
  activatedInWords: string[];
  /** 字已掌握但尚未见过的关联词 */
  pendingWords: string[];
}

// ---- 词级画像 ----

export interface WordEntry {
  /** 词汇（可以是单字词或多字词） */
  word: string;
  /** 组成字 */
  chars: string[];
  /** HSK 等级 */
  hskLevel: HskLevel;
  /** 组成字的平均掌握度（自动计算） */
  charMasteryAvg: number;
  /** 词级掌握度 0-1 */
  wordMastery: number;
  /** 是否被用户见过 */
  hasBeenSeen: boolean;
  /** 上次出现日期 YYYY-MM-DD */
  lastSeen: string;
  /** 下次复习日期 YYYY-MM-DD */
  nextReview: string;
  /** 此quiz准确率（Q1：字义理解） */
  quizAccuracy: number;
}

// ---- 用户完整画像 ----

export interface UserLexicon {
  userId: string;
  hskLevel: HskLevel;
  /** 字级画像 */
  chars: Record<string, CharEntry>;
  /** 词级画像 */
  words: Record<string, WordEntry>;
  /** char → words 的索引（从HSK词表自动构建，只读引用） */
  // 这个索引存在全局 HSK 表中，用户画像里不重复存储
  interests: string[];
  /** 连续阅读天数 */
  streakDays: number;
  /** 累计阅读文章数 */
  totalRead: number;
  /** 累计掌握字数 */
  totalCharsMastered: number;
  /** 最后活跃日期 */
  lastActiveDate: string;
  /** 创建日期 */
  createdAt: string;
}

// ---- 学习任务 ----

export interface LearningTask {
  type: LearningTaskType;
  char: string;
  word?: string;
  priority: number;
  masteryBefore: number;
  reason: string;
}

// ---- 文章 ----

export interface Article {
  articleId: string;
  userId: string;
  date: string;
  title: string;
  body: string;
  wordCount: number;
  hskLevel: HskLevel;
  /** 嵌入的薄弱字 */
  weakCharsEmbedded: string[];
  /** 嵌入的待激活词 */
  pendingWordsEmbedded: string[];
  /** 新引入字词 */
  newCharsIntroduced: string[];
  interestTag: string;
  cultureLevel: number; // 0-100
  readDuration?: number;
  completed?: boolean;
  quizResults?: QuizResults;
  /** 质检结果 */
  qcPassed: boolean;
  qcIssues: string[];
}

export interface QuizResults {
  q1Correct: boolean; // 字义理解
  q2Correct: boolean; // 句子排序
  q3Correct: boolean; // 语境填空
}

// ---- 文章生成输入 ----

export interface ArticleGenerationInput {
  userId: string;
  hskLevel: HskLevel;
  masteredChars: string[];
  weakChars: string[];
  pendingWords: string[];
  interests: string[];
  yesterdayTopic: string;
  tasks: LearningTask[];
}

// ---- 质检结果 ----

export interface QcResult {
  passed: boolean;
  issues: string[];
  stats: {
    totalChars: number;
    newCharRatio: number;   // 生词密度
    weakCharFrequency: Record<string, number>; // 每个薄弱字出现次数
    length: number;
  };
}

// ---- 家长报告 ----

export interface ParentReport {
  date: string;
  userId: string;
  childName: string;
  dayNumber: number;
  todayArticle: {
    title: string;
    hskLevel: HskLevel;
    wordCount: number;
  };
  stats: {
    masteredChars: number;
    newCharsToday: string[];
    hskProgress: number;   // 百分比
  };
  weakCharsTop5: {
    char: string;
    exposureCount: number;
    mastery: number;
  }[];
  nextPlan: string;
  streakDays: number;
  badgeName?: string;
}
