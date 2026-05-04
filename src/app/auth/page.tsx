"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { listenToAuthChanges, waitForAuth } from "@/lib/auth";
import { usePageTitle } from '@/components/usePageTitle';

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  usePageTitle(mode === 'signup' ? '注册' : '登录');

  useEffect(() => {
    return listenToAuthChanges();
  }, []);

  const navigateAfterAuth = () => {
    // Wait for auth state to propagate, then redirect to onboarding flow
    waitForAuth().then(() => {
      router.push('/onboarding');
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (!password || password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();

    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("邮箱或密码错误，请重试");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }
      // Login success — wait for auth state and navigate to onboarding
      navigateAfterAuth();
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/auth/callback" },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      // Signup success — auto-confirm or wait for email
      // Try to login immediately (Supabase auto-confirms in dev mode)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInError) {
        navigateAfterAuth();
      } else {
        // Email confirmation required — show sent screen
        setMode("signup");
        setLoading(false);
        // Show a brief sent message inline
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8 text-center">
          <div className="text-6xl mb-3">📚</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CCDA 中文阅读</h1>
          <p className="text-gray-500 mb-8">每天5分钟，快乐学中文</p>

          {mode === "signup" && (
            <div className="bg-amber-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">
              📧 验证邮件已发送至 <strong>{email}</strong>，请查收并验证后登录
              <div className="mt-3">
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-amber-500 hover:text-amber-600 font-medium text-sm"
                >
                  返回登录
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none transition-all text-gray-800 bg-amber-50/30 focus:ring-4 focus:ring-amber-100"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位密码"
                className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none transition-all text-gray-800 bg-amber-50/30 focus:ring-4 focus:ring-amber-100"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "处理中..." : mode === "login" ? "登录 →" : "注册 →"}
            </button>
          </form>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="text-amber-500 hover:text-amber-600 text-sm font-medium"
            >
              {mode === "login" ? "没有账号？立即注册" : "已有账号？立即登录"}
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-gray-500 text-xs"
            >
              ← 返回首页
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">CCDA 语境识字引擎 · P0 MVP 演示版</p>
      </div>
    </div>
  );
}
