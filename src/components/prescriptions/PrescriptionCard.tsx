import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Prescription } from '../../types/prescription';
import { formatDate, getDaysUntilExpiry } from '../../utils/dateUtils';

interface PrescriptionCardProps {
  prescription: Prescription;
  onPress: (prescription: Prescription) => void;
  onRefillRequest: (prescription: Prescription) => void;
}

/**
 * PrescriptionCard component displays prescription information in a card format
 * Includes status indicators, expiry warnings, and refill actions
 */
export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onPress,
  onRefillRequest,
}) => {
  const daysUntilExpiry = getDaysUntilExpiry(prescription.expiryDate);
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

  /**
   * Handle refill request with confirmation
   */
  const handleRefillRequest = () => {
    if (!prescription.isRefillable) {
      Alert.alert(
        'Cannot Refill',
        'This prescription is not eligible for refill. Please contact your veterinarian.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (prescription.refillsRemaining <= 0) {
      Alert.alert(
        'No Refills Remaining',
        'This prescription has no refills remaining. Please contact your veterinarian for a new prescription.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Request Refill',
      `Request a refill for ${prescription.medicationName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', onPress: () => onRefillRequest(prescription) },
      ]
    );
  };

  /**
   * Get status color based on prescription status and expiry
   */
  const getStatusColor = () => {
    if (isExpired) return '#FF6B6B';
    if (isExpiringSoon) return '#FFB347';
    if (prescription.status === 'active') return '#4ECDC4';
    return '#95A5A6';
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    if (isExpired) return 'Expired';
    if (isExpiringSoon) return `Expires in ${daysUntilExpiry} days`;
    return prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(prescription)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{prescription.medicationName}</Text>
          <Text style={styles.petName}>for {prescription.petName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.dosageInfo}>
        <Text style={styles.dosage}>{prescription.dosage}</Text>
        <Text style={styles.frequency}>{prescription.frequency}</Text>
      </View>

      <View style={styles.prescriptionDetails}>
        <Text style={styles.veterinarian}>Prescribed by {prescription.veterinarianName}</Text>
        <Text style={styles.prescribedDate}>
          {formatDate(prescription.prescribedDate)}
        </Text>
      </View>

      {/* Refill Information */}
      <View style={styles.refillInfo}>
        <Text style={styles.refillText}>
          Refills: {prescription.refillsRemaining}/{prescription.totalRefills}
        </Text>
        {prescription.lastRefillDate && (
          <Text style={styles.lastRefill}>
            Last refill: {formatDate(prescription.lastRefillDate)}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {prescription.isRefillable && prescription.refillsRemaining > 0 && !isExpired && (
          <TouchableOpacity
            style={styles.refillButton}
            onPress={handleRefillRequest}
          >
            <Text style={styles.refillButtonText}>Request Refill</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expiry Warning */}
      {isExpiringSoon && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Expires in {daysUntilExpiry} days
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  petName: {
    fontSize: 14,
    color: '#7F8C8D',
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
  },
  dosageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dosage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495E',
    marginRight: 12,
  },
  frequency: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  prescriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  veterinarian: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  prescribedDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  refillInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  refillText: {
    fontSize: 14,
    color: '#34495E',
    fontWeight: '500',
  },
  lastRefill: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  refillButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refillButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    padding: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB347',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
});