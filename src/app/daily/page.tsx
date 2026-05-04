'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { listenToAuthChanges, waitForAuth, getClientProfile, createDefaultProfile, setClientProfile, updateClientProfile } from '@/lib/auth';
import { getTodayTask, SrsTask } from '@/lib/srs';
import { speakText, stopSpeaking, warmUpVoices } from '@/lib/tts';
import { getWord, getWordsByLevel, getAllWords } from '@/lib/hsk';
import { initLexicon } from '@/lib/lexicon';
import { ChineseWord } from '@/lib/types';
import AppLayout from '@/components/AppLayout';
import LoadingScreen from '@/components/LoadingScreen';
import { usePageTitle } from '@/components/usePageTitle';

function CharPopup({ char, onClose }: { char: string; onClose: () => void }) {
  const word = char.length > 1 ? getWord(char) : getWord(char);
  const isMultiChar = char.length > 1;
  const allWords = getAllWords();
  const knownWord = isMultiChar
    ? allWords.find(w => w.word === char)
    : allWords.find(w => w.word === char);

  return (
    <div className="fixed inset-0 bg-black/20 z-20 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">
            {isMultiChar ? '📝 词' : '🔤 字'}
          </div>
          <div className="text-4xl font-bold text-gray-800 mb-2">
            {char}
          </div>
          {knownWord && (
            <>
              <div className="text-lg text-amber-500 mb-1">{knownWord.pinyin}</div>
              <div className="text-gray-500 mb-2">{knownWord.meaning}</div>
              <div className="text-xs text-gray-400 mb-4">HSK {knownWord.hskLevel}</div>
            </>
          )}
          {!knownWord && (
            <div className="text-gray-400 mb-4 text-sm">
              {char.split('').map((c, i) => {
                const w = getWord(c);
                return (
                  <span key={i} className="block">
                    {c}: {w ? `${w.pinyin} ${w.meaning}` : '—'}
                  </span>
                );
              })}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); speakText(char, { lang: 'zh-CN', rate: 0.85 }); }}
            className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full hover:bg-amber-200 transition-colors"
          >
            🔊 听发音
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyPage() {
  const router = useRouter();
  usePageTitle('今日阅读');
  const [task, setTask] = useState<SrsTask | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [popupChar, setPopupChar] = useState<string | null>(null);
  const [readingComplete, setReadingComplete] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navCountdown, setNavCountdown] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef(getClientProfile());

  useEffect(() => {
    const init = async () => {
      const cleanup = listenToAuthChanges();
      const auth = await waitForAuth();
      if (!auth) {
        router.replace('/auth');
        return;
      }
      setAuthReady(true);

      let profile = getClientProfile();
      if (!profile) {
        profile = createDefaultProfile(auth);
        setClientProfile(profile);
      }
      profileRef.current = profile;

      const levelWords = getWordsByLevel(profile.hskLevel);
      initLexicon(levelWords.map(w => ({
        word: w.word, hskLevel: w.hskLevel,
        mastery: 0, lastReviewed: Date.now(),
        reviewCount: 0, correctCount: 0, incorrectCount: 0,
      })));

      const todayTask = await getTodayTask(profile);
      setTask(todayTask);
      setShowPinyin(profile.hskLevel <= 2);
      warmUpVoices();
      setInitialized(true);
      return () => cleanup();
    };
    init();
  }, [router]);

  // Countdown for navigation after complete
  useEffect(() => {
    if (navCountdown > 0) {
      const timer = setTimeout(() => setNavCountdown(navCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (navCountdown === 0 && readingComplete) {
      router.push('/quiz');
    }
  }, [navCountdown, readingComplete, router]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const total = scrollHeight - clientHeight;
    setScrollProgress(total > 0 ? Math.min(100, Math.round((scrollTop / total) * 100)) : 100);
  }, []);

  const handleReadAloud = () => {
    if (!task) return;
    if (isReading) { stopSpeaking(); setIsReading(false); return; }
    setIsReading(true);
    speakText(task.article.content, {
      lang: 'zh-CN', rate: 0.8, pitch: 1.1,
      onEnd: () => setIsReading(false),
    });
  };

  const handleComplete = () => {
    stopSpeaking();
    setIsReading(false);
    setReadingComplete(true);

    const profile = profileRef.current;
    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = profile.streakDays;
      if (profile.lastReadDate === yesterday) newStreak += 1;
      else if (profile.lastReadDate !== today) newStreak = 1;
      updateClientProfile({
        totalRead: (profile.totalRead || 0) + 1,
        streakDays: newStreak,
        lastReadDate: today,
        points: (profile.points || 0) + 10,
      });
    }
    setNavCountdown(3);
  };

  if (!initialized || !task) {
    return <LoadingScreen text="准备今日文章..." />;
  }

  if (readingComplete) {
    return (
      <AppLayout showTabBar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center animate-fade-in">
            <div className="text-8xl mb-4 animate-bounce-in">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">读完了！</h2>
            <p className="text-gray-500 mb-2">真棒！来做个小测验吧</p>
            <p className="text-amber-500 text-lg font-bold">{navCountdown} 秒后自动跳转...</p>
            <button
              onClick={() => router.push('/quiz')}
              className="mt-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.97] transition-all"
            >
              现在就去 →
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Build article with known word groupings
  const allKnownWords = getAllWords().map(w => w.word);
  const knownWordSet = new Set(allKnownWords);

  return (
    <AppLayout showTabBar={false}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/profile')}
            className="text-xl hover:scale-110 transition-transform"
            title="个人主页"
          >
            👤
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-800">📖 今日阅读</h1>
            <p className="text-xs text-gray-400">
              {task.article.hskLevel <= 2 ? '✨ 拼音辅助' : '🔤 生词标注'}
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-200 transition-colors"
            >
              {showPinyin ? '隐藏拼音' : '显示拼音'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1.5">
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-1.5 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Article */}
      <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{task.article.title}</h2>

            <div className="space-y-3 leading-relaxed text-lg">
              {task.article.content.split('\n').filter(Boolean).map((line, lineIdx) => (
                <p key={lineIdx} className="text-gray-700">
                  {(() => {
                    const elements: React.ReactNode[] = [];
                    let i = 0;
                    while (i < line.length) {
                      const char = line[i];
                      const isChinese = /[\u4e00-\u9fff]/.test(char);

                      if (!isChinese) {
                        elements.push(<span key={i}>{char}</span>);
                        i++;
                        continue;
                      }

                      // Try to match longest known word first (max 4 chars)
                      let matchedLen = 1;
                      for (let len = 4; len >= 1; len--) {
                        if (i + len <= line.length) {
                          const slice = line.slice(i, i + len);
                          if (knownWordSet.has(slice)) {
                            matchedLen = len;
                            break;
                          }
                        }
                      }

                      const wordSlice = line.slice(i, i + matchedLen);
                      const wordInfo = getWord(wordSlice);

                      const isMultiCharWord = matchedLen > 1 && knownWordSet.has(wordSlice);

                      elements.push(
                        <span
                          key={i}
                          onClick={() => setPopupChar(wordSlice)}
                          className="inline-block cursor-pointer hover:bg-amber-100 hover:scale-110 transition-all duration-150 rounded px-0.5 relative group"
                          title={wordInfo?.pinyin || ''}
                        >
                          {showPinyin && wordInfo?.pinyin && (
                            <span className="block text-[10px] text-amber-500 leading-none text-center">
                              {wordInfo.pinyin}
                            </span>
                          )}
                          <span className="font-medium">
                            {wordSlice.split('').map((c, j) => (
                              <span
                                key={j}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPopupChar(c);
                                }}
                                className="hover:text-amber-600"
                              >
                                {c}
                              </span>
                            ))}
                          </span>
                        </span>
                      );
                      i += matchedLen;
                    }
                    return elements;
                  })()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Char popup */}
      {popupChar && <CharPopup char={popupChar} onClose={() => setPopupChar(null)} />}

      {/* Bottom controls */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-amber-100 px-4 py-3 sticky bottom-0">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={handleReadAloud}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all text-sm ${
              isReading
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {isReading ? '⏹ 停止' : '🔊 跟读'}
          </button>

          <div className="flex-1" />
          <span className="text-xs text-gray-400">{scrollProgress}%</span>

          <button
            onClick={handleComplete}
            className="px-6 py-2.5 rounded-full font-bold text-sm transition-all bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            读完啦！✅
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
