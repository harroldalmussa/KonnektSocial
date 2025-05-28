// screens/main/NewChatScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const YOUR_LOCAL_IP_ADDRESS = '****';

export default function NewChatScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);

  const headerBgColor = colorScheme === 'dark' ? '#1a202c' : 'white';
  const textColor = colorScheme === 'dark' ? '#f7fafc' : '#1f2937';
  const mutedTextColor = colorScheme === 'dark' ? '#cbd5e0' : '#4b5563';
  const inputBgColor = colorScheme === 'dark' ? '#4a5568' : 'white';
  const inputBorderColor = colorScheme === 'dark' ? '#2d3748' : '#e0e0e0';
  const itemBgColor = colorScheme === 'dark' ? '#2d3748' : 'white';
  const itemBorderColor = colorScheme === 'dark' ? '#1a202c' : '#e0e0e0';

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user_data');
        if (storedUserData) {
          setCurrentUserData(JSON.parse(storedUserData));
        }
      } catch (error) {
        console.error('Failed to load current user data:', error);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoadingSearch(true);
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      if (!storedToken) {
        Alert.alert('Error', 'Not authenticated. Please log in.');
        navigation.replace('Auth');
        return;
      }
      const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const filteredResults = data.users.filter(user => user.id !== currentUserData?.uid);
        setSearchResults(filteredResults);
      } else {
        Alert.alert('Search Error', data.error || 'Failed to search users.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search API Error:', error);
      Alert.alert('Error', `Network error during search: ${error.message || 'Unknown error'}. Ensure backend is running and IP is correct.`);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleUserSelect = async (selectedUser) => {
    Alert.alert(
      "Start Chat or Add Contact", 
      `What would you like to do with ${selectedUser.first_name}?`, 
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
                body: JSON.stringify({ targetUserId: selectedUser.id }),
              });

              const data = await response.json();

              if (response.ok) {
                navigation.replace('ChatWindow', { 
                  chatId: data.chatId,
                  user: selectedUser.first_name,
                  email: selectedUser.email,
                  img: selectedUser.profile_picture_url || 'https://via.placeholder.com/150',
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
          text: "Add Contact", 
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem('access_token');
              const response = await fetch(`http://${YOUR_LOCAL_IP_ADDRESS}:3000/contacts`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${storedToken}`,
                },
                body: JSON.stringify({ contact_user_id: selectedUser.id }), 
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', `${selectedUser.first_name} has been added to your contacts.`);
              } else {
                Alert.alert('Contact Error', data.error || data.detail || 'Failed to add contact.');
              }
            } catch (error) {
              console.error('Add Contact API Error:', error);
              Alert.alert('Error', `Network or API Error adding contact: ${error.message || 'Unknown error'}.`);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#2d3748' : 'rgba(255, 255, 255, 0.9)' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>New Message</Text>
          <View style={{ width: 24 }} /> 
        </View>
        <View style={[styles.searchInputContainer, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}>
          <Ionicons name="search" size={20} color={mutedTextColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by name or email"
            placeholderTextColor={mutedTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loadingSearch && <ActivityIndicator size="small" color={mutedTextColor} />}
        </View>
        {searchQuery.length >= 2 && searchResults.length === 0 && !loadingSearch && (
          <Text style={[styles.noResultsText, { color: mutedTextColor }]}>No users found.</Text>
        )}

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userListItem, { backgroundColor: itemBgColor, borderColor: itemBorderColor }]}
              onPress={() => handleUserSelect(item)}
            >
              <Image
                source={{ uri: item.profile_picture_url || 'https://via.placeholder.com/150' }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: textColor }]}>{item.first_name}</Text>
                <Text style={[styles.userEmail, { color: mutedTextColor }]}>{item.email}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.resultsListContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  resultsListContent: {
    paddingBottom: 20,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
});