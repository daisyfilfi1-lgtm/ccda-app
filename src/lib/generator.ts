import { ChineseWord, HskLevel, Article } from './types';

/**
 * Build a prompt for the article generation LLM call.
 */
export function buildArticlePrompt(params: {
  level: HskLevel;
  interests: string[];
  targetWords: ChineseWord[];
  age: number;
}): string {
  const { level, interests, targetWords, age } = params;
  const wordsList = targetWords.map(w =>
    `- ${w.word} (${w.pinyin}): ${w.meaning}`
  ).join('\n');

  return `You are a Chinese language teacher creating a short reading passage for a ${age}-year-old overseas Chinese child.

STUDENT PROFILE:
- Chinese level: HSK ${level}
- Interests: ${interests.join(', ')}
- Age: ${age}

TARGET VOCABULARY (must include these words naturally):
${wordsList}

REQUIREMENTS:
1. Write a short, engaging story (150-250 characters) about ${interests[0] || 'a fun topic'}
2. Naturally incorporate ALL target vocabulary words
3. Use mostly HSK ${level} level grammar and vocabulary, with some i+1 challenge
4. The story should be fun and age-appropriate
5. Output ONLY the story text, no explanations

STORY:`;
}

/**
 * Parse an article from an LLM response.
 */
export function parseArticleFromResponse(
  response: string,
  meta: {
    targetWords: ChineseWord[];
    level: HskLevel;
    interests: string[];
  }
): Article {
  const lines = response.trim().split('\n');
  const title = lines[0]?.replace(/^#\s*/, '').replace(/^《(.+)》$/, '$1') || '今日故事';
  const content = lines.slice(1).join('\n').trim() || response.trim();

  return {
    id: `article_${Date.now()}`,
    title,
    content,

    words: meta.targetWords,
    hskLevel: meta.level,
    interestTags: meta.interests,
    generatedAt: Date.now(),
    wordCount: content.length / 2,
    characterCount: content.length,
  };
}

/**
 * Call DeepSeek API to generate an article.
 * Falls back to template if API key is placeholder.
 */
export async function generateArticle(params: {
  level: HskLevel;
  interests: string[];
  targetWords: ChineseWord[];
  age: number;
}): Promise<Article> {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';

  if (!apiKey || apiKey === '***' || apiKey.startsWith('sk-xxx')) {
    const mockBody = `从前有一个${params.interests[0] || '小猫'}，它很喜欢${params.interests.slice(1).join('和') || '玩'}。它每天都很开心。有一天它决定去旅行，走了很远的路，看到了很多新东西。最后它回到家说：外面的世界很美丽，但我最喜欢的还是和你们在一起。`;
    return {
      id: `article_mock_${Date.now()}`,
      title: `${params.interests[0] || '故事'}的冒险`,
      content: mockBody,
      words: params.targetWords,
      hskLevel: params.level,
      interestTags: params.interests,
      generatedAt: Date.now(),
      wordCount: mockBody.length / 2,
      characterCount: mockBody.length,
    };
  }

  const prompt = buildArticlePrompt(params);
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个为海外华裔儿童创作中文故事的AI作家。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    console.error('DeepSeek API error:', res.status);
    return generateArticle({ ...params, targetWords: params.targetWords.slice(0, 3) });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return parseArticleFromResponse(content, {
    targetWords: params.targetWords,
    level: params.level,
    interests: params.interests,
  });
}
