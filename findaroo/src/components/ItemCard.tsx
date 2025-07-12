import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Item, LocationCoords } from '../types';
import { getSignedImageUrl } from '../utils/uploadImage';
import { calculateDistance, formatDistance } from '../utils/location';

const COLORS = {
  background: '#f8fafc',
  card: '#fff',
  primary: '#2563eb',
  accent: '#fbbf24',
  text: '#222',
  muted: '#6b7280',
  border: '#e5e7eb',
  active: '#fee2e2',
  matched: '#dcfce7',
  resolved: '#e0e7ff',
  activeText: '#fb7185',
  matchedText: '#22c55e',
  resolvedText: '#6366f1',
};

interface ItemCardProps {
  item: Item;
  onPress: () => void;
  userLocation?: LocationCoords | null;
  showDistance?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress, userLocation, showDistance = true }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'lost':
        return { backgroundColor: COLORS.active, color: COLORS.activeText };
      case 'found':
        return { backgroundColor: COLORS.matched, color: COLORS.matchedText };
      case 'returned':
        return { backgroundColor: COLORS.resolved, color: COLORS.resolvedText };
      default:
        return { backgroundColor: COLORS.active, color: COLORS.activeText };
    }
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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 14) {
      return '1 week ago';
    } else {
      return date.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  // Signed URLs for images
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [userProfileUrl, setUserProfileUrl] = useState('');

  useEffect(() => {
    if (item.image) {
      getSignedImageUrl(item.image, 'item-images').then(setItemImageUrl);
    } else {
      setItemImageUrl('');
    }
    if (item.user?.profile_pic) {
      getSignedImageUrl(item.user.profile_pic, 'profile-pictures').then(setUserProfileUrl);
    } else {
      setUserProfileUrl('');
    }
  }, [item.image, item.user?.profile_pic]);

  // Type guard for location object
  function isLocationObject(value: any): value is { address?: string; latitude: number; longitude: number } {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.latitude === 'number' &&
      typeof value.longitude === 'number'
    );
  }

  // Calculate distance if both locations are available
  const getDistanceText = (): string | null => {
    if (!showDistance || !userLocation || !isLocationObject(item.location)) {
      return null;
    }

    const distance = calculateDistance(userLocation, item.location);
    return formatDistance(distance);
  };

  const distanceText = getDistanceText();
  const statusStyle = getStatusStyle(item.status);

  // Debug location data
  console.log('[ItemCard] Item location:', item.location);
  console.log('[ItemCard] Item location_name:', item.location_name);
  console.log('[ItemCard] Is location object:', isLocationObject(item.location));

  return (
    <TouchableOpacity onPress={onPress} style={styles.itemCard}>
      {/* Icon/Image Section */}
      <View style={styles.itemIcon}>
        {itemImageUrl ? (
          <Image
            source={{ uri: itemImageUrl }}
            style={styles.iconImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.categoryEmoji}>{getCategoryIcon(item.category)}</Text>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.itemContent}>
        {/* Header Row */}
        <View style={styles.itemHeaderRow}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Meta Row */}
        <Text style={styles.itemMeta}>
          {item.category} • {formatDate(item.created_at)}
        </Text>

        {/* Description */}
        <Text style={styles.itemDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Reward Row */}
        {item.reward_amount && item.reward_amount > 0 && (
          <Text style={styles.rewardText}>
            💰 Reward: ${item.reward_amount}
          </Text>
        )}

        {/* Footer Row */}
        <View style={styles.itemFooterRow}>
          <View style={styles.itemFooterLeft}>
            {isLocationObject(item.location) ? (
              <Text style={styles.itemFooterText} numberOfLines={1}>
                📍 {item.location.address || 'Location available'}
              </Text>
            ) : item.location_name ? (
              <Text style={styles.itemFooterText} numberOfLines={1}>
                📍 {item.location_name}
              </Text>
            ) : null}
            {distanceText && (
              <Text style={[styles.itemFooterText, { color: COLORS.primary, fontWeight: '600', marginLeft: 8 }]}>
                • {distanceText}
              </Text>
            )}
          </View>
          <Text style={styles.itemFooterText}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iconImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  itemContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  itemMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  itemDesc: {
    color: COLORS.text,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.matchedText,
    marginTop: 4,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  itemFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemFooterText: {
    color: COLORS.muted,
    fontSize: 12,
  },
});
