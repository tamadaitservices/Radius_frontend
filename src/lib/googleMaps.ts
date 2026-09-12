const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
const MAPS_SRC = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;

export function loadGoogleMaps(cb: () => void, onError?: () => void) {
  if (typeof window === 'undefined') return;
  if ((window as any).google?.maps) { cb(); return; }
  const existing = document.querySelector(`script[src="${MAPS_SRC}"]`);
  if (existing) {
    const poll = setInterval(() => {
      if ((window as any).google?.maps) { clearInterval(poll); cb(); }
    }, 50);
    existing.addEventListener('error', () => { clearInterval(poll); onError?.(); });
    return;
  }
  const s = document.createElement('script');
  s.src = MAPS_SRC;
  s.async = true;
  s.onload = () => cb();
  s.onerror = () => onError?.();
  document.head.appendChild(s);
}
