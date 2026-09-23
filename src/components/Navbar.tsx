import React from 'react';
import { Volume2, VolumeX, Printer, GraduationCap, User } from 'lucide-react';
import { Student } from '../types';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  activeTab: 'exercises' | 'canvas' | 'dictionary' | 'mistakes' | 'teacher';
  setActiveTab: (tab: 'exercises' | 'canvas' | 'dictionary' | 'mistakes' | 'teacher') => void;
  students: Student[];
  currentStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onOpenPrintModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  students,
  currentStudentId,
  onSelectStudent,
  onOpenPrintModal,
  soundEnabled,
  onToggleSound,
}) => {
  const currentStudent = students.find((s) => s.id === currentStudentId) || students[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('exercises')}
            className="text-left group flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              字
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-stone-900 group-hover:text-rose-600 transition-colors">
                汉字乐园
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-stone-500">
                二年级语文
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Text with active underlines) */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('exercises')}
            className={`py-1 text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'exercises'
                ? 'text-rose-600 font-semibold border-b-2 border-rose-600'
                : 'hover:text-stone-900'
            }`}
          >
            练习闯关
          </button>
          
          <button
            onClick={() => setActiveTab('canvas')}
            className={`py-1 text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'canvas'
                ? 'text-rose-600 font-semibold border-b-2 border-rose-600'
                : 'hover:text-stone-900'
            }`}
          >
            田字格写字
          </button>

          <button
            onClick={() => setActiveTab('dictionary')}
            className={`py-1 text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'dictionary'
                ? 'text-rose-600 font-semibold border-b-2 border-rose-600'
                : 'hover:text-stone-900'
            }`}
          >
            生字词典
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className={`py-1 text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'mistakes'
                ? 'text-rose-600 font-semibold border-b-2 border-rose-600'
                : 'hover:text-stone-900'
            }`}
          >
            错题本
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`py-1 text-xs sm:text-sm transition-colors relative whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'teacher'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>教师监控</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Student Switcher, Sound & Print) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? '静音' : '开启音效'}
            className="p-2 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-100 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>

          {/* Quick Print Worksheet */}
          <button
            onClick={onOpenPrintModal}
            title="打印生字练习单"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印字帖</span>
          </button>

          {/* Current Student Selector */}
          <div className="relative flex items-center gap-1.5 pl-2 border-l border-stone-200">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold border border-amber-300">
              {currentStudent?.name.slice(-2)}
            </div>
            <select
              value={currentStudentId}
              onChange={(e) => {
                soundManager.playClick();
                onSelectStudent(e.target.value);
              }}
              className="text-xs font-medium text-stone-800 bg-transparent py-1 pr-4 rounded focus:outline-none cursor-pointer max-w-[90px] sm:max-w-none"
              title="切换当前学生"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.classGroup})
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>
    </header>
  );
};
