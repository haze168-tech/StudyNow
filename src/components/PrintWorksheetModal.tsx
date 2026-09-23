import React, { useState } from 'react';
import { X, Printer, CheckSquare } from 'lucide-react';
import { VocabCategory } from '../types';
import { VOCABULARY_LIST, CATEGORY_MAP } from '../data/vocabulary';
import { soundManager } from '../utils/audio';

interface PrintWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  words?: VocabWord[];
}

export const PrintWorksheetModal: React.FC<PrintWorksheetModalProps> = ({
  isOpen,
  onClose,
  words,
}) => {
  const [category, setCategory] = useState<VocabCategory | 'all'>('all');
  const [includePinyinWrite, setIncludePinyinWrite] = useState(true);
  const [includeCloze, setIncludeCloze] = useState(true);
  const [includeCollocation, setIncludeCollocation] = useState(true);

  if (!isOpen) return null;

  const allWords = words && words.length > 0 ? words : VOCABULARY_LIST;

  const filteredWords =
    category === 'all'
      ? allWords.slice(0, 16)
      : allWords.filter((w) => w.category === category).slice(0, 16);

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200">
        
        {/* Controls Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-bold text-stone-900">打印二年级语文测验与生字练习单</h2>
            <p className="text-xs text-stone-500">
              包含规范田字格、拼音写词、语境填空，支持直接调用打印机输出 A4 纸张
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>立即打印 (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Row (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center gap-4 bg-stone-50 p-3 rounded-xl mb-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">单元范围：</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VocabCategory | 'all')}
              className="border border-stone-300 rounded px-2 py-1 bg-white"
            >
              {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
            <input
              type="checkbox"
              checked={includePinyinWrite}
              onChange={(e) => setIncludePinyinWrite(e.target.checked)}
            />
            <span>看拼音写词语（田字格）</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
            <input
              type="checkbox"
              checked={includeCloze}
              onChange={(e) => setIncludeCloze(e.target.checked)}
            />
            <span>选词填空练习</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
            <input
              type="checkbox"
              checked={includeCollocation}
              onChange={(e) => setIncludeCollocation(e.target.checked)}
            />
            <span>词语搭配连线</span>
          </label>
        </div>

        {/* Printable Paper Area (A4 layout format) */}
        <div className="bg-white p-6 sm:p-8 border border-stone-300 rounded-lg print:border-none print:p-0">
          
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-stone-800">
            <h1 className="text-xl sm:text-2xl font-bold font-kai text-stone-900 tracking-wider">
              小学二年级语文核心生字词汇过关测评卷
            </h1>
            <div className="text-xs text-stone-600 mt-2 flex items-center justify-center gap-6">
              <span>考查范围：{CATEGORY_MAP[category]?.label || '全册核心词汇'}</span>
              <span>考试时间：40分钟</span>
              <span>满分：100分</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-700 mt-4 px-8 font-medium">
              <span>班级：___________</span>
              <span>姓名：___________</span>
              <span>学号：___________</span>
              <span>得分：___________</span>
            </div>
          </div>

          {/* Section 1: 看拼音写词语 (田字格) */}
          {includePinyinWrite && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span>一、读拼音，在田字格中端正工整地写出对应的词语。（共 40 分）</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filteredWords.slice(0, 8).map((word, idx) => (
                  <div key={idx} className="flex flex-col items-center p-2 border border-stone-200 rounded">
                    <div className="text-xs font-bold text-stone-800 font-sans mb-1.5 tracking-wide">
                      {word.pinyin}
                    </div>
                    {/* Double Tianzige boxes for 2 characters */}
                    <div className="flex items-center gap-1">
                      <div className="w-11 h-11 tianzige-box rounded-xs" />
                      <div className="w-11 h-11 tianzige-box rounded-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: 选词填空 */}
          {includeCloze && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-stone-900 mb-3">
                二、请根据句子语境，选出最恰当的词语填在横线上。（共 30 分）
              </h3>
              
              {/* Word Bank */}
              <div className="bg-stone-50 p-2.5 rounded border border-stone-200 text-xs text-center font-kai font-bold mb-3 flex flex-wrap items-center justify-center gap-4">
                {filteredWords.slice(0, 6).map((w, idx) => (
                  <span key={idx}>【 {w.simplified} 】</span>
                ))}
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-stone-800 pl-2">
                {filteredWords.slice(0, 5).map((w, idx) => (
                  <div key={idx} className="flex items-baseline gap-2">
                    <span className="font-bold">{idx + 1}.</span>
                    <span>{w.sentenceBlank}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: 词语搭配 */}
          {includeCollocation && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-stone-900 mb-3">
                三、读一读，连一连（常见词语搭配与反义词辨析）。（共 30 分）
              </h3>

              <div className="grid grid-cols-2 gap-8 text-xs px-4">
                <div className="space-y-2">
                  <div className="font-semibold text-stone-500 mb-1">【词语搭配】</div>
                  {filteredWords.slice(0, 4).map((w, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-dashed border-stone-200">
                      <span>{w.simplified}的</span>
                      <span className="text-stone-400">┈┈┈┈┈┈┈┈</span>
                      <span>{w.collocations[0]?.replace(w.simplified, '') || '景象'}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-stone-500 mb-1">【反义词配对】</div>
                  {[
                    { a: '温暖', b: '寒冷' },
                    { a: '容易', b: '困难' },
                    { a: '认真', b: '马虎' },
                    { a: '保护', b: '破坏' },
                  ].map((pair, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-dashed border-stone-200">
                      <span className="font-kai font-bold">{pair.a}</span>
                      <span className="text-stone-400">┈┈ 对 ┈┈</span>
                      <span className="font-kai font-bold">{pair.b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Teacher Signature */}
          <div className="mt-12 pt-4 border-t border-stone-300 flex justify-between text-xs text-stone-500">
            <span>教师批改评语：_____________________________________________________</span>
            <span>家长签字：_____________</span>
          </div>

        </div>

      </div>
    </div>
  );
};
