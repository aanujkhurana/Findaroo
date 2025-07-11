import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        height: 72,
        paddingBottom: 12,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
      },
      tabBarActiveTintColor: '#4F46E5',
      tabBarInactiveTintColor: '#9CA3AF',
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeFeedScreen}
      options={{
        tabBarLabel: 'Map',
        tabBarIcon: ({ focused }) => (
          <MaterialIcons name="map" size={28} color={focused ? '#4F46E5' : '#9CA3AF'} />
        ),
      }}
    />
    <Tab.Screen 
      name="My Items" 
      component={CreateItemScreen}
      options={{
        tabBarLabel: 'My Items',
        tabBarIcon: ({ focused }) => (
          <MaterialIcons name="inventory" size={28} color={focused ? '#4F46E5' : '#9CA3AF'} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ focused }) => (
          <MaterialIcons name="person" size={28} color={focused ? '#4F46E5' : '#9CA3AF'} />
        ),
      }}
    />
    <Tab.Screen 
      name="Activity" 
      component={ActivityScreen}
      options={{
        tabBarLabel: 'Activity',
        tabBarIcon: ({ focused }) => (
          <MaterialIcons name="notifications" size={28} color={focused ? '#4F46E5' : '#9CA3AF'} />
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
