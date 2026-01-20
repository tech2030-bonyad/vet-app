import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Service } from '../../types/appointment';
import { appointmentService } from '../../services/appointmentService';

interface ServiceSelectorProps {
  selectedServiceId: string | null;
  onServiceSelect: (serviceId: string) => void;
}

/**
 * ServiceSelector component for choosing appointment services
 * Displays available services with pricing and descriptions
 */
export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServiceId,
  onServiceSelect,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load services on component mount
   */
  useEffect(() => {
    loadServices();
  }, []);

  /**
   * Fetch available services from API
   */
  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedServices = await appointmentService.getServices();
      setServices(fetchedServices);
    } catch (err) {
      setError('Failed to load services');
      Alert.alert('Error', 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle service selection
   */
  const handleServiceSelect = (service: Service) => {
    onServiceSelect(service.id);
  };

  /**
   * Get category display name
   */
  const getCategoryDisplayName = (category: Service['category']): string => {
    const categoryNames = {
      medical: 'Medical',
      grooming: 'Grooming',
      boarding: 'Boarding',
      training: 'Training',
    };
    return categoryNames[category] || category;
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: Service['category']): string => {
    const categoryColors = {
      medical: '#DC3545',
      grooming: '#28A745',
      boarding: '#FFC107',
      training: '#17A2B8',
    };
    return categoryColors[category] || '#6C757D';
  };

  /**
   * Format duration for display
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  /**
   * Format price for display
   */
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadServices}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Service</Text>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.servicesContainer}
      >
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              selectedServiceId === service.id && styles.serviceCardSelected,
            ]}
            onPress={() => handleServiceSelect(service)}
          >
            {/* Service Header */}
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text
                  style={[
                    styles.serviceName,
                    selectedServiceId === service.id && styles.serviceNameSelected,
                  ]}
                >
                  {service.name}
                </Text>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(service.category) },
                  ]}
                >
                  <Text style={styles.categoryText}>
                    {getCategoryDisplayName(service.category)}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.servicePrice,
                  selectedServiceId === service.id && styles.servicePriceSelected,
                ]}
              >
                {formatPrice(service.price)}
              </Text>
            </View>

            {/* Service Description */}
            <Text
              style={[
                styles.serviceDescription,
                selectedServiceId === service.id && styles.serviceDescriptionSelected,
              ]}
            >
              {service.description}
            </Text>

            {/* Service Duration */}
            <View style={styles.serviceDuration}>
              <Text
                style={[
                  styles.durationText,
                  selectedServiceId === service.id && styles.durationTextSelected,
                ]}
              >
                Duration: {formatDuration(service.duration)}
              </Text>
            </View>

            {/* Selection Indicator */}
            {selectedServiceId === service.id && (
              <View style={styles.selectionIndicator}>
                <Text style={styles.selectionText}>✓ Selected</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Instructions */}
      {!selectedServiceId && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Please select a service to continue with booking
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  servicesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F8F9FF',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
  },
  serviceNameSelected: {
    color: '#007AFF',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#28A745',
  },
  servicePriceSelected: {
    color: '#007AFF',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 8,
  },
  serviceDescriptionSelected: {
    color: '#495057',
  },
  serviceDuration: {
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  durationTextSelected: {
    color: '#007AFF',
  },
  selectionIndicator: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  selectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
});