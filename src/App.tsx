import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentExerciseHub } from './components/StudentExerciseHub';
import { InteractiveQuizRunner } from './components/InteractiveQuizRunner';
import { WritingCanvas } from './components/WritingCanvas';
import { VocabularyDictionary } from './components/VocabularyDictionary';
import { MistakeReview } from './components/MistakeReview';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PrintWorksheetModal } from './components/PrintWorksheetModal';
import { AddCustomWordModal } from './components/AddCustomWordModal';
import { Student, Assignment, QuizResult, QuizQuestion, VocabCategory, VocabWord } from './types';
import { INITIAL_STUDENTS, INITIAL_ASSIGNMENTS } from './data/initialStudents';
import { VOCABULARY_LIST, CATEGORY_MAP } from './data/vocabulary';
import { generateQuestionPool } from './utils/questionGenerator';
import { soundManager } from './utils/audio';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'exercises' | 'canvas' | 'dictionary' | 'mistakes' | 'teacher'>('exercises');

  // Teacher Custom Words state (persisted)
  const [customWords, setCustomWords] = useState<VocabWord[]>(() => {
    try {
      const stored = localStorage.getItem('hanzi_custom_words');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  const [isAddCustomWordOpen, setIsAddCustomWordOpen] = useState(false);

  // Merged full vocabulary list (standard curriculum + teacher added)
  const allVocabWords = [...VOCABULARY_LIST, ...customWords];

  // Persistence for Students
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem('hanzi_students');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_STUDENTS;
  });

  const [currentStudentId, setCurrentStudentId] = useState<string>(() => {
    return students[0]?.id || 'student-1';
  });

  // Persistence for Assignments
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const stored = localStorage.getItem('hanzi_assignments');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_ASSIGNMENTS;
  });

  // Sound FX toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Running Quiz state
  const [activeQuiz, setActiveQuiz] = useState<{
    questions: QuizQuestion[];
    categoryTitle: string;
    exerciseTitle: string;
  } | null>(null);

  // Target word for WritingCanvas
  const [canvasWordId, setCanvasWordId] = useState<string | undefined>(undefined);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem('hanzi_custom_words', JSON.stringify(customWords));
    } catch {
      // ignore
    }
  }, [customWords]);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem('hanzi_students', JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('hanzi_assignments', JSON.stringify(assignments));
    } catch {
      // ignore
    }
  }, [assignments]);

  const currentStudent = students.find((s) => s.id === currentStudentId) || students[0];

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  // Launch a Quiz
  const handleStartQuiz = (
    category: VocabCategory | 'all',
    mode: 'all_mix' | 'context_fill' | 'listening' | 'pinyin_char' | 'word_formation',
    title: string,
    count: number
  ) => {
    const questions = generateQuestionPool(category, mode, count, allVocabWords);
    setActiveQuiz({
      questions,
      categoryTitle: CATEGORY_MAP[category]?.label || '综合测验',
      exerciseTitle: title,
    });
  };

  // Finish a Quiz & update student stats and teacher data in real-time
  const handleFinishQuiz = (result: QuizResult) => {
    setStudents((prevStudents) =>
      prevStudents.map((s) => {
        if (s.id !== currentStudentId) return s;

        const updatedResults = [result, ...s.recentResults].slice(0, 20);
        const totalQuizzes = s.totalQuizzesTaken + 1;
        const totalScoreSum = s.recentResults.reduce((acc, r) => acc + r.score, 0) + result.score;
        const newAvg = Math.round(totalScoreSum / (s.recentResults.length + 1));

        // Stars
        const starsGained = result.score >= 90 ? 3 : result.score >= 70 ? 2 : 1;
        const newStars = s.starsEarned + starsGained;

        // Mastery calculation
        const newlyMastered: string[] = [];
        const newlyStruggling: string[] = [];

        // Words from questions in this quiz
        activeQuiz?.questions.forEach((q) => {
          const wId = q.targetWord.id;
          const hadMistake = result.mistakes.some((m) => m.wordId === wId);
          if (hadMistake) {
            newlyStruggling.push(wId);
          } else if (result.score >= 80) {
            newlyMastered.push(wId);
          }
        });

        const updatedMastered = Array.from(
          new Set([...s.masteredWordIds, ...newlyMastered].filter((id) => !newlyStruggling.includes(id)))
        );
        const updatedStruggling = Array.from(
          new Set([...s.strugglingWordIds, ...newlyStruggling].filter((id) => !newlyMastered.includes(id)))
        );

        return {
          ...s,
          totalQuizzesTaken: totalQuizzes,
          averageScore: newAvg,
          starsEarned: newStars,
          masteredWordIds: updatedMastered,
          strugglingWordIds: updatedStruggling,
          recentResults: updatedResults,
        };
      })
    );

    // If matches any pending assignment title, mark completed for this student
    setAssignments((prev) =>
      prev.map((a) => {
        if (result.exerciseTitle.includes(a.title) && !a.completedStudentIds.includes(currentStudentId)) {
          return {
            ...a,
            completedStudentIds: [...a.completedStudentIds, currentStudentId],
          };
        }
        return a;
      })
    );
  };

  // Launch a remedial quiz focusing specifically on student's mistakes
  const handleRetestMistakes = () => {
    const studentMistakes = currentStudent.recentResults.flatMap((r) => r.mistakes);
    const missedWordIds = Array.from(
      new Set([...studentMistakes.map((m) => m.wordId), ...currentStudent.strugglingWordIds])
    );

    if (missedWordIds.length === 0) {
      // Fallback
      handleStartQuiz('all', 'all_mix', '错题巩固专项训练', 8);
      return;
    }

    const targetWords = allVocabWords.filter((w) => missedWordIds.includes(w.id));
    const questions = targetWords.slice(0, 10).map((word, idx) => {
      const otherWords = allVocabWords.filter((w) => w.id !== word.id);
      const distractors = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [
        { id: `opt-correct`, text: word.simplified, isCorrect: true },
        ...distractors.map((d, i) => ({ id: `opt-dist-${i}`, text: d.simplified, isCorrect: false })),
      ].sort(() => 0.5 - Math.random());

      return {
        id: `retest-${idx}-${word.id}`,
        type: 'mc_context_fill' as const,
        title: '错题重点强化',
        prompt: word.sentenceBlank,
        subPrompt: `拼音提示：${word.pinyin}`,
        audioText: word.simplified,
        targetWord: word,
        options,
        explanation: `正确答案是【${word.simplified}】(${word.pinyin})。原句：“${word.sentence}”`,
      };
    });

    setActiveQuiz({
      questions,
      categoryTitle: '错题巩固专项',
      exerciseTitle: `${currentStudent.name}的错题针对性重测`,
    });
  };

  // Launch single word targeted quiz (e.g. from Teacher Dashboard)
  const handleStartRemedialQuizForWord = (wordId: string) => {
    const target = allVocabWords.find((w) => w.id === wordId);
    if (!target) return;

    // Switch to exercises tab and launch a mini 5-question test including this word
    setActiveTab('exercises');
    handleStartQuiz(target.category, 'all_mix', `【${target.simplified}】专项突破训练`, 5);
  };

  // Add custom word entered by teacher
  const handleAddCustomWord = (newWord: VocabWord) => {
    setCustomWords((prev) => [newWord, ...prev]);
  };

  // Delete custom word
  const handleDeleteCustomWord = (wordId: string) => {
    setCustomWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  // Jump to Writing Canvas with specific word
  const handleOpenWritingCanvas = (wordId?: string) => {
    if (wordId) {
      setCanvasWordId(wordId);
    }
    setActiveTab('canvas');
  };

  // Add new student
  const handleAddStudent = (
    newStudentData: Omit<Student, 'id' | 'recentResults' | 'masteredWordIds' | 'strugglingWordIds'>
  ) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `student-${Date.now()}`,
      masteredWordIds: [],
      strugglingWordIds: [],
      recentResults: [],
    };
    setStudents((prev) => [...prev, newStudent]);
    setCurrentStudentId(newStudent.id);
  };

  // Create new assignment
  const handleCreateAssignment = (
    newAssignData: Omit<Assignment, 'id' | 'completedStudentIds'>
  ) => {
    const newAssign: Assignment = {
      ...newAssignData,
      id: `assign-${Date.now()}`,
      completedStudentIds: [],
    };
    setAssignments((prev) => [newAssign, ...prev]);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Top Bar Contract (1 Row, 3 Zones) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveQuiz(null);
          setActiveTab(tab);
        }}
        students={students}
        currentStudentId={currentStudentId}
        onSelectStudent={(id) => setCurrentStudentId(id)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenAddCustomWordModal={() => setIsAddCustomWordOpen(true)}
        customWordCount={customWords.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeQuiz ? (
          <InteractiveQuizRunner
            questions={activeQuiz.questions}
            categoryTitle={activeQuiz.categoryTitle}
            exerciseTitle={activeQuiz.exerciseTitle}
            student={currentStudent}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => setActiveQuiz(null)}
            onOpenWritingCanvas={(wordId) => {
              setActiveQuiz(null);
              handleOpenWritingCanvas(wordId);
            }}
          />
        ) : (
          <>
            {activeTab === 'exercises' && (
              <StudentExerciseHub
                student={currentStudent}
                assignments={assignments}
                onStartQuiz={handleStartQuiz}
                onOpenWritingCanvas={handleOpenWritingCanvas}
              />
            )}

            {activeTab === 'canvas' && (
              <WritingCanvas initialWordId={canvasWordId} words={allVocabWords} />
            )}

            {activeTab === 'dictionary' && (
              <VocabularyDictionary
                student={currentStudent}
                onOpenWritingCanvas={handleOpenWritingCanvas}
                words={allVocabWords}
                onDeleteWord={handleDeleteCustomWord}
              />
            )}

            {activeTab === 'mistakes' && (
              <MistakeReview
                student={currentStudent}
                onRetestMistakes={handleRetestMistakes}
                onOpenWritingCanvas={handleOpenWritingCanvas}
                words={allVocabWords}
              />
            )}

            {activeTab === 'teacher' && (
              <TeacherDashboard
                students={students}
                assignments={assignments}
                words={allVocabWords}
                customWords={customWords}
                onOpenAddCustomWordModal={() => setIsAddCustomWordOpen(true)}
                onAddStudent={handleAddStudent}
                onCreateAssignment={handleCreateAssignment}
                onSelectStudentForPractice={(sId) => {
                  setCurrentStudentId(sId);
                  setActiveTab('exercises');
                }}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
                onStartRemedialQuizForWord={handleStartRemedialQuizForWord}
              />
            )}
          </>
        )}
      </main>

      {/* Printable Classroom Worksheet Modal */}
      <PrintWorksheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        words={allVocabWords}
      />

      {/* Teacher Add Custom Word Modal */}
      <AddCustomWordModal
        isOpen={isAddCustomWordOpen}
        onClose={() => setIsAddCustomWordOpen(false)}
        onAddWord={handleAddCustomWord}
        customWords={customWords}
        onDeleteCustomWord={handleDeleteCustomWord}
      />
    </div>
  );
}
