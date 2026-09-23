import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, Flame, BookOpen } from 'lucide-react';
import { QuizQuestion, QuizResult, MistakeRecord, Student } from '../types';
import { soundManager } from '../utils/audio';

interface InteractiveQuizRunnerProps {
  questions: QuizQuestion[];
  categoryTitle: string;
  exerciseTitle: string;
  student: Student;
  onFinishQuiz: (result: QuizResult) => void;
  onExit: () => void;
  onOpenWritingCanvas: (wordId: string) => void;
}

export const InteractiveQuizRunner: React.FC<InteractiveQuizRunnerProps> = ({
  questions,
  categoryTitle,
  exerciseTitle,
  student,
  onFinishQuiz,
  onExit,
  onOpenWritingCanvas,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const currentQ = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  // Auto-play audio on question load if applicable
  useEffect(() => {
    if (!currentQ || isCompleted) return;
    if (currentQ.type === 'listen_and_choose' && currentQ.audioText) {
      soundManager.speakChinese(currentQ.audioText);
    }
  }, [currentIndex, currentQ, isCompleted]);

  const handleSelectOption = (optionId: string) => {
    if (isAnswered || !currentQ) return;

    const chosenOption = currentQ.options.find((o) => o.id === optionId);
    if (!chosenOption) return;

    setSelectedOptionId(optionId);
    setIsAnswered(true);

    if (chosenOption.isCorrect) {
      soundManager.playCorrect();
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
    } else {
      soundManager.playIncorrect();
      setStreak(0);
      const correctOpt = currentQ.options.find((o) => o.isCorrect);
      setMistakes((prev) => [
        ...prev,
        {
          wordId: currentQ.targetWord.id,
          word: currentQ.targetWord.simplified,
          pinyin: currentQ.targetWord.pinyin,
          questionType: currentQ.title,
          questionPrompt: currentQ.prompt,
          userAnswer: chosenOption.text,
          correctAnswer: correctOpt ? correctOpt.text : '',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        },
      ]);
    }
  };

  const handleNext = useCallback(() => {
    soundManager.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    } else {
      // Completed!
      const totalQ = questions.length;
      const finalScore = Math.round((score / totalQ) * 100);
      const totalTime = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      
      setIsCompleted(true);
      soundManager.playFanfare();

      // Launch celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const result: QuizResult = {
        id: `result-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        category: categoryTitle,
        exerciseTitle: exerciseTitle,
        score: finalScore,
        correctCount: score,
        totalQuestions: totalQ,
        timeSpentSeconds: totalTime,
        mistakes,
      };

      onFinishQuiz(result);
    }
  }, [currentIndex, questions.length, score, startTime, student, categoryTitle, exerciseTitle, mistakes, onFinishQuiz]);

  // Keyboard navigation: 1-4 for options, Enter for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;
      if (isAnswered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleNext();
      } else if (!isAnswered && currentQ) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (currentQ.options[idx]) {
            handleSelectOption(currentQ.options[idx].id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isCompleted, currentQ, handleNext]);

  // Completion view
  if (isCompleted) {
    const finalScore = Math.round((score / questions.length) * 100);
    const stars = finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : 1;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 mb-4">
            <Award className="w-10 h-10 text-amber-500" />
          </div>

          <h2 className="text-2xl font-bold text-stone-900">
            {finalScore >= 90 ? '太棒了！闯关大获全胜！' : finalScore >= 70 ? '表现不错！继续加油！' : '再接再厉，温故而知新！'}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            学生：{student.name} · {exerciseTitle}
          </p>

          {/* Stars */}
          <div className="flex items-center justify-center gap-2 my-6">
            {[1, 2, 3].map((starIdx) => (
              <span
                key={starIdx}
                className={`text-4xl transition-transform ${
                  starIdx <= stars ? 'scale-110 drop-shadow' : 'opacity-25 grayscale'
                }`}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Stat Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-stone-50 rounded-xl my-6">
            <div>
              <div className="text-xs text-stone-500">最终得分</div>
              <div className="text-2xl font-bold text-stone-900 tabular-nums">{finalScore} 分</div>
            </div>
            <div>
              <div className="text-xs text-stone-500">答对题目</div>
              <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                {score} / {questions.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">所用时间</div>
              <div className="text-2xl font-bold text-stone-800 tabular-nums">
                {Math.floor(secondsElapsed / 60)}分{secondsElapsed % 60}秒
              </div>
            </div>
          </div>

          {/* Mistakes review if any */}
          {mistakes.length > 0 ? (
            <div className="text-left mt-6 p-4 rounded-xl border border-rose-200 bg-rose-50/50">
              <h4 className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                <span>错题记录已自动收录入错题本（共 {mistakes.length} 处）：</span>
              </h4>
              <div className="space-y-2">
                {mistakes.map((m, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-rose-100 text-xs">
                    <div className="font-semibold text-stone-800">
                      【{m.word}】({m.pinyin}) · {m.questionType}
                    </div>
                    <div className="text-stone-500 mt-0.5">{m.questionPrompt}</div>
                    <div className="mt-1 flex items-center gap-4 text-xs">
                      <span className="text-rose-600">你的回答：{m.userAnswer}</span>
                      <span className="text-emerald-700 font-bold">正确答案：{m.correctAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium my-4">
              🎉 满分通关！没有出现任何错题，太厉害了！
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={onExit}
              className="px-5 py-2.5 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              返回练习大厅
            </button>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedOptionId(null);
                setIsAnswered(false);
                setScore(0);
                setStreak(0);
                setMistakes([]);
                setIsCompleted(false);
                setSecondsElapsed(0);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再练一次</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chosenOption = currentQ.options.find((o) => o.id === selectedOptionId);
  const correctOption = currentQ.options.find((o) => o.isCorrect);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top Header Card */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="text-xs text-stone-500 hover:text-stone-800 underline"
          >
            退出测试
          </button>
          <span className="text-stone-300">|</span>
          <span className="text-xs font-semibold text-stone-800">{exerciseTitle}</span>
          <span className="text-xs text-stone-500 hidden sm:inline">({categoryTitle})</span>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 text-xs font-medium">
          {streak > 1 && (
            <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{streak} 连对!</span>
            </div>
          )}

          <div className="text-stone-600 tabular-nums">
            计时：{Math.floor(secondsElapsed / 60)}分{secondsElapsed % 60}秒
          </div>

          <div className="font-bold text-rose-600 tabular-nums bg-rose-50 px-2.5 py-1 rounded-md">
            第 {currentIndex + 1} / {questions.length} 题
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 h-1.5 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-rose-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200">
        
        {/* Type Header & Audio Button */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded">
            {currentQ.title}
          </span>

          <button
            onClick={() => {
              const textToSpeak = currentQ.audioText || currentQ.targetWord.simplified;
              soundManager.speakChinese(textToSpeak);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            title="朗读题目发音"
          >
            <Volume2 className="w-4 h-4 text-rose-600" />
            <span>听读音</span>
          </button>
        </div>

        {/* Prompt */}
        <div className="my-4 text-center">
          {currentQ.type === 'mc_char_to_pinyin' ? (
            <div className="inline-block p-4 sm:p-6 rounded-xl tianzige-box my-2">
              <span className="text-4xl sm:text-5xl font-kai font-bold text-stone-900 tracking-wider">
                {currentQ.prompt}
              </span>
            </div>
          ) : (
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              {currentQ.prompt}
            </h3>
          )}

          {currentQ.subPrompt && (
            <p className="text-xs text-stone-500 mt-2">{currentQ.subPrompt}</p>
          )}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
          {currentQ.options.map((option, optIdx) => {
            const letter = ['A', 'B', 'C', 'D'][optIdx];
            let buttonStyle = 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100 hover:border-stone-300';
            
            if (isAnswered) {
              if (option.isCorrect) {
                buttonStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
              } else if (option.id === selectedOptionId) {
                buttonStyle = 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20';
              } else {
                buttonStyle = 'bg-stone-50 border-stone-200 text-stone-400 opacity-60';
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={isAnswered}
                className={`relative flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-white border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
                    {letter}
                  </span>
                  <div>
                    <span className="text-base font-bold font-sc">{option.text}</span>
                    {option.pinyin && (
                      <span className="text-xs text-stone-500 block">{option.pinyin}</span>
                    )}
                  </div>
                </div>

                {isAnswered && (
                  <div>
                    {option.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : option.id === selectedOptionId ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Feedback & Academic Explanation Card */}
        {isAnswered && (
          <div className="mt-6 p-4 rounded-xl border border-stone-200 bg-stone-50 transition-all animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {chosenOption?.isCorrect ? (
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    回答正确！
                  </span>
                ) : (
                  <span className="text-sm font-bold text-rose-700 flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    需要注意哦，正确答案是【{correctOption?.text}】
                  </span>
                )}
              </div>

              {/* Tianzige writing link */}
              <button
                onClick={() => onOpenWritingCanvas(currentQ.targetWord.id)}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>临摹练写此字</span>
              </button>
            </div>

            {/* Detailed Context */}
            <p className="text-xs text-stone-700 mt-2 leading-relaxed">
              {currentQ.explanation}
            </p>

            {/* Collocations */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200 text-xs text-stone-500">
              <span>常见搭配：</span>
              <span className="text-stone-800 font-medium">
                {currentQ.targetWord.collocations.join('、')}
              </span>
            </div>
          </div>
        )}

        {/* Next Question Control */}
        {isAnswered && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <span>{currentIndex + 1 < questions.length ? '下一题' : '完成测试'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
