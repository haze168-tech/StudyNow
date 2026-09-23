import React from 'react';
import { Volume2, BookOpen, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { VOCABULARY_LIST } from '../data/vocabulary';
import { soundManager } from '../utils/audio';

interface MistakeReviewProps {
  student: Student;
  onRetestMistakes: () => void;
  onOpenWritingCanvas: (wordId: string) => void;
}

export const MistakeReview: React.FC<MistakeReviewProps> = ({
  student,
  onRetestMistakes,
  onOpenWritingCanvas,
}) => {
  // Aggregate all mistakes across recent results + struggling words
  const allMistakes = student.recentResults.flatMap((r) => r.mistakes);

  const strugglingWords = VOCABULARY_LIST.filter((w) =>
    student.strugglingWordIds.includes(w.id)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-xl border border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span>{student.name}同学的错题巩固本</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            智能汇总测试过程中的薄弱题型与易混字词，查漏补缺助你攻克难关！
          </p>
        </div>

        {allMistakes.length > 0 || strugglingWords.length > 0 ? (
          <button
            onClick={onRetestMistakes}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>错题重练测验</span>
          </button>
        ) : null}
      </div>

      {/* Struggling Vocabulary Focus Area */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>重点关注词汇（{strugglingWords.length} 个）</span>
        </h2>

        {strugglingWords.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>暂无重点预警词汇，掌握情况非常优异！</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {strugglingWords.map((word) => (
              <div
                key={word.id}
                className="bg-white p-4 rounded-xl border border-rose-100 hover:border-rose-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold font-kai text-stone-900">
                    {word.simplified}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => soundManager.speakChinese(word.simplified)}
                      className="p-1 text-stone-500 hover:text-rose-600 rounded"
                      title="朗读"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenWritingCanvas(word.id)}
                      className="p-1 text-stone-500 hover:text-rose-600 rounded"
                      title="练写"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-rose-600 font-semibold">{word.pinyin}</div>
                <div className="text-xs text-stone-600 mt-1 line-clamp-1">{word.chineseMeaning}</div>
                <div className="text-[11px] text-stone-400 mt-2">
                  例句：“{word.sentence}”
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Mistakes Log */}
      <div>
        <h2 className="text-sm font-bold text-stone-800 mb-3">
          最近测试错题记录（共 {allMistakes.length} 道）
        </h2>

        {allMistakes.length === 0 ? (
          <div className="bg-white border border-stone-200 p-8 rounded-xl text-center text-xs text-stone-500">
            <p className="text-base font-bold text-stone-800 mb-1">🎉 错题本干干净净！</p>
            <p>最近的测试全部正确或尚未开始测试，继续保持！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-stone-900 font-kai">
                      【{mistake.word}】
                    </span>
                    <span className="text-xs font-semibold text-rose-600">{mistake.pinyin}</span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs font-medium text-stone-500">{mistake.questionType}</span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-400 tabular-nums">{mistake.timestamp}</span>
                  </div>

                  <p className="text-xs text-stone-700">{mistake.questionPrompt}</p>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <span className="text-rose-600 font-medium">
                      同学选了：<del>{mistake.userAnswer}</del>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      正确答案：{mistake.correctAnswer}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => soundManager.speakChinese(mistake.word)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>听发音</span>
                  </button>
                  <button
                    onClick={() => {
                      const matched = VOCABULARY_LIST.find((w) => w.simplified === mistake.word);
                      if (matched) {
                        onOpenWritingCanvas(matched.id);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>去描红</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
