import { configureStore } from '@reduxjs/toolkit';
import serialPortReducer from './slices/serialPortSlice';
import temperatureReducer from './slices/temperatureSlice';
import procedureReducer from './slices/procedureSlice';

export const store = configureStore({
  reducer: {
    serialPort: serialPortReducer,
    temperature: temperatureReducer,
    procedures: procedureReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
