import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  X,
  Sliders,
  Crop,
  Layers,
  Sparkles,
  BookmarkCheck,
  FileDown,
  Info
} from 'lucide-react';
import { Stroke, ExportSettings, SavedSignature } from '../types';
import {
  exportSignatureToBlob,
  saveSignatureToGallery,
  copySignatureToClipboard,
  getStrokesBoundingBox,
} from '../utils/signature';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  strokes: Stroke[];
  onSavedToLocalHistory: (signature: SavedSignature) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  strokes,
  onSavedToLocalHistory,
  showToast,
}) => {
  const [autoCrop, setAutoCrop] = useState(true);
  const [transparentBackground, setTransparentBackground] = useState(true);
  const [scale, setScale] = useState(2); // 2x HD default
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportDimensions, setExportDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasSavedLocally, setHasSavedLocally] = useState(false);

  // Set default filename on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      setFileName(`tanda-tangan-${dateStr}-${timeStr}`);
      setCopied(false);
      setHasSavedLocally(false);
    }
  }, [isOpen]);

  // Update preview whenever options change
  useEffect(() => {
    if (!isOpen || strokes.length === 0) return;

    let isMounted = true;
    const updatePreview = async () => {
      try {
        const dummyCanvasWidth = 800;
        const dummyCanvasHeight = 450;
        const settings: ExportSettings = {
          autoCrop,
          padding: 24,
          transparentBackground,
          scale,
          filename: fileName,
        };

        const res = await exportSignatureToBlob(
          strokes,
          dummyCanvasWidth,
          dummyCanvasHeight,
          settings
        );

        if (isMounted) {
          setPreviewUrl(res.dataUrl);
          setExportDimensions({ width: res.width, height: res.height });
        }
      } catch (err) {
        console.error('Preview error:', err);
      }
    };

    updatePreview();
    return () => {
      isMounted = false;
    };
  }, [isOpen, strokes, autoCrop, transparentBackground, scale, fileName]);

  if (!isOpen) return null;

  const handleSaveToDevice = async () => {
    if (strokes.length === 0) return;
    setIsExporting(true);

    try {
      const settings: ExportSettings = {
        autoCrop,
        padding: 24,
        transparentBackground,
        scale,
        filename: fileName.trim() || 'tanda-tangan',
      };

      const { blob, width, height, dataUrl } = await exportSignatureToBlob(
        strokes,
        800,
        450,
        settings
      );

      const targetFilename = `${settings.filename}.png`;
      const result = await saveSignatureToGallery(blob, targetFilename);

      if (result.success) {
        showToast(result.message, 'success');

        // Automatically store in app's local gallery
        const record: SavedSignature = {
          id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: settings.filename,
          dataUrl,
          createdAt: Date.now(),
          isTransparent: transparentBackground,
          width,
          height,
          fileSizeBytes: blob.size,
        };
        onSavedToLocalHistory(record);
        setHasSavedLocally(true);
      } else {
        showToast(result.message, 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan tanda tangan';
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const settings: ExportSettings = {
        autoCrop,
        padding: 24,
        transparentBackground,
        scale,
        filename: fileName,
      };

      const { blob } = await exportSignatureToBlob(strokes, 800, 450, settings);
      await copySignatureToClipboard(blob);
      setCopied(true);
      showToast('Tanda tangan PNG berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyalin gambar';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Simpan Tanda Tangan ke Galeri
            </h3>
            <p className="text-xs text-slate-500">
              Format PNG berkualitas tinggi untuk galeri perangkat
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Live Preview Box */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Pratinjau Hasil PNG</span>
              <span className="font-mono tabular-nums">
                {exportDimensions.width} × {exportDimensions.height} px
              </span>
            </div>

            <div className="relative h-44 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-4 bg-transparency-grid">
              {!transparentBackground && (
                <div className="absolute inset-0 bg-white" />
              )}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pratinjau Tanda Tangan"
                  className="relative max-h-full max-w-full object-contain filter drop-shadow-xs"
                />
              ) : (
                <div className="text-xs text-slate-400">Memuat pratinjau...</div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {transparentBackground
                ? 'Latar transparan: Sangat rapi untuk ditempel di dokumen PDF, Word, atau kontrak tanpa menutupi teks.'
                : 'Latar putih solid: Gambar dengan latar putih polos tanpa transparansi.'}
            </p>
          </div>

          {/* Export Settings Controls */}
          <div className="space-y-3.5">
            {/* Filename input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama File (.png)
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white dark:bg-slate-800">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="tanda-tangan-saya"
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-transparent outline-none font-medium"
                />
                <span className="pr-3 text-xs text-slate-400 font-mono">.png</span>
              </div>
            </div>

            {/* Toggle: Auto Crop */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Crop className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Pangkas Otomatis (Auto-Crop)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Potong ruang kosong di sekitar tanda tangan
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoCrop(!autoCrop)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  autoCrop ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoCrop ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle: Transparent Background */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Latar Transparan (PNG Alpha)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bagus untuk ditempel di berbagai dokumen
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransparentBackground(!transparentBackground)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  transparentBackground ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    transparentBackground ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Resolution Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Kualitas Resolusi
                </div>
                <div className="text-[11px] text-slate-500">
                  Semakin tinggi semakin tajam saat dicetak
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                {[
                  { label: '1x Standar', value: 1 },
                  { label: '2x HD', value: 2 },
                  { label: '3x Ultra', value: 3 },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setScale(item.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      scale === item.value
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2.5">
          {/* Primary Action Button */}
          <button
            onClick={handleSaveToDevice}
            disabled={isExporting}
            className="w-full min-h-[48px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting ? 'Memproses File PNG...' : 'Simpan ke Galeri Perangkat'}
            </span>
          </button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyClipboard}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Gambar'}</span>
            </button>

            <button
              onClick={() => {
                handleSaveToDevice();
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Bagikan Langsung</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
