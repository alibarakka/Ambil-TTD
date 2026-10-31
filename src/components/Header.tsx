import React from 'react';
import { PenTool, Download, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'canvas' | 'scanner' | 'gallery' | 'guide';
  setActiveTab: (tab: 'canvas' | 'scanner' | 'gallery' | 'guide') => void;
  onOpenExport: () => void;
  hasStrokes: boolean;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  hasStrokes,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('canvas')}
          className="flex items-center gap-2.5 text-left text-slate-900 dark:text-white font-bold text-lg sm:text-xl tracking-tight whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs">
            <PenTool className="w-4 h-4" />
          </div>
          <span>Paraf</span>
        </button>

        {/* Zone 2: Navigation Links (Clean single-line text links) */}
        <nav className="flex items-center gap-1 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'canvas'
                ? 'text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Kanvas Tanda Tangan
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'scanner'
                ? 'text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pindai Kertas
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Galeri Tersimpan</span>
            {savedCount > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`hidden md:inline-block px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'guide'
                ? 'text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Panduan Dokumen
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenExport}
            disabled={!hasStrokes && activeTab === 'canvas'}
            className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all shadow-sm ${
              hasStrokes || activeTab !== 'canvas'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-[0.98]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Simpan ke Galeri</span>
            <span className="sm:hidden">Simpan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
