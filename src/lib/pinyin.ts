// ============================================================
// 拼音辅助工具
//
// 功能：
// - 全文拼音开关（默认 HSK1-2 开启，HSK3 关闭）
// - 点击生词弹窗：拼音 + 释义 + 发音按钮
// - 拼音数据来自 HSK 词表 + 预置多音字映射表
// ============================================================

import type { HskLevel } from '@/types';

// ---- 多音字映射表（P0 覆盖常用常见） ----

export const POLYPHONE_MAP: Record<string, Record<string, string>> = {
  '行': { '银行': 'háng', '旅行': 'xíng', '行动': 'xíng', '行李': 'xíng' },
  '了': { '了解': 'liǎo', '了了': 'liǎo', '完了': 'le', '吃了': 'le' },
  '长': { '长大': 'zhǎng', '长城': 'cháng', '很长': 'cháng' },
  '乐': { '快乐': 'lè', '音乐': 'yuè' },
  '重': { '重要': 'zhòng', '重来': 'chóng' },
  '还': { '还有': 'hái', '还书': 'huán' },
  '都': { '都是': 'dōu', '首都': 'dū' },
  '着': { '看着': 'zhe', '着急': 'zháo', '穿着': 'zhuó' },
  '好': { '很好': 'hǎo', '好学': 'hào' },
  '发': { '发现': 'fā', '头发': 'fà' },
  '只': { '只有': 'zhǐ', '一只': 'zhī' },
  '为': { '因为': 'wèi', '成为': 'wéi' },
  '得': { '得到': 'dé', '跑得快': 'de', '必须': 'děi' },
  '种': { '一种': 'zhǒng', '种树': 'zhòng' },
  '没': { '没有': 'méi', '淹没': 'mò' },
};

// ---- 拼音显示模式 ----

export type PinyinMode = 'always' | 'partial' | 'hidden';

/**
 * 根据 HSK 等级推荐默认拼音模式
 */
export function getDefaultPinyinMode(hskLevel: HskLevel): PinyinMode {
  switch (hskLevel) {
    case 1:
    case 2:
      return 'always';    // 默认全部显示拼音
    case 3:
      return 'partial';   // 仅生词显示拼音
  }
}

// ---- 拼音标注格式 ----

export type PinyinStyle = 'inline' | 'above' | 'popup';

export interface CharPinyin {
  char: string;
  pinyin: string;
  isPolyphone: boolean;
  possibleReadings: string[];
}

/**
 * 为一段文字标注拼音
 * 
 * @param text 中文文本
 * @param knownChars 用户已掌握的字集（掌握的字不标拼音，除非 hskLevel=1）
 * @param mode 拼音显示模式
 * @param hskLevel 用户 HSK 等级
 * @returns 每个字的拼音信息数组
 */
export function annotatePinyin(
  text: string,
  knownChars: Set<string>,
  mode: PinyinMode,
  hskLevel: HskLevel,
): CharPinyin[] {
  const result: CharPinyin[] = [];
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    
    // 非中文字符，跳过拼音标注
    if (!/[\u4e00-\u9fff]/.test(char)) {
      result.push({ char, pinyin: '', isPolyphone: false, possibleReadings: [] });
      continue;
    }

    // 判断是否是多音字
    const isPolyphone = char in POLYPHONE_MAP;
    let pinyin = getCharPinyin(char, text, i);

    // 判断是否需要显示拼音
    const shouldShow = shouldShowPinyin(char, knownChars, mode, hskLevel);
    if (!shouldShow) {
      pinyin = ''; // 不显示拼音，但保留多音字信息（用于点击时展示）
    }

    result.push({
      char,
      pinyin,
      isPolyphone,
      possibleReadings: isPolyphone ? Object.keys(POLYPHONE_MAP[char]) : [],
    });
  }

  return result;
}

/**
 * 判断某个字是否应该显示拼音
 */
function shouldShowPinyin(
  char: string,
  knownChars: Set<string>,
  mode: PinyinMode,
  hskLevel: HskLevel,
): boolean {
  switch (mode) {
    case 'always':
      return true;     // 全部显示
    case 'hidden':
      return false;    // 全部隐藏
    case 'partial':
      // HSK1 全部显示，HSK2+ 仅非掌握字显示
      if (hskLevel === 1) return true;
      return !knownChars.has(char);
  }
}

/**
 * 获取某个字在上下文中的拼音（含多音字消歧）
 * 
 * 策略：
 * 1. 先查多音字映射表（按上下文词组匹配）
 * 2. 如果没有上下文匹配，取最常见的读音
 * 3. 如果没有预置数据，返回空
 * 
 * P0 简化版：多音字靠预置表，非多音字用从HSK词表获取的拼音
 */
function getCharPinyin(char: string, context: string, charIndex: number): string {
  // 检查是否是多音字
  const polyphoneEntry = POLYPHONE_MAP[char];
  if (polyphoneEntry) {
    // 检查上下文中的词组匹配
    for (const [word, reading] of Object.entries(polyphoneEntry)) {
      if (context.includes(word)) {
        return reading;
      }
    }
    // 没有匹配到上下文，用最常见的读音
    return Object.values(polyphoneEntry)[0] || '';
  }

  // 非多音字，从 HSK 词表获取
  // P0 简化：返回占位，运行时从完整 HSK 数据加载
  return char; // 实际使用时会替换为真实拼音
}

// ---- 前端组件用的数据结构 ----

export interface PinyinSegment {
  text: string;       // 可能是纯汉字，也可能是拼音+汉字的组合
  pinyin?: string;    // 拼音（如果有）
  isHanzi: boolean;   // 是否是汉字
  isKnown: boolean;   // 是否是用户已掌握的字
}

/**
 * 将文章文本分段为「汉字段」和「非汉字段」
 * 每个汉字段携带拼音信息
 */
export function segmentForDisplay(
  text: string,
  pinyinAnnotations: CharPinyin[],
): PinyinSegment[] {
  const segments: PinyinSegment[] = [];
  let currentText = '';
  let currentPinyin = '';
  let currentIsHanzi = false;
  let currentIsKnown = false;

  for (let i = 0; i < pinyinAnnotations.length; i++) {
    const annotation = pinyinAnnotations[i];
    const isHanzi = /[\u4e00-\u9fff]/.test(annotation.char);

    if (isHanzi !== currentIsHanzi && currentText) {
      // 类型切换，flush
      segments.push({
        text: currentText,
        pinyin: currentIsHanzi ? currentPinyin : undefined,
        isHanzi: currentIsHanzi,
        isKnown: currentIsKnown,
      });
      currentText = '';
      currentPinyin = '';
    }

    currentText += annotation.char;
    currentIsHanzi = isHanzi;
    currentIsKnown = !annotation.pinyin; // 如果没标拼音说明已掌握

    if (isHanzi && annotation.pinyin) {
      currentPinyin += annotation.pinyin + ' ';
    }
  }

  // flush 最后一段
  if (currentText) {
    segments.push({
      text: currentText,
      pinyin: currentIsHanzi ? currentPinyin.trim() : undefined,
      isHanzi: currentIsHanzi,
      isKnown: currentIsKnown,
    });
  }

  return segments;
}
