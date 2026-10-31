// Field checks that return a plain-language message, or null when the value is fine.
// Mirrors the vendor app (vendor-mobile-flutter/lib/core/validators.dart) and the backend rules.

const MOBILE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function requiredText(v: string, label: string, opts: { min?: number; max?: number } = {}): string | null {
  const t = v.trim();
  if (!t) return `${label} is required`;
  if (opts.min && t.length < opts.min) return `${label} must be at least ${opts.min} characters (${t.length} so far)`;
  if (opts.max && t.length > opts.max) return `${label} can be at most ${opts.max} characters (${t.length} entered)`;
  return null;
}

export function mobileError(v: string, label = 'Mobile number', required = true): string | null {
  if (!v) return required ? `${label} is required` : null;
  if (!/^\d+$/.test(v)) return `${label} can only contain digits`;
  if (v.length < 10) return `${label} needs 10 digits — you have entered ${v.length}`;
  if (v.length > 10) return `${label} has too many digits — it should be exactly 10`;
  if (!MOBILE.test(v)) return `${label} must start with 6, 7, 8 or 9`;
  return null;
}

export function emailError(v: string): string | null {
  const t = v.trim();
  if (!t) return 'Email address is required';
  if (!t.includes('@')) return 'Email address needs an @, like name@example.com';
  if (!EMAIL.test(t)) return 'Enter a full email address, like name@example.com';
  return null;
}

export function passwordError(v: string, label = 'Password'): string | null {
  if (!v) return `${label} is required`;
  if (v.length < 8) return `${label} must be at least 8 characters (${v.length} so far)`;
  return null;
}

export function confirmError(v: string, original: string): string | null {
  if (!v) return 'Repeat the password to confirm it';
  return v === original ? null : 'Passwords do not match';
}

export function amountError(v: string, label = 'Price', required = true): string | null {
  const t = v.trim();
  if (!t) return required ? `${label} is required` : null;
  const n = Number(t);
  if (Number.isNaN(n)) return `${label} must be a number, like 499 or 499.50`;
  if (n <= 0) return `${label} must be greater than 0`;
  if (n > 10_000_000) return `${label} looks too large — check for extra zeros`;
  return null;
}

export function mrpError(mrp: string, price: string): string | null {
  const own = amountError(mrp, 'MRP', false);
  if (own || !mrp.trim()) return own;
  const p = Number(price.trim());
  if (!Number.isNaN(p) && price.trim() && Number(mrp) < p) return `MRP cannot be lower than the price (₹${price.trim()})`;
  return null;
}

export function timeError(v: string, label: string): string | null {
  if (!v.trim()) return `${label} is required`;
  return TIME.test(v.trim()) ? null : `${label} must look like 09:30 (24-hour, HH:MM)`;
}

export function hoursError(open: string, close: string): string | null {
  if (timeError(open, 'Opening time') || timeError(close, 'Closing time')) return null;
  return open.trim() === close.trim() ? 'Opening and closing time cannot be the same' : null;
}

export function coordinatesError(lat: string, lng: string): string | null {
  if (lat === '' || lng === '') return 'Set your shop location — use "Detect my location" or enter the coordinates';
  const la = Number(lat), lo = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(lo)) return 'Location must be numbers, like 16.5062 and 80.6480';
  if (la < -90 || la > 90) return 'Latitude must be between -90 and 90';
  if (lo < -180 || lo > 180) return 'Longitude must be between -180 and 180';
  return null;
}

/** Show [error] while typing once something is entered, or after a submit attempt for empty fields. */
export function visibleError(error: string | null, value: string, submitted: boolean): string | null {
  return error && (value !== '' || submitted) ? error : null;
}

/** Message for the first non-null entry, with a count of the rest. */
export function firstProblem(problems: Array<string | null>): { message: string; more: number } | null {
  const list = problems.filter((p): p is string => !!p);
  return list.length ? { message: list[0], more: list.length - 1 } : null;
}
