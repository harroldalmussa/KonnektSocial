// screens/main/HomeScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Platform,
  Alert,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const YOUR_LOCAL_IP_ADDRESS = '192.168.1.174';

export default function HomeScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const headerBgColor = colorScheme === 'dark' ? '#2d3748' : 'white';
  const sectionBgColor = colorScheme === 'dark' ? '#4a5568' : 'rgba(255, 255, 255, 0.7)';
  const hashtagBgColor = colorScheme === 'dark' ? '#6b7280' : '#e2e8f0';
  const hashtagTextColor = colorScheme === 'dark' ? '#f7fafc' : '#374151';
  const activeFilterBgColor = '#5b4285';
  const activeFilterTextColor = '#f7fafc';
  const searchInputBg = colorScheme === 'dark' ? '#374151' : '#f0f0f0';
  const activeSearchInputGlowColor = '#c6a4fa';
  const userCardBgColor = colorScheme === 'dark' ? '#2d3748' : 'white';


  const [selectedFilter, setSelectedFilter] = useState('Top picks');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const trendingTopics = [
    { id: '1', name: 'Summer' },
    { id: '2', name: 'Productivity' },
    { id: '3', name: 'FYP' },
    { id: '4', name: 'Funny' },
    { id: '5', name: 'Memes' },
    { id: '6', name: 'Coding' },
    { id: '7', name: 'AI' },
    { id: '8', 'name': 'Travel' },
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
    setSearchResults([]);
    setSearchQuery('');
    Alert.alert('Filter Selected', `Viewing content for: ${filter}`);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      Alert.alert('Search', 'Please enter a username or search query.');
      return;
    }

    setLoadingSearch(true);
    setSearchResults([]);

    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      if (!storedToken) {
        Alert.alert('Error', 'Authentication required. Please log in.');
        navigation.replace('Auth');
        return;
      }

      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const currentUserData = await AsyncStorage.getItem('user_data');
        const currentUserId = currentUserData ? JSON.parse(currentUserData).uid : null;
        const filteredResults = data.users.filter(user => user.id !== currentUserId);
        setSearchResults(filteredResults);
      } else {
        Alert.alert('Search Error', data.error || 'Failed to search users.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('User Search API Error:', error);
      Alert.alert('Error', `Network or API Error searching users: ${error.message || 'Unknown error'}. Ensure backend is running and IP is correct.`);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleUserCardPress = async (user) => {
    Alert.alert(
      "User Selected",
      `What would you like to do with ${user.first_name || user.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Chat",
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem('access_token');
              const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/chats/create-or-get`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${storedToken}`,
                },
                body: JSON.stringify({ targetUserId: user.id }),
              });

              const data = await response.json();

              if (response.ok) {
                navigation.navigate('ChatWindow', {
                  chatId: data.chatId,
                  user: user.first_name || user.username,
                  email: user.email,
                  img: user.profile_picture_url || 'https://via.placeholder.com/150',
                });
              } else {
                Alert.alert('Chat Error', data.detail || 'Failed to create or retrieve chat.');
              }
            } catch (error) {
              console.error('Create Chat API Error:', error);
              Alert.alert('Error', `Network or API Error creating chat: ${error.message || 'Unknown error'}.`);
            }
          }
        },
        {
          text: "View Profile",
          onPress: () => {
            navigation.navigate('UserProfile', { userId: user.id });
          }
        }
      ],
      { cancelable: true }
    );
  };


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'white' }]}>
      <ScrollView
        style={[styles.fullPageScrollView, { backgroundColor: headerBgColor }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHamburgerPress} style={styles.headerButton}>
            <Ionicons name="menu" size={30} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Explore</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={[
          styles.searchContainer,
          { backgroundColor: searchInputBg },
          isSearchFocused && styles.glowingSearchInput,
          loadingSearch && { opacity: 0.7 }
        ]}>
          <Ionicons name="search" size={20} color={mutedTextColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search for users or content..."
            placeholderTextColor={mutedTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {loadingSearch && <ActivityIndicator size="small" color={mutedTextColor} style={styles.searchLoadingIndicator} />}
        </View>

        {searchResults.length > 0 && searchQuery.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Users Found</Text>
            {searchResults.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[styles.userCardItem, { backgroundColor: userCardBgColor, borderColor: activeSearchInputGlowColor }]}
                onPress={() => handleUserCardPress(user)}
              >
                <Image
                  source={{ uri: user.profile_picture_url || 'https://via.placeholder.com/150' }}
                  style={styles.userCardAvatar}
                />
                <View style={styles.userCardInfo}>
                  <Text style={[styles.userCardName, { color: textColor }]}>{user.first_name}</Text>
                  <Text style={[styles.userCardUsername, { color: mutedTextColor }]}>| @{user.username}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setSearchResults([])} style={styles.clearResultsButton}>
              <Text style={styles.clearResultsButtonText}>Clear Search Results</Text>
            </TouchableOpacity>
          </View>
        )}
        {searchQuery.length >= 2 && searchResults.length === 0 && !loadingSearch && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: mutedTextColor }}>No users found matching "{searchQuery}".</Text>
        )}

        {searchResults.length === 0 && searchQuery.length < 2 && (
          <>
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

            <View style={styles.mainContentArea}>
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
                <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Curabitur sodales ligula in libero. Sed dignissim lacinia nunc.</Text>
                <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor.</Text>
                <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor.</Text>
                <Text style={{ color: mutedTextColor, marginBottom: 5 }}>Aliquam erat volutpat. Nam dui ligula, fringilla a, euismod sodales, sollicitudin vel, wisi.</Text>
              </View>
            </View>
          </>
        )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  glowingSearchInput: {
    borderColor: '#c6a4fa',
    shadowColor: '#c6a4fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoadingIndicator: {
    marginLeft: 10,
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
    minHeight: 200,
  },
  searchResultsContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  userCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  userCardUsername: {
    fontSize: 14,
  },
  clearResultsButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#5b4285',
    borderRadius: 5,
    alignItems: 'center',
  },
  clearResultsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});