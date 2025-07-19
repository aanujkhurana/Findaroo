import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, Alert, Modal, TextInput, Image, ActionSheetIOS, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { uploadImage, getSignedImageUrl, deleteImage } from '../utils/uploadImage';
import { createTestNotifications, clearAllNotifications } from '../utils/testNotifications';
import { verificationService } from '../services/verificationService';
import { karmaService } from '../services/karmaService';
import { KarmaBadge, TrustedBadge } from '../components/KarmaBadge';

interface ProfileScreenProps {
  navigation?: any;
}

export const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
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
  const [trustedReturnerStatus, setTrustedReturnerStatus] = useState({
    isTrustedReturner: false,
    returnsCompleted: 0,
  });
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  // Verification states
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
  const [sendingPhoneCode, setSendingPhoneCode] = useState(false);
  const [verifyingPhoneCode, setVerifyingPhoneCode] = useState(false);
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Enterprise features states
  const [showSecurityLogModal, setShowSecurityLogModal] = useState(false);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loadingSecurityLogs, setLoadingSecurityLogs] = useState(false);

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

  // Fetch trusted returner status
  useEffect(() => {
    const fetchTrustedReturnerStatus = async () => {
      if (!user?.id) return;

      try {
        const result = await karmaService.checkTrustedReturnerStatus(user.id);
        if (result.success) {
          setTrustedReturnerStatus({
            isTrustedReturner: result.isTrustedReturner || false,
            returnsCompleted: result.returnsCompleted || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching trusted returner status:', error);
      }
    };

    fetchTrustedReturnerStatus();
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCreateTestNotifications = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Create Test Notifications',
      'This will create 5 sample notifications for testing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            const success = await createTestNotifications(user.id);
            if (success) {
              Alert.alert('Success', 'Test notifications created! Check the notifications screen.');
            } else {
              Alert.alert('Error', 'Failed to create test notifications.');
            }
          }
        }
      ]
    );
  };

  const handleClearNotifications = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Clear All Notifications',
      'This will delete all your notifications. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllNotifications(user.id);
            if (success) {
              Alert.alert('Success', 'All notifications cleared!');
            } else {
              Alert.alert('Error', 'Failed to clear notifications.');
            }
          }
        }
      ]
    );
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
    setShowPaymentMethodsModal(true);
  };

  // Verification handlers
  const handleResendEmailVerification = async () => {
    const result = await verificationService.resendEmailVerification();
    if (result.success) {
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } else {
      Alert.alert('Error', result.error || 'Failed to send verification email');
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!user?.phone) {
      Alert.alert('Error', 'Please add a phone number first');
      return;
    }

    setSendingPhoneCode(true);
    const result = await verificationService.sendPhoneVerificationCode(user.phone);
    setSendingPhoneCode(false);

    if (result.success) {
      Alert.alert('Success', 'Verification code sent to your phone!');
    } else {
      Alert.alert('Error', result.error || 'Failed to send verification code');
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneVerificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setVerifyingPhoneCode(true);
    const result = await verificationService.verifyPhoneCode(phoneVerificationCode);
    setVerifyingPhoneCode(false);

    if (result.success) {
      setShowPhoneVerificationModal(false);
      setPhoneVerificationCode('');
      Alert.alert('Success', 'Phone number verified successfully!');
      // Refresh user data by updating with current data to trigger a refresh
      if (user) {
        await updateProfile({});
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to verify phone number');
    }
  };

  // Enterprise feature handlers
  const handleViewSecurityLog = async () => {
    setShowSecurityLogModal(true);
    setLoadingSecurityLogs(true);

    try {
      const logs = await verificationService.getSecurityLogs(20);
      setSecurityLogs(logs);
    } catch (error) {
      console.error('Error loading security logs:', error);
      Alert.alert('Error', 'Failed to load security logs');
    } finally {
      setLoadingSecurityLogs(false);
    }
  };

  const handleDataExport = async () => {
    Alert.alert(
      'Export Account Data',
      'This will prepare a download of all your account data including profile information, items, messages, and activity history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              // In a real implementation, this would trigger a server-side export
              await verificationService.logSecurityAction('data_export_requested');
              Alert.alert(
                'Export Requested',
                'Your data export has been requested. You will receive an email with download instructions within 24 hours.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to request data export');
            }
          }
        }
      ]
    );
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Privacy Controls',
      'Manage your privacy settings and data sharing preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Manage', onPress: () => Alert.alert('Coming Soon', 'Advanced privacy controls coming soon!') }
      ]
    );
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
        mediaTypes: 'images',
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
        mediaTypes: 'images',
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
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account & settings</Text>
        </View>
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
        {/* Enhanced Profile Card */}
        <View style={styles.profileCard}>
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
                {uploadingProfilePic ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="camera-alt" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.profileName}>
                      {user?.full_name || 'User Name'}
                    </Text>
                  </View>

                  {/* Verification Icon next to name */}
                  {(user?.email_verified || user?.phone_verified || user?.identity_verified) && (
                    <View style={styles.verificationIcon}>
                      <MaterialIcons
                        name="verified"
                        size={18}
                        color={user?.identity_verified ? "#F59E0B" : user?.phone_verified ? "#3B82F6" : "#10B981"}
                      />
                    </View>
                  )}
                </View>

                {/* Contact Info - Phone and Email */}
                <View style={styles.contactInfo}>
                  <View style={styles.contactRow}>
                    <MaterialIcons name="email" size={14} color="#64748B" />
                    <Text style={styles.contactText}>{user?.email || 'No email'}</Text>
                    {!user?.email_verified && (
                      <View style={styles.unverifiedDot}>
                        <View style={styles.unverifiedIndicatorSmall} />
                      </View>
                    )}
                  </View>
                  {user?.phone && (
                    <View style={styles.contactRow}>
                      <MaterialIcons name="phone" size={14} color="#64748B" />
                      <Text style={styles.contactText}>{user.phone}</Text>
                      {!user?.phone_verified && (
                        <View style={styles.unverifiedDot}>
                          <View style={styles.unverifiedIndicatorSmall} />
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Small Verification Status */}
                <View style={styles.verificationStatus}>
                  <Text style={styles.verificationStatusText}>
                    {user?.identity_verified ? 'ID Verified' :
                     user?.phone_verified ? 'Phone Verified' :
                     user?.email_verified ? 'Email Verified' : 'Verification Pending'}
                  </Text>
                </View>
              </View>


            </View>
          </View>

          {/* Compact Stats Row */}
          <View style={styles.profileStatsRow}>
            <TouchableOpacity
              style={styles.compactStatCard}
              onPress={() => navigation?.navigate('KarmaHistory')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="star" size={16} color="#F59E0B" />
              <View style={styles.compactStatContent}>
                <Text style={styles.compactStatValue}>{user?.karma_points ?? '0'}</Text>
                <Text style={styles.compactStatLabel}>Karma</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.compactStatCard}>
              <MaterialIcons name="card-giftcard" size={16} color="#10B981" />
              <View style={styles.compactStatContent}>
                <Text style={styles.compactStatValue}>
                  {loadingTips ? '...' : `$${receivedTips.toFixed(0)}`}
                </Text>
                <Text style={styles.compactStatLabel}>Tips</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification & Security</Text>

          {/* Email Verification */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              if (!user?.email_verified) {
                Alert.alert(
                  'Email Verification',
                  'Verify your email to increase trust and security.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Resend Email', onPress: handleResendEmailVerification }
                  ]
                );
              }
            }}
          >
            <View style={[styles.settingsIconBox, { backgroundColor: user?.email_verified ? '#DCFCE7' : '#FEF3C7' }]}>
              <MaterialIcons
                name={user?.email_verified ? "mark-email-read" : "email"}
                size={20}
                color={user?.email_verified ? "#10B981" : "#F59E0B"}
              />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.settingsText}>Email Verification</Text>
              <Text style={styles.settingsSub}>
                {user?.email_verified ? 'Email verified' : 'Verify your email address'}
              </Text>
            </View>
            {user?.email_verified ? (
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            ) : (
              <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Phone Verification */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              if (user?.phone && !user?.phone_verified) {
                setShowPhoneVerificationModal(true);
              } else if (!user?.phone) {
                Alert.alert('Add Phone Number', 'Please add a phone number first in your personal details.');
              }
            }}
          >
            <View style={[styles.settingsIconBox, { backgroundColor: user?.phone_verified ? '#DCFCE7' : '#DBEAFE' }]}>
              <MaterialIcons
                name={user?.phone_verified ? "verified-user" : "phone"}
                size={20}
                color={user?.phone_verified ? "#10B981" : "#3B82F6"}
              />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.settingsText}>Phone Verification</Text>
              <Text style={styles.settingsSub}>
                {user?.phone_verified ? 'Phone verified' : user?.phone ? 'Verify your phone number' : 'Add phone number first'}
              </Text>
            </View>
            {user?.phone_verified ? (
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            ) : user?.phone ? (
              <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
            ) : (
              <MaterialIcons name="add" size={24} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Identity Verification */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              Alert.alert('Identity Verification', 'Identity verification coming soon!');
            }}
          >
            <View style={[styles.settingsIconBox, { backgroundColor: user?.identity_verified ? '#DCFCE7' : '#FEF2F2' }]}>
              <MaterialIcons
                name={user?.identity_verified ? "verified" : "badge"}
                size={20}
                color={user?.identity_verified ? "#10B981" : "#EF4444"}
              />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.settingsText}>Identity Verification</Text>
              <Text style={styles.settingsSub}>
                {user?.identity_verified ? 'Identity verified' : 'Verify with government ID'}
              </Text>
            </View>
            {user?.identity_verified ? (
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            ) : (
              <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
            )}
          </TouchableOpacity>
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
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => setShowPaymentMethodsModal(true)}>
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="payment" size={20} color="#10B981" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.settingsText}>Payment Methods</Text>
              <Text style={styles.settingsSub}>Manage cards and payment options</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Security & Privacy Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleViewSecurityLog}
          >
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="security" size={20} color="#EF4444" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.settingsText}>Security Activity</Text>
              <Text style={styles.settingsSub}>View login history and security events</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handlePrivacySettings}
          >
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="privacy-tip" size={20} color="#8B5CF6" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.settingsText}>Privacy Controls</Text>
              <Text style={styles.settingsSub}>Manage data sharing and visibility</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleDataExport}
          >
            <View style={styles.settingsIconBox}>
              <MaterialIcons name="download" size={20} color="#06B6D4" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.settingsText}>Export Data</Text>
              <Text style={styles.settingsSub}>Download your account information</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Notification Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceText}>Push Notifications</Text>
              <Text style={styles.preferenceSubtext}>Get notified about messages and updates</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, pushNotifications && styles.toggleActive]}
              onPress={() => setPushNotifications(!pushNotifications)}
            >
              <View style={[styles.toggleThumb, pushNotifications && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceText}>Email Updates</Text>
              <Text style={styles.preferenceSubtext}>Receive important updates via email</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, emailUpdates && styles.toggleActive]}
              onPress={() => setEmailUpdates(!emailUpdates)}
            >
              <View style={[styles.toggleThumb, emailUpdates && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceText}>Auto-accept Returns</Text>
              <Text style={styles.preferenceSubtext}>Automatically accept item return requests</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, autoAccept && styles.toggleActive]}
              onPress={() => setAutoAccept(!autoAccept)}
            >
              <View style={[styles.toggleThumb, autoAccept && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceText}>Search Radius</Text>
              <Text style={styles.preferenceSubtext}>Maximum distance for item searches</Text>
            </View>
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusValue}>{radius} km</Text>
            </View>
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

        {/* Test Notifications (Development) */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Development Tools</Text>
          <TouchableOpacity style={styles.settingsRow} onPress={handleCreateTestNotifications}>
            <View style={styles.settingsIcon}>
              <MaterialIcons name="notification-add" size={20} color="#3A8DFF" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsText}>Create Test Notifications</Text>
              <Text style={styles.settingsSub}>Generate sample notifications for testing</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsRow} onPress={handleClearNotifications}>
            <View style={styles.settingsIcon}>
              <MaterialIcons name="clear-all" size={20} color="#FF4C4C" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsText}>Clear All Notifications</Text>
              <Text style={styles.settingsSub}>Delete all notifications from database</Text>
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

      {/* Phone Verification Modal */}
      <Modal
        visible={showPhoneVerificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhoneVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Phone Number</Text>
              <TouchableOpacity onPress={() => setShowPhoneVerificationModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <Text style={styles.phoneDisplayText}>{user?.phone}</Text>

              <TouchableOpacity
                style={styles.sendCodeButton}
                onPress={handleSendPhoneVerification}
                disabled={sendingPhoneCode}
              >
                {sendingPhoneCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendCodeButtonText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={styles.nameInput}
                value={phoneVerificationCode}
                onChangeText={setPhoneVerificationCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
              />

              <Text style={styles.inputHint}>
                Enter the 6-digit code sent to your phone number.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPhoneVerificationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleVerifyPhoneCode}
                disabled={verifyingPhoneCode || !phoneVerificationCode.trim()}
              >
                {verifyingPhoneCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal
        visible={showPaymentMethodsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentMethodsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Methods</Text>
              <TouchableOpacity onPress={() => setShowPaymentMethodsModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.paymentMethodsContainer}>
                <Text style={styles.paymentMethodsText}>
                  Payment methods management will be available soon with Stripe integration.
                </Text>
                <View style={styles.comingSoonCard}>
                  <MaterialIcons name="credit-card" size={48} color="#94A3B8" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    Add and manage your payment methods securely
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setShowPaymentMethodsModal(false)}
              >
                <Text style={styles.saveButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Security Log Modal */}
      <Modal
        visible={showSecurityLogModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSecurityLogModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security Activity</Text>
              <TouchableOpacity onPress={() => setShowSecurityLogModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {loadingSecurityLogs ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading security logs...</Text>
                </View>
              ) : securityLogs.length > 0 ? (
                <View style={styles.securityLogContainer}>
                  {securityLogs.slice(0, 10).map((log: any, index) => (
                    <View key={index} style={styles.securityLogItem}>
                      <View style={styles.securityLogIcon}>
                        <MaterialIcons
                          name={log.success ? "check-circle" : "error"}
                          size={16}
                          color={log.success ? "#10B981" : "#EF4444"}
                        />
                      </View>
                      <View style={styles.securityLogContent}>
                        <Text style={styles.securityLogAction}>{log.action}</Text>
                        <Text style={styles.securityLogTime}>
                          {new Date(log.created_at).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="security" size={48} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No Security Events</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Your security activity will appear here
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setShowSecurityLogModal(false)}
              >
                <Text style={styles.saveButtonText}>Close</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontWeight: '400',
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 24,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
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
  nameSection: {
    marginBottom: 12,
  },
  verificationIcon: {
    marginLeft: 8,
  },
  verificationStatus: {
    marginTop: 6,
  },
  verificationStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  unverifiedDot: {
    marginLeft: 6,
  },
  unverifiedIndicatorSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  contactInfo: {
    gap: 4,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    color: '#666666',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '400',
    flex: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 28,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontWeight: '600',
    fontSize: 20,
    color: '#000000',
  },
  profileStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
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
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  compactStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  compactStatContent: {
    marginLeft: 8,
    flex: 1,
  },
  statLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
  },
  compactStatLabel: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '400',
  },
  statValue: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
  compactStatValue: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  karmaLevel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 18,
    color: '#000000',
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 8,
  },
  settingsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    color: '#000000',
    fontWeight: '500',
    fontSize: 16,
  },
  settingsSub: {
    color: '#666666',
    fontSize: 14,
    marginTop: 2,
  },
  smallVerificationBadge: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 4,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  preferenceSubtext: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  radiusContainer: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  radiusValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#000000',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  signOutText: {
    color: '#FF4444',
    fontWeight: '500',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    marginTop: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontWeight: '400',
  },
  inputHint: {
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  phoneDisplayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sendCodeButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendCodeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  paymentMethodsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  paymentMethodsText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  comingSoonCard: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 32,
    width: '100%',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  securityLogContainer: {
    maxHeight: 300,
  },
  securityLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  securityLogIcon: {
    marginRight: 12,
  },
  securityLogContent: {
    flex: 1,
  },
  securityLogAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  securityLogTime: {
    fontSize: 12,
    color: '#666666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
