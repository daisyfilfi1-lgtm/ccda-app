// DeepSeek API client for AI-powered article generation
// v2 - Story-first generation with natural language, character-driven narratives

import { Article, ChineseWord, HskLevel } from './types';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// --- Rich fallback story templates with character+plot structure ---

interface StoryTemplate {
  title: string;
  setup: string;
  problem: string;
  resolution: string;
}

const STORY_TEMPLATES: StoryTemplate[] = [
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

// Higher-level story templates for HSK 7+ — richer narratives, abstract themes, more complex sentence structures
const HIGHER_STORY_TEMPLATES: StoryTemplate[] = [
  {
    title: '星空下的约定',
    setup: '{player}从小就喜欢仰望星空。每当夜幕降临，{player}就会爬到{place}的屋顶上，望着满天繁星发呆。"你知道吗？" {player}对{friend}说，"每一颗星星都可能是一个遥远的世界。"{friend}若有所思地点了点头。',
    problem: '有一天，{player}在{place2}发现了一颗从未见过的流星。它发出的光芒与其他星星截然不同——那是一种{object}般的蓝色。{player}决定用{object2}记录下这颗星星的轨迹。但是，{person}告诉{player}，那颗"星星"可能是一颗正在接近地球的小行星。',
    resolution: '{player}并没有被这个消息吓到。相反，{player}开始查阅大量关于天文学的书籍，还加入了学校的天文俱乐部。经过几个月的观察和研究，{player}发现那其实是一颗周期为{number}年的彗星。{player}将自己的发现写成了一篇报告，在全区的科学竞赛中获得了一等奖。评委{judge}评价道："这份研究的深度和热情，令人印象深刻。"',
  },
  {
    title: '穿越时空的来信',
    setup: '那是一个普通的星期三下午。{player}正在{place}整理旧物，突然从一本泛黄的{object}里掉出了一封信。信的开头写着："亲爱的未来的我……" {player}好奇地读了下去，发现这封信竟然是十年前自己写给未来的。那时候，{player}还是一个刚学会{action}的小孩子。',
    problem: '信的最后一行写道："十年后的我，你实现我们的梦想了吗？" {player}愣住了。这些年来，{player}一直在努力学习，却似乎忘记了当初最纯粹的热爱。{friend}看出了{player}的心事，建议道："为什么不从现在开始重新追梦呢？"',
    resolution: '{player}深受触动，决定每天抽出一点时间重新练习{action}。起初并不顺利，{coach}指出{player}的基础虽然扎实但缺乏创新。{player}没有放弃，而是更加刻苦地训练，同时阅读了大量关于{concept}的书籍。半年后，{player}参加了全市的比赛。虽然没有获得第一名，但{player}在日记中写道："我终于找回了那个敢于做梦的自己。"',
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
// Sub-categories for natural verbs
const ALL_DRINKS = ['水', '牛奶', '果汁', '茶', '可乐', '咖啡', '奶'];
const ALL_SOLID_FOODS = ['苹果', '蛋糕', '面包', '饼干', '冰淇淋', '水果', '面条', '鸡蛋', '米饭', '肉', '鱼'];
const ALL_PEOPLE_WORDS = ['妈妈', '爸爸', '哥哥', '姐姐', '弟弟', '妹妹', '老师', '朋友', '同学'];
const ALL_COLOR_WORDS = ['红色', '蓝色', '绿色', '白色', '黑色', '黄色', '彩色', '金色'];
const ALL_SIZE_WORDS = ['大', '小', '高', '矮', '长', '短', '胖', '瘦'];
const ALL_FEELING_WORDS = ['开心', '难过', '高兴', '喜欢', '爱', '害怕', '生气', '快乐'];
const ALL_NATURE_WORDS = ['太阳', '月亮', '星星', '花', '草', '树', '山', '河', '海', '云', '雨', '风'];
const ALL_ANIMAL_SIMPLE = ['猫', '狗', '鱼', '鸟', '马', '牛', '羊', '鸡', '鸭', '龙', '兔'];
const ALL_PLACE_SIMPLE = ['家', '学校', '医院', '商店', '公园', '图书馆', '超市', '车站'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStoryContext(hskLevel: HskLevel = 3): StoryContext {
  // Higher-level contexts use richer vocabulary sets
  const names = hskLevel >= 7
    ? ['小明', '小红', '小华', '小丽', '小刚', '朵朵', '乐乐', '天天', '子涵', '梓萱']
    : ALL_NAMES;
  const animals = hskLevel >= 7
    ? ['小白兔', '小花猫', '金毛犬', '小松鼠', '小刺猬', '小鸭子', '小熊猫', '小猴子', '梅花鹿', '白天鹅']
    : ALL_ANIMALS;

  return {
    player: randomPick(names),
    friend: randomPick(names.filter(n => n !== undefined)).trim() || randomPick(names),
    animal: randomPick(animals),
    animal2: randomPick(animals.filter(a => a !== undefined)).trim() || randomPick(animals),
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

function getSentenceForWord(word: string, ctx: StoryContext): string {
  const p = ctx.player;
  const f = ctx.friend;

  // 1. Drinks — use 喝
  if (ALL_DRINKS.includes(word)) {
    const perks = ['', '冰镇的', '热热的', '甜甜的'];
    return ` ${p}喝了一口${randomPick(perks)}${word}，觉得真好喝。`;
  }

  // 2. Solid foods — use 吃
  if (ALL_SOLID_FOODS.includes(word)) {
    const perks = ['美味的', '大大的', '香喷喷的', '甜甜的'];
    return ` ${p}吃了${randomPick(perks)}${word}，开心极了。`;
  }

  // 3. Other foods — fallback (冰淇淋 is in both, handled above)
  if (ALL_FOODS.includes(word)) {
    return ` ${p}尝了尝${word}，味道好极了。`;
  }

  // 4. People
  if (ALL_PEOPLE_WORDS.includes(word)) {
    const templates = [
      ` ${p}和${word}一起快乐地玩了一整天。`,
      ` ${p}最喜欢${word}了。`,
      ` ${p}对${word}说："谢谢你！"`,
      ` ${word}摸了摸${p}的头，${p}笑了。`,
    ];
    return randomPick(templates);
  }

  // 5. Colors
  if (ALL_COLOR_WORDS.includes(word)) {
    const things = ['小花', '气球', '蝴蝶', '衣服', '书包'];
    return ` ${p}看到一个${word}的${randomPick(things)}，高兴得跳了起来。`;
  }

  // 6. Size words
  if (ALL_SIZE_WORDS.includes(word)) {
    const nouns = ['苹果', '蛋糕', '狗', '树', '房子', '球'];
    const n = randomPick(nouns);
    return ` 那个${n}好${word}啊！${p}惊讶地叫了起来。`;
  }

  // 7. Feelings
  if (ALL_FEELING_WORDS.includes(word)) {
    const templates = [
      ` ${p}觉得非常${word}。`,
      ` ${p}感到有点${word}。`,
      ` ${p}的心里很${word}。`,
      ` \"我好${word}啊！\"${p}大声说。`,
    ];
    return randomPick(templates);
  }

  // 8. Nature
  if (ALL_NATURE_WORDS.includes(word)) {
    const templates = [
      ` 天上的${word}真漂亮！${p}抬头看着。`,
      ` ${p}喜欢看${word}。`,
      ` 一阵风吹来，${word}轻轻地摇动着。`,
    ];
    return randomPick(templates);
  }

  // 9. Simple animals
  if (ALL_ANIMAL_SIMPLE.includes(word)) {
    const templates = [
      ` 一只可爱的${word}跑了过来，${p}开心地摸了摸。`,
      ` ${p}看到了一只${word}，它对${p}叫了叫。`,
      ` \"你好，${word}！\"${p}说。`,
      ` ${p}最喜欢${word}了，每天都要去看它。`,
    ];
    return randomPick(templates);
  }

  // 10. Simple places
  if (ALL_PLACE_SIMPLE.includes(word)) {
    const templates = [
      ` ${p}和${f}一起去${word}玩。那里真热闹！`,
      ` ${p}回到了${word}，觉得像在家里一样温暖。`,
      ` \"我们去${word}吧！\"${p}说。大家都同意了。`,
    ];
    return randomPick(templates);
  }

  // 11. Actions (from the original list)
  if (ALL_ACTIONS.includes(word)) {
    const templates = [
      ` ${p}开心地${word}了起来。`,
      ` ${p}和${f}一起${word}，玩得很开心。`,
      ` 下午，${p}去${word}了。`,
    ];
    return randomPick(templates);
  }

  // 12. Places (from the original ALL_PLACES)
  if (ALL_PLACES.some(p => p.includes(word)) || ALL_PLACES.includes(word)) {
    return ` ${p}在${word}发现了一个有趣的东西。`;
  }

  // 13. Objects (from the original ALL_OBJECTS — strip 量词 prefix for matching)
  if (ALL_OBJECTS.some(o => o.includes(word) || word.includes(o.slice(2)))) {
    return ` ${p}拿起${word}，看了又看，爱不释手。`;
  }

  // 14. Default — word-level sensitive templates
  // If the word is 1 character, treat as object-like
  if (word.length === 1) {
    const templates = [
      ` ${p}拿起\"${word}\"字卡片，大声读了出来。`,
      ` ${p}在地上写了一个\"${word}\"字。`,
    ];
    return randomPick(templates);
  }

  // Multi-character word, unknown category — use varied natural frames
  const templates = [
    ` ${p}有一个${word}，非常珍惜它。`,
    ` 说起${word}，${p}总是滔滔不绝。`,
    ` ${p}对${word}特别感兴趣。`,
    ` \"真不错的${word}！\"${p}感叹道。`,
    ` ${p}学到了关于${word}的新知识。`,
  ];
  return randomPick(templates);
}

export function generateFallbackArticle(
  hskLevel: HskLevel,
  interestTags: string[],
  newWords: ChineseWord[],
  weakChars: string[],
): Article {
  // Pick a story template based on interests and level
  const tag = interestTags[0]?.toLowerCase() || '';

  // For HSK 7+, use richer story templates with more complex vocabulary
  let template;
  if (hskLevel >= 7) {
    template = randomPick(HIGHER_STORY_TEMPLATES);
  } else if (tag.includes('minecraft') || tag.includes('游戏')) {
    template = STORY_TEMPLATES[0]; // adventure
  } else if (tag.includes('恐龙') || tag.includes('动物')) {
    template = STORY_TEMPLATES[1]; // competition
  } else if (tag.includes('篮球') || tag.includes('运动')) {
    template = STORY_TEMPLATES[4]; // first try
  } else {
    template = randomPick(STORY_TEMPLATES);
  }

  const ctx = generateStoryContext(hskLevel);

  // Step 1: Build story with placeholders
  let story = `${template.setup}\n\n${template.problem}\n\n${template.resolution}`;

  // Step 2: Fill template placeholders FIRST (so injectWords gets resolved names)
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

  // Step 3: Inject target words as a natural post-story word practice section
  const wordSentences = newWords.map(w => getSentenceForWord(w.word, ctx)).join('');

  // Insert weak chars naturally as part of the character's actions
  let charSentences = '';
  if (weakChars.length > 0) {
    const chars = weakChars.slice(0, 3);
    for (const ch of chars) {
      const charTemplates = [
        ` ${ctx.player}在纸上写了一个大大的"${ch}"字。`,
        ` "这个字是'${ch}'。"${ctx.player}指着书说。`,
        ` ${ctx.player}仔细看了看"${ch}"字，记住了它的样子。`,
        ` "${ch}字真有趣！"${ctx.player}笑着说。`,
      ];
      charSentences += randomPick(charTemplates);
    }
  }

  // Append word + char sentences at end, separated by a blank line
  if (wordSentences || charSentences) {
    story += `\n\n`;
    if (wordSentences) story += wordSentences;
    if (charSentences) story += charSentences;
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

【读者水平】HSK ${hskLevel}级（适合${levelDesc(hskLevel)}水平的孩子独立阅读）

【兴趣主题】${interestStr}

【故事要求】
1. 🎭 **有角色** — 给主人公起名字（小明/小红/小动物等），读者能代入
2. 📖 **有情节** — 有简单的起承转合（遇到问题→解决→收获）
3. 💡 **有知识或道理** — 在故事中自然传递一个小知识或小道理
4. 🎯 **生词融入** — 把这些生词自然地编织进故事里（不要罗列）：${newWordsStr}
5. 🔄 **弱字重复** — 适当重复这些字：${weakCharsStr}
6. 📏 **字数** — 约${wordCountTarget}字
8. ⛔ **不要**在一句话里堆砌多个生词，要把它们分散在故事的不同段落
9. ⛔ **不要**在故事结束后加任何额外说明（如"你记住了xxx了吗"、"这些词要记住哦"等），故事讲完就结束
10. ✅ **故事要独立完整**，看起来就像一本真正的儿童书里的一页，不能有任何教学痕迹

【返回格式】
标题：[故事标题]
内容：[正文]`;
}

function getApiKey(): string {
  return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
}

function levelDesc(level: HskLevel): string {
  const map: Record<HskLevel, string> = {
    1: '初学者', 2: '初级', 3: '初中级',
    4: '中级', 5: '中高级', 6: '高级',
    7: '流利', 8: '精通', 9: '大师',
  };
  return map[level] || '中级';
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
    case 7: return 650;
    case 8: return 800;
    case 9: return 1000;
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
