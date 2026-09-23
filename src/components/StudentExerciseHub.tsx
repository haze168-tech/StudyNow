import React, { useState } from 'react';
import { Sparkles, Play, Award, Flame, BookMarked, Headphones, PencilLine, Zap, CheckCircle2 } from 'lucide-react';
import { VocabCategory, Student, Assignment } from '../types';
import { CATEGORY_MAP, VOCABULARY_LIST } from '../data/vocabulary';
import { soundManager } from '../utils/audio';
import bannerImg from '../assets/images/chinese_vocab_learning_1790181208491.jpg';

interface StudentExerciseHubProps {
  student: Student;
  assignments: Assignment[];
  onStartQuiz: (category: VocabCategory | 'all', mode: 'all_mix' | 'context_fill' | 'listening' | 'pinyin_char' | 'word_formation', title: string, count: number) => void;
  onOpenWritingCanvas: (wordId?: string) => void;
}

export const StudentExerciseHub: React.FC<StudentExerciseHubProps> = ({
  student,
  assignments,
  onStartQuiz,
  onOpenWritingCanvas,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VocabCategory | 'all'>('all');

  const pendingAssignments = assignments.filter((a) => !a.completedStudentIds.includes(student.id));

  const exerciseModes = [
    {
      id: 'all_mix',
      title: '综合闯关练',
      subtitle: '拼音、组词、句意全方位测验',
      questionCount: 10,
      icon: Sparkles,
      color: 'from-rose-500 to-red-600',
      badge: '每日推荐',
    },
    {
      id: 'context_fill',
      title: '选词填空专项',
      subtitle: '结合课文例句，语境识词填空',
      questionCount: 8,
      icon: PencilLine,
      color: 'from-amber-500 to-orange-600',
      badge: '重难点',
    },
    {
      id: 'listening',
      title: '听音辨词专项',
      subtitle: '听纯正普通话发音，辨别声韵调',
      questionCount: 8,
      icon: Headphones,
      color: 'from-sky-500 to-blue-600',
      badge: '听力训练',
    },
    {
      id: 'pinyin_char',
      title: '拼音汉字配对',
      subtitle: '声母韵母声调对应，巩固拼音根基',
      questionCount: 10,
      icon: BookMarked,
      color: 'from-emerald-500 to-teal-600',
      badge: '拼音强化',
    },
    {
      id: 'word_formation',
      title: '生字组词探险',
      subtitle: '生字组合成词，拓展词汇运用',
      questionCount: 8,
      icon: Zap,
      color: 'from-purple-500 to-indigo-600',
      badge: '组词思维',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 p-6 sm:p-8 mb-8">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>人教部编版 · 小学二年级语文核心词汇库</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
              你好，{student.name}同学！今天也要快乐认字哦！
            </h1>
            <p className="text-sm text-stone-600 mt-2 max-w-xl leading-relaxed">
              实时即时反馈、声调朗读纠音、田字格书写练习。根据二年级教学进度精心编排，助你打牢字词基础！
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-lg">⭐</span>
                <div>
                  <div className="text-xs text-stone-500">已获星星</div>
                  <div className="text-sm font-bold text-stone-900 tabular-nums">{student.starsEarned} 颗</div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-stone-200 pl-4 sm:pl-6">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <div>
                  <div className="text-xs text-stone-500">连续打卡</div>
                  <div className="text-sm font-bold text-stone-900 tabular-nums">{student.streakDays} 天</div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-stone-200 pl-4 sm:pl-6">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs text-stone-500">已掌握生字词</div>
                  <div className="text-sm font-bold text-stone-900 tabular-nums">
                    {student.masteredWordIds.length} / {VOCABULARY_LIST.length} 个
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-stone-200 pl-4 sm:pl-6">
                <Award className="w-4 h-4 text-rose-600" />
                <div>
                  <div className="text-xs text-stone-500">平均准确率</div>
                  <div className="text-sm font-bold text-rose-600 tabular-nums">{student.averageScore}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual card */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative rounded-xl overflow-hidden border border-rose-200/80 shadow-md max-w-xs w-full bg-white">
              <img
                src={bannerImg}
                alt="二年级生字学习与田字格字帖"
                className="w-full h-44 object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback container
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="p-3 bg-white text-center">
                <span className="text-xs font-bold text-stone-800">
                  二年级字词闯关乐园
                </span>
                <span className="block text-[11px] text-stone-500 mt-0.5">
                  部首笔顺 · 拼音音调 · 语境造句
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Teacher Assignments Alert */}
      {pendingAssignments.length > 0 && (
        <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
              <h3 className="text-sm font-bold text-indigo-900">
                老师布置了新作业（待完成 {pendingAssignments.length} 项）
              </h3>
            </div>
            <span className="text-xs text-indigo-600">二年级语文教研组</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingAssignments.map((a) => (
              <div
                key={a.id}
                className="bg-white p-3.5 rounded-lg border border-indigo-100 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-stone-900">{a.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    题量：{a.questionCount} 题 · 截止时间：{a.dueDate}
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onStartQuiz(a.category, 'all_mix', a.title, a.questionCount);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>去完成</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-stone-900">选择练习单元</h2>
          <span className="text-xs text-stone-500">
            当前所选：{CATEGORY_MAP[selectedCategory]?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {Object.entries(CATEGORY_MAP).map(([catKey, info]) => {
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedCategory(catKey as VocabCategory | 'all');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
                    : 'bg-white border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="text-xl mb-1">{info.icon}</div>
                <div className={`text-xs font-bold ${isSelected ? 'text-rose-700' : 'text-stone-800'}`}>
                  {info.label}
                </div>
                <div className="text-[11px] text-stone-500 truncate">{info.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Modes Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">选择挑战模式</h2>
          <button
            onClick={() => onOpenWritingCanvas()}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
          >
            想练字？去田字格描红 &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exerciseModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className="bg-white rounded-xl p-5 border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-rose-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      {mode.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900">{mode.title}</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{mode.subtitle}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-stone-500 tabular-nums">
                    {mode.questionCount} 道精选题
                  </span>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onStartQuiz(
                        selectedCategory,
                        mode.id as 'all_mix' | 'context_fill' | 'listening' | 'pinyin_char' | 'word_formation',
                        `${CATEGORY_MAP[selectedCategory]?.label} · ${mode.title}`,
                        mode.questionCount
                      );
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>开始闯关</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
