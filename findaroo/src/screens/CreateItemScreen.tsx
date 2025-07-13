import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CreateItemScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 88 : 72) }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="search" size={32} color="#4F46E5" />
            </View>
          </View>
          <Text style={styles.title}>What would you like to report?</Text>
          <Text style={styles.subtitle}>Choose the type of item to get started</Text>
        </View>

        {/* Action Cards */}
        <View style={styles.cardContainer}>
          {/* Lost Item Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateLostItem')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <Feather name="alert-circle" size={28} color="#fff" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Lost Item</Text>
                  <Text style={styles.cardSubtitle}>Report something you've lost</Text>
                </View>
                <Feather name="arrow-right" size={20} color="#fff" style={styles.cardArrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Found Item Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateFoundItem')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <Feather name="check-circle" size={28} color="#fff" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Found Item</Text>
                  <Text style={styles.cardSubtitle}>Report something you've found</Text>
                </View>
                <Feather name="arrow-right" size={20} color="#fff" style={styles.cardArrow} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Help your community by reporting lost or found items
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBFC'
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    justifyContent: 'space-between'
  },
  header: {
    alignItems: 'center',
    paddingTop: 20
  },
  iconContainer: {
    marginBottom: 20
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 32
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20
  },
  actionCard: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6
  },
  cardGradient: {
    borderRadius: 18,
    padding: 20
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  cardTextContainer: {
    flex: 1
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
    lineHeight: 24
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18
  },
  cardArrow: {
    opacity: 0.8
  },
  helpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18
  }
});

