import axios from "axios";

/**
 * Pre-configured Axios instance for the QualyTrack API.
 *
 * When VITE_API_URL is unset, baseURL is /api — the Vite dev proxy forwards
 * this to http://localhost:3001/api, so there are no CORS issues in
 * development. When VITE_API_URL is set (e.g. on Render, where the frontend
 * and API are separate services with different origins), requests go
 * straight to that origin's /api.
 */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api`,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach the JWT stored in localStorage to every outgoing request.
// The token is written to localStorage by the login flow.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("qualytrack_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401 (token expired / invalid), wipe local auth state and redirect to
// /login so the user is never stuck in a broken authenticated state.
// Auth endpoints (/auth/login, /auth/register) are excluded — a 401 there
// just means wrong credentials, not an expired session, so we let the caller
// handle it rather than triggering a full page reload.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = (error.config?.url as string | undefined)?.includes(
      "/auth/"
    );
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("qualytrack_token");
      localStorage.removeItem("qualytrack_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
