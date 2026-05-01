// ============================================================
// 文章质检脚本 (QC)
//
// 自动检查每篇文章是否符合约束：
// - 生词密度 ≤ 阈值
// - 薄弱字出现 ≥ 2次/字
// - 文章长度在范围内
// - 无超纲语法（仅HSK1）
// - 无暴力/恐怖/恋爱内容
// - 兴趣标签自然融入
// - 结尾为开放式/提问式
//
// 质检不通过 → 自动重新生成（最多3次）
// 仍不通过 → 进入人工审核队列
// ============================================================

import type { Article, QcResult, HskLevel } from '@/types';
import { getTargetWordCount } from './srs';

// ---- 黑名单词 ----

const VIOLENCE_WORDS = ['杀', '死', '血', '打人', '打架', '枪', '刀', '爆炸', '恐怖', '鬼'];
const ADULT_WORDS = ['恋爱', '结婚', '爱情', '女朋友', '男朋友', '亲吻', '拥抱'];

// ---- 超纲语法模式（HSK1 禁用） ----

const ADVANCED_PATTERNS_H1 = [
  /把.+[动词动]/,
  /被.+[动词动]/,
  /比.+更/,
  /虽然.+但是/,
  /如果.+就/,
  /不但.+而且/,
  /因为.+所以/,
];

// ---- 主质检函数 ----

/**
 * 质检一篇文章
 * 
 * @param article 待质检文章
 * @param masteredChars 用户已掌握字词集
 * @returns 质检结果
 */
export function qualityCheck(
  article: Pick<Article, 'body' | 'title' | 'weakCharsEmbedded' | 'hskLevel' | 'interestTag'>,
  masteredChars: string[],
): QcResult {
  const issues: string[] = [];
  const targetLength = getTargetWordCount(article.hskLevel);
  const body = article.body;
  const bodyLen = body.length;
  const masteredSet = new Set(masteredChars);

  // 1. 检查文章长度
  if (bodyLen < targetLength.min) {
    issues.push(`文章过短：${bodyLen}字 < 目标${targetLength.min}字`);
  }
  if (bodyLen > targetLength.max) {
    issues.push(`文章过长：${bodyLen}字 > 目标${targetLength.max}字`);
  }

  // 2. 检查生词密度
  const newChars: string[] = [];
  for (const char of body) {
    if (char.trim() && char.length === 1 && /[\u4e00-\u9fff]/.test(char)) {
      if (!masteredSet.has(char)) {
        newChars.push(char);
      }
    }
  }
  const newCharRatio = newChars.length / Math.max(1, bodyLen);
  const maxRatio = article.hskLevel === 1 ? 0.03 : article.hskLevel === 2 ? 0.05 : 0.08;
  if (newCharRatio > maxRatio) {
    issues.push(`生词密度过高：${(newCharRatio * 100).toFixed(1)}% > 目标${(maxRatio * 100)}%（新字：${[...new Set(newChars)].join('、')}）`);
  }

  // 3. 检查薄弱字出现次数（每个至少2次）
  const weakCharFreq: Record<string, number> = {};
  for (const char of article.weakCharsEmbedded) {
    const count = (body.match(new RegExp(char, 'g')) || []).length;
    weakCharFreq[char] = count;
    if (count < 2) {
      issues.push(`薄弱字"${char}"仅出现${count}次，需要至少2次`);
    }
  }

  // 4. 检查超纲语法（仅HSK1）
  if (article.hskLevel === 1) {
    for (const pattern of ADVANCED_PATTERNS_H1) {
      if (pattern.test(body)) {
        issues.push(`HSK1文章包含超纲语法：${pattern.source}`);
        break;
      }
    }
  }

  // 5. 检查暴力/成人内容
  for (const word of VIOLENCE_WORDS) {
    if (body.includes(word)) {
      issues.push(`包含暴力相关词：${word}`);
    }
  }
  for (const word of ADULT_WORDS) {
    if (body.includes(word)) {
      issues.push(`包含不适当内容：${word}`);
    }
  }

  // 6. 检查兴趣标签是否融入（粗略检查：标签相关的字是否出现在正文）
  const interestChars = new Set(Array.from(article.interestTag));
  const bodyChars = new Set(Array.from(body));
  const overlap = [...interestChars].filter(c => bodyChars.has(c));
  if (overlap.length === 0 && interestChars.size > 0) {
    issues.push(`兴趣标签"${article.interestTag}"可能未融入文章`);
  }

  // 7. 检查结尾是否为开放式/提问式
  const lastSentence = body.split(/[。！？\n]/).filter(Boolean).pop() || '';
  const hasQuestion = lastSentence.includes('？') || lastSentence.includes('?');
  const hasOpenEnding = /你(觉得|认为|想|猜)|为什么|怎么|吗$|呢$/.test(lastSentence);
  if (!hasQuestion && !hasOpenEnding) {
    issues.push('结尾非开放式/提问式');
  }

  return {
    passed: issues.length === 0,
    issues,
    stats: {
      totalChars: bodyLen,
      newCharRatio,
      weakCharFrequency: weakCharFreq,
      length: bodyLen,
    },
  };
}

/**
 * 质检报告（人类可读）
 */
export function formatQcResult(result: QcResult): string {
  const lines: string[] = [
    `📊 质检结果：${result.passed ? '✅ 通过' : '❌ 不通过'}`,
    `  总字数：${result.stats.totalChars}`,
    `  生词密度：${(result.stats.newCharRatio * 100).toFixed(1)}%`,
    `  薄弱字复现：`,
  ];

  for (const [char, count] of Object.entries(result.stats.weakCharFrequency)) {
    lines.push(`    "${char}": ${count}次${count >= 2 ? ' ✅' : ' ❌'}`);
  }

  if (result.issues.length > 0) {
    lines.push(`\n  问题（${result.issues.length}项）：`);
    for (const issue of result.issues) {
      lines.push(`  - ${issue}`);
    }
  }

  return lines.join('\n');
}

/**
 * 判断是否需要重试（最多3次）
 */
export function shouldRetry(attempt: number, result: QcResult): boolean {
  if (attempt >= 3) return false; // 最多3次
  if (result.passed) return false;

  // 只对「生词密度过高」「薄弱字不足」「长度不符」自动重试
  const retryableIssues = result.issues.filter(i =>
    i.includes('生词密度') || i.includes('薄弱字') || i.includes('过短') || i.includes('过长')
  );

  return retryableIssues.length > 0;
}

/**
 * 基于质检结果生成优化提示，用于下一次 Prompt 生成
 */
export function buildQcFeedbackPrompt(result: QcResult, attempt: number): string {
  if (result.passed) return '';

  const feedback: string[] = [
    `# 第${attempt}次生成的质量反馈`,
    `请根据以下问题调整本次生成：`,
  ];

  for (const issue of result.issues) {
    if (issue.includes('生词密度过高')) {
      feedback.push(`- 使用更简单的词汇，确保大部分字在用户已掌握列表中`);
    } else if (issue.includes('薄弱字')) {
      feedback.push(`- 确保每个薄弱字在正文中出现至少2次，且在不同句子中`);
    } else if (issue.includes('过短')) {
      feedback.push(`- 写一个更详细的故事，增加情节描述`);
    } else if (issue.includes('过长')) {
      feedback.push(`- 简化故事，删减不必要的描述`);
    } else if (issue.includes('非开放式')) {
      feedback.push(`- 结尾用问题或引发思考的方式收尾`);
    }
  }

  return feedback.join('\n');
}
