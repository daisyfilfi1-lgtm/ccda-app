// ============================================================
// 文章生成器 — 文章生成 + Prompt 模板
//
// 核心职责：
// 1. 将 SRS 学习任务转换为 Prompt 输入
// 2. 调用大模型 API 生成文章
// 3. 解析 LLM 输出为结构化 Article
// ============================================================

import type { Article, ArticleGenerationInput, HskLevel } from '@/types';
import type { SrsResult } from './srs';
import { getTargetWordCount, getMaxNewCharRatio } from './srs';
import { today } from './lexicon';

// ---- Prompt 模板 ----

export function buildArticlePrompt(input: ArticleGenerationInput): string {
  const targetLength = getTargetWordCount(input.hskLevel);
  const maxNewRatio = getMaxNewCharRatio(input.hskLevel);

  return `# Role
你是一位专门为海外华裔少儿（6-10岁）创作中文阅读材料的AI作家。
你熟悉HSK汉语水平标准，擅长把汉字教学藏在有趣的故事里。

# Input
- 用户HSK等级：${input.hskLevel}
- 已掌握字词：${input.masteredChars.join('、')}（共${input.masteredChars.length}字）
- 今日学习任务：
${input.tasks.map(t => `  - ${t.reason}`).join('\n')}
- 兴趣标签：${input.interests.join('、')}
- 文化浓度：30%（轻度文化元素，自然融入）
- 昨日文章主题：${input.yesterdayTopic || '无'}

# Output Requirements
1. 文章长度：${targetLength.min}-${targetLength.max}字
2. 生词密度：全文字词中，超出用户已掌握列表的字词占比 ≤ ${Math.round(maxNewRatio * 100)}%
3. 薄弱字嵌入：以下每个字必须在文章中出现至少2次，且出现在不同句子/语境中：
   ${input.weakChars.join('、')}
4. 待激活词嵌入：以下词需在文章中出现，且上下文足够提示词义（不是字义的简单叠加）：
   ${input.pendingWords.join('、')}
5. 句式要求：
   - HSK1：简单主谓宾，无复杂从句，每句不超过10个字
   - HSK2：加入"因为...所以...""但是...""先...然后..."等基础复句
   - HSK3：加入把字句、被字句、比较句（比...更...）、"虽然...但是..."
6. 兴趣融合：故事主角或场景必须与"${input.interests[0]}"相关
7. 文化元素：自然融入1-2个中国文化元素（如食物、节日），不强行说教
8. 结尾：开放式或提问式，引发孩子思考
9. 禁止使用拼音替代汉字（除注释外）
10. **关键**：每个薄弱字出现时，上下文要有足够语境暗示其含义（不是孤立出现）

# Output Format
---
标题：{标题}
正文：{正文}

新词注释：
- {新词1}（拼音）：{简单英文释义}
- {新词2}（拼音）：{简单英文释义}
（最多3个新词注释，列出超出用户掌握列表的字词）

课后问题：
Q1：{关于薄弱字字义的选择题，4选1}
Q2：{句子排序题，打乱顺序的词语}
Q3：{语境选择填空题，3选1，选项要有干扰性}

（Q1答案选项用A.B.C.D格式，完整中文）
（Q2的给出方式：用/分隔每个词，如"去/Steve/决定/旅行"）
（Q3的给出方式：完整句子，空白处用____，选项用A.B.C.D）
---`;
}

// ---- LLM 输出解析 ----

export interface ParsedArticle {
  title: string;
  body: string;
  newWords: { word: string; pinyin: string; meaning: string }[];
  quiz: {
    q1: { question: string; options: string[]; answer: number };
    q2: { words: string[]; answer: string }; // 打乱的词，answer是正确顺序的句子
    q3: { sentence: string; blankIndex: number; options: string[]; answer: number };
  };
}

/**
 * 解析 LLM 输出为结构化数据
 * 
 * 格式：标题：xxx\n正文：xxx\n\n新词注释：\n- ...\n\n课后问题：\nQ1：...\nQ2：...\nQ3：...
 */
export function parseLlmOutput(raw: string): ParsedArticle {
  const result: ParsedArticle = {
    title: '',
    body: '',
    newWords: [],
    quiz: {
      q1: { question: '', options: ['', '', '', ''], answer: 0 },
      q2: { words: [], answer: '' },
      q3: { sentence: '', blankIndex: 0, options: ['', '', ''], answer: 0 },
    },
  };

  // 提取标题
  const titleMatch = raw.match(/标题[：:]\s*(.+)/);
  if (titleMatch) result.title = titleMatch[1].trim();

  // 提取正文（标题和正文之间，或正文：后的内容，直到新词注释）
  const bodyMatch = raw.match(/正文[：:]\s*([\s\S]+?)(?=\n新词注释|\n---|$)/);
  if (bodyMatch) result.body = bodyMatch[1].trim();

  // 提取新词注释
  const wordRegex = /-\s*([^（]+)（([^）]+)）[：:]?\s*(.+)/g;
  let wordMatch;
  while ((wordMatch = wordRegex.exec(raw)) !== null) {
    result.newWords.push({
      word: wordMatch[1].trim(),
      pinyin: wordMatch[2].trim(),
      meaning: wordMatch[3].trim(),
    });
  }

  // 提取 Q1
  const q1Match = raw.match(/Q1[：:]\s*(.+?)(?=\nQ2)/s);
  if (q1Match) {
    const q1Text = q1Match[1].trim();
    const lines = q1Text.split('\n').map(l => l.trim()).filter(Boolean);
    result.quiz.q1.question = lines[0] || '';
    
    // 提取选项（A. xxx  B. xxx 格式）
    const optionRegex = /[A-Da-d][.、]\s*([^A-D]+)/g;
    const options: string[] = [];
    let optMatch;
    while ((optMatch = optionRegex.exec(q1Text)) !== null) {
      options.push(optMatch[1].trim().replace(/[.。]$/, ''));
    }
    if (options.length >= 2) {
      result.quiz.q1.options = options.slice(0, 4);
      while (result.quiz.q1.options.length < 4) result.quiz.q1.options.push('');
    }

    // 尝试找答案（答案通常在选项后面或题干里）
    // 简单启发：假设用户代码里会有 answer: N 或者用 -> 标注
    const ansMatch = q1Text.match(/[答正][案确][：:]\s*([A-D])/);
    if (ansMatch) {
      result.quiz.q1.answer = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
    }
  }

  // 提取 Q2
  const q2Match = raw.match(/Q2[：:]\s*(.+?)(?=\nQ3)/s);
  if (q2Match) {
    const q2Text = q2Match[1].trim();
    // 提取用 / 分隔的词序列
    const words = q2Text.split(/[\/\s|]+/).filter(w => w.length > 0 && !w.startsWith('答'));
    result.quiz.q2.words = words;
    
    const ansMatch2 = q2Text.match(/[答正][案确][：:]\s*(.+)/);
    if (ansMatch2) result.quiz.q2.answer = ansMatch2[1].trim().replace(/[。.]$/, '');
  }

  // 提取 Q3
  const q3Match = raw.match(/Q3[：:]\s*(.+?)(?=\n---|\n*$)/s);
  if (q3Match) {
    const q3Text = q3Match[1].trim();
    // 找上有 ____ 的句子
    const sentenceMatch = q3Text.match(/(.+?____.+?)(?=\n|$)/);
    if (sentenceMatch) result.quiz.q3.sentence = sentenceMatch[1].trim();
    
    const optionRegex3 = /[A-Ca-c][.、]\s*([^A-C]+)/g;
    const options3: string[] = [];
    let optMatch3;
    while ((optMatch3 = optionRegex3.exec(q3Text)) !== null) {
      options3.push(optMatch3[1].trim().replace(/[.。]$/, ''));
    }
    if (options3.length >= 2) {
      result.quiz.q3.options = options3.slice(0, 3);
    }

    const ansMatch3 = q3Text.match(/[答正][案确][：:]\s*([A-C])/);
    if (ansMatch3) {
      result.quiz.q3.answer = 'ABC'.indexOf(ansMatch3[1].toUpperCase());
    }
  }

  return result;
}

// ---- 文章生成完整流程 ----

/**
 * 从 SRS 结果构建 AI 调用的完整输入
 */
export function buildGenerationInput(
  userId: string,
  srsResult: SrsResult,
  masteredChars: string[],
  interests: string[],
  yesterdayTopic?: string,
): ArticleGenerationInput {
  return {
    userId,
    hskLevel: srsResult.effectiveLevel,
    masteredChars,
    weakChars: srsResult.weakChars,
    pendingWords: srsResult.pendingWords,
    interests,
    yesterdayTopic: yesterdayTopic || '',
    tasks: srsResult.tasks,
  };
}

/**
 * 将解析后的输出转为 Article 模型
 */
export function toArticle(
  userId: string,
  parsed: ParsedArticle,
  generationInput: ArticleGenerationInput,
): Article {
  const todayStr = today();
  
  // 提取正文中的字
  const bodyChars = new Set(Array.from(parsed.body));
  const newCharsIntroduced: string[] = [];
  for (const char of bodyChars) {
    if (char.trim() && !generationInput.masteredChars.includes(char) && char.length === 1) {
      newCharsIntroduced.push(char);
    }
  }

  return {
    articleId: `a_${Date.now()}`,
    userId,
    date: todayStr,
    title: parsed.title,
    body: parsed.body,
    wordCount: parsed.body.length,
    hskLevel: generationInput.hskLevel,
    weakCharsEmbedded: generationInput.weakChars,
    pendingWordsEmbedded: generationInput.pendingWords,
    newCharsIntroduced: newCharsIntroduced.slice(0, 10),
    interestTag: generationInput.interests[0] || '',
    cultureLevel: 30,
    qcPassed: false, // 需要被 QC 校验
    qcIssues: [],
  };
}
