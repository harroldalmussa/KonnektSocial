// screens/main/SavedScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 

const mockSavedItems = [
  { id: '1', type: 'post', title: 'My morning routine', preview: 'https://via.placeholder.com/150/FFC0CB/000000?text=Post1', tags: ['#wellness', '#routine'] },
  { id: '2', type: 'moment', title: 'Travel vlog: Paris', preview: 'https://via.placeholder.com/150/ADD8E6/000000?text=Moment1', tags: ['#travel', '#paris'] },
  { id: '3', type: 'link', title: 'Best AI tools 2025', preview: 'https://via.placeholder.com/150/90EE90/000000?text=AI+Tools', tags: ['#AI', '#tech'] },
  { id: '4', type: 'post', title: 'Delicious pasta recipe', preview: 'https://via.placeholder.com/150/FFD700/000000?text=Recipe1', tags: ['#food', '#cooking'] },
  { id: '5', type: 'moment', title: 'Hiking adventure', preview: 'https://via.placeholder.com/150/DDA0DD/000000?text=Moment2', tags: ['#hiking', '#nature'] },
  { id: '6', type: 'link', title: 'React Native performance tips', preview: 'https://via.placeholder.com/150/87CEEB/000000?text=RN+Tips', tags: ['#coding', '#reactnative'] },
  { id: '7', type: 'post', title: 'Book review: Sci-Fi classic', preview: 'https://via.placeholder.com/150/A020F0/000000?text=BookRev', tags: ['#books', '#scifi'] },
  { id: '8', type: 'moment', title: 'Morning yoga flow', preview: 'https://via.placeholder.com/150/FF69B4/000000?text=Yoga', tags: ['#yoga', '#fitness'] },
];

const SavedItem = ({ item, colorScheme }) => {
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const itemBgColor = colorScheme === 'dark' ? '#2d3748' : '#ffffff';
  const tagBgColor = colorScheme === 'dark' ? '#4a5568' : '#e2e8f0';
  const tagTextColor = colorScheme === 'dark' ? '#f7fafc' : '#374151';

  const getIcon = (type) => {
    switch (type) {
      case 'post': return 'newspaper-outline';
      case 'moment': return 'videocam-outline';
      case 'link': return 'link-outline';
      default: return 'bookmark-outline';
    }
  };

  return (
    <TouchableOpacity style={[styles.savedItemCard, { backgroundColor: itemBgColor }]}>
      <Image source={{ uri: item.preview }} style={styles.savedItemImage} />
      <View style={styles.savedItemContent}>
        <View style={styles.savedItemHeader}>
          <Ionicons name={getIcon(item.type)} size={18} color={mutedTextColor} style={{ marginRight: 5 }} />
          <Text style={[styles.savedItemTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
        </View>
        <View style={styles.savedItemTags}>
          {item.tags.map((tag, index) => (
            <View key={index} style={[styles.tagBubble, { backgroundColor: tagBgColor }]}>
              <Text style={[styles.tagText, { color: tagTextColor }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function SavedScreen() {
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const headerBgColor = colorScheme === 'dark' ? '#1a202c' : '#ffffff';
  const headerTextColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: headerBgColor }]}>
        <Text style={[styles.headerTitle, { color: headerTextColor }]}>Saved Items</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="search" size={24} color={headerTextColor} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockSavedItems}
        renderItem={({ item }) => <SavedItem item={item} colorScheme={colorScheme} />}
        keyExtractor={(item) => item.id}
        numColumns={2} 
        contentContainerStyle={styles.savedListContent}
        showsVerticalScrollIndicator={false}
      />
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
  savedListContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20, 
  },
  savedItemCard: {
    flex: 1,
    margin: 8,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  savedItemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#ccc', 
  },
  savedItemContent: {
    padding: 10,
  },
  savedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  savedItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  savedItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tagBubble: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 10,
  },
});