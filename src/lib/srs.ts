// ============================================================
// 语境 SRS 规则引擎 (v1)
//
// 纯规则，无 AI 调度。三阶段选择：
// 1. 昨日新学（yesterday's new）— 最高优先级
// 2. 到期复习（due for review）— 中等优先级
// 3. 巩固区间（consolidation zone）— 低优先级
// + 词级激活（word activation）— 字熟但词未见
// ============================================================

import type { UserLexicon, LearningTask, HskLevel } from '@/types';
import type { CharWordIndex } from './hsk';
import { getMasteryStatus, today } from './lexicon';

export interface SrsResult {
  /** 待复习/激活的字（用于文章生成） */
  weakChars: string[];
  /** 待激活的词 */
  pendingWords: string[];
  /** 完整的学习任务列表（含优先级和原因） */
  tasks: LearningTask[];
  /** 用户的今日 HSK 等级 */
  effectiveLevel: HskLevel;
  /** 昨日文章主题（避免重复） */
  yesterdayTopic?: string;
}

/**
 * SRS 主调度函数
 * 
 * 每天调用一次，为当天生成学习任务列表
 * 
 * 选择算法：
 * 
 * Phase 1 — 昨日新学（Yesterday's Fresh）
 *   昨天刚学的字词，今天必须复现
 *   mastery < 0.6 AND lastSeen == yesterday
 *   优先级：1.0
 * 
 * Phase 2 — 到期复习（Due for Review）
 *   未掌握且 nextReview <= today
 *   mastery < 0.6 AND nextReview <= today
 *   优先级：0.8
 * 
 * Phase 3 — 词级激活（Word Activation）
 *   字已掌握（mastery > 0.7）但相关词还没被激活
 *   优先级：0.6 * (1 - wordActivationRatio)
 * 
 * Phase 4 — 巩固区间（Consolidation）
 *   0.6 <= mastery < 0.85，需要强化
 *   优先级：0.4
 * 
 * 最终取 top N（N = 3-5，按 HSK 等级动态调整）
 */
export function scheduleDailyTasks(
  lexicon: UserLexicon,
  index: CharWordIndex,
  yesterdayTopic?: string,
): SrsResult {
  const todayStr = today();
  const yesterday = addDays(todayStr, -1);
  const tasks: LearningTask[] = [];

  // 用户所有已掌握的词集
  const userKnownWords = new Set(
    Object.entries(lexicon.words)
      .filter(([_, w]) => w.wordMastery >= 0.6)
      .map(([word, _]) => word)
  );

  // ---- Phase 1: 昨日新学 ----
  for (const [char, entry] of Object.entries(lexicon.chars)) {
    if (entry.mastery < 0.6 && entry.lastSeen === yesterday) {
      tasks.push({
        type: 'char_review',
        char,
        priority: 1.0,
        masteryBefore: entry.mastery,
        reason: `昨日新学，今天复现（当前掌握度 ${Math.round(entry.mastery * 100)}%）`,
      });
    }
  }

  // ---- Phase 2: 到期复习 ----
  for (const [char, entry] of Object.entries(lexicon.chars)) {
    if (entry.mastery < 0.6 && entry.nextReview <= todayStr) {
      // 避免重复（Phase 1 已选过的）
      if (tasks.some(t => t.char === char)) continue;
      tasks.push({
        type: 'char_review',
        char,
        priority: 0.8,
        masteryBefore: entry.mastery,
        reason: `到期复习（${entry.nextReview}，当前掌握度 ${Math.round(entry.mastery * 100)}%）`,
      });
    }
  }

  // ---- Phase 3: 词级激活 ----
  for (const [char, entry] of Object.entries(lexicon.chars)) {
    if (entry.mastery > 0.7 && entry.pendingWords.length > 0) {
      const activationRatio = entry.activatedInWords.length / 
        Math.max(1, (index.charToWords[char]?.length || 1));
      
      for (const word of entry.pendingWords) {
        if (tasks.some(t => t.word === word)) continue;
        tasks.push({
          type: 'word_activation',
          char,
          word,
          priority: 0.6 * (1 - activationRatio),
          masteryBefore: entry.mastery,
          reason: `字"${char}"已掌握（${Math.round(entry.mastery * 100)}%），激活词"${word}"`,
        });
      }
    }
  }

  // ---- Phase 4: 巩固区间 ----
  for (const [char, entry] of Object.entries(lexicon.chars)) {
    if (entry.mastery >= 0.6 && entry.mastery < 0.85) {
      if (tasks.some(t => t.char === char)) continue;
      tasks.push({
        type: 'consolidation',
        char,
        priority: 0.4,
        masteryBefore: entry.mastery,
        reason: `巩固区间（掌握度 ${Math.round(entry.mastery * 100)}%，需强化至85%以上）`,
      });
    }
  }

  // ---- 排序取 top N ----
  // N 根据 HSK 等级动态调整
  const topN = getTopN(lexicon.hskLevel);
  tasks.sort((a, b) => b.priority - a.priority);

  // 优先保留 char_review + word_activation，consolidation 作为填充
  const selected: LearningTask[] = [];
  const priorityTasks = tasks.filter(t => t.type !== 'consolidation');
  const fillerTasks = tasks.filter(t => t.type === 'consolidation');

  for (const t of priorityTasks) {
    if (selected.length >= topN) break;
    if (!selected.some(s => s.char === t.char)) {
      selected.push(t);
    }
  }

  // 如果还有空位，用 consolidation 填充
  for (const t of fillerTasks) {
    if (selected.length >= topN) break;
    if (!selected.some(s => s.char === t.char)) {
      selected.push(t);
    }
  }

  // ---- 提取结果 ----
  const weakChars = selected
    .filter(t => t.type === 'char_review' || t.type === 'consolidation')
    .map(t => t.char)
    .slice(0, 5);

  const pendingWords = selected
    .filter(t => t.type === 'word_activation' && t.word)
    .map(t => t.word!)
    .slice(0, 3);

  return {
    weakChars,
    pendingWords,
    tasks: selected,
    effectiveLevel: lexicon.hskLevel,
    yesterdayTopic,
  };
}

/**
 * 计算每日文章的生词密度上限
 * 
 * HSK1: ≤ 3%（仅150词基础）
 * HSK2: ≤ 5%（300-450词）
 * HSK3: ≤ 8%（600+词）
 */
export function getMaxNewCharRatio(level: HskLevel): number {
  switch (level) {
    case 1: return 0.03;
    case 2: return 0.05;
    case 3: return 0.08;
  }
}

/**
 * 获取每日学习任务数量（top N）
 */
export function getTopN(level: HskLevel): number {
  switch (level) {
    case 1: return 3;
    case 2: return 4;
    case 3: return 5;
  }
}

/**
 * 获取目标文章长度
 */
export function getTargetWordCount(level: HskLevel): { min: number; max: number } {
  switch (level) {
    case 1: return { min: 150, max: 200 };
    case 2: return { min: 250, max: 350 };
    case 3: return { min: 350, max: 500 };
  }
}

/** 工具：日期加减 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
