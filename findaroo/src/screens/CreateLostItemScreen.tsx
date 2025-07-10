import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

const ITEM_TYPES = [
  { key: 'phone', label: 'Phone', icon: <Feather name="smartphone" size={28} color="#6b7280" /> },
  { key: 'wallet', label: 'Wallet', icon: <FontAwesome5 name="wallet" size={28} color="#6b7280" /> },
  { key: 'keys', label: 'Keys', icon: <Feather name="key" size={28} color="#6b7280" /> },
  { key: 'electronics', label: 'Electronics', icon: <Feather name="monitor" size={28} color="#6b7280" /> },
  { key: 'clothing', label: 'Clothing', icon: <Feather name="shopping-bag" size={28} color="#6b7280" /> },
  { key: 'bag', label: 'Bag', icon: <Feather name="briefcase" size={28} color="#6b7280" /> },
  { key: 'accessories', label: 'Accessories', icon: <Feather name="eye" size={28} color="#6b7280" /> },
  { key: 'other', label: 'Other', icon: <Feather name="more-horizontal" size={28} color="#6b7280" /> },
];

export const CreateLostItemScreen = ({ navigation }: any) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [urgent, setUrgent] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Lost Item</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* Progress Bar */}
      <View style={styles.progressRow}>
        <Text style={styles.progressStep}>Step 1 of 5</Text>
        <Text style={styles.progressLabel}>Item Type</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={styles.progressBarFill} />
      </View>
      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="search" size={32} color="#fbbf24" />
        </View>
        <Text style={styles.question}>What did you lose?</Text>
        <Text style={styles.subtext}>Select the type of item you've lost</Text>
        {/* Item Type Grid */}
        <View style={styles.grid}>
          {ITEM_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.gridItem, selectedType === type.key && styles.gridItemSelected]}
              onPress={() => setSelectedType(type.key)}
            >
              {type.icon}
              <Text style={[styles.gridLabel, selectedType === type.key && styles.gridLabelSelected]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Urgent Alert Toggle */}
        <View style={styles.urgentRow}>
          <View style={styles.urgentIconBox}>
            <MaterialIcons name="bolt" size={20} color="#fbbf24" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.urgentTitle}>Urgent Alert</Text>
            <Text style={styles.urgentSub}>Notify nearby users immediately</Text>
          </View>
          <Switch
            value={urgent}
            onValueChange={setUrgent}
            trackColor={{ false: '#f3f4f6', true: '#fbbf24' }}
            thumbColor={urgent ? '#fbbf24' : '#fff'}
          />
        </View>
      </View>
      {/* Footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !selectedType && { backgroundColor: '#cbd5e1' }]}
          disabled={!selectedType}
          onPress={() => {/* TODO: Go to next step */}}
        >
          <Text style={styles.nextBtnText}>Next Step</Text>
        </TouchableOpacity>
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
  progressLabel: { color: '#888', fontWeight: '500', fontSize: 15 },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginHorizontal: 24, marginBottom: 18 },
  progressBarFill: { width: '20%', height: 6, backgroundColor: '#38bdf8', borderRadius: 3 },
  content: { alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { backgroundColor: '#fef3c7', borderRadius: 18, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 18 },
  question: { fontWeight: 'bold', fontSize: 20, color: '#222', marginBottom: 2, textAlign: 'center' },
  subtext: { color: '#6b7280', fontSize: 15, marginBottom: 18, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18 },
  gridItem: { width: '42%', aspectRatio: 1.2, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', margin: 8 },
  gridItemSelected: { borderColor: '#38bdf8', backgroundColor: '#e0f2fe' },
  gridLabel: { color: '#6b7280', fontWeight: 'bold', fontSize: 15, marginTop: 10 },
  gridLabelSelected: { color: '#38bdf8' },
  urgentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 18 },
  urgentIconBox: { backgroundColor: '#fef3c7', borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  urgentTitle: { color: '#222', fontWeight: 'bold', fontSize: 15 },
  urgentSub: { color: '#6b7280', fontSize: 13 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 18 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 },
  nextBtn: { backgroundColor: '#38bdf8', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
}); 