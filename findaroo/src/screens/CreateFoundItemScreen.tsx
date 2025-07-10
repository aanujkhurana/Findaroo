import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Image, Switch, Platform } from 'react-native';
import { Feather, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ITEM_TYPES = [
  'Phone', 'Wallet', 'Keys', 'Electronics', 'Clothing', 'Bag', 'Accessories', 'Other'
];

const RETURN_METHODS = [
  { key: 'dropoff', label: 'Safe Drop-off', desc: 'I\'ll drop it at a safe location' },
  { key: 'pickup', label: 'Hold for Pickup', desc: 'I\'ll keep it until owner collects' },
  { key: 'courier', label: 'Request Courier', desc: 'Arrange pickup service' },
];

export const CreateFoundItemScreen = ({ navigation }: any) => {
  const [itemType, setItemType] = useState<string>('');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [returnMethod, setReturnMethod] = useState('dropoff');
  const [notes, setNotes] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Found Item</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* Progress Bar */}
      <View style={styles.progressRow}>
        <Text style={styles.progressStep}>Step 1 of 4</Text>
        <Text style={styles.progressPercent}>25%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={styles.progressBarFill} />
      </View>
      <View style={styles.content}>
        {/* What did you find? */}
        <Text style={styles.sectionTitle}>What did you find?</Text>
        <Text style={styles.label}>Item type</Text>
        {/* Dropdown (mock) */}
        <TouchableOpacity style={styles.dropdown}>
          <Text style={[styles.dropdownText, !itemType && { color: '#b0b0b0' }]}> {itemType || 'Select item type'} </Text>
          <Feather name="chevron-down" size={20} color="#b0b0b0" />
          {/* Dropdown options (mock) */}
        </TouchableOpacity>
        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Describe the item (color, brand, size, etc.)"
          placeholderTextColor="#b0b0b0"
          value={desc}
          onChangeText={setDesc}
          multiline
        />
        {/* Photo upload */}
        <Text style={styles.label}>Add photo (optional)</Text>
        <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Feather name="camera" size={32} color="#b0b0b0" />
              <Text style={styles.photoText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* Where did you find it? */}
        <Text style={styles.sectionTitle}>Where did you find it?</Text>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Street address or landmark"
          placeholderTextColor="#b0b0b0"
          value={location}
          onChangeText={setLocation}
        />
        <TouchableOpacity style={styles.locationBtn}>
          <Feather name="map-pin" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.locationBtnText}>Use Current Location</Text>
        </TouchableOpacity>
        {/* When did you find it? */}
        <Text style={styles.sectionTitle}>When did you find it?</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.input}>
              <Text style={[styles.inputText, !date && { color: '#b0b0b0' }]}>{date || 'dd/mm/yyyy'}</Text>
              <Feather name="calendar" size={18} color="#b0b0b0" style={{ position: 'absolute', right: 12, top: 14 }} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity style={styles.input}>
              <Text style={[styles.inputText, !time && { color: '#b0b0b0' }]}>{time || '--:-- --'}</Text>
              <Feather name="clock" size={18} color="#b0b0b0" style={{ position: 'absolute', right: 12, top: 14 }} />
            </TouchableOpacity>
          </View>
        </View>
        {/* How would you like to return it? */}
        <Text style={styles.sectionTitle}>How would you like to return it?</Text>
        {RETURN_METHODS.map((method) => (
          <TouchableOpacity
            key={method.key}
            style={[styles.radioBox, returnMethod === method.key && styles.radioBoxSelected]}
            onPress={() => setReturnMethod(method.key)}
          >
            <View style={[styles.radioCircle, returnMethod === method.key && styles.radioCircleSelected]}>
              {returnMethod === method.key && <View style={styles.radioDot} />}
            </View>
            <View>
              <Text style={styles.radioLabel}>{method.label}</Text>
              <Text style={styles.radioDesc}>{method.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {/* Anything else? */}
        <Text style={styles.sectionTitle}>Anything else?</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Any additional details about the item or where you found it..."
          placeholderTextColor="#b0b0b0"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        {/* Action Buttons */}
        <TouchableOpacity style={styles.postBtn}>
          <Text style={styles.postBtnText}>Post Found Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.draftBtn}>
          <Text style={styles.draftBtnText}>Save as Draft</Text>
        </TouchableOpacity>
        {/* Safety Note */}
        <View style={styles.safetyBox}>
          <Feather name="shield" size={18} color="#38bdf8" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Safety First</Text>
            <Text style={styles.safetyText}>Only meet in public places. We\'ll verify identities before sharing contact details.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6faff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingBottom: 8 },
  headerTitle: { fontWeight: 'bold', fontSize: 20, color: '#222' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 2 },
  progressStep: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15 },
  progressPercent: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15 },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginHorizontal: 24, marginBottom: 18 },
  progressBarFill: { width: '25%', height: 6, backgroundColor: '#38bdf8', borderRadius: 3 },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  sectionTitle: { fontWeight: 'bold', fontSize: 17, color: '#222', marginTop: 18, marginBottom: 6 },
  label: { color: '#6b7280', fontSize: 14, marginBottom: 4, marginTop: 10 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, marginBottom: 8, backgroundColor: '#fff' },
  dropdownText: { fontSize: 15, color: '#222' },
  textarea: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, minHeight: 60, backgroundColor: '#fff', fontSize: 15, marginBottom: 8 },
  photoBox: { borderWidth: 1, borderColor: '#b0b0b0', borderStyle: 'dashed', borderRadius: 12, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: '#fff' },
  photo: { width: '100%', height: '100%', borderRadius: 12 },
  photoText: { color: '#b0b0b0', fontSize: 14, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, backgroundColor: '#fff', fontSize: 15, marginBottom: 8 },
  inputText: { fontSize: 15, color: '#222' },
  locationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, justifyContent: 'center', marginBottom: 8 },
  locationBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radioBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, marginBottom: 8, backgroundColor: '#fff' },
  radioBoxSelected: { borderColor: '#38bdf8', backgroundColor: '#e0f2fe' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#b0b0b0', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  radioCircleSelected: { borderColor: '#38bdf8' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#38bdf8' },
  radioLabel: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  radioDesc: { color: '#6b7280', fontSize: 13 },
  postBtn: { backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  draftBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  draftBtnText: { color: '#222', fontWeight: 'bold', fontSize: 17 },
  safetyBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f0f9ff', borderRadius: 10, padding: 12, marginTop: 18 },
  safetyTitle: { color: '#2563eb', fontWeight: 'bold', fontSize: 14 },
  safetyText: { color: '#6b7280', fontSize: 13 },
}); 