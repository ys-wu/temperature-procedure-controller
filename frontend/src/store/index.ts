import { configureStore } from '@reduxjs/toolkit';
import temperatureReducer from './slices/temperatureSlice';
import serialPortReducer from './slices/serialPortSlice';

export const store = configureStore({
  reducer: {
    temperature: temperatureReducer,
    serialPort: serialPortReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
