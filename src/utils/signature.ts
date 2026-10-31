import { Stroke, Point, ExportSettings } from '../types';

/**
 * Render all strokes onto a Canvas 2D context with smooth bezier curves
 */
export function renderStrokesToContext(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  options?: {
    offsetX?: number;
    offsetY?: number;
    scale?: number;
  }
) {
  const offsetX = options?.offsetX ?? 0;
  const offsetY = options?.offsetY ?? 0;
  const scale = options?.scale ?? 1;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;

    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;

    const baseWidth = stroke.width * scale;

    if (stroke.points.length === 1) {
      // Single dot
      const pt = stroke.points[0];
      ctx.beginPath();
      ctx.arc(
        (pt.x - offsetX) * scale,
        (pt.y - offsetY) * scale,
        baseWidth / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      continue;
    }

    if (stroke.penStyle === 'fountain') {
      // Fountain / calligraphy style with velocity-dependent tapering
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const p1 = stroke.points[i];
        const p2 = stroke.points[i + 1];

        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const timeDiff = Math.max(1, p2.time - p1.time);
        const velocity = dist / timeDiff; // px per ms

        // Fast stroke = thinner, slow stroke = thicker
        const velocityFactor = Math.max(0.4, Math.min(1.8, 1.2 - velocity * 0.4));
        const currentWidth = Math.max(1, baseWidth * velocityFactor);

        ctx.lineWidth = currentWidth;
        ctx.beginPath();
        ctx.moveTo((p1.x - offsetX) * scale, (p1.y - offsetY) * scale);
        ctx.lineTo((p2.x - offsetX) * scale, (p2.y - offsetY) * scale);
        ctx.stroke();
      }
    } else {
      // Standard or Marker: Smooth quadratic bezier curve interpolation
      ctx.lineWidth = stroke.penStyle === 'marker' ? baseWidth * 1.5 : baseWidth;
      ctx.beginPath();

      const p0 = stroke.points[0];
      ctx.moveTo((p0.x - offsetX) * scale, (p0.y - offsetY) * scale);

      for (let i = 1; i < stroke.points.length - 1; i++) {
        const p1 = stroke.points[i];
        const p2 = stroke.points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.quadraticCurveTo(
          (p1.x - offsetX) * scale,
          (p1.y - offsetY) * scale,
          (midX - offsetX) * scale,
          (midY - offsetY) * scale
        );
      }

      const lastPoint = stroke.points[stroke.points.length - 1];
      ctx.lineTo(
        (lastPoint.x - offsetX) * scale,
        (lastPoint.y - offsetY) * scale
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Calculates the bounding box of the signature strokes
 */
export function getStrokesBoundingBox(strokes: Stroke[]) {
  if (strokes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxLineWidth = 0;

  for (const stroke of strokes) {
    if (stroke.width > maxLineWidth) {
      maxLineWidth = stroke.width;
    }
    for (const pt of stroke.points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  if (minX === Infinity || minY === Infinity) return null;

  // Include half stroke width margin
  const margin = maxLineWidth * 1.5;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = maxX + margin;
  maxY = maxY + margin;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(10, maxX - minX),
    height: Math.max(10, maxY - minY),
  };
}

/**
 * Generates an exported PNG Blob from strokes
 */
export async function exportSignatureToBlob(
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number,
  settings: ExportSettings
): Promise<{ blob: Blob; width: number; height: number; dataUrl: string }> {
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d', { willReadFrequently: true });
  if (!exportCtx) throw new Error('Gagal menginisialisasi context canvas');

  const bbox = getStrokesBoundingBox(strokes);

  let targetWidth = canvasWidth;
  let targetHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (settings.autoCrop && bbox) {
    const pad = settings.padding;
    targetWidth = Math.ceil(bbox.width + pad * 2);
    targetHeight = Math.ceil(bbox.height + pad * 2);
    offsetX = Math.floor(bbox.minX - pad);
    offsetY = Math.floor(bbox.minY - pad);
  }

  const scale = settings.scale || 1;
  exportCanvas.width = Math.ceil(targetWidth * scale);
  exportCanvas.height = Math.ceil(targetHeight * scale);

  // Background
  if (!settings.transparentBackground) {
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  } else {
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  // Draw strokes
  renderStrokesToContext(exportCtx, strokes, {
    offsetX,
    offsetY,
    scale,
  });

  return new Promise((resolve, reject) => {
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal menghasilkan file PNG'));
        return;
      }
      const dataUrl = exportCanvas.toDataURL('image/png');
      resolve({
        blob,
        width: exportCanvas.width,
        height: exportCanvas.height,
        dataUrl,
      });
    }, 'image/png');
  });
}

/**
 * Attempts to save to gallery using Web Share API (mobile devices)
 * or triggers direct browser file download
 */
export async function saveSignatureToGallery(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; method: 'share' | 'download'; message: string }> {
  const file = new File([blob], filename, { type: 'image/png' });

  // 1. Try Web Share API with File (Supported on iOS Safari & Android Chrome)
  // This pops the native share sheet with "Save Image" option directly to the phone's gallery/photos!
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: 'Tanda Tangan Digital',
        text: 'Tanda tangan digital dalam format PNG transparan.',
      });
      return {
        success: true,
        method: 'share',
        message: 'Tanda tangan berhasil dibagikan / disimpan ke galeri perangkat!',
      };
    } catch (err: unknown) {
      // User cancelled share or abort error, fallback to direct download
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          method: 'share',
          message: 'Penyimpanan dibatalkan oleh pengguna.',
        };
      }
      // Otherwise proceed to download fallback
    }
  }

  // 2. Direct Download Fallback (Creates PNG download to device gallery/downloads folder)
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  return {
    success: true,
    method: 'download',
    message: 'File PNG berhasil diunduh ke folder penyimpanan / galeri perangkat!',
  };
}

/**
 * Copy PNG image blob directly to user's clipboard
 */
export async function copySignatureToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Fitur salin gambar ke clipboard tidak didukung pada browser ini.');
  }

  try {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    throw err;
  }
}
