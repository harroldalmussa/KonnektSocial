// screens/main/HomeScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView, // Make sure ScrollView is imported
  useColorScheme,
  SafeAreaView,
  Platform,
  Alert,
  Dimensions, // Import Dimensions to get screen height if needed for testing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// const screenHeight = Dimensions.get('window').height; // For testing, can be used for minHeight

export default function HomeScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  // Use a consistent background for the entire scrollable area if desired, or let the SAFV handle it.
  const headerBgColor = colorScheme === 'dark' ? '#2d3748' : 'white'; // Made headerBg white for consistency with overall white screen
  const sectionBgColor = colorScheme === 'dark' ? '#4a5568' : 'rgba(255, 255, 255, 0.7)';
  const hashtagBgColor = colorScheme === 'dark' ? '#6b7280' : '#e2e8f0';
  const hashtagTextColor = colorScheme === 'dark' ? '#f7fafc' : '#374151';
  const activeFilterBgColor = '#5b4285';
  const activeFilterTextColor = '#f7fafc';

  const [selectedFilter, setSelectedFilter] = useState('Top picks');

  const trendingTopics = [
    { id: '1', name: 'Summer' },
    { id: '2', name: 'Productivity' },
    { id: '3', name: 'FYP' },
    { id: '4', name: 'Funny' },
    { id: '5', name: 'Memes' },
    { id: '6', name: 'Coding' },
    { id: '7', name: 'AI' },
    { id: '8', name: 'Travel' },
    { id: '9', name: 'Food' },
    { id: '10', name: 'Health' },
    { id: '11', name: 'Fitness' },
    { id: '12', name: 'Books' },
    { id: '13', name: 'Movies' },
    { id: '14', name: 'Music' },
    { id: '15', name: 'Art' },
  ];

  const handleHamburgerPress = () => {
    navigation.openDrawer();
  };

  const handleHashtagPress = (topic) => {
    Alert.alert('Hashtag Clicked', `You clicked on #${topic.name}! Content for #${topic.name} would load here.`);
  };

  const handleFilterPress = (filter) => {
    setSelectedFilter(filter);
    Alert.alert('Filter Selected', `Viewing content for: ${filter}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'white' }]}>
      {/* Wrap everything you want to scroll inside this single ScrollView */}
      <ScrollView
        style={[styles.fullPageScrollView, { backgroundColor: headerBgColor }]} // Apply background to the scroll view
        showsVerticalScrollIndicator={false} // Hide the scroll indicator
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHamburgerPress} style={styles.headerButton}>
            <Ionicons name="menu" size={30} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Explore</Text>
          <TouchableOpacity onPress={() => Alert.alert('Search', 'Search button pressed!')} style={styles.headerButton}>
            <Ionicons name="search" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Filter Bar (Horizontal ScrollView) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {['Top picks', 'Writing', 'Research', 'Productivity', 'Design', 'Marketing', 'Finance', 'Education'].map((filter, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterButton,
                { backgroundColor: selectedFilter === filter ? activeFilterBgColor : sectionBgColor },
              ]}
              onPress={() => handleFilterPress(filter)}
            >
              <Text style={[styles.filterButtonText, { color: selectedFilter === filter ? activeFilterTextColor : mutedTextColor }]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Content Area (this no longer needs to be a ScrollView itself) */}
        <View style={styles.mainContentArea}>
          {/* Trending Topics Section */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>Trending topics</Text>
          <Text style={[styles.sectionSubtitle, { color: mutedTextColor }]}>Most popular topics by our community</Text>

          <View style={styles.trendingTopicsContainer}>
            {trendingTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.hashtagButton, { backgroundColor: hashtagBgColor }]}
                onPress={() => handleHashtagPress(topic)}
              >
                <Text style={[styles.hashtagText, { color: hashtagTextColor }]}>#{topic.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Placeholder for content feed - increased content for testing scroll */}
          <View style={styles.placeholderContent}>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Content feed will appear here based on selections...</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>This area will display posts, moments (videos/photos), or collections.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>-- More content to make the page scroll --</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>-- Even more content for testing --</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>-- Final bit of test content --</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Curabitur sodales ligula in libero. Sed dignissim lacinia nunc.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor.</Text>
            <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Aliquam erat volutpat. Nam dui ligula, fringilla a, euismod sodales, sollicitudin vel, wisi.</Text>
            {/* You can optionally set a minHeight here if you want to ensure it scrolls */}
            {/* <View style={{height: screenHeight * 0.5}} /> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white', 
  },
  fullPageScrollView: {
    flex: 1, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    overflow: 'hidden', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 50, 
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterBar: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 38,
    minWidth: 90,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  mainContentArea: { 
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20, 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  trendingTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  hashtagButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderContent: {
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200, // TO KEEP FOR NOW: also add more actual content for testing
  },
});