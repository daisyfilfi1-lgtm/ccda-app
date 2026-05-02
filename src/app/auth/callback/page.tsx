"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { listenToAuthChanges, waitForAuth } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      const url = new URL(window.location.href);

      // If URL has a hash fragment with access_token (magic link redirect)
      if (url.hash && url.hash.includes("access_token")) {
        // Supabase JS client automatically reads hash on getSession()
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          setError(sessionErr.message);
          return;
        }
        if (data.session) {
          // Clean URL
          window.history.replaceState({}, "", url.origin + url.pathname);
          const cleanup = listenToAuthChanges();
          const user = await waitForAuth();
          if (user) {
            router.push("/onboarding");
          } else {
            setError("登录验证失败，请重试");
          }
          return () => cleanup();
        }
      }

      // Try PKCE code exchange
      const { error: exchangeErr } =
        await supabase.auth.exchangeCodeForSession(window.location.href);
      if (exchangeErr) {
        console.error("exchangeCodeForSession error:", exchangeErr.message);
      }

      // Check if we got a session after exchange
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const cleanup = listenToAuthChanges();
        const user = await waitForAuth();
        if (user) {
          router.push("/onboarding");
        }
        return () => cleanup();
      }

      // If still no session, try setting it manually from URL params
      const params = new URLSearchParams(url.hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });
        const { data: setData } = await supabase.auth.getSession();
        if (setData?.session) {
          const cleanup = listenToAuthChanges();
          const user = await waitForAuth();
          if (user) {
            router.push("/onboarding");
          }
          return () => cleanup();
        }
      }

      setError("登录验证失败，邮箱链接可能已过期，请重新登录");
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">验证失败</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/auth")}
            className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-2 px-6 rounded-xl"
          >
            重新登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">验证中...</h2>
        <p className="text-gray-500">正在验证您的登录链接</p>
        <div className="mt-6 flex justify-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
