// Enhanced TTS with child-friendly voice optimization
// Uses Web Speech API with Chinese voice selection and natural pacing

let currentUtterance: SpeechSynthesisUtterance | null = null;
let wordBoundaries: { char: string; start: number; end: number }[] = [];
let onWordChange: ((char: string) => void) | null = null;
let utteranceQueue: SpeechSynthesisUtterance[] = [];
let isPlayingQueue = false;

export function setWordBoundaries(
  boundaries: { char: string; start: number; end: number }[]
): void {
  wordBoundaries = boundaries;
}

// Pre-warm voice selection on page load
let preferredVoice: SpeechSynthesisVoice | null = null;

/**
 * Find the most natural Chinese voice.
 * Priority order:
 * 1. Microsoft Xiaoxiao (most natural, Edge/Chrome Windows)
 * 2. Any Chinese female voice
 * 3. Any Chinese voice
 * 4. Default with adjusted params
 */
function findBestChineseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  // Microsoft neural voices are the most natural
  const msPriority = [
    (v: SpeechSynthesisVoice) => v.name.includes('Xiaoxiao'),
    (v: SpeechSynthesisVoice) => v.name.includes('Xiaoyi'),
    (v: SpeechSynthesisVoice) => v.name.includes('Yunxi'),       // Male but natural
    (v: SpeechSynthesisVoice) => v.name.includes('Yunjian'),     // Male, good for stories
    (v: SpeechSynthesisVoice) => v.name.includes('Yunyang'),     // Male, storytelling
    (v: SpeechSynthesisVoice) => v.name.includes('Huihui'),
    (v: SpeechSynthesisVoice) => v.name.includes('Zhiyu'),       // AWS Polly
  ];

  for (const pred of msPriority) {
    const found = voices.find(v => v.lang.startsWith('zh') && pred(v));
    if (found) return found;
  }

  // Fallback: any Chinese female voice
  const female = voices.find(
    v => v.lang.startsWith('zh') && (
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('girl') ||
      v.name.toLowerCase().includes('lady')
    )
  );
  if (female) return female;

  // Last resort: any Chinese voice
  return voices.find(v => v.lang.startsWith('zh')) || null;
}

/**
 * Split text into smaller chunks for more natural speaking with pauses.
 * Adds micro-pauses at punctuation boundaries.
 */
function splitIntoChunks(text: string): string[] {
  // Split by sentence-ending punctuation
  const sentences = text.split(/(?<=[。！？.!?])/);
  const chunks: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // If sentence is long, split by commas too
    if (trimmed.length > 50) {
      const parts = trimmed.split(/(?<=[，、；：,;:])/);
      for (const part of parts) {
        const p = part.trim();
        if (p) chunks.push(p);
      }
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

function playNextInQueue(onEnd?: () => void) {
  if (utteranceQueue.length === 0) {
    isPlayingQueue = false;
    onEnd?.();
    return;
  }

  isPlayingQueue = true;
  const utt = utteranceQueue.shift()!;

  utt.onend = () => {
    // Small pause between sentences (200ms)
    setTimeout(() => playNextInQueue(onEnd), 200);
  };

  window.speechSynthesis.speak(utt);
}

export function speakText(
  text: string,
  options: {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onBoundary?: (char: string, index: number) => void;
  } = {}
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('SpeechSynthesis not available');
    return null;
  }

  // Cancel any existing speech
  window.speechSynthesis.cancel();
  utteranceQueue = [];
  isPlayingQueue = false;

  // Cache voice selection
  if (!preferredVoice) {
    preferredVoice = findBestChineseVoice();
  }

  // Split text into natural chunks for more human-like pacing
  const chunks = splitIntoChunks(text);

  // Create an utterance per chunk
  for (const chunk of chunks) {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = options.lang || 'zh-CN';

    // Slower rate for children, higher pitch for warmth
    if (preferredVoice) {
      // Microsoft neural voices are very natural at slower speeds
      utterance.rate = options.rate ?? 0.75;
      utterance.pitch = options.pitch ?? 1.05;
      utterance.voice = preferredVoice;
    } else {
      // No good Chinese voice available — compensate with slower rate
      utterance.rate = options.rate ?? 0.7;
      utterance.pitch = options.pitch ?? 1.1;
    }

    utterance.volume = options.volume || 1.0;

    // Word boundary tracking
    if (options.onBoundary) {
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          for (let i = 0; i < wordBoundaries.length; i++) {
            const wb = wordBoundaries[i];
            if (charIndex >= wb.start && charIndex < wb.end) {
              options.onBoundary?.(wb.char, i);
              break;
            }
          }
          if (charIndex < text.length) {
            const ch = text[charIndex];
            if (/[\u4e00-\u9fff]/.test(ch)) {
              options.onBoundary?.(ch, charIndex);
            }
          }
        }
      };
    }

    utteranceQueue.push(utterance);
  }

  // Start playing the queue
  playNextInQueue(options.onEnd);

  currentUtterance = utteranceQueue[0] || null;
  return currentUtterance;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  utteranceQueue = [];
  isPlayingQueue = false;
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking || isPlayingQueue;
  }
  return false;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices();
}

export function warmUpVoices(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    // Force voice list to load
    window.speechSynthesis.getVoices();
    // Pre-select the best voice
    preferredVoice = findBestChineseVoice();
  }
}
