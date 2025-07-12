import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Alert, Platform, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, deleteImage } from '../utils/uploadImage';
import { getSignedImageUrl } from '../utils/uploadImage';

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { signOut, user, updateProfile } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [autoAccept, setAutoAccept] = useState(true);
  const [radius, setRadius] = useState(15);
  const [profilePicUrl, setProfilePicUrl] = useState('');

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Sign Out Failed', error.message);
    } else if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const handlePickProfileImage = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your profile picture');
      return;
    }

    try {
      // Request permissions first
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'We need camera roll permissions to upload your profile picture');
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1], // Square aspect ratio for profile pictures
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[ProfileImageUpload] Image selection canceled');
        return;
      }

      // Show loading indicator
      Alert.alert('Uploading...', 'Please wait while we upload your profile picture');

      const asset = result.assets[0];
      const uri = asset.uri;
      const filename = asset.fileName || uri.split('/').pop() || `profile_${Date.now()}.jpg`;

      console.log(`[ProfileImageUpload] Uploading image: ${filename}`);

      // Delete old profile picture if it exists
      if (user.profile_pic) {
        console.log(`[ProfileImageUpload] Deleting old profile picture: ${user.profile_pic}`);
        await deleteImage(user.profile_pic, 'profile-pics');
      }

      const path = await uploadImage(uri, filename, user.id, 'profile-pics');

      if (!path) {
        Alert.alert('Upload failed', 'Could not upload image. Please try again.');
        console.error('[ProfileImageUpload] Upload failed: path is null');
        return;
      }

      console.log(`[ProfileImageUpload] Image uploaded successfully to path: ${path}`);

      // Update user profile with new profile_pic path
      const { data, error } = await updateProfile({ profile_pic: path });

      if (error) {
        Alert.alert('Profile update failed', error.message || 'Could not update profile with new image');
        console.error('[ProfileImageUpload] Profile update failed:', error);
        return;
      }

      console.log('[ProfileImageUpload] Profile updated successfully with new image');

      // Fetch new signed URL after upload
      const signedUrl = await getSignedImageUrl(path, 'profile-pics');
      if (signedUrl) {
        setProfilePicUrl(signedUrl);
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Warning', 'Image uploaded but may not display correctly. Please try again later.');
      }
    } catch (error) {
      console.error('[ProfileImageUpload] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleDeleteProfileImage = async () => {
    if (!user || !user.profile_pic) {
      Alert.alert('Error', 'No profile picture to delete');
      return;
    }

    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`[ProfileImageDelete] Deleting profile picture: ${user.profile_pic}`);

              // Delete image from storage
              const deleteSuccess = await deleteImage(user.profile_pic, 'profile-pics');

              if (!deleteSuccess) {
                Alert.alert('Delete failed', 'Could not delete image from storage. Please try again.');
                console.error('[ProfileImageDelete] Delete failed: deleteImage returned false');
                return;
              }

              // Update user profile to remove profile_pic path
              const { data, error } = await updateProfile({ profile_pic: null });

              if (error) {
                Alert.alert('Profile update failed', error.message || 'Could not update profile');
                console.error('[ProfileImageDelete] Profile update failed:', error);
                return;
              }

              console.log('[ProfileImageDelete] Profile picture deleted successfully');
              setProfilePicUrl('');
              Alert.alert('Success', 'Profile picture deleted successfully');
            } catch (error) {
              console.error('[ProfileImageDelete] Unexpected error:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleProfilePictureOptions = () => {
    const options = [
      {
        text: 'Cancel',
        style: 'cancel' as const,
      },
      {
        text: 'Update Picture',
        onPress: handlePickProfileImage,
      },
    ];

    // Only show delete option if user has a profile picture
    if (user?.profile_pic) {
      options.splice(1, 0, {
        text: 'Delete Picture',
        style: 'destructive' as const,
        onPress: handleDeleteProfileImage,
      });
    }

    Alert.alert('Profile Picture', 'Choose an option:', options);
  };

  // Fetch signed URL for profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        if (!user?.profile_pic) {
          console.log('[ProfileScreen] No profile picture path available');
          setProfilePicUrl('');
          return;
        }
        
        console.log(`[ProfileScreen] Fetching profile picture URL for path: ${user.profile_pic}`);
        const url = await getSignedImageUrl(user.profile_pic, 'profile-pics');
        
        if (!url) {
          console.error('[ProfileScreen] Failed to get signed URL for profile picture');
          setProfilePicUrl('');
          return;
        }
        
        console.log('[ProfileScreen] Successfully fetched profile picture URL');
        setProfilePicUrl(url);
      } catch (error) {
        console.error('[ProfileScreen] Error fetching profile picture:', error);
        setProfilePicUrl('');
      }
    };
    
    fetchProfilePicture();
  }, [user?.profile_pic]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={28} color="#222" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 16 }}>
              <View>
                <TouchableOpacity onPress={handleProfilePictureOptions}>
                  {profilePicUrl ? (
                    <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>{user?.full_name?.charAt(0).toUpperCase() || 'A'}</Text>
                    </View>
                  )}
                  <View style={styles.avatarBadge}>
                    <MaterialIcons name="edit" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
              {user?.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <MaterialIcons name="phone" size={16} color="#aaa" />
                  <Text style={styles.profileLocation}>{user.phone}</Text>
                </View>
              )}
              {/* Optionally display user location if available in user profile */}
              {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialIcons name="location-pin" size={16} color="#aaa" />
                <Text style={styles.profileLocation}>{user?.location || 'Location not set'}</Text>
              </View> */}
            </View>
          </View>
          <View style={styles.profileStatsRow}>
            <View style={styles.reputationCard}>
              <Text style={styles.reputationLabel}>Reputation Score</Text>
              <Text style={styles.reputationValue}>{user?.karma_points ? (user.karma_points / 100).toFixed(1) : 'N/A'}</Text>
              {/* Optionally display stars and returns if you have this data */}
            </View>
            <View style={styles.karmaCard}>
              <Text style={styles.karmaLabel}>Karma Points</Text>
              <Text style={styles.karmaValue}>{user?.karma_points ?? 'N/A'}</Text>
            </View>
          </View>
        </View>
        {/* Account Settings Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.subSectionTitle}>Payment Methods</Text>
            <TouchableOpacity>
              <Text style={styles.addNew}>Add New</Text>
            </TouchableOpacity>
          </View>
          {/* Credit/Debit Card - Placeholder */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentIconBox}>
              <MaterialIcons name="credit-card" size={20} color="#2563eb" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentText}>No payment methods added</Text>
              <Text style={styles.paymentSub}>Add a payment method to get started</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" style={{ marginLeft: 'auto' }} />
          </View>
          {/* PayID */}
          <View style={styles.paymentRow}>
            <View style={[styles.paymentIconBox, { backgroundColor: '#FFEAD1' }] }>
              <Text style={{ color: '#F59E42', fontWeight: 'bold', fontSize: 16 }}>P</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentText}>{user?.email || 'No email available'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" style={{ marginLeft: 'auto' }} />
          </View>
          {/* ID Verification */}
          <View style={[styles.verificationCard, { backgroundColor: '#FFF4E6' }]}>
            <View style={[styles.verificationIcon, { backgroundColor: '#F59E42' }]}>
              <MaterialIcons name="pending" size={20} color="#fff" />
            </View>
            <View>
              <Text style={[styles.verifiedText, { color: '#F59E42' }]}>Verification Pending</Text>
              <Text style={styles.verifiedSub}>Driver’s License verified</Text>
            </View>
          </View>
        </View>
        {/* Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={styles.subSectionTitle}>Notifications</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={styles.toggleSub}>Get notified about new items nearby</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#ccc', true: '#2563eb' }}
              thumbColor={pushNotifications ? '#2563eb' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Email Updates</Text>
              <Text style={styles.toggleSub}>Weekly summary of activity</Text>
            </View>
            <Switch
              value={emailUpdates}
              onValueChange={setEmailUpdates}
              trackColor={{ false: '#ccc', true: '#2563eb' }}
              thumbColor={emailUpdates ? '#2563eb' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
          <Text style={styles.subSectionTitle}>Search Radius</Text>
          <View style={styles.sliderLabelsRow}>
            <Text style={styles.sliderLabel}>5km</Text>
            <Text style={styles.sliderLabel}>50km</Text>
          </View>
          <Slider
            minimumValue={5}
            maximumValue={50}
            step={1}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor="#2563eb"
            maximumTrackTintColor="#eee"
            thumbTintColor="#2563eb"
            style={{ width: '100%' }}
          />
          <Text style={styles.sliderValue}>Current: {radius}km</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Auto-accept returns</Text>
              <Text style={styles.toggleSub}>Automatically accept verified returners</Text>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: '#ccc', true: '#2563eb' }}
              thumbColor={autoAccept ? '#2563eb' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
        </View>
        {/* Support & Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Support & Info</Text>
          <TouchableOpacity style={styles.infoRow}>
            <View style={styles.infoIconBox}><MaterialIcons name="info" size={22} color="#2563eb" /></View>
            <Text style={styles.infoText}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoRow}>
            <View style={styles.infoIconBox}><MaterialIcons name="shield" size={22} color="#22c55e" /></View>
            <Text style={styles.infoText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoRow}>
            <View style={styles.infoIconBox}><MaterialIcons name="description" size={22} color="#f59e42" /></View>
            <Text style={styles.infoText}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  profileLocation: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  profileStatsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  reputationCard: {
    flex: 1,
    backgroundColor: '#1EC773',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  reputationLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reputationValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reputationSub: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 8,
  },
  karmaCard: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  karmaLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  karmaValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 10,
  },
  subSectionTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addNew: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 2,
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E3EDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  paymentSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#D1FADF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  defaultBadgeText: {
    color: '#1EC773',
    fontWeight: 'bold',
    fontSize: 12,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9ED',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  verificationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1EC773',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  verifiedText: {
    color: '#1EC773',
    fontWeight: 'bold',
    fontSize: 15,
  },
  verifiedSub: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleLabel: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  toggleSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sliderLabel: {
    color: '#888',
    fontSize: 12,
  },
  sliderValue: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  infoText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  signOutContainer: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  signOutButton: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  signOutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

