import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, Alert, Modal, TextInput, Image, ActionSheetIOS, Platform } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { uploadImage, getSignedImageUrl, deleteImage } from '../utils/uploadImage';

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { signOut, user, updateProfile, fetchReceivedTips } = useAuth();
  const insets = useSafeAreaInsets();
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
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

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

  // Fetch profile picture URL when user changes
  useEffect(() => {
    const fetchProfilePic = async () => {
      if (user?.profile_pic) {
        try {
          const url = await getSignedImageUrl(user.profile_pic, 'profile-pics');
          setProfilePicUrl(url);
        } catch (error) {
          console.error('Error fetching profile picture:', error);
          setProfilePicUrl('');
        }
      } else {
        setProfilePicUrl('');
      }
    };

    fetchProfilePic();
  }, [user?.profile_pic]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleEditName = () => {
    setEditingName(user?.full_name || '');
    setShowEditNameModal(true);
  };

  const handleEditDetails = () => {
    setEditingName(user?.full_name || '');
    setEditingPhone(user?.phone || '');
    setEditingEmail(user?.email || '');
    setShowEditDetailsModal(true);
  };

  const handlePaymentDetails = () => {
    // Future: Navigate to payment details screen
    Alert.alert('Payment Details', 'Payment management coming soon!');
  };

  const handleProfilePictureOptions = () => {
    if (!user) return;

    const options = profilePicUrl
      ? ['Take Photo', 'Choose from Gallery', 'Remove Photo', 'Cancel']
      : ['Take Photo', 'Choose from Gallery', 'Cancel'];

    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = profilePicUrl ? 2 : -1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: 'Profile Picture',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleTakePhoto();
          } else if (buttonIndex === 1) {
            handleChooseFromGallery();
          } else if (buttonIndex === 2 && profilePicUrl) {
            handleRemoveProfilePicture();
          }
        }
      );
    } else {
      // For Android, show a simple alert with options
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Gallery', onPress: handleChooseFromGallery },
          ...(profilePicUrl ? [{ text: 'Remove Photo', onPress: handleRemoveProfilePicture, style: 'destructive' }] : []),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    if (!user) return;

    try {
      setUploadingProfilePic(true);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadNewProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('[ProfilePicCamera] Error:', error);
      Alert.alert('Error', 'An error occurred while taking the photo.');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleChooseFromGallery = async () => {
    if (!user) return;

    try {
      setUploadingProfilePic(true);

      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadNewProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('[ProfilePicGallery] Error:', error);
      Alert.alert('Error', 'An error occurred while selecting the image.');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const uploadNewProfilePicture = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;

    const uri = asset.uri;
    const filename = asset.fileName || uri.split('/').pop() || `profile.jpg`;

    console.log('[ProfilePicUpload] Starting upload for:', filename);

    // Delete old profile picture if it exists
    if (user.profile_pic) {
      console.log('[ProfilePicUpload] Deleting old profile picture:', user.profile_pic);
      const deleteSuccess = await deleteImage(user.profile_pic, 'profile-pics');
      if (deleteSuccess) {
        console.log('[ProfilePicUpload] Old profile picture deleted successfully');
      } else {
        console.warn('[ProfilePicUpload] Failed to delete old profile picture, continuing with upload');
      }
    }

    // Upload new profile picture
    const path = await uploadImage(uri, filename, user.id, 'profile-pics');

    if (path) {
      console.log('[ProfilePicUpload] Upload successful, updating profile:', path);
      const { error } = await updateProfile({ profile_pic: path });

      if (error) {
        Alert.alert('Update Failed', 'Could not update profile picture. Please try again.');
        console.error('[ProfilePicUpload] Profile update failed:', error);
      } else {
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } else {
      Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
      console.error('[ProfilePicUpload] Upload failed: path is null');
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user || !user.profile_pic) return;

    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingProfilePic(true);

              // Delete from storage
              console.log('[ProfilePicRemove] Deleting profile picture:', user.profile_pic);
              const deleteSuccess = await deleteImage(user.profile_pic, 'profile-pics');

              if (deleteSuccess) {
                console.log('[ProfilePicRemove] Profile picture deleted from storage');
              } else {
                console.warn('[ProfilePicRemove] Failed to delete from storage, continuing with profile update');
              }

              // Update user profile to remove the reference
              const { error } = await updateProfile({ profile_pic: null });

              if (error) {
                Alert.alert('Error', 'Could not remove profile picture. Please try again.');
                console.error('[ProfilePicRemove] Profile update failed:', error);
              } else {
                Alert.alert('Success', 'Profile picture removed successfully!');
              }
            } catch (error) {
              console.error('[ProfilePicRemove] Error:', error);
              Alert.alert('Error', 'An error occurred while removing your profile picture.');
            } finally {
              setUploadingProfilePic(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveName = async () => {
    if (!editingName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      const { error } = await updateProfile({ full_name: editingName.trim() });
      if (error) {
        Alert.alert('Error', 'Failed to update name');
      } else {
        setShowEditNameModal(false);
        Alert.alert('Success', 'Name updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update name');
    }
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

  const handleCancelEditName = () => {
    setEditingName('');
    setShowEditNameModal(false);
  };

  const handleCancelEditDetails = () => {
    setEditingName('');
    setEditingPhone('');
    setEditingEmail('');
    setShowEditDetailsModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation?.goBack()}
        >
          <Feather name="arrow-left" size={22} color="#64748B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            // Future: Open app settings or preferences
            Alert.alert('Settings', 'App settings coming soon!');
          }}
        >
          <Feather name="settings" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.scrollContentContainer,
          {
            paddingBottom: Platform.OS === 'ios'
              ? 85 + Math.max(insets.bottom, 20) + 20 // Tab bar height + extra padding
              : 75 + Math.max(insets.bottom, 12) + 20 // Tab bar height + extra padding
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profilePicUrl ? (
                <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.avatarBadge}
                onPress={handleProfilePictureOptions}
                disabled={uploadingProfilePic}
              >
                <MaterialIcons
                  name={uploadingProfilePic ? "hourglass-empty" : "camera-alt"}
                  size={12}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <TouchableOpacity onPress={handleEditName} style={styles.nameContainer}>
                  <Text style={styles.profileName}>
                    {user?.full_name || 'Tap to add your name'}
                  </Text>
                  <MaterialIcons name="edit" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <View style={styles.smallVerificationBadge}>
                  <MaterialIcons name="verified" size={16} color="#10B981" />
                </View>
              </View>

              <View style={styles.contactInfo}>
                <View style={styles.contactRow}>
                  <MaterialIcons name="email" size={16} color="#64748B" />
                  <Text style={styles.contactText}>{user?.email || 'No email'}</Text>
                </View>
                {user?.phone && (
                  <View style={styles.contactRow}>
                    <MaterialIcons name="phone" size={16} color="#64748B" />
                    <Text style={styles.contactText}>{user.phone}</Text>
                  </View>
                )}
              </View>
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
          
          <TouchableOpacity style={styles.settingsRow} onPress={handlePaymentDetails}>
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="payment" size={20} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.settingsText}>Payment Details</Text>
              <Text style={styles.settingsSub}>Manage payment methods and billing</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Push Notifications</Text>
            <TouchableOpacity
              style={[styles.toggle, pushNotifications && styles.toggleActive]}
              onPress={() => setPushNotifications(!pushNotifications)}
            >
              <View style={[styles.toggleThumb, pushNotifications && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Email Updates</Text>
            <TouchableOpacity
              style={[styles.toggle, emailUpdates && styles.toggleActive]}
              onPress={() => setEmailUpdates(!emailUpdates)}
            >
              <View style={[styles.toggleThumb, emailUpdates && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Auto-accept returns</Text>
            <TouchableOpacity
              style={[styles.toggle, autoAccept && styles.toggleActive]}
              onPress={() => setAutoAccept(!autoAccept)}
            >
              <View style={[styles.toggleThumb, autoAccept && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Support Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Help Center', 'Help center coming soon!')}>
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="help-outline" size={20} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.settingsText}>Help Center</Text>
              <Text style={styles.settingsSub}>Get answers to common questions</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Contact Support', 'Contact support coming soon!')}>
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="support-agent" size={20} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.settingsText}>Contact Support</Text>
              <Text style={styles.settingsSub}>Get help from our support team</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Report Issue', 'Report issue coming soon!')}>
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="bug-report" size={20} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.settingsText}>Report an Issue</Text>
              <Text style={styles.settingsSub}>Report bugs or technical problems</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Feedback', 'Feedback coming soon!')}>
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="feedback" size={20} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.settingsText}>Send Feedback</Text>
              <Text style={styles.settingsSub}>Share your thoughts and suggestions</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
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
              <Text style={styles.modalTitle}>Edit Name</Text>
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
                maxLength={50}
              />
              <Text style={styles.inputHint}>
                This name will be visible to other users when you interact with them.
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 22,
    color: '#1E293B',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontWeight: '500',
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingTop: 8,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contactInfo: {
    gap: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    color: '#64748B',
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '500',
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
  profileStatsRow: {
    flexDirection: 'row',
    marginTop: 0,
    gap: 12,
  },
  karmaCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  karmaLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  karmaValue: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 16,
  },
  tipsCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipsLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  tipsValue: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 16,
    letterSpacing: -0.5,
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
    marginBottom: 12,
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  preferenceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  signOutContainer: {
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
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
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  inputHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
