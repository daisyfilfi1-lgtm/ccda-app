// Pinyin utility for annotating Chinese text
import { getPinyin } from './hsk';

export interface PinyinAnnotation {
  character: string;
  pinyin: string;
  isWordStart: boolean;
}

// Simple word-level pinyin annotation
export function annotatePinyin(text: string): PinyinAnnotation[] {
  const chars = text.split('');
  const result: PinyinAnnotation[] = [];
  let i = 0;

  while (i < chars.length) {
    const char = chars[i];
    // Check if this character is Chinese
    if (/[\u4e00-\u9fff]/.test(char)) {
      const pinyin = getPinyin(char);
      result.push({
        character: char,
        pinyin: pinyin || '',
        isWordStart: i === 0 || !/[\u4e00-\u9fff]/.test(chars[i - 1]),
      });
    } else {
      result.push({
        character: char,
        pinyin: '',
        isWordStart: false,
      });
    }
    i++;
  }

  return result;
}

// Get pinyin for a whole text, one word at a time
export function getTextPinyin(text: string): string {
  const chars = text.split('');
  const pinyins: string[] = [];
  
  for (const char of chars) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      const p = getPinyin(char);
      pinyins.push(p || char);
    } else {
      pinyins.push(char);
    }
  }

  return pinyins.join(' ');
}
