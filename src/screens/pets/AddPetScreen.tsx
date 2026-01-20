import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { PetForm } from '../../components/pets/PetForm';
import { addPet } from '../../store/slices/petSlice';
import { PetFormData } from '../../types/pet';
import { RootState, AppDispatch } from '../../store';

/**
 * Screen for adding a new pet to the user's profile
 */
export const AddPetScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.pets);

  /**
   * Handle form submission for adding a new pet
   */
  const handleAddPet = async (formData: PetFormData, photos: string[]) => {
    try {
      const petData = {
        ...formData,
        photos,
        medicalHistory: [],
      };

      const result = await dispatch(addPet(petData));
      
      if (addPet.fulfilled.match(result)) {
        Alert.alert(
          'Success',
          'Pet added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(result.payload as string);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to add pet. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Pet</Text>
        <Text style={styles.subtitle}>
          Fill in your pet's information to create their profile
        </Text>
      </View>

      <PetForm
        onSubmit={handleAddPet}
        loading={loading}
        submitButtonText="Add Pet"
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14,
    fontWeight: '500',
  },
});