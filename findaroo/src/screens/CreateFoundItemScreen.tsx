import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Switch, Modal } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, getSignedImageUrl } from '../utils/uploadImage';
import { useCreateItem } from '../hooks/useCreateItem';
import { useAuth } from '../hooks/useAuth';
import { Category, LocationCoords } from '../types';
import { supabase } from '../services/supabaseClient';
import { getCurrentLocation, requestLocationPermissions } from '../utils/location';
import { LocationPicker } from '../components/LocationPicker';

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'electronics', label: 'Electronics', icon: <Feather name="smartphone" size={16} color="#3A8DFF" />, color: '#F8FAFF' },
  { key: 'clothing', label: 'Clothing', icon: <Feather name="shopping-bag" size={16} color="#33C48D" />, color: '#F8FDF9' },
  { key: 'accessories', label: 'Accessories', icon: <Feather name="eye" size={16} color="#FFA930" />, color: '#FFFCF5' },
  { key: 'keys', label: 'Keys', icon: <Feather name="key" size={16} color="#3A8DFF" />, color: '#F8FAFF' },
  { key: 'bags', label: 'Bags', icon: <Feather name="briefcase" size={16} color="#33C48D" />, color: '#F8FDF9' },
  { key: 'jewelry', label: 'Jewelry', icon: <FontAwesome5 name="gem" size={16} color="#FFA930" />, color: '#FFFCF5' },
  { key: 'sports', label: 'Sports', icon: <FontAwesome5 name="basketball-ball" size={16} color="#3A8DFF" />, color: '#F8FAFF' },
  { key: 'documents', label: 'Documents', icon: <Feather name="file-text" size={16} color="#33C48D" />, color: '#F8FDF9' },
  { key: 'pets', label: 'Pets', icon: <Feather name="heart" size={16} color="#FFA930" />, color: '#FFFCF5' },
  { key: 'other', label: 'Other', icon: <Feather name="more-horizontal" size={16} color="#2E2E2E" />, color: '#F2F2F2' },
];

interface FormData {
  category: Category | null;
  title: string;
  description: string;
  location: LocationCoords | null;
  dateFound: Date;
  image?: string;
  willingToReturn: boolean;
  acceptTip: boolean;
}

const STEPS = [
  { id: 1, title: 'Item Details', subtitle: 'Tell us what you found', icon: 'search' },
  { id: 2, title: 'Location & Time', subtitle: 'Where and when did you find it?', icon: 'map-pin' },
  { id: 3, title: 'Return Options', subtitle: 'Help us return it to the owner', icon: 'heart' },
];

export const CreateFoundItemScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { createItem, loading: createLoading } = useCreateItem();

  // Check if we're in edit mode
  const editMode = route?.params?.editMode || false;
  const itemData = route?.params?.itemData || null;
  const originalLocationName = editMode && itemData ? itemData.location_name : null;

  // Create dedicated update function
  const updateItem = async (id: string, updates: any) => {
    try {
      // Convert location to PostGIS format if it exists
      let processedUpdates = { ...updates };
      if (updates.location && updates.location.latitude && updates.location.longitude) {
        // Convert to PostGIS POINT format: POINT(longitude latitude)
        processedUpdates.location = `POINT(${updates.location.longitude} ${updates.location.latitude})`;
      }

      const { data, error } = await supabase
        .from('items')
        .update(processedUpdates)
        .eq('id', id)
        .select(`
          *,
          user:users(id, full_name, profile_pic)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating item:', error);
      throw error;
    }
  };
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => {
    if (editMode && itemData) {
      return {
        category: itemData.category || null,
        title: itemData.title || '',
        description: itemData.description || '',
        location: null, // Don't set location from itemData - let user re-select if needed
        dateFound: itemData.created_at ? new Date(itemData.created_at) : new Date(),
        image: itemData.image || undefined,
        willingToReturn: true,
        acceptTip: false,
      };
    }
    return {
      category: null,
      title: '',
      description: '',
      location: null,
      dateFound: new Date(),
      image: undefined,
      willingToReturn: true,
      acceptTip: false,
    };
  });
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [debugSignedUrl, setDebugSignedUrl] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  // Fetch signed URL for preview when image changes
  useEffect(() => {
    let isMounted = true;
    async function fetchSignedUrl() {
      if (formData.image) {
        const url = await getSignedImageUrl(formData.image, 'item-images');
        if (isMounted) {
          setImagePreview(url);
          setDebugSignedUrl(url);
        }
      } else {
        setImagePreview(null);
        setDebugSignedUrl('');
      }
    }
    fetchSignedUrl();
    return () => { isMounted = false; };
  }, [formData.image]);

  // Auto-detect user location
  useEffect(() => {
    const getLocation = async () => {
      setLocationLoading(true);
      setLocationError(null);

      try {
        console.log('[CreateFoundItemScreen] Getting current location...');
        const location = await getCurrentLocation();

        if (location) {
          console.log('[CreateFoundItemScreen] Location obtained:', location);
          setFormData(prev => ({
            ...prev,
            location: location
          }));
        } else {
          console.log('[CreateFoundItemScreen] Failed to get location, using fallback');
          setLocationError('Unable to get your location. Please check location permissions.');
          // Fallback to a default location if needed
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: 'San Francisco, CA (Default)'
            }
          }));
        }
      } catch (error) {
        console.error('[CreateFoundItemScreen] Error getting location:', error);
        setLocationError('Error getting location. Please try again.');
      } finally {
        setLocationLoading(false);
      }
    };

    getLocation();
  }, []);

  // Function to manually refresh location
  const refreshLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        setLocationError('Location permission is required to detect your location.');
        return;
      }

      const location = await getCurrentLocation();
      if (location) {
        setFormData(prev => ({
          ...prev,
          location: location
        }));
        setLocationError(null);
      } else {
        setLocationError('Unable to get your location. Please try again.');
      }
    } catch (error) {
      console.error('[CreateFoundItemScreen] Error refreshing location:', error);
      setLocationError('Error getting location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (location: LocationCoords) => {
    setFormData(prev => ({ ...prev, location }));
    setLocationError(null);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.category && formData.title.trim();
      case 2:
        return formData.location && formData.dateFound;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePickImage = async () => {
    if (!user) {
      console.log('[ImagePicker] No user found');
      return;
    }

    try {
      console.log('[ImagePicker] Requesting media library permissions...');
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[ImagePicker] Permission status:', status);

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select images.');
        return;
      }

      console.log('[ImagePicker] Showing image picker modal...');
      setShowImagePickerModal(true);
    } catch (error) {
      console.error('[ImagePicker] Permission error:', error);
      Alert.alert('Error', 'An error occurred while requesting permissions.');
    }
  };

  const handleImagePickerOption = async (option: 'camera' | 'gallery') => {
    if (!user) return;
    console.log('[ImagePickerOption] Selected option:', option);
    setShowImagePickerModal(false);

    try {
      setImageUploading(true);
      let result;

      if (option === 'camera') {
        console.log('[ImagePickerOption] Requesting camera permissions...');
        // Request camera permissions
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('[ImagePickerOption] Camera permission status:', status);

        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }

        console.log('[ImagePickerOption] Launching camera...');
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        console.log('[ImagePickerOption] Launching image library...');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      }

      console.log('[ImagePickerOption] Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = asset.fileName || uri.split('/').pop() || `photo_${Date.now()}.jpg`;

        console.log('[ImageUpload] Starting upload for:', filename);
        const path = await uploadImage(uri, filename, user.id, 'item-images');
        console.log('[ImageUpload] uploadImage returned:', path);

        if (path) {
          updateFormData('image', path);
          Alert.alert('Success', 'Image uploaded successfully!');
        } else {
          Alert.alert('Upload failed', 'Could not upload image. Please try again.');
          console.error('[ImageUpload] Upload failed: path is null');
        }
      }
    } catch (err: any) {
      console.error('[ImageUpload] Error:', err);
      Alert.alert('Upload error', err.message || 'An error occurred while uploading the image.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post an item');
      return;
    }
    if (!formData.title.trim() || !formData.category || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      if (editMode && itemData) {
        // Update existing item
        const updates: any = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          image: formData.image,
        };

        // Only include location if it has been set (user selected a new location)
        if (formData.location && formData.location.latitude && formData.location.longitude) {
          updates.location = formData.location;
          updates.location_name = formData.location.address || null;
        }

        const updatedItem = await updateItem(itemData.id, updates);

        if (updatedItem) {
          Alert.alert('Success', 'Item updated successfully', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Error', 'Failed to update item. Please try again.');
        }
      } else {
        // Create new item
        const newItemData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          status: 'found' as const,
          location: formData.location,
          image: formData.image,
          willing_to_return: formData.willingToReturn,
          accept_tip: formData.acceptTip,
          date_found: formData.dateFound.toISOString(),
          resolved: false,
          user_id: user.id,
        };
        const newItem = await createItem(newItemData);
        if (newItem) {
          navigation.navigate('Success');
        } else {
          Alert.alert('Error', 'Failed to post item. Please try again.');
          console.error('[FormSubmit] createItem returned null');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
      console.error('[FormSubmit] Error:', error);
    }
  };

  // Step 1
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What did you find? *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Black leather wallet, iPhone 13..."
            placeholderTextColor="#9CA3AF"
            value={formData.title}
            onChangeText={(text) => updateFormData('title', text)}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{formData.title.length}/100</Text>
        </View>
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryItem,
                { backgroundColor: formData.category === category.key ? category.color : '#FFFFFF' },
                formData.category === category.key && styles.categoryItemSelected
              ]}
              onPress={() => updateFormData('category', category.key)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconContainer}>
                {category.icon}
              </View>
              <Text style={[
                styles.categoryLabel,
                formData.category === category.key && styles.categoryLabelSelected
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Image Upload */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Add a Photo (Optional)</Text>
        <TouchableOpacity
          style={[styles.uploadButton, imageUploading && styles.uploadButtonDisabled]}
          onPress={handlePickImage}
          activeOpacity={0.8}
          disabled={imageUploading}
        >
          <View style={styles.uploadIconContainer}>
            {imageUploading ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <Feather name="camera" size={20} color="#4F46E5" />
            )}
          </View>
          <View style={styles.uploadTextContainer}>
            <Text style={styles.uploadButtonText}>
              {imageUploading ? 'Uploading...' : 'Take Photo or Choose from Gallery'}
            </Text>
            <Text style={styles.uploadSubtext}>Helps the owner identify their item</Text>
          </View>
          {!imageUploading && <Feather name="chevron-right" size={16} color="#9CA3AF" />}
        </TouchableOpacity>

        {formData.image && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: imagePreview || undefined }}
              style={styles.imagePreview}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => updateFormData('image', undefined)}
            >
              <Feather name="x" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tipContainer}>
          <Feather name="info" size={14} color="#6B7280" />
          <Text style={styles.tipText}>A photo helps the owner confirm it's their item</Text>
        </View>
      </View>
    </View>
  );

  // Step 2
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      {/* Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Where did you find it? *</Text>
        <TouchableOpacity
          style={[styles.locationBox, locationError && styles.locationBoxError]}
          onPress={refreshLocation}
          disabled={locationLoading}
          activeOpacity={0.8}
        >
          <View style={styles.locationIconContainer}>
            <Feather
              name="map-pin"
              size={18}
              color={locationError ? "#EF4444" : "#4F46E5"}
            />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={[
              styles.locationText,
              locationError && styles.locationTextError
            ]}>
              {locationLoading
                ? 'Getting your location...'
                : locationError
                  ? 'Unable to get location'
                  : formData.location?.address || 'Tap to detect location'
              }
            </Text>
            {!locationLoading && !locationError && (
              <Text style={styles.locationSubtext}>Tap to refresh</Text>
            )}
          </View>
          {locationLoading ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <Feather name="refresh-cw" size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualLocationButton}
          onPress={() => setShowLocationPicker(true)}
          activeOpacity={0.8}
        >
          <Feather name="edit-3" size={16} color="#4F46E5" />
          <Text style={styles.manualLocationText}>Choose Different Location</Text>
        </TouchableOpacity>

        <View style={styles.tipContainer}>
          <Feather name="shield" size={14} color="#6B7280" />
          <Text style={styles.tipText}>Only approximate location is shown publicly for privacy</Text>
        </View>
      </View>

      {/* Date Found */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>When did you find it? *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dateIconContainer}>
            <Feather name="calendar" size={18} color="#4F46E5" />
          </View>
          <Text style={styles.dateButtonText}>
            {formData.dateFound.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe the item's condition, brand, color, unique features..."
            placeholderTextColor="#9CA3AF"
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{formData.description.length}/500</Text>
        </View>
        <View style={styles.tipContainer}>
          <Feather name="eye" size={14} color="#6B7280" />
          <Text style={styles.tipText}>Specific details help the owner identify their item</Text>
        </View>
      </View>
    </View>
  );

  // Step 3
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Willing to Return?</Text>
        <View style={styles.toggleRow}>
          <Switch
            value={formData.willingToReturn}
            onValueChange={val => updateFormData('willingToReturn', val)}
            trackColor={{ false: '#e5e7eb', true: '#38bdf8' }}
            thumbColor={formData.willingToReturn ? '#38bdf8' : '#fff'}
          />
          <Text style={styles.toggleLabel}>You’ll be contacted securely via Findaroo chat</Text>
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Accept a Tip? (optional)</Text>
        <View style={styles.toggleRow}>
          <Switch
            value={formData.acceptTip}
            onValueChange={val => updateFormData('acceptTip', val)}
            trackColor={{ false: '#e5e7eb', true: '#fbbf24' }}
            thumbColor={formData.acceptTip ? '#fbbf24' : '#fff'}
          />
          <Text style={styles.toggleLabel}>You can accept a small tip for your help</Text>
        </View>
      </View>
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Preview Summary</Text>
        <View style={styles.previewCard}>
          <Text style={styles.previewItemTitle}>{formData.title || 'Your found item'}</Text>
          <Text style={styles.previewCategory}>
            {formData.category ? CATEGORIES.find(c => c.key === formData.category)?.label : 'Category'}
          </Text>
          {formData.description && (
            <Text style={styles.previewDescription}>{formData.description}</Text>
          )}
          <Text style={styles.previewLocation}>
            📍 {formData.location?.address || 'Location'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editMode ? 'Edit Found Item' : 'Report Found Item'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressStep}>Step {currentStep} of 3</Text>
          <Text style={styles.progressPercentage}>{Math.round((currentStep / 3) * 100)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={[styles.progressBarFill, { width: `${(currentStep / 3) * 100}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      </View>
      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconContainer}>
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF']}
                style={styles.stepIconCircle}
              >
                <Feather name={STEPS[currentStep - 1].icon as any} size={24} color="#3A8DFF" />
              </LinearGradient>
            </View>
            <Text style={styles.stepTitle}>{STEPS[currentStep - 1].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[currentStep - 1].subtitle}</Text>
          </View>
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBackButton}
          onPress={handleBack}
          disabled={createLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (!canProceedToNext() || createLoading) && styles.nextButtonDisabled
          ]}
          disabled={!canProceedToNext() || createLoading}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={(!canProceedToNext() || createLoading)
              ? ['#E5E7EB', '#E5E7EB']
              : ['#4F46E5', '#7C3AED']
            }
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {createLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 3 ? (editMode ? 'Update Item' : 'Post Found Item') : 'Continue'}
                </Text>
                <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dateFound}
          mode="date"
          display="default"
          onChange={(event: any, selectedDate?: Date) => {
            setShowDatePicker(false);
            if (selectedDate) {
              updateFormData('dateFound', selectedDate);
            }
          }}
        />
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <LocationPicker
          currentLocation={formData.location}
          onLocationChange={handleLocationChange}
          onClose={() => setShowLocationPicker(false)}
        />
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.imagePickerTitle}>Add Photo</Text>
            <Text style={styles.imagePickerSubtitle}>Choose how you'd like to add a photo</Text>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => handleImagePickerOption('camera')}
              activeOpacity={0.8}
            >
              <View style={styles.imagePickerIconContainer}>
                <Feather name="camera" size={24} color="#3A8DFF" />
              </View>
              <View style={styles.imagePickerTextContainer}>
                <Text style={styles.imagePickerOptionTitle}>Take Photo</Text>
                <Text style={styles.imagePickerOptionSubtitle}>Use your camera to take a new photo</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => handleImagePickerOption('gallery')}
              activeOpacity={0.8}
            >
              <View style={styles.imagePickerIconContainer}>
                <Feather name="image" size={24} color="#33C48D" />
              </View>
              <View style={styles.imagePickerTextContainer}>
                <Text style={styles.imagePickerOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.imagePickerOptionSubtitle}>Select an existing photo</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerCancel}
              onPress={() => setShowImagePickerModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.imagePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#111827',
    flex: 1,
    textAlign: 'center'
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF'
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  progressStep: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14
  },
  progressPercentage: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14
  },
  progressBarContainer: {
    paddingHorizontal: 4
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2
  },
  contentContainer: {
    flex: 1
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20
  },
  stepHeader: {
    alignItems: 'center',
    paddingVertical: 32
  },
  stepIconContainer: {
    marginBottom: 16
  },
  stepIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  stepTitle: {
    fontWeight: '700',
    fontSize: 24,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  inputContainer: {
    position: 'relative'
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16
  },
  characterCount: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    position: 'absolute',
    right: 0,
    bottom: -20
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 4
  },
  tipText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  categoryItem: {
    width: '31%',
    aspectRatio: 1.1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  categoryItemSelected: {
    borderColor: '#3A8DFF',
    shadowColor: '#3A8DFF',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  categoryIconContainer: {
    marginBottom: 4
  },
  categoryLabel: {
    fontWeight: '500',
    fontSize: 11,
    color: '#2E2E2E',
    textAlign: 'center',
    lineHeight: 14
  },
  categoryLabelSelected: {
    color: '#3A8DFF',
    fontWeight: '600'
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed'
  },
  uploadIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  uploadTextContainer: {
    flex: 1
  },
  uploadButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2
  },
  uploadSubtext: {
    color: '#9CA3AF',
    fontSize: 13
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginTop: 16,
    position: 'relative'
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F3F4F6'
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center'
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  locationBoxError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2'
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  locationTextContainer: {
    flex: 1
  },
  locationText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2
  },
  locationSubtext: {
    color: '#9CA3AF',
    fontSize: 12
  },
  locationTextError: {
    color: '#EF4444'
  },
  manualLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  manualLocationText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  dateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  dateButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
    flex: 1
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  optionTextContainer: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18
  },
  previewContainer: {
    marginTop: 24
  },
  previewTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#374151',
    marginBottom: 16
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  previewIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  previewItemTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#374151',
    flex: 1
  },
  previewDetails: {
    gap: 12
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  previewText: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  footerBackButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
    marginLeft: 16
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16
  },
  nextButtonDisabled: {
    opacity: 0.6
  },
  // Legacy styles for Step 3 (to be replaced)
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  toggleLabel: {
    color: '#6B7280',
    fontSize: 13,
    marginLeft: 10
  },
  previewCategory: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 4
  },
  previewDescription: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 4
  },
  previewLocation: {
    color: '#6B7280',
    fontSize: 13
  },
  uploadButtonDisabled: {
    opacity: 0.6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  imagePickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8
  },
  imagePickerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  imagePickerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  imagePickerTextContainer: {
    flex: 1
  },
  imagePickerOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  imagePickerOptionSubtitle: {
    fontSize: 13,
    color: '#6B7280'
  },
  imagePickerCancel: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    alignItems: 'center'
  },
  imagePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280'
  },
});