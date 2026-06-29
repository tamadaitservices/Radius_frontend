import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'RadiuYes — Shop within your Radius';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0faf1',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, backgroundColor: '#0c831f' }} />

        {/* Logo */}
        <div style={{ display: 'flex', fontSize: 108, fontWeight: 900, letterSpacing: '-3px', marginBottom: 16 }}>
          <span style={{ color: '#1a1a1a' }}>Radiu</span>
          <span style={{ color: '#0c831f' }}>Yes</span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 34, color: '#4b5563', marginBottom: 12 }}>
          Shop within your Radius
        </div>

        {/* Sub-tagline */}
        <div style={{ fontSize: 24, color: '#9ca3af' }}>
          Find it nearby · Negotiate on call · Walk in and buy
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: 40, fontSize: 22, color: '#0c831f', fontWeight: 600 }}>
          radiuyes.com
        </div>
      </div>
    ),
    { ...size }
  );
}
