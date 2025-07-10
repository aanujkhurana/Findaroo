import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

const mockImages = [
  require('../../assets/icon.png'),
  require('../../assets/adaptive-icon.png'),
  require('../../assets/favicon.png'),
];

export const ItemDetailsScreen = ({ navigation }: any) => {
  // Mock data for demo
  const [selectedImage, setSelectedImage] = useState(0);
  const item = {
    title: 'Black Leather Wallet',
    description:
      "Lost my black leather wallet near Central Station. It's a bi-fold wallet with my driver's license, credit cards, and about $80 cash. Has a small tear on the back corner. Really need it back as it has all my important cards!",
    category: 'Wallet',
    reward: 50,
    status: 'Lost Item',
    statusColor: '#f87171',
    lastSeen: {
      location: 'Central Station, Sydney',
      details: 'Platform 4, near the coffee shop',
      date: 'Monday, Dec 4, 2023',
      time: 'Around 8:30 AM',
      map: require('../../assets/splash-icon.png'),
    },
    owner: {
      name: 'Mike Johnson',
      avatar: require('../../assets/icon.png'),
      rating: 4.8,
      memberSince: 2022,
    },
    similar: [
      {
        image: require('../../assets/icon.png'),
        title: 'Brown Wallet',
        location: 'Found at Town Hall',
      },
      {
        image: require('../../assets/adaptive-icon.png'),
        title: 'Black Wallet',
        location: 'Found at Museum Station',
      },
    ],
  };

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
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }] }>
            <MaterialIcons name="error-outline" size={16} color={item.statusColor} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
          </View>
          <Text style={styles.statusTime}>2 days ago</Text>
        </View>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <Image source={mockImages[selectedImage]} style={styles.mainImage} resizeMode="cover" />
          <View style={styles.imageCount}><Text style={styles.imageCountText}>{selectedImage + 1} / {mockImages.length}</Text></View>
        </View>
        <View style={styles.thumbnailRow}>
          {mockImages.map((img, idx) => (
            <TouchableOpacity key={idx} onPress={() => setSelectedImage(idx)}>
              <Image source={img} style={[styles.thumbnail, selectedImage === idx && styles.thumbnailSelected]} />
            </TouchableOpacity>
          ))}
        </View>
        {/* Item Details Card */}
        <View style={styles.card}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
          <View style={styles.itemMetaRow}>
            <View style={styles.metaBox}><MaterialIcons name="category" size={18} color="#fbbf24" /><Text style={styles.metaText}>Wallet</Text></View>
            <View style={styles.metaBox}>
              <MaterialIcons name="attach-money" size={18} color="#22c55e" />
              <Text style={[styles.metaText, { color: '#22c55e', fontWeight: 'bold' }]}>{'$'}50</Text>
            </View>
          </View>
        </View>
        {/* Last Seen Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Last Seen</Text>
          <View style={styles.lastSeenRow}><MaterialIcons name="location-pin" size={20} color="#ef4444" /><View><Text style={styles.lastSeenLoc}>{item.lastSeen.location}</Text><Text style={styles.lastSeenDetails}>{item.lastSeen.details}</Text></View></View>
          <View style={styles.lastSeenRow}><MaterialIcons name="calendar-today" size={18} color="#38bdf8" /><Text style={styles.lastSeenDate}>{item.lastSeen.date}</Text></View>
          <Text style={styles.lastSeenTime}>{item.lastSeen.time}</Text>
          <Image source={item.lastSeen.map} style={styles.mapImage} resizeMode="cover" />
        </View>
        {/* Contact Owner Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Contact Owner</Text>
          <View style={styles.ownerRow}>
            <Image source={item.owner.avatar} style={styles.ownerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName}>{item.owner.name}</Text>
              <Text style={styles.ownerSince}>Member since {item.owner.memberSince}</Text>
            </View>
            <View style={styles.ownerRating}><MaterialIcons name="star" size={16} color="#fbbf24" /><Text style={styles.ownerRatingText}>{item.owner.rating}</Text></View>
          </View>
          <View style={styles.ownerActions}>
            <TouchableOpacity style={styles.messageBtn}><MaterialIcons name="message" size={18} color="#38bdf8" /><Text style={styles.messageBtnText}>Message</Text></TouchableOpacity>
            <TouchableOpacity style={styles.callBtn}><MaterialIcons name="call" size={18} color="#22c55e" /><Text style={styles.callBtnText}>Call</Text></TouchableOpacity>
          </View>
        </View>
        {/* Similar Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Similar Items Found</Text>
          {item.similar.map((sim, idx) => (
            <TouchableOpacity key={idx} style={styles.similarRow}>
              <Image source={sim.image} style={styles.similarImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.similarTitle}>{sim.title}</Text>
                <Text style={styles.similarLoc}>{sim.location}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#bbb" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
