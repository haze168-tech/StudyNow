import React, { useState } from 'react';
import { Search, Volume2, BookOpen, CheckCircle, Clock, Trash2 } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<VocabCategory | 'all'>('all');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');

  const filteredWords = allWords.filter((word) => {
    const matchesSearch =
      word.simplified.includes(searchTerm) ||
      word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.chineseMeaning.includes(searchTerm);

    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    const matchesSemester = selectedSemester === 'all' || word.semester === selectedSemester;

    return matchesSearch && matchesCategory && matchesSemester;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">二年级语文生字词典</h1>
          <p className="text-xs text-stone-500 mt-1">
            部编版小学二年级核心字词，含标准普通话读音、部首笔顺、语境例句
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索生字、拼音 (如: wen nuan) 或释义..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3 rounded-xl border border-stone-200">
        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-stone-500 mr-1">分类：</span>
          {Object.entries(CATEGORY_MAP).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as VocabCategory | 'all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-rose-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>

        {/* Semester Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-stone-500">学期：</span>
          {[
            { id: 'all', label: '全部' },
            { id: 1, label: '上册' },
            { id: 2, label: '下册' },
          ].map((sem) => (
            <button
              key={sem.id}
              onClick={() => setSelectedSemester(sem.id as number | 'all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedSemester === sem.id
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {sem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count Info */}
      <div className="text-xs text-stone-500 mb-4 flex items-center justify-between">
        <span>共找到 <strong className="text-stone-900 tabular-nums">{filteredWords.length}</strong> 个生字词汇</span>
        <span>已掌握：<strong className="text-emerald-600 tabular-nums">{student.masteredWordIds.length}</strong> 个</span>
      </div>

      {/* Grid of Vocabulary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWords.map((word) => {
          const isMastered = student.masteredWordIds.includes(word.id);
          const isStruggling = student.strugglingWordIds.includes(word.id);

          return (
            <div
              key={word.id}
              className="bg-white rounded-xl p-5 border border-stone-200 hover:border-stone-300 transition-all flex flex-col justify-between"
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
                      <div className="text-sm font-bold text-rose-600">{word.pinyin}</div>
                      <div className="text-xs text-stone-500">{word.english}</div>
                    </div>
                  </div>

                  {/* Audio Pronunciation Button & Delete if custom */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundManager.speakChinese(word.simplified);
                      }}
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
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
                  {word.characters.map((ch, idx) => (
                    <div key={idx} className="bg-stone-50 px-2 py-0.5 rounded text-[11px]">
                      {ch.char}：部首【{ch.radical}】· {ch.strokes}画
                    </div>
                  ))}
                </div>

                {/* Meaning & Sentence */}
                <div className="mt-3 text-xs">
                  <div className="text-stone-700 leading-relaxed font-medium">
                    {word.chineseMeaning}
                  </div>
                  <div className="mt-2 text-stone-600 bg-amber-50/50 p-2 rounded border border-amber-100 text-[11px] leading-relaxed">
                    “{word.sentence}”
                  </div>
                </div>

                {/* Collocations */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {word.collocations.map((col, idx) => (
                    <span key={idx} className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                {/* Mastery status */}
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

                {/* Writing Canvas Link */}
                <button
                  onClick={() => onOpenWritingCanvas(word.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>田字格临摹</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
