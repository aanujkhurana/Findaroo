import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Share, Modal, Alert, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { getSignedImageUrl } from '../utils/uploadImage';
import { supabase } from '../services/supabaseClient';
import { Item, User, LocationCoords, Category } from '../types';
import { ItemMapView } from '../components/ItemMapView';
import { calculateDistance, formatDistance, getCurrentLocation } from '../utils/location';
import { useAuth } from '../hooks/useAuth';

// Findaroo UI Style Guide Colors
const COLORS = {
  primary: '#000000',      // Black accent (updated to match style guide)
  secondary: '#FFA930',    // Official Findaroo orange
  success: '#33C48D',      // Success green
  error: '#FF4C4C',        // Error red
  neutral: '#F2F2F2',      // Neutral gray
  dark: '#2E2E2E',         // Dark gray
  background: '#f8fafc',   // Light background
  card: '#ffffff',         // Card background
  text: '#222222',         // Text color
  muted: '#6b7280',        // Muted text
  border: '#e5e7eb',       // Border color
};

// Category icon mapping with proper Feather icons
const getCategoryIcon = (category: string, size: number = 20, color: string = COLORS.dark) => {
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
  return <Feather name={iconName as any} size={size} color={color} />;
};

export const ItemDetailsScreen = ({ navigation, route }: any) => {
  const { itemId } = route.params;
  const { user } = useAuth(); // Get current user
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [ownerProfileUrl, setOwnerProfileUrl] = useState('');
  const [similarImages, setSimilarImages] = useState<{ [id: string]: string }>({});
  const [showFullMap, setShowFullMap] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  // Check if current user is the owner of this item
  const isOwner = user && owner && user.id === owner.id;

  // Helper functions for status styling with Findaroo colors
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'lost': return { backgroundColor: '#FFE8E8' };
      case 'found': return { backgroundColor: '#E8F5E8' };
      case 'returned': return { backgroundColor: '#E8F0FF' };
      case 'claimed': return { backgroundColor: '#E8F0FF' };
      case 'kept': return { backgroundColor: '#FFF4E8' };
      case 'flagged': return { backgroundColor: '#FFE8E8' };
      case 'duplicate': return { backgroundColor: COLORS.neutral };
      default: return { backgroundColor: '#FFE8E8' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost': return COLORS.error;
      case 'found': return COLORS.success;
      case 'returned': return COLORS.dark;      // Use dark instead of primary for better contrast
      case 'claimed': return COLORS.dark;       // Use dark instead of primary for better contrast
      case 'kept': return COLORS.secondary;
      case 'flagged': return COLORS.error;
      case 'duplicate': return COLORS.muted;
      default: return COLORS.error;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lost': return 'alert-circle';
      case 'found': return 'check-circle';
      case 'returned': return 'rotate-ccw';
      case 'claimed': return 'user-check';
      case 'kept': return 'archive';
      case 'flagged': return 'flag';
      case 'duplicate': return 'copy';
      default: return 'alert-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'lost': return 'Lost Item';
      case 'found': return 'Found Item';
      case 'returned': return 'Returned';
      case 'claimed': return 'Claimed';
      case 'kept': return 'Kept';
      case 'flagged': return 'Flagged';
      case 'duplicate': return 'Duplicate';
      default: return 'Unknown Status';
    }
  };

  // Parse coordinates from PostGIS WKB (Well-Known Binary) format
  function parsePostGISLocation(locationData: string | undefined) {
    if (!locationData || typeof locationData !== 'string') {
      return null;
    }

    // First try the simple POINT format (for backward compatibility)
    const pointMatch = locationData.match(/POINT\((-?\d+\.\d+) (-?\d+\.\d+)\)/);
    if (pointMatch) {
      return {
        longitude: parseFloat(pointMatch[1]),
        latitude: parseFloat(pointMatch[2]),
      };
    }

    // Handle PostGIS WKB format (hex string)
    if (locationData.length > 20 && locationData.match(/^[0-9A-Fa-f]+$/)) {
      try {
        // This is a simplified parser for PostGIS WKB POINT format
        // The format is: endianness(1) + type(4) + SRID(4) + x(8) + y(8) bytes in hex

        // Skip the first 18 characters (endianness + type + SRID = 9 bytes = 18 hex chars)
        const coordsHex = locationData.substring(18);

        if (coordsHex.length >= 32) { // Need at least 16 bytes (32 hex chars) for x,y coordinates
          // Extract X coordinate (longitude) - first 8 bytes (16 hex chars)
          const xHex = coordsHex.substring(0, 16);
          // Extract Y coordinate (latitude) - next 8 bytes (16 hex chars)
          const yHex = coordsHex.substring(16, 32);

          // Convert hex to IEEE 754 double precision float
          const longitude = hexToDouble(xHex);
          const latitude = hexToDouble(yHex);

          if (!isNaN(longitude) && !isNaN(latitude)) {
            return { longitude, latitude };
          }
        }
      } catch (error) {
        console.error('[ItemDetailsScreen] Error parsing WKB format:', error);
      }
    }

    return null;
  }

  // Helper function to convert hex string to IEEE 754 double
  function hexToDouble(hex: string): number {
    // Reverse byte order for little-endian
    const reversedHex = hex.match(/.{2}/g)?.reverse().join('') || hex;

    // Convert to ArrayBuffer and then to Float64
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    for (let i = 0; i < 8; i++) {
      const byte = parseInt(reversedHex.substr(i * 2, 2), 16);
      view.setUint8(i, byte);
    }

    return view.getFloat64(0, false); // false = big-endian
  }

  // Helper function to format relative date
  function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Handle phone call functionality
  const handleCall = async () => {
    if (!owner?.phone) {
      Alert.alert('No Phone Number', 'This user has not provided a phone number.');
      return;
    }

    const phoneUrl = `tel:${owner.phone}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Error', 'Unable to make phone calls on this device.');
    }
  };

  // Get computed values only when item exists
  const firstImage = item?.image ? item.image.split(',').map((img: string) => img.trim()).filter(Boolean)[0] : undefined;
  const coords = item ? parsePostGISLocation(item.location) : null;

  // Enhanced share handler
  const handleShare = async () => {
    try {
      if (!item) {
        console.error('Cannot share: item is null');
        return;
      }

      const statusText = getStatusLabel(item.status);
      const locationText = item.location_name || 'Location not specified';
      const rewardText = item.reward_amount ? `\nReward: $${item.reward_amount}` : '';

      const message = `${statusText}: ${item.title}\n\n${item.description || 'No description provided'}\n\nLocation: ${locationText}${rewardText}\n\nFound on Findaroo - The Lost & Found Network`;

      await Share.share({
        message,
        title: `${statusText}: ${item.title}`
      });
    } catch (error) {
      console.error('Error sharing item:', error);
      Alert.alert('Error', 'Unable to share this item. Please try again.');
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('items')
          .select(`
            *,
            user:users(id, full_name, profile_pic, created_at, karma_points),
            tips:tips(id, amount, status, created_at, sender_id, receiver_id, payment_intent_id)
          `)
          .eq('id', itemId)
          .single();
        if (error) throw error;
        setItem(data);
        setOwner(data.user || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load item');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  useEffect(() => {
    // Fetch similar items by category, excluding current item
    const fetchSimilar = async () => {
      if (!item?.category) return;
      const { data, error } = await supabase
        .from('items')
        .select('id, title, image, location_name')
        .eq('category', item.category)
        .neq('id', item.id)
        .limit(2);
      if (!error && data) setSimilarItems(data as Item[]);
    };
    if (item) fetchSimilar();
  }, [item]);

  // Get user location and calculate distance
  useEffect(() => {
    const getUserLocationAndDistance = async () => {
      if (!item?.location) return;

      try {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);

          // Parse item location
          const itemCoords = parsePostGISLocation(item.location);
          if (itemCoords) {
            const itemLocation: LocationCoords = {
              latitude: itemCoords.latitude,
              longitude: itemCoords.longitude,
              address: item.location_name || 'Unknown location'
            };

            const dist = calculateDistance(location, itemLocation);
            setDistance(formatDistance(dist));
          }
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    getUserLocationAndDistance();
  }, [item]);

  // Fetch signed URL for main image and owner profile
  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Fetch main item image
        if (item?.image) {
          console.log(`[ItemDetailsScreen] Fetching item image URL for path: ${item.image}`);
          const imageUrl = await getSignedImageUrl(item.image, 'item-images');
          setMainImageUrl(imageUrl);
        } else {
          setMainImageUrl('');
        }
        
        // Fetch owner profile picture
        if (owner?.profile_pic) {
          console.log(`[ItemDetailsScreen] Fetching owner profile picture URL for path: ${owner.profile_pic}`);
          const profileUrl = await getSignedImageUrl(owner.profile_pic, 'profile-pics');

          if (profileUrl) {
            console.log(`[ItemDetailsScreen] Successfully got profile picture URL: ${profileUrl.substring(0, 50)}...`);
            setOwnerProfileUrl(profileUrl);
          } else {
            console.error('[ItemDetailsScreen] Failed to get signed URL for owner profile picture');
            setOwnerProfileUrl('');
          }
        } else {
          console.log('[ItemDetailsScreen] Owner has no profile picture, using initials fallback');
          setOwnerProfileUrl('');
        }
      } catch (error) {
        console.error('[ItemDetailsScreen] Error fetching images:', error);
      }
    };
    
    fetchImages();
  }, [item?.image, owner?.profile_pic]);

  // Fetch signed URLs for similar items
  useEffect(() => {
    const fetchSimilarImages = async () => {
      const images: { [id: string]: string } = {};
      await Promise.all(similarItems.map(async (sim) => {
        if (sim.image) {
          images[sim.id] = await getSignedImageUrl(sim.image, 'item-images');
        }
      }));
      setSimilarImages(images);
    };
    if (similarItems.length > 0) fetchSimilarImages();
  }, [similarItems]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.dark} />
          <Text style={styles.loadingText}>Loading item details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error || 'Item not found.'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorButton}>
            <Feather name="arrow-left" size={20} color={COLORS.dark} />
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  // Only run this block if item is not null and not loading
  // Move this block just before the JSX return, after all null/undefined checks
  // Calculate tips
  const totalTips = item.tips?.filter(tip => tip.amount && tip.amount > 0).reduce((sum, tip) => sum + Number(tip.amount), 0) || 0;

  // Only use firstImage and coords in JSX if item is not null
  // Pass them as props or use them in the JSX below only if item is not null

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <TouchableOpacity onPress={handleShare}>
            <Feather name="share-2" size={22} color="#222" />
          </TouchableOpacity>
        </View>
        {/* Status Badge and Date removed as per request */}
        {/* Combined Item Details Card with Image/Icon */}
        <View style={styles.card}>
          {/* Image Section */}
          {mainImageUrl ? (
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: mainImageUrl }} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <View style={styles.statusBadgeOverlay}>
                  <Feather name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                  <Text style={[styles.statusOverlayText, { color: getStatusColor(item.status) }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noImageHeader}>
              <View style={styles.noImageIconContainer}>
                {getCategoryIcon(item.category, 32, COLORS.muted)}
              </View>
              <View style={styles.noImageHeaderContent}>
                <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                  <Feather name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Item Details Section */}
          <View style={styles.itemDetailsSection}>
            {/* Title and Meta Info */}
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.itemSubHeader}>
                <Text style={styles.itemTime}>{formatRelativeDate(item.created_at)}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.itemDesc}>{item.description || 'No description provided.'}</Text>
            </View>

            {/* Meta Information */}
            <View style={styles.itemMetaRow}>
              <View style={styles.metaBox}>
                {getCategoryIcon(item.category, 18, COLORS.secondary)}
                <Text style={styles.metaText}>{item.category}</Text>
              </View>
              {item.reward_amount && (
                <View style={styles.metaBox}>
                  <Feather name="gift" size={18} color={COLORS.success} />
                  <Text style={[styles.metaText, { color: COLORS.success, fontWeight: 'bold' }]}>
                    ${item.reward_amount}
                  </Text>
                </View>
              )}
              {totalTips > 0 && (
                <View style={styles.metaBox}>
                  <Feather name="gift" size={18} color={COLORS.secondary} />
                  <Text style={[styles.metaText, { color: COLORS.secondary, fontWeight: 'bold' }]}>
                    Tips: ${totalTips.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {/* Call to Action Button */}
            <View style={styles.ctaContainer}>
              {isOwner ? (
                // Show owner actions
                <TouchableOpacity
                  style={[styles.ctaButton, styles.ctaButtonOwner]}
                  onPress={() => navigation.navigate('Activity')}
                >
                  <Feather name="edit-3" size={20} color="#fff" />
                  <Text style={styles.ctaButtonText}>Manage This Item</Text>
                </TouchableOpacity>
              ) : (
                // Show messaging actions for other users
                item.status === 'lost' ? (
                  <TouchableOpacity
                    style={[styles.ctaButton, styles.ctaButtonPrimary]}
                    onPress={() => navigation.navigate('Chat', {
                      itemId: item.id,
                      otherUserId: owner?.id,
                      otherUserName: owner?.full_name,
                    })}
                  >
                    <Feather name="message-circle" size={20} color="#fff" />
                    <Text style={styles.ctaButtonText}>I Found This Item!</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.ctaButton, styles.ctaButtonSecondary]}
                    onPress={() => navigation.navigate('Chat', {
                      itemId: item.id,
                      otherUserId: owner?.id,
                      otherUserName: owner?.full_name,
                    })}
                  >
                    <Feather name="user-check" size={20} color="#fff" />
                    <Text style={styles.ctaButtonText}>This Is Mine!</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
        {/* Last Seen Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Last Seen</Text>
            {distance && (
              <View style={styles.distanceContainer}>
                <Feather name="navigation" size={14} color={COLORS.dark} />
                <Text style={styles.distanceText}>{distance} away</Text>
              </View>
            )}
          </View>
          <View style={styles.lastSeenRow}>
            <Feather name="map-pin" size={20} color={COLORS.error} />
            <View>
              <Text style={styles.lastSeenLoc}>{item.location_name || 'Unknown location'}</Text>
            </View>
          </View>
          <View style={styles.lastSeenRow}>
            <Feather name="clock" size={18} color={COLORS.dark} />
            <Text style={styles.lastSeenDate}>{formatRelativeDate(item.created_at)}</Text>
          </View>

          {/* Interactive map if coordinates available */}
          {coords ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.mapImage}
                initialRegion={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                mapType="standard"
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
              >
                <Marker
                  coordinate={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  }}
                  title={item.title}
                  description={item.location_name}
                />
              </MapView>
              <TouchableOpacity
                style={styles.mapTouchOverlay}
                onPress={() => setShowFullMap(true)}
                activeOpacity={0.8}
              >
                <View style={styles.mapOverlay}>
                  <Feather name="maximize-2" size={16} color="#fff" />
                  <Text style={styles.mapOverlayText}>Tap to expand</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noMapContainer}>
              <Feather name="map-pin" size={24} color={COLORS.muted} />
              <Text style={styles.noMapText}>Location not available</Text>
            </View>
          )}
        </View>
        {/* Contact Owner Card */}
        {owner && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Contact Owner</Text>

            {/* Owner Profile Row */}
            <View style={styles.ownerProfileRow}>
              {ownerProfileUrl ? (
                <Image
                  source={{ uri: ownerProfileUrl }}
                  style={styles.ownerAvatar}
                  onError={() => {
                    console.log('[ItemDetailsScreen] Failed to load profile image, falling back to initials');
                    setOwnerProfileUrl('');
                  }}
                />
              ) : (
                <View style={[styles.ownerAvatar, styles.ownerAvatarFallback]}>
                  <Text style={styles.ownerAvatarText}>
                    {owner.full_name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}

              <View style={styles.ownerInfo}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>{owner.full_name}</Text>
                  {/* Verification badge if user is verified */}
                  {owner.phone_verified && (
                    <View style={styles.verificationBadge}>
                      <Feather name="check-circle" size={14} color={COLORS.success} />
                    </View>
                  )}
                </View>

                <Text style={styles.ownerSince}>
                  Member since {new Date(owner.created_at).getFullYear()}
                </Text>

                {/* Karma/Rating Display */}
                <View style={styles.ownerStatsRow}>
                  <View style={styles.karmaContainer}>
                    <Feather name="star" size={14} color={COLORS.secondary} />
                    <Text style={styles.karmaText}>
                      {(owner.karma_points ? (owner.karma_points / 100).toFixed(1) : '4.8')} karma
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Contact Actions */}
            <View style={styles.contactActions}>
              {!isOwner ? (
                <>
                  <TouchableOpacity
                    style={styles.primaryContactBtn}
                    onPress={() => navigation.navigate('Chat', {
                      itemId: item.id,
                      otherUserId: owner.id,
                      otherUserName: owner.full_name,
                    })}
                  >
                    <Feather name="message-circle" size={18} color="#fff" />
                    <Text style={styles.primaryContactBtnText}>Send Message</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryContactBtn,
                      !owner.phone && styles.disabledContactBtn
                    ]}
                    onPress={handleCall}
                    disabled={!owner.phone}
                  >
                    <Feather
                      name="phone"
                      size={18}
                      color={owner.phone ? COLORS.success : COLORS.muted}
                    />
                    <Text style={[
                      styles.secondaryContactBtnText,
                      { color: owner.phone ? COLORS.success : COLORS.muted }
                    ]}>
                      {owner.phone ? 'Call' : 'No Phone'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.ownerNotice}>
                  <Feather name="user" size={18} color={COLORS.muted} />
                  <Text style={styles.ownerNoticeText}>This is your item</Text>
                </View>
              )}
            </View>
          </View>
        )}
        {/* Similar Items Card */}
        {similarItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Similar Items Found</Text>
            {similarItems.map((sim) => (
              <TouchableOpacity key={sim.id} style={styles.similarRow} onPress={() => navigation.push('ItemDetails', { itemId: sim.id })}>
                {similarImages[sim.id] ? (
                  <Image source={{ uri: similarImages[sim.id] }} style={styles.similarImg} />
                ) : (
                  <View style={[styles.similarImg, { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }] }>
                    <Feather name="image" size={24} color="#bbb" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.similarTitle}>{sim.title}</Text>
                  <Text style={styles.similarLoc}>{sim.location_name}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#bbb" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Full Map Modal */}
      {coords && (
        <Modal
          visible={showFullMap}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowFullMap(false)}
        >
          <ItemMapView
            itemLocation={{
              latitude: coords.latitude,
              longitude: coords.longitude,
              address: item.location_name || 'Unknown location'
            }}
            itemTitle={item.title}
            itemStatus={item.status}
            showUserLocation={true}
            showApproximateArea={true}
            onClose={() => setShowFullMap(false)}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}
function formatRelativeDate(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: COLORS.text
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  statusText: {
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4
  },

  // Combined Card Image Styles
  cardImageContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 0,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.neutral
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadgeOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusOverlayText: {
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },

  // No Image Header (when no image available) - Simplified
  noImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noImageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  noImageHeaderContent: {
    flex: 1,
  },

  // Item Details Section
  itemDetailsSection: {
    padding: 20,
  },
  descriptionSection: {
    marginBottom: 20,
  },

  // Card - Updated for combined layout
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 0,  // Remove padding since sections handle their own padding
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',  // Ensure rounded corners work with image
  },
  itemHeader: {
    marginBottom: 20,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 30,
  },
  itemSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTime: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
  },
  sectionLabel: {
    color: COLORS.muted,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '600'
  },
  itemDesc: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 0,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutral,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    textTransform: 'capitalize',
  },

  // Call to Action Button
  ctaContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  ctaButtonPrimary: {
    backgroundColor: COLORS.success,
  },
  ctaButtonSecondary: {
    backgroundColor: COLORS.dark,
  },
  ctaButtonOwner: {
    backgroundColor: COLORS.dark,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Location Section
  lastSeenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  lastSeenLoc: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  lastSeenDate: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 15,
    marginLeft: 8
  },

  // Map Styles
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.neutral
  },
  mapTouchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  mapOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noMapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.neutral,
    borderRadius: 12,
    paddingVertical: 32,
    marginTop: 12,
  },
  noMapText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },


  // Owner Section - Updated for modern contact card
  ownerProfileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  ownerAvatarFallback: {
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ownerName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  verificationBadge: {
    marginLeft: 4,
  },
  ownerSince: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 8,
  },
  ownerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  karmaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  karmaText: {
    color: COLORS.secondary,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },

  // Contact Actions - Updated for better UX
  contactActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  primaryContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryContactBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  disabledContactBtn: {
    backgroundColor: COLORS.neutral,
    borderColor: COLORS.border,
  },
  secondaryContactBtnText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  ownerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.neutral,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  ownerNoticeText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Similar Items
  similarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  similarImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: COLORS.neutral,
  },
  similarTitle: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15
  },
  similarLoc: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
});
