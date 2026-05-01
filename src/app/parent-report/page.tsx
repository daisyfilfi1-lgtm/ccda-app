'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientProfile } from '@/lib/auth';
import { getWordCloud, getMasteryStats } from '@/lib/lexicon';
import { getWordsByLevel } from '@/lib/hsk';

export default function ParentReportPage() {
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

  const stats = getMasteryStats();
  const wordCloud = getWordCloud();
  const hskLevel = profile?.hskLevel || 1;
  const totalRead = profile?.totalRead || 0;
  const streakDays = profile?.streakDays || 0;
  const points = profile?.points || 0;
  
  // Calculate HSK progress
  const hskWords = getWordsByLevel(hskLevel as 1 | 2 | 3);
  const totalHskWords = hskWords.length;
  const masteredWords = wordCloud.filter(w => w.mastery >= 80).length;
  const hskProgress = totalHskWords > 0 ? Math.round((masteredWords / totalHskWords) * 100) : 0;

  // Weekly mock data (in production, this comes from the database)
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const readingMinutes = [5, 8, 3, 10, 7, 12, totalRead > 0 ? 5 : 0];
  const completionRate = [90, 100, 70, 100, 85, 100, totalRead > 0 ? 90 : 0];
  const newWords = [3, 5, 2, 7, 4, 6, 2];

  const maxMinutes = Math.max(...readingMinutes, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-lg mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <h1 className="text-2xl font-bold text-gray-800">{profile?.name} 的学习报告</h1>
            <p className="text-sm text-gray-500 mt-1">
              HSK {hskLevel} 级别 · 已读 {totalRead} 天
            </p>
          </div>
        </div>

        {/* HSK Progress Bar */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📈 HSK 进度</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">HSK {hskLevel}</span>
            <span className="text-sm font-bold text-amber-600">{hskProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-1000"
              style={{ width: `${hskProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>已掌握 {masteredWords} 个字词</span>
            <span>共 {totalHskWords} 个字词</span>
          </div>

          {/* Mini level indicators */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(level => (
              <div
                key={level}
                className={`
                  flex-1 text-center p-2 rounded-xl text-sm font-bold
                  ${level <= hskLevel
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                HSK {level}
                {level === hskLevel && ' ✓'}
              </div>
            ))}
          </div>
        </div>

        {/* Character Cloud */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔤 字词云</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {wordCloud.length === 0 && (
              <p className="text-gray-400 text-sm">还没有学习记录，开始阅读吧！</p>
            )}
            {wordCloud.slice(0, 30).map((item, i) => (
              <span
                key={i}
                className={`
                  px-2 py-1 rounded-lg text-sm font-medium transition-all
                  ${item.mastery >= 80
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : item.mastery > 0
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }
                `}
                style={{
                  fontSize: `${Math.max(12, 12 + item.mastery / 10)}px`,
                }}
              >
                {item.word}
              </span>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-center text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
              已掌握
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" />
              学习中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200" />
              未接触
            </span>
          </div>
        </div>

        {/* Weekly Trend - Bar charts */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 本周趋势</h2>

          {/* Reading Duration */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">每日阅读时长（分钟）</h3>
            <div className="flex items-end gap-1 h-24">
              {readingMinutes.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">{val}</span>
                  <div
                    className="w-full bg-gradient-to-t from-amber-400 to-orange-300 rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(8, (val / maxMinutes) * 80)}px`,
                    }}
                  />
                  <span className="text-[10px] text-gray-500">{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completion Rate */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">完成率（%）</h3>
            <div className="flex items-end gap-1 h-20">
              {completionRate.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">{val}%</span>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-400 to-green-300 rounded-t-md transition-all"
                    style={{ height: `${Math.max(4, val * 0.8)}px` }}
                  />
                  <span className="text-[10px] text-gray-500">{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* New Words per Day */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">新增字词数</h3>
            <div className="flex items-end gap-1 h-20">
              {newWords.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">{val}</span>
                  <div
                    className="w-full bg-gradient-to-t from-violet-400 to-purple-300 rounded-t-md transition-all"
                    style={{ height: `${Math.max(4, val * 12)}px` }}
                  />
                  <span className="text-[10px] text-gray-500">{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-amber-600">{stats.mastered}</div>
            <div className="text-xs text-gray-500">已掌握</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{stats.learning}</div>
            <div className="text-xs text-gray-500">学习中</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-500">{stats.new}</div>
            <div className="text-xs text-gray-500">未接触</div>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => router.push('/achievement')}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 rounded-2xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-md"
        >
          ← 返回
        </button>
      </div>
    </div>
  );
}
