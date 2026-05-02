'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listenToAuthChanges, waitForAuth, getClientProfile } from '@/lib/auth';

const features = [
  {
    emoji: '🎯',
    title: 'AI 自适应分级',
    desc: '入学测评定级，AI 每天生成匹配孩子水平的文章，不多不少刚好合适。',
    color: 'from-amber-400 to-orange-400',
  },
  {
    emoji: '🎮',
    title: '兴趣驱动阅读',
    desc: '喜欢 Minecraft、恐龙还是篮球？AI 围绕兴趣写故事，不用逼，孩子自己会想读。',
    color: 'from-rose-400 to-pink-400',
  },
  {
    emoji: '🧠',
    title: '间隔重复记忆',
    desc: '学过的字 AI 自动安排复习，该出现时就出现，真正记得住。',
    color: 'from-violet-400 to-purple-400',
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
        <div className="text-7xl mb-6 animate-bounce-in">📚</div>
        <h1 className="text-5xl font-extrabold text-gray-800 mb-3 tracking-tight">
          CCDA 中文阅读
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
          每天5分钟，快乐学中文
        </p>
        <button
          onClick={() => router.push('/auth')}
          className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-[0.98] transition-all animate-pulse-glow"
        >
          免费开始 →
        </button>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-4 pb-20 space-y-5">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="bg-white rounded-3xl shadow-lg shadow-amber-100/60 p-6 flex items-start gap-5 animate-slide-up hover:shadow-xl hover:-translate-y-0.5 transition-all"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div
              className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl shadow-md`}
            >
              {f.emoji}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-sm text-gray-400">
        <p>CCDA 语境识字引擎 · P0 MVP</p>
      </footer>
    </div>
  );
}
