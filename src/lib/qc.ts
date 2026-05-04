import { ChineseWord, QuizQuestion, HskLevel, Article } from './types';
import { getAllWords, getWordsByLevel } from './hsk';

/**
 * Generate 3 tiered quiz questions after reading an article.
 *
 * Q1 (weak_word): Test SRS weak words — HSK 1-3 char/meaning, HSK 4-6 fill-blank, HSK 7-9 synonym
 * Q2 (listening):   TTS-based listening — HSK 1-3 true/false, HSK 4-6 sentence Q&A, HSK 7-9 passage inference
 * Q3 (context_cloze): Fill blank with article sentence containing a weak word
 */
export function generateQuiz(
  weakWords: ChineseWord[],
  article: Article,
  hskLevel: HskLevel
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const allWords = getAllWords();
  const articleWords = article.words || [];

  // Prioritize weak words that appear in the article content
  const effectiveWords = weakWords.length > 0
    ? weakWords
    : (articleWords.length > 0 ? articleWords : allWords.filter(w => w.hskLevel === hskLevel));

  // Q1: Weak word test
  if (effectiveWords.length > 0) {
    questions.push(generateWeakWordQuestion(effectiveWords, article, hskLevel, allWords));
  }

  // Q2: Listening comprehension
  if (article.content.length > 10 && effectiveWords.length > 0) {
    questions.push(generateListeningQuestion(effectiveWords, article, hskLevel, allWords));
  }

  // Q3: Context cloze
  if (article.content.length > 10 && effectiveWords.length > 0) {
    const q3 = generateContextClozeQuestion(effectiveWords, article, hskLevel, allWords);
    if (q3) questions.push(q3);
  }

  // Edge case: if not enough data, pad with Q1-style questions
  if (questions.length === 0 && allWords.length > 0) {
    const fallback = allWords.filter(w => w.hskLevel === hskLevel);
    if (fallback.length > 0) {
      questions.push(generateWeakWordQuestion(fallback, article, hskLevel, allWords));
    }
  }

  return questions;
}

// ─── Q1: Weak Word Test ───────────────────────────────────────────────────────

function generateWeakWordQuestion(
  words: ChineseWord[],
  article: Article,
  hskLevel: HskLevel,
  allWords: ChineseWord[]
): QuizQuestion {
  // Pick a word — prefer one that appears in the article
  let target = words.find(w => article.content.includes(w.word))
    || words[Math.floor(Math.random() * words.length)];
  if (!target) target = words[0];

  const sameLevelWords = allWords.filter(w => w.hskLevel === target.hskLevel && w.word !== target.word);

  if (hskLevel <= 3) {
    // HSK 1-3: single char → test pinyin, multi-char → test meaning
    if (target.word.length === 1) {
      // Character test: show char, pick pinyin
      const distractors = sameLevelWords
        .filter(w => w.pinyin !== target.pinyin)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = shuffle([target.pinyin, ...distractors.map(d => d.pinyin)]);
      return {
        id: 'q1',
        type: 'weak_word',
        word: target,
        prompt: target.word,
        options,
        correctAnswer: target.pinyin,
      };
    } else {
      // Word test: show word, pick meaning
      const distractors = sameLevelWords
        .filter(w => w.meaning !== target.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = shuffle([target.meaning, ...distractors.map(d => d.meaning)]);
      return {
        id: 'q1',
        type: 'weak_word',
        word: target,
        prompt: target.word,
        options,
        correctAnswer: target.meaning,
      };
    }
  } else if (hskLevel <= 6) {
    // HSK 4-6: fill-in-the-blank from article sentence
    const sentences = splitSentences(article.content);
    const sentence = sentences.find(s => s.includes(target.word))
      || `我看见了一个${target.word}，它真好看。`;
    const blankSentence = sentence.replace(target.word, '____');
    const distractors = sameLevelWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = shuffle([target.word, ...distractors.map(d => d.word)]);
    return {
      id: 'q1',
      type: 'weak_word',
      word: target,
      prompt: blankSentence,
      options,
      correctAnswer: target.word,
    };
  } else {
    // HSK 7-9: synonym/definition matching (all Chinese)
    // Use the word's meaning as the "definition" and find distractors
    const distractors = sameLevelWords
      .filter(w => w.meaning !== target.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = shuffle([target.meaning, ...distractors.map(d => d.meaning)]);
    return {
      id: 'q1',
      type: 'weak_word',
      word: target,
      prompt: `选择"${target.word}"的正确解释：`,
      options,
      correctAnswer: target.meaning,
    };
  }
}

// ─── Q2: Listening Comprehension ──────────────────────────────────────────────

function generateListeningQuestion(
  words: ChineseWord[],
  article: Article,
  hskLevel: HskLevel,
  allWords: ChineseWord[]
): QuizQuestion {
  const sentences = splitSentences(article.content);
  const target = words.find(w => sentences.some(s => s.includes(w.word)))
    || words[Math.floor(Math.random() * words.length)];

  if (hskLevel <= 3) {
    // HSK 1-3: listen to word, then listen to sentence → true/false: did sentence contain the word?
    const sentenceWithWord = sentences.find(s => s.includes(target.word));
    // 50% chance of correct (word is in sentence) vs incorrect (similar word)
    const isTrue = Math.random() > 0.5;
    if (isTrue && sentenceWithWord) {
      return {
        id: 'q2',
        type: 'listening',
        word: target,
        audioText: `${target.word}。${sentenceWithWord}`,
        questionText: `你听到了"${target.word}"吗？`,
        options: ['正确', '错误'],
        correctAnswer: '正确',
        isTrueFalse: true,
      };
    } else {
      // Find a similar-sounding word for the false case
      const similarWord = allWords.find(w =>
        w.word !== target.word &&
        w.hskLevel === target.hskLevel &&
        (w.pinyin[0] === target.pinyin[0] || w.word.length === target.word.length)
      ) || sentences.find(s => !s.includes(target.word))?.slice(0, 10) || '今天';
      const otherSentence = sentences.find(s => !s.includes(target.word))
        || `${target.word}是一个有趣的字。`;
      return {
        id: 'q2',
        type: 'listening',
        word: target,
        audioText: `${target.word}。${otherSentence}`,
        questionText: `你听到了"${target.word}"吗？`,
        options: ['正确', '错误'],
        correctAnswer: sentences.find(s => s.includes(target.word))
          ? '正确'
          : '错误',
        isTrueFalse: true,
      };
    }
  } else if (hskLevel <= 6) {
    // HSK 4-6: listen to a sentence from article, answer a question about it
    const sentence = sentences.find(s => s.includes(target.word))
      || sentences[0] || article.content.slice(0, 50);
    const question = `这句话里的"${target.word}"是什么意思？`;
    const sameLevelWords = allWords.filter(w =>
      w.hskLevel === target.hskLevel && w.word !== target.word
    );
    const distractors = sameLevelWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = shuffle([target.meaning, ...distractors.map(d => d.meaning)]);
    return {
      id: 'q2',
      type: 'listening',
      word: target,
      audioText: sentence,
      questionText: question,
      options,
      correctAnswer: target.meaning,
    };
  } else {
    // HSK 7-9: listen to 2-3 sentence passage, inference question
    const passage = sentences.slice(0, 3).join('。') + '。';
    const inferenceWords = ['因为', '所以', '但是', '虽然', '而且', '如果', '那么'];
    const hasInference = inferenceWords.some(w => passage.includes(w));
    const question = hasInference
      ? '这段内容主要说明了什么？'
      : '这段话告诉我们什么？';
    const sameLevelWords = allWords.filter(w => w.hskLevel === target.hskLevel);
    const distractors = sameLevelWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    // Use the article title or first few chars as a proxy for "correct answer" for inference
    const correctInference = article.title.length > 3
      ? article.title
      : '这段内容讲述了重要的道理。';
    const options = shuffle([correctInference, ...distractors.map(d => d.meaning).slice(0, 3)]);
    return {
      id: 'q2',
      type: 'listening',
      word: target,
      audioText: passage,
      questionText: question,
      options,
      correctAnswer: correctInference,
    };
  }
}

// ─── Q3: Context Cloze ────────────────────────────────────────────────────────

function generateContextClozeQuestion(
  words: ChineseWord[],
  article: Article,
  hskLevel: HskLevel,
  allWords: ChineseWord[]
): QuizQuestion | null {
  const sentences = splitSentences(article.content)
    .filter(s => s.trim().length > 10); // meaningful sentences only

  if (sentences.length === 0) return null;

  // Find a sentence containing a weak word
  let targetSentence: string | undefined;
  let targetWord: ChineseWord | undefined;

  // Prioritize words that appear in a sentence
  for (const word of shuffle([...words])) {
    const match = sentences.find(s => s.includes(word.word));
    if (match) {
      targetSentence = match;
      targetWord = word;
      break;
    }
  }

  if (!targetSentence || !targetWord) {
    // Fall back to first sentence and first word
    targetSentence = sentences[0];
    targetWord = words[0];
  }

  // Remove the target word from the sentence
  const blankSentence = targetSentence.replace(targetWord.word, '____');
  const sameLevelWords = allWords.filter(w =>
    w.hskLevel === targetWord.hskLevel && w.word !== targetWord.word
  );
  const distractors = sameLevelWords
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = shuffle([targetWord.word, ...distractors.map(d => d.word)]);

  return {
    id: 'q3',
    type: 'context_cloze',
    word: targetWord,
    sentence: blankSentence,
    options,
    correctAnswer: targetWord.word,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .replace(/[。！？\n]/g, '|')
    .split('|')
    .filter(s => s.trim().length > 3)
    .map(s => s.trim());
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Check Answer ─────────────────────────────────────────────────────────────

export function checkAnswer(question: QuizQuestion, answer: string): boolean {
  return answer === question.correctAnswer;
}
