'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientProfile, clearClientAuth } from '@/lib/auth';
import { getMasteryStats, getCharMasteryStats, getWeakChars, getCharCloud } from '@/lib/lexicon';
import AppLayout from '@/components/AppLayout';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

export default function ProfilePage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('个人主页');
  const [profile, setProfile] = useState(getClientProfile());
  const [wordStats, setWordStats] = useState({ mastered: 0, learning: 0, new: 0 });
  const [charStats, setCharStats] = useState({ mastered: 0, learning: 0, new: 0 });
  const [weakCharCount, setWeakCharCount] = useState(0);
  const [charProgress, setCharProgress] = useState(0);

  useEffect(() => {
    if (!authorized) return;
    setProfile(getClientProfile());
    setWordStats(getMasteryStats());
    setCharStats(getCharMasteryStats());
    setWeakCharCount(getWeakChars().length);

    // Compute overall char progress
    const cloud = getCharCloud();
    if (cloud.length > 0) {
      const avg = cloud.reduce((s, c) => s + c.mastery, 0) / cloud.length;
      setCharProgress(Math.round(avg));
    }
  }, [authorized]);

  if (!authorized) return null;

  const p = profile || { name: '用户', streakDays: 0, totalRead: 0, points: 0, hskLevel: 1 };

  return (
    <AppLayout showTabBar={true}>
      <div className="p-4 space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 text-center">
          <div className="text-6xl mb-3">👤</div>
          <h1 className="text-2xl font-bold text-gray-800">{p.name}</h1>
          <p className="text-sm text-amber-500 mt-1">HSK {p.hskLevel} 级</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-amber-50 rounded-2xl p-3">
              <div className="text-2xl font-bold text-amber-600">{p.totalRead}</div>
              <div className="text-xs text-gray-500">阅读天数</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3">
              <div className="text-2xl font-bold text-orange-600">{p.streakDays}</div>
              <div className="text-xs text-gray-500">连续天数</div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-3">
              <div className="text-2xl font-bold text-amber-600">{p.points}</div>
              <div className="text-xs text-gray-500">积分</div>
            </div>
          </div>
        </div>

        {/* Word mastery */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">📝 词汇掌握</h2>
          <div className="flex gap-1 h-6 rounded-full overflow-hidden bg-gray-100">
            <div className="bg-green-400 transition-all" style={{ width: `${wordStats.mastered / Math.max(1, wordStats.mastered + wordStats.learning + wordStats.new) * 100}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${wordStats.learning / Math.max(1, wordStats.mastered + wordStats.learning + wordStats.new) * 100}%` }} />
            <div className="bg-gray-300 transition-all" style={{ width: `${wordStats.new / Math.max(1, wordStats.mastered + wordStats.learning + wordStats.new) * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-green-600">✓ {wordStats.mastered} 已掌握</span>
            <span className="text-amber-600">📖 {wordStats.learning} 学习中</span>
            <span className="text-gray-500">🆕 {wordStats.new} 新词</span>
          </div>
        </div>

        {/* Character mastery */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🔤 汉字掌握</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="#f59e0b" strokeWidth="6"
                  strokeDasharray={`${charProgress * 1.88} 188`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-amber-600">
                {charProgress}%
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
                <span className="text-sm text-gray-600">{charStats.mastered} 字已掌握</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                <span className="text-sm text-gray-600">{charStats.learning} 字学习中</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-300 shrink-0" />
                <span className="text-sm text-gray-600">{charStats.new} 字未学</span>
              </div>
              {weakCharCount > 0 && (
                <div className="text-sm text-red-500 font-medium">
                  ⚠️ {weakCharCount} 个弱字需要复习
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/settings')}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-amber-100 hover:bg-amber-50 transition-colors text-left"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <div className="font-bold text-gray-800">偏好设置</div>
              <div className="text-xs text-gray-500">HSK 级别、兴趣、弱字管理</div>
            </div>
            <span className="ml-auto text-gray-400">→</span>
          </button>

          <button
            onClick={() => router.push('/account')}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-amber-100 hover:bg-amber-50 transition-colors text-left"
          >
            <span className="text-2xl">🔑</span>
            <div>
              <div className="font-bold text-gray-800">账户信息</div>
              <div className="text-xs text-gray-500">邮箱、头像、退出登录</div>
            </div>
            <span className="ml-auto text-gray-400">→</span>
          </button>

          <button
            onClick={() => router.push('/daily')}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg hover:from-amber-500 hover:to-orange-500 transition-all text-left"
          >
            <span className="text-2xl">📖</span>
            <div>
              <div className="font-bold">今日阅读</div>
              <div className="text-xs text-white/80">继续学习</div>
            </div>
            <span className="ml-auto">→</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
