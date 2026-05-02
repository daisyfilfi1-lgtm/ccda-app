'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { listenToAuthChanges } from '@/lib/auth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize auth listener on mount
    return listenToAuthChanges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({ email });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg shadow-amber-100 p-8 text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce-in">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">魔法链接已发送！</h2>
          <p className="text-gray-500 mb-6">
            请检查您的邮箱 <strong>{email}</strong>，点击链接登录。
          </p>
          <button
            onClick={() => router.push('/assessment')}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-md"
          >
            我已经点击了链接 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">📚</div>
            <h1 className="text-3xl font-bold text-gray-800">
              CCDA 中文阅读
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              每天5分钟，快乐学中文
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                我们会发送魔法链接到您的邮箱
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
              {loading ? '发送中...' : '发送魔法链接 →'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            CCDA 语境识字引擎 · P0 MVP 演示版
          </p>
        </div>
      </div>
    </div>
  );
}
