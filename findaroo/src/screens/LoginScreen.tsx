import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen = ({ navigation }: any) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
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
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSub}>Sign in to continue helping your local community find their lost items</Text>

          {/* Social Sign In Buttons */}
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
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.divider} />
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
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
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
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.rememberRow}>
            <TouchableOpacity style={styles.checkbox} onPress={() => setRememberMe((v) => !v)}>
              {rememberMe ? <MaterialIcons name="check-box" size={20} color="#38bdf8" /> : <MaterialIcons name="check-box-outline-blank" size={20} color="#b0b0b0" />}
            </TouchableOpacity>
            <Text style={styles.rememberText}>Remember me</Text>
            <TouchableOpacity style={{ marginLeft: 'auto' }}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.signInButton} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={["#38bdf8", "#06b6d4"]} style={styles.signInGradient}>
              <Text style={styles.signInText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signUpLink}>Sign up here</Text>
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
            By signing in, you agree to our <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>
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
    alignSelf: 'center',
    marginVertical: 22,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#b0b0b0',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    width: '88%',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#222',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#222',
  },
  eyeIcon: {
    padding: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '88%',
    alignSelf: 'center',
    marginBottom: 18,
    marginTop: 2,
  },
  checkbox: {
    marginRight: 6,
  },
  rememberText: {
    color: '#222',
    fontSize: 14,
  },
  forgotText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  signInButton: {
    width: '88%',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  signInGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 18,
  },
  signUpText: {
    color: '#222',
    fontSize: 15,
  },
  signUpLink: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 15,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '88%',
    alignSelf: 'center',
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  communityTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 10,
  },
  communityIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  communityIconBox: {
    alignItems: 'center',
    flex: 1,
  },
  communityIconLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  termsText: {
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 8,
  },
  link: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  madeWith: {
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});
