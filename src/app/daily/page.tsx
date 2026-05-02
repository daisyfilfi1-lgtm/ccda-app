'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { listenToAuthChanges, waitForAuth, getClientProfile, createDefaultProfile, setClientProfile, updateClientProfile } from '@/lib/auth';
import { getTodayTask, SrsTask } from '@/lib/srs';
import { speakText, stopSpeaking, warmUpVoices, setWordBoundaries } from '@/lib/tts';
import { getWord, getWordsByLevel } from '@/lib/hsk';
import { initLexicon } from '@/lib/lexicon';
import { ChineseWord } from '@/lib/types';

export default function DailyPage() {
  const router = useRouter();
  const [task, setTask] = useState<SrsTask | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [selectedWord, setSelectedWord] = useState<ChineseWord | null>(null);
  const [readingComplete, setReadingComplete] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [activeCharIndex, setActiveCharIndex] = useState<number>(-1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navCountdown, setNavCountdown] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const profileRef = useRef(getClientProfile());

  // Build char-level boundaries from article content for TTS sync
  const buildCharBoundaries = useCallback((text: string) => {
    const boundaries: { char: string; start: number; end: number }[] = [];
    // Group consecutive Chinese chars as words
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (/[\u4e00-\u9fff]/.test(ch)) {
        boundaries.push({ char: ch, start: i, end: i + 1 });
      }
      i++;
    }
    return boundaries;
  }, []);

  useEffect(() => {
    const init = async () => {
      const cleanup = listenToAuthChanges();
      const auth = await waitForAuth();
      if (!auth) {
        router.replace('/login');
        return;
      }

      let profile = getClientProfile();
      if (!profile) {
        profile = createDefaultProfile(auth);
        setClientProfile(profile);
      }
      profileRef.current = profile;

      const levelWords = getWordsByLevel(profile.hskLevel);
      initLexicon(
        levelWords.map(w => ({
          word: w.word,
          hskLevel: w.hskLevel,
          mastery: 0,
          lastReviewed: Date.now(),
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        }))
      );

      const todayTask = await getTodayTask(profile);
      setTask(todayTask);
      setShowPinyin(profile.hskLevel <= 2);

      // Pre-warm TTS voices
      warmUpVoices();

      // Build character boundaries for this article
      if (todayTask) {
        const boundaries = buildCharBoundaries(todayTask.article.content);
        setWordBoundaries(boundaries);
      }

      setInitialized(true);
    };
    init();
  }, [router, buildCharBoundaries]);

  // Auto-scroll to active char during reading
  useEffect(() => {
    if (activeCharIndex >= 0 && charRefs.current[activeCharIndex]) {
      const el = charRefs.current[activeCharIndex];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCharIndex]);

  // Countdown timer for navigation after complete
  useEffect(() => {
    if (navCountdown > 0) {
      const timer = setTimeout(() => {
        setNavCountdown(navCountdown - 1);
      }, 1000);
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

  // Handle word boundary events from TTS for highlighting
  const handleReadAloud = () => {
    if (!task) return;
    if (isReading) {
      stopSpeaking();
      setIsReading(false);
      setActiveChar(null);
      setActiveCharIndex(-1);
      return;
    }

    setIsReading(true);

    // Build flat char indices for the full content
    const text = task.article.content;
    const charIndices: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (/[\u4e00-\u9fff]/.test(text[i])) {
        charIndices.push(i);
      }
    }

    let currentIdx = 0;
    speakText(text, {
      lang: 'zh-CN',
      rate: 0.8,
      pitch: 1.1,
      onBoundary: (char, idx) => {
        setActiveChar(char);
        // Find the nearest char index
        const nearest = charIndices.findIndex(ci => ci >= idx);
        if (nearest >= 0) {
          setActiveCharIndex(nearest);
          currentIdx = nearest;
        }
      },
      onEnd: () => {
        setIsReading(false);
        setActiveChar(null);
        setActiveCharIndex(-1);
      },
    });
  };

  const handleWordClick = (char: string) => {
    const word = getWord(char);
    if (word) {
      setSelectedWord(word);
      speakText(char, { lang: 'zh-CN', rate: 0.85 });
    }
  };

  const handleComplete = () => {
    stopSpeaking();
    setIsReading(false);
    setActiveChar(null);
    setActiveCharIndex(-1);
    setReadingComplete(true);

    const profile = profileRef.current;
    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = profile.streakDays;
      if (profile.lastReadDate === yesterday) {
        newStreak += 1;
      } else if (profile.lastReadDate !== today) {
        newStreak = 1;
      }
      updateClientProfile({
        totalRead: (profile.totalRead || 0) + 1,
        streakDays: newStreak,
        lastReadDate: today,
        points: (profile.points || 0) + 10,
      });
    }

    // Start countdown then navigate
    setNavCountdown(3);
  };

  if (!initialized || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4 animate-bounce">📖</div>
          <div className="text-xl font-bold text-amber-600">准备今日文章...</div>
        </div>
      </div>
    );
  }

  if (readingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
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
    );
  }

  // Build article content with highlighted chars
  const contentLines = task.article.content.split('\n').filter(Boolean);
  let globalCharIndex = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex-1" />
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
        <div
          className="bg-gradient-to-r from-amber-400 to-orange-400 h-1.5 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Article content */}
      <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-lg shadow-amber-100 p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              {task.article.title}
            </h2>

            <div className="space-y-3 leading-relaxed text-lg">
              {contentLines.map((line, lineIdx) => (
                <p key={lineIdx} className="text-gray-700">
                  {line.split('').map((char, j) => {
                    const isChinese = /[\u4e00-\u9fff]/.test(char);
                    let thisCharIndex = -1;
                    if (isChinese) {
                      thisCharIndex = globalCharIndex++;
                    }

                    const isActive = thisCharIndex === activeCharIndex;
                    const word = isChinese ? getWord(char) : undefined;
                    const pinyin = word?.pinyin || '';

                    if (!isChinese) {
                      return <span key={j}>{char}</span>;
                    }

                    return (
                      <span
                        key={j}
                        ref={el => { if (thisCharIndex >= 0) charRefs.current[thisCharIndex] = el; }}
                        onClick={() => handleWordClick(char)}
                        className={`
                          inline-block cursor-pointer transition-all duration-150 rounded px-0.5 relative group
                          ${word ? 'hover:bg-amber-100 hover:scale-110' : ''}
                          ${isActive ? 'bg-amber-400 text-white scale-110 shadow-md rounded-md px-1 -mx-0.5' : ''}
                          ${selectedWord?.word === char ? 'text-amber-600 bg-amber-100 rounded' : ''}
                        `}
                        title={pinyin}
                      >
                        {showPinyin && pinyin && (
                          <span className={`block text-[10px] leading-none text-center transition-colors duration-150 ${isActive ? 'text-white' : 'text-amber-500'}`}>
                            {pinyin}
                          </span>
                        )}
                        <span className={`transition-colors duration-150 ${word ? 'font-medium' : ''} ${isActive ? 'text-white' : ''}`}>
                          {char}
                        </span>
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>

            {/* New words section */}
            {task.newWords.length > 0 && (
              <div className="mt-6 border-t border-amber-100 pt-4">
                <h3 className="text-sm font-bold text-amber-600 mb-3">📝 今日新词</h3>
                <div className="flex flex-wrap gap-2">
                  {task.newWords.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedWord(w)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedWord?.word === w.word
                          ? 'bg-amber-400 text-white shadow-md'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      {w.word}
                      <span className="text-xs ml-1 opacity-70">({w.pinyin})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Word detail popup */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black/20 z-20 flex items-end justify-center p-4" onClick={() => setSelectedWord(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800 mb-2">{selectedWord.word}</div>
              <div className="text-lg text-amber-500 mb-1">{selectedWord.pinyin}</div>
              <div className="text-gray-500 mb-4">{selectedWord.meaning}</div>
              <div className="text-xs text-gray-400 mb-4">HSK {selectedWord.hskLevel}</div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => speakText(selectedWord.word, { lang: 'zh-CN', rate: 0.85 })}
                  className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full hover:bg-amber-200 transition-colors"
                >
                  🔊 听发音
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            disabled={scrollProgress <= 50}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              scrollProgress > 50
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            读完啦！✅
          </button>
        </div>
      </div>
    </div>
  );
}
