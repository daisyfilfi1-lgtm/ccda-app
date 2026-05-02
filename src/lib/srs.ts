import { LexiconEntry, HskLevel, Article, ChineseWord, QcFeedback } from './types';
import { getReviewWords, getOrCreateEntry, getPendingWords,
         getOrCreateCharEntry, getQcAdaptation, getWeakChars,
         updatePendingWords, setQcFeedback } from './lexicon';
import { getWordsByLevel, extractChars, getCharsByLevel } from './hsk';
import { createDailyArticle } from './deepseek';

// SRS (Spaced Repetition) Engine
// Manages when words should be reviewed based on mastery level
// Enhanced with: char/word dual tracking, pendingWords, interval decay, QC feedback loop

export interface SrsTask {
  newWords: ChineseWord[];
  reviewWords: LexiconEntry[];
  article: Article;
}

const INTEREST_ARTICLE_TEMPLATES: Record<string, {
  titles: string[];
  templates: string[];
}> = {
  minecraft: {
    titles: ['我的世界大冒险', '史蒂夫的新朋友', '苦力怕的生日', '钻石在哪里'],
    templates: [
      '今天，{player}在{place}玩。{player}看到了一只{animal}。{animal}说："你好！我们一起玩吧！"{player}很高兴，说："好的！"他们一起{action}，玩得很开心。',
    ],
  },
  pokemon: {
    titles: ['皮卡丘的一天', '宝可梦大冒险', '小智的新伙伴', '精灵球里的秘密'],
    templates: [
      '{player}有一只{animal}，它的名字叫{name}。{animal}喜欢{action}。有一天，{player}和{animal}去了{place}。在那里，他们遇到了{other}。{other}说："你们好！"他们一起{action}，成为了好朋友。',
    ],
  },
  basketball: {
    titles: ['篮球小明星', '第一次投篮', '球队的新成员', '胜利的一球'],
    templates: [
      '今天{player}去打篮球。{player}投了一个球，{result}。{coach}说："加油！你可以的！"{player}又投了一个球，{result}。{player}很高兴，说："我学会了！"',
    ],
  },
  dinosaur: {
    titles: ['恐龙世界', '霸王龙的朋友', '三角龙的大冒险', '恐龙蛋的秘密'],
    templates: [
      '在很久很久以前，有一只{animal}。它很大很大，有{number}个{bodyPart}那么大。{animal}喜欢吃{food}。有一天，{animal}在{place}遇到了{other}。{other}说："你好！"他们成为了朋友。',
    ],
  },
};

const PLACES = ['公园', '学校', '山上', '河边', '森林', '草地', '海边', '花园'];
const ANIMALS = ['小猫', '小狗', '小鸟', '小鱼', '兔子', '小熊', '大象', '猴子'];
const ACTIONS = ['跑步', '跳舞', '唱歌', '画画', '看书', '玩游戏', '游泳', '骑车'];
const NAMES = ['小明', '小红', '小华', '小丽', '小刚'];
const FOODS = ['苹果', '面包', '牛奶', '蛋糕', '鸡蛋', '米饭', '面条', '水果'];
const BODY_PARTS = ['头', '手', '脚', '眼睛', '耳朵', '嘴巴'];
const OTHERS = ['一只小猫', '一只小狗', '一个小朋友', '一只小鸟', '一条小鱼'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateArticleContent(
  interestTags: string[],
  hskLevel: HskLevel,
  newWords: ChineseWord[],
  weakChars: string[],
): Article {
  const tag = interestTags[0]?.toLowerCase() || 'general';
  const template = INTEREST_ARTICLE_TEMPLATES[tag] || INTEREST_ARTICLE_TEMPLATES['minecraft'];
  const title = randomPick(template.titles);

  let content = randomPick(template.templates)
    .replace(/{player}/g, randomPick(NAMES))
    .replace(/{place}/g, randomPick(PLACES))
    .replace(/{animal}/g, randomPick(ANIMALS))
    .replace(/{action}/g, randomPick(ACTIONS))
    .replace(/{name}/g, randomPick(NAMES))
    .replace(/{other}/g, randomPick(OTHERS))
    .replace(/{food}/g, randomPick(FOODS))
    .replace(/{bodyPart}/g, randomPick(BODY_PARTS))
    .replace(/{result}/g, Math.random() > 0.5 ? '进了' : '没进')
    .replace(/{coach}/g, '教练')
    .replace(/{number}/g, Math.floor(Math.random() * 10 + 2).toString());

  // Add some level-appropriate vocabulary
  const levelWords = getWordsByLevel(hskLevel);
  const extraWords = levelWords
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.word);

  // Insert a couple of new words naturally
  if (newWords.length > 0) {
    content += ' ' + newWords.map(w => w.word).join('、') + '真好看！';
  }

  // Insert weak characters into the article for repeated exposure
  const weakCharSection = weakChars.length > 0
    ? ' ' + weakChars.slice(0, 5).join('、') + '这些字要记住哦！'
    : '';

  return {
    id: `article_${Date.now()}`,
    title,
    content: `${title}\n\n${content}${weakCharSection}`,
    words: [...newWords],
    hskLevel,
    interestTags,
    generatedAt: Date.now(),
    wordCount: content.length / 2,
    characterCount: content.length,
  };
}

export async function getTodayTask(
  profile: { hskLevel: HskLevel; interests: string[] },
  customWords?: ChineseWord[],
): Promise<SrsTask> {
  // --- QC feedback loop: get adaptation params ---
  const adaptation = getQcAdaptation();
  const weakChars = getWeakChars();

  // Get review words based on SRS
  const reviewWords = getReviewWords(3);

  // Get new words to learn based on level
  const levelWords = getWordsByLevel(profile.hskLevel);
  const availableNew = levelWords.filter(
    lw => !reviewWords.find(rw => rw.word === lw.word)
  );

  // Adjust new word count based on QC feedback
  const maxNewWords = Math.max(1, Math.round(5 * adaptation.newWordDensity));
  const newWords = customWords || availableNew
    .sort(() => Math.random() - 0.5)
    .slice(0, maxNewWords);

  // --- Char tracking: ensure all chars from new/review words are tracked ---
  const allWordStrings = [
    ...newWords.map(w => w.word),
    ...reviewWords.map(rw => rw.word),
  ];
  const allChars = extractChars(allWordStrings);
  for (const ch of allChars) {
    getOrCreateCharEntry(ch);
  }

  // --- PendingWords: automatically activate words whose chars are mastered ---
  updatePendingWords();
  const pendingWords = getPendingWords();

  // Boost pending words into consideration
  const pendingBoosted = pendingWords.slice(0, 3);
  const pendingWordObjects: ChineseWord[] = pendingBoosted.map(pw => ({
    word: pw.word,
    pinyin: '',
    meaning: '',
    hskLevel: pw.hskLevel,
  }));

  // Merge pending words into newWords (don't exceed count too much)
  const combinedNew = [...newWords];
  for (const pw of pendingWordObjects) {
    if (!combinedNew.find(nw => nw.word === pw.word)) {
      combinedNew.push(pw);
    }
  }

  const article = await createDailyArticle(
    profile.hskLevel,
    profile.interests,
    combinedNew,
    weakChars,
  );

  // Attach weak chars to article for QC to use
  (article as any).weakChars = weakChars;

  return {
    newWords: combinedNew,
    reviewWords,
    article,
  };
}

/**
 * Process QC feedback after a quiz session.
 * This feeds quality metrics back into SRS for adaptive generation.
 */
export function processQcFeedback(feedback: {
  wordResults: { word: string; correct: boolean }[];
  charResults: { char: string; correct: boolean }[];
}): void {
  const weakWords: string[] = [];
  const weakChars: string[] = [];
  let correctCount = 0;
  let totalCount = 0;

  for (const r of feedback.wordResults) {
    totalCount++;
    if (r.correct) {
      correctCount++;
    } else {
      weakWords.push(r.word);
    }
  }

  for (const r of feedback.charResults) {
    totalCount++;
    if (r.correct) {
      correctCount++;
    } else {
      weakChars.push(r.char);
    }
  }

  const accuracy = totalCount > 0 ? correctCount / totalCount : 1;
  const qualityIssue = accuracy < 0.7;

  setQcFeedback({ weakWords, weakChars, accuracy });

  // Log adaptation for debugging
  if (qualityIssue) {
    const adaptation = getQcAdaptation();
    console.log(`[SRS QC] Accuracy ${accuracy.toFixed(2)}, adjusting: newWordDensity=${adaptation.newWordDensity.toFixed(2)}, weakCharBoost=${adaptation.weakCharBoost}`);
  }
}

// For compatibility with existing code that might import `getTodayLearningTask`
export const getTodayLearningTask = getTodayTask;
