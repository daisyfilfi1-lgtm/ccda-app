'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { path: '/daily', label: '今日阅读', icon: '📖' },
  { path: '/achievement', label: '成就', icon: '🏆' },
  { path: '/parent-report', label: '学习报告', icon: '📊' },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Only show on authenticated pages
  const showPaths = ['/daily', '/quiz', '/achievement', '/parent-report'];
  if (!showPaths.some(p => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-amber-200 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const isActive = pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex-1 flex flex-col items-center py-2.5 transition-all ${
                isActive
                  ? 'text-amber-600 scale-105'
                  : 'text-gray-400 hover:text-amber-500'
              }`}
            >
              <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
              <span className={`text-[10px] font-medium ${
                isActive ? 'font-bold' : ''
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
