/**
 * Summary slice — aggregated inspection statistics for the dashboard.
 *
 * A single thunk fetches stats from GET /api/summary.
 * Stats are null until the first fetch completes successfully.
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { SummaryStats } from '@qit/shared';
import { inspectionService } from '@/services/inspectionService';

// ── State ─────────────────────────────────────────────────────────────────────
interface SummaryState {
  stats: SummaryStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SummaryState = {
  stats:     null,
  isLoading: false,
  error:     null,
};

// ── Async thunk ───────────────────────────────────────────────────────────────

export const fetchSummary = createAsyncThunk(
  'summary/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await inspectionService.getSummary();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const summarySlice = createSlice({
  name: 'summary',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats     = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });
  },
});

export default summarySlice.reducer;
