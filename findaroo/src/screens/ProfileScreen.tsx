import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabaseClient';
import { getImageUrl, uploadImage } from '../utils/uploadImage';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile_picture ?? '');
  const [loading, setLoading] = useState(false);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleAvatarPick = async () => {
    // Request permissions
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission required', 'We need permission to access your photos.');
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setLoading(true);

    let avatarPath = user.profile_picture;

    // If avatar has changed, upload new file
    if (avatarUrl && avatarUrl !== user.profile_picture) {
      avatarPath = await uploadImage(avatarUrl, `avatars/${user.id}.jpg`, 'profile-pics');
    }

    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      profile_picture: avatarPath,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Profile Updated', 'Your profile has been updated successfully.');
      setEditing(false);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="mt-8 mb-6">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <Text className="text-gray-600">Manage your account details</Text>
        </View>

        {/* Avatar */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handleAvatarPick} disabled={!editing}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-[120px] h-[120px] rounded-full mb-2"
              />
            ) : (
              <View className="w-[120px] h-[120px] rounded-full bg-blue-500 mb-2 justify-center items-center">
                <Text className="text-white text-2xl font-bold">
                  {user?.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {editing && <Text className="text-xs text-gray-600">Tap to change</Text>}
        </View>

        {/* Form */}
        <View>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            error={fullName.length < 2 ? 'Name is too short' : undefined}
            editable={editing}
          />

          <Input
            label="Email"
            value={user?.email || ''}
            placeholder="Enter your email"
            editable={false}
          />

          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            error={phone && phone.length < 10 ? 'Phone number is too short' : undefined}
            editable={editing}
          />

          {user?.karma !== undefined && (
            <Input
              label="Karma Points"
              value={user.karma.toString()}
              editable={false}
            />
          )}
        </View>

        {/* Actions */}
        <View className="mt-6 space-y-2">
          {editing ? (
            <Button
              title="Save Changes"
              onPress={handleProfileUpdate}
              loading={loading}
              disabled={!!(fullName.length < 2 || (phone && phone.length < 10))}
            />
          ) : (
            <Button title="Edit Profile" onPress={handleEditToggle} />
          )}

          <Button title="Sign Out" onPress={handleSignOut} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

