/**
 * Inspections slice — manages the paginated inspection list and filter state.
 *
 * Three async thunks cover the full CRUD surface exposed by the API:
 *   fetchInspections  – paginated, filtered GET
 *   createInspection  – POST; prepends the new record so it appears at the top
 *   resolveInspection – PATCH /:id/resolve; updates the record in-place
 *
 * setFilters resets page to 1 whenever any filter changes so stale results
 * from a previous page are never shown with the new filter set.
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Inspection, InspectionFilters } from '@qit/shared';
import { inspectionService } from '@/services/inspectionService';

// ── State ─────────────────────────────────────────────────────────────────────

interface InspectionsState {
  items:       Inspection[];
  total:       number;
  page:        number;
  limit:       number;
  isLoading:   boolean;
  isSubmitting: boolean;
  error:       string | null;
  filters:     InspectionFilters;
}

const initialState: InspectionsState = {
  items:        [],
  total:        0,
  page:         1,
  limit:        10,
  isLoading:    false,
  isSubmitting: false,
  error:        null,
  filters:      {},
};

// ── Types ─────────────────────────────────────────────────────────────────────

type CreateInspectionData = Omit<
  Inspection,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'createdBy'
>;

// ── Async thunks ──────────────────────────────────────────────────────────────

export const fetchInspections = createAsyncThunk(
  'inspections/fetch',
  async (filters: InspectionFilters, { rejectWithValue }) => {
    try {
      return await inspectionService.getInspections(filters);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const createInspection = createAsyncThunk(
  'inspections/create',
  async (data: CreateInspectionData, { rejectWithValue }) => {
    try {
      return await inspectionService.createInspection(data);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const resolveInspection = createAsyncThunk(
  'inspections/resolve',
  async (
    { id, resolutionNote }: { id: number; resolutionNote: string },
    { rejectWithValue }
  ) => {
    try {
      return await inspectionService.resolveInspection(id, resolutionNote);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const deleteInspection = createAsyncThunk(
  'inspections/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await inspectionService.deleteInspection(id);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const inspectionsSlice = createSlice({
  name: 'inspections',
  initialState,
  reducers: {
    /** Update active filters and reset to page 1 so results are always consistent */
    setFilters(state, action: { payload: Partial<InspectionFilters> }) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
  },
  extraReducers: (builder) => {
    // ── fetchInspections ──
    builder
      .addCase(fetchInspections.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchInspections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items     = action.payload.inspections;
        state.total     = action.payload.total;
        state.page      = action.payload.page;
        state.limit     = action.payload.limit;
      })
      .addCase(fetchInspections.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // ── createInspection ──
    builder
      .addCase(createInspection.pending, (state) => {
        state.isSubmitting = true;
        state.error        = null;
      })
      .addCase(createInspection.fulfilled, (state, action) => {
        state.isSubmitting = false;
        // Prepend so the newest record appears at the top without a refetch
        state.items  = [action.payload, ...state.items];
        state.total += 1;
      })
      .addCase(createInspection.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error        = action.payload as string;
      });

    // ── resolveInspection ──
    builder
      .addCase(resolveInspection.pending, (state) => {
        state.isSubmitting = true;
        state.error        = null;
      })
      .addCase(resolveInspection.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(resolveInspection.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error        = action.payload as string;
      });

    // ── deleteInspection ──
    builder
      .addCase(deleteInspection.pending, (state) => {
        state.isSubmitting = true;
        state.error        = null;
      })
      .addCase(deleteInspection.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items  = state.items.filter((i) => i.id !== action.payload);
        state.total  = Math.max(0, state.total - 1);
      })
      .addCase(deleteInspection.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error        = action.payload as string;
      });
  },
});

export const { setFilters } = inspectionsSlice.actions;
export default inspectionsSlice.reducer;
