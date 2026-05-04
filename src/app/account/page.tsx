'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, clearClientAuth } from '@/lib/auth';
import { initLexicon } from '@/lib/lexicon';
import { getClientProfile, setClientProfile } from '@/lib/auth';
import AppLayout from '@/components/AppLayout';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

export default function AccountPage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('账户信息');
  const [auth, setAuth] = useState(getClientAuth());
  const [copied, setCopied] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!authorized) return;
    setAuth(getClientAuth());
  }, [authorized]);

  if (!authorized) return null;

  const handleCopyId = () => {
    if (auth?.id) {
      navigator.clipboard.writeText(auth.id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    clearClientAuth();
    initLexicon([]);
    router.push('/login');
  };

  return (
    <AppLayout showTabBar={true}>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">🔑 账户信息</h1>

        {/* Profile card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 text-center">
          <div className="text-6xl mb-3">👤</div>
          <h2 className="text-xl font-bold text-gray-800">{auth?.name || '用户'}</h2>
          <p className="text-sm text-gray-500 mt-1">{auth?.email || ''}</p>
        </div>

        {/* Account details */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 space-y-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">用户 ID</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-gray-50 rounded-lg px-3 py-2 text-gray-700 truncate font-mono">
                {auth?.id || '—'}
              </code>
              <button
                onClick={handleCopyId}
                className="text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
              >
                {copied ? '✅ 已复制' : '📋 复制'}
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">邮箱</div>
            <div className="text-sm text-gray-700">{auth?.email || '—'}</div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">用户名</div>
            <div className="text-sm text-gray-700">{auth?.name || '—'}</div>
          </div>
        </div>

        {/* Navigation */}
        <button
          onClick={() => router.push('/profile')}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-amber-100 hover:bg-amber-50 transition-colors text-left"
        >
          <span className="text-2xl">👤</span>
          <div>
            <div className="font-bold text-gray-800">返回个人主页</div>
            <div className="text-xs text-gray-500">学习统计、掌握进度</div>
          </div>
          <span className="ml-auto text-gray-400">→</span>
        </button>

        {/* Logout */}
        <div className="pt-4">
          {confirmLogout ? (
            <div className="bg-red-50 rounded-3xl p-6 text-center space-y-4">
              <p className="text-red-700 font-bold">确定要退出登录吗？</p>
              <p className="text-sm text-red-500">本地学习数据会被清除</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all"
                >
                  确认退出
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full bg-white border-2 border-red-200 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition-all"
            >
              退出登录
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
