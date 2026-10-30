/** Sizes the backend resizes uploads to (backend/src/lib/r2.ts callers). Keep in sync. */
export interface ImageSpec {
  label: string;
  width: number;
  height: number;
  ratio: string;
}

export const IMAGE_SPECS = {
  cover: { label: 'Cover photo', width: 1200, height: 400, ratio: '3:1' },
  product: { label: 'Product image', width: 600, height: 600, ratio: '1:1 square' },
  banner: { label: 'Banner', width: 800, height: 400, ratio: '2:1' },
  notification: { label: 'Notification image', width: 1024, height: 512, ratio: '2:1' },
} satisfies Record<string, ImageSpec>;

export type ImageSpecKey = keyof typeof IMAGE_SPECS;

/** One-line hint shown next to upload buttons. */
export function specHint(key: ImageSpecKey): string {
  const s = IMAGE_SPECS[key];
  return `${s.label}: ${s.width}×${s.height}px (${s.ratio}). You can adjust the crop before uploading.`;
}
