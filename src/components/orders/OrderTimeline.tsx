import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { OrderTimeline as OrderTimelineType, OrderStatus } from '../../types/order';

interface OrderTimelineProps {
  timeline: OrderTimelineType[];
  currentStatus: OrderStatus;
}

/**
 * OrderTimeline component displays the order status progression
 */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  timeline,
  currentStatus,
}) => {
  /**
   * Get status color based on order status
   */
  const getStatusColor = (status: OrderStatus, isActive: boolean): string => {
    if (!isActive) return '#E5E5E5';
    
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
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Check if a timeline item is active (completed)
   */
  const isTimelineItemActive = (item: OrderTimelineType): boolean => {
    const timelineOrder = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    const currentIndex = timelineOrder.indexOf(currentStatus);
    const itemIndex = timelineOrder.indexOf(item.status);

    // Special cases for cancelled and returned orders
    if (currentStatus === OrderStatus.CANCELLED || currentStatus === OrderStatus.RETURNED) {
      return item.status === currentStatus || itemIndex < timelineOrder.indexOf(OrderStatus.PROCESSING);
    }

    return itemIndex <= currentIndex;
  };

  /**
   * Check if this is the current active step
   */
  const isCurrentStep = (item: OrderTimelineType): boolean => {
    return item.status === currentStatus;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Order Timeline</Text>
      
      <View style={styles.timeline}>
        {timeline.map((item, index) => {
          const isActive = isTimelineItemActive(item);
          const isCurrent = isCurrentStep(item);
          const isLast = index === timeline.length - 1;

          return (
            <View key={item.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineIcon,
                    {
                      backgroundColor: getStatusColor(item.status, isActive),
                      borderColor: isCurrent ? getStatusColor(item.status, true) : 'transparent',
                      borderWidth: isCurrent ? 2 : 0,
                    },
                  ]}
                >
                  {isActive && <View style={styles.timelineIconInner} />}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: isActive ? getStatusColor(item.status, true) : '#E5E5E5' },
                    ]}
                  />
                )}
              </View>
              
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text
                    style={[
                      styles.timelineStatus,
                      { color: isActive ? '#1a1a1a' : '#999999' },
                    ]}
                  >
                    {item.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text
                    style={[
                      styles.timelineTimestamp,
                      { color: isActive ? '#666666' : '#CCCCCC' },
                    ]}
                  >
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
                
                <Text
                  style={[
                    styles.timelineDescription,
                    { color: isActive ? '#666666' : '#CCCCCC' },
                  ]}
                >
                  {item.description}
                </Text>
                
                {item.location && (
                  <Text
                    style={[
                      styles.timelineLocation,
                      { color: isActive ? '#999999' : '#CCCCCC' },
                    ]}
                  >
                    📍 {item.location}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  timeline: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textTransform: 'capitalize',
  },
  timelineTimestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  timelineDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timelineLocation: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});