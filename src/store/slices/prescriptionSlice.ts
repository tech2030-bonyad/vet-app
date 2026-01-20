import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Prescription, RefillRequest } from '../../types/prescription';
import { prescriptionService } from '../../services/prescriptionService';

interface PrescriptionState {
  prescriptions: Prescription[];
  refillRequests: RefillRequest[];
  loading: boolean;
  error: string | null;
  selectedPrescription: Prescription | null;
}

const initialState: PrescriptionState = {
  prescriptions: [],
  refillRequests: [],
  loading: false,
  error: null,
  selectedPrescription: null,
};

// Async thunks
export const fetchPrescriptions = createAsyncThunk(
  'prescriptions/fetchPrescriptions',
  async (petId?: string) => {
    const response = await prescriptionService.getPrescriptions(petId);
    return response;
  }
);

export const requestRefill = createAsyncThunk(
  'prescriptions/requestRefill',
  async (refillData: Omit<RefillRequest, 'id' | 'requestDate' | 'status'>) => {
    const response = await prescriptionService.requestRefill(refillData);
    return response;
  }
);

export const fetchRefillRequests = createAsyncThunk(
  'prescriptions/fetchRefillRequests',
  async () => {
    const response = await prescriptionService.getRefillRequests();
    return response;
  }
);

const prescriptionSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    setSelectedPrescription: (state, action: PayloadAction<Prescription | null>) => {
      state.selectedPrescription = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch prescriptions
      .addCase(fetchPrescriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions = action.payload;
      })
      .addCase(fetchPrescriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch prescriptions';
      })
      // Request refill
      .addCase(requestRefill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestRefill.fulfilled, (state, action) => {
        state.loading = false;
        state.refillRequests.push(action.payload);
      })
      .addCase(requestRefill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to request refill';
      })
      // Fetch refill requests
      .addCase(fetchRefillRequests.fulfilled, (state, action) => {
        state.refillRequests = action.payload;
      });
  },
});

export const { setSelectedPrescription, clearError } = prescriptionSlice.actions;
export default prescriptionSlice.reducer;