import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { HTTP_BASE_URL } from '../../constants';

export type ProcedureStep = {
  temperature: number;
  duration: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  elapsed_time: number;
};

export type TemperatureProcedure = {
  id: string;
  name: string;
  steps: ProcedureStep[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  current_step: number;
};

export interface CreateProcedurePayload {
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
    const { data } = await axios.get(`${HTTP_BASE_URL}/procedures`);
    return data.procedures;
  }
);

export const createProcedure = createAsyncThunk(
  'procedures/createProcedure',
  async (procedure: CreateProcedurePayload) => {
    const { data } = await axios.post(`${HTTP_BASE_URL}/procedures`, procedure);
    return data;
  }
);

export const deleteProcedure = createAsyncThunk(
  'procedures/deleteProcedure',
  async (procedureId: string) => {
    await axios.delete(`${HTTP_BASE_URL}/procedures/${procedureId}`);
    return procedureId;
  }
);

export const updateProcedure = createAsyncThunk(
  'procedures/updateProcedure',
  async ({ id, procedure }: { id: string; procedure: CreateProcedurePayload }) => {
    const { data } = await axios.put(`${HTTP_BASE_URL}/procedures/${id}`, procedure);
    if (!data.id) {
      throw new Error(data.message || 'Failed to update procedure');
    }
    return data;
  }
);

export const startProcedure = createAsyncThunk(
  'procedures/startProcedure',
  async (procedureId: string) => {
    const { data } = await axios.post(`${HTTP_BASE_URL}/procedures/${procedureId}/start`);
    return data;
  }
);

export const stopProcedure = createAsyncThunk(
  'procedures/stopProcedure',
  async () => {
    const { data } = await axios.post(`${HTTP_BASE_URL}/procedures/stop`);
    return data;
  }
);

interface WebSocketUpdate {
  temperature_setpoint: number;
  temperature_actual: number;
  temperature_status: string;
  active_procedure?: TemperatureProcedure;
}

const procedureSlice = createSlice({
  name: 'procedures',
  initialState,
  reducers: {
    selectProcedure: (state, action: PayloadAction<TemperatureProcedure>) => {
      state.selectedProcedure = action.payload;
    },
    updateFromWebSocket: (state, action: PayloadAction<WebSocketUpdate>) => {
      if (action.payload.active_procedure) {
        const procedure = action.payload.active_procedure;
        const index = state.procedures.findIndex(p => p.id === procedure.id);
        if (index !== -1) {
          state.procedures[index] = procedure;
          if (state.selectedProcedure?.id === procedure.id) {
            state.selectedProcedure = procedure;
          }
        }
      }
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
      })
      .addCase(deleteProcedure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProcedure.fulfilled, (state, action) => {
        state.procedures = state.procedures.filter(p => p.id !== action.payload);
        if (state.selectedProcedure?.id === action.payload) {
          state.selectedProcedure = state.procedures[0] || null;
        }
        state.loading = false;
      })
      .addCase(deleteProcedure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete procedure';
      })
      .addCase(updateProcedure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProcedure.fulfilled, (state, action) => {
        const index = state.procedures.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.procedures[index] = action.payload;
          if (state.selectedProcedure?.id === action.payload.id) {
            state.selectedProcedure = action.payload;
          }
        }
        state.loading = false;
      })
      .addCase(updateProcedure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update procedure';
      })
      .addCase(startProcedure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startProcedure.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.procedure) {
          const index = state.procedures.findIndex(p => p.id === action.payload.procedure.id);
          if (index !== -1) {
            state.procedures[index] = action.payload.procedure;
            if (state.selectedProcedure?.id === action.payload.procedure.id) {
              state.selectedProcedure = action.payload.procedure;
            }
          }
        }
      })
      .addCase(startProcedure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start procedure';
      })
      .addCase(stopProcedure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopProcedure.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.procedure) {
          const index = state.procedures.findIndex(p => p.id === action.payload.procedure.id);
          if (index !== -1) {
            state.procedures[index] = action.payload.procedure;
            if (state.selectedProcedure?.id === action.payload.procedure.id) {
              state.selectedProcedure = action.payload.procedure;
            }
          }
        }
      })
      .addCase(stopProcedure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to stop procedure';
      });
  },
});

export const { selectProcedure, updateFromWebSocket } = procedureSlice.actions;
export default procedureSlice.reducer; 
