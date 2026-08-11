import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Feature slices will be added here as the app grows
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
