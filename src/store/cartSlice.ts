import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for cart functionality
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
};

// Tax rate (8.5%)
const TAX_RATE = 0.085;

// Helper function to calculate cart totals
const calculateTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount,
  };
};

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart or increase quantity if exists
    addToCart: (state, action: PayloadAction<Product & { quantity?: number }>) => {
      try {
        const { quantity = 1, ...product } = action.payload;
        const existingItem = state.items.find(item => item.id === product.id);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          state.items.push({ ...product, quantity });
        }
        
        // Recalculate totals
        const totals = calculateTotals(state.items);
        Object.assign(state, totals);
        
        state.error = null;
      } catch (error) {
        state.error = 'Failed to add item to cart';
      }
    },
    
    // Remove item from cart completely
    removeFromCart: (state, action: PayloadAction<string>) => {
      try {
        state.items = state.items.filter(item => item.id !== action.payload);
        
        // Recalculate totals
        const totals = calculateTotals(state.items);
        Object.assign(state, totals);
        
        state.error = null;
      } catch (error) {
        state.error = 'Failed to remove item from cart';
      }
    },
    
    // Update item quantity
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      try {
        const { id, quantity } = action.payload;
        
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          state.items = state.items.filter(item => item.id !== id);
        } else {
          const item = state.items.find(item => item.id === id);
          if (item) {
            item.quantity = quantity;
          }
        }
        
        // Recalculate totals
        const totals = calculateTotals(state.items);
        Object.assign(state, totals);
        
        state.error = null;
      } catch (error) {
        state.error = 'Failed to update item quantity';
      }
    },
    
    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.itemCount = 0;
      state.error = null;
    },
    
    // Load cart from storage
    loadCartFromStorage: (state, action: PayloadAction<CartItem[]>) => {
      try {
        state.items = action.payload;
        const totals = calculateTotals(state.items);
        Object.assign(state, totals);
        state.isLoading = false;
        state.error = null;
      } catch (error) {
        state.error = 'Failed to load cart from storage';
        state.isLoading = false;
      }
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  loadCartFromStorage,
  setLoading,
  clearError,
} = cartSlice.actions;

// Async thunk for persisting cart to storage
export const persistCart = (items: CartItem[]) => async () => {
  try {
    await AsyncStorage.setItem('cart', JSON.stringify(items));
  } catch (error) {
    console.error('Failed to persist cart:', error);
  }
};

// Async thunk for loading cart from storage
export const loadCart = () => async (dispatch: any) => {
  try {
    dispatch(setLoading(true));
    const cartData = await AsyncStorage.getItem('cart');
    const items = cartData ? JSON.parse(cartData) : [];
    dispatch(loadCartFromStorage(items));
  } catch (error) {
    console.error('Failed to load cart:', error);
    dispatch(setLoading(false));
  }
};

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartSubtotal = (state: { cart: CartState }) => state.cart.subtotal;
export const selectCartTax = (state: { cart: CartState }) => state.cart.tax;
export const selectCartItemCount = (state: { cart: CartState }) => state.cart.itemCount;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.isLoading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;

export default cartSlice.reducer;