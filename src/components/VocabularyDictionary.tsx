import React, { useState, useMemo } from 'react';
import { Search, Volume2, BookOpen, CheckCircle, Clock, Trash2, Layers, RotateCw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { VocabWord, VocabCategory, Student } from '../types';
import { VOCABULARY_LIST, CATEGORY_MAP } from '../data/vocabulary';
import { soundManager } from '../utils/audio';

interface VocabularyDictionaryProps {
  student: Student;
  onOpenWritingCanvas: (wordId: string) => void;
  words?: VocabWord[];
  onDeleteWord?: (wordId: string) => void;
}

export const VocabularyDictionary: React.FC<VocabularyDictionaryProps> = ({
  student,
  onOpenWritingCanvas,
  words,
  onDeleteWord,
}) => {
  const allWords = words && words.length > 0 ? words : VOCABULARY_LIST;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VocabCategory | 'all'>('shizibiao');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [selectedSheet, setSelectedSheet] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'dictionary' | 'flashcards'>('flashcards');
  
  // Track flipped state for flashcards by wordId
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30; // 30 cards per page matching the PDF's 30 cards/sheet (5x6)

  // 16 Sheets in the PDF (each 30 cards, 16th sheet has 17 cards: 451-467)
  const sheets = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const sheetNum = i + 1;
      const startNum = i * 30 + 1;
      const endNum = Math.min(467, sheetNum * 30);
      return { sheetNum, startNum, endNum, label: `第${sheetNum}张 (${startNum}-${endNum})` };
    });
  }, []);

  const toggleFlip = (wordId: string) => {
    soundManager.playClick();
    setFlippedCards((prev) => ({ ...prev, [wordId]: !prev[wordId] }));
  };

  const filteredWords = useMemo(() => {
    return allWords.filter((word) => {
      const matchesSearch =
        word.simplified.includes(searchTerm) ||
        word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.chineseMeaning.includes(searchTerm) ||
        (word.collocations && word.collocations.some((c) => c.includes(searchTerm))) ||
        (word.cardNumber && word.cardNumber.toString() === searchTerm.trim());

      const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
      const matchesSemester = selectedSemester === 'all' || word.semester === selectedSemester;

      let matchesSheet = true;
      if (selectedCategory === 'shizibiao' && selectedSheet !== 'all' && word.cardNumber) {
        const start = (selectedSheet - 1) * 30 + 1;
        const end = Math.min(467, selectedSheet * 30);
        matchesSheet = word.cardNumber >= start && word.cardNumber <= end;
      }

      return matchesSearch && matchesCategory && matchesSemester && matchesSheet;
    });
  }, [allWords, searchTerm, selectedCategory, selectedSemester, selectedSheet]);

  // Reset to page 1 on filter changes
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / pageSize));
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWords.slice(start, start + pageSize);
  }, [filteredWords, currentPage]);

  const handleCategoryChange = (cat: VocabCategory | 'all') => {
    soundManager.playClick();
    setSelectedCategory(cat);
    setSelectedSheet('all');
    setCurrentPage(1);
  };

  const handleSheetChange = (sheet: number | 'all') => {
    soundManager.playClick();
    setSelectedSheet(sheet);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">二年级语文生字词典与字卡库</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 rounded-full">
              467 识字表全收录
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            收录部编版二年级上册《识字表》全册 1-467 号生字卡片，支持字卡双面翻转、标准拼音发音、田字格临摹与多单元检索
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索生字、序号(如: 1)、拼音或组词..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
          />
        </div>
      </div>

      {/* Filter Tabs & Mode Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs mb-6 space-y-3">
        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-stone-700 mr-1">分类范围：</span>
            {Object.entries(CATEGORY_MAP).map(([key, info]) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key as VocabCategory | 'all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
            <button
              onClick={() => {
                soundManager.playClick();
                setViewMode('flashcards');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'flashcards'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>双面字卡模式</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setViewMode('dictionary');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'dictionary'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>词典详解模式</span>
            </button>
          </div>
        </div>

        {/* Sub-Filter for Shizibiao Sheets (16 sheets, 30 cards each) */}
        {selectedCategory === 'shizibiao' && (
          <div className="pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-rose-800 shrink-0">📄 课本字卡纸张：</span>
            <button
              onClick={() => handleSheetChange('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                selectedSheet === 'all'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              全部467字
            </button>
            {sheets.map((s) => (
              <button
                key={s.sheetNum}
                onClick={() => handleSheetChange(s.sheetNum)}
                className={`px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                  selectedSheet === s.sheetNum
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
                title={`第${s.sheetNum}张卡纸：序号 ${s.startNum} - ${s.endNum}`}
              >
                第{s.sheetNum}张
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Count & Pagination Header */}
      <div className="text-xs text-stone-500 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>共找到 <strong className="text-stone-900 tabular-nums">{filteredWords.length}</strong> 个生字</span>
          <span>已掌握：<strong className="text-emerald-600 tabular-nums">{student.masteredWordIds.length}</strong> 个</span>
          {viewMode === 'flashcards' && (
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              💡 提示：点击任意字卡或“翻转”可查看背面拼音与组词
            </span>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              disabled={currentPage === 1}
              className="p-1 rounded bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              title="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-stone-700 tabular-nums">
              第 {currentPage} / {totalPages} 页
            </span>
            <button
              onClick={() => {
                soundManager.playClick();
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              title="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* FLASHCARD MODE (Simulating the Double-sided Print Cards) */}
      {viewMode === 'flashcards' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
          {paginatedWords.map((word) => {
            const isFlipped = !!flippedCards[word.id];
            const isMastered = student.masteredWordIds.includes(word.id);

            return (
              <div
                key={word.id}
                className="relative bg-white rounded-xl border-2 border-stone-200 hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                onClick={() => toggleFlip(word.id)}
              >
                {/* Top Badge: Card Number from PDF */}
                <div className="flex items-center justify-between px-2.5 pt-2 text-[11px]">
                  <span className="font-mono font-bold text-stone-400 group-hover:text-rose-600">
                    {word.cardNumber ? `#${word.cardNumber}` : '字卡'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isMastered && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.speakChinese(word.simplified);
                      }}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                      title="发音"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Content: Front vs Back */}
                {!isFlipped ? (
                  /* FRONT OF CARD: Big character in Tianzige (楷体大字) */
                  <div className="py-4 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 tianzige-box flex items-center justify-center rounded-lg shadow-inner bg-stone-50">
                      <span className="text-4xl sm:text-5xl font-bold font-kai text-stone-900">
                        {word.simplified}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                      <RotateCw className="w-3 h-3" /> 点击看拼音组词
                    </span>
                  </div>
                ) : (
                  /* BACK OF CARD: Mirror layout from PDF: Blue character, Red pinyin, Black collocations */
                  <div className="py-2.5 px-3 flex flex-col items-center justify-center bg-rose-50/40 min-h-[130px]">
                    {/* Blue character */}
                    <div className="text-2xl font-bold font-kai text-sky-700">
                      {word.simplified}
                    </div>
                    {/* Red pinyin */}
                    <div className="text-xs font-bold text-rose-600 mt-0.5 tracking-wider">
                      {word.pinyin}
                    </div>
                    {/* Black collocations */}
                    <div className="mt-2 space-y-0.5 text-center">
                      {word.collocations.map((col, cIdx) => (
                        <div key={cIdx} className="text-xs font-semibold text-stone-800">
                          {col}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                      <RotateCw className="w-3 h-3" /> 点击返回正面
                    </span>
                  </div>
                )}

                {/* Bottom Bar: Quick Practice Link */}
                <div className="px-2.5 py-1.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400 truncate text-[10px]">
                    {word.categoryName || '二年级'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWritingCanvas(word.id);
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 text-[11px]"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>写字</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DICTIONARY VIEW (Detailed with strokes, radicals, sentences) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedWords.map((word) => {
            const isMastered = student.masteredWordIds.includes(word.id);
            const isStruggling = student.strugglingWordIds.includes(word.id);

            return (
              <div
                key={word.id}
                className="bg-white rounded-xl p-4.5 border border-stone-200 hover:border-stone-300 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Tianzige Word Display */}
                      <div className="flex items-center gap-1">
                        {word.simplified.split('').map((char, cIdx) => (
                          <div
                            key={cIdx}
                            className="w-12 h-12 tianzige-box flex items-center justify-center rounded text-2xl font-bold font-kai text-stone-900 shadow-xs"
                          >
                            {char}
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-rose-600">{word.pinyin}</span>
                          {word.cardNumber && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                              #{word.cardNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">{word.english}</div>
                      </div>
                    </div>

                    {/* Audio Pronunciation Button & Delete if custom */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => soundManager.speakChinese(word.simplified)}
                        className="p-2 text-stone-600 hover:text-rose-600 bg-stone-50 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="播放发音"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      {word.id.startsWith('custom-vocab-') && onDeleteWord && (
                        <button
                          onClick={() => {
                            if (confirm(`确定删除自定义生字【${word.simplified}】吗？`)) {
                              onDeleteWord(word.id);
                              soundManager.playClick();
                            }
                          }}
                          className="p-2 text-stone-400 hover:text-rose-600 bg-stone-50 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="删除自定义生字"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Radicals & Stroke Info */}
                  <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-stone-100 text-xs text-stone-500">
                    {word.characters.map((ch, idx) => (
                      <div key={idx} className="bg-stone-50 px-2 py-0.5 rounded text-[11px]">
                        {ch.char}：部首【{ch.radical}】· {ch.strokes}画
                      </div>
                    ))}
                  </div>

                  {/* Meaning & Sentence */}
                  <div className="mt-2.5 text-xs">
                    <div className="text-stone-700 leading-relaxed font-medium">
                      {word.chineseMeaning}
                    </div>
                    {word.sentence && (
                      <div className="mt-2 text-stone-600 bg-amber-50/60 p-2 rounded border border-amber-100 text-[11px] leading-relaxed">
                        “{word.sentence}”
                      </div>
                    )}
                  </div>

                  {/* Collocations */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {word.collocations.map((col, idx) => (
                      <span key={idx} className="text-[11px] bg-rose-50 font-medium text-rose-800 border border-rose-100 px-2 py-0.5 rounded-md">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    {isMastered ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        已掌握
                      </span>
                    ) : isStruggling ? (
                      <span className="text-rose-600 font-medium">
                        ⚠️ 需重点巩固
                      </span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        练习中
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenWritingCanvas(word.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>田字格临摹</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs">
          <button
            onClick={() => {
              soundManager.playClick();
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
          >
            上一页
          </button>
          <span className="px-3 py-1.5 font-bold text-stone-800 tabular-nums">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          <button
            onClick={() => {
              soundManager.playClick();
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};
