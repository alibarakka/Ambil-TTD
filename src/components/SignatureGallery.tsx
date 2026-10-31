import React, { useState } from 'react';
import {
  Download,
  Copy,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Check,
  Share2,
  PenTool
} from 'lucide-react';
import { SavedSignature } from '../types';
import { saveSignatureToGallery, copySignatureToClipboard } from '../utils/signature';

interface SignatureGalleryProps {
  signatures: SavedSignature[];
  onDeleteSignature: (id: string) => void;
  onClearAll: () => void;
  onSelectToCanvas?: (signature: SavedSignature) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onGoToCanvas: () => void;
}

export const SignatureGallery: React.FC<SignatureGalleryProps> = ({
  signatures,
  onDeleteSignature,
  onClearAll,
  showToast,
  onGoToCanvas,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDownload = async (sig: SavedSignature) => {
    try {
      const res = await fetch(sig.dataUrl);
      const blob = await res.blob();
      const filename = `${sig.title || 'tanda-tangan'}.png`;
      const result = await saveSignatureToGallery(blob, filename);
      showToast(result.message, result.success ? 'success' : 'info');
    } catch (err: unknown) {
      showToast('Gagal mengunduh tanda tangan', 'error');
    }
  };

  const handleCopy = async (sig: SavedSignature) => {
    try {
      const res = await fetch(sig.dataUrl);
      const blob = await res.blob();
      await copySignatureToClipboard(blob);
      setCopiedId(sig.id);
      showToast('Tanda tangan berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      showToast('Gagal menyalin gambar', 'error');
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (signatures.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-8 h-8 opacity-80" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Belum Ada Tanda Tangan Tersimpan
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Tanda tangan yang Anda simpan akan muncul di sini sebagai riwayat yang dapat diunduh ulang atau disalin kapan saja.
        </p>
        <button
          onClick={onGoToCanvas}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <PenTool className="w-4 h-4" />
          <span>Buat Tanda Tangan Sekarang</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header of Gallery */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Galeri Tanda Tangan Tersimpan
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{signatures.length} tanda tangan tersimpan di perangkat ini</span>
            <span aria-hidden="true">·</span>
            <span>Format PNG kualitas tinggi</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearAll}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua</span>
          </button>
        </div>
      </div>

      {/* Grid of Signatures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {signatures.map((sig) => {
          return (
            <div
              key={sig.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
            >
              {/* Thumbnail Display with transparency checkerboard */}
              <div className="relative h-44 p-4 flex items-center justify-center bg-transparency-grid overflow-hidden border-b border-slate-100 dark:border-slate-800">
                <img
                  src={sig.dataUrl}
                  alt={sig.title}
                  className="max-h-full max-w-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Signature Metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {sig.title || 'Tanda Tangan'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-mono tabular-nums">{sig.width}×{sig.height} px</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(sig.createdAt)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {/* Direct Download / Save to Gallery */}
                    <button
                      onClick={() => handleDownload(sig)}
                      className="min-h-[38px] px-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Unduh / Simpan ke Galeri Perangkat"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </button>

                    {/* Copy to Clipboard */}
                    <button
                      onClick={() => handleCopy(sig)}
                      className="min-h-[38px] px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Salin ke Clipboard"
                    >
                      {copiedId === sig.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {copiedId === sig.id ? 'Tersalin' : 'Salin'}
                      </span>
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteSignature(sig.id)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Hapus dari galeri"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
