import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Clinic } from '../../types/clinic';

interface ClinicCardProps {
  clinic: Clinic;
  onPress: (clinic: Clinic) => void;
  showDistance?: boolean;
}

/**
 * ClinicCard component displays clinic information in a card format
 * Includes clinic details, rating, distance, and action buttons
 */
export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  onPress,
  showDistance = true,
}) => {
  /**
   * Handle phone call action
   */
  const handleCall = (): void => {
    const phoneUrl = `tel:${clinic.phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((error) => {
        console.error('Error opening phone app:', error);
        Alert.alert('Error', 'Unable to make phone call');
      });
  };

  /**
   * Handle directions action
   */
  const handleDirections = (): void => {
    const url = `https://maps.google.com/?q=${clinic.latitude},${clinic.longitude}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Maps application is not available');
        }
      })
      .catch((error) => {
        console.error('Error opening maps:', error);
        Alert.alert('Error', 'Unable to open directions');
      });
  };

  /**
   * Render star rating
   */
  const renderStars = (rating: number): JSX.Element[] => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={i} name="star" size={16} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half" size={16} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-border" size={16} color="#FFD700" />
      );
    }

    return stars;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(clinic)}
      activeOpacity={0.7}
    >
      {/* Clinic Image */}
      {clinic.image && (
        <Image source={{ uri: clinic.image }} style={styles.image} />
      )}

      <View style={styles.content}>
        {/* Header with name and status */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {clinic.name}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: clinic.isOpen ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>
              {clinic.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* Rating and reviews */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {renderStars(clinic.rating)}
          </View>
          <Text style={styles.ratingText}>
            {clinic.rating.toFixed(1)} ({clinic.reviewCount} reviews)
          </Text>
        </View>

        {/* Address */}
        <View style={styles.addressContainer}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.address} numberOfLines={2}>
            {clinic.address}
          </Text>
        </View>

        {/* Distance */}
        {showDistance && clinic.distance && (
          <View style={styles.distanceContainer}>
            <Icon name="directions" size={16} color="#666" />
            <Text style={styles.distance}>
              {clinic.distance.toFixed(1)} km away
            </Text>
          </View>
        )}

        {/* Services preview */}
        <View style={styles.servicesContainer}>
          <Text style={styles.servicesLabel}>Services:</Text>
          <Text style={styles.services} numberOfLines={1}>
            {clinic.services.slice(0, 3).map(s => s.name).join(', ')}
            {clinic.services.length > 3 && '...'}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Icon name="phone" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.directionsButton]}
            onPress={handleDirections}
          >
            <Icon name="directions" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  servicesContainer: {
    marginBottom: 16,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  services: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  directionsButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});