import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { getImageUrl } from '../utils/uploadImage';
import { supabase } from '../services/supabaseClient';
import { Item, User } from '../types';

export const ItemDetailsScreen = ({ navigation, route }: any) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);

  // For demo, assume item.image is a comma-separated string of image paths
  const images = item?.image ? item.image.split(',').map((img: string) => img.trim()).filter(Boolean) : [];

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('items')
          .select(`*, user:users(id, full_name, profile_pic, created_at, karma_points), tips:tips(id, amount, status, created_at, sender_id, receiver_id, payment_intent_id)`)
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        <Text style={{ textAlign: 'center', marginTop: 16 }}>Loading item details...</Text>
      </SafeAreaView>
    );
  }
  if (error || !item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 40 }}>Error: {error || 'Item not found.'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, alignSelf: 'center' }}>
          <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Calculate tips
  const totalTips = item.tips?.filter(tip => tip.amount && tip.amount > 0).reduce((sum, tip) => sum + Number(tip.amount), 0) || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <TouchableOpacity>
            <Feather name="share-2" size={22} color="#222" />
          </TouchableOpacity>
        </View>
        {/* Status Badge and Date */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'lost' ? '#fee2e2' : '#d1fae5' }] }>
            <MaterialIcons name={item.status === 'lost' ? 'error-outline' : 'check-circle'} size={16} color={item.status === 'lost' ? '#f87171' : '#22c55e'} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: item.status === 'lost' ? '#f87171' : '#22c55e' }]}>{item.status === 'lost' ? 'Lost Item' : 'Found Item'}</Text>
          </View>
          <Text style={styles.statusTime}>{formatRelativeDate(item.created_at)}</Text>
        </View>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {images.length > 0 ? (
            <>
              <Image source={{ uri: getImageUrl(images[selectedImageIdx]) }} style={styles.mainImage} resizeMode="cover" />
              <View style={styles.imageCount}><Text style={styles.imageCountText}>{selectedImageIdx + 1} / {images.length}</Text></View>
              <View style={styles.thumbnailRow}>
                {images.map((img, idx) => (
                  <TouchableOpacity key={img + idx} onPress={() => setSelectedImageIdx(idx)}>
                    <Image source={{ uri: getImageUrl(img) }} style={[styles.thumbnail, selectedImageIdx === idx && styles.thumbnailSelected]} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.mainImage, { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }] }>
              <Feather name="image" size={48} color="#bbb" />
              <Text style={{ color: '#bbb', marginTop: 8 }}>No image</Text>
            </View>
          )}
        </View>
        {/* Item Details Card */}
        <View style={styles.card}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
          <View style={styles.itemMetaRow}>
            <View style={styles.metaBox}><MaterialIcons name="category" size={18} color="#fbbf24" /><Text style={styles.metaText}>{item.category}</Text></View>
            {item.reward_amount ? (
              <View style={styles.metaBox}>
                <MaterialIcons name="attach-money" size={18} color="#22c55e" />
                <Text style={[styles.metaText, { color: '#22c55e', fontWeight: 'bold' }]}>{'$'}{item.reward_amount}</Text>
              </View>
            ) : null}
            {totalTips > 0 && (
              <View style={styles.metaBox}>
                <MaterialIcons name="tips-and-updates" size={18} color="#fbbf24" />
                <Text style={[styles.metaText, { color: '#fbbf24', fontWeight: 'bold' }]}>Tips: ${totalTips.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Last Seen Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Last Seen</Text>
          <View style={styles.lastSeenRow}><MaterialIcons name="location-pin" size={20} color="#ef4444" /><View><Text style={styles.lastSeenLoc}>{item.location_name || 'Unknown location'}</Text></View></View>
          <View style={styles.lastSeenRow}><MaterialIcons name="calendar-today" size={18} color="#38bdf8" /><Text style={styles.lastSeenDate}>{formatDate(item.created_at)}</Text></View>
          {/* Map image placeholder (replace with real map if you have coordinates) */}
          <Image source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=' + encodeURIComponent(item.location_name || '') + '&zoom=15&size=400x120&key=YOUR_GOOGLE_MAPS_API_KEY' }} style={styles.mapImage} resizeMode="cover" />
        </View>
        {/* Contact Owner Card */}
        {owner && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Contact Owner</Text>
            <View style={styles.ownerRow}>
              {owner.profile_pic ? (
                <Image source={{ uri: getImageUrl(owner.profile_pic, 'profile-pics') }} style={styles.ownerAvatar} />
              ) : (
                <View style={styles.ownerAvatar}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{owner.full_name?.charAt(0).toUpperCase()}</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{owner.full_name}</Text>
                <Text style={styles.ownerSince}>Member since {new Date(owner.created_at).getFullYear()}</Text>
              </View>
              <View style={styles.ownerRating}><MaterialIcons name="star" size={16} color="#fbbf24" /><Text style={styles.ownerRatingText}>{(owner.karma_points ? (owner.karma_points / 100).toFixed(1) : '4.8')}</Text></View>
            </View>
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.messageBtn}><MaterialIcons name="message" size={18} color="#38bdf8" /><Text style={styles.messageBtnText}>Message</Text></TouchableOpacity>
              <TouchableOpacity style={styles.callBtn}><MaterialIcons name="call" size={18} color="#22c55e" /><Text style={styles.callBtnText}>Call</Text></TouchableOpacity>
            </View>
          </View>
        )}
        {/* Similar Items Card */}
        {similarItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Similar Items Found</Text>
            {similarItems.map((sim) => (
              <TouchableOpacity key={sim.id} style={styles.similarRow} onPress={() => navigation.push('ItemDetails', { itemId: sim.id })}>
                {sim.image ? (
                  <Image source={{ uri: getImageUrl(sim.image) }} style={styles.similarImg} />
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
  safeArea: { flex: 1, backgroundColor: '#f6faff' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { fontWeight: 'bold', fontSize: 18, color: '#222' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontWeight: 'bold', fontSize: 13 },
  statusTime: { color: '#888', fontSize: 13 },
  imageGallery: { position: 'relative', alignItems: 'center', marginBottom: 8 },
  mainImage: { width: '100%', height: 200, borderRadius: 16 },
  imageCount: { position: 'absolute', top: 10, right: 18, backgroundColor: '#222', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  imageCountText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  thumbnailRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 14, marginTop: 4 },
  thumbnail: { width: 44, height: 44, borderRadius: 8, marginHorizontal: 4, borderWidth: 2, borderColor: 'transparent' },
  thumbnailSelected: { borderColor: '#38bdf8' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  itemTitle: { fontWeight: 'bold', fontSize: 18, color: '#222', marginBottom: 6 },
  sectionLabel: { color: '#6b7280', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  itemDesc: { color: '#222', fontSize: 15, marginBottom: 10 },
  itemMetaRow: { flexDirection: 'row', marginTop: 8 },
  metaBox: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
  metaText: { color: '#222', fontSize: 14, marginLeft: 4 },
  lastSeenRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  lastSeenLoc: { color: '#222', fontWeight: 'bold', fontSize: 15 },
  lastSeenDetails: { color: '#888', fontSize: 13 },
  lastSeenDate: { color: '#222', fontWeight: 'bold', fontSize: 14, marginLeft: 4 },
  lastSeenTime: { color: '#888', fontSize: 13, marginBottom: 8, marginLeft: 24 },
  mapImage: { width: '100%', height: 80, borderRadius: 10, marginTop: 6 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  ownerName: { color: '#222', fontWeight: 'bold', fontSize: 15 },
  ownerSince: { color: '#888', fontSize: 13 },
  ownerRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  ownerRatingText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 14, marginLeft: 3 },
  ownerActions: { flexDirection: 'row', marginTop: 6 },
  messageBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18, marginRight: 10 },
  messageBtnText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15, marginLeft: 6 },
  callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  callBtnText: { color: '#22c55e', fontWeight: 'bold', fontSize: 15, marginLeft: 6 },
  similarRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  similarImg: { width: 44, height: 44, borderRadius: 8, marginRight: 10 },
  similarTitle: { color: '#222', fontWeight: 'bold', fontSize: 15 },
  similarLoc: { color: '#888', fontSize: 13 },
});
