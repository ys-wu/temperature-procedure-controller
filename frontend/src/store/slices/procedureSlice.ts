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

export const deleteProcedure = createAsyncThunk(
  'procedures/deleteProcedure',
  async (procedureId: number) => {
    const response = await fetch(`${HTTP_BASE_URL}/procedures/${procedureId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || 'Failed to delete procedure');
    }
    return procedureId;
  }
);

export const updateProcedure = createAsyncThunk(
  'procedures/updateProcedure',
  async ({ id, procedure }: { id: number; procedure: CreateProcedurePayload }) => {
    const response = await fetch(`${HTTP_BASE_URL}/procedures/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(procedure),
    });
    const data = await response.json();
    if (!data.id) {
      throw new Error(data.message || 'Failed to update procedure');
    }
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
      });
  },
});

export const { selectProcedure } = procedureSlice.actions;
export default procedureSlice.reducer; 
