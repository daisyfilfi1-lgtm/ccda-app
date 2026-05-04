'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth } from '@/lib/auth';

export function useAuthGuard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      router.replace('/auth');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  return authorized;
}
