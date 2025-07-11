import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';

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

const STATS = [
  { label: 'Total Posts', value: 12, color: '#e0edff', textColor: COLORS.primary },
  { label: 'Matched', value: 3, color: '#e7fbe7', textColor: COLORS.matchedText },
  { label: 'Resolved', value: 7, color: '#fbe7e7', textColor: COLORS.accent },
];

const FILTERS = [
  { label: 'All Items', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Matched', value: 'matched' },
  { label: 'Resolved', value: 'resolved' },
];

const MOCK_ITEMS = [
  {
    id: '1',
    icon: <Feather name="smartphone" size={22} color={COLORS.primary} />, // iPhone
    title: 'iPhone 14 Pro',
    status: 'active',
    statusLabel: 'Active',
    statusColor: COLORS.active,
    statusTextColor: COLORS.activeText,
    type: 'Lost',
    date: '2 days ago',
    desc: 'Lost at Central Station, Sydney. Black case with blue pop socket.',
    views: 24,
    saves: 3,
    match: false,
    returned: false,
  },
  {
    id: '2',
    icon: <Feather name="key" size={22} color={COLORS.matchedText} />, // House Keys
    title: 'House Keys',
    status: 'matched',
    statusLabel: 'Matched',
    statusColor: COLORS.matched,
    statusTextColor: COLORS.matchedText,
    type: 'Found',
    date: '5 days ago',
    desc: 'Found near Bondi Beach. Set of 4 keys with koala keychain.',
    views: 18,
    saves: 0,
    match: true,
    returned: false,
  },
  {
    id: '3',
    icon: <Feather name="credit-card" size={22} color={COLORS.resolvedText} />, // Brown Wallet
    title: 'Brown Wallet',
    status: 'resolved',
    statusLabel: 'Resolved',
    statusColor: COLORS.resolved,
    statusTextColor: COLORS.resolvedText,
    type: 'Lost',
    date: '1 week ago',
    desc: 'Lost at Queen Victoria Building. Leather wallet with cards.',
    views: 31,
    saves: 0,
    match: false,
    returned: true,
  },
  {
    id: '4',
    icon: <Feather name="headphones" size={22} color={COLORS.primary} />, // AirPods Pro
    title: 'AirPods Pro',
    status: 'active',
    statusLabel: 'Active',
    statusColor: COLORS.active,
    statusTextColor: COLORS.activeText,
    type: 'Found',
    date: '1 day ago',
    desc: 'Found at Circular Quay. White AirPods in case.',
    views: 12,
    saves: 1,
    match: false,
    returned: false,
  },
];

export default function ActivityScreen() {
  const [filter, setFilter] = useState('all');
  const filteredItems =
    filter === 'all'
      ? MOCK_ITEMS
      : MOCK_ITEMS.filter(item => item.status === filter);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Feather name="arrow-left" size={22} color={COLORS.text} />
        <Text style={styles.headerTitle}>My Activity</Text>
        <Feather name="more-vertical" size={22} color={COLORS.text} />
      </View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {STATS.map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.color }] }>
            <Text style={[styles.statValue, { color: stat.textColor }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterPill, filter === f.value && styles.filterPillActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterPillText, filter === f.value && styles.filterPillTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Activity List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemIcon}>{item.icon}</View>
            <View style={{ flex: 1 }}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor }] }>
                  <Text style={[styles.statusBadgeText, { color: item.statusTextColor }]}>{item.statusLabel}</Text>
                </View>
              </View>
              <Text style={styles.itemMeta}>{item.type} • {item.date}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
              <View style={styles.itemFooterRow}>
                <View style={styles.itemFooterLeft}>
                  <Feather name="eye" size={15} color={COLORS.muted} />
                  <Text style={styles.itemFooterText}>{item.views} views</Text>
                  {item.match && (
                    <>
                      <Feather name="check-circle" size={15} color={COLORS.matchedText} style={{ marginLeft: 8 }} />
                      <Text style={[styles.itemFooterText, { color: COLORS.matchedText }]}>Match found</Text>
                    </>
                  )}
                  {item.returned && (
                    <>
                      <Feather name="check" size={15} color={COLORS.resolvedText} style={{ marginLeft: 8 }} />
                      <Text style={[styles.itemFooterText, { color: COLORS.resolvedText }]}>Returned</Text>
                    </>
                  )}
                </View>
                <View style={styles.itemFooterRight}>
                  <Feather name="edit-2" size={16} color={COLORS.muted} style={{ marginRight: 12 }} />
                  <Feather name="trash-2" size={16} color={COLORS.muted} />
                </View>
              </View>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  headerTitle: { fontWeight: 'bold', fontSize: 20, color: COLORS.text },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  statValue: { fontWeight: 'bold', fontSize: 20 },
  statLabel: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 10,
  },
  filterPill: {
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
  },
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
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: { fontWeight: 'bold', fontSize: 15, color: COLORS.text, flex: 1 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  itemMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  itemDesc: { color: COLORS.text, fontSize: 13, marginTop: 2 },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  itemFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemFooterText: {
    color: COLORS.muted,
    fontSize: 12,
    marginLeft: 4,
  },
  itemFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 