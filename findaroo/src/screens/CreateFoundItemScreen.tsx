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

const CATEGORIES = [
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

export const CreateFoundItemScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(undefined);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; category?: string; image?: string; }>();

  const filters = useMemo(() => ({}), []);
  const { createItem } = useItems(filters);
  const { user } = useAuth();

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  const validateForm = () => {
    const newErrors: { title?: string; category?: string; image?: string; } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!category) newErrors.category = 'Please select a category';
    if (!imageUri) newErrors.image = 'Please upload an image';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = async () => {
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
    if (loc) setLocation(loc);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('You must be logged in to create an item.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const imagePath = await uploadImage(imageUri!, `${user.id}/${title}_${Date.now()}.jpg`);
    if (!imagePath) {
      setLoading(false);
      return Alert.alert('Error', 'Failed to upload image.');
    }
    const newItem = {
      title: title.trim(),
      description: description.trim(),
      category: category!,
      status: 'found' as 'found',
      location: location!,
      image_url: imagePath,
      resolved: false,
      user_id: user.id,
    };
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6faff' }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ marginTop: 32, marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222' }}>Report Found Item</Text>
          <Text style={{ color: '#6b7280' }}>Fill in the details below</Text>
        </View>
        <View style={{ marginBottom: 40 }}>
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Enter item title" error={errors?.title} />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Enter item description" multiline numberOfLines={3} style={{ height: 80 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 6 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: category === cat.value ? '#22c55e' : '#e5e7eb', backgroundColor: category === cat.value ? '#22c55e' : '#fff', marginRight: 8 }}
              >
                <Text style={{ color: category === cat.value ? '#fff' : '#222', fontWeight: 'bold' }}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors?.category && <Text style={{ color: '#ef4444', marginBottom: 8 }}>{errors.category}</Text>}
          <Button title={imageUri ? "Change Image" : "Upload Image"} onPress={handleImagePick} style={{ marginBottom: 16 }} variant={imageUri ? "secondary" : "primary"} />
          {imageUri && <Image source={{ uri: imageUri }} style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 16 }} />}
          {errors?.image && <Text style={{ color: '#ef4444', marginBottom: 8 }}>{errors.image}</Text>}
          <Button title="Get Current Location" onPress={handleGetLocation} style={{ marginBottom: 16 }} />
          {location && <Text style={{ color: '#6b7280', marginBottom: 16 }}>Location: {location.address || "Unknown Location"}</Text>}
          <Button title="Submit" onPress={handleSubmit} loading={loading} disabled={!user?.id || loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}; 