// screens/main/ArchivedScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  useColorScheme,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock items for later --- when app is actually released.. 
const mockArchivedItems = [
  { id: 'a1', type: 'moment', title: 'Old Project Demo', preview: 'https://via.placeholder.com/150/FF6347/000000?text=ArchivedVid', date: '2023-01-15' },
  { id: 'a2', type: 'post', title: 'My 2022 Reflections', preview: 'https://via.placeholder.com/150/4682B4/000000?text=ArchivedPost', date: '2022-12-31' },
  { id: 'a3', type: 'moment', title: 'Birthday Bash 2021', preview: 'https://via.placeholder.com/150/DA70D6/000000?text=ArchivedBday', date: '2021-07-22' },
  { id: 'a4', type: 'post', title: 'Random Thoughts on Life', preview: 'https://via.placeholder.com/150/32CD32/000000?text=ArchivedText', date: '2023-03-10' },
  { id: 'a5', type: 'moment', title: 'Early Morning Run', preview: 'https://via.placeholder.com/150/FFD700/000000?text=ArchivedRun', date: '2024-01-05' },
];

const ArchivedItem = ({ item, colorScheme }) => {
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const itemBgColor = colorScheme === 'dark' ? '#2d3748' : '#ffffff';

  const getIcon = (type) => {
    switch (type) {
      case 'post': return 'document-text-outline';
      case 'moment': return 'videocam-outline';
      default: return 'archive-outline';
    }
  };

  const handleUnarchive = () => {
    Alert.alert("Unarchive Item", `Are you sure you want to unarchive "${item.title}"?`);
  };

  const handleDelete = () => {
    Alert.alert("Delete Item", `Are you sure you want to permanently delete "${item.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        Alert.alert("Deleted", `${item.title} deleted.`);
      }}
    ]);
  };

  return (
    <View style={[styles.archivedItemCard, { backgroundColor: itemBgColor }]}>
      <Image source={{ uri: item.preview }} style={styles.archivedItemImage} />
      <View style={styles.archivedItemContent}>
        <View style={styles.archivedItemHeader}>
          <Ionicons name={getIcon(item.type)} size={20} color={mutedTextColor} style={{ marginRight: 8 }} />
          <Text style={[styles.archivedItemTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
        </View>
        <Text style={[styles.archivedItemDate, { color: mutedTextColor }]}>Archived on {item.date}</Text>
        <View style={styles.archivedItemActions}>
          <TouchableOpacity onPress={handleUnarchive} style={styles.actionButton}>
            <Ionicons name="archive-outline" size={20} color="#5b4285" />
            <Text style={[styles.actionButtonText, { color: '#5b4285' }]}>Unarchive</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="red" />
            <Text style={[styles.actionButtonText, { color: 'red' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function ArchivedScreen() {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const headerBgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const headerTextColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: headerBgColor }]}>
        <Text style={[styles.headerTitle, { color: headerTextColor }]}>Archived</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={24} color={headerTextColor} />
        </TouchableOpacity>
      </View>

      {mockArchivedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={80} color={colorScheme === 'dark' ? '#cbd5e0' : '#a0aec0'} />
          <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#cbd5e0' : '#4b5563' }]}>
            Nothing is archived yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={mockArchivedItems}
          renderItem={({ item }) => <ArchivedItem item={item} colorScheme={colorScheme} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.archivedListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcon: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  archivedListContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20, 
  },
  archivedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  archivedItemImage: {
    width: 90,
    height: 90,
    backgroundColor: '#ccc',
    marginRight: 15,
  },
  archivedItemContent: {
    flex: 1,
    paddingVertical: 10,
  },
  archivedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  archivedItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  archivedItemDate: {
    fontSize: 12,
    marginBottom: 10,
  },
  archivedItemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    fontSize: 12,
    marginLeft: 5,
  },
});