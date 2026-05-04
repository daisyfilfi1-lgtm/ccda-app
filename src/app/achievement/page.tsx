'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientProfile } from '@/lib/auth';
import AppLayout from '@/components/AppLayout';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

interface Badge {
  id: string;
  name: string;
  icon: string;
  requirement: string;
  unlocked: boolean;
  daysRequired: number;
}

const ALL_BADGES: Badge[] = [
  { id: 'fire', name: '初露锋芒', icon: '🔥', requirement: '连续阅读3天', unlocked: false, daysRequired: 3 },
  { id: 'book', name: '书香门第', icon: '📚', requirement: '连续阅读7天', unlocked: false, daysRequired: 7 },
  { id: 'rocket', name: '火箭加速', icon: '🚀', requirement: '连续阅读14天', unlocked: false, daysRequired: 14 },
  { id: 'trophy', name: '阅读大师', icon: '🏆', requirement: '连续阅读30天', unlocked: false, daysRequired: 30 },
];

export default function AchievementPage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('成就');
  const [profile, setProfile] = useState(getClientProfile());
  const [showAnimation, setShowAnimation] = useState(true);
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; emoji: string }[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!authorized) return;
    setProfile(getClientProfile());

    // Generate confetti
    const emojis = ['🎉', '⭐', '🌟', '✨', '🎊', '🏆', '📚', '🔥'];
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setConfetti(items);

    // Auto-dismiss after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setShowAnimation(false);
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [authorized]);

  if (!authorized) return null;

  const streakDays = profile?.streakDays || 0;
  const points = profile?.points || 0;
  const totalRead = profile?.totalRead || 0;

  const badges = ALL_BADGES.map(b => ({
    ...b,
    unlocked: streakDays >= b.daysRequired,
  }));

  const unlockedBadges = badges.filter(b => b.unlocked);

  return (
    <AppLayout showTabBar={true}>
      <div className="relative overflow-hidden p-4">
        {/* Confetti animation overlay */}
        {showAnimation && (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 animate-fade-in" />
            {confetti.map(item => (
              <div
                key={item.id}
                className="absolute text-2xl"
                style={{
                  left: `${item.left}%`,
                  top: '-10%',
                  animation: `confetti-fall 3s ease-out ${item.delay}s forwards`,
                }}
              >
                {item.emoji}
              </div>
            ))}
            <div className="text-center animate-bounce-in z-10">
              <div className="text-8xl mb-4">
                {unlockedBadges.length > 0 ? unlockedBadges[0].icon : '🎉'}
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                {unlockedBadges.length > 0 ? `获得成就：${unlockedBadges[0].name}` : '阅读完成！'}
              </h2>
              <p className="text-lg text-amber-600 font-bold">
                +{points} 积分
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className={`transition-all duration-500 ${showAnimation ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">
                {profile?.name ? '👋' : '🎉'}
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {profile?.name ? `${profile.name} 的成就` : '阅读成就'}
              </h1>
            </div>

            {/* Stats overview */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">📚</div>
                <div className="text-2xl font-bold text-amber-600">{totalRead}</div>
                <div className="text-xs text-gray-500">阅读天数</div>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-2xl font-bold text-orange-600">{streakDays}</div>
                <div className="text-xs text-gray-500">连续天数</div>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-2xl font-bold text-amber-600">{points}</div>
                <div className="text-xs text-gray-500">总积分</div>
              </div>
            </div>

            {/* Badges */}
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🏅 徽章
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`
                    rounded-2xl p-4 text-center transition-all
                    ${badge.unlocked
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300 shadow-sm'
                      : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                    }
                  `}
                >
                  <div className={`text-3xl mb-1 ${badge.unlocked ? '' : 'grayscale'}`}>
                    {badge.icon}
                  </div>
                  <div className={`text-sm font-bold ${badge.unlocked ? 'text-amber-700' : 'text-gray-500'}`}>
                    {badge.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {badge.unlocked ? '✅ 已获得' : `还需 ${badge.daysRequired - streakDays} 天`}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/daily')}
                className="flex-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 rounded-xl text-sm hover:from-amber-500 hover:to-orange-500 transition-all shadow-md"
              >
                📖 继续阅读
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="bg-white border-2 border-amber-200 text-amber-700 font-bold py-3 rounded-xl text-sm hover:bg-amber-50 transition-all px-4"
                title="个人主页"
              >
                👤
              </button>
              <button
                onClick={() => router.push('/parent-report')}
                className="flex-1 bg-white border-2 border-amber-200 text-amber-700 font-bold py-3 rounded-xl text-sm hover:bg-amber-50 transition-all"
              >
                📊 学习报告
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
