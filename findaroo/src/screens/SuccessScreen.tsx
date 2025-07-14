import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Official Findaroo Color Scheme
const COLORS = {
  primary: '#3A8DFF',      // Primary blue
  secondary: '#FFA930',    // Secondary orange  
  success: '#33C48D',      // Success green
  error: '#FF4C4C',        // Error red
  neutral: '#F2F2F2',      // Neutral gray
  dark: '#2E2E2E',         // Dark gray
  white: '#FFFFFF',
  black: '#000000',
  text: '#2E2E2E',
  muted: '#64748B',
  background: '#FAFAFA',
};

export default function SuccessScreen() {
  const navigation: any = useNavigation();

  const handlePostAnother = () => {
    navigation.navigate('CreateLostItem');
  };

  const handleReportFound = () => {
    navigation.navigate('CreateFoundItem');
  };

  const handleViewPosts = () => {
    navigation.navigate('Activity');
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Success</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIcon}>
            <Feather name="check" size={32} color={COLORS.white} />
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Item Posted Successfully!</Text>
          <Text style={styles.subtitle}>
            Your item has been shared with the Findaroo community. We'll notify you when someone responds.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handlePostAnother}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Post Another Item</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleReportFound}
            activeOpacity={0.8}
          >
            <Feather name="search" size={20} color={COLORS.success} />
            <Text style={styles.secondaryButtonText}>Report Found Item</Text>
          </TouchableOpacity>
        </View>

        {/* What happens next */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>What happens next?</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Text style={[styles.stepNumber, { color: COLORS.primary }]}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Community Search</Text>
                <Text style={styles.stepDescription}>
                  Local Findaroo members will look out for your item
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Text style={[styles.stepNumber, { color: COLORS.success }]}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Notified</Text>
                <Text style={styles.stepDescription}>
                  We'll send you a push notification when someone responds
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                <Text style={[styles.stepNumber, { color: COLORS.secondary }]}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Safe Return</Text>
                <Text style={styles.stepDescription}>
                  Connect with the finder and arrange a safe pickup
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pro Tip */}
        <View style={styles.tipContainer}>
          <View style={styles.tipHeader}>
            <Feather name="lightbulb" size={18} color={COLORS.secondary} />
            <Text style={styles.tipTitle}>Pro Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Check back regularly and respond quickly to messages. The sooner you connect with a finder, the better your chances of getting your item back!
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleViewPosts}
            activeOpacity={0.8}
          >
            <Feather name="list" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>View My Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.outlineButton}
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Community Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2,847</Text>
            <Text style={styles.statLabel}>Items Found</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>94%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.secondary }]}>12k+</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.neutral,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  messageContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stepsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  tipContainer: {
    backgroundColor: COLORS.secondary + '15',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  navigationContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  outlineButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutral,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  outlineButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.neutral,
  },
});
