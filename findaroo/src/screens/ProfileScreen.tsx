import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Alert, Platform, TouchableOpacity, Switch, StyleSheet, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, deleteImage } from '../utils/uploadImage';
import { getSignedImageUrl } from '../utils/uploadImage';

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { signOut, user, updateProfile, fetchReceivedTips } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [autoAccept, setAutoAccept] = useState(true);
  const [radius, setRadius] = useState(15);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [receivedTips, setReceivedTips] = useState(0);
  const [loadingTips, setLoadingTips] = useState(true);

  // Fetch received tips when component mounts or user changes
  useEffect(() => {
    const loadReceivedTips = async () => {
      if (user?.id) {
        console.log('Loading received tips for user:', user.id);
        setLoadingTips(true);

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('Tips loading timeout reached');
          setLoadingTips(false);
          setReceivedTips(0);
        }, 10000); // 10 second timeout

        try {
          const tips = await fetchReceivedTips(user.id);
          console.log('Received tips loaded:', tips);
          clearTimeout(timeoutId);
          setReceivedTips(tips);
        } catch (error) {
          console.error('Error loading received tips:', error);
          clearTimeout(timeoutId);
          setReceivedTips(0);
        } finally {
          setLoadingTips(false);
        }
      } else {
        console.log('No user ID available for loading tips');
        setReceivedTips(0);
        setLoadingTips(false);
      }
    };

    // Only run if we have a user or if user is explicitly null (not undefined)
    if (user !== undefined) {
      loadReceivedTips();
    }
  }, [user?.id, fetchReceivedTips]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Sign Out Failed', error.message);
    } else if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const handleEditName = () => {
    setEditingName(user?.full_name || '');
    setShowEditNameModal(true);
  };

  const handleSaveName = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your name');
      return;
    }

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    try {
      const { data, error } = await updateProfile({ full_name: trimmedName });

      if (error) {
        Alert.alert('Update Failed', error.message || 'Could not update your name');
        console.error('[ProfileScreen] Name update failed:', error);
        return;
      }

      console.log('[ProfileScreen] Name updated successfully:', data);
      setShowEditNameModal(false);
      Alert.alert('Success', 'Your name has been updated successfully');
    } catch (error) {
      console.error('[ProfileScreen] Unexpected error updating name:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleCancelEditName = () => {
    setEditingName('');
    setShowEditNameModal(false);
  };

  const handleEditDetails = () => {
    setEditingName(user?.full_name || '');
    setEditingPhone(user?.phone || '');
    setEditingEmail(user?.email || '');
    setShowEditDetailsModal(true);
  };

  const handleSaveDetails = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your details');
      return;
    }

    const trimmedName = editingName.trim();
    const trimmedEmail = editingEmail.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!trimmedEmail) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    try {
      const updates: any = {
        full_name: trimmedName,
        email: trimmedEmail,
      };

      if (editingPhone.trim()) {
        updates.phone = editingPhone.trim();
      }

      const { data, error } = await updateProfile(updates);
      if (error) {
        Alert.alert('Update Failed', error.message || 'Could not update your details');
        console.error('[ProfileScreen] Details update failed:', error);
        return;
      }

      console.log('[ProfileScreen] Details updated successfully:', data);
      setShowEditDetailsModal(false);
      Alert.alert('Success', 'Your details have been updated successfully');
    } catch (error) {
      console.error('[ProfileScreen] Unexpected error updating details:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleCancelEditDetails = () => {
    setEditingName('');
    setEditingPhone('');
    setEditingEmail('');
    setShowEditDetailsModal(false);
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={handleEditName} style={styles.nameContainer}>
                  <Text style={styles.profileName}>
                    {user?.full_name || 'Tap to add your name'}
                  </Text>
                  <MaterialIcons name="edit" size={16} color="#666" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
                {/* Small verification badge */}
                <View style={styles.smallVerificationBadge}>
                  <MaterialIcons name="verified" size={16} color="#10B981" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MaterialIcons name="email" size={16} color="#64748B" />
                <Text style={styles.profileLocation}>{user?.email || 'No email'}</Text>
              </View>
              {user?.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <MaterialIcons name="phone" size={16} color="#64748B" />
                  <Text style={styles.profileLocation}>{user.phone}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.profileStatsRow}>
            <View style={styles.karmaCard}>
              <Text style={styles.karmaLabel}>Karma Points</Text>
              <Text style={styles.karmaValue}>{user?.karma_points ?? 'N/A'}</Text>
            </View>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsLabel}>Received Tips</Text>
              <Text style={styles.tipsValue}>
                {loadingTips ? 'Loading...' : `$${receivedTips.toFixed(2)}`}
              </Text>
            </View>
          </View>
        </View>
        {/* Payment Methods Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity>
              <Text style={styles.addNew}>Add New</Text>
            </TouchableOpacity>
          </View>
          {/* Credit/Debit Card - Placeholder */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentIconBox}>
              <MaterialIcons name="credit-card" size={20} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentText}>No payment methods added</Text>
              <Text style={styles.paymentSub}>Add a payment method to get started</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </View>
          {/* PayID */}
          <View style={styles.paymentRow}>
            <View style={[styles.paymentIconBox, { backgroundColor: '#FEF3C7' }] }>
              <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 16 }}>P</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentText}>{user?.email || 'No email available'}</Text>
              <Text style={styles.paymentSub}>PayID linked to your email</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
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

        {/* Account Settings Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.settingsRow} onPress={handleEditDetails}>
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="edit" size={20} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.settingsText}>Update Personal Details</Text>
              <Text style={styles.settingsSub}>Edit name, phone, and email</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
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

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEditName}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Your Name</Text>
              <TouchableOpacity onPress={handleCancelEditName}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.nameInput}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoFocus={true}
                maxLength={50}
              />
              <Text style={styles.inputHint}>
                This name will be visible to other users when you post items or send messages.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEditName}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Details Modal */}
      <Modal
        visible={showEditDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEditDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Personal Details</Text>
              <TouchableOpacity onPress={handleCancelEditDetails}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.nameInput}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                maxLength={50}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.nameInput}
                value={editingEmail}
                onChangeText={setEditingEmail}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.nameInput}
                value={editingPhone}
                onChangeText={setEditingPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputHint}>
                This information will be visible to other users when you interact with them.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEditDetails}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveDetails}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 32,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileName: {
    fontWeight: '700',
    fontSize: 22,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  profileLocation: {
    color: '#64748B',
    fontSize: 15,
    marginLeft: 6,
    fontWeight: '500',
  },
  profileStatsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
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
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  karmaLabel: {
    color: '#DBEAFE',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  karmaValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 26,
    marginTop: 4,
  },
  tipsCard: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsLabel: {
    color: '#D1FAE5',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tipsValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 26,
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subSectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#475569',
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addNew: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentText: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 16,
  },
  paymentSub: {
    color: '#64748B',
    fontSize: 14,
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
    paddingTop: 24,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  signOutButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 17,
  },
  settingsSub: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 2,
  },
  smallVerificationBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
});

