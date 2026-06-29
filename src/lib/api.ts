import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        try {
          // On subdomains /login is rewritten by middleware to the correct panel login.
          // On the main domain, send vendors to the vendor subdomain.
          const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
          if (hostname.startsWith('admin.') || hostname.startsWith('vendor.')) {
            window.location.href = '/login';
          } else {
            const raw = localStorage.getItem('radiuyes-auth');
            const parsed = raw ? JSON.parse(raw) : null;
            const isVendor = parsed?.state?.user?.type === 'vendor';
            if (isVendor) {
              const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL;
              window.location.href = vendorUrl ? `${vendorUrl}/login` : '/vendor/login';
            } else {
              window.location.href = '/login';
            }
          }
        } catch {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Map an axios error to a human-readable login error message.
 */
export function loginErrorMessage(err: any): string {
  if (!err.response) {
    // No response — network or server down
    return 'Cannot reach the server. Check your internet connection and try again.';
  }
  const status = err.response.status;
  const serverMsg: string = err.response?.data?.error ?? '';

  if (status === 401) {
    if (serverMsg.toLowerCase().includes('password')) return 'Incorrect password. Please try again.';
    if (serverMsg.toLowerCase().includes('invalid')) return 'Incorrect phone number or password.';
    return 'Incorrect credentials. Please check and try again.';
  }
  if (status === 404) return 'No account found with this phone number.';
  if (status === 403) return 'Your account has been suspended. Contact support.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status === 400) return serverMsg || 'Invalid input. Please check your details.';
  if (status >= 500) return 'Server error. Please try again in a moment.';

  return serverMsg || 'Login failed. Please try again.';
}

/**
 * Map an axios error to a human-readable action error message.
 */
export function actionErrorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
  if (!err.response) return 'Network error. Check your connection.';
  const status = err.response.status;
  const msg: string = err.response?.data?.error ?? '';
  if (status === 401) return 'Session expired. Please log in again.';
  if (status === 403) return 'You do not have permission to do this.';
  if (status === 404) return 'Item not found — it may have already been deleted.';
  if (status === 409) return msg || 'Conflict — this item already exists.';
  if (status === 400) return msg || 'Invalid input. Please check your details.';
  if (status >= 500) return 'Server error. Please try again in a moment.';
  return msg || fallback;
}
