// ============================================================
// 二层字词画像模型 (Lexicon)
//
// 核心设计：
// - 字为基础层（CharEntry）：记录每个独体字的掌握度
// - 词为应用层（WordEntry）：记录每个 HSK 词汇的掌握度
// - 字词联动：词级掌握度 ≤ 组成字平均掌握度（允许语境加成）
// - pendingWords：字熟但词未见的待激活词列表
// ============================================================

import type { UserLexicon, CharEntry, WordEntry, HskLevel, MasteryStatus } from '@/types';
import type { CharWordIndex } from './hsk';
import { getPendingWords } from './hsk';

// ---- 工具函数 ----

/** 获取今天的日期字符串 */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 根据掌握度返回状态 */
export function getMasteryStatus(mastery: number): MasteryStatus {
  if (mastery < 0.01) return 'unseen';
  if (mastery < 0.6) return 'learning';
  if (mastery < 0.85) return 'consolidating';
  return 'mastered';
}

// ---- 创建初始画像（入学测评后调用） ----

export function createInitialLexicon(
  userId: string,
  hskLevel: HskLevel,
  masteredChars: string[],
  weakChars: string[],
  interests: string[],
  index: CharWordIndex,
): UserLexicon {
  const chars: Record<string, CharEntry> = {};
  const words: Record<string, WordEntry> = {};
  const todayStr = today();

  // 初始化已掌握的字
  for (const char of masteredChars) {
    const relatedWords = index.charToWords[char] || [];
    chars[char] = {
      glyph: char,
      pinyin: '',  // 从完整词表补充
      hskLevel: hskLevel,
      mastery: 0.85,
      lastSeen: todayStr,
      exposureCount: 1,
      nextReview: addDays(todayStr, 3),
      activatedInWords: relatedWords.filter(w => w.includes(char)).slice(0, 3),
      pendingWords: [],
    };
  }

  // 初始化薄弱字
  for (const char of weakChars) {
    chars[char] = {
      glyph: char,
      pinyin: '',
      hskLevel: hskLevel,
      mastery: 0.35,
      lastSeen: todayStr,
      exposureCount: 1,
      nextReview: addDays(todayStr, 1),
      activatedInWords: [],
      pendingWords: [],
    };
  }

  // 构建字→词的 pendingWords（字熟但词未见的）
  const knownWords = new Set<string>();
  for (const [char, entry] of Object.entries(chars)) {
    entry.pendingWords = getPendingWords(char, entry.mastery, entry.activatedInWords, index, knownWords);
  }

  return {
    userId,
    hskLevel,
    chars,
    words,
    interests,
    streakDays: 0,
    totalRead: 0,
    totalCharsMastered: masteredChars.length,
    lastActiveDate: todayStr,
    createdAt: todayStr,
  };
}

// ---- 掌握度更新（读完文章+互动后调用） ----

export interface UpdateResult {
  updatedChars: string[];
  updatedWords: string[];
  newPendingWords: string[];
  statusChanges: { char: string; from: MasteryStatus; to: MasteryStatus }[];
}

/**
 * 更新字词掌握度
 * 
 * 规则：
 * 1. 字级：Q1答对 mastery+0.15（上限0.95），答错 mastery-0.2（下限0.10）
 * 2. 词级：Q1答对 wordMastery+0.12，答错 wordMastery-0.15
 * 3. 词级上限 = min(实测准确率, 组成字平均掌握度 × 1.2)
 * 4. 下次复习间隔：mastery<0.6→明天，0.6-0.85→3天后，>0.85→7天后
 */
export function updateMasteryAfterQuiz(
  lexicon: UserLexicon,
  weakChars: string[],
  pendingWords: string[],
  quizResults: { q1Correct: boolean; q2Correct: boolean; q3Correct: boolean },
  index: CharWordIndex,
): UpdateResult {
  const todayStr = today();
  const updatedChars: string[] = [];
  const updatedWords: string[] = [];
  const statusChanges: UpdateResult['statusChanges'] = [];

  // ---- 更新字级 ----
  for (const char of weakChars) {
    const entry = lexicon.chars[char];
    if (!entry) continue;

    const oldStatus = getMasteryStatus(entry.mastery);
    
    if (quizResults.q1Correct) {
      entry.mastery = Math.min(0.95, entry.mastery + 0.15);
    } else {
      entry.mastery = Math.max(0.10, entry.mastery - 0.20);
    }

    entry.lastSeen = todayStr;
    entry.exposureCount += 1;
    entry.nextReview = calcNextReview(entry.mastery, todayStr);
    entry.activatedInWords = pushUnique(entry.activatedInWords, ...pendingWords.filter(w => w.includes(char)));

    const newStatus = getMasteryStatus(entry.mastery);
    if (oldStatus !== newStatus) {
      statusChanges.push({ char, from: oldStatus, to: newStatus });
    }

    // 重新计算 pendingWords
    const userKnownWords = new Set(Object.keys(lexicon.words)
      .filter(w => lexicon.words[w].wordMastery >= 0.6));
    entry.pendingWords = getPendingWords(char, entry.mastery, entry.activatedInWords, index, userKnownWords);

    updatedChars.push(char);
  }

  // ---- 更新词级 ----
  for (const word of pendingWords) {
    let entry = lexicon.words[word];
    if (!entry) {
      // 首次激活该词
      entry = {
        word,
        chars: index.wordToChars[word] || [],
        hskLevel: lexicon.hskLevel,
        charMasteryAvg: calcCharMasteryAvg(word, lexicon.chars, index),
        wordMastery: 0.5,
        hasBeenSeen: true,
        lastSeen: todayStr,
        nextReview: calcNextReview(0.5, todayStr),
        quizAccuracy: 0.5,
      };
      lexicon.words[word] = entry;
    }

    if (quizResults.q1Correct) {
      entry.wordMastery = Math.min(0.95, entry.wordMastery + 0.12);
    } else {
      entry.wordMastery = Math.max(0.10, entry.wordMastery - 0.15);
    }

    // 应用上限约束：词级 ≤ 字级均值 × 1.2
    entry.charMasteryAvg = calcCharMasteryAvg(word, lexicon.chars, index);
    const upperBound = Math.min(entry.quizAccuracy, entry.charMasteryAvg * 1.2);
    entry.wordMastery = Math.min(entry.wordMastery, upperBound);

    entry.hasBeenSeen = true;
    entry.lastSeen = todayStr;
    entry.nextReview = calcNextReview(entry.wordMastery, todayStr);
    entry.quizAccuracy = quizResults.q1Correct
      ? Math.min(1, entry.quizAccuracy + 0.1)
      : Math.max(0, entry.quizAccuracy - 0.15);

    updatedWords.push(word);
  }

  // 重新统计掌握字数
  lexicon.totalCharsMastered = Object.values(lexicon.chars)
    .filter(c => c.mastery >= 0.6).length;

  // 收集新的 pendingWords（变化后新生成的）
  const newPendingWords: string[] = [];
  for (const char of updatedChars) {
    for (const pw of lexicon.chars[char]?.pendingWords || []) {
      if (!newPendingWords.includes(pw)) newPendingWords.push(pw);
    }
  }

  return { updatedChars, updatedWords, newPendingWords, statusChanges };
}

// ---- 工具 ----

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function calcNextReview(mastery: number, todayStr: string): string {
  if (mastery < 0.6) return addDays(todayStr, 1);
  if (mastery < 0.85) return addDays(todayStr, 3);
  return addDays(todayStr, 7);
}

function calcCharMasteryAvg(word: string, chars: Record<string, CharEntry>, index: CharWordIndex): number {
  const charList = index.wordToChars[word] || [];
  if (charList.length === 0) return 0;
  const sum = charList.reduce((acc, c) => acc + (chars[c]?.mastery || 0), 0);
  return sum / charList.length;
}

function pushUnique(arr: string[], ...items: string[]): string[] {
  const set = new Set(arr);
  for (const item of items) {
    set.add(item);
  }
  return Array.from(set);
}
