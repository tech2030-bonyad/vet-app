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
import { Calendar, DateData } from 'react-native-calendars';
import { TimeSlot } from '../../types/appointment';
import { appointmentService } from '../../services/appointmentService';

interface DateTimePickerProps {
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  serviceId: string | null;
  onDateSelect: (date: string) => void;
  onTimeSlotSelect: (timeSlot: string) => void;
}

/**
 * DateTimePicker component for selecting appointment date and time
 * Integrates calendar widget with time slot selection based on availability
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTimeSlot,
  serviceId,
  onDateSelect,
  onTimeSlotSelect,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get maximum date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  /**
   * Fetch available time slots when date or service changes
   */
  useEffect(() => {
    if (selectedDate && serviceId) {
      fetchTimeSlots(selectedDate, serviceId);
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, serviceId]);

  /**
   * Fetch available time slots for selected date and service
   */
  const fetchTimeSlots = async (date: string, serviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const availability = await appointmentService.getAvailableTimeSlots(date, serviceId);
      setTimeSlots(availability.timeSlots);
    } catch (err) {
      setError('Failed to load available time slots');
      Alert.alert('Error', 'Failed to load available time slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle date selection from calendar
   */
  const handleDateSelect = (day: DateData) => {
    onDateSelect(day.dateString);
    // Reset time slot selection when date changes
    if (selectedTimeSlot) {
      onTimeSlotSelect('');
    }
  };

  /**
   * Handle time slot selection
   */
  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (!timeSlot.available) {
      Alert.alert('Unavailable', 'This time slot is not available. Please select another time.');
      return;
    }
    onTimeSlotSelect(timeSlot.time);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      
      {/* Calendar Component */}
      <Calendar
        minDate={today}
        maxDate={maxDateString}
        onDayPress={handleDateSelect}
        markedDates={{
          [selectedDate || '']: {
            selected: true,
            selectedColor: '#007AFF',
          },
        }}
        theme={{
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: '#007AFF',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: '#007AFF',
          monthTextColor: '#2d4150',
          indicatorColor: '#007AFF',
        }}
        style={styles.calendar}
      />

      {/* Selected Date Display */}
      {selectedDate && (
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            Selected: {formatDate(selectedDate)}
          </Text>
        </View>
      )}

      {/* Time Slots Section */}
      {selectedDate && serviceId && (
        <View style={styles.timeSlotsContainer}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading available times...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchTimeSlots(selectedDate, serviceId)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsScrollContainer}
            >
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    !slot.available && styles.timeSlotUnavailable,
                    selectedTimeSlot === slot.time && styles.timeSlotSelected,
                  ]}
                  onPress={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      !slot.available && styles.timeSlotTextUnavailable,
                      selectedTimeSlot === slot.time && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                  {slot.veterinarianName && (
                    <Text
                      style={[
                        styles.veterinarianText,
                        !slot.available && styles.veterinarianTextUnavailable,
                        selectedTimeSlot === slot.time && styles.veterinarianTextSelected,
                      ]}
                    >
                      {slot.veterinarianName}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Instructions */}
      {!selectedDate && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Please select a date to view available time slots
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
  calendar: {
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  timeSlotsContainer: {
    marginTop: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
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
  timeSlotsScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeSlot: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotUnavailable: {
    backgroundColor: '#F1F3F4',
    borderColor: '#E9ECEF',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextUnavailable: {
    color: '#6C757D',
  },
  veterinarianText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  veterinarianTextSelected: {
    color: '#FFFFFF',
  },
  veterinarianTextUnavailable: {
    color: '#ADB5BD',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
});