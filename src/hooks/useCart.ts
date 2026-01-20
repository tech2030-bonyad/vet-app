import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  loadCart,
  persistCart,
  clearError,
  selectCartItems,
  selectCartTotal,
  selectCartSubtotal,
  selectCartTax,
  selectCartItemCount,
  selectCartLoading,
  selectCartError,
  Product,
  CartItem,
} from '../store/cartSlice';

/**
 * Custom hook for cart functionality
 * Provides cart state and actions with automatic persistence
 */
export const useCart = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const subtotal = useSelector(selectCartSubtotal);
  const tax = useSelector(selectCartTax);
  const itemCount = useSelector(selectCartItemCount);
  const isLoading = useSelector(selectCartLoading);
  const error = useSelector(selectCartError);

  // Load cart on mount
  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  // Persist cart whenever items change
  useEffect(() => {
    if (items.length >= 0) {
      dispatch(persistCart(items));
    }
  }, [items, dispatch]);

  // Actions
  const addItem = (product: Product, quantity: number = 1) => {
    dispatch(addToCart({ ...product, quantity }));
  };

  const removeItem = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    dispatch(updateQuantity({ id: productId, quantity }));
  };

  const clearAllItems = () => {
    dispatch(clearCart());
  };

  const dismissError = () => {
    dispatch(clearError());
  };

  // Helper functions
  const getItemQuantity = (productId: string): number => {
    const item = items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const isItemInCart = (productId: string): boolean => {
    return items.some(item => item.id === productId);
  };

  const getCartItem = (productId: string): CartItem | undefined => {
    return items.find(item => item.id === productId);
  };

  return {
    // State
    items,
    total,
    subtotal,
    tax,
    itemCount,
    isLoading,
    error,
    isEmpty: items.length === 0,
    
    // Actions
    addItem,
    removeItem,
    updateItemQuantity,
    clearAllItems,
    dismissError,
    
    // Helper functions
    getItemQuantity,
    isItemInCart,
    getCartItem,
  };
};