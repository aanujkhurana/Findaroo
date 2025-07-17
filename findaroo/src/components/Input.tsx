import React, { useState } from 'react';
import { TextInput, Text, View, TextInputProps, StyleSheet } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

export const Input = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    if (isFocused) baseStyle.push(styles.inputFocused);
    if (error) baseStyle.push(styles.inputError);
    if (style) baseStyle.push(style);
    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={getInputStyle()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    color: '#1F2937',
  },
  inputFocused: {
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    marginTop: 4,
    fontSize: 14,
    color: '#EF4444',
  },
});
