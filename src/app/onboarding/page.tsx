'use client';

import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAuthGuard } from '@/components/useAuthGuard';
import { usePageTitle } from '@/components/usePageTitle';

export default function OnboardingPage() {
  const router = useRouter();
  const authorized = useAuthGuard();
  usePageTitle('欢迎');

  if (!authorized) return null;

  const handleStart = () => {
    router.push('/assessment');
  };

  return (
    <AppLayout showTabBar={false}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full text-center animate-fade-in">
          <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-8 space-y-6">
            <div className="text-7xl mb-4 animate-bounce-in">🎉</div>

            <h1 className="text-3xl font-bold text-gray-800">
              欢迎来到 CCDA！
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed">
              我是你的 AI 中文阅读助手！<br />
              每天我会为你准备一篇有趣的故事，<br />
              在故事里认识新的汉字和词语 ✨
            </p>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">📖</span>
                <span className="text-xs text-gray-500">每天读故事</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">🎮</span>
                <span className="text-xs text-gray-500">边玩边学</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">🏆</span>
                <span className="text-xs text-gray-500">收集成就</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-4 px-6 rounded-2xl text-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              开始测评 🚀
            </button>

            <p className="text-xs text-gray-400">
              先做一个小测评，让我了解你的中文水平
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
