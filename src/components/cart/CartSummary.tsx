import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  isCheckoutDisabled?: boolean;
}

/**
 * Cart summary component showing totals and checkout button
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  tax,
  total,
  itemCount,
  onCheckout,
  isCheckoutDisabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <Text style={styles.header}>Order Summary</Text>
      
      {/* Item Count */}
      <View style={styles.row}>
        <Text style={styles.label}>
          Items ({itemCount})
        </Text>
        <Text style={styles.value}>
          ${subtotal.toFixed(2)}
        </Text>
      </View>
      
      {/* Tax */}
      <View style={styles.row}>
        <Text style={styles.label}>Tax (8.5%)</Text>
        <Text style={styles.value}>
          ${tax.toFixed(2)}
        </Text>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>
          ${total.toFixed(2)}
        </Text>
      </View>
      
      {/* Checkout Button */}
      <TouchableOpacity
        style={[
          styles.checkoutButton,
          isCheckoutDisabled && styles.checkoutButtonDisabled,
        ]}
        onPress={onCheckout}
        disabled={isCheckoutDisabled}
        accessibilityLabel="Proceed to checkout"
      >
        <Text style={[
          styles.checkoutButtonText,
          isCheckoutDisabled && styles.checkoutButtonTextDisabled,
        ]}>
          Proceed to Checkout
        </Text>
      </TouchableOpacity>
      
      {/* Security Note */}
      <Text style={styles.securityNote}>
        🔒 Secure checkout with SSL encryption
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  checkoutButtonTextDisabled: {
    color: '#999',
  },
  securityNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});