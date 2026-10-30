'use client';

import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Cropper, { type Area } from 'react-easy-crop';
import { IMAGE_SPECS, type ImageSpecKey } from '@/lib/imageSpecs';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderCrop(src: string, area: Area, width: number, height: number, name: string): Promise<File> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, width, height);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Crop failed'))), 'image/jpeg', 0.92),
  );
  return new File([blob], name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

function CropDialog({ file, specKey, onDone }: { file: File; specKey: ImageSpecKey; onDone: (f: File | null) => void }) {
  const spec = IMAGE_SPECS[specKey];
  const [src] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const confirm = async () => {
    if (!area) return;
    setBusy(true);
    try {
      onDone(await renderCrop(src, area, spec.width, spec.height, file.name));
    } catch {
      onDone(file);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, padding: 20, color: '#111' }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Adjust {spec.label.toLowerCase()}</h3>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          Final size {spec.width}×{spec.height}px. Drag to reposition, use the slider to zoom.
        </p>
        <div style={{ position: 'relative', width: '100%', height: 320, background: '#111', borderRadius: 12, overflow: 'hidden' }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={spec.width / spec.height}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <input
          type="range" min={1} max={4} step={0.01} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom" style={{ width: '100%', marginTop: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={() => onDone(null)} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #d1d5db', fontWeight: 600, fontSize: 14 }}>Cancel</button>
          <button type="button" onClick={confirm} disabled={busy || !area} style={{ padding: '8px 18px', borderRadius: 10, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14, opacity: busy || !area ? 0.6 : 1 }}>
            {busy ? 'Saving…' : 'Use this crop'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Opens a crop dialog locked to the aspect ratio the backend stores for `specKey`
 * and resolves with the cropped file (or null if cancelled).
 */
export function cropImage(file: File, specKey: ImageSpecKey): Promise<File | null> {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const finish = (f: File | null) => {
      root.unmount();
      host.remove();
      resolve(f);
    };
    root.render(<CropDialog file={file} specKey={specKey} onDone={finish} />);
  });
}
