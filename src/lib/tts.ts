// Text-to-Speech utility using Web Speech API
// Runs in browser context only

export function speakText(
  text: string,
  options: {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
  } = {}
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('SpeechSynthesis API not available');
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'zh-CN';
  utterance.rate = options.rate || 0.9; // Slightly slower for children
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  // Try to find a Chinese voice
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.startsWith('zh'));
  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
