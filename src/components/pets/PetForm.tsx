import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { PetFormData } from '../../types/pet';

interface PetFormProps {
  initialData?: Partial<PetFormData>;
  onSubmit: (data: PetFormData, photos: string[]) => void;
  loading?: boolean;
  submitButtonText?: string;
}

/**
 * Reusable form component for adding/editing pet information
 */
export const PetForm: React.FC<PetFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  submitButtonText = 'Save Pet',
}) => {
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PetFormData>({
    defaultValues: {
      name: initialData?.name || '',
      species: initialData?.species || '',
      breed: initialData?.breed || '',
      age: initialData?.age || 0,
      weight: initialData?.weight || 0,
      color: initialData?.color || '',
      gender: initialData?.gender || 'male',
      isNeutered: initialData?.isNeutered || false,
      microchipId: initialData?.microchipId || '',
    },
  });

  /**
   * Handle photo selection from device gallery
   */
  const handlePhotoSelection = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0]) {
          const newPhoto = response.assets[0].uri!;
          setPhotos(prev => [...prev, newPhoto]);
        }
      }
    );
  };

  /**
   * Remove a photo from the selection
   */
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Handle form submission
   */
  const onFormSubmit = (data: PetFormData) => {
    onSubmit(data, photos);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Pet Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pet Name *</Text>
        <Controller
          control={control}
          name="name"
          rules={{ required: 'Pet name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter pet name"
              placeholderTextColor="#999"
            />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
      </View>

      {/* Species */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Species *</Text>
        <Controller
          control={control}
          name="species"
          rules={{ required: 'Species is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.species && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="e.g., Dog, Cat, Bird"
              placeholderTextColor="#999"
            />
          )}
        />
        {errors.species && <Text style={styles.errorText}>{errors.species.message}</Text>}
      </View>

      {/* Breed */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Breed *</Text>
        <Controller
          control={control}
          name="breed"
          rules={{ required: 'Breed is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.breed && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter breed"
              placeholderTextColor="#999"
            />
          )}
        />
        {errors.breed && <Text style={styles.errorText}>{errors.breed.message}</Text>}
      </View>

      {/* Age and Weight Row */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Age (years) *</Text>
          <Controller
            control={control}
            name="age"
            rules={{ 
              required: 'Age is required',
              min: { value: 0, message: 'Age must be positive' }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.age && styles.inputError]}
                onBlur={onBlur}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                value={value.toString()}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            )}
          />
          {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <Controller
            control={control}
            name="weight"
            rules={{ 
              required: 'Weight is required',
              min: { value: 0, message: 'Weight must be positive' }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.weight && styles.inputError]}
                onBlur={onBlur}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                value={value.toString()}
                placeholder="0.0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            )}
          />
          {errors.weight && <Text style={styles.errorText}>{errors.weight.message}</Text>}
        </View>
      </View>

      {/* Color */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Color *</Text>
        <Controller
          control={control}
          name="color"
          rules={{ required: 'Color is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.color && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter pet color"
              placeholderTextColor="#999"
            />
          )}
        />
        {errors.color && <Text style={styles.errorText}>{errors.color.message}</Text>}
      </View>

      {/* Gender */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender *</Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOption, value === 'male' && styles.radioSelected]}
                onPress={() => onChange('male')}
              >
                <Text style={[styles.radioText, value === 'male' && styles.radioTextSelected]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioOption, value === 'female' && styles.radioSelected]}
                onPress={() => onChange('female')}
              >
                <Text style={[styles.radioText, value === 'female' && styles.radioTextSelected]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Neutered Status */}
      <View style={styles.inputGroup}>
        <Controller
          control={control}
          name="isNeutered"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                {value && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Spayed/Neutered</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Microchip ID */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Microchip ID (Optional)</Text>
        <Controller
          control={control}
          name="microchipId"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter microchip ID"
              placeholderTextColor="#999"
            />
          )}
        />
      </View>

      {/* Photos Section */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Photos</Text>
        <TouchableOpacity style={styles.photoButton} onPress={handlePhotoSelection}>
          <Text style={styles.photoButtonText}>+ Add Photo</Text>
        </TouchableOpacity>
        
        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removePhotoText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit(onFormSubmit)}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Saving...' : submitButtonText}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  radioSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  radioText: {
    color: '#333',
    fontSize: 16,
  },
  radioTextSelected: {
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  photoButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});