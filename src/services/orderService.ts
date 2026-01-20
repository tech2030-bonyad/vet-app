import { Order, OrderStatus } from '../types/order';

// Mock API service - replace with actual API calls
class OrderService {
  private baseUrl = 'https://api.yourstore.com';

  /**
   * Fetch user's order history
   */
  async getOrderHistory(): Promise<Order[]> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      return this.getMockOrders();
    } catch (error) {
      throw new Error('Failed to fetch order history');
    }
  }

  /**
   * Get specific order details
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const orders = this.getMockOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, make API call to cancel order
      console.log(`Cancelling order ${orderId}`);
    } catch (error) {
      throw new Error('Failed to cancel order');
    }
  }

  /**
   * Reorder items from a previous order
   */
  async reorderItems(orderId: string): Promise<{ success: boolean; cartId?: string }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, add items to cart
      return { success: true, cartId: 'new-cart-id' };
    } catch (error) {
      throw new Error('Failed to reorder items');
    }
  }

  /**
   * Mock order data - replace with actual API response
   */
  private getMockOrders(): Order[] {
    return [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        status: OrderStatus.DELIVERED,
        items: [
          {
            id: '1',
            productId: 'prod-1',
            name: 'Wireless Headphones',
            image: 'https://example.com/headphones.jpg',
            quantity: 1,
            price: 99.99,
            variant: 'Black'
          }
        ],
        subtotal: 99.99,
        tax: 8.00,
        shipping: 5.99,
        total: 113.98,
        currency: 'USD',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-18T14:20:00Z',
        trackingNumber: 'TRK123456789',
        shippingAddress: {
          id: '1',
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '+1234567890'
        },
        timeline: [
          {
            id: '1',
            status: OrderStatus.PENDING,
            timestamp: '2024-01-15T10:30:00Z',
            description: 'Order placed successfully'
          },
          {
            id: '2',
            status: OrderStatus.CONFIRMED,
            timestamp: '2024-01-15T11:00:00Z',
            description: 'Order confirmed and payment processed'
          },
          {
            id: '3',
            status: OrderStatus.PROCESSING,
            timestamp: '2024-01-16T09:00:00Z',
            description: 'Order is being prepared'
          },
          {
            id: '4',
            status: OrderStatus.SHIPPED,
            timestamp: '2024-01-17T15:30:00Z',
            description: 'Order shipped from warehouse',
            location: 'New York Distribution Center'
          },
          {
            id: '5',
            status: OrderStatus.DELIVERED,
            timestamp: '2024-01-18T14:20:00Z',
            description: 'Order delivered successfully'
          }
        ],
        canCancel: false,
        canReturn: true
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        status: OrderStatus.SHIPPED,
        items: [
          {
            id: '2',
            productId: 'prod-2',
            name: 'Smart Watch',
            image: 'https://example.com/watch.jpg',
            quantity: 1,
            price: 299.99,
            variant: 'Silver'
          }
        ],
        subtotal: 299.99,
        tax: 24.00,
        shipping: 0.00,
        total: 323.99,
        currency: 'USD',
        createdAt: '2024-01-20T14:15:00Z',
        updatedAt: '2024-01-22T10:45:00Z',
        estimatedDelivery: '2024-01-25T18:00:00Z',
        trackingNumber: 'TRK987654321',
        shippingAddress: {
          id: '1',
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '+1234567890'
        },
        timeline: [
          {
            id: '1',
            status: OrderStatus.PENDING,
            timestamp: '2024-01-20T14:15:00Z',
            description: 'Order placed successfully'
          },
          {
            id: '2',
            status: OrderStatus.CONFIRMED,
            timestamp: '2024-01-20T14:30:00Z',
            description: 'Order confirmed and payment processed'
          },
          {
            id: '3',
            status: OrderStatus.PROCESSING,
            timestamp: '2024-01-21T08:00:00Z',
            description: 'Order is being prepared'
          },
          {
            id: '4',
            status: OrderStatus.SHIPPED,
            timestamp: '2024-01-22T10:45:00Z',
            description: 'Order shipped from warehouse',
            location: 'California Distribution Center'
          }
        ],
        canCancel: false,
        canReturn: false
      }
    ];
  }
}

export const orderService = new OrderService();