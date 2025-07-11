import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import { Message } from '../types';

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      itemId: string;
      otherUserId: string;
      otherUserName: string;
    };
  };
}

export const ChatScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6366F1' }}>Messages (placeholder)</Text>
    </View>
  );
};
