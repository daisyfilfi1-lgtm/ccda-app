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
  // Higher-level templates for HSK 4+ — longer, more narrative depth
  adventure: {
    titles: ['神秘的古堡探险', '失落的宝藏', '时空旅行者的日记', '魔法森林的秘密'],
    templates: [
      '从前，有一个名叫{player}的小探险家。一天，{player}在{place}发现了一张古老的地图。地图上画着一条蜿蜒的小路，通向一座神秘的{place2}。{player}决定带着{friend}一起去探险。他们走了很久很久，遇到了{number}只{animal}和一片茂密的{forest}。在路上，{player}发现了一个古老的{object}，上面刻着奇怪的符号。{friend}说："这一定是传说中的{treasure}！"他们小心翼翼地打开它，发现里面竟然有一封{person}留下的信。信上写道："勇敢的孩子，你找到了真正的宝藏——那就是探索世界的勇气。"',
    ],
  },
  discovery: {
    titles: ['科学小发现', '地球的秘密', '星星为什么会发光', '大自然的奇迹'],
    templates: [
      '{player}是一个非常喜欢问"为什么"的孩子。每天早上，{player}都会观察窗外的{animal}和{plant}。有一天，{player}注意到{topic}发生了奇怪的变化。"{friend}，你快来看！" {player}兴奋地喊道。{friend}跑过来看了看，也觉得非常惊讶。他们决定一起做一个实验。首先，他们准备了{object}和{object2}。然后，他们按照{person}教的方法，一步一步地操作。过了一会儿，奇迹发生了——{result}！{player}高兴地跳了起来："我明白了！原来这就是{concept}的原理！"从那以后，{player}更加热爱科学了，每天都会记录新的发现。',
    ],
  },
};

const PLACES = ['公园', '学校', '山上', '河边', '森林', '草地', '海边', '花园'];
const PLACES2 = ['山谷', '山洞', '古城', '岛屿', '沙漠', '瀑布', '火山', '冰川'];
const FORESTS = ['森林', '竹林', '松树林', '榕树林'];
const TREASURES = ['宝藏', '魔法石', '时光胶囊', '智慧之书'];
const PLANTS = ['向日葵', '小树苗', '玫瑰花', '仙人掌'];
const TOPICS = ['天空', '水面', '树叶', '石头', '影子', '温度', '声音'];
const CONCEPTS = ['毛细现象', '光合作用', '水的循环', '磁力', '回声'];
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

  // For HSK 4+, prefer higher-level templates (adventure/discovery) as fallback
  let templateKey: string;
  if (INTEREST_ARTICLE_TEMPLATES[tag]) {
    templateKey = tag;
  } else if (hskLevel >= 4) {
    templateKey = Math.random() > 0.5 ? 'adventure' : 'discovery';
  } else {
    templateKey = 'minecraft';
  }
  const template = INTEREST_ARTICLE_TEMPLATES[templateKey];
  const title = randomPick(template.titles);

  let content = randomPick(template.templates)
    .replace(/{player}/g, randomPick(NAMES))
    .replace(/{place}/g, randomPick(PLACES))
    .replace(/{place2}/g, randomPick(PLACES2))
    .replace(/{forest}/g, randomPick(FORESTS))
    .replace(/{treasure}/g, randomPick(TREASURES))
    .replace(/{plant}/g, randomPick(PLANTS))
    .replace(/{topic}/g, randomPick(TOPICS))
    .replace(/{concept}/g, randomPick(CONCEPTS))
    .replace(/{animal}/g, randomPick(ANIMALS))
    .replace(/{action}/g, randomPick(ACTIONS))
    .replace(/{name}/g, randomPick(NAMES))
    .replace(/{other}/g, randomPick(OTHERS))
    .replace(/{food}/g, randomPick(FOODS))
    .replace(/{bodyPart}/g, randomPick(BODY_PARTS))
    .replace(/{result}/g, Math.random() > 0.5 ? '成功了' : '还需要再试一次')
    .replace(/{coach}/g, '教练')
    .replace(/{number}/g, Math.floor(Math.random() * 10 + 2).toString());

  // Add some level-appropriate vocabulary
  const levelWords = getWordsByLevel(hskLevel);
  const extraWords = levelWords
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.word);

  // Insert a couple of new words naturally into the content
  if (newWords.length > 0) {
    content += ' ' + newWords.map(w => w.word).join('、') + '。';
  }

  // Insert weak characters into the article for repeated exposure
  const weakCharSection = weakChars.length > 0
    ? ' ' + weakChars.slice(0, 5).join('、')
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

  // Get review words based on SRS — count scales with HSK level
  const level = profile.hskLevel;
  const reviewCount = level <= 2 ? 3 : level <= 4 ? 5 : level <= 6 ? 7 : 10;
  const reviewWords = getReviewWords(reviewCount);

  // Get new words to learn based on level
  const levelWords = getWordsByLevel(profile.hskLevel);
  const availableNew = levelWords.filter(
    lw => !reviewWords.find(rw => rw.word === lw.word)
  );

  // Max new words per session scales with level; adjust based on QC feedback
  const baseNewWords = level <= 3 ? 5 : level <= 6 ? 7 : 10;
  const maxNewWords = Math.max(1, Math.round(baseNewWords * adaptation.newWordDensity));
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
