import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CartItem } from '../../components/cart/CartItem';
import { CartSummary } from '../../components/cart/CartSummary';
import { useCart } from '../../hooks/useCart';
import { CartItem as CartItemType } from '../../store/cartSlice';

/**
 * Shopping cart screen component
 * Displays cart items, summary, and handles cart operations
 */
export const CartScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    items,
    total,
    subtotal,
    tax,
    itemCount,
    isLoading,
    error,
    isEmpty,
    updateItemQuantity,
    removeItem,
    clearAllItems,
    dismissError,
  } = useCart();

  // Handle quantity update
  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    updateItemQuantity(id, quantity);
  }, [updateItemQuantity]);

  // Handle item removal
  const handleRemoveItem = useCallback((id: string) => {
    removeItem(id);
  }, [removeItem]);

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (isEmpty) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
      return;
    }

    // Navigate to checkout screen (implement based on your navigation structure)
    Alert.alert(
      'Checkout',
      `Proceeding to checkout with ${itemCount} items totaling $${total.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // navigation.navigate('Checkout');
            console.log('Navigate to checkout');
          }
        },
      ]
    );
  }, [isEmpty, itemCount, total]);

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: clearAllItems 
        },
      ]
    );
  }, [clearAllItems]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    // Refresh cart data if needed
    dismissError();
  }, [dismissError]);

  // Render cart item
  const renderCartItem = useCallback(({ item }: { item: CartItemType }) => (
    <CartItem
      item={item}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemoveItem}
    />
  ), [handleUpdateQuantity, handleRemoveItem]);

  // Render empty cart
  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add some items to get started
      </Text>
    </View>
  );

  // Render error message
  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Shopping Cart</Text>
      {!isEmpty && (
        <Text style={styles.headerSubtitle}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderError()}
      
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyCart}
        ListFooterComponent={
          !isEmpty ? (
            <CartSummary
              subtotal={subtotal}
              tax={tax}
              total={total}
              itemCount={itemCount}
              onCheckout={handleCheckout}
              isCheckoutDisabled={isLoading}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: '500',
  },
});