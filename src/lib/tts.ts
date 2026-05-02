// Enhanced TTS with word-by-word highlighting and child-friendly voice
// Uses Web Speech API with Chinese voice optimization

let currentUtterance: SpeechSynthesisUtterance | null = null;
let wordBoundaries: { char: string; start: number; end: number }[] = [];
let onWordChange: ((char: string) => void) | null = null;

export function setWordBoundaries(
  boundaries: { char: string; start: number; end: number }[]
): void {
  wordBoundaries = boundaries;
}

// Pre-warm voice selection on page load
let preferredVoice: SpeechSynthesisVoice | null = null;

function findBestChineseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Priority: Chinese female voices (more child-friendly)
  const priority = [
    (v: SpeechSynthesisVoice) => v.lang.startsWith('zh') && v.name.includes('Female'),
    (v: SpeechSynthesisVoice) => v.lang.startsWith('zh') && v.name.includes('Xiaoxiao'),
    (v: SpeechSynthesisVoice) => v.lang.startsWith('zh') && v.name.includes('Huihui'),
    (v: SpeechSynthesisVoice) => v.lang.startsWith('zh') && v.name.includes('Yunxi'),
    (v: SpeechSynthesisVoice) => v.lang.startsWith('zh'),
    (v: SpeechSynthesisVoice) => v.name.includes('Samantha') || v.name.includes('Tingting'),
  ];
  for (const pred of priority) {
    const found = voices.find(pred);
    if (found) return found;
  }
  return null;
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

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'zh-CN';
  utterance.rate = options.rate ?? 0.8; // Slower for children (0.8 is more natural)
  utterance.pitch = options.pitch ?? 1.1; // Slightly higher pitch = more child-friendly
  utterance.volume = options.volume || 1.0;

  // Set preferred voice
  if (!preferredVoice) {
    preferredVoice = findBestChineseVoice();
  }
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Fallback: if no Chinese voice available, use default with slower rate
  if (!preferredVoice) {
    utterance.rate = 0.75;
    utterance.pitch = 1.15;
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  // Word boundary tracking for highlighting
  if (options.onBoundary) {
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        // Find which character/word this boundary corresponds to
        for (let i = 0; i < wordBoundaries.length; i++) {
          const wb = wordBoundaries[i];
          if (charIndex >= wb.start && charIndex < wb.end) {
            options.onBoundary?.(wb.char, i);
            break;
          }
        }
        // Fallback: approximate char index
        if (charIndex < text.length) {
          const ch = text[charIndex];
          if (/[\u4e00-\u9fff]/.test(ch)) {
            options.onBoundary?.(ch, charIndex);
          }
        }
      }
    };
  }

  window.speechSynthesis.speak(utterance);
  currentUtterance = utterance;
  return utterance;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices();
}

export function warmUpVoices(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }
}
