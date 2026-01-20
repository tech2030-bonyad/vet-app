import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Pet, MedicalRecord } from '../../types/pet';
import { petService } from '../../services/petService';

interface PetState {
  pets: Pet[];
  currentPet: Pet | null;
  loading: boolean;
  error: string | null;
}

const initialState: PetState = {
  pets: [],
  currentPet: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPets = createAsyncThunk(
  'pets/fetchPets',
  async (_, { rejectWithValue }) => {
    try {
      return await petService.getAllPets();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pets');
    }
  }
);

export const addPet = createAsyncThunk(
  'pets/addPet',
  async (petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      return await petService.createPet(petData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add pet');
    }
  }
);

export const updatePet = createAsyncThunk(
  'pets/updatePet',
  async ({ id, data }: { id: string; data: Partial<Pet> }, { rejectWithValue }) => {
    try {
      return await petService.updatePet(id, data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update pet');
    }
  }
);

export const deletePet = createAsyncThunk(
  'pets/deletePet',
  async (id: string, { rejectWithValue }) => {
    try {
      await petService.deletePet(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete pet');
    }
  }
);

export const addMedicalRecord = createAsyncThunk(
  'pets/addMedicalRecord',
  async ({ petId, record }: { petId: string; record: Omit<MedicalRecord, 'id'> }, { rejectWithValue }) => {
    try {
      return await petService.addMedicalRecord(petId, record);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add medical record');
    }
  }
);

const petSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    setCurrentPet: (state, action: PayloadAction<Pet | null>) => {
      state.currentPet = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pets
      .addCase(fetchPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPets.fulfilled, (state, action) => {
        state.loading = false;
        state.pets = action.payload;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add pet
      .addCase(addPet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPet.fulfilled, (state, action) => {
        state.loading = false;
        state.pets.push(action.payload);
      })
      .addCase(addPet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update pet
      .addCase(updatePet.fulfilled, (state, action) => {
        const index = state.pets.findIndex(pet => pet.id === action.payload.id);
        if (index !== -1) {
          state.pets[index] = action.payload;
        }
        if (state.currentPet?.id === action.payload.id) {
          state.currentPet = action.payload;
        }
      })
      // Delete pet
      .addCase(deletePet.fulfilled, (state, action) => {
        state.pets = state.pets.filter(pet => pet.id !== action.payload);
        if (state.currentPet?.id === action.payload) {
          state.currentPet = null;
        }
      })
      // Add medical record
      .addCase(addMedicalRecord.fulfilled, (state, action) => {
        const { petId, record } = action.payload;
        const petIndex = state.pets.findIndex(pet => pet.id === petId);
        if (petIndex !== -1) {
          state.pets[petIndex].medicalHistory.push(record);
        }
        if (state.currentPet?.id === petId) {
          state.currentPet.medicalHistory.push(record);
        }
      });
  },
});

export const { setCurrentPet, clearError } = petSlice.actions;
export default petSlice.reducer;