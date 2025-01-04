import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { SERIAL_PORTS_URL, SELECT_SERIAL_PORT_URL } from '../../constants';

interface SerialPortState {
  availablePorts: string[];
  selectedPort: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SerialPortState = {
  availablePorts: [],
  selectedPort: null,
  loading: false,
  error: null,
};

export const fetchPorts = createAsyncThunk(
  'serialPort/fetchPorts',
  async () => {
    const { data } = await axios.get(SERIAL_PORTS_URL);
    return data.ports;
  }
);

export const selectPort = createAsyncThunk(
  'serialPort/selectPort',
  async (port: string) => {
    await axios.post(SELECT_SERIAL_PORT_URL, { port });
    return port;
  }
);

const serialPortSlice = createSlice({
  name: 'serialPort',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPorts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPorts.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.loading = false;
        state.availablePorts = action.payload;
      })
      .addCase(fetchPorts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch ports';
      })
      .addCase(selectPort.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(selectPort.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.selectedPort = action.payload;
      })
      .addCase(selectPort.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to select port';
      });
  },
});

export default serialPortSlice.reducer; 
