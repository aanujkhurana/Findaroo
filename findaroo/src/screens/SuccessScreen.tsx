import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
// If you have a RootStackParamList, import it and use:
// import { StackNavigationProp } from '@react-navigation/stack';
// const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
// For now, use 'any' to avoid linter errors:

const COLORS = {
  background: '#f8fafc',
  card: '#fff',
  primary: '#2563eb',
  accent: '#fbbf24',
  text: '#222',
  muted: '#6b7280',
  border: '#e5e7eb',
  green: '#22c55e',
  blue: '#38bdf8',
  orange: '#fbbf24',
  gradient1: '#6ee7b7',
  gradient2: '#3b82f6',
};

export default function SuccessScreen() {
  const navigation: any = useNavigation();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmation</Text>
        <View style={{ width: 22 }} />
      </View>
      {/* Checkmark */}
      <View style={styles.checkCircleWrap}>
        <LinearGradient colors={[COLORS.gradient1, COLORS.gradient2]} style={styles.checkCircle}>
          <Feather name="check" size={48} color="#fff" />
        </LinearGradient>
      </View>
      {/* Thank You */}
      <Text style={styles.thankYou}>Thank You!</Text>
      <Text style={styles.confirmMsg}>
        Your post has been successfully submitted to the Findaroo community.\nWe'll notify you when someone responds.
      </Text>
      {/* Post Another Item */}
      <TouchableOpacity style={styles.gradientBtn} onPress={() => navigation.navigate('CreateLostItem')}>
        <LinearGradient colors={[COLORS.gradient2, COLORS.gradient1]} style={styles.gradientBtnBg}>
          <Text style={styles.gradientBtnText}>Post Another Item</Text>
          <Feather name="plus" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>
      {/* Report Found Item */}
      <TouchableOpacity style={styles.cardBtn} onPress={() => navigation.navigate('CreateFoundItem')}>
        <View style={styles.cardBtnContent}>
          <Text style={styles.cardBtnText}>Report Found Item</Text>
          <Feather name="search" size={20} color={COLORS.primary} style={{ marginLeft: 8 }} />
        </View>
        <Text style={styles.cardBtnSubText}>Found something? Help reunite it with its owner!</Text>
      </TouchableOpacity>
      {/* What happens next */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>What happens next?</Text>
      </View>
      <View style={styles.stepsList}>
        <View style={styles.stepRow}>
          <View style={[styles.stepCircle, { backgroundColor: '#dbeafe' }]}><Text style={styles.stepNum}>1</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>Community Search</Text>
            <Text style={styles.stepDesc}>Local Findaroo members will look out for your item</Text>
          </View>
        </View>
        <View style={styles.stepRow}>
          <View style={[styles.stepCircle, { backgroundColor: '#dcfce7' }]}><Text style={[styles.stepNum, { color: COLORS.green }]}>2</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>Get Notified</Text>
            <Text style={styles.stepDesc}>We'll send you a push notification when someone responds</Text>
          </View>
        </View>
        <View style={styles.stepRow}>
          <View style={[styles.stepCircle, { backgroundColor: '#fef3c7' }]}><Text style={[styles.stepNum, { color: COLORS.orange }]}>3</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>Safe Return</Text>
            <Text style={styles.stepDesc}>Connect with the finder and arrange a safe pickup</Text>
          </View>
        </View>
      </View>
      {/* Pro Tip */}
      <View style={styles.proTipBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Feather name="map-pin" size={16} color={COLORS.blue} style={{ marginRight: 6 }} />
          <Text style={styles.proTipTitle}>Pro Tip</Text>
        </View>
        <Text style={styles.proTipText}>Check back regularly and respond quickly to messages. The sooner you connect with a finder, the better your chances of getting your item back!</Text>
      </View>
      {/* View My Posts */}
      <TouchableOpacity style={styles.gradientBtn} onPress={() => navigation.navigate('Activity')}>
        <LinearGradient colors={[COLORS.gradient2, COLORS.gradient1]} style={styles.gradientBtnBg}>
          <Text style={styles.gradientBtnText}>View My Posts</Text>
        </LinearGradient>
      </TouchableOpacity>
      {/* Back to Home */}
      <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.outlineBtnText}>Back to Home</Text>
      </TouchableOpacity>
      {/* Community Impact */}
      <View style={styles.impactBox}>
        <View style={styles.impactCol}>
          <Text style={styles.impactValue}>2,847</Text>
          <Text style={styles.impactLabel}>Items Found</Text>
        </View>
        <View style={styles.impactCol}>
          <Text style={[styles.impactValue, { color: COLORS.green }]}>94%</Text>
          <Text style={styles.impactLabel}>Success Rate</Text>
        </View>
        <View style={styles.impactCol}>
          <Text style={[styles.impactValue, { color: COLORS.accent }]}>12k+</Text>
          <Text style={styles.impactLabel}>Active</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  headerTitle: { fontWeight: 'bold', fontSize: 18, color: COLORS.text },
  checkCircleWrap: { marginTop: 18, marginBottom: 8 },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  thankYou: {
    fontWeight: 'bold',
    fontSize: 24,
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  confirmMsg: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
    marginHorizontal: 18,
  },
  gradientBtn: {
    width: '88%',
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  gradientBtnBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  gradientBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    width: '88%',
    marginTop: 4,
    marginBottom: 12,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardBtnSubText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitleRow: {
    width: '88%',
    marginTop: 10,
    marginBottom: 2,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
  stepsList: {
    width: '88%',
    marginTop: 6,
    marginBottom: 10,
    alignSelf: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNum: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  stepTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: COLORS.text,
  },
  stepDesc: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  proTipBox: {
    backgroundColor: '#e0f2fe',
    borderRadius: 14,
    padding: 14,
    width: '88%',
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'center',
  },
  proTipTitle: {
    color: COLORS.blue,
    fontWeight: 'bold',
    fontSize: 15,
  },
  proTipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  outlineBtn: {
    width: '88%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  outlineBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  impactBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    width: '88%',
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  impactCol: {
    alignItems: 'center',
    flex: 1,
  },
  impactValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.primary,
  },
  impactLabel: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
}); 