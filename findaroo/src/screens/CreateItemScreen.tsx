import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
              <Feather name="plus-circle" size={28} color="#000" />
            </View>
          </View>
          <Text style={styles.title}>Report an Item</Text>
          <Text style={styles.subtitle}>Help your community find what matters</Text>
        </View>

        {/* Action Cards */}
        <View style={styles.cardContainer}>
          {/* Lost Item Card */}
          <TouchableOpacity
            style={[styles.actionCard, styles.lostCard]}
            onPress={() => navigation.navigate('CreateLostItem')}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={[styles.cardIconContainer, styles.lostIconContainer]}>
                <Feather name="search" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, styles.lostTitle]}>I Lost Something</Text>
                <Text style={[styles.cardSubtitle, styles.lostSubtitle]}>Report an item you've lost</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Feather name="arrow-right" size={18} color="#FF4C4C" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Found Item Card */}
          <TouchableOpacity
            style={[styles.actionCard, styles.foundCard]}
            onPress={() => navigation.navigate('CreateFoundItem')}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={[styles.cardIconContainer, styles.foundIconContainer]}>
                <Feather name="check-circle" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, styles.foundTitle]}>I Found Something</Text>
                <Text style={[styles.cardSubtitle, styles.foundSubtitle]}>Report an item you've found</Text>
              </View>
              <View style={styles.cardArrowContainer}>
                <Feather name="arrow-right" size={18} color="#33C48D" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Feather name="heart" size={16} color="#666" />
          <Text style={styles.helpText}>
            Every report helps reunite someone with their belongings
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    justifyContent: 'space-between'
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
    paddingBottom: 30
  },
  iconContainer: {
    marginBottom: 20
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    fontWeight: '400',
    maxWidth: 280
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 40
  },
  actionCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  lostCard: {
    borderColor: '#FF4C4C',
    backgroundColor: '#FFFAFA'
  },
  foundCard: {
    borderColor: '#33C48D',
    backgroundColor: '#F8FFFC'
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  lostIconContainer: {
    backgroundColor: '#FF4C4C'
  },
  foundIconContainer: {
    backgroundColor: '#33C48D'
  },
  cardTextContainer: {
    flex: 1
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 26,
    letterSpacing: -0.3
  },
  lostTitle: {
    color: '#000000'
  },
  foundTitle: {
    color: '#000000'
  },
  cardSubtitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400'
  },
  lostSubtitle: {
    color: '#666666'
  },
  foundSubtitle: {
    color: '#666666'
  },
  cardArrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center'
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 20,
    gap: 10
  },
  helpText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    flex: 1
  }
});

