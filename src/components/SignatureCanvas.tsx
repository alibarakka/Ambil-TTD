import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  Trash2,
  Grid,
  FileText,
  Square,
  Sparkles,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Pen,
  Feather,
  Highlighter
} from 'lucide-react';
import { Stroke, Point, PenStyle, CanvasBackground } from '../types';
import { renderStrokesToContext } from '../utils/signature';

interface SignatureCanvasProps {
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  undoStack: Stroke[][];
  setUndoStack: React.Dispatch<React.SetStateAction<Stroke[][]>>;
  redoStack: Stroke[][];
  setRedoStack: React.Dispatch<React.SetStateAction<Stroke[][]>>;
  onSaveToGalleryClick: () => void;
  backgroundMode: CanvasBackground;
  setBackgroundMode: (bg: CanvasBackground) => void;
}

const COLOR_PALETTE = [
  { name: 'Hitam Dokumen', hex: '#111827' },
  { name: 'Biru Resmi', hex: '#1e3a8a' },
  { name: 'Biru Cerah', hex: '#2563eb' },
  { name: 'Merah Koreksi', hex: '#dc2626' },
  { name: 'Hijau Zamrud', hex: '#059669' },
];

const STROKE_WIDTHS = [
  { label: 'Halus', value: 2 },
  { label: 'Sedang', value: 3.5 },
  { label: 'Tebal', value: 5.5 },
  { label: 'Ekstra', value: 8 },
];

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  strokes,
  setStrokes,
  undoStack,
  setUndoStack,
  redoStack,
  setRedoStack,
  onSaveToGalleryClick,
  backgroundMode,
  setBackgroundMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);

  // Brush settings
  const [color, setColor] = useState('#111827');
  const [width, setWidth] = useState(3.5);
  const [penStyle, setPenStyle] = useState<PenStyle>('standard');
  const [showGuideline, setShowGuideline] = useState(true);
  const [customColor, setCustomColor] = useState('#4338ca');

  // Sync canvas dimensions with container and high-DPI
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw guidelines if enabled
    if (showGuideline) {
      const lineY = rect.height * 0.72;
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);

      // Baseline
      ctx.beginPath();
      ctx.moveTo(36, lineY);
      ctx.lineTo(rect.width - 36, lineY);
      ctx.stroke();

      // "x" sign mark
      ctx.fillStyle = '#64748b';
      ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('x  Tanda tangan di sini', 40, lineY - 10);
      ctx.restore();
    }

    // Render strokes
    renderStrokesToContext(ctx, strokes);

    ctx.restore();
  }, [strokes, showGuideline]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      redrawCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Get pointer coordinates relative to canvas
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, time: Date.now() };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
      time: Date.now(),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    isDrawingRef.current = true;
    const pt = getCoordinates(e);
    currentPointsRef.current = [pt];

    // Push previous state to undo stack
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]); // Clear redo stack on new action

    // Create new active stroke
    const newStroke: Stroke = {
      points: [pt],
      color,
      width,
      penStyle,
    };
    setStrokes((prev) => [...prev, newStroke]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const pt = getCoordinates(e);
    currentPointsRef.current.push(pt);

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const updated = [...prev];
      updated[lastIndex] = {
        ...updated[lastIndex],
        points: [...updated[lastIndex].points, pt],
      };
      return updated;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, strokes]);
    setStrokes(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes(next);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes([]);
  };

  // Background visual class
  const getBgClass = () => {
    switch (backgroundMode) {
      case 'transparent':
        return 'bg-transparency-grid';
      case 'ruled':
        return 'bg-ruled-paper';
      case 'parchment':
        return 'bg-[#fcfaf2]';
      case 'white':
      default:
        return 'bg-white';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Toolbar: Pen Styles, Backgrounds & Canvas Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Pen Style Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setPenStyle('standard')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              penStyle === 'standard'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Pulpen Standar - Garis rapi dan konsisten"
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Pulpen</span>
          </button>

          <button
            onClick={() => setPenStyle('fountain')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              penStyle === 'fountain'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Pena Kaligrafi - Dinamis tebal tipis sesuai kecepatan"
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Kaligrafi</span>
          </button>

          <button
            onClick={() => setPenStyle('marker')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              penStyle === 'marker'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Spidol - Garis tebal dan tegas"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Spidol</span>
          </button>
        </div>

        {/* Canvas Background View Options */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setBackgroundMode('transparent')}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              backgroundMode === 'transparent'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Tampilkan kisi transparan"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transparan</span>
          </button>

          <button
            onClick={() => setBackgroundMode('white')}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              backgroundMode === 'white'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Tampilan kertas putih polos"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Putih</span>
          </button>

          <button
            onClick={() => setBackgroundMode('ruled')}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              backgroundMode === 'ruled'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Kertas bergaris buku"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bergaris</span>
          </button>
        </div>

        {/* Auxiliary Controls: Guideline, Undo, Redo, Clear */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setShowGuideline(!showGuideline)}
            className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showGuideline
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
            title="Garis bantu untuk tanda tangan lurus (tidak akan masuk ke file PNG yang diekspor)"
          >
            {showGuideline ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Garis Bantu</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
              undoStack.length > 0
                ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            }`}
            title="Urungkan (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
              redoStack.length > 0
                ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            }`}
            title="Ulangi (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 transition-colors ${
              strokes.length > 0
                ? 'hover:bg-red-50 dark:hover:bg-red-950/30'
                : 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-300'
            }`}
            title="Bersihkan Kanvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Drawing Canvas Container */}
      <div
        ref={containerRef}
        className={`relative w-full h-[320px] sm:h-[400px] md:h-[460px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner transition-colors ${getBgClass()}`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {strokes.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
            <Pen className="w-10 h-10 mb-2 opacity-30 animate-bounce" />
            <p className="text-sm sm:text-base font-medium text-slate-500">
              Goreskan tanda tangan Anda di area ini
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan jari, stylus, atau kursor mouse dengan leluasa
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Ergonomic Tools: Ink Color & Thickness Palette */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Colors */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Tinta:
          </span>
          <div className="flex items-center gap-2">
            {COLOR_PALETTE.map((c) => {
              const isSelected = color === c.hex;
              return (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-transform ${
                    isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              );
            })}

            {/* Custom Color Input */}
            <label
              className="relative min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden hover:scale-105 transition-transform"
              style={{ backgroundColor: customColor }}
              title="Pilih Warna Kustom"
            >
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setColor(e.target.value);
                }}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
              {color === customColor && (
                <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-sm pointer-events-none" />
              )}
            </label>
          </div>
        </div>

        {/* Thickness / Stroke Width */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Ketebalan:
          </span>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {STROKE_WIDTHS.map((sw) => {
              const isSelected = width === sw.value;
              return (
                <button
                  key={sw.value}
                  onClick={() => setWidth(sw.value)}
                  className={`min-h-[40px] px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span
                    className="rounded-full bg-slate-900 dark:bg-white"
                    style={{
                      width: Math.max(3, sw.value),
                      height: Math.max(3, sw.value),
                    }}
                  />
                  <span>{sw.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
