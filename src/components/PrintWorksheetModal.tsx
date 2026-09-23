import React, { useState, useMemo } from 'react';
import { X, Printer, Layers, FileText } from 'lucide-react';
import { VocabCategory, VocabWord } from '../types';
import { VOCABULARY_LIST, CATEGORY_MAP, SHIZIBIAO_WORDS } from '../data/vocabulary';
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
  const [printMode, setPrintMode] = useState<'worksheet' | 'flashcards'>('flashcards');
  const [category, setCategory] = useState<VocabCategory | 'all'>('shizibiao');
  
  // Worksheet options
  const [includePinyinWrite, setIncludePinyinWrite] = useState(true);
  const [includeCloze, setIncludeCloze] = useState(true);
  const [includeCollocation, setIncludeCollocation] = useState(true);

  // Flashcards print options
  const [flashcardSheet, setFlashcardSheet] = useState<number>(1); // 1 to 16
  const [cardSide, setCardSide] = useState<'both' | 'front' | 'back'>('both');

  const allWords = words && words.length > 0 ? words : VOCABULARY_LIST;

  const sheets = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const sheetNum = i + 1;
      const startNum = i * 30 + 1;
      const endNum = Math.min(467, sheetNum * 30);
      return { sheetNum, startNum, endNum, label: `第${sheetNum}张 (序号 ${startNum}-${endNum})` };
    });
  }, []);

  // Filtered words for worksheet
  const filteredWorksheetWords = useMemo(() => {
    if (category === 'all') return allWords.slice(0, 16);
    return allWords.filter((w) => w.category === category).slice(0, 16);
  }, [allWords, category]);

  // Current sheet words for flashcards (30 words)
  const currentSheetWords = useMemo(() => {
    const start = (flashcardSheet - 1) * 30 + 1;
    const end = Math.min(467, flashcardSheet * 30);
    return SHIZIBIAO_WORDS.filter(
      (w) => w.cardNumber && w.cardNumber >= start && w.cardNumber <= end
    );
  }, [flashcardSheet]);

  // For the back side of 5x6 card sheet:
  // As specified in the PDF:
  // "每页 30 张，背面已左右镜像，长边翻转后正反对齐。"
  // In each row of 5 items: [0, 1, 2, 3, 4] -> mirrored back is [4, 3, 2, 1, 0]!
  const mirroredBackWords = useMemo(() => {
    const rows: VocabWord[][] = [];
    for (let r = 0; r < 6; r++) {
      const rowItems = currentSheetWords.slice(r * 5, (r + 1) * 5);
      // reverse row horizontally for duplex long-edge mirror alignment
      rows.push([...rowItems].reverse());
    }
    return rows.flat();
  }, [currentSheetWords]);

  if (!isOpen) return null;

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-stone-200">
        
        {/* Controls Bar (Hidden in Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900">打印二年级语文测评与教材生字卡</h2>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                A4 适配
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              支持一键双面打印教材 467 个生字字卡（5×6 规格，背面自动镜像对齐）与单元练习卷
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>立即调用打印机 (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Mode Selector Bar (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl mb-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700">打印类型：</span>
            <div className="flex items-center bg-white p-1 rounded-lg border border-stone-200">
              <button
                onClick={() => setPrintMode('flashcards')}
                className={`px-3 py-1 font-bold rounded-md flex items-center gap-1.5 cursor-pointer ${
                  printMode === 'flashcards'
                    ? 'bg-rose-600 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>识字表双面字卡 (5×6 每页30张)</span>
              </button>
              <button
                onClick={() => setPrintMode('worksheet')}
                className={`px-3 py-1 font-bold rounded-md flex items-center gap-1.5 cursor-pointer ${
                  printMode === 'worksheet'
                    ? 'bg-rose-600 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>单元生字测评与填空卷</span>
              </button>
            </div>
          </div>

          {/* Flashcards Sub-options */}
          {printMode === 'flashcards' ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-700">选择纸张：</span>
                <select
                  value={flashcardSheet}
                  onChange={(e) => setFlashcardSheet(Number(e.target.value))}
                  className="border border-stone-300 rounded px-2 py-1 bg-white font-medium"
                >
                  {sheets.map((s) => (
                    <option key={s.sheetNum} value={s.sheetNum}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-700">打印面：</span>
                <select
                  value={cardSide}
                  onChange={(e) => setCardSide(e.target.value as 'both' | 'front' | 'back')}
                  className="border border-stone-300 rounded px-2 py-1 bg-white font-medium"
                >
                  <option value="both">双面全打 (先正面再背面)</option>
                  <option value="front">仅打印正面（大字楷体）</option>
                  <option value="back">仅打印背面（拼音组词镜像）</option>
                </select>
              </div>
            </div>
          ) : (
            /* Worksheet Sub-options */
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-700">单元范围：</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VocabCategory | 'all')}
                  className="border border-stone-300 rounded px-2 py-1 bg-white font-medium"
                >
                  {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-1 cursor-pointer font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={includePinyinWrite}
                  onChange={(e) => setIncludePinyinWrite(e.target.checked)}
                />
                <span>看拼音写词语</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={includeCloze}
                  onChange={(e) => setIncludeCloze(e.target.checked)}
                />
                <span>选词填空</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={includeCollocation}
                  onChange={(e) => setIncludeCollocation(e.target.checked)}
                />
                <span>词语搭配</span>
              </label>
            </div>
          )}
        </div>

        {/* Informational Banner for Flashcards (From PDF Instructions) */}
        {printMode === 'flashcards' && (
          <div className="no-print mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>🖨️ 双面打印说明（对照原版设置）：</strong>
            <span>
              A4 纸张 · 打印设置务必选「双面打印」与「长边翻转」· 缩放选「实际大小 100%」。背面已左右镜像，裁切后正反对齐。沿虚线裁开即可得到正面大字、背面拼音组词的标准生字卡。
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FLASHCARDS PRINT PREVIEW & PRINTABLE AREA (5x6, 30 cards / sheet) */}
        {/* ========================================================================= */}
        {printMode === 'flashcards' && (
          <div className="space-y-8">
            {/* FRONT PAGE */}
            {(cardSide === 'both' || cardSide === 'front') && (
              <div className="bg-white p-4 border border-stone-300 rounded-lg print:border-none print:p-0 print:m-0 page-break">
                <div className="flex items-center justify-between text-xs text-stone-400 pb-1 mb-2 border-b border-dashed border-stone-200 print:text-black">
                  <span>二年级上册识字表生字 正面 · 第 {flashcardSheet}/16 张</span>
                  <span>双面打印请选「长边翻转」。沿虚线裁开。</span>
                </div>

                {/* 5 columns x 6 rows grid */}
                <div className="grid grid-cols-5 border border-dashed border-stone-400">
                  {currentSheetWords.map((word) => (
                    <div
                      key={`front-${word.id}`}
                      className="aspect-square flex items-center justify-center p-2 border border-dashed border-stone-300 relative"
                      style={{ minHeight: '110px' }}
                    >
                      <span className="text-4xl sm:text-5xl font-bold font-kai text-black">
                        {word.simplified}
                      </span>
                    </div>
                  ))}
                  {/* Fill empty slots up to 30 if sheet has fewer than 30 (e.g. Sheet 16 has 17) */}
                  {Array.from({ length: Math.max(0, 30 - currentSheetWords.length) }).map((_, idx) => (
                    <div
                      key={`front-empty-${idx}`}
                      className="aspect-square border border-dashed border-stone-200"
                      style={{ minHeight: '110px' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* BACK PAGE (Mirrored Horizontally for Duplex Long-Edge Alignment) */}
            {(cardSide === 'both' || cardSide === 'back') && (
              <div className="bg-white p-4 border border-stone-300 rounded-lg print:border-none print:p-0 print:m-0 page-break">
                <div className="flex items-center justify-between text-xs text-stone-400 pb-1 mb-2 border-b border-dashed border-stone-200 print:text-black">
                  <span>二年级上册识字表生字 背面 · 第 {flashcardSheet}/16 张</span>
                  <span>已水平左右镜像排版，长边翻转后与正面完全对齐。</span>
                </div>

                {/* 5 columns x 6 rows grid with mirrored cards */}
                <div className="grid grid-cols-5 border border-dashed border-stone-400">
                  {mirroredBackWords.map((word) => (
                    <div
                      key={`back-${word.id}`}
                      className="aspect-square flex flex-col justify-between p-2 border border-dashed border-stone-300 relative text-center"
                      style={{ minHeight: '110px' }}
                    >
                      {/* Top Row: Card Number on top left */}
                      <div className="text-left text-[11px] font-bold text-stone-400">
                        {word.cardNumber}
                      </div>

                      {/* Middle: Blue character and Red pinyin */}
                      <div>
                        <div className="text-2xl font-bold font-kai text-sky-700 print:text-black">
                          {word.simplified}
                        </div>
                        <div className="text-xs font-bold text-rose-600 print:text-black mt-0.5">
                          {word.pinyin}
                        </div>
                      </div>

                      {/* Bottom: Collocations (黑组词) */}
                      <div className="space-y-0.5 text-[11px] font-medium text-stone-900 pb-1">
                        {word.collocations.map((col, cIdx) => (
                          <div key={cIdx} className="leading-tight">
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Fill empty slots if sheet has fewer than 30 */}
                  {Array.from({ length: Math.max(0, 30 - mirroredBackWords.length) }).map((_, idx) => (
                    <div
                      key={`back-empty-${idx}`}
                      className="aspect-square border border-dashed border-stone-200"
                      style={{ minHeight: '110px' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKSHEET PRINT PREVIEW & PRINTABLE AREA */}
        {/* ========================================================================= */}
        {printMode === 'worksheet' && (
          <div className="bg-white p-6 sm:p-8 border border-stone-300 rounded-lg print:border-none print:p-0">
            {/* Paper Header */}
            <div className="text-center pb-4 border-b-2 border-stone-800">
              <h1 className="text-xl sm:text-2xl font-bold font-kai text-stone-900 tracking-wider">
                小学二年级语文生字词汇过关测评卷
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
                  <span>一、读拼音，在田字格中端正工整地写出对应的生字与词语。（共 40 分）</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {filteredWorksheetWords.slice(0, 8).map((word, idx) => (
                    <div key={idx} className="flex flex-col items-center p-2 border border-stone-200 rounded">
                      <div className="text-xs font-bold text-stone-800 font-sans mb-1.5 tracking-wide">
                        {word.pinyin}
                      </div>
                      {/* Tianzige boxes */}
                      <div className="flex items-center gap-1">
                        {word.simplified.length === 1 ? (
                          <div className="w-12 h-12 tianzige-box rounded-xs" />
                        ) : (
                          <>
                            <div className="w-11 h-11 tianzige-box rounded-xs" />
                            <div className="w-11 h-11 tianzige-box rounded-xs" />
                          </>
                        )}
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
                  {filteredWorksheetWords.slice(0, 6).map((w, idx) => (
                    <span key={idx}>【 {w.simplified} 】</span>
                  ))}
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-stone-800 pl-2">
                  {filteredWorksheetWords.slice(0, 5).map((w, idx) => (
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
                  三、生字词语拓展与积累运用。（共 30 分）
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-stone-800 pl-2">
                  {filteredWorksheetWords.slice(0, 6).map((w, idx) => (
                    <div key={idx} className="border-b border-dashed border-stone-200 pb-2">
                      <span className="font-bold mr-2">{idx + 1}.</span>
                      <span>给生字【<strong className="font-kai text-sm">{w.simplified}</strong>】组词：( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )、( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
