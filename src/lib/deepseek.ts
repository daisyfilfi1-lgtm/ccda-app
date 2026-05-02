// DeepSeek API client for AI-powered article generation
// Uses OpenAI-compatible format

import { Article, ChineseWord, HskLevel } from './types';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// Rich, contextually valid story templates for fallback
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

function buildPrompt(
  hskLevel: HskLevel,
  interestTags: string[],
  newWords: ChineseWord[],
  weakChars: string[],
  wordCountTarget: number,
): string {
  const interestStr = interestTags.length > 0 ? interestTags.join('、') : '日常生活';
  const newWordsStr = newWords.length > 0 ? newWords.map(w => `${w.word}（${w.pinyin}，${w.meaning}）`).join('、') : '（无特定生词）';
  const weakCharsStr = weakChars.length > 0 ? weakChars.slice(0, 10).join('、') : '（无）';

  return `你是一位专门为海外华人儿童创作中文阅读材料的AI助手。请根据以下要求创作一篇中文短文：

【HSK等级】HSK ${hskLevel}级（适合中文${hskLevel === 1 ? '初学者，仅使用最简单词汇' :
    hskLevel === 2 ? '初级学习者，使用基础词汇' :
    hskLevel === 3 ? '初中级学习者' :
    hskLevel === 4 ? '中级学习者' :
    hskLevel === 5 ? '中高级学习者' : '高级学习者'}）

【兴趣主题】${interestStr}

【生词要求】请在文章中自然地包含以下生词（不要列表罗列，要在句子中自然使用）：${newWordsStr}

【薄弱字词】以下字词是用户薄弱项，请在文章中适当重复出现：${weakCharsStr}

【字数要求】约${wordCountTarget}字

【内容要求】
1. 文章必须有趣、有故事性，符合儿童阅读习惯
2. 使用简单自然的句子，适合目标HSK等级
3. 生词要在上下文中自然出现，帮助理解。重要：不要在一句话里罗列多个生词，要把它们分布在文章不同位置
4. 适当重复使用HSK ${hskLevel}级的常用词汇
5. 返回格式为：标题：[文章标题] 内容：[文章正文]`;
}

function getApiKey(): string {
  return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
}

export async function createDailyArticle(
  hskLevel: HskLevel,
  interestTags: string[],
  newWords: ChineseWord[],
  weakChars: string[],
): Promise<Article> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('[DeepSeek] No API key found, using template fallback');
      return generateFallbackArticle(hskLevel, interestTags, newWords, weakChars);
    }

    const wordCountTarget = getWordCountTarget(hskLevel);
    const prompt = buildPrompt(hskLevel, interestTags, newWords, weakChars, wordCountTarget);

    console.log(`[DeepSeek] Generating article for HSK${hskLevel}, interests: ${interestTags.join(',')}, ${newWords.length} new words`);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是CCDA中文阅读助手，专为海外华人儿童创作有趣的中文故事。你的回复必须简洁，只输出标题和正文。注意：不要把生词堆砌在一句话里，要分布在文章各处。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: Math.max(300, wordCountTarget * 2),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[DeepSeek] API error ${response.status}: ${errorText}`);
      return generateFallbackArticle(hskLevel, interestTags, newWords, weakChars);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content?.trim();

    if (!generatedText) {
      console.warn('[DeepSeek] Empty response, using fallback');
      return generateFallbackArticle(hskLevel, interestTags, newWords, weakChars);
    }

    return parseGeneratedArticle(generatedText, hskLevel, interestTags, newWords);
  } catch (error) {
    console.warn('[DeepSeek] Generation failed, using fallback:', error instanceof Error ? error.message : String(error));
    return generateFallbackArticle(hskLevel, interestTags, newWords, weakChars);
  }
}

function getWordCountTarget(hskLevel: HskLevel): number {
  switch (hskLevel) {
    case 1: return 80;
    case 2: return 120;
    case 3: return 180;
    case 4: return 250;
    case 5: return 350;
    case 6: return 450;
    default: return 120;
  }
}

function parseGeneratedArticle(
  text: string,
  hskLevel: HskLevel,
  interestTags: string[],
  newWords: ChineseWord[],
): Article {
  let title = '';
  let content = text;

  const titleMatch = text.match(/标题[：:]\s*(.+?)(?:\n|$)/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    content = text.replace(titleMatch[0], '').trim();
  }

  const contentMatch = content.match(/内容[：:]\s*([\s\S]*)/);
  if (contentMatch) {
    content = contentMatch[1].trim();
  }

  if (!title) {
    const firstLine = text.split('\n')[0]?.trim();
    if (firstLine && firstLine.length < 50) {
      title = firstLine;
      content = text.split('\n').slice(1).join('\n').trim();
    } else {
      title = '今日故事';
    }
  }

  return {
    id: `article_${Date.now()}`,
    title,
    content: `${title}\n\n${content}`,
    words: newWords,
    hskLevel,
    interestTags,
    generatedAt: Date.now(),
    wordCount: content.length / 2,
    characterCount: content.length,
  };
}

function generateFallbackArticle(
  hskLevel: HskLevel,
  interestTags: string[],
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

  // Insert new words NATURALLY into the story, not as a list
  if (newWords.length > 0) {
    const player = randomPick(NAMES);
    const newWordList = newWords.map(w => w.word);
    // Distribute words across natural sentences, don't concatenate
    for (const w of newWordList) {
      if (ACTIONS.includes(w)) {
        content += `，${player}高兴地${w}了`;
      } else if (FOODS.includes(w)) {
        content += `，${player}吃了美味的${w}`;
      } else if (PLACES.includes(w)) {
        content += `，${player}去了${w}`;
      } else {
        content += `，${player}学会了"${w}"这个字`;
      }
    }
    content += '。';
  }

  // Insert weak chars naturally
  if (weakChars.length > 0) {
    const weakStr = weakChars.slice(0, 3).join('');
    content += ` ${randomPick(NAMES)}开心地说："我认识${weakStr}这些字了！"`;
  }

  return {
    id: `article_${Date.now()}`,
    title,
    content: `${title}\n\n${content}`,
    words: newWords,
    hskLevel,
    interestTags,
    generatedAt: Date.now(),
    wordCount: content.length / 2,
    characterCount: content.length,
  };
}
