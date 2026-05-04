'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getClientAuth, getClientProfile, setClientProfile, createDefaultProfile } from '@/lib/auth';
import { HskLevel, AssessmentResult } from '@/lib/types/index';
import AppLayout from '@/components/AppLayout';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

// Emoji-based assessment questions with adaptive difficulty
const EMOJI_QUESTIONS: Record<number, any[]> = {
  1: [
    { id: 1, emoji: '🐱', word: '猫', options: ['狗', '猫', '鸟', '鱼'], correctIndex: 1, hskLevel: 1 },
    { id: 2, emoji: '🐶', word: '狗', options: ['猫', '鱼', '狗', '鸟'], correctIndex: 2, hskLevel: 1 },
    { id: 3, emoji: '🐟', word: '鱼', options: ['鸟', '鱼', '马', '牛'], correctIndex: 1, hskLevel: 1 },
    { id: 4, emoji: '🐦', word: '鸟', options: ['虫', '鸟', '鱼', '狗'], correctIndex: 1, hskLevel: 1 },
    { id: 5, emoji: '🌺', word: '花', options: ['花', '草', '树', '石'], correctIndex: 0, hskLevel: 1 },
    { id: 6, emoji: '📖', word: '书', options: ['笔', '书', '纸', '画'], correctIndex: 1, hskLevel: 1 },
    { id: 7, emoji: '☀️', word: '日', options: ['月', '日', '星', '云'], correctIndex: 1, hskLevel: 1 },
    { id: 8, emoji: '🌙', word: '月', options: ['日', '星', '月', '云'], correctIndex: 2, hskLevel: 1 },
    { id: 9, emoji: '💧', word: '水', options: ['火', '土', '水', '风'], correctIndex: 2, hskLevel: 1 },
    { id: 10, emoji: '🔥', word: '火', options: ['水', '火', '风', '土'], correctIndex: 1, hskLevel: 1 },
  ],
  2: [
    { id: 11, emoji: '🍎', word: '苹果', options: ['香蕉', '苹果', '西瓜', '橘子'], correctIndex: 1, hskLevel: 2 },
    { id: 12, emoji: '🏫', word: '学校', options: ['医院', '学校', '公园', '超市'], correctIndex: 1, hskLevel: 2 },
    { id: 13, emoji: '🎵', word: '音乐', options: ['画画', '跳舞', '唱歌', '音乐'], correctIndex: 3, hskLevel: 2 },
    { id: 14, emoji: '🏃', word: '跑步', options: ['游泳', '跑步', '骑车', '跳舞'], correctIndex: 1, hskLevel: 2 },
    { id: 15, emoji: '❄️', word: '冬天', options: ['春天', '夏天', '秋天', '冬天'], correctIndex: 3, hskLevel: 2 },
    { id: 16, emoji: '🌈', word: '颜色', options: ['红色', '蓝色', '颜色', '绿色'], correctIndex: 2, hskLevel: 2 },
    { id: 17, emoji: '😊', word: '高兴', options: ['难过', '高兴', '生气', '害怕'], correctIndex: 1, hskLevel: 2 },
    { id: 18, emoji: '🍰', word: '好吃', options: ['好看', '好听', '好吃', '好玩'], correctIndex: 2, hskLevel: 2 },
    { id: 19, emoji: '⭐', word: '星星', options: ['太阳', '月亮', '星星', '云'], correctIndex: 2, hskLevel: 2 },
    { id: 20, emoji: '🏊', word: '游泳', options: ['跑步', '游泳', '打球', '滑雪'], correctIndex: 1, hskLevel: 2 },
  ],
  3: [
    { id: 21, emoji: '🦕', word: '恐龙', options: ['大象', '恐龙', '狮子', '老虎'], correctIndex: 1, hskLevel: 3 },
    { id: 22, emoji: '🚀', word: '太空', options: ['海洋', '太空', '城市', '森林'], correctIndex: 1, hskLevel: 3 },
    { id: 23, emoji: '🌊', word: '海洋', options: ['河流', '海洋', '湖泊', '山'], correctIndex: 1, hskLevel: 3 },
    { id: 24, emoji: '🎮', word: '游戏', options: ['唱歌', '跳舞', '游戏', '画画'], correctIndex: 2, hskLevel: 3 },
    { id: 25, emoji: '🎂', word: '蛋糕', options: ['面包', '蛋糕', '面条', '米饭'], correctIndex: 1, hskLevel: 3 },
    { id: 26, emoji: '🚗', word: '汽车', options: ['火车', '汽车', '飞机', '自行车'], correctIndex: 1, hskLevel: 3 },
    { id: 27, emoji: '🏥', word: '医院', options: ['超市', '医院', '公园', '学校'], correctIndex: 1, hskLevel: 3 },
    { id: 28, emoji: '🧪', word: '科学', options: ['数学', '科学', '音乐', '画画'], correctIndex: 1, hskLevel: 3 },
    { id: 29, emoji: '🌍', word: '世界', options: ['国家', '城市', '世界', '地球'], correctIndex: 2, hskLevel: 3 },
    { id: 30, emoji: '📚', word: '图书馆', options: ['博物馆', '图书馆', '动物园', '花园'], correctIndex: 1, hskLevel: 3 },
  ],
  // HSK 4 — 简单句子理解
  4: [
    { id: 31, emoji: '🗣️', word: '说话', options: ['听歌', '说话', '看书', '跑步'], correctIndex: 1, hskLevel: 4 },
    { id: 32, emoji: '👨‍👩‍👧‍👦', word: '家庭', options: ['朋友', '家庭', '学校', '公司'], correctIndex: 1, hskLevel: 4 },
    { id: 33, emoji: '🎓', word: '毕业', options: ['开学', '考试', '毕业', '上课'], correctIndex: 2, hskLevel: 4 },
    { id: 34, emoji: '✈️', word: '旅行', options: ['上班', '旅行', '回家', '运动'], correctIndex: 1, hskLevel: 4 },
    { id: 35, emoji: '📝', word: '作业', options: ['游戏', '电视', '作业', '画画'], correctIndex: 2, hskLevel: 4 },
  ],
  // HSK 5 — 抽象概念
  5: [
    { id: 36, emoji: '💡', word: '主意', options: ['问题', '主意', '工作', '天气'], correctIndex: 1, hskLevel: 5 },
    { id: 37, emoji: '🤝', word: '合作', options: ['吵架', '合作', '比赛', '休息'], correctIndex: 1, hskLevel: 5 },
    { id: 38, emoji: '🎯', word: '目标', options: ['过去', '目标', '方法', '结果'], correctIndex: 1, hskLevel: 5 },
    { id: 39, emoji: '🌱', word: '成长', options: ['变化', '成长', '开始', '结束'], correctIndex: 1, hskLevel: 5 },
    { id: 40, emoji: '🧠', word: '记忆', options: ['忘记', '记忆', '思考', '明白'], correctIndex: 1, hskLevel: 5 },
  ],
  // HSK 6 — 复杂概念
  6: [
    { id: 41, emoji: '📈', word: '发展', options: ['停止', '发展', '后退', '等待'], correctIndex: 1, hskLevel: 6 },
    { id: 42, emoji: '⚖️', word: '平衡', options: ['倾斜', '平衡', '混乱', '分裂'], correctIndex: 1, hskLevel: 6 },
    { id: 43, emoji: '🔬', word: '研究', options: ['玩耍', '休息', '研究', '购物'], correctIndex: 2, hskLevel: 6 },
    { id: 44, emoji: '🎨', word: '艺术', options: ['技术', '艺术', '体育', '科学'], correctIndex: 1, hskLevel: 6 },
    { id: 45, emoji: '🌐', word: '网络', options: ['围墙', '网络', '桥梁', '道路'], correctIndex: 1, hskLevel: 6 },
  ],
  // HSK 7 — 社会议题
  7: [
    { id: 46, emoji: '🤖', word: '人工智能', options: ['传统工艺', '人工智能', '手工制作', '自然种植'], correctIndex: 1, hskLevel: 7 },
    { id: 47, emoji: '🌍', word: '全球化', options: ['本地化', '全球化', '私有化', '简单化'], correctIndex: 1, hskLevel: 7 },
    { id: 48, emoji: '♻️', word: '可持续发展', options: ['快速发展', '可持续发展', '过度发展', '停止发展'], correctIndex: 1, hskLevel: 7 },
    { id: 49, emoji: '🏛️', word: '文明', options: ['野蛮', '落后', '文明', '原始'], correctIndex: 2, hskLevel: 7 },
    { id: 50, emoji: '🧬', word: '基因', options: ['细胞', '基因', '器官', '组织'], correctIndex: 1, hskLevel: 7 },
  ],
  // HSK 8 — 学术概念
  8: [
    { id: 51, emoji: '📊', word: '数据分析', options: ['随意猜测', '数据分析', '主观判断', '感性认识'], correctIndex: 1, hskLevel: 8 },
    { id: 52, emoji: '🧿', word: '抽象思维', options: ['具体操作', '抽象思维', '机械重复', '感官体验'], correctIndex: 1, hskLevel: 8 },
    { id: 53, emoji: '⚛️', word: '量子物理', options: ['经典力学', '量子物理', '化学反应', '生物进化'], correctIndex: 1, hskLevel: 8 },
    { id: 54, emoji: '🌌', word: '宇宙学', options: ['地理学', '宇宙学', '气象学', '地质学'], correctIndex: 1, hskLevel: 8 },
    { id: 55, emoji: '🧮', word: '数学模型', options: ['数学公式', '数学模型', '数学题', '数学课'], correctIndex: 1, hskLevel: 8 },
  ],
  // HSK 9 — 专业领域
  9: [
    { id: 56, emoji: '🧑‍💻', word: '编程', options: ['打字', '编程', '上网', '玩游戏'], correctIndex: 1, hskLevel: 9 },
    { id: 57, emoji: '📡', word: '卫星通信', options: ['有线电话', '卫星通信', '广播电台', '电视信号'], correctIndex: 1, hskLevel: 9 },
    { id: 58, emoji: '🧪', word: '纳米技术', options: ['大型机械', '纳米技术', '传统工艺', '简单工具'], correctIndex: 1, hskLevel: 9 },
    { id: 59, emoji: '🔄', word: '循环经济', options: ['线性模式', '循环经济', '粗放发展', '单向消费'], correctIndex: 1, hskLevel: 9 },
    { id: 60, emoji: '🧠', word: '神经科学', options: ['心理学', '神经科学', '社会学', '人类学'], correctIndex: 1, hskLevel: 9 },
  ],
};

export default function AssessmentPage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('定级测评');
  const [currentLevel, setCurrentLevel] = useState<HskLevel>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState<{ id: number; correct: boolean }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Get questions for current level, filter out already answered
  const getAvailableQuestions = useCallback((level: HskLevel) => {
    // Levels beyond 9 fall back to 9
    const effectiveLevel = Math.min(level, 9) as keyof typeof EMOJI_QUESTIONS;
    const questions = EMOJI_QUESTIONS[effectiveLevel] || [];
    const answeredIds = new Set(answered.map(a => a.id));
    return questions.filter(q => !answeredIds.has(q.id));
  }, [answered]);

  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (authorized) {
      const qs = getAvailableQuestions(currentLevel);
      setQuestions(qs);
      setInitialized(true);
    }
  }, [authorized, currentLevel, getAvailableQuestions]);

  const currentQuestion = questions[questionIndex];

  const handleAnswer = (index: number) => {
    if (!currentQuestion || selectedAnswer !== null) return;

    const correct = index === currentQuestion.correctIndex;
    setSelectedAnswer(index);
    setIsCorrect(correct);
    setTotalQuestions(prev => prev + 1);

    const newAnswered = [...answered, { id: currentQuestion.id, correct }];
    setAnswered(newAnswered);

    if (correct) {
      setCorrectCount(prev => prev + 1);
      setCorrectStreak(prev => prev + 1);
      setWrongStreak(0);
    } else {
      setCorrectStreak(0);
      setWrongStreak(prev => prev + 1);
    }

    // Auto-advance after delay
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);

      // Check level-up/level-down
      const nextCorrectStreak = correct ? correctStreak + 1 : 0;
      const nextWrongStreak = correct ? 0 : wrongStreak + 1;

      if (nextCorrectStreak >= 3 && currentLevel < 9) {
        // Level up!
        setCurrentLevel((prev) => (Math.min(9, prev + 1)) as HskLevel);
        setCorrectStreak(0);
        setWrongStreak(0);
      } else if (nextWrongStreak >= 2 && currentLevel > 1) {
        // Level down
        setCurrentLevel((prev) => (Math.max(1, prev - 1)) as HskLevel);
        setCorrectStreak(0);
        setWrongStreak(0);
      } else {
        // Next question
        if (questionIndex + 1 < questions.length) {
          setQuestionIndex(prev => prev + 1);
        } else {
          // Ran out of questions
          const moreQs = getAvailableQuestions(currentLevel);
          if (moreQs.length > 0) {
            setQuestions(moreQs);
            setQuestionIndex(0);
          } else {
            finishAssessment();
          }
        }
      }
    }, 1200);
  };

  const finishAssessment = () => {
    setShowResult(true);
  };

  const handleFinish = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    // Estimate HSK level based on performance
    const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
    let estimatedLevel: HskLevel = currentLevel;
    if (accuracy >= 0.8 && currentLevel < 9) estimatedLevel = Math.min(9, currentLevel + 1) as HskLevel;
    else if (accuracy < 0.4 && currentLevel > 1) estimatedLevel = Math.max(1, currentLevel - 1) as HskLevel;

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: user.id,
      child_name: '小明',
      hsk_level: 1,
      onboarding_completed: false,
    });

    // Insert mastered characters
    const masteredChars = ['一', '二', '三', '大', '小', '人', '山', '水', '日', '月'];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    for (const ch of masteredChars) {
      await supabase.from('user_lexicon_chars').insert({
        user_id: user.id,
        character: ch,
        mastery: 0.85,
        next_review: threeDaysLater.toISOString(),
      });
    }

    // Insert weak word
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await supabase.from('user_lexicon_words').insert({
      user_id: user.id,
      word: '薄弱字',
      mastery: 0.35,
      next_review: tomorrow.toISOString(),
    });

    // Update local profile
    const auth = getClientAuth();
    const existing = getClientProfile();
    const profile = existing || createDefaultProfile(auth!);
    setClientProfile({ ...profile, hskLevel: estimatedLevel });

    router.push('/interests');
  };

  // Auto-finish if we've answered enough
  useEffect(() => {
    if (totalQuestions >= 10 && !showResult) {
      finishAssessment();
    }
  }, [totalQuestions]);

  if (!initialized || !authorized) return null;

  if (showResult) {
    return (
      <AppLayout showTabBar={false}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg shadow-amber-100 p-8 text-center animate-fade-in">
            <div className="text-7xl mb-4">🎊</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">测评完成！</h2>

            <div className="bg-amber-50 rounded-2xl p-6 my-6">
              <div className="text-5xl font-bold text-amber-500 mb-2">
                HSK {currentLevel}
              </div>
              <p className="text-gray-600">
                答对 {correctCount}/{totalQuestions} 题
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                <span>✅ 已掌握基础</span>
                <span className="font-bold text-green-600">{correctCount * 10}%</span>
              </div>
              <div className="flex items-center justify-between bg-amber-50 rounded-xl p-3">
                <span>📈 推荐起始级别</span>
                <span className="font-bold text-amber-600">HSK {currentLevel}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="mt-6 w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-4 px-6 rounded-2xl text-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-md"
            >
              选择你的兴趣 → 🎯
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentQuestion) {
    return <LoadingScreen text="准备题目中..." />;
  }

  return (
    <AppLayout showTabBar={false}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full animate-fade-in">
          {/* Progress */}
          <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
            <span>HSK {currentLevel}</span>
            <span>第 {totalQuestions + 1}/10 题</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalQuestions / 10) * 100)}%` }}
            />
          </div>

          {/* Question card */}
          <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8">
            <div className="text-center mb-6">
              <div className="text-8xl mb-4 animate-bounce-in">{currentQuestion.emoji}</div>
              <p className="text-gray-500 text-sm">看图选词：哪个是图片对应的汉字？</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`
                    p-4 rounded-2xl text-xl font-bold transition-all duration-300
                    ${selectedAnswer === null
                      ? 'bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-400 active:scale-[0.97]'
                      : selectedAnswer === index
                        ? isCorrect
                          ? 'bg-green-100 border-2 border-green-400 text-green-700'
                          : 'bg-red-100 border-2 border-red-400 text-red-700'
                        : index === currentQuestion.correctIndex && selectedAnswer !== null
                          ? 'bg-green-100 border-2 border-green-400 text-green-700'
                          : 'bg-gray-50 border-2 border-gray-200 text-gray-400'
                    }
                    disabled:opacity-80 disabled:cursor-default
                  `}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {selectedAnswer !== null && (
              <div className={`mt-4 text-center font-bold text-lg animate-fade-in ${
                isCorrect ? 'text-green-500' : 'text-red-500'
              }`}>
                {isCorrect ? '✅ 答对了！' : `❌ 答案是：${currentQuestion.options[currentQuestion.correctIndex]}`}
              </div>
            )}
          </div>

          {/* Status indicators */}
          <div className="flex justify-center gap-4 mt-4">
            {correctStreak >= 1 && (
              <div className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full">
                🔥 连对 {correctStreak}
              </div>
            )}
            {wrongStreak >= 1 && (
              <div className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full">
                ⚠️ 连错 {wrongStreak}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
