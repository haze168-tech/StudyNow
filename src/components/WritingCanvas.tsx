import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Volume2, Eye, EyeOff, Brush, Eraser } from 'lucide-react';
import { VocabWord } from '../types';
import { VOCABULARY_LIST } from '../data/vocabulary';
import { soundManager } from '../utils/audio';

interface WritingCanvasProps {
  initialWordId?: string;
  words?: VocabWord[];
}

export const WritingCanvas: React.FC<WritingCanvasProps> = ({ initialWordId, words }) => {
  const allWords = words && words.length > 0 ? words : VOCABULARY_LIST;

  const [selectedWord, setSelectedWord] = useState<VocabWord>(() => {
    if (initialWordId) {
      const found = allWords.find((w) => w.id === initialWordId);
      if (found) return found;
    }
    return allWords[0];
  });

  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState('#1e293b'); // default ink black
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const currentChar = selectedWord.characters[activeCharIndex] || {
    char: selectedWord.simplified[activeCharIndex] || selectedWord.simplified[0],
    pinyin: selectedWord.pinyinTones[activeCharIndex] || '',
    radical: '—',
    strokes: 0,
  };

  // Setup canvas resolution and redraw grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset history when switching character or word
    setStrokeHistory([]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [selectedWord, activeCharIndex]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Save state before this stroke for undo
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setStrokeHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }

    setIsDrawing(true);
    setLastPoint({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (clientX - rect.left) * scaleX;
    const currentY = (clientY - rect.top) * scaleY;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    setLastPoint({ x: currentX, y: currentY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleClear = () => {
    soundManager.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setStrokeHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleUndo = () => {
    soundManager.playClick();
    if (strokeHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    setStrokeHistory((prev) => prev.slice(0, prev.length - 1));
    ctx.putImageData(previousState, 0, 0);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner / Word Selector */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span>田字格生字描红与临摹</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            依照规范笔顺练习书写，体会汉字间架结构与偏旁部首
          </p>
        </div>

        {/* Word Select */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-stone-600">选择练习生字：</label>
          <select
            value={selectedWord.id}
            onChange={(e) => {
              const found = allWords.find((w) => w.id === e.target.value);
              if (found) {
                setSelectedWord(found);
                setActiveCharIndex(0);
                soundManager.speakChinese(found.simplified);
              }
            }}
            className="text-sm font-semibold border border-stone-300 rounded-lg px-3 py-1.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {allWords.map((word) => (
              <option key={word.id} value={word.id}>
                {word.simplified} ({word.pinyin}) - {word.categoryName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tianzige Grid & Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center bg-white p-6 rounded-xl border border-stone-200">
          {/* Character Tab Selector */}
          <div className="flex items-center gap-2 mb-4">
            {selectedWord.characters.map((charDetail, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveCharIndex(idx);
                  soundManager.playClick();
                  soundManager.speakChinese(charDetail.char);
                }}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${
                  activeCharIndex === idx
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                生字 {idx + 1}：{charDetail.char} ({charDetail.pinyin})
              </button>
            ))}
          </div>

          {/* Tianzige Board Container */}
          <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-lg overflow-hidden tianzige-box select-none touch-none shadow-inner">
            {/* Guide Character in Background */}
            {showGuide && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-rose-300/45 font-kai font-bold leading-none"
                style={{ fontSize: '260px' }}
              >
                {currentChar.char}
              </div>
            )}

            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair z-10"
            />
          </div>

          {/* Canvas Controls */}
          <div className="mt-5 w-full flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
            {/* Guide Toggle */}
            <button
              onClick={() => {
                setShowGuide(!showGuide);
                soundManager.playClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
            >
              {showGuide ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showGuide ? '隐藏底字' : '显示底字'}</span>
            </button>

            {/* Brush Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500">墨色:</span>
              {[
                { label: '浓墨', color: '#0f172a' },
                { label: '朱砂', color: '#e11d48' },
                { label: '青墨', color: '#0284c7' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => {
                    setBrushColor(c.color);
                    soundManager.playClick();
                  }}
                  title={c.label}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    brushColor === c.color ? 'scale-110 border-stone-800' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <Brush className="w-3.5 h-3.5 text-stone-500" />
              <input
                type="range"
                min="4"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-rose-600 cursor-pointer"
                title={`画笔粗细: ${brushSize}px`}
              />
            </div>

            {/* Undo & Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={strokeHistory.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-md transition-colors"
                title="撤销上一步"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>撤销</span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                title="清空画板"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>清空</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Character Details & Academic Analysis */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Main Card */}
          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold font-kai text-stone-900">{currentChar.char}</span>
                <div>
                  <div className="text-sm font-bold text-rose-600">{currentChar.pinyin}</div>
                  <div className="text-xs text-stone-500">{selectedWord.categoryName}</div>
                </div>
              </div>

              <button
                onClick={() => soundManager.speakChinese(currentChar.char)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>朗读</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 bg-stone-50 rounded-lg">
                <div className="text-xs text-stone-500">部首</div>
                <div className="text-lg font-bold text-stone-800 font-kai">{currentChar.radical}</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <div className="text-xs text-stone-500">笔画数</div>
                <div className="text-lg font-bold text-stone-800 tabular-nums">{currentChar.strokes} 画</div>
              </div>
            </div>

            {/* Word context */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-stone-700">所属词语：</span>
                <span className="font-bold text-stone-900 ml-1 text-sm">{selectedWord.simplified}</span>
                <span className="text-stone-500 ml-2">({selectedWord.pinyin})</span>
              </div>
              <div>
                <span className="font-semibold text-stone-700">词义解析：</span>
                <p className="text-stone-600 mt-0.5 leading-relaxed">{selectedWord.chineseMeaning}</p>
              </div>
              <div>
                <span className="font-semibold text-stone-700">教材例句：</span>
                <p className="text-stone-800 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50 mt-1 leading-relaxed">
                  “{selectedWord.sentence}”
                </p>
              </div>
              <div>
                <span className="font-semibold text-stone-700">常用搭配：</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedWord.collocations.map((col, idx) => (
                    <span key={idx} className="bg-stone-100 px-2 py-0.5 rounded text-stone-700 text-xs">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tip Card */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <span>✍️ 二年级书写要领</span>
            </div>
            横平竖直，注意田字格的横中线与竖中线位置。左窄右宽或上小下大，握笔端正，坐姿端正，一尺一拳一寸。
          </div>
        </div>
      </div>
    </div>
  );
};
