import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export const CreateItemScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>What do you want to report?</Text>
        <Text style={styles.subtitle}>Select the type of item to continue</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#38bdf8' }]} onPress={() => navigation.navigate('CreateLostItem')}>
          <Text style={styles.buttonText}>Lost Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#22c55e' }]} onPress={() => navigation.navigate('CreateFoundItem')}>
          <Text style={styles.buttonText}>Found Item</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6faff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' },
  button: { width: '100%', paddingVertical: 20, borderRadius: 16, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

