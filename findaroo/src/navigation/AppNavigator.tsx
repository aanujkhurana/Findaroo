import React, { useState, useEffect } from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import ActivityScreen from '../screens/ActivityScreen';

// Auth Screens
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { OnBoarding } from '../screens/OnBoarding';

// Main Screens
import { HomeFeedScreen } from '../screens/HomeFeedScreen';
import { CreateItemScreen } from '../screens/CreateItemScreen';
import { ItemDetailsScreen } from '../screens/ItemDetailsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreateLostItemScreen } from '../screens/CreateLostItemScreen';
import { CreateFoundItemScreen } from '../screens/CreateFoundItemScreen';
import SuccessScreen from '../screens/SuccessScreen';

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
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        elevation: Platform.OS === 'android' ? 20 : 0,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        height: Platform.OS === 'ios' ? 88 : 72,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        paddingTop: 12,
        paddingHorizontal: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      },
      tabBarActiveTintColor: '#6366F1',
      tabBarInactiveTintColor: '#64748B',
      tabBarItemStyle: {
        paddingVertical: 4,
        borderRadius: 16,
        marginHorizontal: 2,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeFeedScreen}
      options={{
        tabBarLabel: 'Explore',
        tabBarIcon: ({ focused, size }) => (
          <Feather
            name="map-pin"
            size={focused ? 26 : 24}
            color={focused ? '#6366F1' : '#64748B'}
            style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              opacity: focused ? 1 : 0.8
            }}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Activity"
      component={ActivityScreen}
      options={{
        tabBarLabel: 'Activity',
        tabBarIcon: ({ focused, size }) => (
          <Feather
            name="bell"
            size={focused ? 26 : 24}
            color={focused ? '#6366F1' : '#64748B'}
            style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              opacity: focused ? 1 : 0.8
            }}
          />
        ),
      }}
    />
    <Tab.Screen
      name="My Items"
      component={CreateItemScreen}
      options={{
        tabBarLabel: 'Post',
        tabBarIcon: ({ focused, size }) => (
          <Feather
            name="plus-circle"
            size={focused ? 26 : 24}
            color={focused ? '#6366F1' : '#64748B'}
            style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              opacity: focused ? 1 : 0.8
            }}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatListScreen}
      options={{
        tabBarLabel: 'Message',
        tabBarIcon: ({ focused, size }) => (
          <Feather
            name="message-circle"
            size={focused ? 26 : 24}
            color={focused ? '#6366F1' : '#64748B'}
            style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              opacity: focused ? 1 : 0.8
            }}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ focused, size }) => (
          <Feather
            name="user"
            size={focused ? 26 : 24}
            color={focused ? '#6366F1' : '#64748B'}
            style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              opacity: focused ? 1 : 0.8
            }}
          />
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
        headerShown: false,
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
    <Stack.Screen name="Success" component={SuccessScreen} options={{ headerShown: false }} />
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
        <OnBoarding navigation={null} onComplete={handleOnboardingComplete} />
      ) : shouldShowMainApp ? (
        <MainStack />
      ) : (
        <AuthStackWithSkip onSkipAuth={handleSkipAuth} />
      )}
    </NavigationContainer>
  );
};
