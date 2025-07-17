import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  cardStyle?: any;
  imageStyle?: any;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress, userLocation, showDistance = true, cardStyle, imageStyle }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'lost':
        return { backgroundColor: COLORS.active, color: COLORS.activeText };
      case 'found':
        return { backgroundColor: COLORS.matched, color: COLORS.matchedText };
      case 'returned':
        return { backgroundColor: COLORS.resolved, color: COLORS.resolvedText };
      case 'claimed':
        return { backgroundColor: '#3b82f6', color: '#ffffff' }; // Blue for claimed
      case 'kept':
        return { backgroundColor: '#f59e0b', color: '#ffffff' }; // Orange for kept
      case 'flagged':
        return { backgroundColor: '#ef4444', color: '#ffffff' }; // Red for flagged
      case 'duplicate':
        return { backgroundColor: '#6b7280', color: '#ffffff' }; // Gray for duplicate
      default:
        return { backgroundColor: COLORS.active, color: COLORS.activeText };
    }
  };

  const getCategoryIcon = (category: string, color: string = COLORS.muted) => {
    const iconMap: { [key: string]: string } = {
      electronics: 'smartphone',
      phone: 'smartphone',
      keys: 'key',
      wallet: 'credit-card',
      bags: 'briefcase',
      bag: 'briefcase',
      clothing: 'shopping-bag',
      accessories: 'eye',
      jewelry: 'star',
      documents: 'file-text',
      pets: 'heart',
      pet: 'heart',
      sports: 'activity',
      other: 'package',
    };

    const iconName = iconMap[category?.toLowerCase()] || 'package';
    return <Feather name={iconName as any} size={22} color={color} />;
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
      getSignedImageUrl(item.user.profile_pic, 'profile-pics').then(setUserProfileUrl);
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
    <TouchableOpacity onPress={onPress} style={[styles.fbCard, cardStyle]}>
      {/* Large Image on Top */}
      {itemImageUrl ? (
        <Image
          source={{ uri: itemImageUrl }}
          style={[styles.fbImage, imageStyle]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fbImage, styles.fbImageFallback]}>
          {getCategoryIcon(item.category, COLORS.primary)}
        </View>
      )}
      {/* Content Section */}
      <View style={styles.fbContent}>
        <View style={styles.fbHeaderRow}>
          <Text style={styles.fbTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.fbStatusBadge, { backgroundColor: statusStyle.backgroundColor }]}> 
            <Text style={[styles.fbStatusBadgeText, { color: statusStyle.color }]}> 
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.fbMeta}>{item.category} • {formatDate(item.created_at)}</Text>
        <Text style={styles.fbDesc} numberOfLines={3}>{item.description}</Text>
        <View style={styles.fbFooterRow}>
          {isLocationObject(item.location) || item.location_name ? (
            <View style={styles.fbFooterItem}>
              <Feather name="map-pin" size={14} color={COLORS.muted} />
              <Text style={styles.fbFooterText} numberOfLines={1}>
                {isLocationObject(item.location)
                  ? (item.location.address || 'Location available')
                  : item.location_name}
              </Text>
            </View>
          ) : null}
          {item.reward_amount && item.reward_amount > 0 && (
            <View style={styles.fbFooterItem}>
              <Feather name="gift" size={14} color={COLORS.matchedText} />
              <Text style={styles.fbFooterText}>${item.reward_amount}</Text>
            </View>
          )}
          {distanceText && (
            <View style={styles.fbFooterItem}>
              <Feather name="navigation" size={14} color={COLORS.primary} />
              <Text style={[styles.fbFooterText, { color: COLORS.primary }]}>{distanceText}</Text>
            </View>
          )}
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
  categoryIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.matchedText,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
  },
  fbCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 18,
    overflow: 'hidden',
    padding: 0,
    flexDirection: 'column',
    minHeight: 260,
  },
  fbImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  fbImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbContent: {
    padding: 14,
    flex: 1,
  },
  fbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fbTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontWeight: '700',
    fontSize: 17,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  fbStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  fbStatusBadgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  fbMeta: {
    fontFamily: 'Inter',
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  fbDesc: {
    fontFamily: 'Inter',
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 10,
  },
  fbFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  fbFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    marginBottom: 2,
  },
  fbFooterText: {
    fontFamily: 'RobotoMono-Regular',
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 4,
    fontWeight: '500',
    maxWidth: 90,
  },
});
