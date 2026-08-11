import axios from 'axios';

/**
 * Pre-configured Axios instance for the QIT API.
 *
 * baseURL is /api — the Vite dev proxy forwards this to http://localhost:3001/api,
 * so there are no CORS issues in development. In production, the reverse proxy
 * (nginx / cloud run) handles the same routing.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach the JWT stored in localStorage to every outgoing request.
// The token is written to localStorage by the login flow.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401 (token expired / invalid), wipe local auth state and redirect to
// /login so the user is never stuck in a broken authenticated state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
