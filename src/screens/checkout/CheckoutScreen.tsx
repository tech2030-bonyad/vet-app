import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createPaymentIntent } from '../../store/slices/checkoutSlice';
import { AppDispatch } from '../../store';

interface CheckoutScreenProps {}

const CheckoutScreen: React.FC<CheckoutScreenProps> = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    cartItems,
    shippingAddress,
    subtotal,
    tax,
    shipping,
    total,
    loading,
    error,
  } = useSelector((state: RootState) => state.checkout);

  useEffect(() => {
    // Load cart items and shipping address from previous screens
    // This would typically come from navigation params or global state
  }, []);

  /**
   * Handle proceed to payment
   */
  const handleProceedToPayment = async () => {
    if (!shippingAddress) {
      Alert.alert('Error', 'Please add a shipping address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    try {
      await dispatch(createPaymentIntent(total)).unwrap();
      navigation.navigate('Payment');
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
    }
  };

  /**
   * Render cart item
   */
  const renderCartItem = (item: any) => (
    <View key={item.id} style={styles.cartItem}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.itemPricing}>
          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
          <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  /**
   * Render shipping address
   */
  const renderShippingAddress = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ShippingAddress')}>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>
      {shippingAddress ? (
        <View style={styles.addressContainer}>
          <Text style={styles.addressName}>
            {shippingAddress.firstName} {shippingAddress.lastName}
          </Text>
          <Text style={styles.addressText}>{shippingAddress.address}</Text>
          <Text style={styles.addressText}>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
          </Text>
          <Text style={styles.addressText}>{shippingAddress.country}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addAddressButton}
          onPress={() => navigation.navigate('ShippingAddress')}
        >
          <Text style={styles.addAddressText}>Add Shipping Address</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /**
   * Render order summary
   */
  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tax</Text>
        <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping</Text>
        <Text style={styles.summaryValue}>
          {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
        </Text>
      </View>
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({cartItems.length})</Text>
          {cartItems.map(renderCartItem)}
        </View>

        {/* Shipping Address */}
        {renderShippingAddress()}

        {/* Order Summary */}
        {renderOrderSummary()}
      </ScrollView>

      {/* Proceed to Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton, loading && styles.disabledButton]}
          onPress={handleProceedToPayment}
          disabled={loading}
        >
          <Text style={styles.proceedButtonText}>
            {loading ? 'Processing...' : `Proceed to Payment • $${total.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addressContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addAddressButton: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  addAddressText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  proceedButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CheckoutScreen;