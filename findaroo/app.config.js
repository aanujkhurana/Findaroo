import 'dotenv/config';

export default {
  expo: {
    name: 'Findaroo',
    slug: 'findaroo',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#2563eb'
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#2563eb'
      }
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    plugins: [
      'expo-location',
      'expo-image-picker',
      'expo-file-system',
      'expo-av',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#3A8DFF',
          sounds: ['./assets/notification-sound.wav'],
        },
      ],
    ]
  }
};
