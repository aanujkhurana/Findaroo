import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface LoginScreenProps {
  navigation: any;
  onSkipAuth?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onSkipAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);

    if (error) {
      Alert.alert('Login Failed', error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Welcome to Findaroo
            </Text>
            <Text style={styles.subtitle}>
              Help reunite lost items with their owners
            </Text>
          </View>

          {/* Logo placeholder */}
          <View style={styles.logo}>
            <Text style={styles.logoText}>F</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.signInButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Button
              title="Sign Up"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('Signup')}
            />
          </View>

          {/* Forgot Password */}
          <View style={styles.forgotPassword}>
            <Button
              title="Forgot Password?"
              variant="outline"
              size="sm"
              onPress={() => {
                // TODO: Implement forgot password
                Alert.alert('Coming Soon', 'Forgot password functionality will be added soon.');
              }}
              style={styles.forgotPasswordButton}
            />
          </View>

          {/* Skip Button */}
          {onSkipAuth && (
            <View style={styles.skipContainer}>
              <Button
                title="Skip for Now"
                variant="secondary"
                size="sm"
                onPress={onSkipAuth}
                style={styles.skipButton}
              />
              <Text style={styles.skipText}>
                Continue without account (limited features)
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 48,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    backgroundColor: '#4F46E5',
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
  },
  form: {
    marginBottom: 24,
  },
  signInButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 16,
    marginRight: 8,
  },
  forgotPassword: {
    marginTop: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipButton: {
    marginBottom: 8,
  },
  skipText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
