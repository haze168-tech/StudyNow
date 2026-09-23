import React, { useState } from 'react';
import { Plus, X, Sparkles, BookOpen, Trash2, CheckCircle2 } from 'lucide-react';
import { VocabWord, VocabCategory } from '../types';
import { CATEGORY_MAP } from '../data/vocabulary';
import { inferCharacterDetails } from '../utils/charDb';
import { soundManager } from '../utils/audio';

interface AddCustomWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (word: VocabWord) => void;
  customWords: VocabWord[];
  onDeleteCustomWord: (wordId: string) => void;
}

export const AddCustomWordModal: React.FC<AddCustomWordModalProps> = ({
  isOpen,
  onClose,
  onAddWord,
  customWords,
  onDeleteCustomWord,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'list'>('create');

  // Form Fields
  const [simplified, setSimplified] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [category, setCategory] = useState<VocabCategory>('custom');
  const [chineseMeaning, setChineseMeaning] = useState('');
  const [english, setEnglish] = useState('');
  const [sentence, setSentence] = useState('');
  const [sentenceBlank, setSentenceBlank] = useState('');
  const [collocations, setCollocations] = useState('');
  const [semester, setSemester] = useState<1 | 2>(1);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Auto-generate sentence blank when sentence is typed
  const handleSentenceChange = (val: string) => {
    setSentence(val);
    if (simplified.trim() && val.includes(simplified.trim())) {
      setSentenceBlank(val.replaceAll(simplified.trim(), '______'));
    } else if (!sentenceBlank) {
      setSentenceBlank(val);
    }
  };

  const handleWordChange = (val: string) => {
    setSimplified(val);
    if (sentence.trim() && sentence.includes(val.trim())) {
      setSentenceBlank(sentence.replaceAll(val.trim(), '______'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = simplified.trim();
    if (!cleanWord) {
      setErrorMsg('请输入汉字生字/词语');
      return;
    }

    const cleanPinyin = pinyin.trim() || 'shēng zì';
    const pinyinTones = cleanPinyin.split(/\s+/);
    const chars = inferCharacterDetails(cleanWord, cleanPinyin);

    const generatedBlank =
      sentenceBlank.trim() ||
      (sentence.includes(cleanWord)
        ? sentence.replaceAll(cleanWord, '______')
        : `请在横线上填入【______】：${sentence}`);

    const newWord: VocabWord = {
      id: `custom-vocab-${Date.now()}`,
      simplified: cleanWord,
      pinyin: cleanPinyin,
      pinyinTones,
      characters: chars,
      english: english.trim() || cleanWord,
      chineseMeaning: chineseMeaning.trim() || `二年级课外补充生字【${cleanWord}】`,
      category,
      categoryName: CATEGORY_MAP[category]?.label || '老师自定',
      grade: 2,
      semester,
      sentence: sentence.trim() || `我们要认真学习生字【${cleanWord}】。`,
      sentenceBlank: generatedBlank,
      collocations: collocations
        .split(/[,，、\s]+/)
        .map((c) => c.trim())
        .filter(Boolean),
    };

    onAddWord(newWord);
    soundManager.playCorrect();

    // Reset Form
    setSimplified('');
    setPinyin('');
    setChineseMeaning('');
    setEnglish('');
    setSentence('');
    setSentenceBlank('');
    setCollocations('');
    setErrorMsg('');
    setActiveSubTab('list');
  };

  // Quick Preset Words for 2nd Grade
  const quickPresets = [
    { word: '认真', py: 'rèn zhēn', mean: '严肃对待，不马虎', sen: '上课时，同学们都在认真听讲。' },
    { word: '帮助', py: 'bāng zhù', mean: '替人出力、出主意或给予物质上的支援', sen: '同学之间应该互相帮助。' },
    { word: '美丽', py: 'měi lì', mean: '使人看了产生快感的；好看', sen: '公园里盛开着许多美丽的花朵。' },
    { word: '知识', py: 'zhī shí', mean: '人们在改造世界的实践中所获得的认识和经验的总和', sen: '书籍是人类进步的阶梯，里面有无穷的知识。' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                教师自定义生字词录入
              </h2>
              <p className="text-xs text-stone-500">
                录入的生字将同步进入全班生字词典、练习闯关题库、田字格描红与打印字帖
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: New Word vs Word List */}
        <div className="flex border-b border-stone-200 px-6 bg-white">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'create'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>录入新生字词</span>
          </button>

          <button
            onClick={() => setActiveSubTab('list')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'list'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>已录入生字库 ({customWords.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeSubTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  快速填入二年级常用字词范例：
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickPresets.map((p) => (
                    <button
                      key={p.word}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setSimplified(p.word);
                        setPinyin(p.py);
                        setChineseMeaning(p.mean);
                        setSentence(p.sen);
                        setSentenceBlank(p.sen.replaceAll(p.word, '______'));
                        setCategory('school');
                        setCollocations(`${p.word}好, 互相${p.word}`);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded text-indigo-800 text-xs font-medium transition-colors cursor-pointer"
                    >
                      + {p.word} ({p.py})
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Word & Pinyin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    生字或词语 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如：认真 / 温暖 / 燕子"
                    value={simplified}
                    onChange={(e) => handleWordChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    支持单字、双字或四字词语
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    标准拼音（含声调）<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如：rèn zhēn (空格隔开各字音)"
                    value={pinyin}
                    onChange={(e) => setPinyin(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    多音字请按具体语境带调填写
                  </span>
                </div>
              </div>

              {/* Category & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">归属单元分类：</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VocabCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="custom">✏️ 老师自定词库 (推荐)</option>
                    <option value="nature">🌸 自然四季</option>
                    <option value="animals">🐾 动物植物</option>
                    <option value="school">🎒 校园日常</option>
                    <option value="actions">🏃 动作情感</option>
                    <option value="wisdom">💡 哲理故事</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">学期学段：</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>二年级上册</option>
                    <option value={2}>二年级下册</option>
                  </select>
                </div>
              </div>

              {/* Chinese Meaning & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">词义释义（中文）：</label>
                  <input
                    type="text"
                    placeholder="如：态度严肃不马虎"
                    value={chineseMeaning}
                    onChange={(e) => setChineseMeaning(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">英文参考释义（选填）：</label>
                  <input
                    type="text"
                    placeholder="如：serious / conscientious"
                    value={english}
                    onChange={(e) => setEnglish(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Context Sentence & Fill-in Blank */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  教材语境例句（用于填空练习与字词理解）：
                </label>
                <input
                  type="text"
                  placeholder="如：上课时，同学们都在认真听讲。"
                  value={sentence}
                  onChange={(e) => handleSentenceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  选词填空挖空句（自动将生字替换为 ______）：
                </label>
                <input
                  type="text"
                  placeholder="如：上课时，同学们都在______听讲。"
                  value={sentenceBlank}
                  onChange={(e) => setSentenceBlank(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Collocations */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  常用搭配 / 词语积累（逗号隔开）：
                </label>
                <input
                  type="text"
                  placeholder="如：认真思考, 态度认真, 认真学习"
                  value={collocations}
                  onChange={(e) => setCollocations(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>确认录入题库</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              {customWords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-800">暂无教师自定生字</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    点击左上角“录入新生字词”，添加您想要学生掌握的教材课文生字或课外重点词汇。
                  </p>
                  <button
                    onClick={() => setActiveSubTab('create')}
                    className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    立即添加第一个生字
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-200">
                    <span>共录入 {customWords.length} 个自定义生字词：</span>
                    <span className="text-indigo-600 font-medium">即时同步至全班练习与测评</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customWords.map((word) => (
                      <div
                        key={word.id}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl relative group hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-stone-900 font-kai">
                                {word.simplified}
                              </span>
                              <span className="text-xs font-semibold text-rose-600">
                                {word.pinyin}
                              </span>
                            </div>
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-medium">
                              {word.categoryName}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              if (confirm(`确定删除生字【${word.simplified}】吗？`)) {
                                onDeleteCustomWord(word.id);
                                soundManager.playClick();
                              }
                            }}
                            title="删除该生字"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-2 text-[11px] text-stone-600 line-clamp-2">
                          “{word.sentence}”
                        </div>

                        {word.collocations.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {word.collocations.map((col, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-600"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
