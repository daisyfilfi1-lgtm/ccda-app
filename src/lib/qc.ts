import { ChineseWord, QuizQuestion } from './types';
import { getWordsByLevel } from './hsk';
import { getEntry } from './lexicon';

// Generate quiz questions after reading an article
export function generateQuiz(
  articleWords: ChineseWord[],
  article: { title: string; content: string }
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Q1: Word meaning (4 choices)
  if (articleWords.length > 0) {
    const targetWord = articleWords[Math.floor(Math.random() * articleWords.length)];
    const allWords = getWordsByLevel(targetWord.hskLevel);
    const distractors = allWords
      .filter(w => w.word !== targetWord.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [targetWord.meaning, ...distractors.map(d => d.meaning)]
      .sort(() => Math.random() - 0.5);

    questions.push({
      id: 'q1',
      type: 'word_meaning',
      word: targetWord,
      options,
      correctAnswer: targetWord.meaning,
    });
  }

  // Q2: Sentence ordering
  const sentences = article.content
    .replace(/[。！？\n]/g, '|')
    .split('|')
    .filter(s => s.trim().length > 5)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  if (sentences.length >= 2) {
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    questions.push({
      id: 'q2',
      type: 'sentence_order',
      options: shuffled,
      correctAnswer: sentences,
    });
  }

  // Q3: Fill in the blank
  if (articleWords.length > 0) {
    const fillWord = articleWords[Math.floor(Math.random() * articleWords.length)];
    const allWords = getWordsByLevel(fillWord.hskLevel);
    const fillDistractors = allWords
      .filter(w => w.word !== fillWord.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const sentence = `我看见了一个${fillWord.word}，它真好看！`;
    const blankSentence = sentence.replace(fillWord.word, '____');

    questions.push({
      id: 'q3',
      type: 'fill_blank',
      word: fillWord,
      sentence: blankSentence,
      options: [fillWord.word, ...fillDistractors.map(d => d.word)]
        .sort(() => Math.random() - 0.5),
      correctAnswer: fillWord.word,
    });
  }

  return questions;
}

// Check if an answer is correct
export function checkAnswer(question: QuizQuestion, answer: string | string[]): boolean {
  if (question.type === 'sentence_order') {
    return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
  }
  return answer === question.correctAnswer;
}
