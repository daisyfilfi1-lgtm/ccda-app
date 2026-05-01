// ============================================================
// HSK 词表 + char→words 索引构建
// 数据来源：HSK 1-3 级官方词表（教育部2021版）
//
// 运行时从 JSON 数据文件加载，此处仅提供索引构建函数
// ============================================================

import type { HskLevel } from '@/types';

// ---- 原始词条 ----

export interface HskWordEntry {
  word: string;
  pinyin: string;
  meaning: string;
  hskLevel: HskLevel;
  /** 词性（可选，供未来语法分析用） */
  pos?: string;
  /** 例句 */
  exampleSentence?: string;
}

export interface HskCharEntry {
  char: string;
  pinyin: string;
  hskLevel: HskLevel;
  meaning: string;
  /** 常用组词（HSK词表中出现的） */
  commonWords: string[];
  /** 字源提示（可选，P0不依赖） */
  etymologyHint?: string;
}

// ---- char→words 索引 ----

export interface CharWordIndex {
  /** char → 包含该字的词列表 */
  charToWords: Record<string, string[]>;
  /** word → 组成字符列表 */
  wordToChars: Record<string, string[]>;
  /** 所有不重复的独体字集 */
  allChars: Set<string>;
}

/**
 * 从 HSK 词表构建 char→words 双向索引
 * 
 * 核心逻辑：
 * 1. 遍历每个词，拆成单字
 * 2. 每个字→该词的映射建立
 * 3. 单字词也正常索引（如"我"既是字也是词）
 * 
 * 时间复杂度：O(N * L)，N=词数，L=平均词长
 */
export function buildCharWordIndex(words: HskWordEntry[]): CharWordIndex {
  const charToWords: Record<string, string[]> = {};
  const wordToChars: Record<string, string[]> = {};
  const allChars = new Set<string>();

  for (const entry of words) {
    const { word } = entry;
    const chars = Array.from(word); // 正确处理多字节字符

    wordToChars[word] = chars;
    allChars.add(word); // 单字词也加到 char 集中

    for (const char of chars) {
      allChars.add(char);
      if (!charToWords[char]) {
        charToWords[char] = [];
      }
      // 避免重复（同一个词出现一次）
      if (!charToWords[char].includes(word)) {
        charToWords[char].push(word);
      }
    }
  }

  return { charToWords, wordToChars, allChars };
}

/**
 * 获取某个字的"待激活词" — 字已掌握但词未见过
 * 
 * @param char 汉字
 * @param charMastery 该字的掌握度
 * @param activatedWords 该字已在哪些词中被激活
 * @param index char→words 索引
 * @param userKnownWords 用户已掌握的词集
 * @returns 待激活词列表（最多 3 个）
 */
export function getPendingWords(
  char: string,
  charMastery: number,
  activatedWords: string[],
  index: CharWordIndex,
  userKnownWords: Set<string>,
): string[] {
  if (charMastery < 0.6) return []; // 字还没掌握，先不激活词

  const relatedWords = index.charToWords[char] || [];
  const alreadyActivated = new Set(activatedWords);

  return relatedWords
    .filter(w => !alreadyActivated.has(w) && !userKnownWords.has(w))
    .slice(0, 3);
}

// ============================================================
// HSK 1-3 级核心词表（精简版，用于测试和验证）
// 完整版从 supabase 数据库加载
// ============================================================

export const HSK_WORDS_SAMPLE: HskWordEntry[] = [
  // ---- HSK 1 级（150 词示例） ----
  { word: '我', pinyin: 'wǒ', meaning: 'I/me', hskLevel: 1 },
  { word: '你', pinyin: 'nǐ', meaning: 'you', hskLevel: 1 },
  { word: '他', pinyin: 'tā', meaning: 'he/him', hskLevel: 1 },
  { word: '她', pinyin: 'tā', meaning: 'she/her', hskLevel: 1 },
  { word: '好', pinyin: 'hǎo', meaning: 'good', hskLevel: 1 },
  { word: '是', pinyin: 'shì', meaning: 'to be', hskLevel: 1 },
  { word: '不', pinyin: 'bù', meaning: 'not/no', hskLevel: 1 },
  { word: '人', pinyin: 'rén', meaning: 'person', hskLevel: 1 },
  { word: '大', pinyin: 'dà', meaning: 'big', hskLevel: 1 },
  { word: '小', pinyin: 'xiǎo', meaning: 'small', hskLevel: 1 },
  { word: '水', pinyin: 'shuǐ', meaning: 'water', hskLevel: 1 },
  { word: '火', pinyin: 'huǒ', meaning: 'fire', hskLevel: 1 },
  { word: '山', pinyin: 'shān', meaning: 'mountain', hskLevel: 1 },
  { word: '上', pinyin: 'shàng', meaning: 'up/above', hskLevel: 1 },
  { word: '下', pinyin: 'xià', meaning: 'down/below', hskLevel: 1 },
  { word: '一', pinyin: 'yī', meaning: 'one', hskLevel: 1 },
  { word: '二', pinyin: 'èr', meaning: 'two', hskLevel: 1 },
  { word: '三', pinyin: 'sān', meaning: 'three', hskLevel: 1 },
  { word: '天', pinyin: 'tiān', meaning: 'day/sky', hskLevel: 1 },
  { word: '月', pinyin: 'yuè', meaning: 'moon/month', hskLevel: 1 },
  { word: '今天', pinyin: 'jīntiān', meaning: 'today', hskLevel: 1 },
  { word: '明天', pinyin: 'míngtiān', meaning: 'tomorrow', hskLevel: 1 },
  { word: '去', pinyin: 'qù', meaning: 'to go', hskLevel: 1 },
  { word: '来', pinyin: 'lái', meaning: 'to come', hskLevel: 1 },
  { word: '看', pinyin: 'kàn', meaning: 'to see/look', hskLevel: 1 },
  { word: '吃', pinyin: 'chī', meaning: 'to eat', hskLevel: 1 },
  { word: '喝', pinyin: 'hē', meaning: 'to drink', hskLevel: 1 },
  { word: '叫', pinyin: 'jiào', meaning: 'to call/name', hskLevel: 1 },
  { word: '说', pinyin: 'shuō', meaning: 'to speak', hskLevel: 1 },
  { word: '读', pinyin: 'dú', meaning: 'to read', hskLevel: 1 },
  { word: '写', pinyin: 'xiě', meaning: 'to write', hskLevel: 1 },
  { word: '有', pinyin: 'yǒu', meaning: 'to have', hskLevel: 1 },
  { word: '爱', pinyin: 'ài', meaning: 'to love/like', hskLevel: 1 },
  { word: '喜欢', pinyin: 'xǐhuān', meaning: 'to like', hskLevel: 1 },
  { word: '高兴', pinyin: 'gāoxìng', meaning: 'happy', hskLevel: 1 },
  { word: '朋友', pinyin: 'péngyǒu', meaning: 'friend', hskLevel: 1 },
  { word: '老师', pinyin: 'lǎoshī', meaning: 'teacher', hskLevel: 1 },
  { word: '学生', pinyin: 'xuéshēng', meaning: 'student', hskLevel: 1 },
  { word: '学校', pinyin: 'xuéxiào', meaning: 'school', hskLevel: 1 },
  { word: '家', pinyin: 'jiā', meaning: 'home/family', hskLevel: 1 },
  { word: '书', pinyin: 'shū', meaning: 'book', hskLevel: 1 },
  { word: '猫', pinyin: 'māo', meaning: 'cat', hskLevel: 1 },
  { word: '狗', pinyin: 'gǒu', meaning: 'dog', hskLevel: 1 },
  { word: '鱼', pinyin: 'yú', meaning: 'fish', hskLevel: 1 },
  { word: '鸟', pinyin: 'niǎo', meaning: 'bird', hskLevel: 1 },

  // ---- HSK 2 级（150 词示例） ----
  { word: '旅行', pinyin: 'lǚxíng', meaning: 'travel', hskLevel: 2 },
  { word: '旅游', pinyin: 'lǚyóu', meaning: 'tourism', hskLevel: 2 },
  { word: '餐馆', pinyin: 'cānguǎn', meaning: 'restaurant', hskLevel: 2 },
  { word: '礼物', pinyin: 'lǐwù', meaning: 'gift', hskLevel: 2 },
  { word: '运动', pinyin: 'yùndòng', meaning: 'sport/exercise', hskLevel: 2 },
  { word: '比赛', pinyin: 'bǐsài', meaning: 'competition/match', hskLevel: 2 },
  { word: '跑步', pinyin: 'pǎobù', meaning: 'to run/jog', hskLevel: 2 },
  { word: '房间', pinyin: 'fángjiān', meaning: 'room', hskLevel: 2 },
  { word: '考试', pinyin: 'kǎoshì', meaning: 'exam/test', hskLevel: 2 },
  { word: '快乐', pinyin: 'kuàilè', meaning: 'happy/joyful', hskLevel: 2 },
  { word: '健康', pinyin: 'jiànkāng', meaning: 'health/healthy', hskLevel: 2 },
  { word: '颜色', pinyin: 'yánsè', meaning: 'color', hskLevel: 2 },
  { word: '身体', pinyin: 'shēntǐ', meaning: 'body', hskLevel: 2 },
  { word: '虽然', pinyin: 'suīrán', meaning: 'although', hskLevel: 2 },
  { word: '因为', pinyin: 'yīnwèi', meaning: 'because', hskLevel: 2 },
  { word: '所以', pinyin: 'suǒyǐ', meaning: 'so/therefore', hskLevel: 2 },
  { word: '但是', pinyin: 'dànshì', meaning: 'but', hskLevel: 2 },
  { word: '然后', pinyin: 'ránhòu', meaning: 'then/after that', hskLevel: 2 },
  { word: '非常', pinyin: 'fēicháng', meaning: 'very', hskLevel: 2 },
  { word: '最', pinyin: 'zuì', meaning: 'most/-est', hskLevel: 2 },
  { word: '比', pinyin: 'bǐ', meaning: 'than/compare', hskLevel: 2 },
  { word: '每', pinyin: 'měi', meaning: 'every/each', hskLevel: 2 },
  { word: '已经', pinyin: 'yǐjīng', meaning: 'already', hskLevel: 2 },
  { word: '正在', pinyin: 'zhèngzài', meaning: 'in progress of', hskLevel: 2 },
  { word: '参加', pinyin: 'cānjiā', meaning: 'to participate', hskLevel: 2 },
  { word: '知道', pinyin: 'zhīdào', meaning: 'to know', hskLevel: 2 },
  { word: '告诉', pinyin: 'gàosù', meaning: 'to tell', hskLevel: 2 },
  { word: '帮助', pinyin: 'bāngzhù', meaning: 'to help', hskLevel: 2 },
  { word: '欢迎', pinyin: 'huānyíng', meaning: 'welcome', hskLevel: 2 },
  { word: '工作', pinyin: 'gōngzuò', meaning: 'work/job', hskLevel: 2 },

  // ---- HSK 3 级（300 词示例） ----
  { word: '世界', pinyin: 'shìjiè', meaning: 'world', hskLevel: 3 },
  { word: '故事', pinyin: 'gùshì', meaning: 'story', hskLevel: 3 },
  { word: '音乐', pinyin: 'yīnyuè', meaning: 'music', hskLevel: 3 },
  { word: '电影', pinyin: 'diànyǐng', meaning: 'movie/film', hskLevel: 3 },
  { word: '电视', pinyin: 'diànshì', meaning: 'television', hskLevel: 3 },
  { word: '电脑', pinyin: 'diànnǎo', meaning: 'computer', hskLevel: 3 },
  { word: '手机', pinyin: 'shǒujī', meaning: 'mobile phone', hskLevel: 3 },
  { word: '护照', pinyin: 'hùzhào', meaning: 'passport', hskLevel: 3 },
  { word: '长城', pinyin: 'chángchéng', meaning: 'Great Wall', hskLevel: 3 },
  { word: '检查', pinyin: 'jiǎnchá', meaning: 'to check/inspect', hskLevel: 3 },
  { word: '经常', pinyin: 'jīngcháng', meaning: 'often/frequently', hskLevel: 3 },
  { word: '突然', pinyin: 'tūrán', meaning: 'suddenly', hskLevel: 3 },
  { word: '重要', pinyin: 'zhòngyào', meaning: 'important', hskLevel: 3 },
  { word: '特别', pinyin: 'tèbié', meaning: 'special/especially', hskLevel: 3 },
  { word: '勇敢', pinyin: 'yǒnggǎn', meaning: 'brave', hskLevel: 3 },
  { word: '聪明', pinyin: 'cōngmíng', meaning: 'smart/clever', hskLevel: 3 },
  { word: '安静', pinyin: 'ānjìng', meaning: 'quiet/peaceful', hskLevel: 3 },
  { word: '容易', pinyin: 'róngyì', meaning: 'easy', hskLevel: 3 },
  { word: '困难', pinyin: 'kùnnán', meaning: 'difficult', hskLevel: 3 },
  { word: '奇怪', pinyin: 'qíguài', meaning: 'strange/odd', hskLevel: 3 },
];
