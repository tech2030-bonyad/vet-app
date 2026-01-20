import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { Order, OrderStatus } from '../../types/order';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  onReorder?: (orderId: string) => void;
}

/**
 * OrderCard component displays a summary of an order in the order history list
 */
export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onReorder,
}) => {
  /**
   * Get status color based on order status
   */
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.PENDING:
        return '#FFA500';
      case OrderStatus.CONFIRMED:
        return '#4169E1';
      case OrderStatus.PROCESSING:
        return '#9932CC';
      case OrderStatus.SHIPPED:
        return '#1E90FF';
      case OrderStatus.OUT_FOR_DELIVERY:
        return '#FF6347';
      case OrderStatus.DELIVERED:
        return '#32CD32';
      case OrderStatus.CANCELLED:
        return '#DC143C';
      case OrderStatus.RETURNED:
        return '#B22222';
      default:
        return '#808080';
    }
  };

  /**
   * Format status text for display
   */
  const getStatusText = (status: OrderStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Handle reorder button press
   */
  const handleReorder = () => {
    if (onReorder) {
      Alert.alert(
        'Reorder Items',
        'Add all items from this order to your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add to Cart', onPress: () => onReorder(order.id) },
        ]
      );
    }
  };

  /**
   * Get the first item image for display
   */
  const getFirstItemImage = (): string => {
    return order.items[0]?.image || 'https://via.placeholder.com/60';
  };

  /**
   * Get items summary text
   */
  const getItemsSummary = (): string => {
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    if (order.items.length === 1) {
      return `${order.items[0].name}${order.items[0].quantity > 1 ? ` (${order.items[0].quantity})` : ''}`;
    }
    return `${order.items.length} items (${totalItems} total)`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(order)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: getFirstItemImage() }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.details}>
          <Text style={styles.itemsSummary} numberOfLines={2}>
            {getItemsSummary()}
          </Text>
          <Text style={styles.total}>
            ${order.total.toFixed(2)} {order.currency}
          </Text>
          {order.trackingNumber && (
            <Text style={styles.tracking}>
              Tracking: {order.trackingNumber}
            </Text>
          )}
        </View>
      </View>

      {onReorder && order.status === OrderStatus.DELIVERED && (
        <TouchableOpacity
          style={styles.reorderButton}
          onPress={handleReorder}
          activeOpacity={0.7}
        >
          <Text style={styles.reorderText}>Reorder</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  itemsSummary: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tracking: {
    fontSize: 12,
    color: '#666666',
  },
  reorderButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reorderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});