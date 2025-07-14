import React, { ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Initialize notifications
  useNotifications();

  return <>{children}</>;
};
