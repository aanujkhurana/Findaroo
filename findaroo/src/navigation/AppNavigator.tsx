import React, { useState, useEffect } from 'react';
import { Text, Platform, Animated, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// Animated Tab Icon Component
const AnimatedTabIcon = ({
  iconName,
  focused,
  size = 24
}: {
  iconName: string;
  focused: boolean;
  size?: number;
}) => {
  const [bounceValue] = useState(new Animated.Value(1));
  const [rotateValue] = useState(new Animated.Value(0));
  const [pulseValue] = useState(new Animated.Value(1));

  useEffect(() => {
    if (focused) {
      // Bounce animation
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle rotation for some icons
      if (iconName === 'plus-circle') {
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }

      // Pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations when not focused
      bounceValue.setValue(1);
      rotateValue.setValue(0);
      pulseValue.setValue(1);
    }
  }, [focused, bounceValue, rotateValue, pulseValue, iconName]);

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          transform: [
            { scale: focused ? Animated.multiply(bounceValue, pulseValue) : bounceValue },
            { rotate: iconName === 'plus-circle' ? rotation : '0deg' },
          ],
        }}
      >
        <Feather
          name={iconName as any}
          size={focused ? size + 2 : size}
          color={focused ? '#000000' : '#64748B'}
          style={{
            textShadowColor: focused ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        />
      </Animated.View>
      {focused && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: -8,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#000000',
            transform: [{ scale: pulseValue }],
          }}
        />
      )}
    </View>
  );
};

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
const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: Platform.OS === 'android' ? 20 : 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          height: Platform.OS === 'ios' ? 70 + insets.bottom : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 12),
          paddingTop: 12,
          paddingHorizontal: 12,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
      tabBarShowLabel: false,
      tabBarActiveTintColor: '#000000',
      tabBarInactiveTintColor: '#64748B',
      tabBarItemStyle: {
        paddingVertical: 6,
        borderRadius: 20,
        marginHorizontal: 4,
        backgroundColor: 'transparent',
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeFeedScreen}
      options={{
        tabBarIcon: ({ focused, size }) => (
          <AnimatedTabIcon
            iconName="map-pin"
            focused={focused}
            size={24}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Activity"
      component={ActivityScreen}
      options={{
        tabBarIcon: ({ focused, size }) => (
          <AnimatedTabIcon
            iconName="bell"
            focused={focused}
            size={24}
          />
        ),
      }}
    />
    <Tab.Screen
      name="My Items"
      component={CreateItemScreen}
      options={{
        tabBarIcon: ({ focused, size }) => (
          <AnimatedTabIcon
            iconName="plus-circle"
            focused={focused}
            size={24}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatListScreen}
      options={{
        tabBarIcon: ({ focused, size }) => (
          <AnimatedTabIcon
            iconName="message-circle"
            focused={focused}
            size={24}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused, size }) => (
          <AnimatedTabIcon
            iconName="user"
            focused={focused}
            size={24}
          />
        ),
      }}
    />
    </Tab.Navigator>
  );
};

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
