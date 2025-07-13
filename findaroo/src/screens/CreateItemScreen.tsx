import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const CreateItemScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
    paddingTop: 40,
    paddingBottom: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 48
  },
  iconContainer: {
    marginBottom: 24
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 36
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20
  },
  actionCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8
  },
  cardGradient: {
    borderRadius: 20,
    padding: 24
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  cardTextContainer: {
    flex: 1
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 28
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20
  },
  cardArrow: {
    opacity: 0.8
  },
  helpContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center'
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20
  }
});

