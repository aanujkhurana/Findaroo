import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading = ({ message = 'Loading...', size = 'large' }: LoadingProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#4F46E5" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  message: {
    marginTop: 10,
    color: '#4F46E5',
    fontSize: 16,
  },
});
