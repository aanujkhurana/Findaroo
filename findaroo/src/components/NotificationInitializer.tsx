import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

// Component to initialize notifications inside NavigationContainer
export const NotificationInitializer = () => {
  useNotifications();
  return null; // This component doesn't render anything
};
