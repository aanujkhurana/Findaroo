import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingIllustration } from '../components/OnboardingIllustration';

interface SplashScreenProps {
  navigation: any;
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation, onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 3;

  const onboardingData = [
    {
      title: 'Welcome to Findaroo',
      description: 'The community-powered lost & found network that helps you find your lost items.',
      illustrationType: 'welcome',
    },
    {
      title: 'Report Lost or Found Items',
      description: 'Easily report lost items or items you\'ve found to help others in your community.',
      illustrationType: 'report',
    },
    {
      title: 'Connect and Recover',
      description: 'Connect with finders or owners through our secure chat system to arrange returns.',
      illustrationType: 'connect',
    },
  ];

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // Call the onComplete callback provided by the parent component
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        {currentPage < totalPages - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.illustrationContainer}>
          <OnboardingIllustration 
            type={onboardingData[currentPage].illustrationType as 'welcome' | 'report' | 'connect'} 
            width={width * 0.7}
            height={height * 0.3}
          />
        </View>
        
        <Text style={styles.title}>{onboardingData[currentPage].title}</Text>
        <Text style={styles.description}>{onboardingData[currentPage].description}</Text>
      </View>

      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => (
          <View 
            key={index} 
            style={[styles.paginationDot, currentPage === index && styles.activeDot]} 
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title={currentPage === totalPages - 1 ? "Get Started" : "Next"} 
          onPress={handleNext}
          className="w-full"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  illustrationContainer: {
    width: width * 0.7,
    height: height * 0.3,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#4F46E5',
    width: 20,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
});