/**
 * Utility to process photos of paper signatures into clean, transparent PNGs
 */

export interface ScannerOptions {
  threshold: number; // 0 to 255 (brightness cutoff for paper vs ink)
  contrast: number; // 1 to 3
  inkColorMode: 'original' | 'pure-black' | 'deep-navy' | 'royal-blue';
}

export async function processPaperSignature(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  options: ScannerOptions
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Tidak dapat membuat canvas context');

  // Limit max dimensions for performance while maintaining sharp quality
  const maxDim = 1600;
  let { width, height } = imageSource;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(imageSource, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Track bounding box of extracted ink
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let inkPixelCount = 0;

  const threshold = options.threshold;
  const contrastFactor = options.contrast;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Perceived brightness (luminance)
    let luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply contrast
    luminance = ((luminance / 255 - 0.5) * contrastFactor + 0.5) * 255;
    luminance = Math.max(0, Math.min(255, luminance));

    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);

    if (luminance >= threshold) {
      // Paper background -> make completely transparent
      data[i + 3] = 0;
    } else {
      // Ink pixel
      inkPixelCount++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      // Soft edge anti-aliasing alpha based on proximity to threshold
      const alphaFraction = 1 - luminance / threshold;
      const alpha = Math.min(255, Math.max(0, Math.round(alphaFraction * 255 * 1.5)));

      if (options.inkColorMode === 'pure-black') {
        data[i] = 17;     // #111827
        data[i + 1] = 24;
        data[i + 2] = 39;
        data[i + 3] = alpha;
      } else if (options.inkColorMode === 'deep-navy') {
        data[i] = 30;     // #1e3a8a
        data[i + 1] = 58;
        data[i + 2] = 138;
        data[i + 3] = alpha;
      } else if (options.inkColorMode === 'royal-blue') {
        data[i] = 37;     // #2563eb
        data[i + 1] = 99;
        data[i + 2] = 235;
        data[i + 3] = alpha;
      } else {
        // Original color preserved with alpha mask
        data[i + 3] = alpha;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // If ink was found, crop nicely with padding
  let finalCanvas = canvas;
  if (inkPixelCount > 20 && minX < maxX && minY < maxY) {
    const pad = 24;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(width - cropX, maxX - minX + pad * 2);
    const cropH = Math.min(height - cropY, maxY - minY + pad * 2);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cropCtx = croppedCanvas.getContext('2d');
    if (cropCtx) {
      cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      finalCanvas = croppedCanvas;
    }
  }

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal memproses gambar tanda tangan'));
        return;
      }
      resolve({
        blob,
        dataUrl: finalCanvas.toDataURL('image/png'),
        width: finalCanvas.width,
        height: finalCanvas.height,
      });
    }, 'image/png');
  });
}
