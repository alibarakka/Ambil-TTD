import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sliders,
  Check,
  Download,
  Copy,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { processPaperSignature, ScannerOptions } from '../utils/paperScanner';
import { saveSignatureToGallery, copySignatureToClipboard } from '../utils/signature';
import { SavedSignature } from '../types';

interface PaperScannerModalProps {
  onSavedToLocalHistory: (signature: SavedSignature) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onGoToGallery: () => void;
}

export const PaperScannerModal: React.FC<PaperScannerModalProps> = ({
  onSavedToLocalHistory,
  showToast,
  onGoToGallery,
}) => {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Processing settings
  const [threshold, setThreshold] = useState<number>(180);
  const [contrast, setContrast] = useState<number>(1.8);
  const [inkColorMode, setInkColorMode] = useState<ScannerOptions['inkColorMode']>('pure-black');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSourcePreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  // Re-run processing whenever options change or new image is loaded
  useEffect(() => {
    if (!sourceImage) return;

    let isMounted = true;
    setIsProcessing(true);

    const runProcessing = async () => {
      try {
        const res = await processPaperSignature(sourceImage, {
          threshold,
          contrast,
          inkColorMode,
        });

        if (isMounted) {
          setProcessedUrl(res.dataUrl);
          setProcessedBlob(res.blob);
          setDimensions({ width: res.width, height: res.height });
        }
      } catch (err) {
        console.error('Scan processing error:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    const timer = setTimeout(runProcessing, 80);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [sourceImage, threshold, contrast, inkColorMode]);

  const handleSaveToGallery = async () => {
    if (!processedBlob || !processedUrl) return;

    try {
      const filename = `tanda-tangan-pindai-${Date.now()}.png`;
      const result = await saveSignatureToGallery(processedBlob, filename);

      showToast(result.message, result.success ? 'success' : 'info');

      // Add to local history
      const record: SavedSignature = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: 'Tanda Tangan Pindai Kertas',
        dataUrl: processedUrl,
        createdAt: Date.now(),
        isTransparent: true,
        width: dimensions.width,
        height: dimensions.height,
        fileSizeBytes: processedBlob.size,
      };
      onSavedToLocalHistory(record);
    } catch (err: unknown) {
      showToast('Gagal menyimpan gambar', 'error');
    }
  };

  const handleCopyClipboard = async () => {
    if (!processedBlob) return;
    try {
      await copySignatureToClipboard(processedBlob);
      setCopied(true);
      showToast('Tanda tangan PNG berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      showToast('Gagal menyalin gambar', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Pindai Tanda Tangan dari Foto Kertas
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Sudah punya tanda tangan di atas kertas fisik? Ambil foto atau unggah gambarnya. Sistem akan otomatis menghapus latar belakang kertas dan menghasilkan gambar PNG transparan berkualitas tinggi.
        </p>
      </div>

      {/* Upload Zone if no image loaded */}
      {!sourceImage ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Camera className="w-8 h-8 opacity-90" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ambil Foto atau Pilih Gambar Tanda Tangan
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Untuk hasil terbaik, gunakan tanda tangan di atas kertas putih bersih dengan pencahayaan terang dan tanpa bayangan tebal.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {/* Camera Capture on Mobile */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Gunakan Kamera Ponsel</span>
            </button>

            {/* File Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Pilih File Gambar</span>
            </button>
          </div>
        </div>
      ) : (
        /* Image Processing & Preview Workstation */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Previews Before and After */}
          <div className="lg:col-span-7 space-y-4">
            {/* Transparent Extracted Output */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Hasil PNG Transparan (Latar Dihapus)
                </span>
                <span className="font-mono tabular-nums">
                  {dimensions.width} × {dimensions.height} px
                </span>
              </div>

              <div className="relative h-60 sm:h-72 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-4 bg-transparency-grid">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-10 text-xs font-medium text-slate-600">
                    Memproses ekstraksi tinta...
                  </div>
                )}
                {processedUrl ? (
                  <img
                    src={processedUrl}
                    alt="Hasil Ekstraksi Tanda Tangan"
                    className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                  />
                ) : null}
              </div>
            </div>

            {/* Original Upload Thumbnail */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  {sourcePreviewUrl && (
                    <img
                      src={sourcePreviewUrl}
                      alt="Foto Kertas Asli"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Foto Kertas Sumber</h4>
                  <p className="text-[11px] text-slate-500">Latar putih diekstrak menjadi transparan</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSourceImage(null);
                  setSourcePreviewUrl(null);
                  setProcessedUrl(null);
                }}
                className="min-h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 hover:text-red-600 transition-colors"
              >
                Ganti Foto
              </button>
            </div>
          </div>

          {/* Right Column: Adjustment Sliders & Export Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Pengaturan Ekstraksi Tinta</span>
                </h3>
                <button
                  onClick={() => {
                    setThreshold(180);
                    setContrast(1.8);
                    setInkColorMode('pure-black');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  title="Kembalikan ke pengaturan awal"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Threshold Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Ambang Batas Kertas (Threshold)
                  </span>
                  <span className="font-mono text-slate-500">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="240"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[10px] text-slate-400">
                  Geser ke kanan jika latar belakang kertas masih terlihat kotor/abu-abu.
                </p>
              </div>

              {/* Contrast Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Kontras & Ketajaman Tinta
                  </span>
                  <span className="font-mono text-slate-500">{contrast.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Ink Color Selector */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Warna Tinta Hasil
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pure-black', label: 'Hitam Pekat', hex: '#111827' },
                    { id: 'deep-navy', label: 'Biru Resmi', hex: '#1e3a8a' },
                    { id: 'royal-blue', label: 'Biru Royal', hex: '#2563eb' },
                    { id: 'original', label: 'Warna Asli', hex: '#475569' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setInkColorMode(mode.id as ScannerOptions['inkColorMode'])}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                        inkColorMode === mode.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: mode.hex }}
                      />
                      <span className="truncate">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <button
                  onClick={handleSaveToGallery}
                  disabled={!processedBlob}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Simpan ke Galeri Perangkat</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyClipboard}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin PNG'}</span>
                  </button>

                  <button
                    onClick={onGoToGallery}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Lihat Galeri</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
