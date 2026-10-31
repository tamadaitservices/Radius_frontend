/** Sizes the backend resizes uploads to (backend/src/lib/r2.ts callers). Keep in sync. */
export interface ImageSpec {
  label: string;
  width: number;
  height: number;
  ratio: string;
  /** Smallest photo accepted (backend/src/lib/r2.ts rejects anything under half the target). */
  minWidth: number;
  minHeight: number;
}

export const IMAGE_SPECS = {
  cover: { label: 'Cover photo', width: 1200, height: 400, ratio: '3:1', minWidth: 600, minHeight: 200 },
  product: { label: 'Product image', width: 600, height: 600, ratio: '1:1 square', minWidth: 300, minHeight: 300 },
  banner: { label: 'Banner', width: 800, height: 400, ratio: '2:1', minWidth: 400, minHeight: 200 },
  notification: { label: 'Notification image', width: 1024, height: 512, ratio: '2:1', minWidth: 512, minHeight: 256 },
  gallery: { label: 'Gallery photo', width: 1000, height: 1000, ratio: 'any shape', minWidth: 200, minHeight: 200 },
} satisfies Record<string, ImageSpec>;

export type ImageSpecKey = keyof typeof IMAGE_SPECS;

/** One-line hint shown next to upload buttons. */
export function specHint(key: ImageSpecKey): string {
  const s = IMAGE_SPECS[key];
  return `${s.label}: ${s.width}×${s.height}px (${s.ratio}). You can adjust the crop before uploading.`;
}

/** Hint for photos that are uploaded as they are (no crop step). */
export function uncroppedHint(key: ImageSpecKey): string {
  const s = IMAGE_SPECS[key];
  return `${s.label}: at least ${s.minWidth}×${s.minHeight}px, any shape. Up to ${s.width}×${s.height}px is kept.`;
}
