'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // In MVP, this handles the simulated OAuth callback
    // In production, this would validate the Supabase auth token
    const timer = setTimeout(() => {
      router.push('/onboarding');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

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
