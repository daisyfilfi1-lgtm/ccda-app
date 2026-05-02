'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { listenToAuthChanges, waitForAuth } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Exchange auth code for session (handles URL hash fragments from magic link)
      const { data, error: callbackError } = await supabase.auth.getSession();

      if (callbackError) {
        console.error('[AuthCallback] Error getting session:', callbackError.message);
        setError(callbackError.message);
        return;
      }

      if (!data.session) {
        // Try exchanging code in URL (for PKCE flow)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) {
          console.error('[AuthCallback] Exchange error:', exchangeError.message);
          setError(exchangeError.message);
          return;
        }
      }

      // Initialize auth listener so cachedUser is populated
      const cleanup = listenToAuthChanges();

      // Wait for auth to be ready
      const user = await waitForAuth();
      
      if (user) {
        console.log('[AuthCallback] User authenticated:', user.email);
        router.push('/onboarding');
      } else {
        console.warn('[AuthCallback] No user found after auth flow');
        setError('登录验证失败，请重试');
      }

      return () => cleanup();
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">验证失败</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-2 px-6 rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all"
          >
            重新登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4 animate-bounce-in">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">验证中...</h2>
        <p className="text-gray-500">正在验证您的登录链接</p>
        <div className="mt-6 flex justify-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
