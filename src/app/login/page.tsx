'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setClientAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'email' | 'name'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    setError('');
    setStep('name');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入孩子的名字');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate "magic link" login - store auth locally
    const authUser = {
      email,
      name: name.trim(),
      id: `user_${Date.now()}`,
    };
    
    setClientAuth(authUser);
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">📚</div>
            <h1 className="text-3xl font-bold text-gray-800">
              CCDA 中文阅读
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              每天5分钟，快乐学中文
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  家长邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none transition-colors text-gray-800 bg-amber-50/30"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  我们会发送魔法链接到您的邮箱（MVP演示版直接登录）
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                发送魔法链接 →
              </button>
            </form>
          ) : (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  孩子的名字
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="如：小明"
                  className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none transition-colors text-gray-800 bg-amber-50/30"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  这是孩子在App里的名字
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? '登录中...' : '开始阅读之旅 ✨'}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 text-center mt-6">
            CCDA 语境识字引擎 · P0 MVP 演示版
          </p>
        </div>
      </div>
    </div>
  );
}
