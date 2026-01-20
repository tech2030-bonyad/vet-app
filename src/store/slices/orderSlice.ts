import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrdersState } from '../../types/order';
import { orderService } from '../../services/orderService';

// Initial state
const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  selectedOrder: null,
};

// Async thunks
export const fetchOrderHistory = createAsyncThunk(
  'orders/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const orders = await orderService.getOrderHistory();
      return orders;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const order = await orderService.getOrderById(orderId);
      return order;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (orderId: string, { rejectWithValue }) => {
    try {
      await orderService.cancelOrder(orderId);
      return orderId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const reorderItems = createAsyncThunk(
  'orders/reorder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const result = await orderService.reorderItems(orderId);
      return { orderId, ...result };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Order slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch order history
      .addCase(fetchOrderHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Update order status in the list
        const orderIndex = state.orders.findIndex(order => order.id === action.payload);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'cancelled' as any;
          state.orders[orderIndex].canCancel = false;
        }
        // Update selected order if it's the cancelled one
        if (state.selectedOrder?.id === action.payload) {
          state.selectedOrder.status = 'cancelled' as any;
          state.selectedOrder.canCancel = false;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reorder items
      .addCase(reorderItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderItems.fulfilled, (state) => {
        state.loading = false;
        // Handle successful reorder (e.g., show success message)
      })
      .addCase(reorderItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;