import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateItem } from '../hooks/useCreateItem';
import { useAuth } from '../hooks/useAuth';
import { Category, LocationCoords } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, getImageUrl } from '../utils/uploadImage';

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'electronics', label: 'Electronics', icon: <Feather name="smartphone" size={24} color="#6b7280" /> },
  { key: 'clothing', label: 'Clothing', icon: <Feather name="shopping-bag" size={24} color="#6b7280" /> },
  { key: 'accessories', label: 'Accessories', icon: <Feather name="eye" size={24} color="#6b7280" /> },
  { key: 'keys', label: 'Keys', icon: <Feather name="key" size={24} color="#6b7280" /> },
  { key: 'bags', label: 'Bags', icon: <Feather name="briefcase" size={24} color="#6b7280" /> },
  { key: 'jewelry', label: 'Jewelry', icon: <FontAwesome5 name="gem" size={24} color="#6b7280" /> },
  { key: 'sports', label: 'Sports', icon: <FontAwesome5 name="basketball-ball" size={24} color="#6b7280" /> },
  { key: 'documents', label: 'Documents', icon: <Feather name="file-text" size={24} color="#6b7280" /> },
  { key: 'pets', label: 'Pets', icon: <FontAwesome5 name="paw" size={24} color="#6b7280" /> },
  { key: 'other', label: 'Other', icon: <Feather name="more-horizontal" size={24} color="#6b7280" /> },
];

interface FormData {
  title: string;
  category: Category | null;
  description: string;
  location: LocationCoords | null; // Keep this for form handling
  dateLost: Date;
  timeRange: string;
  image?: string; // Changed from imageUrl to match database schema
  rewardAmount?: number;
  offerReward: boolean;
}

const STEPS = [
  { id: 1, title: 'What Did You Lose?', subtitle: 'Tell us about your lost item' },
  { id: 2, title: 'Where & When', subtitle: 'Help others know where to look' },
  { id: 3, title: 'Final Details', subtitle: 'Add any extras and post your item' },
];

export const CreateLostItemScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { createItem, loading: createLoading } = useCreateItem();
  const [currentStep, setCurrentStep] = useState(1);
  // Remove the local loading state since we're using the hook's loading state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: null,
    description: '',
    location: null,
    dateLost: new Date(),
    timeRange: '',
    image: undefined,
    rewardAmount: undefined,
    offerReward: false,
  });

  // Auto-detect user location (simplified for now)
  useEffect(() => {
    // In a real app, you'd use geolocation here
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
        return formData.title.trim() && formData.category;
      case 2:
        return formData.location && formData.dateLost;
      case 3:
        return true; // Step 3 is optional details
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
        status: 'lost' as const,
        location: formData.location,
        image: formData.image,
        reward_amount: formData.offerReward ? formData.rewardAmount : undefined,
        user_id: user.id,
        resolved: false,
      };

      const newItem = await createItem(itemData);
      
      if (newItem) {
        Alert.alert(
          'Success!', 
          'Your lost item has been posted. We\'ll notify you when someone finds it.',
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

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What did you lose? *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Lost Black Wallet"
          value={formData.title}
          onChangeText={(text) => updateFormData('title', text)}
          maxLength={100}
        />
        <Text style={styles.characterCount}>{formData.title.length}/100</Text>
      </View>

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
        <Text style={styles.tipText}>📍 Your exact location won't be public — only approximate area is shown</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>When did you lose it? *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Feather name="calendar" size={20} color="#6b7280" />
          <Text style={styles.dateButtonText}>
            {formData.dateLost.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Time Range (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Between 3pm–5pm"
          value={formData.timeRange}
          onChangeText={(text) => updateFormData('timeRange', text)}
        />
      </View>

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
        <Text style={styles.tipText}>📸 Photos boost return rates by 2x — even stock images help!</Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Offer a Reward? (Optional)</Text>
        <View style={styles.rewardContainer}>
          <TouchableOpacity
            style={[
              styles.rewardToggle,
              formData.offerReward && styles.rewardToggleActive
            ]}
            onPress={() => updateFormData('offerReward', !formData.offerReward)}
          >
            <View style={[
              styles.toggleCircle,
              formData.offerReward && styles.toggleCircleActive
            ]} />
          </TouchableOpacity>
          <Text style={styles.rewardLabel}>A small tip can help finders act faster 💸</Text>
        </View>
        
        {formData.offerReward && (
          <View style={styles.rewardInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.rewardInput}
              placeholder="0"
              value={formData.rewardAmount?.toString() || ''}
              onChangeText={(text) => updateFormData('rewardAmount', parseFloat(text) || 0)}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Preview Summary</Text>
        <View style={styles.previewCard}>
          <Text style={styles.previewItemTitle}>{formData.title || 'Your lost item'}</Text>
          <Text style={styles.previewCategory}>
            {formData.category ? CATEGORIES.find(c => c.key === formData.category)?.label : 'Category'}
          </Text>
          {formData.description && (
            <Text style={styles.previewDescription}>{formData.description}</Text>
          )}
          <Text style={styles.previewLocation}>
            📍 {formData.location?.address || 'Location'}
          </Text>
          {formData.offerReward && formData.rewardAmount && (
            <Text style={styles.previewReward}>
              💰 Reward: ${formData.rewardAmount}
            </Text>
          )}
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
        <Text style={styles.headerTitle}>Report Lost Item</Text>
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
              {currentStep === 3 ? 'Post Lost Item' : 'Next Step'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dateLost}
          mode="date"
          display="default"
          onChange={(event: any, selectedDate?: Date) => {
            setShowDatePicker(false);
            if (selectedDate) {
              updateFormData('dateLost', selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6faff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 18, 
    paddingBottom: 8 
  },
  headerTitle: { fontWeight: 'bold', fontSize: 20, color: '#222' },
  progressContainer: { paddingHorizontal: 24, marginBottom: 8 },
  progressRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 2 
  },
  progressStep: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15 },
  progressLabel: { color: '#888', fontWeight: '500', fontSize: 15 },
  progressBarBg: { 
    height: 6, 
    backgroundColor: '#e5e7eb', 
    borderRadius: 3, 
    marginBottom: 18 
  },
  progressBarFill: { 
    height: 6, 
    backgroundColor: '#38bdf8', 
    borderRadius: 3 
  },
  contentContainer: { flex: 1 },
  scrollView: { flex: 1 },
  stepHeader: { 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 24 
  },
  iconCircle: { 
    backgroundColor: '#fef3c7', 
    borderRadius: 18, 
    width: 56, 
    height: 56, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  stepTitle: { 
    fontWeight: 'bold', 
    fontSize: 22, 
    color: '#222', 
    marginBottom: 4, 
    textAlign: 'center' 
  },
  stepSubtitle: { 
    color: '#6b7280', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  stepContainer: { paddingHorizontal: 24 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#222', 
    marginBottom: 8 
  },
  textInput: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  characterCount: { 
    textAlign: 'right', 
    color: '#6b7280', 
    fontSize: 12, 
    marginTop: 4 
  },
  tipText: { 
    color: '#6b7280', 
    fontSize: 13, 
    marginTop: 8, 
    fontStyle: 'italic' 
  },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  categoryItem: { 
    width: '48%', 
    aspectRatio: 1.2, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12 
  },
  categoryItemSelected: { 
    borderColor: '#38bdf8', 
    backgroundColor: '#e0f2fe' 
  },
  categoryLabel: { 
    color: '#6b7280', 
    fontWeight: '600', 
    fontSize: 14, 
    marginTop: 8 
  },
  categoryLabelSelected: { 
    color: '#38bdf8' 
  },
  locationBox: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  locationText: { 
    color: '#222', 
    fontSize: 16, 
    marginLeft: 12, 
    flex: 1 
  },
  dateButton: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  dateButtonText: { 
    color: '#222', 
    fontSize: 16, 
    marginLeft: 12 
  },
  uploadButton: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderStyle: 'dashed' 
  },
  uploadButtonText: { 
    color: '#6b7280', 
    fontSize: 16, 
    marginTop: 8 
  },
  rewardContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  rewardToggle: { 
    width: 44, 
    height: 24, 
    backgroundColor: '#e5e7eb', 
    borderRadius: 12, 
    padding: 2, 
    marginRight: 12 
  },
  rewardToggleActive: { 
    backgroundColor: '#38bdf8' 
  },
  toggleCircle: { 
    width: 20, 
    height: 20, 
    backgroundColor: '#fff', 
    borderRadius: 10 
  },
  toggleCircleActive: { 
    transform: [{ translateX: 20 }] 
  },
  rewardLabel: { 
    color: '#6b7280', 
    fontSize: 14, 
    flex: 1 
  },
  rewardInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  currencySymbol: { 
    color: '#6b7280', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  rewardInput: { 
    flex: 1, 
    paddingVertical: 16, 
    fontSize: 18, 
    marginLeft: 8 
  },
  previewContainer: { marginTop: 8 },
  previewTitle: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#222', 
    marginBottom: 12 
  },
  previewCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  previewItemTitle: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#222', 
    marginBottom: 4 
  },
  previewCategory: { 
    color: '#38bdf8', 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  previewDescription: { 
    color: '#6b7280', 
    fontSize: 14, 
    marginBottom: 8 
  },
  previewLocation: { 
    color: '#6b7280', 
    fontSize: 14 
  },
  previewReward: { 
    color: '#10b981', 
    fontSize: 14, 
    fontWeight: '600', 
    marginTop: 4 
  },
  footerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  backBtn: { 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 12 
  },
  backBtnText: { 
    color: '#6b7280', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  nextBtn: { 
    backgroundColor: '#38bdf8', 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 14 
  },
  nextBtnDisabled: { 
    backgroundColor: '#cbd5e1' 
  },
  nextBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
}); 