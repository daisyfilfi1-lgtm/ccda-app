'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientProfile, updateClientProfile } from '@/lib/auth';
import { getTodayTask } from '@/lib/srs';
import { generateQuiz, checkAnswer } from '@/lib/qc';
import { updateMasteryAfterQuiz } from '@/lib/lexicon';
import { QuizQuestion } from '@/lib/types/index';

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [orderedSentences, setOrderedSentences] = useState<string[]>([]);
  const profileRef = useRef(getClientProfile());

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      router.replace('/login');
      return;
    }

    const profile = getClientProfile();
    if (!profile) {
      router.replace('/assessment');
      return;
    }
    profileRef.current = profile;

    // Get today's task and generate quiz
    const task = getTodayTask(profile) as any;
    const words = task?.article?.weakChars?.map((c: string) => ({ word: c, hskLevel: profile.hskLevel })) || [];
    const quiz = generateQuiz(words, task?.article);
    setQuestions(quiz);
    if (quiz[1]?.options) {
      setOrderedSentences([...quiz[1].options]);
    }
    setInitialized(true);
  }, [router]);

  const handleAnswer = (answer: string | string[]) => {
    if (!questions[currentQ]) return;
    const q = questions[currentQ];
    const correct = checkAnswer(q, answer);
    
    setAnswers(prev => ({
      ...prev,
      [q.id]: answer,
    }));

    if (correct) {
      setScore(prev => prev + 5);
    } else {
      setScore(prev => prev + 1); // Participation prize
    }

    // Update lexicon mastery
    if (q.word) {
      updateMasteryAfterQuiz(q.word.word, correct);
    }

    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);
      if (currentQ + 1 < questions.length) {
        setCurrentQ(prev => prev + 1);
      } else {
        // Quiz complete
        setShowResult(true);
        
        // Update profile
        const profile = profileRef.current;
        if (profile) {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          let newStreak = profile.streakDays;
          if (profile.lastReadDate === yesterday) {
            newStreak += 1;
          } else if (profile.lastReadDate !== today) {
            newStreak = 1;
          }

          updateClientProfile({
            totalRead: (profile.totalRead || 0) + 1,
            streakDays: newStreak,
            lastReadDate: today,
            points: (profile.points || 0) + (score + (correct ? 5 : 1)),
          });
        }
      }
    }, 1500);
  };

  const handleSelectOption = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    
    const q = questions[currentQ];
    if (!q) return;

    if (q.type === 'word_meaning' || q.type === 'fill_blank') {
      handleAnswer(q.options![index]);
    }
  };

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    if (showFeedback) return;
    const newOrder = [...orderedSentences];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrderedSentences(newOrder);
  };

  const handleSubmitOrder = () => {
    handleAnswer(orderedSentences);
  };

  if (!initialized || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🤔</div>
          <div className="text-xl font-bold text-amber-600">准备题目中...</div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const profile = getClientProfile();
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg shadow-amber-100 p-8 text-center animate-fade-in">
          <div className="text-7xl mb-4 animate-bounce-in">🏆</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">测验完成！</h2>
          
          <div className="bg-amber-50 rounded-2xl p-6 my-6">
            <div className="text-5xl font-bold text-amber-500 mb-1">
              +{score}
            </div>
            <p className="text-gray-500">积分</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between bg-green-50 rounded-xl p-3">
              <span>📚 已读天数</span>
              <span className="font-bold text-green-600">{profile?.totalRead || 1} 天</span>
            </div>
            <div className="flex justify-between bg-amber-50 rounded-xl p-3">
              <span>🔥 连续阅读</span>
              <span className="font-bold text-amber-600">{profile?.streakDays || 1} 天</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/achievement')}
            className="mt-6 w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-4 px-6 rounded-2xl text-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-md"
          >
            查看成就 ✨
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex items-center justify-center">
      <div className="max-w-lg w-full animate-fade-in">
        {/* Progress */}
        <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
          <span>📝 小测验</span>
          <span>第 {currentQ + 1}/{questions.length} 题</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentQ) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8">
          {/* Question type indicator */}
          <div className="text-center mb-4">
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
              {q.type === 'word_meaning' ? '✏️ 字义选择' :
               q.type === 'sentence_order' ? '🔤 句子排序' : '📝 语境填空'}
            </span>
          </div>

          {q.type === 'word_meaning' && q.word && (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-800 mb-3">{q.word.word}</div>
                <p className="text-gray-500">选择正确的意思</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {q.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(i)}
                    disabled={showFeedback}
                    className={`
                      p-4 rounded-2xl text-base font-medium transition-all
                      ${showFeedback
                        ? opt === q.correctAnswer
                          ? 'bg-green-100 border-2 border-green-400 text-green-700'
                          : selectedOption === i
                            ? 'bg-red-100 border-2 border-red-400 text-red-700'
                            : 'bg-gray-50 border-2 border-gray-200 text-gray-400'
                        : selectedOption === i
                          ? 'bg-amber-400 text-white border-2 border-amber-500 scale-[0.98]'
                          : 'bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-400'
                      }
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          {q.type === 'sentence_order' && (
            <>
              <div className="text-center mb-4">
                <p className="text-gray-500">将这些句子排成正确的顺序</p>
              </div>
              <div className="space-y-2">
                {orderedSentences.map((sentence, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border-2 border-amber-200"
                  >
                    <span className="text-sm font-bold text-amber-500 w-6">{i + 1}</span>
                    <span className="flex-1 text-gray-700 text-sm">{sentence}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleReorder(i, 'up')}
                        disabled={i === 0 || showFeedback}
                        className="text-xs text-amber-400 hover:text-amber-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleReorder(i, 'down')}
                        disabled={i === orderedSentences.length - 1 || showFeedback}
                        className="text-xs text-amber-400 hover:text-amber-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={showFeedback}
                className="mt-4 w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50"
              >
                确认排序
              </button>
            </>
          )}

          {q.type === 'fill_blank' && (
            <>
              <div className="text-center mb-4">
                <p className="text-gray-500">选择正确的字词填空</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-6 mb-4 text-lg leading-relaxed text-center">
                {q.sentence?.split(/(____)/).map((part, i) => (
                  part === '____'
                    ? <span key={i} className="inline-block w-16 border-b-2 border-amber-400 mx-1">&nbsp;</span>
                    : <span key={i}>{part}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {q.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(i)}
                    disabled={showFeedback}
                    className={`
                      p-4 rounded-2xl text-lg font-bold transition-all
                      ${showFeedback
                        ? opt === q.correctAnswer
                          ? 'bg-green-100 border-2 border-green-400 text-green-700'
                          : selectedOption === i
                            ? 'bg-red-100 border-2 border-red-400 text-red-700'
                            : 'bg-gray-50 border-2 border-gray-200 text-gray-400'
                        : selectedOption === i
                          ? 'bg-amber-400 text-white border-2 border-amber-500 scale-[0.98]'
                          : 'bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-400'
                      }
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Feedback */}
          {showFeedback && (
            <div className={`mt-4 text-center font-bold text-lg animate-fade-in ${
              answers[q.id] === q.correctAnswer || JSON.stringify(answers[q.id]) === JSON.stringify(q.correctAnswer)
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {(answers[q.id] === q.correctAnswer || JSON.stringify(answers[q.id]) === JSON.stringify(q.correctAnswer))
                ? '✅ 答对了！+5分'
                : `❌ 继续努力！+1分`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
