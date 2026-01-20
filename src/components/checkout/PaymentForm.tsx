import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { processPayment } from '../../store/slices/checkoutSlice';
import { AppDispatch } from '../../store';

interface PaymentFormProps {
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
}

interface PaymentFormData {
  saveCard: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { confirmPayment } = useStripe();
  const dispatch = useDispatch<AppDispatch>();
  
  const { total, paymentProcessing, shippingAddress } = useSelector(
    (state: RootState) => state.checkout
  );

  const { control, handleSubmit, watch } = useForm<PaymentFormData>({
    defaultValues: {
      saveCard: false,
    },
  });

  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);

  /**
   * Handle card field changes
   */
  const handleCardChange = (cardDetails: any) => {
    setCardDetails(cardDetails);
    setCardComplete(cardDetails.complete);
  };

  /**
   * Process payment submission
   */
  const onSubmit = async (data: PaymentFormData) => {
    if (!cardComplete || !cardDetails) {
      Alert.alert('Error', 'Please enter valid card details');
      return;
    }

    if (!shippingAddress) {
      Alert.alert('Error', 'Shipping address is required');
      return;
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await confirmPayment(
        'client_secret_from_backend', // This should come from your payment intent
        {
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: {
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              email: 'customer@example.com', // Get from user profile
              address: {
                line1: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.zipCode,
                country: shippingAddress.country,
              },
            },
          },
        }
      );

      if (paymentMethodError) {
        onPaymentError(paymentMethodError.message || 'Payment failed');
        return;
      }

      if (paymentMethod) {
        // Save payment method if requested
        if (data.saveCard) {
          // Implement save payment method logic
        }

        onPaymentSuccess(paymentMethod);
      }
    } catch (error: any) {
      onPaymentError(error.message || 'Payment processing failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Information</Text>

      {/* Card Input */}
      <View style={styles.cardContainer}>
        <Text style={styles.label}>Card Details</Text>
        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
            expiration: 'MM/YY',
            cvc: 'CVC',
            postalCode: '12345',
          }}
          cardStyle={styles.cardField}
          style={styles.cardFieldContainer}
          onCardChange={handleCardChange}
        />
      </View>

      {/* Save Card Option */}
      <Controller
        control={control}
        name="saveCard"
        render={({ field: { value, onChange } }) => (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => onChange(!value)}
          >
            <View style={[styles.checkbox, value && styles.checkboxChecked]}>
              {value && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Save card for future purchases</Text>
          </TouchableOpacity>
        )}
      />

      {/* Payment Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[
          styles.payButton,
          (!cardComplete || paymentProcessing) && styles.disabledButton,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={!cardComplete || paymentProcessing}
      >
        {paymentProcessing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.payButtonText}>Pay ${total.toFixed(2)}</Text>
        )}
      </TouchableOpacity>

      {/* Security Notice */}
      <Text style={styles.securityNotice}>
        🔒 Your payment information is secure and encrypted
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  cardContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardFieldContainer: {
    height: 50,
  },
  cardField: {
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  securityNotice: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PaymentForm;