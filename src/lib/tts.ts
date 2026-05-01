// ============================================================
// TTS 工具 — 文章朗读 + 生词单字朗读
//
// 使用 Edge TTS（免费，中文质量好）
// 浏览器端通过 SpeechSynthesis API + Edge TTS 实现
// 服务端通过 edge-tts 库或直接调用微软 API
// ============================================================

export type TtsVoice = 'zh-CN-XiaoxiaoNeural' | 'zh-CN-YunxiNeural' | 'zh-CN-XiaoyiNeural';
export type TtsSpeed = 0.8 | 1.0 | 1.2;

export interface TtsOptions {
  /** 朗读文本 */
  text: string;
  /** 语速 */
  speed?: TtsSpeed;
  /** 音色（女童/男童/女声） */
  voice?: TtsVoice;
}

/**
 * TTS 朗读配置
 * 
 * P0 使用浏览器原生 SpeechSynthesis API（免费，零依赖）
 * 优先使用 Edge TTS（通过 @azure/cognitiveservices-speech 或原生 API）
 * 
 * 回退策略：
 * 1. 优先: Edge TTS (zh-CN-XiaoxiaoNeural) — 最自然的中文童声
 * 2. 备选: 浏览器默认中文语音
 * 3. 保底: 无声音（静默失败，不影响阅读）
 */

/** Edge TTS 语音列表（可用） */
export const TTS_VOICES = {
  xiaoxiao: 'zh-CN-XiaoxiaoNeural', // 女声，温柔亲切
  yunxi: 'zh-CN-YunxiNeural',       // 男声，阳光活力
  xiaoyi: 'zh-CN-XiaoyiNeural',     // 女声，可爱活泼（适合6-10岁）
};

/**
 * 分割文本为合适长度的段落用于逐段朗读
 * 
 * 中文按句号、问号、感叹号、换行符分割
 */
export function splitTextForTTS(text: string): string[] {
  // 按句子分割，保留标点
  const segments = text.split(/(?<=[。！？\n])/);
  
  // 合并太短的句子（少于8个字）到前一句
  const merged: string[] = [];
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    
    if (merged.length > 0 && trimmed.length < 8) {
      merged[merged.length - 1] += trimmed;
    } else {
      merged.push(trimmed);
    }
  }
  
  return merged;
}

/**
 * 获取浏览器支持的 TTS 语音
 * 
 * 优先返回 Edge TTS 中的中文语音
 */
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  // 按优先级排序
  const preferred = [
    'zh-CN-XiaoxiaoNeural',
    'zh-CN-YunxiNeural', 
    'zh-CN-XiaoyiNeural',
    'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
  ];
  
  for (const name of preferred) {
    const voice = voices.find(v => v.name.includes(name) || v.name === name);
    if (voice) return voice;
  }
  
  // 保底：任何中文语音
  return voices.find(v => v.lang.startsWith('zh')) || null;
}

/**
 * 朗读全文
 */
export function speakArticle(
  text: string,
  speed: TtsSpeed = 1.0,
  onEnd?: () => void,
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('SpeechSynthesis not supported');
    return null;
  }

  // 先取消正在朗读的
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = speed;
  utterance.volume = 1;

  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * 朗读单个字/词（用于点击生词时发音）
 */
export function speakChar(char: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(char);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9; // 单字慢一点

  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

/**
 * 获取支持 TTS 的浏览器检查
 */
export function isTtsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

/**
 * 服务端 TTS（用于预生成文章音频）
 * 需要 edge-tts 库或调用微软语音服务
 * P0 暂不使用，预留接口
 */
export async function serverSideTts(options: TtsOptions): Promise<ArrayBuffer | null> {
  // P0 跳过服务端预生成，使用浏览器端 TTS
  return null;
}
