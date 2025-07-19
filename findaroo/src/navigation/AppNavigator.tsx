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
import { NotificationScreen } from '../screens/NotificationScreen';
import { NotificationInitializer } from '../components/NotificationInitializer';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Keep the same icons for both states - we'll use styling to differentiate
const getIconName = (baseName: string, focused: boolean): string => {
  // Always return the same icon regardless of focus state
  return baseName;
};

// Animated Tab Icon Component
const AnimatedTabIcon = ({
  iconName,
  focused,
  size = 24,
  label
}: {
  iconName: string;
  focused: boolean;
  size?: number;
  label: string;
}) => {
  const [bounceValue] = useState(new Animated.Value(1));
  const [rotateValue] = useState(new Animated.Value(0));
  const [sliderValue] = useState(new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    if (focused) {
      // Bounce animation
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle rotation for some icons (disabled to prevent upside down icons)
      // if (iconName === 'plus-circle') {
      //   Animated.timing(rotateValue, {
      //     toValue: 1,
      //     duration: 300,
      //     useNativeDriver: true,
      //   }).start();
      // }

      // Slider animation
      Animated.timing(sliderValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Reset animations when not focused
      bounceValue.setValue(1);
      rotateValue.setValue(0);

      // Hide slider
      Animated.timing(sliderValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [focused, bounceValue, rotateValue, sliderValue, iconName]);

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const sliderWidth = sliderValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 32],
  });

  const sliderOpacity = sliderValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
      {/* Top slider indicator */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -10,
          height: 2.5,
          backgroundColor: '#000000',
          borderRadius: 2,
          width: sliderWidth,
          opacity: sliderOpacity,
        }}
      />

      <Animated.View
        style={{
          transform: [
            { scale: bounceValue },
          ],
          alignItems: 'center',
          width: 60, // Fixed width to prevent label wrapping
        }}
      >
        <Feather
          name={getIconName(iconName, focused) as any}
          size={focused ? size + 2 : size}
          color={focused ? '#000000' : '#64748B'}
          style={{
            textShadowColor: focused ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
            marginBottom: 4,
            fontWeight: focused ? 'bold' : 'normal',
          }}
        />

        {/* Label */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: focused ? '600' : '400',
            color: focused ? '#000000' : '#64748B',
            textAlign: 'center',
            width: '100%',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {label}
        </Text>
      </Animated.View>
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
          height: Platform.OS === 'ios' ? 85 + insets.bottom : 75 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 12),
          paddingTop: 16,
          paddingHorizontal: 12,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
      tabBarShowLabel: false, // We'll handle labels in our custom component
      tabBarActiveTintColor: '#000000',
      tabBarInactiveTintColor: '#64748B',
      tabBarItemStyle: {
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 2,
        backgroundColor: 'transparent',
        flex: 1,
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
            label="Explore"
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
            label="Activity"
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
            label="Post"
          />
        ),
      }}
    />
    <Tab.Screen
      name="Messages"
      component={ChatListScreen}
      options={{
        tabBarIcon: ({ focused, size }) => (
          <AnimatedTabIcon
            iconName="message-circle"
            focused={focused}
            size={24}
            label="Message"
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
            label="Profile"
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
    <Stack.Screen
      name="Notifications"
      component={NotificationScreen}
      options={{
        title: 'Notifications',
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
      <NotificationInitializer />
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
