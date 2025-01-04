import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TemperatureState {
  setpoint: number | null;
  actualTemp: number | null;
}

const initialState: TemperatureState = {
  setpoint: null,
  actualTemp: null,
};

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
});

export const { setTemperatureSetpoint, setActualTemperature } = temperatureSlice.actions;
export default temperatureSlice.reducer; 
