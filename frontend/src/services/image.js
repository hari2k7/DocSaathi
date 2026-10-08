/**
 * Prepares an image (any browser-readable format, including the built-in SVG samples)
 * for the vision model: draws it on a white canvas, downsizes very large photos and
 * re-encodes as JPEG. The backend/Ollama only read raster images and cap uploads at 8 MB.
 */

const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.92;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This image could not be opened. Please use a PNG or JPG file.'));
    img.src = src;
  });
}

export async function prepareImageForUpload(dataUrl) {
  const img = await loadImage(dataUrl);
  const isSvg = dataUrl.startsWith('data:image/svg');

  const width = img.naturalWidth || 800;
  const height = img.naturalHeight || 1000;
  const longest = Math.max(width, height);
  // Vector images are rendered larger so small text stays crisp; photos are only ever shrunk
  const scale = isSvg ? MAX_SIDE / longest : Math.min(1, MAX_SIDE / longest);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
