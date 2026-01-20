import { PaymentIntent, Order } from '../types/checkout';

class PaymentService {
  private baseUrl = 'https://your-api-endpoint.com/api';

  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(amount: number): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data.paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment with Stripe
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment confirmation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Create order after successful payment
   */
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Get saved payment methods
   */
  async getPaymentMethods(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/methods`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    // Implement your token retrieval logic here
    // This could be from AsyncStorage, secure storage, etc.
    return 'your-auth-token';
  }
}

export const paymentService = new PaymentService();