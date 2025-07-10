import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import { Item } from '../types';
import { Loading } from '../components/Loading';
import { Button } from '../components/Button';
import { getImageUrl } from '../utils/uploadImage';
import { useAuth } from '../hooks/useAuth';

interface ItemDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      itemId: string;
    };
  };
}

export const ItemDetailsScreen: React.FC<ItemDetailsScreenProps> = ({ navigation, route }) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          user:users(id, full_name, profile_pic)
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;

      setItem(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!user || !item) return;
    
    if (user.id === item.user_id) {
      Alert.alert('Info', 'This is your own item');
      return;
    }

    navigation.navigate('Chat', {
      itemId: item.id,
      otherUserId: item.user_id,
      otherUserName: item.user?.full_name,
    });
  };

  const handleMarkResolved = async () => {
    if (!item || !user || user.id !== item.user_id) return;

    Alert.alert(
      'Mark as Resolved',
      'Are you sure you want to mark this item as resolved? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark Resolved',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('items')
                .update({ resolved: true })
                .eq('id', item.id);

              if (error) throw error;

              Alert.alert('Success', 'Item marked as resolved!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      electronics: '📱',
      clothing: '👕',
      accessories: '👜',
      documents: '📄',
      keys: '🔑',
      bags: '🎒',
      pets: '🐕',
      jewelry: '💍',
      sports: '⚽',
      other: '📦',
    };
    return icons[category] || '📦';
  };

  const getStatusColor = (status: string) => {
    return status === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-emerald-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <Loading message="Loading item details..." />;
  }

  if (error || !item) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-red-600 text-center mb-4">
          {error || 'Item not found'}
        </Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const isOwnItem = user?.id === item.user_id;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Image */}
        {item.image_url && (
          <Image
            source={{ uri: getImageUrl(item.image_url) }}
            className="w-full h-64"
            resizeMode="cover"
          />
        )}

        <View className="p-6 bg-white rounded-t-3xl -mt-4">
          {/* Header */}
          <View className="mb-6">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 mr-4">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {item.title}
                </Text>
                <View className="flex-row items-center mb-2">
                  <Text className="text-3xl mr-2">{getCategoryIcon(item.category)}</Text>
                  <Text className="text-gray-600 capitalize text-lg">{item.category}</Text>
                </View>
              </View>
              <View className={`px-4 py-2 rounded-full ${getStatusColor(item.status)}`}>
                <Text className="text-sm font-medium capitalize">{item.status}</Text>
              </View>
            </View>

            {/* Reward */}
            {item.reward_amount && item.reward_amount > 0 && (
              <View className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <Text className="text-emerald-600 font-medium text-center">
                  💰 Reward: ${item.reward_amount}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-medium text-gray-900 mb-2">Description</Text>
            <Text className="text-gray-700 leading-6">{item.description}</Text>
          </View>

          {/* Location */}
          {item.location?.address && (
            <View className="mb-6">
              <Text className="text-lg font-medium text-gray-900 mb-2">Location</Text>
              <View className="flex-row items-center">
                <Text className="text-xl mr-2">📍</Text>
                <Text className="text-gray-700 flex-1">{item.location.address}</Text>
              </View>
            </View>
          )}

          {/* User Info */}
          <View className="mb-6 p-4 bg-gray-50 rounded-xl">
            <Text className="text-lg font-medium text-gray-900 mb-3">Posted by</Text>
            <View className="flex-row items-center">
              {item.user?.profile_pic ? (
                <Image
                  source={{ uri: getImageUrl(item.user.profile_pic, 'profile-pics') }}
                  className="w-12 h-12 rounded-full mr-3"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-indigo-600 mr-3 justify-center items-center">
                  <Text className="text-lg text-white">
                    {item.user?.full_name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-lg font-medium text-gray-900">
                  {item.user?.full_name}
                </Text>
                <Text className="text-gray-600">
                  Community member
                </Text>
              </View>
            </View>
          </View>

          {/* Date */}
          <View className="mb-6">
            <Text className="text-sm text-gray-500">
              Posted on {formatDate(item.created_at)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            {!isOwnItem && (
              <Button
                title={`Contact ${item.user?.full_name?.split(' ')[0]}`}
                onPress={handleContact}
                className="mb-3"
              />
            )}
            
            {isOwnItem && !item.resolved && (
              <Button
                title="Mark as Resolved"
                onPress={handleMarkResolved}
                variant="secondary"
                className="mb-3"
              />
            )}

            {isOwnItem && (
              <Button
                title="Edit Item"
                onPress={() => {
                  // TODO: Navigate to edit screen
                  Alert.alert('Coming Soon', 'Edit functionality will be added soon.');
                }}
                variant="outline"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
