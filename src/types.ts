export type VocabCategory = 'shizibiao' | 'nature' | 'animals' | 'school' | 'actions' | 'wisdom' | 'custom';

export interface CharacterDetail {
  char: string;
  pinyin: string;
  radical: string;
  strokes: number;
}

export interface VocabWord {
  id: string;
  cardNumber?: number;
  simplified: string;
  pinyin: string;
  pinyinTones: string[]; // e.g. ["wēn", "nuǎn"]
  characters: CharacterDetail[];
  english: string;
  chineseMeaning: string;
  category: VocabCategory;
  categoryName: string;
  grade: number; // 2
  semester: 1 | 2;
  sentence: string;
  sentenceBlank: string;
  collocations: string[];
  antonym?: string;
  synonym?: string;
}

export type ExerciseType = 
  | 'mc_char_to_pinyin' 
  | 'mc_pinyin_to_char' 
  | 'mc_context_fill' 
  | 'listen_and_choose' 
  | 'pinyin_match'
  | 'word_formation'
  | 'writing_practice';

export interface QuizQuestionOption {
  id: string;
  text: string;
  pinyin?: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: ExerciseType;
  title: string;
  prompt: string;
  subPrompt?: string;
  audioText?: string;
  targetWord: VocabWord;
  options: QuizQuestionOption[];
  explanation: string;
}

export interface MistakeRecord {
  wordId: string;
  word: string;
  pinyin: string;
  questionType: string;
  questionPrompt: string;
  userAnswer: string;
  correctAnswer: string;
  timestamp: string;
}

export interface QuizResult {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  category: string;
  exerciseTitle: string;
  score: number; // 0 - 100
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  mistakes: MistakeRecord[];
}

export interface Student {
  id: string;
  name: string;
  avatarNumber: number;
  gender: 'boy' | 'girl';
  classGroup: string;
  totalQuizzesTaken: number;
  averageScore: number;
  streakDays: number;
  starsEarned: number;
  masteredWordIds: string[];
  strugglingWordIds: string[];
  recentResults: QuizResult[];
}

export interface Assignment {
  id: string;
  title: string;
  category: VocabCategory | 'all';
  questionCount: number;
  dueDate: string;
  completedStudentIds: string[];
}
