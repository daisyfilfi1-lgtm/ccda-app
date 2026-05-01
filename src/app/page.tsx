'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getClientAuth, getClientProfile } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getClientAuth();
    const profile = getClientProfile();
    
    if (!auth) {
      router.replace('/login');
      return;
    }
    
    if (!profile || profile.interests.length === 0) {
      router.replace('/assessment');
      return;
    }
    
    if (profile.totalRead === 0) {
      router.replace('/daily');
      return;
    }
    
    router.replace('/daily');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fef9f0]">
      <div className="text-center animate-pulse">
        <div className="text-6xl mb-4">📖</div>
        <div className="text-xl font-bold text-amber-600">加载中...</div>
      </div>
    </div>
  );
}
