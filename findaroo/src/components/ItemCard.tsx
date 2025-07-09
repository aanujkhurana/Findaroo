import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Item } from '../types';
import { getImageUrl } from '../utils/uploadImage';

interface ItemCardProps {
  item: Item;
  onPress: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress }) => {
  const getStatusStyle = (status: string) => {
    return status === 'lost' 
      ? [styles.statusBadge, styles.statusLost] 
      : [styles.statusBadge, styles.statusFound];
  };

  const getStatusTextStyle = (status: string) => {
    return status === 'lost' ? styles.statusTextLost : styles.statusTextFound;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
              <Text style={styles.category}>{item.category}</Text>
            </View>
          </View>
          <View style={getStatusStyle(item.status)}>
            <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>{item.status}</Text>
          </View>
        </View>
      </View>

      {/* Image */}
      {item.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(item.image_url) }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      {/* Location and reward */}
      <View style={styles.locationRewardContainer}>
        {item.location?.address && (
          <Text style={styles.location}>
            📍 {item.location.address}
          </Text>
        )}
        {item.reward_amount && item.reward_amount > 0 && (
          <Text style={styles.reward}>
            💰 Reward: ${item.reward_amount}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.userContainer}>
          {item.user?.avatar_url ? (
            <Image
              source={{ uri: getImageUrl(item.user.avatar_url, 'profile-pics') }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.user?.full_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.userInfo}>
            {item.user?.full_name}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {formatDate(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  category: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusLost: {
    backgroundColor: '#fee2e2',
  },
  statusFound: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextLost: {
    color: '#dc2626',
  },
  statusTextFound: {
    color: '#047857',
  },
  imageContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  image: {
    width: '100%',
    height: 192,
    borderRadius: 16,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
  },
  locationRewardContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  location: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  reward: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    backgroundColor: '#d1d5db',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  userInfo: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
