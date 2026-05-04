'use client';

interface LoadingScreenProps {
  text?: string;
  emoji?: string;
}

export default function LoadingScreen({ text = '加载中...', emoji = '📖' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center animate-fade-in">
        <div className="text-5xl mb-4 animate-bounce">{emoji}</div>
        <div className="text-xl font-bold text-amber-600">{text}</div>
      </div>
    </div>
  );
}
