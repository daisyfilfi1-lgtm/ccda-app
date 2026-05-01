import { ChineseWord, HskLevel, Article } from './types';

/**
 * Build a prompt for the article generation LLM call.
 * This constructs a detailed prompt based on the child's profile and target words.
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
 * In MVP, we use template-generated articles instead.
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
