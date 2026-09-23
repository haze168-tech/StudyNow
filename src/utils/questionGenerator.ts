import { VocabWord, QuizQuestion, ExerciseType, VocabCategory } from '../types';
import { VOCABULARY_LIST } from '../data/vocabulary';

// Shuffle utility
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuestionPool(
  category: VocabCategory | 'all',
  mode: 'all_mix' | 'context_fill' | 'listening' | 'pinyin_char' | 'word_formation',
  count: number = 10
): QuizQuestion[] {
  let pool = VOCABULARY_LIST;
  if (category !== 'all') {
    pool = VOCABULARY_LIST.filter((w) => w.category === category);
  }
  if (pool.length < 4) {
    pool = VOCABULARY_LIST;
  }

  const shuffledWords = shuffleArray(pool);
  const selectedWords = shuffledWords.slice(0, Math.min(count, shuffledWords.length));
  
  const questions: QuizQuestion[] = [];

  selectedWords.forEach((targetWord, index) => {
    // Determine question type based on mode
    let qType: ExerciseType;
    if (mode === 'context_fill') {
      qType = 'mc_context_fill';
    } else if (mode === 'listening') {
      qType = 'listen_and_choose';
    } else if (mode === 'pinyin_char') {
      qType = index % 2 === 0 ? 'mc_char_to_pinyin' : 'mc_pinyin_to_char';
    } else if (mode === 'word_formation') {
      qType = 'word_formation';
    } else {
      // all_mix: rotate through types
      const types: ExerciseType[] = ['mc_context_fill', 'mc_pinyin_to_char', 'listen_and_choose', 'mc_char_to_pinyin', 'word_formation'];
      qType = types[index % types.length];
    }

    // Pick 3 distractors
    const otherWords = VOCABULARY_LIST.filter((w) => w.id !== targetWord.id);
    const distractors = shuffleArray(otherWords).slice(0, 3);

    if (qType === 'mc_context_fill') {
      const options = shuffleArray([
        { id: `opt-correct`, text: targetWord.simplified, isCorrect: true },
        ...distractors.map((d, i) => ({ id: `opt-dist-${i}`, text: d.simplified, isCorrect: false })),
      ]);

      questions.push({
        id: `q-${index}-${targetWord.id}`,
        type: 'mc_context_fill',
        title: '选词填空',
        prompt: targetWord.sentenceBlank,
        subPrompt: `提示：${targetWord.chineseMeaning}`,
        audioText: targetWord.sentence.replace('______', targetWord.simplified),
        targetWord,
        options,
        explanation: `正确答案是【${targetWord.simplified}】(${targetWord.pinyin})。原句：“${targetWord.sentence}”。释义：${targetWord.chineseMeaning}。`,
      });
    } else if (qType === 'mc_pinyin_to_char') {
      const options = shuffleArray([
        { id: `opt-correct`, text: targetWord.simplified, isCorrect: true },
        ...distractors.map((d, i) => ({ id: `opt-dist-${i}`, text: d.simplified, isCorrect: false })),
      ]);

      questions.push({
        id: `q-${index}-${targetWord.id}`,
        type: 'mc_pinyin_to_char',
        title: '看拼音选词语',
        prompt: `拼音：【 ${targetWord.pinyin} 】`,
        subPrompt: `英文参考：${targetWord.english}`,
        audioText: targetWord.simplified,
        targetWord,
        options,
        explanation: `【${targetWord.simplified}】的读音是 "${targetWord.pinyin}"。例句：“${targetWord.sentence}”`,
      });
    } else if (qType === 'mc_char_to_pinyin') {
      // Create pinyin options
      const options = shuffleArray([
        { id: `opt-correct`, text: targetWord.pinyin, isCorrect: true },
        ...distractors.map((d, i) => ({ id: `opt-dist-${i}`, text: d.pinyin, isCorrect: false })),
      ]);

      questions.push({
        id: `q-${index}-${targetWord.id}`,
        type: 'mc_char_to_pinyin',
        title: '看生字选拼音',
        prompt: targetWord.simplified,
        subPrompt: '请选出正确的拼音和声调',
        audioText: targetWord.simplified,
        targetWord,
        options,
        explanation: `【${targetWord.simplified}】的正确拼音是 "${targetWord.pinyin}"。常用搭配：${targetWord.collocations.join('、')}。`,
      });
    } else if (qType === 'listen_and_choose') {
      const options = shuffleArray([
        { id: `opt-correct`, text: targetWord.simplified, pinyin: targetWord.pinyin, isCorrect: true },
        ...distractors.map((d, i) => ({ id: `opt-dist-${i}`, text: d.simplified, pinyin: d.pinyin, isCorrect: false })),
      ]);

      questions.push({
        id: `q-${index}-${targetWord.id}`,
        type: 'listen_and_choose',
        title: '听音辨词',
        prompt: '点击喇叭播放发音，选出你听到的词语',
        subPrompt: '仔细听声母、韵母和声调哦！',
        audioText: targetWord.simplified,
        targetWord,
        options,
        explanation: `你听到的是【${targetWord.simplified}】(${targetWord.pinyin})。意思是：${targetWord.chineseMeaning}。`,
      });
    } else {
      // word_formation: Split 2-character word, e.g. "温 [ ? ]" -> options: [暖, 凉, 冰, 冻]
      const char1 = targetWord.characters[0]?.char || targetWord.simplified[0];
      const char2 = targetWord.characters[1]?.char || targetWord.simplified[1];
      
      const wrongChars = distractors.map(d => d.simplified[1] || d.simplified[0]);
      const options = shuffleArray([
        { id: `opt-correct`, text: char2, isCorrect: true },
        ...wrongChars.map((wc, i) => ({ id: `opt-dist-${i}`, text: wc, isCorrect: false })),
      ]);

      questions.push({
        id: `q-${index}-${targetWord.id}`,
        type: 'word_formation',
        title: '生字组词探险',
        prompt: `${char1} + [ ? ] = 【 ${targetWord.simplified} 】`,
        subPrompt: `词义：${targetWord.chineseMeaning}`,
        audioText: targetWord.simplified,
        targetWord,
        options,
        explanation: `【${char1}】与【${char2}】组合成词语【${targetWord.simplified}】(${targetWord.pinyin})。`,
      });
    }
  });

  return questions;
}
