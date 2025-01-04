import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HTTP_BASE_URL } from '../../constants';

interface ProcedureStep {
  temperature: number;
  duration: number;
}

export interface TemperatureProcedure {
  id: number;
  name: string;
  steps: ProcedureStep[];
}

interface CreateProcedurePayload {
  name: string;
  steps: ProcedureStep[];
}

interface ProcedureState {
  procedures: TemperatureProcedure[];
  selectedProcedure: TemperatureProcedure | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProcedureState = {
  procedures: [],
  selectedProcedure: null,
  loading: false,
  error: null,
};

export const fetchProcedures = createAsyncThunk(
  'procedures/fetchProcedures',
  async () => {
    const response = await fetch(`${HTTP_BASE_URL}/procedures`);
    const data = await response.json();
    return data.procedures;
  }
);

export const createProcedure = createAsyncThunk(
  'procedures/createProcedure',
  async (procedure: CreateProcedurePayload) => {
    const response = await fetch(`${HTTP_BASE_URL}/procedures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(procedure),
    });
    const data = await response.json();
    return data;
  }
);

const procedureSlice = createSlice({
  name: 'procedures',
  initialState,
  reducers: {
    selectProcedure: (state, action: PayloadAction<TemperatureProcedure>) => {
      state.selectedProcedure = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProcedures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProcedures.fulfilled, (state, action) => {
        state.procedures = action.payload;
        state.loading = false;
        if (action.payload.length > 0 && !state.selectedProcedure) {
          state.selectedProcedure = action.payload[0];
        }
      })
      .addCase(fetchProcedures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch procedures';
      })
      .addCase(createProcedure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProcedure.fulfilled, (state, action) => {
        state.procedures.push(action.payload);
        state.loading = false;
        state.selectedProcedure = action.payload;
      })
      .addCase(createProcedure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create procedure';
      });
  },
});

export const { selectProcedure } = procedureSlice.actions;
export default procedureSlice.reducer; 
