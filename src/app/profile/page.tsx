'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientProfile } from '@/lib/auth';
import { getMasteryStats, getCharMasteryStats, getWeakChars } from '@/lib/lexicon';

const HSK_BANDS = [
  { level: '1-3', label: '初级', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { level: '4-6', label: '中级', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { level: '7-9', label: '高级', color: 'bg-violet-100 text-violet-700 border-violet-300' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(getClientProfile());
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      router.replace('/login');
      return;
    }
    setProfile(getClientProfile());
    setAuthorized(true);
  }, [router]);

  if (!authorized) return null;

  const wordStats = getMasteryStats();
  const charStats = getCharMasteryStats();
  const wordTotal = wordStats.mastered + wordStats.learning + wordStats.new;
  const charTotal = charStats.mastered + charStats.learning + charStats.new;
  const weakChars = getWeakChars();
  const hskLevel = profile?.hskLevel || 1;
  const totalRead = profile?.totalRead || 0;
  const streakDays = profile?.streakDays || 0;
  const points = profile?.points || 0;
  const interests = profile?.interests || [];

  const levelBand = hskLevel <= 3 ? '1-3' : hskLevel <= 6 ? '4-6' : '7-9';
  const bandLabel = HSK_BANDS.find(b => b.level === levelBand);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-lg mx-auto space-y-4 pb-8">

        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 text-center">
          {/* Avatar */}
          <div className="text-6xl mb-3">
            {profile?.name ? '👤' : '😊'}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {profile?.name || '用户'}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${bandLabel?.color || 'bg-gray-100 text-gray-500'}`}>
              HSK {hskLevel} · {bandLabel?.label || ''}
            </span>
          </div>
          {interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {interests.map(tag => (
                <span key={tag} className="bg-amber-50 text-amber-600 text-xs px-2.5 py-1 rounded-full border border-amber-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm shadow-amber-100">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-xl font-bold text-amber-600">{totalRead}</div>
            <div className="text-xs text-gray-500">已读天数</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm shadow-amber-100">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-bold text-orange-600">{streakDays}</div>
            <div className="text-xs text-gray-500">连续天数</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm shadow-amber-100">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xl font-bold text-amber-600">{points}</div>
            <div className="text-xs text-gray-500">总积分</div>
          </div>
        </div>

        {/* Word/Char Mastery */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📖 学习进度</h2>

          {/* Words */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">字词掌握</h3>
            <div className="flex gap-2 h-3 rounded-full overflow-hidden bg-gray-100">
              <div className="bg-green-400 transition-all" style={{ width: `${wordTotal > 0 ? (wordStats.mastered / wordTotal) * 100 : 0}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${wordTotal > 0 ? (wordStats.learning / wordTotal) * 100 : 0}%` }} />
              <div className="bg-gray-200 transition-all flex-1" />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>已掌握 {wordStats.mastered}</span>
              <span>学习中 {wordStats.learning}</span>
              <span>未接触 {wordStats.new}</span>
            </div>
          </div>

          {/* Characters */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">汉字掌握</h3>
            <div className="flex gap-2 h-3 rounded-full overflow-hidden bg-gray-100">
              <div className="bg-green-400 transition-all" style={{ width: `${charTotal > 0 ? (charStats.mastered / charTotal) * 100 : 0}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${charTotal > 0 ? (charStats.learning / charTotal) * 100 : 0}%` }} />
              <div className="bg-gray-200 transition-all flex-1" />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>已掌握 {charStats.mastered}</span>
              <span>学习中 {charStats.learning}</span>
              <span>未接触 {charStats.new}</span>
            </div>
          </div>

          {/* Weak chars reminder */}
          {weakChars.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-2xl border border-red-200">
              <div className="text-sm font-bold text-red-600 mb-1">
                ⚠️ 需要复习的字 ({weakChars.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {weakChars.slice(0, 10).map(ch => (
                  <span key={ch} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                    {ch}
                  </span>
                ))}
                {weakChars.length > 10 && (
                  <span className="text-xs text-red-400 self-center">+{weakChars.length - 10} 个</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/achievement')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm shadow-amber-100 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="text-2xl mb-1">🏅</div>
            <div className="text-sm font-bold text-gray-700">成就徽章</div>
          </button>
          <button
            onClick={() => router.push('/parent-report')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm shadow-amber-100 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm font-bold text-gray-700">学习报告</div>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm shadow-amber-100 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="text-2xl mb-1">⚙️</div>
            <div className="text-sm font-bold text-gray-700">偏好设置</div>
          </button>
          <button
            onClick={() => router.push('/account')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm shadow-amber-100 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="text-2xl mb-1">👤</div>
            <div className="text-sm font-bold text-gray-700">账户信息</div>
          </button>
        </div>

        {/* Back to reading */}
        <button
          onClick={() => router.push('/daily')}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 rounded-2xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-md active:scale-[0.98]"
        >
          📖 继续阅读
        </button>
      </div>
    </div>
  );
}
