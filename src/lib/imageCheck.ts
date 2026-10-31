import toast from 'react-hot-toast';
import { IMAGE_SPECS, type ImageSpecKey } from '@/lib/imageSpecs';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // backend multer limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** What is wrong with a photo of [width]×[height] and [bytes] for [specKey], or null if it's fine. */
export function imageProblem(width: number, height: number, bytes: number, specKey: ImageSpecKey): string | null {
  const s = IMAGE_SPECS[specKey];
  if (bytes > MAX_UPLOAD_BYTES) return `This photo is ${mb(bytes)} — the limit is 10 MB. Choose a smaller photo.`;
  if (width < s.minWidth || height < s.minHeight) {
    const ideal = specKey === 'gallery' ? '' : ` — ideally ${s.width}×${s.height}px`;
    return `This photo is too small (${width}×${height}px). Use one that is at least ${s.minWidth}×${s.minHeight}px${ideal}.`;
  }
  return null;
}

function readSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Checks type, file size and pixel size; returns the reason it can't be used, or null. */
export async function checkImage(file: File, specKey: ImageSpecKey): Promise<string | null> {
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return `That is a ${file.type.replace('image/', '').toUpperCase() || 'different'} file. Use a JPG, PNG or WebP photo.`;
  }
  const size = await readSize(file);
  if (!size) return "That file couldn't be read as a picture. Use a JPG, PNG or WebP photo.";
  return imageProblem(size.width, size.height, file.size, specKey);
}

/** Like [checkImage], but shows the reason as a toast. True if the photo can be used. */
export async function checkImageOrToast(file: File, specKey: ImageSpecKey): Promise<boolean> {
  const problem = await checkImage(file, specKey);
  if (problem) toast.error(problem, { duration: 6000 });
  return !problem;
}
