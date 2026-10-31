/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SignatureCanvas } from './components/SignatureCanvas';
import { ExportModal } from './components/ExportModal';
import { SignatureGallery } from './components/SignatureGallery';
import { PaperScannerModal } from './components/PaperScannerModal';
import { GuideModal } from './components/GuideModal';
import { Stroke, CanvasBackground, SavedSignature } from './types';
import {
  Download,
  Trash2,
  Undo2,
  CheckCircle,
  AlertCircle,
  Info,
  PenTool,
  Sparkles,
  Camera,
  Layers
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'paraf_saved_signatures_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'canvas' | 'scanner' | 'gallery' | 'guide'>('canvas');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [backgroundMode, setBackgroundMode] = useState<CanvasBackground>('transparent');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Load saved signatures from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedSignatures(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load signatures from localStorage:', err);
    }
  }, []);

  // Save to localStorage when changed
  const saveToLocalStorage = (newSigs: SavedSignature[]) => {
    setSavedSignatures(newSigs);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSigs));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  const handleSavedToLocalHistory = (signature: SavedSignature) => {
    const updated = [signature, ...savedSignatures.slice(0, 49)]; // Keep up to 50 signatures
    saveToLocalStorage(updated);
  };

  const handleDeleteSignature = (id: string) => {
    const updated = savedSignatures.filter((s) => s.id !== id);
    saveToLocalStorage(updated);
    showToast('Tanda tangan dihapus dari galeri.', 'info');
  };

  const handleClearAllSignatures = () => {
    if (window.confirm('Yakin ingin menghapus semua tanda tangan tersimpan?')) {
      saveToLocalStorage([]);
      showToast('Semua riwayat tanda tangan telah dihapus.', 'info');
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, strokes]);
    setStrokes(previous);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
        hasStrokes={strokes.length > 0}
        savedCount={savedSignatures.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-12">
        {activeTab === 'canvas' && (
          <div className="space-y-6">
            {/* View Title & Quick Notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Buat Tanda Tangan Digital
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Goreskan tanda tangan Anda dengan mulus, lalu simpan dalam format PNG transparan langsung ke galeri foto perangkat.
                </p>
              </div>

              {/* Status / Quick Action */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setIsExportOpen(true)}
                  disabled={strokes.length === 0}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${
                    strokes.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-[0.98]'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Simpan ke Galeri</span>
                </button>
              </div>
            </div>

            {/* Drawing Canvas */}
            <SignatureCanvas
              strokes={strokes}
              setStrokes={setStrokes}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
              redoStack={redoStack}
              setRedoStack={setRedoStack}
              onSaveToGalleryClick={() => setIsExportOpen(true)}
              backgroundMode={backgroundMode}
              setBackgroundMode={setBackgroundMode}
            />

            {/* Bottom Info Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Simpan Langsung ke Galeri
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mendukung Web Share API ponsel untuk menyimpan instan ke galeri foto iPhone & Android.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    PNG Latar Transparan
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hasil tanpa latar belakang kotor, siap ditempel di atas dokumen Word, PDF, dan kontrak resmi.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pindai dari Kertas Fisik
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Punya tanda tangan di kertas? Gunakan tab Pindai Kertas untuk mengekstrak tinta menjadi PNG jernih.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <PaperScannerModal
            onSavedToLocalHistory={handleSavedToLocalHistory}
            showToast={showToast}
            onGoToGallery={() => setActiveTab('gallery')}
          />
        )}

        {activeTab === 'gallery' && (
          <SignatureGallery
            signatures={savedSignatures}
            onDeleteSignature={handleDeleteSignature}
            onClearAll={handleClearAllSignatures}
            showToast={showToast}
            onGoToCanvas={() => setActiveTab('canvas')}
          />
        )}

        {activeTab === 'guide' && <GuideModal />}
      </main>

      {/* Floating Mobile Thumb CTA for quick actions */}
      {activeTab === 'canvas' && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 ${
                undoStack.length > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-700'
              }`}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              disabled={strokes.length === 0}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-red-200 dark:border-red-900 text-red-600 ${
                strokes.length > 0 ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
              }`}
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            disabled={strokes.length === 0}
            className={`flex-1 min-h-[48px] px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
              strokes.length > 0
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 active:scale-[0.98]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Simpan ke Galeri</span>
          </button>
        </div>
      )}

      {/* Export / Save Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        strokes={strokes}
        onSavedToLocalHistory={handleSavedToLocalHistory}
        showToast={showToast}
      />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-800'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
