import React from 'react';
import { Smartphone, FileText, CheckCircle2, Copy, Sparkles, Layers, ShieldCheck } from 'lucide-react';

export const GuideModal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Panduan Lengkap Penggunaan Tanda Tangan Digital
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Pelajari cara menyimpan langsung ke galeri foto ponsel dan menempelkannya ke berbagai dokumen penting dengan rapi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Menyimpan ke Galeri Ponsel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1. Menyimpan ke Galeri Ponsel
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kompatibel dengan Android, iOS iPhone/iPad, dan Komputer Desktop.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Pengguna iPhone & iPad (Safari):
              </span>
              Saat menekan <strong>Simpan ke Galeri</strong>, lembar berbagi (Share Sheet) iOS akan terbuka. Pilih opsi <strong>"Simpan Gambar" (Save Image)</strong> untuk langsung memasukkannya ke galeri Foto.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Pengguna Android (Chrome):
              </span>
              File PNG otomatis terunduh dan langsung dapat dibuka di aplikasi Google Photos / Galeri Bawaan di folder <em>Download / Gambar</em>.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Salin Cepat (Clipboard):
              </span>
              Gunakan tombol <strong>Salin Gambar</strong> untuk menempelkan (Ctrl+V / Cmd+V) instan ke dokumen tanpa perlu download file terlebih dahulu.
            </div>
          </div>
        </div>

        {/* Step 2: Menempelkan ke Dokumen Word & PDF */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              2. Menempelkan ke Dokumen
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cara pasang tanda tangan di Microsoft Word, Google Docs, & PDF.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Microsoft Word:
              </span>
              Pilih tab <em>Sisipkan (Insert)</em> → <em>Gambar (Pictures)</em> → Pilih PNG tanda tangan Anda. Lalu klik kanan gambar → <em>Bungkus Teks (Wrap Text)</em> → pilih <strong>Di Depan Teks (In Front of Text)</strong> agar bisa digeser tepat di atas garis nama.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Dokumen PDF (Acrobat / Ponsel):
              </span>
              Buka PDF di Adobe Acrobat Reader atau browser → Pilih fitur <em>Isi & Tanda Tangan (Fill & Sign)</em> → Pilih opsi <em>Gambar</em> dan masukkan file PNG yang baru saja disimpan.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Keuntungan PNG Transparan:
              </span>
              Latar belakang yang transparan memastikan tanda tangan tidak menutupi teks dokumen, stempel instansi, atau garis titik-titik di bawahnya.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
