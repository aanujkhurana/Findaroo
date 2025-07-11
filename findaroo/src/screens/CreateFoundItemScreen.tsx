import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Switch, Modal } from 'react-native';
import { Feather, MaterialIcons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, getImageUrl } from '../utils/uploadImage';
import { useCreateItem } from '../hooks/useCreateItem';
import { useAuth } from '../hooks/useAuth';
import { Category, LocationCoords } from '../types';

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'electronics', label: 'Electronics', icon: <Feather name="smartphone" size={24} color="#6b7280" /> },
  { key: 'clothing', label: 'Clothing', icon: <Feather name="shopping-bag" size={24} color="#6b7280" /> },
  { key: 'accessories', label: 'Accessories', icon: <Feather name="eye" size={24} color="#6b7280" /> },
  { key: 'keys', label: 'Keys', icon: <Feather name="key" size={24} color="#6b7280" /> },
  { key: 'bags', label: 'Bags', icon: <Feather name="briefcase" size={24} color="#6b7280" /> },
  { key: 'jewelry', label: 'Jewelry', icon: <FontAwesome5 name="gem" size={24} color="#6b7280" /> },
  { key: 'sports', label: 'Sports', icon: <FontAwesome5 name="basketball-ball" size={24} color="#6b7280" /> },
  { key: 'documents', label: 'Documents', icon: <Feather name="file-text" size={24} color="#6b7280" /> },
  { key: 'pets', label: 'Pets', icon: <FontAwesome name="paw" size={24} color="#6b7280" /> },
  { key: 'other', label: 'Other', icon: <Feather name="more-horizontal" size={24} color="#6b7280" /> },
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
  { id: 1, title: 'What Did You Find?', subtitle: 'Describe the found item' },
  { id: 2, title: 'Where & When?', subtitle: 'Where and when did you find it?' },
  { id: 3, title: 'Help Return It', subtitle: 'Let us know if you want to help return it' },
];

export const CreateFoundItemScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { createItem, loading: createLoading } = useCreateItem();
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    category: null,
    title: '',
    description: '',
    location: null,
    dateFound: new Date(),
    image: undefined,
    willingToReturn: true,
    acceptTip: false,
  });
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-detect user location (simplified for now)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA'
      }
    }));
  }, []);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!user) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = asset.fileName || uri.split('/').pop() || `photo.jpg`;
        const path = await uploadImage(uri, filename, user.id, 'item-images');
        console.log('[ImageUpload] uploadImage returned:', path);
        if (path) {
          updateFormData('image', path);
        } else {
          Alert.alert('Upload failed', 'Could not upload image. Please try again.');
          console.error('[ImageUpload] Upload failed: path is null');
        }
      }
    } catch (err: any) {
      Alert.alert('Upload error', err.message || 'Unknown error');
      console.error('[ImageUpload] Error:', err);
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
      const itemData = {
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
      const newItem = await createItem(itemData);
      if (newItem) {
        Alert.alert(
          'Success!',
          'Your found item has been posted. We\'ll notify you when someone claims it.',
          [{ text: 'OK', onPress: () => navigation.navigate('HomeFeed') }]
        );
      } else {
        Alert.alert('Error', 'Failed to post item. Please try again.');
        console.error('[FormSubmit] createItem returned null');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
      console.error('[FormSubmit] Error:', error);
    }
  };

  // Step 1
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What did you find? *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Found Black Wallet"
          value={formData.title}
          onChangeText={(text) => updateFormData('title', text)}
          maxLength={100}
        />
        <Text style={styles.characterCount}>{formData.title.length}/100</Text>
      </View>

      {/* Image Upload */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Add a Photo (Optional)</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
          <Feather name="camera" size={24} color="#6b7280" />
          <Text style={styles.uploadButtonText}>Take Photo or Choose from Gallery</Text>
        </TouchableOpacity>
        {formData.image && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Image source={{ uri: getImageUrl(formData.image, 'item-images') }} style={{ width: 120, height: 120, borderRadius: 12 }} />
            {/* Debug info */}
            <View style={{ marginTop: 8, backgroundColor: '#f3f4f6', padding: 6, borderRadius: 6 }}>
              <Text style={{ fontSize: 12, color: '#888' }}>Path: {formData.image}</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>URL: {getImageUrl(formData.image, 'item-images')}</Text>
            </View>
          </View>
        )}
        <Text style={styles.tipText}>📷 A photo (even from a distance) helps the owner confirm</Text>
      </View>

      {/* Categories */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryItem,
                formData.category === category.key && styles.categoryItemSelected
              ]}
              onPress={() => updateFormData('category', category.key)}
            >
              {category.icon}
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
    </View>
  );

  // Step 2
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location *</Text>
        <View style={styles.locationBox}>
          <Feather name="map-pin" size={20} color="#6b7280" />
          <Text style={styles.locationText}>
            {formData.location?.address || 'Detecting your location...'}
          </Text>
        </View>
        <Text style={styles.tipText}>📍 Only an approximate location is shown publicly.</Text>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date Found *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Feather name="calendar" size={20} color="#6b7280" />
          <Text style={styles.dateButtonText}>
            {formData.dateFound.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Add details like brand, color, unique features, contents..."
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.characterCount}>{formData.description.length}/500</Text>
        <Text style={styles.tipText}>💡 Tip: Be specific about identifiable features or contents</Text>
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
        <TouchableOpacity onPress={handleBack}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Found Item</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressStep}>Step {currentStep} of 3</Text>
          <Text style={styles.progressLabel}>{STEPS[currentStep - 1].title}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
      </View>
      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <View style={styles.iconCircle}>
              <Feather name="search" size={28} color="#fbbf24" />
            </View>
            <Text style={styles.stepTitle}>{STEPS[currentStep - 1].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[currentStep - 1].subtitle}</Text>
          </View>
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          disabled={createLoading}
        >
          <Text style={styles.backBtnText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            (!canProceedToNext() || createLoading) && styles.nextBtnDisabled
          ]}
          disabled={!canProceedToNext() || createLoading}
          onPress={handleNext}
        >
          {createLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.nextBtnText}>
              {currentStep === 3 ? 'Post Found Item' : 'Next Step'}
            </Text>
          )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6faff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingBottom: 8 },
  headerTitle: { fontWeight: 'bold', fontSize: 20, color: '#222' },
  progressContainer: { paddingHorizontal: 24, marginBottom: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  progressStep: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15 },
  progressLabel: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  progressPercent: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15 },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginHorizontal: 24, marginBottom: 18 },
  progressBarFill: { width: '25%', height: 6, backgroundColor: '#38bdf8', borderRadius: 3 },
  contentContainer: { flex: 1 },
  scrollView: { flex: 1 },
  stepHeader: { alignItems: 'center', marginBottom: 18 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  stepTitle: { fontWeight: 'bold', fontSize: 24, color: '#222', textAlign: 'center' },
  stepSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  stepContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { color: '#6b7280', fontSize: 14, marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, backgroundColor: '#fff', fontSize: 15, marginBottom: 8 },
  textArea: { minHeight: 60, paddingTop: 0 },
  characterCount: { color: '#b0b0b0', fontSize: 12, textAlign: 'right', marginTop: -8 },
  tipText: { color: '#6b7280', fontSize: 13, marginTop: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  categoryItem: { width: '48%', aspectRatio: 1.2, backgroundColor: '#f9fafb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  categoryItemSelected: { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' },
  categoryLabel: { fontWeight: 'bold', fontSize: 13, color: '#222', marginTop: 8 },
  categoryLabelSelected: { color: '#38bdf8' },
  locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 8 },
  locationText: { color: '#222', fontSize: 15, marginLeft: 10 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 8 },
  dateButtonText: { color: '#222', fontSize: 15, marginLeft: 10 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 8 },
  uploadButtonText: { color: '#222', fontSize: 15, marginLeft: 10 },
  uploadedImage: { width: '100%', height: 100, borderRadius: 10 },
  previewContainer: { marginTop: 18 },
  previewTitle: { fontWeight: 'bold', fontSize: 17, color: '#222', marginBottom: 10 },
  previewCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  previewItemTitle: { fontWeight: 'bold', fontSize: 16, color: '#222', marginBottom: 4 },
  previewCategory: { color: '#6b7280', fontSize: 13, marginBottom: 4 },
  previewDescription: { color: '#6b7280', fontSize: 13, marginBottom: 4 },
  previewLocation: { color: '#6b7280', fontSize: 13 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  toggleLabel: { color: '#6b7280', fontSize: 13, marginLeft: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  backBtnText: { color: '#6b7280', fontSize: 15 },
  nextBtn: { backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  nextBtnDisabled: { backgroundColor: '#e5e7eb', opacity: 0.7 },
}); 