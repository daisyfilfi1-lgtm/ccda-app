import { HskLevel, ChineseWord } from './types';

// HSK 1-3 vocabulary database
const HSK_WORDS: Record<HskLevel, ChineseWord[]> = {
  1: [
    { word: '我', pinyin: 'wǒ', meaning: 'I/me', hskLevel: 1 },
    { word: '你', pinyin: 'nǐ', meaning: 'you', hskLevel: 1 },
    { word: '他', pinyin: 'tā', meaning: 'he/him', hskLevel: 1 },
    { word: '她', pinyin: 'tā', meaning: 'she/her', hskLevel: 1 },
    { word: '好', pinyin: 'hǎo', meaning: 'good', hskLevel: 1 },
    { word: '大', pinyin: 'dà', meaning: 'big', hskLevel: 1 },
    { word: '小', pinyin: 'xiǎo', meaning: 'small', hskLevel: 1 },
    { word: '人', pinyin: 'rén', meaning: 'person', hskLevel: 1 },
    { word: '山', pinyin: 'shān', meaning: 'mountain', hskLevel: 1 },
    { word: '水', pinyin: 'shuǐ', meaning: 'water', hskLevel: 1 },
    { word: '火', pinyin: 'huǒ', meaning: 'fire', hskLevel: 1 },
    { word: '天', pinyin: 'tiān', meaning: 'sky/day', hskLevel: 1 },
    { word: '日', pinyin: 'rì', meaning: 'sun/day', hskLevel: 1 },
    { word: '月', pinyin: 'yuè', meaning: 'moon/month', hskLevel: 1 },
    { word: '一', pinyin: 'yī', meaning: 'one', hskLevel: 1 },
    { word: '二', pinyin: 'èr', meaning: 'two', hskLevel: 1 },
    { word: '三', pinyin: 'sān', meaning: 'three', hskLevel: 1 },
    { word: '猫', pinyin: 'māo', meaning: 'cat', hskLevel: 1 },
    { word: '狗', pinyin: 'gǒu', meaning: 'dog', hskLevel: 1 },
    { word: '鱼', pinyin: 'yú', meaning: 'fish', hskLevel: 1 },
    { word: '花', pinyin: 'huā', meaning: 'flower', hskLevel: 1 },
    { word: '草', pinyin: 'cǎo', meaning: 'grass', hskLevel: 1 },
    { word: '书', pinyin: 'shū', meaning: 'book', hskLevel: 1 },
    { word: '笔', pinyin: 'bǐ', meaning: 'pen', hskLevel: 1 },
    { word: '头', pinyin: 'tóu', meaning: 'head', hskLevel: 1 },
    { word: '手', pinyin: 'shǒu', meaning: 'hand', hskLevel: 1 },
    { word: '口', pinyin: 'kǒu', meaning: 'mouth', hskLevel: 1 },
    { word: '目', pinyin: 'mù', meaning: 'eye', hskLevel: 1 },
    { word: '耳', pinyin: 'ěr', meaning: 'ear', hskLevel: 1 },
    { word: '牛', pinyin: 'niú', meaning: 'cow', hskLevel: 1 },
    { word: '马', pinyin: 'mǎ', meaning: 'horse', hskLevel: 1 },
    { word: '羊', pinyin: 'yáng', meaning: 'sheep', hskLevel: 1 },
    { word: '鸟', pinyin: 'niǎo', meaning: 'bird', hskLevel: 1 },
    { word: '虫', pinyin: 'chóng', meaning: 'bug/insect', hskLevel: 1 },
    { word: '云', pinyin: 'yún', meaning: 'cloud', hskLevel: 1 },
    { word: '雨', pinyin: 'yǔ', meaning: 'rain', hskLevel: 1 },
    { word: '风', pinyin: 'fēng', meaning: 'wind', hskLevel: 1 },
    { word: '土', pinyin: 'tǔ', meaning: 'earth/soil', hskLevel: 1 },
    { word: '木', pinyin: 'mù', meaning: 'tree/wood', hskLevel: 1 },
    { word: '石', pinyin: 'shí', meaning: 'stone', hskLevel: 1 },
  ],
  2: [
    { word: '苹果', pinyin: 'píngguǒ', meaning: 'apple', hskLevel: 2 },
    { word: '同学', pinyin: 'tóngxué', meaning: 'classmate', hskLevel: 2 },
    { word: '老师', pinyin: 'lǎoshī', meaning: 'teacher', hskLevel: 2 },
    { word: '学生', pinyin: 'xuéshēng', meaning: 'student', hskLevel: 2 },
    { word: '朋友', pinyin: 'péngyǒu', meaning: 'friend', hskLevel: 2 },
    { word: '学校', pinyin: 'xuéxiào', meaning: 'school', hskLevel: 2 },
    { word: '快乐', pinyin: 'kuàilè', meaning: 'happy', hskLevel: 2 },
    { word: '颜色', pinyin: 'yánsè', meaning: 'color', hskLevel: 2 },
    { word: '红色', pinyin: 'hóngsè', meaning: 'red', hskLevel: 2 },
    { word: '蓝色', pinyin: 'lánsè', meaning: 'blue', hskLevel: 2 },
    { word: '绿色', pinyin: 'lǜsè', meaning: 'green', hskLevel: 2 },
    { word: '白色', pinyin: 'báisè', meaning: 'white', hskLevel: 2 },
    { word: '黑色', pinyin: 'hēisè', meaning: 'black', hskLevel: 2 },
    { word: '太阳', pinyin: 'tàiyáng', meaning: 'sun', hskLevel: 2 },
    { word: '月亮', pinyin: 'yuèliàng', meaning: 'moon', hskLevel: 2 },
    { word: '星星', pinyin: 'xīngxīng', meaning: 'star', hskLevel: 2 },
    { word: '春天', pinyin: 'chūntiān', meaning: 'spring', hskLevel: 2 },
    { word: '夏天', pinyin: 'xiàtiān', meaning: 'summer', hskLevel: 2 },
    { word: '秋天', pinyin: 'qiūtiān', meaning: 'autumn', hskLevel: 2 },
    { word: '冬天', pinyin: 'dōngtiān', meaning: 'winter', hskLevel: 2 },
    { word: '高兴', pinyin: 'gāoxìng', meaning: 'happy/glad', hskLevel: 2 },
    { word: '好看', pinyin: 'hǎokàn', meaning: 'pretty/good-looking', hskLevel: 2 },
    { word: '好吃', pinyin: 'hǎochī', meaning: 'delicious', hskLevel: 2 },
    { word: '好玩', pinyin: 'hǎowán', meaning: 'fun', hskLevel: 2 },
    { word: '运动', pinyin: 'yùndòng', meaning: 'sport/exercise', hskLevel: 2 },
    { word: '跑步', pinyin: 'pǎobù', meaning: 'run/jogging', hskLevel: 2 },
    { word: '游泳', pinyin: 'yóuyǒng', meaning: 'swim', hskLevel: 2 },
    { word: '电脑', pinyin: 'diànnǎo', meaning: 'computer', hskLevel: 2 },
    { word: '电视', pinyin: 'diànshì', meaning: 'TV', hskLevel: 2 },
    { word: '电话', pinyin: 'diànhuà', meaning: 'telephone', hskLevel: 2 },
  ],
  3: [
    { word: '图书馆', pinyin: 'túshūguǎn', meaning: 'library', hskLevel: 3 },
    { word: '博物馆', pinyin: 'bówùguǎn', meaning: 'museum', hskLevel: 3 },
    { word: '动物园', pinyin: 'dòngwùyuán', meaning: 'zoo', hskLevel: 3 },
    { word: '蛋糕', pinyin: 'dàngāo', meaning: 'cake', hskLevel: 3 },
    { word: '面包', pinyin: 'miànbāo', meaning: 'bread', hskLevel: 3 },
    { word: '牛奶', pinyin: 'niúnǎi', meaning: 'milk', hskLevel: 3 },
    { word: '鸡蛋', pinyin: 'jīdàn', meaning: 'egg', hskLevel: 3 },
    { word: '面条', pinyin: 'miàntiáo', meaning: 'noodles', hskLevel: 3 },
    { word: '米饭', pinyin: 'mǐfàn', meaning: 'rice', hskLevel: 3 },
    { word: '蔬菜', pinyin: 'shūcài', meaning: 'vegetable', hskLevel: 3 },
    { word: '水果', pinyin: 'shuǐguǒ', meaning: 'fruit', hskLevel: 3 },
    { word: '动物', pinyin: 'dòngwù', meaning: 'animal', hskLevel: 3 },
    { word: '植物', pinyin: 'zhíwù', meaning: 'plant', hskLevel: 3 },
    { word: '飞机', pinyin: 'fēijī', meaning: 'airplane', hskLevel: 3 },
    { word: '火车', pinyin: 'huǒchē', meaning: 'train', hskLevel: 3 },
    { word: '汽车', pinyin: 'qìchē', meaning: 'car', hskLevel: 3 },
    { word: '自行车', pinyin: 'zìxíngchē', meaning: 'bicycle', hskLevel: 3 },
    { word: '唱歌', pinyin: 'chànggē', meaning: 'sing', hskLevel: 3 },
    { word: '跳舞', pinyin: 'tiàowǔ', meaning: 'dance', hskLevel: 3 },
    { word: '画画', pinyin: 'huàhuà', meaning: 'draw/paint', hskLevel: 3 },
    { word: '恐龙', pinyin: 'kǒnglóng', meaning: 'dinosaur', hskLevel: 3 },
    { word: '太空', pinyin: 'tàikōng', meaning: 'space', hskLevel: 3 },
    { word: '海洋', pinyin: 'hǎiyáng', meaning: 'ocean', hskLevel: 3 },
    { word: '故事', pinyin: 'gùshì', meaning: 'story', hskLevel: 3 },
    { word: '游戏', pinyin: 'yóuxì', meaning: 'game', hskLevel: 3 },
    { word: '音乐', pinyin: 'yīnyuè', meaning: 'music', hskLevel: 3 },
    { word: '数学', pinyin: 'shùxué', meaning: 'math', hskLevel: 3 },
    { word: '科学', pinyin: 'kēxué', meaning: 'science', hskLevel: 3 },
    { word: '世界', pinyin: 'shìjiè', meaning: 'world', hskLevel: 3 },
    { word: '国家', pinyin: 'guójiā', meaning: 'country', hskLevel: 3 },
    { word: '城市', pinyin: 'chéngshì', meaning: 'city', hskLevel: 3 },
    { word: '医院', pinyin: 'yīyuàn', meaning: 'hospital', hskLevel: 3 },
    { word: '公园', pinyin: 'gōngyuán', meaning: 'park', hskLevel: 3 },
    { word: '超市', pinyin: 'chāoshì', meaning: 'supermarket', hskLevel: 3 },
    { word: '旁边', pinyin: 'pángbiān', meaning: 'beside/nearby', hskLevel: 3 },
    { word: '告诉', pinyin: 'gàosù', meaning: 'tell', hskLevel: 3 },
    { word: '帮助', pinyin: 'bāngzhù', meaning: 'help', hskLevel: 3 },
    { word: '欢迎', pinyin: 'huānyíng', meaning: 'welcome', hskLevel: 3 },
    { word: '选择', pinyin: 'xuǎnzé', meaning: 'choose', hskLevel: 3 },
    { word: '准备', pinyin: 'zhǔnbèi', meaning: 'prepare', hskLevel: 3 },
  ],
  4: [], 5: [], 6: []
};

export function getWordsByLevel(level: HskLevel): ChineseWord[] {
  return [...(HSK_WORDS[level] || [])];
}

export function getAllWords(): ChineseWord[] {
  return [...HSK_WORDS[1], ...HSK_WORDS[2], ...HSK_WORDS[3]];
}

export function getWord(word: string): ChineseWord | undefined {
  for (const level of [1, 2, 3] as HskLevel[]) {
    const found = HSK_WORDS[level].find(w => w.word === word);
    if (found) return found;
  }
  return undefined;
}

export function getWordsForAssessment(level: HskLevel, count: number): ChineseWord[] {
  const pool = getWordsByLevel(level);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getPinyin(word: string): string {
  const entry = getWord(word);
  return entry?.pinyin || '';
}

export function getMeaning(word: string): string {
  const entry = getWord(word);
  return entry?.meaning || '';
}
