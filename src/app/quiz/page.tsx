'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientProfile, updateClientProfile } from '@/lib/auth';
import { getTodayTask } from '@/lib/srs';
import { generateQuiz, checkAnswer } from '@/lib/qc';
import { updateMasteryAfterQuiz } from '@/lib/lexicon';
import { QuizQuestion, ChineseWord } from '@/lib/types';
import { getAllWords } from '@/lib/hsk';
import { speakText, stopSpeaking } from '@/lib/tts';
import AppLayout from '@/components/AppLayout';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

export default function QuizPage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('小测验');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const profileRef = useRef(getClientProfile());

  useEffect(() => {
    if (!authorized) return;
    const init = async () => {
      const profile = getClientProfile();
      if (!profile) {
        router.replace('/assessment');
        return;
      }
      profileRef.current = profile;

      const task = await getTodayTask(profile) as any;
      if (!task?.article) {
        router.replace('/daily');
        return;
      }

      // Resolve weak chars to actual ChineseWord objects
      const allWords = getAllWords();
      const weakWordObjects: ChineseWord[] = (task.article.weakChars || [])
        .flatMap((char: string) => allWords.filter(w => w.word.includes(char)))
        .filter((w: ChineseWord, i: number, arr: ChineseWord[]) => arr.findIndex(x => x.word === w.word) === i);

      const quiz = generateQuiz(weakWordObjects, task.article, profile.hskLevel);
      setQuestions(quiz);
      setInitialized(true);
    };
    init();
  }, [authorized, router]);

  const handleAnswer = (answer: string) => {
    if (!questions[currentQ]) return;
    const q = questions[currentQ];
    const correct = checkAnswer(q, answer);

    if (correct) {
      setScore(prev => prev + 5);
    } else {
      setScore(prev => prev + 1);
    }

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
        setShowResult(true);
      }
    }, 1500);
  };

  const handlePlayAudio = () => {
    if (!questions[currentQ]?.audioText) return;
    setIsPlaying(true);
    stopSpeaking();
    speakText(questions[currentQ].audioText!, {
      rate: 0.75,
      onEnd: () => setIsPlaying(false),
    });
  };

  const handleSelectOption = (index: number) => {
    if (showFeedback || isPlaying) return;
    setSelectedOption(index);
    const q = questions[currentQ];
    if (!q) return;
    handleAnswer(q.options[index]);
  };

  const [showResult, setShowResult] = useState(false);

  if (!initialized || questions.length === 0) {
    return <LoadingScreen text="准备题目中..." />;
  }

  if (showResult) {
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
        points: (profile.points || 0) + score,
      });
    }

    const p = getClientProfile();
    return (
      <AppLayout showTabBar={true}>
        <div className="flex items-center justify-center min-h-screen p-4">
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
                <span className="font-bold text-green-600">{p?.totalRead || 1} 天</span>
              </div>
              <div className="flex justify-between bg-amber-50 rounded-xl p-3">
                <span>🔥 连续阅读</span>
                <span className="font-bold text-amber-600">{p?.streakDays || 1} 天</span>
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
      </AppLayout>
    );
  }

  const q = questions[currentQ];

  return (
    <AppLayout showTabBar={false}>
      <div className="flex items-center justify-center min-h-screen p-4">
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
                {q.type === 'weak_word' ? '✏️ 字词练习' :
                 q.type === 'listening' ? '🔊 听力理解' : '📝 语境填空'}
              </span>
            </div>

            {/* Q1: Weak Word Test */}
            {q.type === 'weak_word' && (
              <>
                <div className="text-center mb-6">
                  {q.prompt?.includes('____') ? (
                    // Fill-in-the-blank mode (HSK 4+)
                    <div className="bg-amber-50 rounded-2xl p-6 mb-4 text-lg leading-relaxed text-center">
                      {q.sentence?.split(/(____)/).map((part, i) => (
                        part === '____'
                          ? <span key={i} className="inline-block w-16 border-b-2 border-amber-400 mx-1">&nbsp;</span>
                          : <span key={i}>{part}</span>
                      ))}
                    </div>
                  ) : q.prompt?.startsWith('选择') ? (
                    // Synonym mode (HSK 7-9)
                    <>
                      <div className="text-3xl font-bold text-gray-800 mb-3">
                        {q.word?.word}
                      </div>
                      <p className="text-gray-500 text-sm">{q.prompt}</p>
                    </>
                  ) : (
                    // Char/word meaning test (HSK 1-3)
                    <>
                      <div className="text-5xl font-bold text-gray-800 mb-3">
                        {q.prompt}
                      </div>
                      <p className="text-gray-500">
                        {q.word && q.word.word.length === 1 ? '选择正确的拼音' : '选择正确的意思'}
                      </p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt, i) => (
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

            {/* Q2: Listening Comprehension */}
            {q.type === 'listening' && (
              <>
                <div className="text-center mb-6">
                  <p className="text-gray-500 mb-4">
                    {q.isTrueFalse
                      ? '播放后判断你是否听到了这个词'
                      : '播放后回答问题'}
                  </p>
                  <button
                    onClick={handlePlayAudio}
                    disabled={isPlaying}
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center mx-auto
                      transition-all shadow-md
                      ${isPlaying
                        ? 'bg-gray-300 text-gray-500 animate-pulse'
                        : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500'
                      }
                    `}
                  >
                    {isPlaying ? '🔊' : '▶️'}
                  </button>
                  {isPlaying && (
                    <p className="text-xs text-amber-500 mt-2 animate-pulse">播放中...</p>
                  )}
                </div>

                {q.questionText && (
                  <div className="text-center mb-4">
                    <p className="text-base font-medium text-gray-700">
                      {q.questionText}
                    </p>
                  </div>
                )}

                <div className={q.isTrueFalse ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-3'}>
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(i)}
                      disabled={showFeedback || isPlaying}
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
                            : isPlaying
                              ? 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
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

            {/* Q3: Context Cloze */}
            {q.type === 'context_cloze' && (
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
                  {q.options.map((opt, i) => (
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
                selectedOption !== null && q.options[selectedOption] === q.correctAnswer
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {(selectedOption !== null && q.options[selectedOption] === q.correctAnswer)
                  ? '✅ 答对了！+5分'
                  : `❌ 正确答案：${q.correctAnswer} +1分`}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
