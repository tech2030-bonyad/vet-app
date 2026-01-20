import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, ShippingAddress, PaymentMethod, Order } from '../../types/checkout';
import { paymentService } from '../../services/paymentService';

interface CheckoutState {
  cartItems: CartItem[];
  shippingAddress: ShippingAddress | null;
  selectedPaymentMethod: PaymentMethod | null;
  paymentMethods: PaymentMethod[];
  currentOrder: Order | null;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  loading: boolean;
  error: string | null;
  paymentProcessing: boolean;
}

const initialState: CheckoutState = {
  cartItems: [],
  shippingAddress: null,
  selectedPaymentMethod: null,
  paymentMethods: [],
  currentOrder: null,
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  loading: false,
  error: null,
  paymentProcessing: false,
};

// Async thunks
export const createPaymentIntent = createAsyncThunk(
  'checkout/createPaymentIntent',
  async (amount: number, { rejectWithValue }) => {
    try {
      return await paymentService.createPaymentIntent(amount);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const processPayment = createAsyncThunk(
  'checkout/processPayment',
  async (
    { paymentIntentId, paymentMethodId }: { paymentIntentId: string; paymentMethodId: string },
    { rejectWithValue }
  ) => {
    try {
      return await paymentService.confirmPayment(paymentIntentId, paymentMethodId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  'checkout/createOrder',
  async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>, { rejectWithValue }) => {
    try {
      return await paymentService.createOrder(orderData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.cartItems = action.payload;
      state.subtotal = action.payload.reduce((sum, item) => sum + item.price * item.quantity, 0);
      state.tax = state.subtotal * 0.08; // 8% tax
      state.shipping = state.subtotal > 50 ? 0 : 9.99;
      state.total = state.subtotal + state.tax + state.shipping;
    },
    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
    },
    setSelectedPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.selectedPaymentMethod = action.payload;
    },
    setPaymentMethods: (state, action: PayloadAction<PaymentMethod[]>) => {
      state.paymentMethods = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetCheckout: (state) => {
      return { ...initialState, paymentMethods: state.paymentMethods };
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.paymentProcessing = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state) => {
        state.paymentProcessing = false;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.paymentProcessing = false;
        state.error = action.payload as string;
      })
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCartItems,
  setShippingAddress,
  setSelectedPaymentMethod,
  setPaymentMethods,
  clearError,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;