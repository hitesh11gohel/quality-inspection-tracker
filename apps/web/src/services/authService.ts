/**
 * Auth service — typed wrappers over the /auth API endpoints.
 *
 * All functions throw an Error with the server's error message on failure
 * so Redux thunks can catch it and pass it to rejectWithValue.
 */

import type { ApiResponse, User } from '@qit/shared';
import api from '@/lib/axios';

interface LoginResult {
  token: string;
  user: User;
}

export const authService = {
  /**
   * Authenticate with username + password.
   * Returns the signed JWT and public user object on success.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const res = await api.post<ApiResponse<LoginResult>>('/auth/login', { username, password });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error ?? 'Login failed');
    }
    return res.data.data;
  },

  /**
   * Create a new account.
   * Returns the created User — the thunk will call login() immediately after
   * to obtain a JWT so the user is auto-logged-in after registration.
   */
  async register(username: string, password: string, role?: string): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/auth/register', { username, password, role });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error ?? 'Registration failed');
    }
    return res.data.data;
  },
};
