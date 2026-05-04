'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientProfile, updateClientProfile } from '@/lib/auth';
import { getWeakChars, getCharLexicon, getCharCloud } from '@/lib/lexicon';
import { getWordsByLevel, getCharsByLevel } from '@/lib/hsk';
import { HskLevel } from '@/lib/types';
import AppLayout from '@/components/AppLayout';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

const ALL_INTERESTS = [
  '动物', '恐龙', '汽车', '火车', '飞机', '公主', '魔法',
  '足球', '篮球', '游泳', '舞蹈', '画画', '唱歌',
  'Minecraft', 'Roblox', '宝可梦', '超级玛丽',
  '太空', '恐龙', '海底', '昆虫', '植物', '美食',
  '超级英雄', '侦探', '冒险', '童话', '校园',
];

export default function SettingsPage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('偏好设置');
  const [profile, setProfile] = useState(getClientProfile());
  const [selectedLevel, setSelectedLevel] = useState(profile?.hskLevel || 1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  const [saved, setSaved] = useState(false);
  const [weakChars, setWeakChars] = useState<{ char: string; mastery: number }[]>([]);

  useEffect(() => {
    if (!authorized) return;
    const p = getClientProfile();
    setProfile(p);
    if (p) {
      setSelectedLevel(p.hskLevel);
      setSelectedInterests(p.interests);
    }

    // Gather weak chars
    const weak = getWeakChars();
    const cloud = getCharCloud();
    const chars = cloud.filter(c => c.mastery < 80 || weak.includes(c.char))
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 20);
    setWeakChars(chars);
  }, [authorized]);

  if (!authorized) return null;

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 5 ? [...prev, interest] : prev
    );
  };

  const handleSave = () => {
    updateClientProfile({
      hskLevel: selectedLevel as HskLevel,
      interests: selectedInterests,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout showTabBar={true}>
      <div className="p-4 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ 偏好设置</h1>

        {/* HSK Level */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">📚 中文水平</h2>
          <p className="text-sm text-gray-500 mb-4">选择适合孩子的 HSK 级别</p>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9].map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level as HskLevel)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
                  selectedLevel === level
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-amber-50'
                }`}
              >
                {level} 级
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🎯 兴趣主题</h2>
          <p className="text-sm text-gray-500 mb-4">选择 1-5 个孩子感兴趣的主题</p>
          <div className="flex flex-wrap gap-2">
            {ALL_INTERESTS.filter((v, i, a) => a.indexOf(v) === i).map(interest => {
              const selected = selectedInterests.includes(interest);
              const maxed = !selected && selectedInterests.length >= 5;
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  disabled={maxed}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selected
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm'
                      : maxed
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weak characters */}
        {weakChars.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">🔤 需要加强的汉字</h2>
            <p className="text-xs text-gray-500 mb-3">这些字掌握度较低，会出现在未来文章中</p>
            <div className="space-y-2">
              {weakChars.map(c => (
                <div key={c.char} className="flex items-center gap-3">
                  <span className="text-lg font-bold w-8 text-center text-gray-800">{c.char}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                      style={{ width: `${c.mastery}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{c.mastery}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
          }`}
        >
          {saved ? '✅ 已保存！' : '💾 保存设置'}
        </button>
      </div>
    </AppLayout>
  );
}
