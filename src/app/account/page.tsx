'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getClientAuth, clearClientAuth, getClientProfile } from '@/lib/auth';

export default function AccountPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(getClientAuth());
  const [profile, setProfile] = useState(getClientProfile());
  const [authorized, setAuthorized] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile edit
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');

  useEffect(() => {
    const a = getClientAuth();
    if (!a) {
      router.replace('/login');
      return;
    }
    setAuth(a);
    setProfile(getClientProfile());
    setAuthorized(true);
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearClientAuth();
    router.replace('/');
  };

  const handleSaveName = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ name: nameInput }).eq('id', user.id);
    }
    if (profile) {
      const updated = { ...profile, name: nameInput };
      const { setClientProfile } = await import('@/lib/auth');
      setClientProfile(updated);
      setProfile(updated);
    }
    setEditingName(false);
  };

  const handleCopyId = () => {
    if (auth?.id) {
      navigator.clipboard.writeText(auth.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!authorized) return null;

  const createdDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-lg mx-auto space-y-4 pb-8">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 text-center">
          <div className="text-5xl mb-3">👤</div>
          <h1 className="text-2xl font-bold text-gray-800">账户信息</h1>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 text-center">
          <div className="text-7xl mb-3">
            {profile?.name ? '😊' : '👋'}
          </div>
          <div className="flex items-center justify-center gap-3">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-gray-800 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="bg-amber-400 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-500 transition-all"
                >
                  保存
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameInput(profile?.name || ''); }}
                  className="text-gray-400 px-2 py-2 text-sm hover:text-gray-600"
                >
                  取消
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800">{profile?.name || '用户'}</h2>
                <button
                  onClick={() => { setEditingName(true); setNameInput(profile?.name || ''); }}
                  className="text-amber-500 text-sm hover:text-amber-600"
                >
                  ✏️ 编辑
                </button>
              </>
            )}
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 mb-1">📋 账户详情</h2>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">邮箱</span>
            <span className="text-sm font-medium text-gray-800">{auth?.email || '—'}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">用户 ID</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">
                {auth?.id ? auth.id.substring(0, 16) + '...' : '—'}
              </span>
              {auth?.id && (
                <button
                  onClick={handleCopyId}
                  className="text-xs text-amber-500 hover:text-amber-600"
                >
                  {copied ? '✅' : '📋'}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">HSK 级别</span>
            <span className="text-sm font-bold text-amber-600">HSK {profile?.hskLevel || 1}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">注册时间</span>
            <span className="text-sm text-gray-600">{createdDate}</span>
          </div>
        </div>

        {/* Delete Account (placeholder / future) */}
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🗑️ 危险区域</h2>
          <p className="text-xs text-gray-400 mb-3">
            删除账户后所有数据将被永久清除，无法恢复。
          </p>
          <button
            disabled
            className="w-full py-3 rounded-2xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed"
            title="此功能尚未开放"
          >
            删除账户（暂不可用）
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/profile')}
            className="flex-1 bg-white border-2 border-amber-200 text-amber-700 font-bold py-3 rounded-2xl hover:bg-amber-50 transition-all"
          >
            ← 返回
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 bg-red-500 text-white font-bold py-3 rounded-2xl hover:bg-red-600 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {loggingOut ? '退出中...' : '🚪 退出登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
