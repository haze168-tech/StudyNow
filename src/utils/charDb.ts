import { VocabWord, CharacterDetail } from '../types';

// Common character stroke and radical database for frequent 2nd grade words
const CHAR_INFO_MAP: Record<string, { pinyin: string; radical: string; strokes: number }> = {
  '生': { pinyin: 'shēng', radical: '生', strokes: 5 },
  '字': { pinyin: 'zì', radical: '宀', strokes: 6 },
  '词': { pinyin: 'cí', radical: '讠', strokes: 7 },
  '语': { pinyin: 'yǔ', radical: '讠', strokes: 9 },
  '学': { pinyin: 'xué', radical: '子', strokes: 8 },
  '习': { pinyin: 'xí', radical: '习', strokes: 3 },
  '读': { pinyin: 'dú', radical: '讠', strokes: 10 },
  '书': { pinyin: 'shū', radical: '乛', strokes: 4 },
  '写': { pinyin: 'xiě', radical: '冖', strokes: 5 },
  '文': { pinyin: 'wén', radical: '文', strokes: 4 },
  '春': { pinyin: 'chūn', radical: '日', strokes: 9 },
  '夏': { pinyin: 'xià', radical: '夂', strokes: 10 },
  '秋': { pinyin: 'qiū', radical: '禾', strokes: 9 },
  '冬': { pinyin: 'dōng', radical: '夂', strokes: 5 },
  '风': { pinyin: 'fēng', radical: '风', strokes: 4 },
  '雨': { pinyin: 'yǔ', radical: '雨', strokes: 8 },
  '雪': { pinyin: 'xuě', radical: '雨', strokes: 11 },
  '云': { pinyin: 'yún', radical: '二', strokes: 4 },
  '天': { pinyin: 'tiān', radical: '大', strokes: 4 },
  '地': { pinyin: 'dì', radical: '土', strokes: 6 },
  '山': { pinyin: 'shān', radical: '山', strokes: 3 },
  '水': { pinyin: 'shuǐ', radical: '水', strokes: 4 },
  '花': { pinyin: 'huā', radical: '艹', strokes: 7 },
  '草': { pinyin: 'cǎo', radical: '艹', strokes: 9 },
  '树': { pinyin: 'shù', radical: '木', strokes: 9 },
  '木': { pinyin: 'mù', radical: '木', strokes: 4 },
  '林': { pinyin: 'lín', radical: '木', strokes: 8 },
  '鸟': { pinyin: 'niǎo', radical: '鸟', strokes: 5 },
  '鱼': { pinyin: 'yú', radical: '鱼', strokes: 8 },
  '虫': { pinyin: 'chóng', radical: '虫', strokes: 6 },
  '大': { pinyin: 'dà', radical: '大', strokes: 3 },
  '小': { pinyin: 'xiǎo', radical: '小', strokes: 3 },
  '多': { pinyin: 'duō', radical: '夕', strokes: 6 },
  '少': { pinyin: 'shǎo', radical: '小', strokes: 4 },
  '日': { pinyin: 'rì', radical: '日', strokes: 4 },
  '月': { pinyin: 'yuè', radical: '月', strokes: 4 },
  '星': { pinyin: 'xīng', radical: '日', strokes: 9 },
  '明': { pinyin: 'míng', radical: '日', strokes: 8 },
  '光': { pinyin: 'guāng', radical: '儿', strokes: 6 },
  '亮': { pinyin: 'liàng', radical: '亠', strokes: 9 },
  '好': { pinyin: 'hǎo', radical: '女', strokes: 6 },
  '友': { pinyin: 'yǒu', radical: '又', strokes: 4 },
  '朋': { pinyin: 'péng', radical: '月', strokes: 8 },
  '快': { pinyin: 'kuài', radical: '忄', strokes: 7 },
  '乐': { pinyin: 'lè', radical: '丿', strokes: 5 },
  '高': { pinyin: 'gāo', radical: '高', strokes: 10 },
  '兴': { pinyin: 'xìng', radical: '八', strokes: 6 },
  '心': { pinyin: 'xīn', radical: '心', strokes: 4 },
  '手': { pinyin: 'shǒu', radical: '手', strokes: 4 },
  '眼': { pinyin: 'yǎn', radical: '目', strokes: 11 },
  '睛': { pinyin: 'jīng', radical: '目', strokes: 13 },
  '看': { pinyin: 'kàn', radical: '目', strokes: 9 },
  '听': { pinyin: 'tīng', radical: '口', strokes: 7 },
  '说': { pinyin: 'shuō', radical: '讠', strokes: 9 },
  '走': { pinyin: 'zǒu', radical: '走', strokes: 7 },
  '跑': { pinyin: 'pǎo', radical: '⻊', strokes: 12 },
  '跳': { pinyin: 'tiào', radical: '⻊', strokes: 13 },
  '飞': { pinyin: 'fēi', radical: '飞', strokes: 3 },
  '美': { pinyin: 'měi', radical: '羊', strokes: 9 },
  '丽': { pinyin: 'lì', radical: '一', strokes: 7 },
  '温': { pinyin: 'wēn', radical: '氵', strokes: 12 },
  '暖': { pinyin: 'nuǎn', radical: '日', strokes: 13 },
  '晴': { pinyin: 'qíng', radical: '日', strokes: 12 },
  '朗': { pinyin: 'lǎng', radical: '月', strokes: 10 },
  '热': { pinyin: 'rè', radical: '灬', strokes: 10 },
  '闹': { pinyin: 'nào', radical: '门', strokes: 8 },
  '认': { pinyin: 'rèn', radical: '讠', strokes: 4 },
  '真': { pinyin: 'zhēn', radical: '目', strokes: 10 },
  '努': { pinyin: 'nǔ', radical: '力', strokes: 7 },
  '力': { pinyin: 'lì', radical: '力', strokes: 2 },
  '知': { pinyin: 'zhī', radical: '矢', strokes: 8 },
  '识': { pinyin: 'shí', radical: '讠', strokes: 7 },
  '劳': { pinyin: 'láo', radical: '艹', strokes: 7 },
  '动': { pinyin: 'dòng', radical: '力', strokes: 6 },
  '爱': { pinyin: 'ài', radical: '爫', strokes: 10 },
  '护': { pinyin: 'hù', radical: '扌', strokes: 7 },
  '帮': { pinyin: 'bāng', radical: '巾', strokes: 9 },
  '助': { pinyin: 'zhù', radical: '力', strokes: 7 },
  '团': { pinyin: 'tuán', radical: '囗', strokes: 6 },
  '结': { pinyin: 'jié', radical: '纟', strokes: 9 },
};

export function inferCharacterDetails(chineseWord: string, pinyinInput?: string): CharacterDetail[] {
  const chars = Array.from(chineseWord);
  const pinyinTones = pinyinInput ? pinyinInput.trim().split(/\s+/) : [];

  return chars.map((char, idx) => {
    const known = CHAR_INFO_MAP[char];
    const pinyin = pinyinTones[idx] || known?.pinyin || '';
    const radical = known?.radical || '—';
    const strokes = known?.strokes || Math.max(3, (char.charCodeAt(0) % 12) + 2);

    return {
      char,
      pinyin,
      radical,
      strokes,
    };
  });
}
