import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Alert, Platform, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { signOut } = useAuth();
  // Static data for demo
  const avatarUrl = undefined;
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [autoAccept, setAutoAccept] = useState(true);
  const [radius, setRadius] = useState(15);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Sign Out Failed', error.message);
    } else if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

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
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>A</Text>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <MaterialIcons name="check" size={16} color="#fff" />
                </View>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Sarah Chen</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialIcons name="location-pin" size={16} color="#aaa" />
                <Text style={styles.profileLocation}>Melbourne, VIC</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileStatsRow}>
            <View style={styles.reputationCard}>
              <Text style={styles.reputationLabel}>Reputation Score</Text>
              <Text style={styles.reputationValue}>4.8</Text>
              <View style={styles.starsRow}>
                {[...Array(5)].map((_, i) => (
                  <MaterialIcons key={i} name="star" size={16} color="#FFD700" />
                ))}
                <Text style={styles.reputationSub}>Based on 23 returns</Text>
              </View>
            </View>
            <View style={styles.karmaCard}>
              <Text style={styles.karmaLabel}>Karma Points</Text>
              <Text style={styles.karmaValue}>1,247</Text>
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
          {/* Credit/Debit Card */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentIconBox}>
              <MaterialIcons name="credit-card" size={20} color="#2563eb" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentText}>•••• 4242</Text>
              <Text style={styles.paymentSub}>Expires 12/25</Text>
            </View>
            <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>
          </View>
          {/* PayID */}
          <View style={styles.paymentRow}>
            <View style={[styles.paymentIconBox, { backgroundColor: '#FFEAD1' }] }>
              <Text style={{ color: '#F59E42', fontWeight: 'bold', fontSize: 16 }}>P</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentText}>sarah.chen@email.com</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#bbb" style={{ marginLeft: 'auto' }} />
          </View>
          {/* ID Verification */}
          <View style={styles.verificationCard}>
            <View style={styles.verificationIcon}><MaterialIcons name="check" size={20} color="#fff" /></View>
            <View>
              <Text style={styles.verifiedText}>Verified</Text>
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
      </ScrollView>
      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 32,
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
    paddingHorizontal: 20,
    paddingBottom: 24,
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

