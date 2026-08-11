/**
 * Redux store — wires all feature slices together and exports typed hooks.
 *
 * Typed hooks (useAppDispatch / useAppSelector) should be used everywhere in
 * the app instead of the plain useDispatch / useSelector so callers get full
 * type inference without manual type annotations on every call-site.
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer        from '@/store/slices/authSlice';
import inspectionsReducer from '@/store/slices/inspectionsSlice';
import summaryReducer     from '@/store/slices/summarySlice';

export const store = configureStore({
  reducer: {
    auth:        authReducer,
    inspections: inspectionsReducer,
    summary:     summaryReducer,
  },
});

// ── Typed helpers ─────────────────────────────────────────────────────────────

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Use instead of plain useDispatch — gives AppDispatch type for thunks */
export const useAppDispatch: () => AppDispatch = useDispatch;

/** Use instead of plain useSelector — gives full RootState type inference */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
