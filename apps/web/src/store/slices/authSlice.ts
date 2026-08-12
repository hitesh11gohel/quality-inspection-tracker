/**
 * Auth slice — manages authenticated user state.
 *
 * State is hydrated from localStorage on startup so a page refresh does not
 * log the user out. Tokens are written/cleared from localStorage inside
 * extra reducers so the store and localStorage always stay in sync.
 *
 * registerThunk auto-logs-in after creating the account (calls login under
 * the hood) so callers always receive a token on successful registration.
 */

import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import type { User } from "@qit/shared";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// ── Constants ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = "qualytrack_token";
const USER_KEY = "qualytrack_user";

// ── State ─────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Rehydrate from localStorage so refresh doesn't clear the session
const storedToken = localStorage.getItem(TOKEN_KEY);
const storedUser = localStorage.getItem(USER_KEY);

const initialState: AuthState = {
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  token: storedToken ?? null,
  isLoading: false,
  error: null,
};

// ── Async thunks ──────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      return await authService.login(
        credentials.username,
        credentials.password
      );
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const updateUsernameThunk = createAsyncThunk(
  "auth/updateUsername",
  async (username: string, { rejectWithValue }) => {
    try {
      return await userService.updateUsername(username);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    credentials: { username: string; password: string; role?: string },
    { rejectWithValue }
  ) => {
    try {
      // Register the account, then immediately login to obtain a JWT.
      // The register endpoint only returns the user; login provides the token.
      await authService.register(
        credentials.username,
        credentials.password,
        credentials.role
      );
      return await authService.login(
        credentials.username,
        credentials.password
      );
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Clear all auth state and remove persisted session from localStorage */
    logoutAction(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
  extraReducers: (builder) => {
    // ── loginThunk ──
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── updateUsernameThunk ──
    builder
      .addCase(updateUsernameThunk.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, username: action.payload.username };
          localStorage.setItem(USER_KEY, JSON.stringify(state.user));
        }
      });

    // ── registerThunk (shares fulfilled/rejected shape with loginThunk) ──
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logoutAction } = authSlice.actions;
export default authSlice.reducer;
