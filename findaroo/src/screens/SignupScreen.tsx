import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export const SignupScreen = ({ navigation, onSkipAuth }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { signUp } = useAuth();

  const validateForm = () => {
    const newErrors: any = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    else if (fullName.trim().length < 2) newErrors.fullName = 'Full name must be at least 2 characters';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const response = await signUp(email, password, fullName);
    if (response.error) {
      Alert.alert('Signup Failed', response.error.message);
    } else if (response.needsConfirmation) {
      Alert.alert(
        'Check Your Email',
        response.message || 'Please check your email to confirm your account. After confirming, you can sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert(
        'Success!',
        'Account created successfully! You can now sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Gradient Card with Logo */}
          <LinearGradient colors={["#e0f2fe", "#f1f5f9"]} style={styles.gradientCard}>
            <View style={styles.logoCircle}>
              <Feather name="search" size={36} color="#38bdf8" />
            </View>
            <Text style={styles.appName}>Findaroo</Text>
            <Text style={styles.appSubtitle}>Lost & Found Network</Text>
          </LinearGradient>

          {/* Welcome Text */}
          <Text style={styles.welcomeTitle}>Create your account</Text>
          <Text style={styles.welcomeSub}>Sign up to join the community and help mates find their missing stuff</Text>

          {/* Social Sign Up Buttons */}
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={20} color="#ea4335" style={{ marginRight: 8 }} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#111', borderColor: '#111', marginTop: 12 }] }>
            <FontAwesome name="apple" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={[styles.socialButtonText, { color: '#fff' }]}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.divider} />
          </View>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#b0b0b0"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#b0b0b0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#b0b0b0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#b0b0b0" />
              </Pressable>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#b0b0b0"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeIcon}>
                <Feather name={showConfirm ? "eye" : "eye-off"} size={20} color="#b0b0b0" />
              </Pressable>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signInButton} onPress={handleSignup} disabled={loading}>
            <LinearGradient colors={["#38bdf8", "#06b6d4"]} style={styles.signInGradient}>
              <Text style={styles.signInText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signUpLink}>Sign in here</Text>
            </TouchableOpacity>
          </View>

          {/* Community Features */}
          <View style={styles.communityCard}>
            <Text style={styles.communityTitle}>Join the Community</Text>
            <View style={styles.communityIconsRow}>
              <View style={styles.communityIconBox}>
                <Ionicons name="search" size={24} color="#38bdf8" />
                <Text style={styles.communityIconLabel}>Find Lost Items</Text>
              </View>
              <View style={styles.communityIconBox}>
                <Ionicons name="heart" size={24} color="#06b6d4" />
                <Text style={styles.communityIconLabel}>Help Others</Text>
              </View>
              <View style={styles.communityIconBox}>
                <Ionicons name="people" size={24} color="#f59e42" />
                <Text style={styles.communityIconLabel}>Local Network</Text>
              </View>
            </View>
          </View>

          {/* Terms and Privacy */}
          <Text style={styles.termsText}>
            By creating an account, you agree to our <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>
          </Text>
          <Text style={styles.madeWith}>Made with <Text style={{ color: '#f87171' }}>♥</Text> in Australia</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6faff',
  },
  scrollContent: {
    padding: 0,
    alignItems: 'center',
    paddingBottom: 32,
  },
  gradientCard: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  appSubtitle: {
    color: '#6b7280',
    fontSize: 15,
    marginBottom: 0,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 18,
    marginBottom: 2,
    textAlign: 'center',
  },
  welcomeSub: {
    color: '#6b7280',
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '88%',
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 0,
    justifyContent: 'center',
  },
  socialButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '88%',
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#6b7280',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputContainer: {
    width: '88%',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 2,
    marginLeft: 2,
  },
  signInButton: {
    width: '88%',
    marginTop: 18,
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  signInGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  signInText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  signUpText: {
    color: '#6b7280',
    fontSize: 15,
  },
  signUpLink: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 15,
  },
  communityCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    width: '88%',
    alignSelf: 'center',
  },
  communityTitle: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  communityIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  communityIconBox: {
    alignItems: 'center',
    flex: 1,
  },
  communityIconLabel: {
    color: '#2563eb',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  termsText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 2,
  },
  link: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  madeWith: {
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
