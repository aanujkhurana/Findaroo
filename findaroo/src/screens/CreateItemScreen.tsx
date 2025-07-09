import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Alert, Image, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useItems } from '../hooks/useItems';
import { useAuth } from '../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../utils/uploadImage';
import { getCurrentLocation } from '../utils/location';
import { Category, LocationCoords } from '../types';

interface CreateItemScreenProps {
  navigation: any;
}

const CATEGORIES: { value: Category; label: string; }[] = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'documents', label: 'Documents' },
  { value: 'keys', label: 'Keys' },
  { value: 'bags', label: 'Bags' },
  { value: 'pets', label: 'Pets' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

export const CreateItemScreen: React.FC<CreateItemScreenProps> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; category?: string; image?: string; }>();

  const filters = useMemo(() => ({}), []);
  const { createItem } = useItems(filters);
  const { user } = useAuth();

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  const validateForm = () => {
    const newErrors: { title?: string; category?: string; image?: string; } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!imageUri) {
      newErrors.image = 'Please upload an image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = async () => {
    // Request permissions
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Sorry!', 'We need permission to access your photos.');
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleGetLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation(loc);
      console.log('Current Location:', loc);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    console.log('Auth user:', user);
    if (!user?.id) {
      Alert.alert('You must be logged in to create an item.');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Upload image
    const imagePath = await uploadImage(imageUri!, `${user.id}/${title}_${Date.now()}.jpg`);

    if (!imagePath) {
      setLoading(false);
      return Alert.alert('Error', 'Failed to upload image.');
    }

    // Prepare item data
    const newItem = {
      title: title.trim(),
      description: description.trim(),
      category: category!,
      status: 'lost' as 'lost', // Default to lost for simplicity
      location: location!,
      image_url: imagePath,
      resolved: false,
      user_id: user.id,
    };

    // Create item
    const createdItem = await createItem(newItem);

    if (createdItem) {
      Alert.alert('Success!', 'Item created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to create item.');
    }

    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="mt-8 mb-6">
          <Text className="text-2xl font-bold text-gray-900">Create Item</Text>
          <Text className="text-gray-600">Report a lost or found item</Text>
        </View>

        {/* Form */}
        <View className="mb-10">
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter item title"
            error={errors?.title}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter item description"
            multiline
            numberOfLines={3}
            style={{ height: 80 }}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                className={`px-3 py-2 rounded-full border flex-row items-center mx-1 ${
                  category === cat.value ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  category === cat.value ? 'text-white' : 'text-gray-700'
                }`}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors?.category && <Text className="text-sm text-red-600">{errors.category}</Text>}

          {/* Image Upload */}
          <Button
            title={imageUri ? "Change Image" : "Upload Image"}
            onPress={handleImagePick}
            className="mb-4"
            variant={imageUri ? "secondary" : "primary"}
          />
          {imageUri && <Image source={{ uri: imageUri }} className="w-full h-40 mb-4 rounded-lg" />}
          {errors?.image && <Text className="text-sm text-red-600">{errors.image}</Text>}

          {/* Location */}
          <Button
            title="Get Current Location"
            onPress={handleGetLocation}
            className="mb-6"
          />
          {location && (
            <Text className="text-gray-600 mb-6">Location: {location.address || "Unknown Location"}</Text>
          )}

          <Button
            title="Submit"
            onPress={handleSubmit}
            loading={loading}
            disabled={!user?.id || loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

