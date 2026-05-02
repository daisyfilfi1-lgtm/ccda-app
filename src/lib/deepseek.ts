// DeepSeek API client for AI-powered article generation
// v2 - Story-first generation with natural language, character-driven narratives

import { Article, ChineseWord, HskLevel } from './types';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// --- Rich fallback story templates with character+plot structure ---

const STORY_TEMPLATES: {
  title: string;
  setup: string;
  problem: string;
  resolution: string;
}[] = [
  {
    title: '小明的秘密基地',
    setup: '{player}在{place}发现了一个秘密的地方。那里有{object}和{object2}，非常漂亮。',
    problem: '有一天，{friend}来了，{player}不知道该不该告诉{friend}这个秘密。',
    resolution: '{player}想了想，决定和{friend}一起分享。他们成了最好的朋友。',
  },
  {
    title: '森林里的比赛',
    setup: '今天森林里要举行{event}比赛。{animal}和{animal2}都来参加了。',
    problem: '{animal}跑得很快，但是{animal2}跳得很高。它们不知道谁更厉害。',
    resolution: '{judge}说："你们都很棒！每个动物都有自己的本领。"大家都开心地笑了。',
  },
  {
    title: '神奇的一天',
    setup: '{player}早上醒来，发现窗外有一个{object}。{player}揉了揉眼睛，不敢相信。',
    problem: '{player}想去看看，但是又有点害怕。{friend}说："别怕，我们一起去看。"',
    resolution: '他们一起走出去，发现原来是{twist}！大家都笑了起来。',
  },
  {
    title: '礼物',
    setup: '今天是{person}的生日。{player}想送一个特别的礼物。',
    problem: '{player}想了很久，不知道送什么好。{object}？{object2}？都不太对。',
    resolution: '{player}决定自己动手做一个礼物。{person}收到后非常感动，说这是最好的礼物。',
  },
  {
    title: '第一次尝试',
    setup: '{player}从来没有{action}过，但是很想试一试。朋友们都说："加油！你可以的！"',
    problem: '一开始，{player}总是做不好，有点想放弃了。',
    resolution: '{coach}说："每个人都是从不会开始学的。" {player}又试了一次，终于成功了！',
  },
];

interface StoryContext {
  player: string;
  friend: string;
  animal: string;
  animal2: string;
  place: string;
  object: string;
  object2: string;
  action: string;
  event: string;
  judge: string;
  person: string;
  coach: string;
  twist: string;
  food: string;
}

const ALL_NAMES = ['小明', '小红', '小华', '小丽', '小刚', '朵朵', '乐乐', '天天'];
const ALL_PLACES = ['公园', '学校后院', '河边', '森林里', '草地上', '花园里', '山坡上', '图书馆'];
const ALL_ANIMALS = ['小兔子', '小猫', '小狗', '小松鼠', '小刺猬', '小鸭子', '小熊猫', '小猴子'];
const ALL_OBJECTS = ['一朵花', '一个盒子', '一颗星星', '一个气球', '一本书', '一幅画', '一个贝壳', '一块石头'];
const ALL_ACTIONS = ['跑步', '跳绳', '踢球', '画画', '唱歌', '跳舞', '骑车', '游泳'];
const ALL_EVENTS = ['跑步', '跳高', '画画', '唱歌'];
const ALL_FOODS = ['苹果', '蛋糕', '面包', '饼干', '冰淇淋', '牛奶', '水果', '面条'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStoryContext(): StoryContext {
  return {
    player: randomPick(ALL_NAMES),
    friend: randomPick(ALL_NAMES.filter(n => n !== undefined)).trim() || randomPick(ALL_NAMES),
    animal: randomPick(ALL_ANIMALS),
    animal2: randomPick(ALL_ANIMALS.filter(a => a !== undefined)).trim() || randomPick(ALL_ANIMALS),
    place: randomPick(ALL_PLACES),
    object: randomPick(ALL_OBJECTS),
    object2: randomPick(ALL_OBJECTS.filter(o => o !== undefined)).trim() || randomPick(ALL_OBJECTS),
    action: randomPick(ALL_ACTIONS),
    event: randomPick(ALL_EVENTS),
    judge: '猫头鹰老师',
    person: '妈妈',
    coach: '爸爸',
    twist: '一只小鸟在做梦',
    food: randomPick(ALL_FOODS),
  };
}

function injectWords(text: string, newWords: ChineseWord[], ctx: StoryContext): string {
  if (newWords.length === 0) return text;

  // Categorize words by type for natural insertion
  const actionWords = newWords.filter(w => ALL_ACTIONS.includes(w.word));
  const foodWords = newWords.filter(w => ALL_FOODS.includes(w.word));
  const placeWords = newWords.filter(w => ALL_PLACES.some(p => p.includes(w.word)));
  const otherWords = newWords.filter(w =>
    !actionWords.includes(w) && !foodWords.includes(w) && !placeWords.includes(w)
  );

  let result = text;

  // Insert action words
  for (const w of actionWords) {
    result += ` ${ctx.player}开心地${w.word}了起来。`;
  }

  // Insert food words
  for (const w of foodWords) {
    result += ` ${ctx.player}吃了美味的${w.word}，真好吃。`;
  }

  // Insert other words naturally
  for (const w of otherWords) {
    result += ` ${ctx.player}学会了"${w.word}"这个词语。`;
  }

  return result;
}

export function generateFallbackArticle(
  hskLevel: HskLevel,
  interestTags: string[],
  newWords: ChineseWord[],
  weakChars: string[],
): Article {
  // Pick a story template based on interests
  const tag = interestTags[0]?.toLowerCase() || '';
  let template;
  if (tag.includes('minecraft') || tag.includes('游戏')) {
    template = STORY_TEMPLATES[0]; // adventure
  } else if (tag.includes('恐龙') || tag.includes('动物')) {
    template = STORY_TEMPLATES[1]; // competition
  } else if (tag.includes('篮球') || tag.includes('运动')) {
    template = STORY_TEMPLATES[4]; // first try
  } else {
    template = randomPick(STORY_TEMPLATES);
  }

  const ctx = generateStoryContext();

  let story = `${template.setup}\n\n${template.problem}\n\n${template.resolution}`;
  story = injectWords(story, newWords, ctx);

  // Fill template placeholders
  story = story
    .replace(/{player}/g, ctx.player)
    .replace(/{friend}/g, ctx.friend)
    .replace(/{animal}/g, ctx.animal)
    .replace(/{animal2}/g, ctx.animal2)
    .replace(/{place}/g, ctx.place)
    .replace(/{object}/g, ctx.object)
    .replace(/{object2}/g, ctx.object2)
    .replace(/{action}/g, ctx.action)
    .replace(/{event}/g, ctx.event)
    .replace(/{judge}/g, ctx.judge)
    .replace(/{person}/g, ctx.person)
    .replace(/{coach}/g, ctx.coach)
    .replace(/{twist}/g, ctx.twist)
    .replace(/{food}/g, ctx.food);

  // Insert weak chars
  if (weakChars.length > 0) {
    const chars = weakChars.slice(0, 3).join('、');
    story += ` ${ctx.player}指着字说："${chars}，这些字我都认识！"`;
  }

  const title = template.title;

  return {
    id: `article_${Date.now()}`,
    title,
    content: `${title}\n\n${story}`,
    words: newWords,
    hskLevel,
    interestTags,
    generatedAt: Date.now(),
    wordCount: story.length / 2,
    characterCount: story.length,
  };
}

// --- Prompt for DeepSeek API (story-first generation) ---

function buildPrompt(
  hskLevel: HskLevel,
  interestTags: string[],
  newWords: ChineseWord[],
  weakChars: string[],
  wordCountTarget: number,
): string {
  const interestStr = interestTags.length > 0 ? interestTags.join('、') : '日常生活';
  const newWordsStr = newWords.length > 0
    ? newWords.map(w => `${w.word}（${w.pinyin}，${w.meaning}）`).join('、')
    : '（无特定生词）';
  const weakCharsStr = weakChars.length > 0 ? weakChars.slice(0, 10).join('、') : '（无）';

  return `你是一位优秀的儿童文学作家，专为海外华人儿童创作中文故事。

请写一篇有趣的**故事**，要求：

【读者水平】HSK ${hskLevel}级（适合${hskLevel === 1 ? '初学者' : hskLevel === 2 ? '初级' : hskLevel === 3 ? '初中级' : '中级'}水平的孩子独立阅读）

【兴趣主题】${interestStr}

【故事要求】
1. 🎭 **有角色** — 给主人公起名字（小明/小红/小动物等），读者能代入
2. 📖 **有情节** — 有简单的起承转合（遇到问题→解决→收获）
3. 💡 **有知识或道理** — 在故事中自然传递一个小知识或小道理
4. 🎯 **生词融入** — 把这些生词自然地编织进故事里（不要罗列）：${newWordsStr}
5. 🔄 **弱字重复** — 适当重复这些字：${weakCharsStr}
6. 📏 **字数** — 约${wordCountTarget}字
7. ⛔ **不要**在一句话里堆砌多个生词，要把它们分散在故事的不同段落

【返回格式】
标题：[故事标题]
内容：[正文]`;
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
            content: '你是一位专为海外华人儿童写故事的AI作家。每次创作一个完整的短篇故事，要有角色、有情节、有温度。生词要自然地分布在故事的不同位置，不要集中在一句话里。故事要有教育意义或传递正能量。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: Math.max(400, wordCountTarget * 3),
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
    case 1: return 100;
    case 2: return 150;
    case 3: return 220;
    case 4: return 300;
    case 5: return 400;
    case 6: return 500;
    default: return 150;
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
