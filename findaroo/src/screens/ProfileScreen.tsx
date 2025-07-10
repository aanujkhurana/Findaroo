import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Alert, Platform, TouchableOpacity, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabaseClient';
import { getImageUrl, uploadImage } from '../utils/uploadImage';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    typeof user?.profile_pic === 'string' ? user.profile_pic : undefined
  );
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
      setAvatarUrl(result.assets[0].uri ?? undefined);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setLoading(true);

    let avatarPath = user.profile_pic;

    // If avatar has changed, upload new file
    if (avatarUrl && avatarUrl !== user.profile_pic) {
      avatarPath = await uploadImage(avatarUrl, `avatars/${user.id}.jpg`, 'profile-pics');
    }

    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      profile_pic: avatarPath,
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
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2 bg-white shadow-sm">
        <TouchableOpacity>
          <MaterialIcons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Profile & Settings</Text>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={28} color="#222" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile Card */}
        <View className="bg-[#F7F8FA] rounded-2xl shadow-sm p-5 mb-5" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <View className="flex-row items-center">
            {/* Avatar with badge overlay */}
            <View className="mr-4">
              <View>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-indigo-600 justify-center items-center">
                    <Text className="text-white text-2xl font-bold">
                      {user?.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {/* Blue badge overlay */}
                <View style={{ position: 'absolute', bottom: 0, right: 0 }} className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white justify-center items-center">
                  <MaterialIcons name="check" size={16} color="#fff" />
                </View>
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-900">Sarah Chen</Text>
              <View className="flex-row items-center mt-1">
                <MaterialIcons name="location-pin" size={18} color="#aaa" />
                <Text className="text-gray-400 text-sm ml-1">Melbourne, VIC</Text>
              </View>
            </View>
          </View>
          {/* Reputation & Karma Row */}
          <View className="flex-row mt-4 space-x-3">
            {/* Reputation Score */}
            <View className="flex-1 bg-[#1EC773] rounded-xl px-4 py-2 items-center justify-center">
              <Text className="text-white text-xs font-semibold">Reputation Score</Text>
              <Text className="font-bold text-2xl text-white mt-1">4.8</Text>
              <View className="flex-row items-center justify-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <MaterialIcons key={i} name="star" size={16} color="#FFD700" />
                ))}
                <Text className="text-white text-xs ml-2">Based on 23 returns</Text>
              </View>
            </View>
            {/* Karma Points */}
            <View className="flex-1 bg-[#2563eb] rounded-xl px-4 py-2 items-center justify-center">
              <Text className="text-white text-xs font-semibold">Karma Points</Text>
              <Text className="font-bold text-2xl text-white mt-1">1,247</Text>
            </View>
          </View>
        </View>
        {/* Account Settings Card */}
        <View className="bg-[#F7F8FA] rounded-2xl shadow-sm p-5 mb-5" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="font-bold text-base text-gray-900 mb-3">Account Settings</Text>
          {/* Payment Methods Header */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900">Payment Methods</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Add New</Text>
            </TouchableOpacity>
          </View>
          {/* Payment Methods List */}
          <View className="mb-3">
            {/* Credit/Debit Card */}
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-100 justify-center items-center">
                  <MaterialIcons name="credit-card" size={20} color="#2563eb" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-900 font-semibold">•••• 4242</Text>
                  <Text className="text-xs text-gray-400">Expires 12/25</Text>
                </View>
              </View>
              <View className="flex-row items-center space-x-2">
                <View className="bg-green-100 px-2 py-0.5 rounded-full">
                  <Text className="text-green-700 text-xs font-semibold">Default</Text>
                </View>
              </View>
            </View>
            {/* PayID */}
            <TouchableOpacity className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-orange-100 justify-center items-center">
                  <Text className="text-orange-600 font-bold text-base">P</Text>
                </View>
                <View className="ml-3">
                  <Text className="text-gray-900 font-semibold">sarah.chen@email.com</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#bbb" />
            </TouchableOpacity>
          </View>
          {/* ID Verification */}
          <View className="bg-green-50 rounded-xl flex-row items-center p-3 mt-2">
            <View className="w-7 h-7 rounded-full bg-green-500 justify-center items-center mr-3">
              <MaterialIcons name="check" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-green-700 font-semibold">Verified</Text>
              <Text className="text-xs text-gray-500">Driver’s License verified</Text>
            </View>
          </View>
        </View>
        {/* Preferences Card */}
        <View className="bg-[#F7F8FA] rounded-2xl shadow-sm p-5 mb-5" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="font-bold text-base text-gray-900 mb-3">Preferences</Text>
          {/* Notifications Section */}
          <Text className="font-semibold text-gray-900 mb-2">Notifications</Text>
          {/* Push Notifications Toggle */}
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-gray-900 font-semibold">Push Notifications</Text>
              <Text className="text-xs text-gray-500">Get notified about new items nearby</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#ccc', true: '#2563eb' }}
              thumbColor={true ? '#2563eb' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
          {/* Email Updates Toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-gray-900 font-semibold">Email Updates</Text>
              <Text className="text-xs text-gray-500">Weekly summary of activity</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: '#ccc', true: '#2563eb' }}
              thumbColor={false ? '#2563eb' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
          {/* Search Radius Section */}
          <Text className="font-semibold text-gray-900 mb-2">Search Radius</Text>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-gray-500">5km</Text>
            <Text className="text-xs text-gray-500">50km</Text>
          </View>
          <Slider
            minimumValue={5}
            maximumValue={50}
            step={1}
            value={15}
            onValueChange={() => {}}
            minimumTrackTintColor="#2563eb"
            maximumTrackTintColor="#eee"
            thumbTintColor="#2563eb"
            style={{ width: '100%' }}
          />
          <Text className="text-xs text-gray-500 mt-1 mb-4">Current: 15km</Text>
          {/* Auto-Accept Returns Toggle */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-900 font-semibold">Auto-accept returns</Text>
              <Text className="text-xs text-gray-500">Automatically accept verified returners</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#ccc', true: '#2563eb' }}
              thumbColor={true ? '#2563eb' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
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

          {/* Sign Out Button */}
          {/* This button is now moved to the bottom */}
        </View>
        {/* Support & Info Card */}
        <View className="bg-[#F7F8FA] rounded-2xl shadow-sm p-5 mb-5" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text className="font-bold text-base text-gray-900 mb-3">Support & Info</Text>
          {/* Help Center */}
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <MaterialIcons name="info" size={22} color="#2563eb" />
              <Text className="ml-3 text-gray-900 font-semibold">Help Center</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" />
          </TouchableOpacity>
          {/* Privacy Policy */}
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <MaterialIcons name="shield" size={22} color="#22c55e" />
              <Text className="ml-3 text-gray-900 font-semibold">Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" />
          </TouchableOpacity>
          {/* Terms of Service */}
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <MaterialIcons name="description" size={22} color="#f59e42" />
              <Text className="ml-3 text-gray-900 font-semibold">Terms of Service</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Sign Out Button */}
      <View className="px-4 pb-8">
        <TouchableOpacity
          onPress={handleSignOut}
          className="w-full rounded-full py-3 items-center bg-red-50 border border-red-200"
          style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
        >
          <Text className="text-red-600 font-bold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

