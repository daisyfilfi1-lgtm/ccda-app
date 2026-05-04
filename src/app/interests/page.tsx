'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getClientAuth, getClientProfile, setClientProfile, createDefaultProfile } from '@/lib/auth';
import AppLayout from '@/components/AppLayout';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

interface InterestTag {
  id: string;
  label: string;
  emoji: string;
  category: string;
}

const INTEREST_TAGS: InterestTag[] = [
  // 游戏
  { id: 'minecraft', label: 'Minecraft', emoji: '⛏️', category: '游戏' },
  { id: 'roblox', label: 'Roblox', emoji: '🎮', category: '游戏' },
  { id: 'mario', label: '马里奥', emoji: '🍄', category: '游戏' },
  { id: 'pokemon', label: '宝可梦', emoji: '⚡', category: '游戏' },
  // 运动
  { id: 'basketball', label: '篮球', emoji: '🏀', category: '运动' },
  { id: 'soccer', label: '足球', emoji: '⚽', category: '运动' },
  { id: 'skateboard', label: '滑板', emoji: '🛹', category: '运动' },
  { id: 'swimming', label: '游泳', emoji: '🏊', category: '运动' },
  // 自然
  { id: 'dinosaur', label: '恐龙', emoji: '🦕', category: '自然' },
  { id: 'space', label: '太空', emoji: '🚀', category: '自然' },
  { id: 'ocean', label: '海洋', emoji: '🌊', category: '自然' },
  { id: 'animals', label: '动物', emoji: '🐾', category: '自然' },
  // 生活
  { id: 'food', label: '美食', emoji: '🍜', category: '生活' },
  { id: 'pets', label: '宠物', emoji: '🐱', category: '生活' },
  { id: 'travel', label: '旅行', emoji: '✈️', category: '生活' },
  { id: 'music', label: '音乐', emoji: '🎵', category: '生活' },
  // 文化
  { id: 'springfestival', label: '春节', emoji: '🧧', category: '文化' },
  { id: 'journeytowest', label: '西游记', emoji: '🐵', category: '文化' },
  { id: 'kungfu', label: '功夫', emoji: '🥋', category: '文化' },
  { id: 'anime', label: '动漫', emoji: '🎨', category: '文化' },
];

export default function InterestsPage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('选择兴趣');
  const [selected, setSelected] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (authorized) {
      setInitialized(true);
    }
  }, [authorized]);

  if (!initialized) return null;

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(s => s !== id));
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, id]);
    }
  };

  const handleConfirm = async () => {
    if (selected.length !== 3) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    await supabase.from('profiles').update({
      interests: selected,
      onboarding_completed: true,
    }).eq('id', user.id);

    const auth = getClientAuth();
    const existing = getClientProfile();
    const profile = existing || createDefaultProfile(auth!);

    setClientProfile({ ...profile, interests: selected });
    router.push('/daily');
  };

  return (
    <AppLayout showTabBar={false}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full animate-fade-in">
          <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎯</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                你对什么感兴趣？
              </h1>
              <p className="text-gray-500 text-sm">
                选择3个你最感兴趣的话题，我会为你写相关的故事！
              </p>
              <div className="text-amber-500 font-bold mt-2">
                已选 {selected.length}/3
              </div>
            </div>

            {/* Category: 游戏 */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">🎮 游戏</h3>
              <div className="grid grid-cols-4 gap-2">
                {INTEREST_TAGS.filter(t => t.category === '游戏').map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleInterest(tag.id)}
                    className={`
                      p-3 rounded-2xl text-center transition-all duration-200
                      ${selected.includes(tag.id)
                        ? 'bg-amber-400 text-white shadow-md scale-105 border-2 border-amber-500'
                        : 'bg-amber-50 text-gray-700 hover:bg-amber-100 border-2 border-transparent'
                      }
                      ${selected.length >= 3 && !selected.includes(tag.id) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="text-2xl mb-1">{tag.emoji}</div>
                    <div className="text-[10px] font-medium leading-tight">{tag.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category: 运动 */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">⚽ 运动</h3>
              <div className="grid grid-cols-4 gap-2">
                {INTEREST_TAGS.filter(t => t.category === '运动').map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleInterest(tag.id)}
                    className={`
                      p-3 rounded-2xl text-center transition-all duration-200
                      ${selected.includes(tag.id)
                        ? 'bg-emerald-400 text-white shadow-md scale-105 border-2 border-emerald-500'
                        : 'bg-emerald-50 text-gray-700 hover:bg-emerald-100 border-2 border-transparent'
                      }
                      ${selected.length >= 3 && !selected.includes(tag.id) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="text-2xl mb-1">{tag.emoji}</div>
                    <div className="text-[10px] font-medium leading-tight">{tag.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category: 自然 */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">🌿 自然</h3>
              <div className="grid grid-cols-4 gap-2">
                {INTEREST_TAGS.filter(t => t.category === '自然').map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleInterest(tag.id)}
                    className={`
                      p-3 rounded-2xl text-center transition-all duration-200
                      ${selected.includes(tag.id)
                        ? 'bg-sky-400 text-white shadow-md scale-105 border-2 border-sky-500'
                        : 'bg-sky-50 text-gray-700 hover:bg-sky-100 border-2 border-transparent'
                      }
                      ${selected.length >= 3 && !selected.includes(tag.id) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="text-2xl mb-1">{tag.emoji}</div>
                    <div className="text-[10px] font-medium leading-tight">{tag.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category: 生活 */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">🏠 生活</h3>
              <div className="grid grid-cols-4 gap-2">
                {INTEREST_TAGS.filter(t => t.category === '生活').map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleInterest(tag.id)}
                    className={`
                      p-3 rounded-2xl text-center transition-all duration-200
                      ${selected.includes(tag.id)
                        ? 'bg-pink-400 text-white shadow-md scale-105 border-2 border-pink-500'
                        : 'bg-pink-50 text-gray-700 hover:bg-pink-100 border-2 border-transparent'
                      }
                      ${selected.length >= 3 && !selected.includes(tag.id) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="text-2xl mb-1">{tag.emoji}</div>
                    <div className="text-[10px] font-medium leading-tight">{tag.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category: 文化 */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">🏮 文化</h3>
              <div className="grid grid-cols-4 gap-2">
                {INTEREST_TAGS.filter(t => t.category === '文化').map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleInterest(tag.id)}
                    className={`
                      p-3 rounded-2xl text-center transition-all duration-200
                      ${selected.includes(tag.id)
                        ? 'bg-violet-400 text-white shadow-md scale-105 border-2 border-violet-500'
                        : 'bg-violet-50 text-gray-700 hover:bg-violet-100 border-2 border-transparent'
                      }
                      ${selected.length >= 3 && !selected.includes(tag.id) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="text-2xl mb-1">{tag.emoji}</div>
                    <div className="text-[10px] font-medium leading-tight">{tag.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={selected.length !== 3}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg transition-all
                ${selected.length === 3
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {selected.length === 3 ? '开始读故事吧！📖' : `再选 ${3 - selected.length} 个`}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
