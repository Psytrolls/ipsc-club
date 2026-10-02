/**
 * Client-side Smart Image Resizer & Compressor for News Articles & Banners
 */
export async function optimizeArticleImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale to fit within maxWidth and maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Enable high-quality bilinear filtering / downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and resize
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized WebP format with high quality compression
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Invalid reader result'));
      }
    };

    reader.readAsDataURL(file);
  });
}
