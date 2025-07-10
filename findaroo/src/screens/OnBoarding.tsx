import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { OnboardingIllustration } from '../components/OnboardingIllustration';

const onboardingData = [
  {
    title: "G'day! Welcome to\nFindaroo",
    subtitle: "Australia's friendly lost & found community that helps mates find their missing stuff",
    imageType: 'welcome', // changed from 'custom' to 'welcome' for type safety
    image: require('../../assets/onboarding1.png'),
  },
  {
    title: 'Report Lost or Found Items',
    subtitle: "Easily report lost items or items you've found to help others in your community.",
    imageType: 'report',
  },
  {
    title: 'Connect and Recover',
    subtitle: 'Connect with finders or owners through our secure chat system to arrange returns.',
    imageType: 'connect',
  },
];

export const OnBoarding = ({ navigation, onComplete }: any) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = onboardingData.length;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleSkip = () => {
    if (onComplete) onComplete();
  };

  const step = onboardingData[currentPage];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Icon and Skip */}
        <View style={styles.topRow}>
          {currentPage === 0 ? (
            <View style={styles.iconCircle}>
              <Feather name="search" size={40} color="#fff" />
            </View>
          ) : <View style={{ width: 96 }} />}
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        {/* Title & Subtitle */}
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
        {/* Illustration or Image */}
        {currentPage === 0 ? (
          <Image source={step.image} style={styles.image} resizeMode="cover" />
        ) : (
          <OnboardingIllustration type={step.imageType as 'report' | 'connect' | 'welcome'} width={280} height={200} />
        )}
        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          {onboardingData.map((_, idx) => (
            <View key={idx} style={[styles.dot, currentPage === idx && styles.dotActive]} />
          ))}
        </View>
        {/* Navigation Buttons */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.prevBtn} onPress={handlePrev} disabled={currentPage === 0}>
            <Text style={[styles.prevText, currentPage === 0 && { color: '#e5e7eb' }]}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>{currentPage === totalPages - 1 ? 'Get Started' : 'Next'}</Text>
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