import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { SET_TEMPERATURE_URL } from '../../constants';

interface TemperatureState {
  setpoint: number | null;
  actualTemp: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: TemperatureState = {
  setpoint: null,
  actualTemp: null,
  loading: false,
  error: null,
};

export const setTemperature = createAsyncThunk(
  'temperature/setTemperature',
  async (temperature: number) => {
    const response = await axios.post(SET_TEMPERATURE_URL, {
      temperature,
    });
    return response.data;
  }
);

const temperatureSlice = createSlice({
  name: 'temperature',
  initialState,
  reducers: {
    setTemperatureSetpoint: (state, action: PayloadAction<number | null>) => {
      state.setpoint = action.payload;
    },
    setActualTemperature: (state, action: PayloadAction<number | null>) => {
      state.actualTemp = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setTemperature.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setTemperature.fulfilled, (state, action) => {
        state.loading = false;
        state.setpoint = action.payload.temperature;
      })
      .addCase(setTemperature.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to set temperature';
      });
  },
});

export const { setTemperatureSetpoint, setActualTemperature } = temperatureSlice.actions;
export default temperatureSlice.reducer; 
