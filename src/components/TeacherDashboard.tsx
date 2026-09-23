import React, { useState } from 'react';
import { 
  Users, BarChart3, AlertTriangle, BookCheck, Plus, Download, Printer, 
  Search, Eye, CheckCircle2, ChevronRight, X, FileText, Send 
} from 'lucide-react';
import { Student, Assignment, VocabCategory } from '../types';
import { VOCABULARY_LIST, CATEGORY_MAP } from '../data/vocabulary';
import { soundManager } from '../utils/audio';

interface TeacherDashboardProps {
  students: Student[];
  assignments: Assignment[];
  onAddStudent: (newStudent: Omit<Student, 'id' | 'recentResults' | 'masteredWordIds' | 'strugglingWordIds'>) => void;
  onCreateAssignment: (assignment: Omit<Assignment, 'id' | 'completedStudentIds'>) => void;
  onSelectStudentForPractice: (studentId: string) => void;
  onOpenPrintModal: () => void;
  onStartRemedialQuizForWord: (wordId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  assignments,
  onAddStudent,
  onCreateAssignment,
  onSelectStudentForPractice,
  onOpenPrintModal,
  onStartRemedialQuizForWord,
}) => {
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  
  // New Student Modal state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'boy' | 'girl'>('boy');
  const [newStudentClass, setNewStudentClass] = useState('二年级一班');

  // New Assignment Modal state
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignCategory, setAssignCategory] = useState<VocabCategory | 'all'>('all');
  const [assignCount, setAssignCount] = useState(10);
  const [assignDueDate, setAssignDueDate] = useState('2026-09-30');

  // Teacher Notes map
  const [teacherNotes, setTeacherNotes] = useState<Record<string, string>>({
    'student-3': '拼音二声与三声仍易混淆，建议多在早读开展带调朗读训练。',
    'student-5': '对抽象词语（如困难、坚持）理解偏弱，建议联系日常生活场景进行造句互动。',
  });

  // Calculate overall class metrics
  const totalStudents = students.length;
  const totalQuizzes = students.reduce((sum, s) => sum + s.totalQuizzesTaken, 0);
  const classAvgScore = Math.round(
    students.reduce((sum, s) => sum + s.averageScore, 0) / (totalStudents || 1)
  );

  // Category mastery breakdown
  const categoryMastery: Record<string, { totalWords: number; masteredCount: number }> = {};
  VOCABULARY_LIST.forEach((w) => {
    if (!categoryMastery[w.category]) {
      categoryMastery[w.category] = { totalWords: 0, masteredCount: 0 };
    }
    categoryMastery[w.category].totalWords += 1;
    
    // Check how many students have mastered this word
    const studentsMastered = students.filter((s) => s.masteredWordIds.includes(w.id)).length;
    categoryMastery[w.category].masteredCount += studentsMastered;
  });

  // Top class struggling words (Frequency of appearing in strugglingWordIds or mistakes)
  const wordErrorFrequency: Record<string, number> = {};
  students.forEach((s) => {
    s.strugglingWordIds.forEach((wId) => {
      wordErrorFrequency[wId] = (wordErrorFrequency[wId] || 0) + 1;
    });
    s.recentResults.forEach((r) => {
      r.mistakes.forEach((m) => {
        wordErrorFrequency[m.wordId] = (wordErrorFrequency[m.wordId] || 0) + 1;
      });
    });
  });

  const topStrugglingWords = Object.entries(wordErrorFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([wId, count]) => ({
      word: VOCABULARY_LIST.find((w) => w.id === wId) || VOCABULARY_LIST[0],
      count,
    }));

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.includes(studentSearch) || s.classGroup.includes(studentSearch);
    let matchesPerf = true;
    if (performanceFilter === 'high') matchesPerf = s.averageScore >= 90;
    if (performanceFilter === 'mid') matchesPerf = s.averageScore >= 75 && s.averageScore < 90;
    if (performanceFilter === 'low') matchesPerf = s.averageScore < 75;
    return matchesSearch && matchesPerf;
  });

  const handleExportCSV = () => {
    soundManager.playClick();
    const headers = ['学号', '姓名', '班级', '测试次数', '平均准确率(%)', '连续打卡天数', '星星数', '已掌握字数', '薄弱字数'];
    const rows = students.map((s) => [
      s.id,
      s.name,
      s.classGroup,
      s.totalQuizzesTaken,
      s.averageScore,
      s.streakDays,
      s.starsEarned,
      s.masteredWordIds.length,
      s.strugglingWordIds.length,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `二年级语文成绩汇总表_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h1 className="text-2xl font-bold text-stone-900">二年级语文教研与学情监控中心</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            监控全班测试动态、分析薄弱词汇频次、发布分层作业、导出学业测评报告
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              soundManager.playClick();
              setIsNewAssignmentOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发布新作业</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setIsAddStudentOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加学生</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印测验纸</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出CSV</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>在册学生人数</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-stone-900 mt-2 tabular-nums">
            {totalStudents} <span className="text-sm font-normal text-stone-500">人</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-medium">全员建档跟踪</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>全班平均准确率</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-stone-900 mt-2 tabular-nums">
            {classAvgScore}%
          </div>
          <div className="text-[11px] text-stone-500 mt-2">
            优秀率：{Math.round((students.filter((s) => s.averageScore >= 85).length / totalStudents) * 100)}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>累计完成测验</span>
            <BookCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-stone-900 mt-2 tabular-nums">
            {totalQuizzes} <span className="text-sm font-normal text-stone-500">次</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-2">人均完成 {Math.round(totalQuizzes / totalStudents)} 次练习</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>需重点关注生字</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-rose-600 mt-2 tabular-nums">
            {topStrugglingWords.length} <span className="text-sm font-normal text-stone-500">个</span>
          </div>
          <div className="text-[11px] text-rose-600 mt-2">错误频次最高：【{topStrugglingWords[0]?.word.simplified || '无'}】</div>
        </div>
      </div>

      {/* Middle Zone: Category Mastery Progress & Class Struggling Words Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left: Category Mastery Bar Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200">
          <h2 className="text-base font-bold text-stone-900 mb-1">各单元核心生字词掌握率</h2>
          <p className="text-xs text-stone-500 mb-6">全班学生在各识字主题单元下的平均掌握度对比</p>

          <div className="space-y-4">
            {Object.entries(categoryMastery).map(([catKey, data]) => {
              const info = CATEGORY_MAP[catKey] || { label: catKey, icon: '📖' };
              const maxPossible = data.totalWords * totalStudents;
              const percent = maxPossible > 0 ? Math.round((data.masteredCount / maxPossible) * 100) : 0;

              return (
                <div key={catKey}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-stone-800">
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                      <span className="text-[11px] font-normal text-stone-400">
                        ({data.totalWords} 个核心词)
                      </span>
                    </span>
                    <span className="tabular-nums font-bold text-stone-900">{percent}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent >= 80 ? 'bg-emerald-500' : percent >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Class Struggling Words (错题排行榜) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-stone-900">班级高频易错词警示</h2>
              <span className="text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                需重点复习
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-4">按学生在测试中出错频次排序汇总</p>

            <div className="space-y-3">
              {topStrugglingWords.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-kai text-stone-900">
                          {item.word.simplified}
                        </span>
                        <span className="text-xs text-rose-600 font-semibold">{item.word.pinyin}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">{item.word.categoryName} · {item.word.english}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-rose-600 tabular-nums">
                      错题 {item.count} 次
                    </div>
                    <button
                      onClick={() => onStartRemedialQuizForWord(item.word.id)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline mt-0.5 block"
                    >
                      生成针对测验
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
            <span>💡 建议在晨读或语文生字课前集中抽测</span>
            <button
              onClick={onOpenPrintModal}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              打印易错字字帖 &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Student Roster Table & Diagnostics */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">全班学生学情花名册</h2>
            <p className="text-xs text-stone-500 mt-0.5">点击学生姓名可调出学情档案与错题明细</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索姓名..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
              />
            </div>

            {/* Performance Segment Filter */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs">
              {[
                { id: 'all', label: '全部' },
                { id: 'high', label: '优等 (≥90%)' },
                { id: 'mid', label: '良好 (75-89%)' },
                { id: 'low', label: '待提升 (<75%)' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setPerformanceFilter(tier.id as 'all' | 'high' | 'mid' | 'low')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    performanceFilter === tier.id
                      ? 'bg-white text-stone-900 font-bold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">学生姓名</th>
                <th className="py-3 px-4">班级</th>
                <th className="py-3 px-4">测试次数</th>
                <th className="py-3 px-4">平均准确率</th>
                <th className="py-3 px-4">掌握生字</th>
                <th className="py-3 px-4">薄弱生字</th>
                <th className="py-3 px-4">打卡天数</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-stone-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                      {s.name.slice(-2)}
                    </div>
                    <span>{s.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-500">{s.classGroup}</td>
                  <td className="py-3.5 px-4 tabular-nums">{s.totalQuizzesTaken} 次</td>
                  <td className="py-3.5 px-4 font-bold tabular-nums">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        s.averageScore >= 90
                          ? 'bg-emerald-50 text-emerald-700'
                          : s.averageScore >= 75
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {s.averageScore}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-emerald-700 font-medium">
                    {s.masteredWordIds.length} 个
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-rose-600 font-medium">
                    {s.strugglingWordIds.length} 个
                  </td>
                  <td className="py-3.5 px-4 tabular-nums">{s.streakDays} 天</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedStudentForDetail(s);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>学情诊断</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Deep Diagnostic Modal */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-base">
                  {selectedStudentForDetail.name.slice(-2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {selectedStudentForDetail.name} 的学情诊断报告
                  </h3>
                  <div className="text-xs text-stone-500">
                    {selectedStudentForDetail.classGroup} · 平均准确率 {selectedStudentForDetail.averageScore}%
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3 my-5">
              <div className="p-3 bg-stone-50 rounded-xl text-center">
                <div className="text-xs text-stone-500">已测次数</div>
                <div className="text-xl font-bold text-stone-900 mt-1 tabular-nums">
                  {selectedStudentForDetail.totalQuizzesTaken}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center">
                <div className="text-xs text-emerald-700">熟练掌握</div>
                <div className="text-xl font-bold text-emerald-800 mt-1 tabular-nums">
                  {selectedStudentForDetail.masteredWordIds.length}
                </div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-center">
                <div className="text-xs text-rose-700">薄弱生字</div>
                <div className="text-xl font-bold text-rose-800 mt-1 tabular-nums">
                  {selectedStudentForDetail.strugglingWordIds.length}
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-center">
                <div className="text-xs text-amber-700">累计星星</div>
                <div className="text-xl font-bold text-amber-800 mt-1 tabular-nums">
                  {selectedStudentForDetail.starsEarned}
                </div>
              </div>
            </div>

            {/* Struggling Words List */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-stone-800 mb-2">需重点巩固生字词：</h4>
              <div className="flex flex-wrap gap-2">
                {selectedStudentForDetail.strugglingWordIds.map((wId) => {
                  const word = VOCABULARY_LIST.find((w) => w.id === wId);
                  if (!word) return null;
                  return (
                    <span
                      key={wId}
                      className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-semibold"
                    >
                      {word.simplified} ({word.pinyin})
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Recent Quiz Logs */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-stone-800 mb-2">最近测试记录与错题：</h4>
              <div className="space-y-2">
                {selectedStudentForDetail.recentResults.map((result) => (
                  <div key={result.id} className="p-3 bg-stone-50 rounded-xl text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-stone-900">{result.exerciseTitle}</span>
                      <span className="text-indigo-600 font-bold tabular-nums">
                        得分：{result.score} 分 ({result.date})
                      </span>
                    </div>

                    {result.mistakes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {result.mistakes.map((m, mIdx) => (
                          <div key={mIdx} className="text-stone-600 text-[11px] bg-white p-2 rounded border border-stone-200">
                            错选【{m.word}】：学生选了“{m.userAnswer}”，正确答案应为“{m.correctAnswer}”
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Notes Input */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-stone-800 mb-1">教师评语与教学辅导建议：</h4>
              <textarea
                rows={2}
                value={teacherNotes[selectedStudentForDetail.id] || ''}
                onChange={(e) =>
                  setTeacherNotes({
                    ...teacherNotes,
                    [selectedStudentForDetail.id]: e.target.value,
                  })
                }
                placeholder="记录该生薄弱点、辅导策略或家校沟通反馈..."
                className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                onClick={() => {
                  onSelectStudentForPractice(selectedStudentForDetail.id);
                  setSelectedStudentForDetail(null);
                }}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                切换为此学生视角做练习
              </button>

              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-4">录入新学生档案</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">学生姓名：</label>
                <input
                  type="text"
                  placeholder="例如：林可馨"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">性别：</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={newStudentGender === 'boy'}
                      onChange={() => setNewStudentGender('boy')}
                    />
                    <span>男生</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={newStudentGender === 'girl'}
                      onChange={() => setNewStudentGender('girl')}
                    />
                    <span>女生</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">所属班级：</label>
                <input
                  type="text"
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newStudentName.trim()) return;
                  onAddStudent({
                    name: newStudentName.trim(),
                    avatarNumber: Math.floor(Math.random() * 6) + 1,
                    gender: newStudentGender,
                    classGroup: newStudentClass,
                    totalQuizzesTaken: 0,
                    averageScore: 0,
                    streakDays: 0,
                    starsEarned: 0,
                  });
                  soundManager.playCorrect();
                  setNewStudentName('');
                  setIsAddStudentOpen(false);
                }}
                disabled={!newStudentName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              >
                保存建档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Assignment Modal */}
      {isNewAssignmentOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-4">定制并发布班级作业</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">作业任务名称：</label>
                <input
                  type="text"
                  placeholder="例如：周末重点词语自测闯关"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">涵盖识字单元：</label>
                <select
                  value={assignCategory}
                  onChange={(e) => setAssignCategory(e.target.value as VocabCategory | 'all')}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label} ({info.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">题目数量：</label>
                  <select
                    value={assignCount}
                    onChange={(e) => setAssignCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[5, 8, 10, 15, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} 道题
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">截止日期：</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                  </input>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setIsNewAssignmentOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!assignTitle.trim()) return;
                  onCreateAssignment({
                    title: assignTitle.trim(),
                    category: assignCategory,
                    questionCount: assignCount,
                    dueDate: assignDueDate,
                  });
                  soundManager.playCorrect();
                  setAssignTitle('');
                  setIsNewAssignmentOpen(false);
                }}
                disabled={!assignTitle.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              >
                立即发布给全班
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
