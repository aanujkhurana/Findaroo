import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Screens
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { SplashScreen } from '../screens/SplashScreen';

// Main Screens
import { HomeFeedScreen } from '../screens/HomeFeedScreen';
import { CreateItemScreen } from '../screens/CreateItemScreen';
import { ItemDetailsScreen } from '../screens/ItemDetailsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreateLostItemScreen } from '../screens/CreateLostItemScreen';
import { CreateFoundItemScreen } from '../screens/CreateFoundItemScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack - for login/signup
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

// Auth Stack with Skip - for login/signup with skip option
const AuthStackWithSkip = ({ onSkipAuth }: { onSkipAuth: () => void }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login">
      {(props) => <LoginScreen {...props} onSkipAuth={onSkipAuth} />}
    </Stack.Screen>
    <Stack.Screen name="Signup">
      {(props) => <SignupScreen {...props} onSkipAuth={onSkipAuth} />}
    </Stack.Screen>
  </Stack.Navigator>
);

// Main Tab Navigator - for authenticated users
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: 8,
        paddingTop: 8,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#6b7280',
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeFeedScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20 }}>{focused ? '🏠' : '🏡'}</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Create" 
      component={CreateItemScreen}
      options={{
        tabBarLabel: 'Post Item',
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20 }}>{focused ? '➕' : '✚'}</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20 }}>{focused ? '👤' : '👥'}</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

// Main Stack - contains tabs and modal screens
const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="ItemDetails" 
      component={ItemDetailsScreen}
      options={{
        title: 'Item Details',
        headerBackTitle: 'Back',
      }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{
        title: 'Chat',
        headerBackTitle: 'Back',
      }}
    />
    <Stack.Screen 
      name="CreateLostItem" 
      component={CreateLostItemScreen}
      options={{
        title: 'Report Lost Item',
        headerBackTitle: 'Back',
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="CreateFoundItem" 
      component={CreateFoundItemScreen}
      options={{
        title: 'Report Found Item',
        headerBackTitle: 'Back',
        headerShown: false,
      }}
    />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { session, loading } = useAuth();
  const [hasSkippedAuth, setHasSkippedAuth] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true); // Default to true to avoid flash
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      // Check if user has skipped auth
      const skipStatus = await AsyncStorage.getItem('hasSkippedAuth');
      if (skipStatus === 'true') {
        setHasSkippedAuth(true);
      }
      
      // Check if user has seen onboarding
      const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(onboardingStatus === 'true');
    } catch (error) {
      console.error('Error checking initial status:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSkipAuth = async () => {
    try {
      await AsyncStorage.setItem('hasSkippedAuth', 'true');
      setHasSkippedAuth(true);
    } catch (error) {
      console.error('Error setting skip status:', error);
    }
  };

  const handleResetAuth = async () => {
    try {
      await AsyncStorage.removeItem('hasSkippedAuth');
      setHasSkippedAuth(false);
    } catch (error) {
      console.error('Error resetting skip status:', error);
    }
  };

  if (loading || isInitializing) {
    return <Loading message="Loading..." />;
  }

  // Show main app if user is authenticated OR has skipped authentication
  const shouldShowMainApp = session || hasSkippedAuth;
  
  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <NavigationContainer>
      {!hasSeenOnboarding ? (
        <SplashScreen navigation={null} onComplete={handleOnboardingComplete} />
      ) : shouldShowMainApp ? (
        <MainStack />
      ) : (
        <AuthStackWithSkip onSkipAuth={handleSkipAuth} />
      )}
    </NavigationContainer>
  );
};
