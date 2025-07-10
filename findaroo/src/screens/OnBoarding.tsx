import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const OnBoarding = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Icon and Skip */}
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Feather name="search" size={40} color="#fff" />
          </View>
          <TouchableOpacity style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        {/* Welcome Text */}
        <Text style={styles.title}>G'day! Welcome to{"\n"}<Text style={{ color: '#111' }}>Findaroo</Text></Text>
        <Text style={styles.subtitle}>Australia's friendly lost & found community that helps mates find their missing stuff</Text>
        {/* Main Image */}
        <Image source={require('../../assets/onboarding1.png')} style={styles.image} resizeMode="cover" />
        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        {/* Navigation Buttons */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.prevBtn}>
            <Text style={styles.prevText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  topRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  iconCircle: { backgroundColor: '#18a7f5', borderRadius: 48, width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { position: 'absolute', right: 0, top: 18 },
  skipText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 },
  title: { fontWeight: 'bold', fontSize: 28, color: '#111', textAlign: 'center', marginTop: 18, marginBottom: 8 },
  subtitle: { color: '#374151', fontSize: 16, textAlign: 'center', marginBottom: 18 },
  image: { width: 280, height: 200, borderRadius: 18, marginBottom: 18 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#18a7f5' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  prevBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  prevText: { color: '#b0b0b0', fontWeight: 'bold', fontSize: 16 },
  nextBtn: { backgroundColor: '#18a7f5', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  nextText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});