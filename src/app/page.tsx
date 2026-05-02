'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listenToAuthChanges, waitForAuth } from '@/lib/auth';

const features = [
  {
    emoji: '🎯',
    title: 'AI 自适应分级',
    desc: '入学测评定级，AI 每天生成匹配孩子水平的文章，不多不少刚刚好',
  },
  {
    emoji: '🎮',
    title: '兴趣驱动阅读',
    desc: '孩子喜欢Minecraft、恐龙还是篮球？AI 围绕兴趣写故事，不用逼自己会读',
  },
  {
    emoji: '🧠',
    title: '间隔重复记忆',
    desc: '学过的字 AI 自动安排复习，该出现时就出现，7天后还记得住',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const cleanup = listenToAuthChanges();
      const auth = await waitForAuth();
      if (auth) {
        router.replace('/daily');
        return;
      }
      setChecking(false);
      return () => cleanup();
    };
    init();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fef9f0]">
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-4">📖</div>
          <div className="text-xl font-bold text-amber-600">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef9f0]">
      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center animate-fade-in">
        <div className="text-7xl mb-6">📚</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3">
          CCDA 中文阅读
        </h1>
        <p className="text-lg text-gray-500 mb-8">每天5分钟，快乐学中文</p>
        <button
          onClick={() => router.push('/auth')}
          className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.97] transition-all"
        >
          免费开始 →
        </button>
      </section>

      {/* Features */}
      <section className="px-4 pb-20 max-w-3xl mx-auto space-y-5">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-6 shadow-md shadow-amber-100/60 flex items-start gap-5 animate-fade-in"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="text-4xl shrink-0 mt-1">{f.emoji}</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-sm text-gray-400">
        CCDA 语境识字引擎 · P0 MVP
      </footer>
    </div>
  );
}
