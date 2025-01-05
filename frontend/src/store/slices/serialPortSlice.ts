import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URLS } from '../../constants';

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

export const fetchSerialPorts = createAsyncThunk(
  'serialPort/fetchPorts',
  async () => {
    const { data } = await axios.get(API_URLS.serialPort.list);
    return data.ports;
  }
);

export const selectSerialPort = createAsyncThunk(
  'serialPort/selectPort',
  async (port: string) => {
    const { data } = await axios.post(API_URLS.serialPort.select, { port });
    return data;
  }
);

const serialPortSlice = createSlice({
  name: 'serialPort',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSerialPorts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSerialPorts.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.loading = false;
        state.availablePorts = action.payload;
      })
      .addCase(fetchSerialPorts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch ports';
      })
      .addCase(selectSerialPort.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(selectSerialPort.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.selectedPort = action.payload;
      })
      .addCase(selectSerialPort.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to select port';
      });
  },
});

export default serialPortSlice.reducer; 
