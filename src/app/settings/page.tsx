'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getClientAuth, getClientProfile, setClientProfile } from '@/lib/auth';
import { getWeakChars, getCharLexicon } from '@/lib/lexicon';
import { getWordsByLevel } from '@/lib/hsk';
import { HskLevel } from '@/lib/types';

const INTEREST_TAGS = [
  { id: 'minecraft', label: 'Minecraft', emoji: '⛏️', category: '游戏' },
  { id: 'roblox', label: 'Roblox', emoji: '🎮', category: '游戏' },
  { id: 'mario', label: '马里奥', emoji: '🍄', category: '游戏' },
  { id: 'pokemon', label: '宝可梦', emoji: '⚡', category: '游戏' },
  { id: 'basketball', label: '篮球', emoji: '🏀', category: '运动' },
  { id: 'soccer', label: '足球', emoji: '⚽', category: '运动' },
  { id: 'skateboard', label: '滑板', emoji: '🛹', category: '运动' },
  { id: 'swimming', label: '游泳', emoji: '🏊', category: '运动' },
  { id: 'dinosaur', label: '恐龙', emoji: '🦕', category: '自然' },
  { id: 'space', label: '太空', emoji: '🚀', category: '自然' },
  { id: 'ocean', label: '海洋', emoji: '🌊', category: '自然' },
  { id: 'animals', label: '动物', emoji: '🐾', category: '自然' },
  { id: 'food', label: '美食', emoji: '🍜', category: '生活' },
  { id: 'pets', label: '宠物', emoji: '🐱', category: '生活' },
  { id: 'travel', label: '旅行', emoji: '✈️', category: '生活' },
  { id: 'music', label: '音乐', emoji: '🎵', category: '生活' },
  { id: 'springfestival', label: '春节', emoji: '🧧', category: '文化' },
  { id: 'journeytowest', label: '西游记', emoji: '🐵', category: '文化' },
  { id: 'kungfu', label: '功夫', emoji: '🥋', category: '文化' },
  { id: 'anime', label: '动漫', emoji: '🎨', category: '文化' },
];

const ALL_HSK_LEVELS: { value: HskLevel; label: string; band: string }[] = [];
for (let i = 1; i <= 9; i++) {
  ALL_HSK_LEVELS.push({
    value: i as HskLevel,
    label: `HSK ${i} 级`,
    band: i <= 3 ? '初级' : i <= 6 ? '中级' : '高级',
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfileState] = useState(getClientProfile());
  const [authorized, setAuthorized] = useState(false);

  // Editable fields
  const [name, setName] = useState(profile?.name || '');
  const [hskLevel, setHskLevel] = useState<HskLevel>(profile?.hskLevel || 1);
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [showPinyin, setShowPinyin] = useState(true);

  // Saved feedback
  const [saved, setSaved] = useState(false);

  // Weak chars (read-only display)
  const weakChars = getWeakChars();
  const charLexicon = getCharLexicon();
  const allChars = Array.from(charLexicon.entries())
    .sort((a, b) => a[1].mastery - b[1].mastery)
    .slice(0, 50);

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  const toggleInterest = (id: string) => {
    setInterests(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!profile) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        name,
        hsk_level: hskLevel,
        interests,
      }).eq('id', user.id);
    }

    const updated = { ...profile, name, hskLevel, interests };
    setClientProfile(updated);
    setProfileState(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-lg mx-auto space-y-4 pb-8">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 text-center">
          <div className="text-4xl mb-2">⚙️</div>
          <h1 className="text-2xl font-bold text-gray-800">偏好设置</h1>
        </div>

        {/* Name */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">👤 名字</h2>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="你的名字"
            className="w-full px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-gray-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* HSK Level */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">📈 当前级别</h2>
          <div className="grid grid-cols-3 gap-2">
            {ALL_HSK_LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setHskLevel(l.value)}
                className={`
                  p-3 rounded-2xl text-center transition-all
                  ${hskLevel === l.value
                    ? 'bg-amber-400 text-white shadow-md scale-105 border-2 border-amber-500'
                    : 'bg-amber-50 text-gray-600 hover:bg-amber-100 border-2 border-transparent'
                  }
                `}
              >
                <div className="text-sm font-bold">{l.label}</div>
                <div className="text-[10px] opacity-60">{l.band}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🎯 兴趣爱好</h2>
          <p className="text-xs text-gray-400 mb-3">选择 3 个，AI 会围绕兴趣写故事</p>
          <div className="space-y-3">
            {['游戏', '运动', '自然', '生活', '文化'].map(category => (
              <div key={category}>
                <h3 className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {category === '游戏' && '🎮'} {category === '运动' && '⚽'} {category === '自然' && '🌿'} {category === '生活' && '🏠'} {category === '文化' && '🏮'} {category}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_TAGS.filter(t => t.category === category).map(tag => {
                    const selected = interests.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleInterest(tag.id)}
                        className={`
                          px-3 py-1.5 rounded-xl text-xs font-medium transition-all border
                          ${selected
                            ? 'bg-amber-400 text-white border-amber-500 shadow-sm'
                            : 'bg-amber-50 text-gray-600 border-transparent hover:bg-amber-100'
                          }
                          ${interests.length >= 3 && !selected ? 'opacity-40' : ''}
                        `}
                      >
                        {tag.emoji} {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Char Management */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🔤 弱字管理</h2>
          {weakChars.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">本周需要重点复习的字（来自测验错误）：</p>
              <div className="flex flex-wrap gap-1.5">
                {weakChars.slice(0, 15).map(ch => (
                  <span key={ch} className="bg-red-50 text-red-600 text-sm px-2.5 py-1 rounded-full border border-red-200 font-medium">
                    {ch}
                  </span>
                ))}
                {weakChars.length > 15 && (
                  <span className="text-xs text-gray-400 self-center">+{weakChars.length - 15}</span>
                )}
              </div>
            </div>
          )}
          {weakChars.length === 0 && (
            <p className="text-sm text-gray-400">还没有弱字记录，完成读后测验后会自动出现。</p>
          )}

          {/* All chars sorted by mastery */}
          {allChars.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">所有已学汉字（按掌握度排序）：</p>
              <div className="flex flex-wrap gap-1">
                {allChars.map(([ch, entry]) => (
                  <span
                    key={ch}
                    className={`
                      text-xs px-1.5 py-0.5 rounded font-medium
                      ${entry.mastery >= 80 ? 'text-green-600 bg-green-50' : ''}
                      ${entry.mastery >= 30 && entry.mastery < 80 ? 'text-amber-600 bg-amber-50' : ''}
                      ${entry.mastery < 30 ? 'text-red-600 bg-red-50' : ''}
                    `}
                    title={`${ch}: 掌握度 ${entry.mastery}% · 复习 ${entry.reviewCount} 次`}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Display Preferences */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🎨 显示偏好</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">阅读时显示拼音</div>
              <div className="text-xs text-gray-400">在故事中显示汉字拼音</div>
            </div>
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`
                w-14 h-7 rounded-full transition-colors relative
                ${showPinyin ? 'bg-amber-400' : 'bg-gray-300'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all
                  ${showPinyin ? 'left-7' : 'left-0.5'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Save / Back */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/profile')}
            className="flex-1 bg-white border-2 border-amber-200 text-amber-700 font-bold py-3 rounded-2xl hover:bg-amber-50 transition-all"
          >
            ← 返回
          </button>
          <button
            onClick={handleSave}
            className={`
              flex-1 font-bold py-3 rounded-2xl transition-all
              ${saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
              }
            `}
          >
            {saved ? '✅ 已保存' : '💾 保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
